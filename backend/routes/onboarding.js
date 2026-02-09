const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Complete Onboarding
router.post(
    '/',
    [
        auth,
        [
            body('currency', 'Geçerli bir para birimi seçiniz').isIn(['TRY', 'USD', 'EUR']),
            body('monthlyBudget', 'Bütçe sayısal bir değer olmalıdır').optional().isNumeric()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { currency, monthlyBudget } = req.body;

        try {
            const user = await prisma.user.update({
                where: { id: req.user.userId },
                data: {
                    currency,
                    monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : null,
                    onboardingComplete: true
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    onboardingComplete: true,
                    currency: true
                }
            });

            res.json(user);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

module.exports = router;
