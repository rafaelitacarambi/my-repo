const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const http = require('http');
const https = require('https');

async function checkUrl(url) {
    return new Promise((resolve) => {
        if (!url || typeof url !== 'string') return resolve(false);
        const protocol = url.startsWith('https') ? https : http;
        try {
            const req = protocol.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
                resolve(res.statusCode >= 200 && res.statusCode < 400);
            });
            req.on('error', () => resolve(false));
            req.on('timeout', () => { req.destroy(); resolve(false); });
            req.end();
        } catch (e) {
            resolve(false);
        }
    });
}

async function auditPhotos() {
    console.log("Iniciando auditoria de fotos de imóveis...");
    const properties = await prisma.property.findMany();

    let totalProperties = properties.length;
    let propertiesWithoutPhotos = 0;
    let propertiesWithMediaError = 0;
    let propertiesWithMissingStorage = 0; // Se aplicável na lógica local

    const report = [];

    for (const property of properties) {
        let status = 'OK';
        let isMissingPhotos = false;
        let hasMediaError = false;
        let photosCount = 0;

        let images = property.images;

        // Tratar array JSON do Prisma
        if (typeof images === 'string') {
            try {
                images = JSON.parse(images);
            } catch (e) {
                images = [];
            }
        }

        if (!Array.isArray(images)) images = [];

        // Verifica a quantidade
        photosCount = images.length;
        if (photosCount === 0 && !property.mainImage) {
            isMissingPhotos = true;
            status = 'Sem Fotos';
            propertiesWithoutPhotos++;
        } else {
            // Se existem fotos, vamos testar apenas a primeira por otimização de tempo por enquanto, ou todas dependendo do caso.
            // Para ser 100% rigoroso:
            let allUrlsValid = true;
            const urlsToCheck = property.mainImage ? [property.mainImage, ...images] : images;

            for (const url of urlsToCheck) {
                if (typeof url !== 'string') continue;
                // Excluindo base64 do check de proxy web
                if (url.startsWith('data:image')) continue;

                const isValid = await checkUrl(url);
                if (!isValid) {
                    allUrlsValid = false;
                    break;
                }
            }

            if (!allUrlsValid) {
                hasMediaError = true;
                status = 'Erro de Mídia (URL Quebrada)';
                propertiesWithMediaError++;
            }
        }

        report.push({
            id: property.id,
            codigo: property.code,
            endereco: property.street ? `${property.street}, ${property.number || 'S/N'}` : 'N/A',
            quantidade_fotos: photosCount + (property.mainImage && !images.includes(property.mainImage) ? 1 : 0),
            status: status
        });

        // Debugging progress logging
        if (report.length % 50 === 0) {
            console.log(`Verificados ${report.length} de ${totalProperties}...`);
        }
    }

    // Gerar relatorio em markdown ou JSON
    let reportMd = `# Relatório de Auditoria de Fotos (${new Date().toLocaleString()})\n\n`;
    reportMd += `- **Total de Imóveis**: ${totalProperties}\n`;
    reportMd += `- **Imóveis SEM fotos**: ${propertiesWithoutPhotos}\n`;
    reportMd += `- **Imóveis COM ERRO de mídia (URL quebrada)**: ${propertiesWithMediaError}\n\n`;
    reportMd += `## Detalhamento de Problemas:\n`;

    report.filter(r => r.status !== 'OK').forEach(p => {
        reportMd += `- **[${p.codigo}]** ID: \`${p.id}\` | Endereço: ${p.endereco} | Fotos: ${p.quantidade_fotos} | **Status: ${p.status}**\n`;
    });

    fs.writeFileSync('reports/auditoria_fotos.md', reportMd);
    fs.writeFileSync('reports/auditoria_fotos.json', JSON.stringify(report, null, 2));

    console.log("\\nAuditoria concluída com sucesso!");
    console.log(`Relatórios gerados em: reports/auditoria_fotos.md e json`);
}

auditPhotos().catch(e => {
    console.error("Erro fatal durante a auditoria:", e);
}).finally(() => {
    prisma.$disconnect();
});
