import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log("Reading LocacaoCaucao.html...");
    let htmlContent = fs.readFileSync(path.join(__dirname, 'src/services/templates/LocacaoCaucao.html'), 'utf8');

    // Make the header dynamic
    htmlContent = htmlContent.replace(
        '<h3 style="text-align: center; color: #666; font-size: 16px; margin-top: -10px;">GARANTIA LOCATÍCIA: DEPÓSITO CAUÇÃO</h3>',
        `[[IF GARANTIA_CAUCAO]]
<h3 style="text-align: center; color: #666; font-size: 16px; margin-top: -10px;">GARANTIA LOCATÍCIA: DEPÓSITO CAUÇÃO</h3>
[[ENDIF]]
[[IF GARANTIA_FIANCA]]
<h3 style="text-align: center; color: #666; font-size: 16px; margin-top: -10px;">GARANTIA LOCATÍCIA: FIANÇA</h3>
[[ENDIF]]
[[IF GARANTIA_SEGURO]]
<h3 style="text-align: center; color: #666; font-size: 16px; margin-top: -10px;">GARANTIA LOCATÍCIA: SEGURO FIANÇA</h3>
[[ENDIF]]
[[IF GARANTIA_NENHUMA]]
<h3 style="text-align: center; color: #666; font-size: 16px; margin-top: -10px;">SEM GARANTIA LOCATÍCIA</h3>
[[ENDIF]]`
    );

    // Make LOCADORA dynamic
    htmlContent = htmlContent.replace(
        '<p><strong>LOCADORA:</strong>',
        '<p><strong>{{LOCADORES_LABEL}}:</strong>'
    );
    htmlContent = htmlContent.replace(
        '<p><strong>LOCATÁRIOS:</strong>',
        '<p><strong>{{LOCATARIOS_LABEL}}:</strong>'
    );

    // Update defaultTemplates.ts
    const defaultTemplatesPath = path.join(__dirname, 'src/services/templates/defaultTemplates.ts');
    let defaultTemplatesTs = `export const DEFAULT_TEMPLATES = {
    LocacaoResidencial: \`
${htmlContent}
    \`
};
`;
    fs.writeFileSync(defaultTemplatesPath, defaultTemplatesTs);
    console.log("Updated defaultTemplates.ts");

    // Update Prisma templates
    console.log("Updating ContractTemplates in database...");
    const result = await prisma.contractTemplate.updateMany({
        where: {
            tipoOperacao: 'LocacaoResidencial',
        },
        data: {
            conteudoHtml: htmlContent
        }
    });
    
    // Also update any templates named "Locação Residencial" just in case
    const result2 = await prisma.contractTemplate.updateMany({
        where: {
            nome: {
                contains: 'Locação Residencial'
            }
        },
        data: {
            conteudoHtml: htmlContent
        }
    });

    console.log(\`Updated \${result.count} templates by tipoOperacao, and \${result2.count} templates by name.\`);
    
    // Create it if there are 0 templates updated!
    if (result.count === 0 && result2.count === 0) {
        console.log("No templates found, creating one...");
        await prisma.contractTemplate.create({
            data: {
                nome: "Template Padrão Locação Residencial",
                categoria: "LOCACAO",
                tipoOperacao: "LocacaoResidencial",
                conteudoHtml: htmlContent,
                ativo: true,
                versao: 1
            }
        });
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
