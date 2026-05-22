import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const newTemplate = await prisma.contractTemplate.create({
            data: {
                nome: "Teste via Script",
                categoria: "LOCACAO",
                tipoOperacao: "Locacao",
                subtipo: "Comercial",
                garantia: "FIADOR",
                conteudoHtml: "<p>Teste</p>",
                variaveisDetectadas: ["nome", "cpf"],
                ativo: true,
            },
        });
        console.log("Template salvo com sucesso:", newTemplate);
    } catch (error) {
        console.error("Erro ao salvar template:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
