import fs from 'fs';
import zlib from 'zlib';

const aspSession = 'my0ohgajxixstwuwttbqkdmt';
const gocSession = 'vjaphvtsvcljkbmaaaphftzrgyifybvr';
const cookieHeader = `ASP.NET_SessionId=${aspSession}; __goc_session__=${gocSession}`;
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function fetchDecompressed(url) {
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'User-Agent': userAgent,
            'Cookie': cookieHeader,
        }
    });

    const buffer = Buffer.from(await res.arrayBuffer());
    let text = '';
    try {
        if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
            text = zlib.unzipSync(buffer).toString('utf-8');
        } else {
            text = buffer.toString('utf-8');
        }
    } catch (e) {
        text = buffer.toString('utf-8');
    }
    return text;
}

async function run() {
    console.log('Fetching main dashboard...');
    const text = await fetchDecompressed('https://imob.valuegaia.com.br/');

    fs.writeFileSync('scripts/dashboard.html', text);
    console.log('Saved dashboard.html. Size:', text.length);

    // Look for links that might be the properties page
    const links = text.match(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi) || [];

    const propertyLinks = links.filter(l => l.toLowerCase().includes('imoveis') || l.toLowerCase().includes('imóveis'));
    console.log('Property related links:');
    propertyLinks.forEach(l => {
        const hrefMatch = l.match(/href=["']([^"']+)["']/);
        const href = hrefMatch ? hrefMatch[1] : '';
        const tMatch = l.match(/>([\s\S]*?)<\/a>/);
        const content = tMatch ? tMatch[1].replace(/<[^>]+>/g, '').trim() : '';
        console.log(`- ${content || '[Icon]'} => ${href}`);
    });

    // Look for potential API integrations
    const apiCalls = text.match(/['"](\/api\/[a-zA-Z0-9_/]+)['"]/gi);
    if (apiCalls) {
        console.log('API Endpoints found in HTML:', [...new Set(apiCalls)]);
    }
}

run();
