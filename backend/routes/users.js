const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

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
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update profile info
router.put(
    '/profile',
    [
        auth,
        [
            body('name', 'İsim gereklidir').not().isEmpty(),
            body('currency', 'Geçerli bir para birimi giriniz').isIn(['TRY', 'USD', 'EUR']),
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, currency, monthlyBudget } = req.body;

        try {
            const user = await prisma.user.update({
                where: { id: req.user.userId },
                data: {
                    name,
                    currency,
                    monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : null,
                    language: req.body.language,
                    theme: req.body.theme
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

            res.json(user);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// Change Password
router.put(
    '/change-password',
    [
        auth,
        [
            body('currentPassword', 'Mevcut şifre gereklidir').exists(),
            body('newPassword', 'Yeni şifre en az 6 karakter olmalıdır').isLength({ min: 6 })
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { currentPassword, newPassword } = req.body;

        try {
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

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            await prisma.user.update({
                where: { id: req.user.userId },
                data: { password: hashedPassword }
            });

            res.json({ message: 'Şifre başarıyla güncellendi' });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// Delete Account
router.delete('/', auth, async (req, res) => {
    try {
        // Delete all related data first
        await prisma.subscription.deleteMany({
            where: { userId: req.user.userId }
        });

        // Delete user
        await prisma.user.delete({
            where: { id: req.user.userId }
        });

        res.json({ message: 'Hesap kalıcı olarak silindi' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
