import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('debug_rsales.html', 'utf8');
const $ = cheerio.load(html);

console.log('--- INSTITUTIONAL DATA ---');

const phones = [];
$('a[href^="tel:"]').each((i, el) => phones.push($(el).text().trim()));
console.log('Phones:', Array.from(new Set(phones)).filter(Boolean).join(', '));

const whatsapp = [];
$('a[href*="wa.me"], a[href*="whatsapp"]').each((i, el) => whatsapp.push($(el).attr('href')));
console.log('WhatsApp links:', Array.from(new Set(whatsapp)).filter(Boolean).join(', '));

const emails = [];
$('a[href^="mailto:"]').each((i, el) => emails.push($(el).text().trim()));
console.log('Emails:', Array.from(new Set(emails)).filter(Boolean).join(', '));

const social = [];
$('a[href*="instagram.com"], a[href*="facebook.com"], a[href*="youtube.com"]').each((i, el) => social.push($(el).attr('href')));
console.log('Social Media:', Array.from(new Set(social)).filter(Boolean).join(', '));

const addresses = [];
$('address, .address, p:contains("Rua"), p:contains("Av")').each((i, el) => {
    const text = $(el).text().trim();
    if (text.length > 10 && text.length < 200) addresses.push(text.replace(/\s+/g, ' '));
});
console.log('Potential Addresses:', Array.from(new Set(addresses)).join(' | '));

const aboutTexts = [];
$('.about, #about, section:contains("Sobre")').each((i, el) => {
    const text = $(el).text().trim();
    if (text.length > 50) aboutTexts.push(text.replace(/\s+/g, ' '));
});
console.log('About snippets:', aboutTexts.slice(0, 2).join(' | '));
