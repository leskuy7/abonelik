const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const logger = require('../lib/logger');
const { onboardingSchema, validate } = require('../lib/validation');

// Complete Onboarding
router.post('/', auth, validate(onboardingSchema), async (req, res) => {
    try {
        const { currency, monthlyBudget } = req.body;

        const user = await prisma.user.update({
            where: { id: req.user.userId },
            data: {
                currency,
                monthlyBudget,
                onboardingComplete: true
            },
            select: {
                id: true,
                name: true,
                email: true,
                onboardingComplete: true,
                currency: true,
                monthlyBudget: true
            }
        });

        logger.info({ userId: req.user.userId, currency }, 'Onboarding completed');
        res.json(user);
    } catch (err) {
        logger.error({ err, userId: req.user.userId }, 'Onboarding failed');
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

module.exports = router;
