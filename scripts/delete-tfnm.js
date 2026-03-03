import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
    const res = await prisma.property.deleteMany({
        where: { code: { endsWith: '-TFNM' } }
    });
    console.log('Deleted duplicates:', res.count);
    await prisma.$disconnect();
})();
