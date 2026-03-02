const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    try {
        const count = await prisma.property.count();
        console.log("Count:", count);
    } catch (e) {
        console.log("Prisma Error Details:", String(e));
        if (e.message) console.log("Message:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}
run();
