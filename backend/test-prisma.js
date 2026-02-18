const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to database...');
        const userCount = await prisma.user.count();
        console.log(`Successfully connected! User count: ${userCount}`);

        const users = await prisma.user.findMany({ take: 1 });
        console.log('Sample user:', users);
    } catch (error) {
        console.error('Error connecting to database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
