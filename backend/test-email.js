require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log('User:', process.env.EMAIL_USER);
    console.log('Pass:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'none');

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
    });

    try {
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('Connection verified successfully.');

        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // send to self
            subject: 'Test Email',
            text: 'This is a test email to verify nodemailer configuration.',
        });
        console.log('Email sent: ', info.messageId);
    } catch (error) {
        console.error('Error in email sending:', error);
    }
}

testEmail();
