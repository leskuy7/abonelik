const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

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

        // Prevent removing admin if this is the last admin
        if (user.isAdmin) {
            const adminCount = await prisma.user.count({ where: { isAdmin: true } });
            if (adminCount <= 1) {
                return res.status(400).json({ message: 'Sistemde en az bir admin bulunmalıdır' });
            }
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

// Seed database (protected by secret key - one-time use)
router.post('/seed', async (req, res) => {
    try {
        const { secretKey } = req.body;

        // Protect with a secret key (not auth - since we're resetting users)
        if (secretKey !== 'subtrack-seed-2026') {
            return res.status(403).json({ message: 'Geçersiz anahtar' });
        }

        console.log('[Admin Seed] Starting database reset...');

        // Delete all data in order (respect foreign keys)
        await prisma.invoice.deleteMany({});
        await prisma.subscription.deleteMany({});
        await prisma.pushSubscription.deleteMany({});
        await prisma.user.deleteMany({});

        console.log('[Admin Seed] All data deleted');

        // Create admin user
        const adminPassword = await bcrypt.hash('admin123', 12);
        const admin = await prisma.user.create({
            data: {
                email: 'admin@subtrack.com',
                password: adminPassword,
                name: 'Admin',
                isAdmin: true,
                isEmailVerified: true,
                onboardingComplete: true,
                currency: 'TRY',
                language: 'tr',
                theme: 'dark',
                monthlyBudget: 500,
            },
        });

        // Create regular user
        const userPassword = await bcrypt.hash('user123', 12);
        const user = await prisma.user.create({
            data: {
                email: 'user@subtrack.com',
                password: userPassword,
                name: 'Test Kullanıcı',
                isAdmin: false,
                isEmailVerified: true,
                onboardingComplete: true,
                currency: 'TRY',
                language: 'tr',
                theme: 'dark',
                monthlyBudget: 200,
            },
        });

        // Add sample subscriptions for the regular user
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

        await prisma.subscription.createMany({
            data: [
                {
                    userId: user.id,
                    name: 'Netflix',
                    price: 149.99,
                    currency: 'TRY',
                    billingCycle: 'MONTHLY',
                    startDate: new Date('2024-06-01'),
                    nextPaymentDate: nextMonth,
                    status: 'ACTIVE',
                },
                {
                    userId: user.id,
                    name: 'Spotify',
                    price: 59.99,
                    currency: 'TRY',
                    billingCycle: 'MONTHLY',
                    startDate: new Date('2024-03-15'),
                    nextPaymentDate: nextMonth,
                    status: 'ACTIVE',
                },
                {
                    userId: user.id,
                    name: 'YouTube Premium',
                    price: 79.99,
                    currency: 'TRY',
                    billingCycle: 'MONTHLY',
                    startDate: new Date('2024-01-01'),
                    nextPaymentDate: nextMonth,
                    status: 'ACTIVE',
                },
            ],
        });

        console.log('[Admin Seed] Seed completed successfully');

        res.json({
            message: 'Veritabanı sıfırlandı ve hazır hesaplar oluşturuldu',
            accounts: [
                { role: 'Admin', email: 'admin@subtrack.com', password: 'admin123' },
                { role: 'User', email: 'user@subtrack.com', password: 'user123' },
            ],
            subscriptions: ['Netflix (₺149.99)', 'Spotify (₺59.99)', 'YouTube Premium (₺79.99)'],
        });
    } catch (error) {
        console.error('[Admin Seed] Error:', error);
        res.status(500).json({ message: 'Seed başarısız: ' + error.message });
    }
});

module.exports = router;
