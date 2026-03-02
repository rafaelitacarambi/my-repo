import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapeamento das coleções antigas Mockadas para tabelas Prisma
const resolveModel = (collectionId: string) => {
    switch (collectionId) {
        case 'imoveis': return prisma.property;
        case 'clientes':
        case 'leads': return prisma.client;
        case 'usuariossistema': return prisma.user;
        case 'contratos': return prisma.contract;
        case 'cobrancas': return prisma.invoice;
        default: return null;
    }
}

export const GET: APIRoute = async ({ params, request }) => {
    const { collection } = params;
    const model = resolveModel(collection as string);
    if (!model) return new Response(JSON.stringify({ error: `Not implemented for ${collection}` }), { status: 404 });

    try {
        // Implementação extremamente simplificada de getAll (com bypass em filtros complexos por hora)
        // @ts-ignore
        const items = await model.findMany({
            take: 200,
            orderBy: { createdAt: 'desc' }
        });

        const mappedItems = items.map((item: any) => mapForFrontend(collection as string, item));

        return new Response(JSON.stringify({
            items: mappedItems,
            totalCount: items.length,
            hasNext: false,
            currentPage: 0,
            pageSize: items.length
        }), { status: 200 });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

export const POST: APIRoute = async ({ params, request }) => {
    const { collection } = params;
    const model = resolveModel(collection as string);
    if (!model) return new Response(JSON.stringify({ error: `Not implemented for ${collection}` }), { status: 404 });

    try {
        const body = await request.json();
        const dataForPrisma = mapForPrismaCreate(collection as string, body);

        // @ts-ignore
        const created = await model.create({ data: dataForPrisma });
        return new Response(JSON.stringify(created), { status: 201 });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

const mapForPrismaCreate = (collection: string, item: any) => {
    if (collection === 'imoveis') {
        const typeStr = item.tipoImovel || 'Casa';
        const isLoc = item.pretensao?.includes('Locação');
        const isVen = item.pretensao?.includes('Venda') || !item.pretensao;
        const mappedStatus = item.statusImovel === 'Ativo' ? 'AVAILABLE' : (item.statusImovel === 'Locado' ? 'RENTED' : (item.statusImovel === 'Vendido' ? 'SOLD' : 'UNAVAILABLE'));

        return {
            id: item._id || crypto.randomUUID(),
            code: item.codigoReference || item.codImovel || `MCK-NEW-${Date.now()}`,
            title: item.resumoImovel || 'Novo Imóvel',
            type: typeStr,
            status: mappedStatus,
            salePrice: isVen ? (Number(item.precoVenda) || null) : null,
            rentPrice: isLoc ? (Number(item.precoLocacao) || null) : null,
            condoPrice: Number(item.valorCondominio) || null,
            iptuPrice: Number(item.valorIPTU) || null,
            description: item.descricaoAnuncio || null,
            mainImage: (item.propertyImages && item.propertyImages.length > 0) ? item.propertyImages[0] : (item.galeriaFotos && item.galeriaFotos.length > 0 ? item.galeriaFotos[0] : null),
            images: item.galeriaFotos || [],
            areaTotal: Number(item.areaTerreno || item.areaTotal) || null,
            areaUtil: Number(item.areaConstruida || item.areaUtil) || null,
            bedrooms: Number(item.dormitorios || item.quartos) || null,
            suites: Number(item.suites) || null,
            bathrooms: Number(item.banheiros) || null,
            garages: Number(item.vagasCobertas || item.vagas) || null,
            zipCode: item.cep || null,
            street: item.enderecoRua || item.logradouro || null,
            number: item.numero || null,
            complement: item.enderecoComplemento || item.complemento || null,
            neighborhood: item.enderecoBairro || item.bairro || null,
            city: item.enderecoCidade || item.cidade || null,
            state: item.enderecoEstado || item.estado || null,
            ownerId: item.corretorResponsavelId || null
        }
    }
    // Repassa raw as is e espera que as props coincidam (Aviso: para funcionar 100% de imediato vamos aceitar erros e adaptar caso a caso)
    return { ...item, id: item._id || crypto.randomUUID() };
}

export const mapForFrontend = (collection: string, row: any) => {
    if (collection === 'imoveis' && row) {
        return {
            ...row,
            _id: row.id,
            codigoReference: row.code,
            codImovel: row.code,
            resumoImovel: row.title,
            tipoImovel: row.type,
            statusImovel: row.status === 'AVAILABLE' ? 'Ativo' : (row.status === 'RENTED' ? 'Locado' : (row.status === 'SOLD' ? 'Vendido' : 'Suspenso')),
            precoVenda: row.salePrice,
            precoLocacao: row.rentPrice,
            valorCondominio: row.condoPrice,
            valorIPTU: row.iptuPrice,
            descricaoAnuncio: row.description,
            propertyImages: row.mainImage ? [row.mainImage] : [],
            galeriaFotos: row.images || [],
            areaTotal: row.areaTotal,
            areaConstruida: row.areaUtil,
            areaUtil: row.areaUtil,
            dormitorios: row.bedrooms,
            quartos: row.bedrooms,
            suites: row.suites,
            banheiros: row.bathrooms,
            vagas: row.garages,
            vagasCobertas: row.garages,
            cep: row.zipCode,
            enderecoRua: row.street,
            logradouro: row.street,
            numero: row.number,
            complemento: row.complement,
            enderecoComplemento: row.complement,
            bairro: row.neighborhood,
            enderecoBairro: row.neighborhood,
            cidade: row.city,
            enderecoCidade: row.city,
            estado: row.state,
            enderecoEstado: row.state,
            _createdDate: row.createdAt,
            _updatedDate: row.updatedAt,
            corretorResponsavelId: row.ownerId,
        };
    }
    return { ...row, _id: row.id || row._id, _createdDate: row.createdAt, _updatedDate: row.updatedAt };
}

