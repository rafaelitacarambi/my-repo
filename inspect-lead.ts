import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Searching for lead/atendimento matching GA0004...");
    
    // Search in Wix data mock or direct tables
    const wixData = await prisma.$queryRaw`SELECT * FROM "WixDataItems" WHERE "dataId" LIKE '%GA0004%' OR "value" LIKE '%GA0004%' LIMIT 5`;
    console.log("WixDataItems matches:", JSON.stringify(wixData, null, 2));
    
    const lead = await prisma.lead.findFirst({
        where: {
            OR: [
                { id: { contains: 'GA0004' } },
                { fullName: { contains: 'Gabriela' } }
            ]
        }
    });
    console.log("Prisma Lead matches:", JSON.stringify(lead, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
