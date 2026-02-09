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
            if (sub.billingCycle === 'MONTHLY') {
                totalMonthlyCost += sub.price;
            } else if (sub.billingCycle === 'YEARLY') {
                totalMonthlyCost += sub.price / 12;
            }
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
