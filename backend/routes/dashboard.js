const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    try {
        // Fetch user to get their preferred currency
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { currency: true }
        });

        const baseCurrency = user?.currency || 'TRY';

        const subscriptions = await prisma.subscription.findMany({
            where: { userId: req.user.userId, status: 'ACTIVE' }
        });

        let totalMonthlyCost = 0;

        // Mock exchange rates — ideally these should come from a DB cache or API
        // Rates are relative to TRY
        const ratesToTRY = {
            TRY: 1,
            USD: 36.0,
            EUR: 39.0
        };

        subscriptions.forEach(sub => {
            let monthlyPrice = sub.price;

            // Convert to monthly if yearly
            if (sub.billingCycle === 'YEARLY') {
                monthlyPrice = sub.price / 12;
            } else if (sub.billingCycle === 'WEEKLY') {
                monthlyPrice = sub.price * 4; // Approx
            }

            // Convert subscription currency to TRY first, then to user's base currency
            const subToTRY = ratesToTRY[sub.currency] || 1;
            const baseFromTRY = ratesToTRY[baseCurrency] || 1;
            totalMonthlyCost += (monthlyPrice * subToTRY) / baseFromTRY;
        });

        res.json({
            activeSubscriptions: subscriptions.length,
            totalMonthlyCost: totalMonthlyCost.toFixed(2),
            currency: baseCurrency
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

module.exports = router;
