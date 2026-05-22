
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const clients = await prisma.client.findMany({
            select: {
                id: true,
                name: true,
                document: true
            }
        });

        console.log(`Total clients: ${clients.length}`);

        const documentCounts: Record<string, string[]> = {};
        clients.forEach(c => {
            if (c.document) {
                if (!documentCounts[c.document]) {
                    documentCounts[c.document] = [];
                }
                documentCounts[c.document].push(c.id);
            }
        });

        const duplicates = Object.entries(documentCounts).filter(([doc, ids]) => ids.length > 1);

        if (duplicates.length > 0) {
            console.log('Duplicate documents found:');
            duplicates.forEach(([doc, ids]) => {
                console.log(`- Document ${doc}: ${ids.join(', ')}`);
            });
        } else {
            console.log('No duplicate documents found in current database.');
        }

        const atendimentoCount = await prisma.$queryRaw`SELECT count(*) FROM "atendimentos"`;
        console.log('Atendimento count (raw):', atendimentoCount);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
