const { PrismaClient } = require('@prisma/client');

// Singleton pattern: reuse PrismaClient across all route files
// Prevents creating multiple connections in production
const prisma = global.__prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    global.__prisma = prisma;
}

module.exports = prisma;
