import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log('Fetching institutional data...');
    await page.goto('https://www.rsalesimoveis.com.br/', { waitUntil: 'networkidle2' });

    const institutionalData = await page.evaluate(() => {
        return {
            title: document.title,
            text: document.body.innerText.substring(0, 1000) // Getting some content to verify
        };
    });

    console.log('Institutional data extracted.', institutionalData);

    console.log('Fetching properties...');
    await page.goto('https://www.rsalesimoveis.com.br/imoveis', { waitUntil: 'networkidle2' });

    let allProperties = [];
    let hasNextPage = true;
    let pageNum = 1;

    while (hasNextPage && pageNum <= 10) { // Limit to 10 pages for safety
        console.log(`Scraping page ${pageNum}...`);

        // Auto-scroll to load images/elements if necessary
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 100;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    if (totalHeight >= scrollHeight - window.innerHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });

        const properties = await page.evaluate(() => {
            const cards = document.querySelectorAll('.property-card, .card-imovel, [class*="imovel"], article'); // Generic selectors, adapt as needed
            return Array.from(cards).map(card => {
                return {
                    text: card.innerText.replace(/\n+/g, ' ').substring(0, 200),
                    html: card.innerHTML.substring(0, 200)
                };
            });
        });

        console.log(`Found ${properties.length} properties on page ${pageNum}`);
        allProperties.push(...properties);

        // Try to find next page button
        const nextBtn = await page.$('.pagination .next, [aria-label="Next"], .nav--next');
        if (nextBtn) {
            await nextBtn.click();
            await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => new Promise(r => setTimeout(r, 2000)));
            pageNum++;
        } else {
            hasNextPage = false;
        }
    }

    fs.writeFileSync('reconcile_data.json', JSON.stringify({ institutionalData, allProperties }, null, 2));
    console.log('Scraping finished. Data saved to reconcile_data.json');
    await browser.close();
})();
