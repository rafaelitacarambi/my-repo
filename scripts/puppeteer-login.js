import puppeteer from 'puppeteer';
import fs from 'fs';

const email = 'terrassaimoveis@gmail.com';
const password = 'Mirian08*';

async function run() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,960']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 960 });

    // Spoof user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log('Navigating to login page...');
    await page.goto('https://signin.valuegaia.com.br/?provider=imob', { waitUntil: 'networkidle2' });

    console.log('Filling form...');
    await page.type('#email', email);
    await page.type('#password', password);

    console.log('Submitting...');
    await Promise.all([
        page.click('#enter-login'),
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }).catch(e => console.log('Navigation timeout, continuing anyway...'))
    ]);

    console.log('Current URL:', page.url());

    // Let's check if we landed on the dashboard
    if (page.url().includes('login-valida.aspx') || page.url().includes('/home') || page.url().includes('imob.valuegaia.com.br')) {
        console.log('Successfully navigated away from signin page!');

        // Wait a bit just in case it's loading a heavy dashboard
        await new Promise(r => setTimeout(r, 5000));
        console.log('Current URL after wait:', page.url());

        // Get all cookies
        const cookies = await page.cookies();
        fs.writeFileSync('scripts/valuegaia-cookies.json', JSON.stringify(cookies, null, 2));
        console.log(`Saved ${cookies.length} cookies to valuegaia-cookies.json`);

        // Try to find the API token in localStorage or window variables
        const ls = await page.evaluate(() => JSON.stringify(window.localStorage));
        fs.writeFileSync('scripts/valuegaia-ls.json', ls);
        console.log('Saved localStorage.');

    } else {
        console.log('Failed to login. URL is still:', page.url());
        // Check for error text
        const errorText = await page.evaluate(() => {
            const el = document.querySelector('#errorMessage, .alert, .bg-danger');
            return el ? el.innerText : 'No error message found';
        });
        console.log('Possible error:', errorText);
    }

    await browser.close();
}

run().catch(console.error);
