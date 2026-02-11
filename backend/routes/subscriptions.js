const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// Get all subscriptions for logged in user
router.get('/', auth, async (req, res) => {
    try {
        const subscriptions = await prisma.subscription.findMany({
            where: { userId: req.user.userId },
            orderBy: { nextPaymentDate: 'asc' }
        });
        res.json(subscriptions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Add new subscription
router.post('/', auth, async (req, res) => {
    try {
        const { name, price, currency, billingCycle, startDate } = req.body;

        const parsedPrice = parseFloat(price);
        if (!name || isNaN(parsedPrice) || parsedPrice <= 0) {
            return res.status(400).json({ message: 'Geçerli bir isim ve fiyat girin' });
        }

        const start = new Date(startDate);
        let nextPayment = new Date(start);

        if (billingCycle === 'MONTHLY') {
            nextPayment.setMonth(nextPayment.getMonth() + 1);
        } else if (billingCycle === 'YEARLY') {
            nextPayment.setFullYear(nextPayment.getFullYear() + 1);
        }

        const subscription = await prisma.subscription.create({
            data: {
                userId: req.user.userId,
                name,
                price: parsedPrice,
                currency,
                billingCycle,
                startDate: start,
                nextPaymentDate: nextPayment,
                status: 'ACTIVE'
            }
        });

        res.json(subscription);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Delete subscription
router.delete('/:id', auth, async (req, res) => {
    try {
        const subscription = await prisma.subscription.findFirst({
            where: { id: parseInt(req.params.id), userId: req.user.userId }
        });

        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        await prisma.subscription.delete({
            where: { id: parseInt(req.params.id) }
        });

        res.json({ message: 'Subscription removed' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Update subscription
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, price, currency, billingCycle, startDate } = req.body;
        const subscriptionId = parseInt(req.params.id);

        const subscription = await prisma.subscription.findFirst({
            where: { id: subscriptionId, userId: req.user.userId }
        });

        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        const parsedPrice = parseFloat(price);
        if (!name || isNaN(parsedPrice) || parsedPrice <= 0) {
            return res.status(400).json({ message: 'Geçerli bir isim ve fiyat girin' });
        }

        const start = new Date(startDate);
        let nextPayment = new Date(start);

        // Calculate next payment date based on billing cycle if start date changed or just recalculate
        // Logic: specific logic could be complex depending on if user wants to keep original cycle or reset.
        // Simple approach: Recalculate next payment from new start date. 
        // Better approach for edit: changing start date usually means resetting the cycle.

        if (billingCycle === 'MONTHLY') {
            nextPayment.setMonth(nextPayment.getMonth() + 1);
        } else if (billingCycle === 'YEARLY') {
            nextPayment.setFullYear(nextPayment.getFullYear() + 1);
        }

        const updatedSubscription = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                name,
                price: parsedPrice,
                currency,
                billingCycle,
                startDate: start,
                nextPaymentDate: nextPayment
            }
        });

        res.json(updatedSubscription);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
