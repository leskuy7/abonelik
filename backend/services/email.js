const logger = require('../lib/logger');

// Send email using Resend REST API (HTTP) to bypass Render SMTP blocks
const sendEmailToResend = async (mailOptions) => {
    const apiKey = process.env.RESEND_API_KEY;

    // In development mode without API key, just log to console
    if (!apiKey || apiKey === 'your_resend_api_key_here') {
        logger.info({ to: mailOptions.to, subject: mailOptions.subject }, 'DEV MODE: Email (not sent)');
        return true;
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: process.env.EMAIL_USER || 'onboarding@resend.dev', // Must be an allowed domain in Resend
                to: mailOptions.to,
                subject: mailOptions.subject,
                html: mailOptions.html
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            logger.error({ err: errorData, to: mailOptions.to }, 'Resend API Error');
            return false;
        }

        const data = await response.json();
        logger.info({ to: mailOptions.to, id: data.id }, 'Email sent successfully via Resend');
        return true;
    } catch (error) {
        logger.error({ err: error, to: mailOptions.to }, 'Error calling Resend API');
        return false;
    }
};

const sendVerificationEmail = async (email, name, verificationToken) => {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #fff; padding: 40px; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background: #9333ea; padding: 12px 16px; border-radius: 12px; font-size: 24px;">💳</div>
                <h1 style="margin: 16px 0 0; font-size: 24px; color: #fff;">SubTrack</h1>
            </div>
            
            <p style="color: #94a3b8; font-size: 16px;">Merhaba ${name || 'Kullanıcı'},</p>
            <p style="color: #94a3b8; font-size: 16px;">SubTrack'e hoş geldiniz! Hesabınızı aktifleştirmek için aşağıdaki butona tıklayın:</p>
            
            <div style="text-align: center; margin: 32px 0;">
                <a href="${verificationUrl}" 
                   style="display: inline-block; background: #9333ea; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                    E-postamı Doğrula
                </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">Veya bu linki tarayıcınıza kopyalayın:</p>
            <p style="color: #9333ea; font-size: 14px; word-break: break-all;">${verificationUrl}</p>
            
            <hr style="border: none; border-top: 1px solid #334155; margin: 32px 0;">
            
            <p style="color: #64748b; font-size: 12px; text-align: center;">
                Bu e-postayı siz talep etmediyseniz, görmezden gelebilirsiniz.
            </p>
        </div>
    `;

    return await sendEmailToResend({ to: email, subject: 'SubTrack - E-posta Adresinizi Doğrulayın', html });
};

const sendWelcomeEmail = async (email, name) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #fff; padding: 40px; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background: #9333ea; padding: 12px 16px; border-radius: 12px; font-size: 24px;">💳</div>
                <h1 style="margin: 16px 0 0; font-size: 24px; color: #fff;">SubTrack</h1>
            </div>
            
            <p style="color: #94a3b8; font-size: 16px;">Merhaba ${name || 'Kullanıcı'},</p>
            <p style="color: #94a3b8; font-size: 16px;">E-posta adresiniz doğrulandı! Artık SubTrack'i kullanmaya başlayabilirsiniz.</p>
            
            <div style="background: #1e293b; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <h3 style="color: #fff; margin: 0 0 12px; font-size: 16px;">🚀 Hızlı Başlangıç</h3>
                <ul style="color: #94a3b8; margin: 0; padding-left: 20px; font-size: 14px;">
                    <li>İlk aboneliğinizi ekleyin</li>
                    <li>Ödeme hatırlatmalarını alın</li>
                    <li>Harcamalarınızı takip edin</li>
                </ul>
            </div>
            
            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                   style="display: inline-block; background: #9333ea; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                    Giriş Yap
                </a>
            </div>
        </div>
    `;

    return await sendEmailToResend({ to: email, subject: 'SubTrack\'e Hoş Geldiniz! 🎉', html });
};

const sendPasswordResetEmail = async (email, token) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #fff; padding: 40px; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background: #9333ea; padding: 12px 16px; border-radius: 12px; font-size: 24px;">💳</div>
                <h1 style="margin: 16px 0 0; font-size: 24px; color: #fff;">SubTrack</h1>
            </div>
            
            <p style="color: #94a3b8; font-size: 16px;">Şifrenizi sıfırlamak için bir talep aldık.</p>
            <p style="color: #94a3b8; font-size: 16px;">Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz:</p>
            
            <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" 
                   style="display: inline-block; background: #9333ea; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                    Şifremi Sıfırla
                </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">Veya bu linki tarayıcınıza kopyalayın:</p>
            <p style="color: #9333ea; font-size: 14px; word-break: break-all;">${resetUrl}</p>
            
            <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 30px;">
                Bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
            </p>
        </div>
    `;

    return await sendEmailToResend({ to: email, subject: 'SubTrack - Şifre Sıfırlama Talebi', html });
};

module.exports = { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail };
