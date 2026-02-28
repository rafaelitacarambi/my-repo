import { BaseCrudService } from '../integrations';
import { Imveis } from '../src/entities';
import fs from 'fs';
import path from 'path';

async function bulkSync() {
    console.log('Starting bulk sync...');

    try {
        // Read the JSON file
        const dataPath = path.resolve(process.cwd(), 'kenlo_import.json');
        const kenloData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

        console.log(`Loaded ${kenloData.length} items from kenlo_import.json`);

        // Get all properties from the database
        const result = await BaseCrudService.getAll<Imveis>('imoveis', [], { limit: 1000 });
        const existingProperties = result.items;

        console.log(`Found ${existingProperties.length} existing properties in the database`);

        let updatedCount = 0;
        let skippedCount = 0;

        for (const kenloItem of kenloData) {
            const codigo = kenloItem.codigoReference;
            if (!codigo) continue;

            const property = existingProperties.find(p => p.codigoReference === codigo);

            if (property) {
                const updates: Partial<Imveis> = {
                    _id: property._id,
                    precoVenda: kenloItem.precoVenda || 0,
                    precoLocacao: kenloItem.precoLocacao || 0,
                    valorCondominio: kenloItem.valorCondominio || 0,
                    valorIPTU: kenloItem.valorIPTU || 0,
                    areaUtil: kenloItem.areaUtil || 0,
                    areaTotal: kenloItem.areaTotal || 0,
                    quartos: kenloItem.quartos || 0,
                    suites: kenloItem.suites || 0,
                    vagas: kenloItem.vagas || 0,
                };

                // Determine main price (price field)
                if (kenloItem.precoVenda > 0) {
                    updates.price = kenloItem.precoVenda;
                } else if (kenloItem.precoLocacao > 0) {
                    updates.price = kenloItem.precoLocacao;
                }

                // Condominium flag
                if (kenloItem.valorCondominio > 0) {
                    updates.imovelCondominio = true;
                }

                await BaseCrudService.update('imoveis', updates as Imveis);
                console.log(`Updated property: ${codigo}`);
                updatedCount++;
            } else {
                skippedCount++;
            }
        }

        console.log(`Sync completed! Updated: ${updatedCount}, Skipped: ${skippedCount}`);
    } catch (error) {
        console.error('Error during bulk sync:', error);
    }
}

bulkSync();
