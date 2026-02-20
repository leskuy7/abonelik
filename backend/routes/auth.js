const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const logger = require('../lib/logger');
const { sendVerificationEmail, sendWelcomeEmail } = require('../services/email');
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, resendVerificationSchema, validate } = require('../lib/validation');

const isProd = process.env.NODE_ENV === 'production';

const getAuthCookieOptions = (rememberMe = false) => ({
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    ...(rememberMe ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}),
    path: '/',
});

const getUserPayload = (user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    currency: user.currency,
    monthlyBudget: user.monthlyBudget,
    language: user.language,
    theme: user.theme,
    onboardingComplete: user.onboardingComplete,
    isAdmin: user.isAdmin,
});

// In-memory OAuth state store with TTL (10 minutes)
const oauthStateStore = new Map();
const OAUTH_STATE_TTL = 10 * 60 * 1000; // 10 minutes

// Cleanup expired states every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [state, timestamp] of oauthStateStore) {
        if (now - timestamp > OAUTH_STATE_TTL) {
            oauthStateStore.delete(state);
        }
    }
}, 5 * 60 * 1000);

// Generate verification token
const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Register
router.post('/register', validate(registerSchema), async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Bu e-posta adresi zaten kayıtlı' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(12); // Güçlendirilmiş salt
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate verification token
        const verificationToken = generateVerificationToken();

        // Create user (token expires in 24 hours)
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || null,
                verificationToken,
                verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                isEmailVerified: false,
            },
        });

        // Send verification email
        await sendVerificationEmail(email, name, verificationToken);

        res.status(201).json({
            message: 'Kayıt başarılı! Lütfen e-posta adresinizi doğrulayın.',
            requiresVerification: true
        });
    } catch (error) {
        logger.error({ err: error }, 'Register error');
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Verify Email
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token || typeof token !== 'string' || token.length !== 64) {
            return res.status(400).json({ message: 'Geçersiz doğrulama kodu' });
        }

        const user = await prisma.user.findUnique({
            where: { verificationToken: token },
        });

        if (!user) {
            return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş doğrulama kodu' });
        }

        // Check token expiry
        if (user.verificationTokenExpiresAt && user.verificationTokenExpiresAt < new Date()) {
            return res.status(400).json({ message: 'Doğrulama kodunun süresi dolmuş. Lütfen yeni kod talep edin.' });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ message: 'Bu e-posta zaten doğrulanmış' });
        }

        // Update user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                isEmailVerified: true,
                verificationToken: null,
                verificationTokenExpiresAt: null,
            },
        });

        // Send welcome email
        await sendWelcomeEmail(user.email, user.name);

        res.json({ message: 'E-posta başarıyla doğrulandı! Şimdi giriş yapabilirsiniz.' });
    } catch (error) {
        logger.error({ err: error }, 'Verify email error');
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Resend verification email
router.post('/resend-verification', validate(resendVerificationSchema), async (req, res) => {
    try {
        const { email } = req.body;

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Güvenlik: Kullanıcı olmasa bile aynı mesajı dön
            return res.json({ message: 'E-posta adresiniz kayıtlıysa doğrulama linki gönderildi' });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ message: 'Bu e-posta zaten doğrulanmış' });
        }

        // Generate new token
        const verificationToken = generateVerificationToken();

        await prisma.user.update({
            where: { id: user.id },
            data: {
                verificationToken,
                verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
        });

        // Send verification email
        await sendVerificationEmail(email, user.name, verificationToken);

        res.json({ message: 'Doğrulama e-postası tekrar gönderildi' });
    } catch (error) {
        logger.error({ err: error }, 'Resend verification error');
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Forgot Password
router.post('/forgot-password', validate(forgotPasswordSchema), async (req, res) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // Security: Don't reveal if user exists
            return res.json({ message: 'E-posta adresiniz kayıtlıysa şifre sıfırlama bağlantısı gönderildi.' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry
            }
        });

        // Send email
        await require('../services/email').sendPasswordResetEmail(email, resetToken);

        res.json({ message: 'E-posta adresiniz kayıtlıysa şifre sıfırlama bağlantısı gönderildi.' });
    } catch (error) {
        logger.error({ err: error }, 'Forgot password error');
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Reset Password
router.post('/reset-password', validate(resetPasswordSchema), async (req, res) => {
    try {
        const { token, password } = req.body;

        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: { gt: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş bağlantı' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        });

        res.json({ message: 'Şifreniz başarıyla değiştirildi. Giriş yapabilirsiniz.' });
    } catch (error) {
        logger.error({ err: error }, 'Reset password error');
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Login
router.post('/login', validate(loginSchema), async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        // Check user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Güvenlik: Genel mesaj
            return res.status(400).json({ message: 'E-posta veya şifre hatalı' });
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(403).json({
                message: 'Lütfen önce e-posta adresinizi doğrulayın',
                requiresVerification: true,
                email: user.email
            });
        }

        // Check password
        if (!user.password) {
            return res.status(400).json({ message: 'Bu hesap Google ile bağlı. Google ile giriş yapın.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'E-posta veya şifre hatalı' });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: rememberMe ? '30d' : '1d', algorithm: 'HS256' }
        );

        res.cookie('auth_token', token, getAuthCookieOptions(rememberMe));

        res.json({
            user: getUserPayload(user)
        });
    } catch (error) {
        logger.error({ err: error }, 'Login error');
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('auth_token', {
        ...getAuthCookieOptions(),
        maxAge: 0,
    });
    res.json({ message: 'Çıkış yapıldı' });
});

// Set token as cookie (for cross-domain OAuth flow)
router.post('/set-token', (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ message: 'Token gerekli' });
    }
    try {
        // Verify the token is valid before setting cookie
        jwt.verify(token, process.env.JWT_SECRET);
        res.cookie('auth_token', token, getAuthCookieOptions());
        res.json({ message: 'Token set' });
    } catch {
        return res.status(401).json({ message: 'Geçersiz token' });
    }
});

// Google OAuth - Get URL
router.get('/google', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`;

    logger.info({ hasClientId: !!clientId }, '[Google OAuth] GET /google');

    if (!clientId) {
        logger.error('[Google OAuth] GOOGLE_CLIENT_ID is not set!');
        return res.status(500).json({ message: 'Google OAuth yapılandırılmamış' });
    }

    const scope = encodeURIComponent('email profile');
    const state = crypto.randomBytes(16).toString('hex');

    // Store state with timestamp for CSRF validation
    oauthStateStore.set(state, Date.now());

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&state=${state}`;

    res.json({ url: googleAuthUrl });
});

// Google OAuth - Callback
router.get('/google/callback', async (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    try {
        const { code, error, state } = req.query;
        logger.info({ hasCode: !!code, hasState: !!state }, '[Google OAuth] Callback received');

        if (error || !code) {
            logger.error({ error }, '[Google OAuth] No code or error from Google');
            return res.redirect(`${frontendUrl}/login?error=google_failed`);
        }

        // Validate OAuth state (CSRF protection)
        if (!state || !oauthStateStore.has(state)) {
            logger.error({ storeSize: oauthStateStore.size }, '[Google OAuth] Invalid state');
            return res.redirect(`${frontendUrl}/login?error=invalid_state`);
        }
        const stateTimestamp = oauthStateStore.get(state);
        oauthStateStore.delete(state); // One-time use
        if (Date.now() - stateTimestamp > OAUTH_STATE_TTL) {
            logger.error('[Google OAuth] State expired');
            return res.redirect(`${frontendUrl}/login?error=state_expired`);
        }

        // Exchange code for tokens
        const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`;
        logger.info('[Google OAuth] Exchanging code for token...');

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        const tokenData = await tokenResponse.json();
        logger.info({ status: tokenResponse.status }, '[Google OAuth] Token response');

        if (!tokenData.access_token) {
            logger.error('[Google OAuth] Token exchange failed');
            return res.redirect(`${frontendUrl}/login?error=google_failed`);
        }

        // Get user info
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        const googleUser = await userResponse.json();
        logger.info('[Google OAuth] Google user info received');

        if (!googleUser.email) {
            logger.error('[Google OAuth] No email from Google user info');
            return res.redirect(`${frontendUrl}/login?error=google_failed`);
        }

        // Find or create user
        let user = await prisma.user.findUnique({
            where: { email: googleUser.email },
        });

        if (!user) {
            // Create new user
            logger.info('[Google OAuth] Creating new user');
            user = await prisma.user.create({
                data: {
                    email: googleUser.email,
                    name: googleUser.name || null,
                    googleId: googleUser.id,
                    isEmailVerified: true, // Google emails are verified
                },
            });
        } else if (!user.googleId) {
            // Link Google account to existing user
            logger.info('[Google OAuth] Linking Google to existing user');
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    googleId: googleUser.id,
                    isEmailVerified: true,
                },
            });
        } else {
            logger.info('[Google OAuth] Existing Google user login');
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '7d', algorithm: 'HS256' }
        );

        logger.info('[Google OAuth] Success! Redirecting to frontend');
        res.cookie('auth_token', token, getAuthCookieOptions());
        res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
        logger.error({ err: error }, '[Google OAuth] Callback error');
        res.redirect(`${frontendUrl}/login?error=google_failed`);
    }
});

module.exports = router;
