const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const email = 'testuser@example.com';
        const user = await prisma.user.update({
            where: { email: email },
            data: {
                isEmailVerified: true,
                onboardingComplete: true
            },
        });
        console.log(`User ${email} verified successfully:`, user);
    } catch (e) {
        console.error('Error updating user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
