import { BaseCrudService } from './integrations/index';

async function debugRodolfo() {
    try {
        console.log('Querying System Users...');
        const res = await BaseCrudService.getAll<any>('usuariossistema');
        console.log(`Total users found: ${res.items.length}`);

        const rodolfoUsers = res.items.filter(u =>
            (u.name && u.name.toLowerCase().includes('rodolfo')) ||
            (u.emailLogin && u.emailLogin.toLowerCase().includes('rodolfo'))
        );

        console.log('--- Rodolfo Results ---');
        rodolfoUsers.forEach(u => {
            console.log(JSON.stringify(u, null, 2));
        });

        if (rodolfoUsers.length === 0) {
            console.log('No user containing "Rodolfo" found.');
            console.log('Listing all user names for reference:');
            res.items.forEach(u => console.log(`- ${u.name} (${u.emailLogin})`));
        }
    } catch (e) {
        console.error('Debug failed:', e);
    }
}

debugRodolfo();
