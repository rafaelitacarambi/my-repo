import { BaseCrudService } from './integrations/index';
// @ts-ignore
import { ContractTemplates } from './src/entities/index';

async function checkTemplates() {
    try {
        console.log('Checking templates in collection "templatescontratos"...');
        const res = await BaseCrudService.getAll<any>('templatescontratos');
        console.log('Total templates found:', res.items.length);
        res.items.forEach(t => {
            console.log(`- ID: ${t._id}, Name: ${t.templateName || t.name}, Type: ${t.contractType}, isActive: ${t.isActive}, ContentLen: ${t.templateContent?.length || 0}, BodyLen: ${t.templateBody?.length || 0}`);
        });

        if (res.items.length === 0) {
            console.log('WARNING: No templates found in the database!');
        }
    } catch (e) {
        console.error('Error checking templates:', e);
    }
}

checkTemplates();
