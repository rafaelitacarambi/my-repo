import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

(async () => {
    try {
        // Purge any residual partial duplicates from failed runs
        await prisma.property.deleteMany({
            where: { code: { endsWith: '-TFNM' } }
        });

        const scrapedData = JSON.parse(fs.readFileSync('reconcile_api.json', 'utf8'));
        console.log(`Loaded ${scrapedData.length} properties from scraped API.`);

        const dbProperties = await prisma.property.findMany({});
        console.log(`Loaded ${dbProperties.length} properties from Database.`);

        const scrapedMap = new Map();
        scrapedData.forEach(p => {
            const normalizedCode = p.property_full_reference ? p.property_full_reference.replace(/-TFNM$/i, '') : p.property_full_reference;
            scrapedMap.set(normalizedCode, p);
        });

        const dbMap = new Map();
        dbProperties.forEach(p => dbMap.set(p.code, p));

        const missingInDb = []; // A
        const extraInDb = []; // B
        const divergent = []; // C

        // Check scraped against DB
        for (const [code, scraped] of scrapedMap.entries()) {
            if (!dbMap.has(code)) {
                missingInDb.push(scraped);
            } else {
                const dbProp = dbMap.get(code);
                let hasDivergence = false;
                const diffs = [];

                // Simple divergence check (price, photos count)
                const scrapedSalePrice = Number(scraped.sale_price) || null;
                const scrapedRentPrice = Number(scraped.rent_price) || null;

                if (dbProp.salePrice !== scrapedSalePrice) { hasDivergence = true; diffs.push(`Sell Price: DB(${dbProp.salePrice}) != Site(${scrapedSalePrice})`); }
                if (dbProp.rentPrice !== scrapedRentPrice) { hasDivergence = true; diffs.push(`Rent Price: DB(${dbProp.rentPrice}) != Site(${scrapedRentPrice})`); }

                const scrapedPhotosCount = Array.isArray(scraped.photos) ? scraped.photos.length : 0;
                const dbPhotosCount = Array.isArray(dbProp.images) ? dbProp.images.length : 0;
                if (dbPhotosCount !== scrapedPhotosCount) { hasDivergence = true; diffs.push(`Photos: DB(${dbPhotosCount}) != Site(${scrapedPhotosCount})`); }

                if (hasDivergence) {
                    divergent.push({ dbId: dbProp.id, code, scraped, diffs });
                }
            }
        }

        // Check DB against scraped
        for (const [code, dbProp] of dbMap.entries()) {
            if (!scrapedMap.has(code)) {
                // Only consider if it's currently Active/Available
                if (dbProp.status === 'AVAILABLE' || dbProp.status === 'RENTED' || dbProp.status === 'SOLD') {
                    extraInDb.push(dbProp);
                }
            }
        }

        console.log(`--- RECONCILIATION REPORT ---`);
        console.log(`(A) Missing in DB (On Site, Not in DB): ${missingInDb.length}`);
        console.log(`(B) Extra in DB (In DB, Not on Site): ${extraInDb.length}`);
        console.log(`(C) Divergent Data (Both exist, but diffs): ${divergent.length}`);

        fs.writeFileSync('reconcile_report.json', JSON.stringify({
            missingInDb: missingInDb.map(p => ({ code: p.property_full_reference, title: p.about_title, url: p.url })),
            extraInDb: extraInDb.map(p => ({ id: p.id, code: p.code, title: p.title })),
            divergent: divergent.map(p => ({ id: p.dbId, code: p.code, diffs: p.diffs }))
        }, null, 2));

        // == APPLY AUTOMATIC ACTIONS ==

        // Action A: Insert missing
        let insertedCount = 0;
        for (const scraped of missingInDb) {
            if (!scraped.property_full_reference) continue;

            const typeStr = Array.isArray(scraped.property_type) ? scraped.property_type[0] : (scraped.property_type || 'Desconhecido');
            const status = 'AVAILABLE';

            const purposes = scraped.property_purposes || [];
            const finalidade = purposes.includes('Venda') ? 'Venda' : (purposes.includes('Aluguel') ? 'Locação' : 'Venda');

            const images = scraped.photos ? scraped.photos.map(pt => pt.picture_full) : [];
            if (!images.length && scraped.picture_full) images.push(scraped.picture_full);

            await prisma.property.create({
                data: {
                    code: scraped.property_full_reference ? scraped.property_full_reference.replace(/-TFNM$/i, '') : `NEW-${Date.now()}`,
                    title: scraped.about_title || 'Imóvel Importado',
                    type: typeStr,
                    status: status,
                    finalidade: finalidade,
                    salePrice: Number(scraped.sale_price) || null,
                    rentPrice: Number(scraped.rent_price) || null,
                    description: scraped.listing_description || null,
                    images: images,
                    mainImage: images.length > 0 ? images[0] : null,
                    city: scraped.city || null,
                    neighborhood: scraped.neighborhood || null,
                    state: scraped.state || null,
                    bedrooms: Array.isArray(scraped.bedrooms) ? scraped.bedrooms[0] : null,
                    bathrooms: Array.isArray(scraped.bathrooms) ? scraped.bathrooms[0] : null,
                    garages: Array.isArray(scraped.garages) ? scraped.garages[0] : null,
                    areaTotal: Array.isArray(scraped.area) ? scraped.area[0] : null,
                    condoPrice: Number(scraped.property_tax_payment) || null,
                    iptuPrice: null, // Hard to parse from current payload reliably
                }
            });
            insertedCount++;
        }

        console.log(`Action A: Inserted ${insertedCount} missing properties.`);

        // Action B: Mark extra as UNAVAILABLE (Suspenso)
        const extraIds = extraInDb.map(p => p.id);
        if (extraIds.length > 0) {
            await prisma.property.updateMany({
                where: { id: { in: extraIds } },
                data: { status: 'UNAVAILABLE' } // Suspenso
            });
            console.log(`Action B: Marked ${extraIds.length} extra properties as UNAVAILABLE (Suspenso).`);
        }

        // Action C: Update divergent properties
        for (const div of divergent) {
            const { dbId, scraped } = div;

            const images = scraped.photos ? scraped.photos.map(pt => pt.picture_full) : [];
            if (!images.length && scraped.picture_full) images.push(scraped.picture_full);

            await prisma.property.update({
                where: { id: dbId },
                data: {
                    salePrice: Number(scraped.sale_price) || null,
                    rentPrice: Number(scraped.rent_price) || null,
                    description: scraped.listing_description || null,
                    images: images,
                    mainImage: images.length > 0 ? images[0] : null,
                }
            });
        }

        console.log(`Action C: Updated ${divergent.length} divergent properties.`);

    } catch (error) {
        console.error('Reconciliation failed:', error);
    } finally {
        await prisma.$disconnect();
    }
})();
