import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('debug_rsales.html', 'utf8');
const $ = cheerio.load(html);

// properties
const properties = [];
$('.property-card, .card, [class*="imovel"]').each((i, el) => {
    properties.push($(el).text().replace(/\s+/g, ' ').trim().substring(0, 100));
});
console.log('Total property card classes:', properties.length);
if (properties.length > 0) console.log('Sample:', properties[0]);

// Let's try to just find all a tags that link to properties
const links = [];
$('a').each((i, el) => {
    const href = $(el).attr('href');
    if (href && href.includes('/imovel/')) {
        links.push(href);
    }
});
console.log('Total property links:', Array.from(new Set(links)).length);

// Institutional
const aboutText = $('body').text().replace(/\s+/g, ' ');
console.log('Text snippet:', aboutText.substring(0, 200));

const address = $('div, span, p').filter((i, el) => $(el).text().includes('Rua') || $(el).text().includes('Av')).first().text();
console.log('Possible address:', address.substring(0, 100));
