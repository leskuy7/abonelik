const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const logger = require('../lib/logger');

// Configure web-push
// Keys are loaded from environment variables
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        `mailto:${process.env.EMAIL_USER || 'example@test.com'}`,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

// Subscribe to push notifications
router.post('/subscribe', auth, async (req, res) => {
    try {
        const subscription = req.body;

        // Save subscription to database
        // We use upsert to avoid duplicates for the same endpoint? 
        // Actually same user can have multiple devices. 
        // But same endpoint = same device.

        const existing = await prisma.pushSubscription.findFirst({
            where: {
                endpoint: subscription.endpoint,
                userId: req.user.userId
            }
        });

        if (!existing) {
            await prisma.pushSubscription.create({
                data: {
                    userId: req.user.userId,
                    endpoint: subscription.endpoint,
                    keys: subscription.keys
                }
            });
        }

        res.status(201).json({ message: 'Bildirimler açıldı!' });

        // Send a welcome notification
        const payload = JSON.stringify({
            title: 'SubTrack',
            body: 'Bildirimler başarıyla aktif edildi! 🔔',
            icon: '/icon.png' // or svg
        });

        try {
            await webpush.sendNotification(subscription, payload);
        } catch (error) {
            logger.error({ err: error }, 'Error sending welcome notification');
            // Don't fail the request if sending fails, subscription is saved
        }

    } catch (error) {
        logger.error({ err: error }, 'Push subscription error');
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

module.exports = router;
