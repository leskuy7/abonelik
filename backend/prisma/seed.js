const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Seeding is disabled in production.');
    }

    const adminEmail = process.env.SEED_ADMIN_EMAIL;
    const adminPasswordPlain = process.env.SEED_ADMIN_PASSWORD;
    const userEmail = process.env.SEED_USER_EMAIL;
    const userPasswordPlain = process.env.SEED_USER_PASSWORD;

    if (!adminEmail || !adminPasswordPlain || !userEmail || !userPasswordPlain) {
        throw new Error('Missing seed env vars: SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_USER_EMAIL, SEED_USER_PASSWORD');
    }

    console.log('🗑️  Tüm kullanıcılar siliniyor...');

    // Delete all data in order (respect foreign keys)
    await prisma.invoice.deleteMany({});
    await prisma.subscription.deleteMany({});
    await prisma.pushSubscription.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('✅ Tüm veriler silindi');

    // Create admin user
    const adminPassword = await bcrypt.hash(adminPasswordPlain, 12);
    const admin = await prisma.user.create({
        data: {
            email: adminEmail,
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
    console.log('👑 Admin oluşturuldu:', admin.email);

    // Create regular user
    const userPassword = await bcrypt.hash(userPasswordPlain, 12);
    const user = await prisma.user.create({
        data: {
            email: userEmail,
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
    console.log('👤 Kullanıcı oluşturuldu:', user.email);

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
    console.log('👑 Admin:', admin.email);
    console.log('👤 User:', user.email);
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
