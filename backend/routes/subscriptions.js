const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const logger = require('../lib/logger');
const { subscriptionSchema, validate } = require('../lib/validation');

// Get all subscriptions for logged in user
router.get('/', auth, async (req, res) => {
    try {
        const subscriptions = await prisma.subscription.findMany({
            where: { userId: req.user.userId },
            orderBy: { nextPaymentDate: 'asc' }
        });
        res.json(subscriptions);
    } catch (err) {
        logger.error({ err, userId: req.user.userId }, 'Failed to fetch subscriptions');
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Add new subscription
router.post('/', auth, validate(subscriptionSchema), async (req, res) => {
    try {
        const { name, price, currency, billingCycle, startDate } = req.body;

        let nextPayment = new Date(startDate);
        if (billingCycle === 'MONTHLY') {
            nextPayment.setMonth(nextPayment.getMonth() + 1);
        } else if (billingCycle === 'YEARLY') {
            nextPayment.setFullYear(nextPayment.getFullYear() + 1);
        }

        const subscription = await prisma.subscription.create({
            data: {
                userId: req.user.userId,
                name,
                price, // Zod already parsed & validated
                currency,
                billingCycle,
                startDate,
                nextPaymentDate: nextPayment,
                status: 'ACTIVE'
            }
        });

        logger.info({ subscriptionId: subscription.id, userId: req.user.userId }, 'Subscription created');
        res.json(subscription);
    } catch (err) {
        logger.error({ err, userId: req.user.userId }, 'Failed to create subscription');
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Delete subscription
router.delete('/:id', auth, async (req, res) => {
    try {
        const subscriptionId = parseInt(req.params.id);
        if (isNaN(subscriptionId)) {
            return res.status(400).json({ message: 'Geçersiz ID' });
        }

        const subscription = await prisma.subscription.findFirst({
            where: { id: subscriptionId, userId: req.user.userId }
        });

        if (!subscription) {
            return res.status(404).json({ message: 'Abonelik bulunamadı' });
        }

        await prisma.subscription.delete({
            where: { id: subscriptionId }
        });

        logger.info({ subscriptionId, userId: req.user.userId }, 'Subscription deleted');
        res.json({ message: 'Abonelik silindi' });
    } catch (err) {
        logger.error({ err, userId: req.user.userId }, 'Failed to delete subscription');
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Update subscription
router.put('/:id', auth, validate(subscriptionSchema), async (req, res) => {
    try {
        const subscriptionId = parseInt(req.params.id);
        if (isNaN(subscriptionId)) {
            return res.status(400).json({ message: 'Geçersiz ID' });
        }

        const subscription = await prisma.subscription.findFirst({
            where: { id: subscriptionId, userId: req.user.userId }
        });

        if (!subscription) {
            return res.status(404).json({ message: 'Abonelik bulunamadı' });
        }

        const { name, price, currency, billingCycle, startDate } = req.body;

        let nextPayment = new Date(startDate);
        if (billingCycle === 'MONTHLY') {
            nextPayment.setMonth(nextPayment.getMonth() + 1);
        } else if (billingCycle === 'YEARLY') {
            nextPayment.setFullYear(nextPayment.getFullYear() + 1);
        }

        const updatedSubscription = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                name,
                price,
                currency,
                billingCycle,
                startDate,
                nextPaymentDate: nextPayment
            }
        });

        logger.info({ subscriptionId, userId: req.user.userId }, 'Subscription updated');
        res.json(updatedSubscription);
    } catch (err) {
        logger.error({ err, userId: req.user.userId }, 'Failed to update subscription');
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

module.exports = router;
