const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    // For production, use real SMTP credentials
    // For development, we'll use console logging as fallback
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_USER !== 'your_email@example.com') {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }
    return null;
};

const transporter = createTransporter();

const sendVerificationEmail = async (email, name, verificationToken) => {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@subtrack.com',
        to: email,
        subject: 'SubTrack - E-posta Adresinizi Doğrulayın',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #fff; padding: 40px; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="display: inline-block; background: #9333ea; padding: 12px 16px; border-radius: 12px; font-size: 24px;">💳</div>
                    <h1 style="margin: 16px 0 0; font-size: 24px; color: #fff;">SubTrack</h1>
                </div>
                
                <p style="color: #94a3b8; font-size: 16px;">Merhaba ${name || 'Kullanıcı'},</p>
                <p style="color: #94a3b8; font-size: 16px;">SubTrack'e hoş geldiniz! Hesabınızı aktifleştirmek için aşağıdaki butona tıklayın:</p>
                
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${verificationUrl}" 
                       style="display: inline-block; background: #9333ea; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                        E-postamı Doğrula
                    </a>
                </div>
                
                <p style="color: #64748b; font-size: 14px;">Veya bu linki tarayıcınıza kopyalayın:</p>
                <p style="color: #9333ea; font-size: 14px; word-break: break-all;">${verificationUrl}</p>
                
                <hr style="border: none; border-top: 1px solid #334155; margin: 32px 0;">
                
                <p style="color: #64748b; font-size: 12px; text-align: center;">
                    Bu e-postayı siz talep etmediyseniz, görmezden gelebilirsiniz.
                </p>
            </div>
        `
    };

    if (transporter) {
        try {
            await transporter.sendMail(mailOptions);
            console.log('Verification email sent to:', email);
            return true;
        } catch (error) {
            console.error('Error sending email:', error);
            return false;
        }
    } else {
        // Development mode - log to console
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('📧 DEVELOPMENT MODE - Email would be sent:');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('To:', email);
        console.log('Subject:', mailOptions.subject);
        console.log('Verification URL:', verificationUrl);
        console.log('═══════════════════════════════════════════════════════════════\n');
        return true;
    }
};

const sendWelcomeEmail = async (email, name) => {
    const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@subtrack.com',
        to: email,
        subject: 'SubTrack\'e Hoş Geldiniz! 🎉',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #fff; padding: 40px; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="display: inline-block; background: #9333ea; padding: 12px 16px; border-radius: 12px; font-size: 24px;">💳</div>
                    <h1 style="margin: 16px 0 0; font-size: 24px; color: #fff;">SubTrack</h1>
                </div>
                
                <p style="color: #94a3b8; font-size: 16px;">Merhaba ${name || 'Kullanıcı'},</p>
                <p style="color: #94a3b8; font-size: 16px;">E-posta adresiniz doğrulandı! Artık SubTrack'i kullanmaya başlayabilirsiniz.</p>
                
                <div style="background: #1e293b; border-radius: 8px; padding: 20px; margin: 24px 0;">
                    <h3 style="color: #fff; margin: 0 0 12px; font-size: 16px;">🚀 Hızlı Başlangıç</h3>
                    <ul style="color: #94a3b8; margin: 0; padding-left: 20px; font-size: 14px;">
                        <li>İlk aboneliğinizi ekleyin</li>
                        <li>Ödeme hatırlatmalarını alın</li>
                        <li>Harcamalarınızı takip edin</li>
                    </ul>
                </div>
                
                <div style="text-align: center;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                       style="display: inline-block; background: #9333ea; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                        Giriş Yap
                    </a>
                </div>
            </div>
        `
    };

    if (transporter) {
        try {
            await transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Error sending welcome email:', error);
            return false;
        }
    }
    return true;
};

module.exports = { sendVerificationEmail, sendWelcomeEmail };
