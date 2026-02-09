const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedAdmin() {
    const adminEmail = 'yksel124@gmail.com';
    const adminPassword = 'abecede124';
    const adminName = 'Admin';

    try {
        // Check if admin exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (existingAdmin) {
            // Update existing user to admin
            await prisma.user.update({
                where: { email: adminEmail },
                data: {
                    isAdmin: true,
                    isEmailVerified: true
                }
            });
            console.log('✅ Mevcut kullanıcı admin yapıldı:', adminEmail);
        } else {
            // Create new admin
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);

            await prisma.user.create({
                data: {
                    email: adminEmail,
                    password: hashedPassword,
                    name: adminName,
                    isAdmin: true,
                    isEmailVerified: true
                }
            });
            console.log('✅ Admin kullanıcı oluşturuldu:', adminEmail);
        }

        console.log('📧 Email:', adminEmail);
        console.log('🔐 Şifre:', adminPassword);
        console.log('🛡️ Admin paneli: http://localhost:3000/admin');

    } catch (error) {
        console.error('❌ Admin oluşturma hatası:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedAdmin();
