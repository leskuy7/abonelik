const cron = require('node-cron');
const prisma = require('../lib/prisma');
const logger = require('../lib/logger');

// Send email using Resend REST API (HTTP) to bypass Render SMTP blocks
const sendEmailToResend = async (mailOptions) => {
    const apiKey = process.env.RESEND_API_KEY;

    // In development mode without API key, just log to console
    if (!apiKey || apiKey === 'your_resend_api_key_here') {
        logger.info({ to: mailOptions.to, subject: mailOptions.subject }, 'DEV MODE: Email (not sent)');
        return true;
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: process.env.EMAIL_USER || 'onboarding@resend.dev', // Must be an allowed domain in Resend
                to: mailOptions.to,
                subject: mailOptions.subject,
                text: mailOptions.text
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            logger.error({ err: errorData, to: mailOptions.to }, 'Resend API Error');
            return false;
        }

        const data = await response.json();
        logger.info({ to: mailOptions.to, id: data.id }, 'Email sent successfully via Resend');
        return true;
    } catch (error) {
        logger.error({ err: error, to: mailOptions.to }, 'Error calling Resend API');
        return false;
    }
};

// ─── Renewal Worker ────────────────────────────────────────
// Processes overdue subscriptions: creates invoices and advances nextPaymentDate
const processRenewals = async () => {
    logger.info('Running renewal worker...');
    try {
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today

        // Find all ACTIVE subscriptions where nextPaymentDate has passed
        const overdueSubscriptions = await prisma.subscription.findMany({
            where: {
                nextPaymentDate: { lte: today },
                status: 'ACTIVE',
            },
            include: { user: true },
        });

        logger.info({ count: overdueSubscriptions.length }, 'Found overdue subscriptions');

        let invoicesCreated = 0;
        let subscriptionsRenewed = 0;

        for (const sub of overdueSubscriptions) {
            try {
                // Create invoice for the overdue period
                await prisma.invoice.create({
                    data: {
                        subscriptionId: sub.id,
                        amount: sub.price,
                        dueDate: sub.nextPaymentDate,
                        status: 'PENDING',
                    },
                });
                invoicesCreated++;

                // Advance nextPaymentDate to next billing cycle
                const nextDate = new Date(sub.nextPaymentDate);
                if (sub.billingCycle === 'MONTHLY') {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                } else if (sub.billingCycle === 'YEARLY') {
                    nextDate.setFullYear(nextDate.getFullYear() + 1);
                } else if (sub.billingCycle === 'WEEKLY') {
                    nextDate.setDate(nextDate.getDate() + 7);
                }

                // If the new date is still in the past, keep advancing
                // (handles cases where cron was down for multiple cycles)
                const now = new Date();
                while (nextDate <= now) {
                    if (sub.billingCycle === 'MONTHLY') {
                        nextDate.setMonth(nextDate.getMonth() + 1);
                    } else if (sub.billingCycle === 'YEARLY') {
                        nextDate.setFullYear(nextDate.getFullYear() + 1);
                    } else if (sub.billingCycle === 'WEEKLY') {
                        nextDate.setDate(nextDate.getDate() + 7);
                    }
                }

                await prisma.subscription.update({
                    where: { id: sub.id },
                    data: { nextPaymentDate: nextDate },
                });
                subscriptionsRenewed++;

                logger.info({
                    subscriptionId: sub.id,
                    name: sub.name,
                    userId: sub.userId,
                    nextPaymentDate: nextDate.toISOString(),
                }, 'Subscription renewed');
            } catch (subError) {
                logger.error({ err: subError, subscriptionId: sub.id }, 'Failed to process subscription renewal');
            }
        }

        logger.info({ invoicesCreated, subscriptionsRenewed }, 'Renewal worker completed');
    } catch (error) {
        logger.error({ err: error }, 'Renewal worker failed');
    }
};

// ─── Payment Reminders ─────────────────────────────────────
const checkUpcomingPayments = async () => {
    logger.info('Running payment reminder job...');
    try {
        const today = new Date();
        const threeDaysLater = new Date();
        threeDaysLater.setDate(today.getDate() + 3);

        const startOfRange = new Date(threeDaysLater);
        startOfRange.setHours(0, 0, 0, 0);

        const endOfRange = new Date(threeDaysLater);
        endOfRange.setHours(23, 59, 59, 999);

        const subscriptions = await prisma.subscription.findMany({
            where: {
                nextPaymentDate: {
                    gte: startOfRange,
                    lte: endOfRange
                },
                status: 'ACTIVE'
            },
            include: { user: true }
        });

        logger.info({ count: subscriptions.length }, 'Found subscriptions due in 3 days');

        for (const sub of subscriptions) {
            const mailOptions = {
                from: process.env.EMAIL_USER || 'onboarding@resend.dev',
                to: sub.user.email,
                subject: `Yaklaşan Ödeme: ${sub.name}`,
                text: `Merhaba ${sub.user.name || 'Kullanıcı'},\n\n${sub.name} aboneliğinizin ödeme tarihi ${sub.nextPaymentDate.toLocaleDateString('tr-TR')} tarihinde.\nTutar: ${Number(sub.price)} ${sub.currency}\n\nSubTrack`
            };

            await sendEmailToResend(mailOptions);
        }
    } catch (error) {
        logger.error({ err: error }, 'Payment reminder job failed');
    }
};

// ─── Cron Schedule ──────────────────────────────────────────
const initCron = () => {
    // Renewal worker: runs every day at 00:05 (just after midnight)
    cron.schedule('5 0 * * *', () => {
        processRenewals();
    }, { timezone: 'Europe/Istanbul' });

    // Payment reminders: runs every day at 09:00
    cron.schedule('0 9 * * *', () => {
        checkUpcomingPayments();
    }, { timezone: 'Europe/Istanbul' });

    logger.info('Cron jobs initialized: Renewals at 00:05, Reminders at 09:00 (Europe/Istanbul)');

    // Run renewal worker once on startup to catch up on missed renewals
    processRenewals();
};

module.exports = initCron;
