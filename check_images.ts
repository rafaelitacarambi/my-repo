import { BaseCrudService } from './src/integrations';

async function checkProperties() {
    try {
        const { items } = await BaseCrudService.getAll('imoveis');
        console.log('Total properties:', items.length);
        items.slice(0, 5).forEach(p => {
            console.log(`Property: ${p.propertyName}`);
            console.log(`- Status: ${p.statusImovel}`);
            console.log(`- Images:`, JSON.stringify(p.propertyImages));
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

checkProperties();
