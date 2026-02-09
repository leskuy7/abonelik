const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// Admin middleware - only admins can access
const adminOnly = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId }
        });

        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: 'Yetkiniz yok' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Get all users (admin only)
router.get('/users', auth, adminOnly, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                isEmailVerified: true,
                isAdmin: true,
                createdAt: true,
                _count: {
                    select: { subscriptions: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Delete user (admin only)
router.delete('/users/:id', auth, adminOnly, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        // Can't delete yourself
        if (userId === req.user.userId) {
            return res.status(400).json({ message: 'Kendinizi silemezsiniz' });
        }

        // Delete user's subscriptions first
        await prisma.subscription.deleteMany({
            where: { userId }
        });

        // Delete user
        await prisma.user.delete({
            where: { id: userId }
        });

        res.json({ message: 'Kullanıcı silindi' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Kullanıcı silinemedi' });
    }
});

// Toggle admin status (admin only)
router.patch('/users/:id/admin', auth, adminOnly, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        // Can't change your own admin status
        if (userId === req.user.userId) {
            return res.status(400).json({ message: 'Kendi yetkinizi değiştiremezsiniz' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { isAdmin: !user.isAdmin }
        });

        res.json({ isAdmin: updatedUser.isAdmin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Güncelleme başarısız' });
    }
});

// Verify user email manually (admin only)
router.patch('/users/:id/verify', auth, adminOnly, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        await prisma.user.update({
            where: { id: userId },
            data: {
                isEmailVerified: true,
                verificationToken: null
            }
        });

        res.json({ message: 'E-posta doğrulandı' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Doğrulama başarısız' });
    }
});

// Get admin stats
router.get('/stats', auth, adminOnly, async (req, res) => {
    try {
        const [totalUsers, verifiedUsers, totalSubscriptions] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { isEmailVerified: true } }),
            prisma.subscription.count()
        ]);

        res.json({
            totalUsers,
            verifiedUsers,
            unverifiedUsers: totalUsers - verifiedUsers,
            totalSubscriptions
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

module.exports = router;
