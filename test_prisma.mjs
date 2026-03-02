import 'dotenv/config';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

console.log('DATABASE_URL from process.env:', process.env.DATABASE_URL);

const prisma = new PrismaClient();

async function main() {
    try {
        await prisma.$connect();
        console.log('Successfully connected to the database!');
        const propertyCount = await prisma.property.count();
        console.log(`Number of properties in PostgreSQL: ${propertyCount}`);
    } catch (error) {
        console.error('Failed to connect to the database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
