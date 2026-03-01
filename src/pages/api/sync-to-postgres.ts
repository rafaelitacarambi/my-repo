import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const POST: APIRoute = async ({ request }) => {
    try {
        const data = await request.json();
        const { collectionId, items } = data;

        if (!items || !Array.isArray(items)) {
            return new Response(JSON.stringify({ error: 'Invalid items array' }), { status: 400 });
        }

        let successCount = 0;

        if (collectionId === 'imoveis') {
            for (const item of items) {
                await prisma.property.upsert({
                    where: { id: item._id || crypto.randomUUID() },
                    create: {
                        id: item._id,
                        code: item.codigoReference || `MOCK-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                        title: item.resumoImovel || 'Imóvel sem título',
                        type: item.tipoImovel || 'Imóvel',
                        status: item.status === 'Vendido' || item.status === 'Alugado' ? 'SOLD' : 'AVAILABLE',
                        salePrice: Number(item.precoVenda) || null,
                        rentPrice: Number(item.precoLocacao) || null,
                        condoPrice: Number(item.valorCondominio) || null,
                        iptuPrice: Number(item.valorIPTU) || null,
                        areaTotal: Number(item.areaTotal) || null,
                        areaUtil: Number(item.areaUtil) || null,
                        bedrooms: Number(item.quartos) || null,
                        suites: Number(item.suites) || null,
                        bathrooms: Number(item.banheiros) || null,
                        garages: Number(item.vagas) || null,
                        zipCode: item.enderecoCep || null,
                        street: item.logradouro || item.enderecoRua || null,
                        number: item.numero || null,
                        complement: item.complemento || item.enderecoComplemento || null,
                        neighborhood: item.bairro || item.enderecoBairro || null,
                        city: item.cidade || item.enderecoCidade || null,
                        state: item.estado || 'SP',
                    },
                    update: {
                        title: item.resumoImovel || 'Imóvel sem título',
                        salePrice: Number(item.precoVenda) || null,
                        rentPrice: Number(item.precoLocacao) || null,
                    }
                });
                successCount++;
            }
        } else if (collectionId === 'usuariossistema') {
            for (const item of items) {
                if (!item.emailLogin) continue;
                await prisma.user.upsert({
                    where: { email: item.emailLogin },
                    create: {
                        id: item._id,
                        name: item.name || 'Usuário',
                        email: item.emailLogin,
                        role: item.profile === 'Admin' ? 'ADMIN' : 'USER',
                        status: item.ativo ? 'ACTIVE' : 'INACTIVE',
                    },
                    update: {
                        name: item.name || 'Usuário',
                        role: item.profile === 'Admin' ? 'ADMIN' : 'USER',
                    }
                });
                successCount++;
            }
        } else if (collectionId === 'clientes' || collectionId === 'leads') {
            for (const item of items) {
                if (!item._id) continue;
                await prisma.client.upsert({
                    where: { id: item._id },
                    create: {
                        id: item._id,
                        name: item.nome || item.name || item.firstName || 'Cliente',
                        email: item.email || null,
                        phone: item.telefone || item.celular || item.phone || null,
                        document: item.cpf || item.cnpj || item.documento || null,
                        type: collectionId === 'leads' ? 'LEAD' : 'TENANT',
                    },
                    update: {
                        name: item.nome || item.name || item.firstName || 'Cliente',
                        email: item.email || null,
                    }
                });
                successCount++;
            }
        }

        return new Response(JSON.stringify({ success: true, imported: successCount }), { status: 200 });
    } catch (err: any) {
        console.error("Schema sync error:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
