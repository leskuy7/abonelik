const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const VALID_BILLING_CYCLES = ['MONTHLY', 'YEARLY'];
const VALID_CURRENCIES = ['TRY', 'USD', 'EUR'];

// Normalize price: handle Turkish comma format (e.g., "10,50" → 10.50)
const normalizePrice = (price) => {
    if (typeof price === 'string') {
        price = price.replace(',', '.');
    }
    return parseFloat(price);
};

// Validate subscription input (shared between create and update)
const validateSubscriptionInput = (body) => {
    const errors = [];
    const { name, price, currency, billingCycle, startDate } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        errors.push('Geçerli bir isim girin');
    }

    const parsedPrice = normalizePrice(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
        errors.push('Geçerli bir fiyat girin (0\'dan büyük olmalı)');
    }

    if (!VALID_BILLING_CYCLES.includes(billingCycle)) {
        errors.push(`Geçerli bir ödeme sıklığı girin: ${VALID_BILLING_CYCLES.join(', ')}`);
    }

    if (currency && !VALID_CURRENCIES.includes(currency)) {
        errors.push(`Geçerli bir para birimi girin: ${VALID_CURRENCIES.join(', ')}`);
    }

    const parsedDate = new Date(startDate);
    if (!startDate || isNaN(parsedDate.getTime())) {
        errors.push('Geçerli bir başlangıç tarihi girin');
    }

    return { errors, parsedPrice, parsedDate };
};

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
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Add new subscription
router.post('/', auth, async (req, res) => {
    try {
        const { errors, parsedPrice, parsedDate } = validateSubscriptionInput(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ message: errors[0], errors });
        }

        const { name, currency, billingCycle } = req.body;

        let nextPayment = new Date(parsedDate);
        if (billingCycle === 'MONTHLY') {
            nextPayment.setMonth(nextPayment.getMonth() + 1);
        } else if (billingCycle === 'YEARLY') {
            nextPayment.setFullYear(nextPayment.getFullYear() + 1);
        }

        const subscription = await prisma.subscription.create({
            data: {
                userId: req.user.userId,
                name: name.trim(),
                price: parsedPrice,
                currency: currency || 'TRY',
                billingCycle,
                startDate: parsedDate,
                nextPaymentDate: nextPayment,
                status: 'ACTIVE'
            }
        });

        res.json(subscription);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Delete subscription
router.delete('/:id', auth, async (req, res) => {
    try {
        const subscription = await prisma.subscription.findFirst({
            where: { id: parseInt(req.params.id), userId: req.user.userId }
        });

        if (!subscription) {
            return res.status(404).json({ message: 'Abonelik bulunamadı' });
        }

        await prisma.subscription.delete({
            where: { id: parseInt(req.params.id) }
        });

        res.json({ message: 'Abonelik silindi' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Update subscription
router.put('/:id', auth, async (req, res) => {
    try {
        const subscriptionId = parseInt(req.params.id);

        const subscription = await prisma.subscription.findFirst({
            where: { id: subscriptionId, userId: req.user.userId }
        });

        if (!subscription) {
            return res.status(404).json({ message: 'Abonelik bulunamadı' });
        }

        const { errors, parsedPrice, parsedDate } = validateSubscriptionInput(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ message: errors[0], errors });
        }

        const { name, currency, billingCycle } = req.body;

        let nextPayment = new Date(parsedDate);
        if (billingCycle === 'MONTHLY') {
            nextPayment.setMonth(nextPayment.getMonth() + 1);
        } else if (billingCycle === 'YEARLY') {
            nextPayment.setFullYear(nextPayment.getFullYear() + 1);
        }

        const updatedSubscription = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                name: name.trim(),
                price: parsedPrice,
                currency: currency || 'TRY',
                billingCycle,
                startDate: parsedDate,
                nextPaymentDate: nextPayment
            }
        });

        res.json(updatedSubscription);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

module.exports = router;
