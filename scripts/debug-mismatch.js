import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

(async () => {
    const scrapedData = JSON.parse(fs.readFileSync('reconcile_api.json', 'utf8'));
    const dbProperties = await prisma.property.findMany({ take: 5 });
    console.log('--- DB Properties Sample ---');
    dbProperties.forEach(p => console.log(p.code, p.title));
    console.log('--- API Properties Sample ---');
    scrapedData.slice(0, 5).forEach(p => console.log(p.property_full_reference, p.about_title));
    await prisma.$disconnect();
})();
