import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkConnection() {
    try {
        await prisma.$connect();
        console.log('Successfully connected to the PostgreSQL database!');
        const propertyCount = await prisma.property.count();
        console.log(`Number of properties currently in POSTGRESQL: ${propertyCount}`);
    } catch (err) {
        console.error('Database connection failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkConnection();
