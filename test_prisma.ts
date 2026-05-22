import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Tentando buscar templates...");
        const templates = await prisma.contractTemplate.findMany();
        console.log("Templates encontrados:", templates.length);
    } catch (error) {
        console.error("Erro do Prisma:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
