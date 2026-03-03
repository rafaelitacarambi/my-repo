import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log('Fetching properties page...');
        await page.goto('https://www.rsalesimoveis.com.br/imoveis', { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait for 2 seconds just in case of dynamic loading
        await new Promise(r => setTimeout(r, 2000));

        await page.screenshot({ path: 'debug_rsales.png', fullPage: true });

        const html = await page.content();
        fs.writeFileSync('debug_rsales.html', html);

        console.log('Saved debug_rsales.png and debug_rsales.html');
        await browser.close();
    } catch (error) {
        console.error('PUPPETEER ERROR:', error);
        process.exit(1);
    }
})();
