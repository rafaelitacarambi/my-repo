import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
    console.log('Iniciando teste de conexão e contagem de properties...');
    try {
        const count = await prisma.property.count();
        console.log('Total de properties:', count);

        console.log('Buscando as 5 primeiras propriedades com campos mínimos...');
        const firstFive = await prisma.property.findMany({
            take: 5,
            select: {
                id: true,
                code: true,
                title: true,
                type: true,
            }
        });
        console.log('Primeiras 5 propriedades:', firstFive);

        console.log('Buscando todas as propriedades (findMany)...');
        const start = Date.now();
        const all = await prisma.property.findMany();
        console.log(`Buscadas ${all.length} propriedades em ${Date.now() - start}ms`);
    } catch (e) {
        console.error('Erro no teste:', e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
