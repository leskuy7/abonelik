const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

router.get('/', auth, async (req, res) => {
    try {
        const subscriptions = await prisma.subscription.findMany({
            where: { userId: req.user.userId, status: 'ACTIVE' }
        });

        let totalMonthlyCost = 0;

        subscriptions.forEach(sub => {
            let monthlyPrice = sub.price;

            // Convert to monthly if yearly
            if (sub.billingCycle === 'YEARLY') {
                monthlyPrice = sub.price / 12;
            } else if (sub.billingCycle === 'WEEKLY') {
                monthlyPrice = sub.price * 4; // Approx
            }

            // Convert to base currency (TRY)
            // Mock rates for now - ideally fetch from API
            const rates = {
                TRY: 1,
                USD: 36.0,
                EUR: 39.0
            };

            const rate = rates[sub.currency] || 1;
            totalMonthlyCost += monthlyPrice * rate;
        });

        // Basic stats
        res.json({
            activeSubscriptions: subscriptions.length,
            totalMonthlyCost: totalMonthlyCost.toFixed(2),
            currency: 'TRY' // Assuming mostly TRY for now, handling multi-currency is complex
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
