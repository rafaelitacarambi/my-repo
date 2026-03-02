const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting migration...');
    const jsonPath = path.resolve(__dirname, '../final_complete_import.json');
    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(fileContent);

    console.log(`Found ${data.length} properties to migrate.`);

    for (const item of data) {
        try {
            const code = item.codigoReference || `TEMP-${Date.now()}-${Math.random()}`;
            const title = item.resumoImovel || 'Sem título';
            const type = item.tipoImovel || 'Outro';
            const status = item.statusImovel === 'Ativo' ? 'AVAILABLE' : 'RENTED';

            const salePrice = item.precoVenda ? parseFloat(item.precoVenda) : null;
            const rentPrice = item.precoLocacao ? parseFloat(item.precoLocacao) : null;
            const condoPrice = item.valorCondominio ? parseFloat(item.valorCondominio) : null;
            const iptuPrice = item.valorIPTU ? parseFloat(item.valorIPTU) : null;

            const areaTotal = item.areaTotal ? parseFloat(item.areaTotal) : null;
            const areaUtil = item.areaUtil ? parseFloat(item.areaUtil) : null;

            const bedrooms = item.quartos ? parseInt(item.quartos) : item.dormitorios ? parseInt(item.dormitorios) : null;
            const suites = item.suites ? parseInt(item.suites) : null;
            const bathrooms = item.banheiros ? parseInt(item.banheiros) : null;
            const garages = item.vagas ? parseInt(item.vagas) : item.vagasCobertas ? parseInt(item.vagasCobertas) : null;

            const zipCode = null;
            const street = item.logradouro || item.enderecoRua || null;
            const number = item.numero !== undefined && item.numero !== null ? String(item.numero) : null;
            const complement = item.complemento || item.enderecoComplemento || null;
            const neighborhood = item.bairro || item.enderecoBairro || null;
            const city = item.cidade || item.enderecoCidade || null;
            const state = item.estado || item.enderecoEstado || null;

            const description = item.descricaoAnuncio || null;
            const mainImage = item.propertyImages || null;
            const images = item.galeriaFotos || [];

            // Create or update
            await prisma.property.upsert({
                where: { code: code },
                update: {
                    title, type, status, salePrice, rentPrice, condoPrice, iptuPrice,
                    areaTotal, areaUtil, bedrooms, suites, bathrooms, garages,
                    zipCode, street, number, complement, neighborhood, city, state,
                    description, mainImage, images
                },
                create: {
                    code, title, type, status, salePrice, rentPrice, condoPrice, iptuPrice,
                    areaTotal, areaUtil, bedrooms, suites, bathrooms, garages,
                    zipCode, street, number, complement, neighborhood, city, state,
                    description, mainImage, images
                }
            });
            console.log(`Migrated property: ${code}`);
        } catch (err) {
            console.error(`Failed to migrate property ${item.codigoReference}:`, err.message);
        }
    }

    console.log('Migration finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
