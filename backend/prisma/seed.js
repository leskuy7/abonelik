const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🗑️  Tüm kullanıcılar siliniyor...');

    // Delete all data in order (respect foreign keys)
    await prisma.invoice.deleteMany({});
    await prisma.subscription.deleteMany({});
    await prisma.pushSubscription.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('✅ Tüm veriler silindi');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.create({
        data: {
            email: 'admin@subtrack.com',
            password: adminPassword,
            name: 'Admin',
            isAdmin: true,
            isEmailVerified: true,
            onboardingComplete: true,
            currency: 'TRY',
            language: 'tr',
            theme: 'dark',
            monthlyBudget: 500,
        },
    });
    console.log('👑 Admin oluşturuldu:', admin.email, '(şifre: admin123)');

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 12);
    const user = await prisma.user.create({
        data: {
            email: 'user@subtrack.com',
            password: userPassword,
            name: 'Test Kullanıcı',
            isAdmin: false,
            isEmailVerified: true,
            onboardingComplete: true,
            currency: 'TRY',
            language: 'tr',
            theme: 'dark',
            monthlyBudget: 200,
        },
    });
    console.log('👤 Kullanıcı oluşturuldu:', user.email, '(şifre: user123)');

    // Add sample subscriptions for the regular user
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    await prisma.subscription.createMany({
        data: [
            {
                userId: user.id,
                name: 'Netflix',
                price: 149.99,
                currency: 'TRY',
                billingCycle: 'MONTHLY',
                startDate: new Date('2024-06-01'),
                nextPaymentDate: nextMonth,
                status: 'ACTIVE',
            },
            {
                userId: user.id,
                name: 'Spotify',
                price: 59.99,
                currency: 'TRY',
                billingCycle: 'MONTHLY',
                startDate: new Date('2024-03-15'),
                nextPaymentDate: nextMonth,
                status: 'ACTIVE',
            },
            {
                userId: user.id,
                name: 'YouTube Premium',
                price: 79.99,
                currency: 'TRY',
                billingCycle: 'MONTHLY',
                startDate: new Date('2024-01-01'),
                nextPaymentDate: nextMonth,
                status: 'ACTIVE',
            },
        ],
    });
    console.log('📦 Örnek abonelikler eklendi (Netflix, Spotify, YouTube Premium)');

    console.log('\n🎉 Seed tamamlandı!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 Admin: admin@subtrack.com / admin123');
    console.log('👤 User:  user@subtrack.com / user123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
    .catch((e) => {
        console.error('❌ Seed hatası:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
