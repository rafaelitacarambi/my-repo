import { BaseCrudService } from './integrations/index';

async function checkSeededTemplate() {
    try {
        console.log('Checking database...');
        const res = await BaseCrudService.getAll<any>('templatescontratos');
        console.log(`Found ${res.items.length} templates.`);
        res.items.forEach(t => {
            console.log(`- Type: ${t.contractType}, Name: ${t.templateName}, Active: ${t.isActive}`);
        });
    } catch (e) {
        console.error('Check failed:', e);
    }
}

checkSeededTemplate();
