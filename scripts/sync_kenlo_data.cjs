// scripts/sync_kenlo_data.cjs
// Script to scrape and synchronize owner info and amenities from Kenlo to PostgreSQL

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Map from HTML checkbox ID to database amenity JSON keys
const MAP_FL_TO_AMENITY = {
  'fl_churrasqueira': 'churrasqueira',
  'fl_piscina': 'piscina',
  'fl_sauna': 'sauna',
  'fl_elevador': 'elevador',
  'fl_playground': 'playground',
  'fl_quadra_poliesportiva': 'quadraPoliesportiva',
  'fl_mobiliado': 'mobiliado',
  'fl_semi_mobiliado': 'mobiliado',
  'fl_ar': 'arCondicionado',
  'fl_quintal': 'quintal',
  'fl_jardim_inverno': 'jardim',
  'fl_varanda_gourmet': 'varandaGourmet',
  'fl_sacada': 'varandaGourmet',
  'fl_varanda': 'varandaGourmet',
  'fl_deposito': 'deposito',
  'fl_lareira': 'lareira',
  'fl_aquecimento_energia_solar': 'energiaSolar',
  'fl_armario_cozinha': 'cozinhaPlanejada',
  'fl_escritorio': 'escritorio',
  'fl_despensa': 'despensa',
  'fl_edicula': 'edicula',
  'fl_aceita_pet': 'aceitaPet',
  'fl_portao': 'fechaduraEletronica',
  'fl_ofuro': 'ofuro',
  'fl_hidro': 'suiteHidro',
  'fl_lavabo': 'banheira',
  'fl_dormitorio_reversivel': 'dormitorioReversivel',
  'fl_armario_closet': 'closet',
  'fl_pe_direito_duplo': 'peDireitoDuplo',
  'fl_copa': 'cozinhaAmericana',
  'fl_aquecimento_gas': 'aquecimentoGas',
  'fl_lavanderia': 'lavanderia',
  'fl_adega': 'adega',
  'fl_vestiario': 'vestiario',
  'fl_solarium': 'solarium'
};

function formatPhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 9) {
    return `(11) ${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  if (digits.length === 8) {
    return `(11) ${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  return phone;
}

async function main() {
  const args = process.argv.slice(2);
  const isTrial = args.includes('--trial');

  console.log('=== STARTING KENLO DATA SYNCHRONIZATION ===');
  if (isTrial) {
    console.log('Mode: TRIAL (first 5 properties only)\n');
  } else {
    console.log('Mode: FULL RUN\n');
  }

  // 1. Load listings map
  const listingsPath = path.join(__dirname, '../scratch/all_listings.json');
  if (!fs.existsSync(listingsPath)) {
    console.error(`Error: Mapped listings file not found at ${listingsPath}`);
    console.error('Please run fetch_all_listings script first.');
    process.exit(1);
  }
  const listings = JSON.parse(fs.readFileSync(listingsPath, 'utf-8'));
  console.log(`Loaded ${listings.length} mapped listings from Kenlo.`);

  // 2. Load DB properties
  const dbProperties = await prisma.property.findMany();
  console.log(`Loaded ${dbProperties.length} properties from PostgreSQL.\n`);

  // Build reference map (code -> internal listing)
  const listingsMap = new Map();
  for (const item of listings) {
    if (item.property_reference) {
      listingsMap.set(item.property_reference.toUpperCase(), item);
    }
  }

  // Filter properties to sync
  let propertiesToSync = [];
  for (const dbProp of dbProperties) {
    const code = (dbProp.code || '').toUpperCase();
    const listingItem = listingsMap.get(code);
    if (listingItem) {
      propertiesToSync.push({
        dbId: dbProp.id,
        code: dbProp.code,
        internalId: listingItem.id
      });
    }
  }

  console.log(`Matched ${propertiesToSync.length} properties between DB and Kenlo.`);
  if (propertiesToSync.length === 0) {
    console.log('No matched properties found. Exiting.');
    return;
  }

  if (isTrial) {
    propertiesToSync = propertiesToSync.slice(0, 5);
    console.log(`Trial limit applied. Will sync: ${propertiesToSync.map(p => p.code).join(', ')}`);
  }

  // 3. Launch Puppeteer
  const cookiesPath = path.join(__dirname, 'valuegaia-cookies.json');
  if (!fs.existsSync(cookiesPath)) {
    console.error(`Error: Cookies file not found at ${cookiesPath}`);
    process.exit(1);
  }
  const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf-8'));

  console.log('\nLaunching browser...');
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,960']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 960 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  console.log('Setting cookies...');
  await page.setCookie(...cookies);

  console.log('Navigating to ValueGaia to activate session...');
  await page.goto('https://imob.valuegaia.com.br/admin/default.aspx#/home', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6000));

  // Verify login status
  const isLoggedIn = await page.evaluate(async () => {
    try {
      const res = await fetch('https://imob.valuegaia.com.br/admin/json/menu/menu.ashx?method=GetMainMenu');
      return res.ok;
    } catch (e) {
      return false;
    }
  });

  if (!isLoggedIn) {
    console.error('Error: Session is expired or invalid. Please refresh session cookies.');
    await browser.close();
    process.exit(1);
  }
  console.log('Session verified successfully. Starting scraping loop...\n');

  // 4. Scrape loop in chunks
  const chunkSize = 5;
  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < propertiesToSync.length; i += chunkSize) {
    const chunk = propertiesToSync.slice(i, i + chunkSize);
    console.log(`Processing batch ${Math.floor(i / chunkSize) + 1}/${Math.ceil(propertiesToSync.length / chunkSize)}...`);

    const chunkIds = chunk.map(c => c.internalId);
    
    // Fetch batch pages HTML in browser context
    const fetchResults = await page.evaluate(async (ids) => {
      const fetchPage = async (id) => {
        try {
          const res = await fetch(`https://imob.valuegaia.com.br/admin/modules/imoveis_beta/imovel-alterar.aspx?id=${id}`);
          if (!res.ok) return { id, success: false, error: `HTTP status ${res.status}` };
          const html = await res.text();
          return { id, success: true, html };
        } catch (e) {
          return { id, success: false, error: e.message };
        }
      };
      return Promise.all(ids.map(fetchPage));
    }, chunkIds);

    // Process and parse HTML in Node.js context
    for (const res of fetchResults) {
      const propInfo = chunk.find(c => c.internalId === res.id);
      if (!propInfo) continue;

      if (!res.success) {
        console.error(`  [FAILED] ${propInfo.code} (ID: ${res.id}): Fetch failed: ${res.error}`);
        failedCount++;
        continue;
      }

      try {
        const html = res.html;

        // Extract Owner Name
        const nameMatch = html.match(/id="txProprietario"\s+[^>]*value="([^"]*)"/i) || 
                          html.match(/value="([^"]*)"\s+[^>]*id="txProprietario"/i);
        const ownerName = nameMatch ? nameMatch[1].trim() : null;

        // Extract Owner Phone
        const phoneSection = html.match(/nfones:\s*\[([\s\S]*?)\]/);
        let rawPhone = null;
        if (phoneSection) {
          const phoneMatches = phoneSection[1].matchAll(/value:\s*['"]([^'"]*)['"]/g);
          for (const pm of phoneMatches) {
            const val = pm[1].trim();
            if (val) {
              rawPhone = val;
              break;
            }
          }
        }
        const formattedPhone = formatPhone(rawPhone);

        // Extract Owner Email
        const emailSection = html.match(/nemails:\s*\[([\s\S]*?)\]/);
        let ownerEmail = null;
        if (emailSection) {
          const emailMatches = emailSection[1].matchAll(/value:\s*['"]([^'"]*)['"]/g);
          for (const em of emailMatches) {
            const val = em[1].trim();
            if (val) {
              ownerEmail = val;
              break;
            }
          }
        }

        // Extract checked checkboxes (Amenities)
        const checkedAmenities = {};
        const checkboxRegex = /<input[^>]*type="checkbox"[^>]*>/gi;
        let cbMatch;
        while ((cbMatch = checkboxRegex.exec(html)) !== null) {
          const tag = cbMatch[0];
          if (tag.includes('checked')) {
            const idMatch = tag.match(/id="([^"]+)"/i);
            if (idMatch) {
              const id = idMatch[1];
              const amenityField = MAP_FL_TO_AMENITY[id];
              if (amenityField) {
                checkedAmenities[amenityField] = true;
              }
            }
          }
        }

        // Clean up empty amenities object to undefined if empty, or keep empty object
        const finalAmenities = Object.keys(checkedAmenities).length > 0 ? checkedAmenities : null;

        // Update Prisma DB
        await prisma.property.update({
          where: { id: propInfo.dbId },
          data: {
            nomeProprietario: ownerName,
            telefoneProprietario: formattedPhone,
            emailProprietario: ownerEmail,
            amenidades: finalAmenities
          }
        });

        console.log(`  [SUCCESS] ${propInfo.code} (ID: ${res.id}): Owner: "${ownerName || 'N/A'}", Phone: "${formattedPhone || 'N/A'}", Email: "${ownerEmail || 'N/A'}", Amenities: ${Object.keys(checkedAmenities).length}`);
        successCount++;

      } catch (err) {
        console.error(`  [ERROR] ${propInfo.code} (ID: ${res.id}) during parse/DB update: ${err.message}`);
        failedCount++;
      }
    }

    // Delay between batches to prevent rate limit
    await new Promise(r => setTimeout(r, 1000));
  }

  await browser.close();

  console.log('\n=== RUN SUMMARY ===');
  console.log(`Success: ${successCount}`);
  console.log(`Failed/Skipped: ${failedCount}`);
  console.log('====================');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
