import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log('Fetching properties page to bypass Cloudflare/JS challenge...');
        await page.goto('https://www.rsalesimoveis.com.br/imoveis', { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait for challenge to pass
        await new Promise(r => setTimeout(r, 5000));

        console.log('Fetching properties API...');

        let allProperties = [];
        let pageNum = 1;
        let hasNext = true;

        while (hasNext && pageNum <= 30) {
            console.log(`Fetching page ${pageNum}...`);
            const data = await page.evaluate(async (p) => {
                try {
                    const res = await fetch(`/api/listings?pagina=${p}`, {
                        headers: {
                            'x-requested-with': 'XMLHttpRequest',
                            'referer': 'https://www.rsalesimoveis.com.br/imoveis'
                        }
                    });
                    return await res.json();
                } catch (e) {
                    return { error: e.message };
                }
            }, pageNum);

            if (data.error) {
                console.error('API Error:', data.error);
                break;
            }

            const items = data.data || [];
            if (items.length > 0) {
                allProperties.push(...items);
                console.log(`Found ${items.length} properties.`);
                pageNum++;
            } else {
                console.log('No more properties found.');
                hasNext = false;
            }

            // small delay
            await new Promise(r => setTimeout(r, 1000));
        }

        fs.writeFileSync('reconcile_api.json', JSON.stringify(allProperties, null, 2));
        console.log('Saved to reconcile_api.json');
        await browser.close();
    } catch (error) {
        console.error('ERROR:', error);
        process.exit(1);
    }
})();
