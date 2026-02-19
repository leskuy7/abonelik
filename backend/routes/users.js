const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const logger = require('../lib/logger');
const { z } = require('zod');
const { validate } = require('../lib/validation');

// Zod schemas for user routes
const updateProfileSchema = z.object({
    name: z.string().min(1, 'İsim gereklidir').max(100).trim(),
    currency: z.enum(['TRY', 'USD', 'EUR'], { errorMap: () => ({ message: 'Geçerli bir para birimi giriniz' }) }),
    monthlyBudget: z.union([z.string(), z.number(), z.null()])
        .optional()
        .nullable()
        .transform((val) => {
            if (val === null || val === undefined || val === '') return null;
            return parseFloat(String(val));
        }),
    language: z.enum(['tr', 'en']).optional(),
    theme: z.enum(['dark', 'light']).optional(),
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Mevcut şifre gereklidir'),
    newPassword: z.string().min(6, 'Yeni şifre en az 6 karakter olmalıdır').max(100),
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                currency: true,
                monthlyBudget: true,
                onboardingComplete: true,
                isAdmin: true,
                language: true,
                theme: true
            }
        });
        res.json(user);
    } catch (err) {
        logger.error({ err, userId: req.user.userId }, 'Failed to fetch profile');
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Update profile info
router.put('/profile', auth, validate(updateProfileSchema), async (req, res) => {
    try {
        const { name, currency, monthlyBudget, language, theme } = req.body;

        const user = await prisma.user.update({
            where: { id: req.user.userId },
            data: {
                name,
                currency,
                monthlyBudget,
                language,
                theme
            },
            select: {
                id: true,
                name: true,
                email: true,
                currency: true,
                monthlyBudget: true,
                language: true,
                theme: true
            }
        });

        logger.info({ userId: req.user.userId }, 'Profile updated');
        res.json(user);
    } catch (err) {
        logger.error({ err, userId: req.user.userId }, 'Failed to update profile');
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Change Password
router.put('/change-password', auth, validate(changePasswordSchema), async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: req.user.userId }
        });

        if (!user.password) {
            return res.status(400).json({ message: 'Google ile giriş yapan kullanıcılar şifre değiştiremez.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mevcut şifre yanlış' });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({
            where: { id: req.user.userId },
            data: { password: hashedPassword }
        });

        logger.info({ userId: req.user.userId }, 'Password changed');
        res.json({ message: 'Şifre başarıyla güncellendi' });
    } catch (err) {
        logger.error({ err, userId: req.user.userId }, 'Failed to change password');
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Delete Account
router.delete('/', auth, async (req, res) => {
    try {
        await prisma.subscription.deleteMany({
            where: { userId: req.user.userId }
        });

        await prisma.user.delete({
            where: { id: req.user.userId }
        });

        logger.info({ userId: req.user.userId }, 'Account deleted');
        res.json({ message: 'Hesap kalıcı olarak silindi' });
    } catch (err) {
        logger.error({ err, userId: req.user.userId }, 'Failed to delete account');
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

module.exports = router;
