const cron = require('node-cron');
const nodemailer = require('nodemailer');
const prisma = require('../lib/prisma');

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const checkUpcomingPayments = async () => {
    console.log('Running payment reminder job...');
    try {
        const today = new Date();
        const threeDaysLater = new Date();
        threeDaysLater.setDate(today.getDate() + 3);

        // Find subscriptions expiring in 3 days
        // Note: This is a simplified check. Real world date comparison should be more robust (ignoring time).
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
            include: {
                user: true
            }
        });

        console.log(`Found ${subscriptions.length} subscriptions due in 3 days.`);

        for (const sub of subscriptions) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: sub.user.email,
                subject: `Upcoming Payment Reminder: ${sub.name}`,
                text: `Hello ${sub.user.name || 'User'},\n\nYour subscription for ${sub.name} is due on ${sub.nextPaymentDate.toDateString()}.\nAmount: ${sub.price} ${sub.currency}\n\nPlease ensure you have sufficient funds.\n\nBest,\nSubscription Tracker`
            };

            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log('Error sending email:', error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });
            } else {
                console.log('Mock Email sent to:', sub.user.email);
                console.log(mailOptions.text);
            }
        }

    } catch (error) {
        console.error('Error in cron job:', error);
    }
};

// Schedule tasks to be run on the server.
// Runs every day at 09:00 AM (Europe/Istanbul)
const initCron = () => {
    cron.schedule('0 9 * * *', () => {
        checkUpcomingPayments();
    }, { timezone: 'Europe/Istanbul' });
    console.log('Cron job initialized: Payment reminders check daily at 09:00 AM (Europe/Istanbul)');

    // Run once on startup for debugging/demo purposes (optional)
    // checkUpcomingPayments();
};

module.exports = initCron;
