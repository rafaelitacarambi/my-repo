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

export const mapForPrismaUpdate = (collection: string, item: any) => {
    if (collection === 'imoveis') {
        const updateData: any = {};

        if (item.tipoImovel !== undefined) updateData.type = item.tipoImovel;

        if (item.statusImovel !== undefined) {
            updateData.status = item.statusImovel === 'Ativo' ? 'AVAILABLE' : (item.statusImovel === 'Locado' ? 'RENTED' : (item.statusImovel === 'Vendido' ? 'SOLD' : 'UNAVAILABLE'));
        }

        if (item.resumoImovel !== undefined) updateData.title = item.resumoImovel;
        if (item.precoVenda !== undefined) updateData.salePrice = Number(item.precoVenda) || null;
        if (item.precoLocacao !== undefined) updateData.rentPrice = Number(item.precoLocacao) || null;
        if (item.valorCondominio !== undefined) updateData.condoPrice = Number(item.valorCondominio) || null;
        if (item.valorIPTU !== undefined) updateData.iptuPrice = Number(item.valorIPTU) || null;
        if (item.descricaoAnuncio !== undefined) updateData.description = item.descricaoAnuncio;
        if (item.galeriaFotos !== undefined) {
            updateData.images = item.galeriaFotos;
            if (item.galeriaFotos.length > 0) updateData.mainImage = item.galeriaFotos[0];
        }
        if (item.areaTotal !== undefined || item.areaTerreno !== undefined) updateData.areaTotal = Number(item.areaTerreno || item.areaTotal) || null;
        if (item.areaUtil !== undefined || item.areaConstruida !== undefined) updateData.areaUtil = Number(item.areaConstruida || item.areaUtil) || null;
        if (item.dormitorios !== undefined || item.quartos !== undefined) updateData.bedrooms = Number(item.dormitorios || item.quartos) || null;
        if (item.suites !== undefined) updateData.suites = Number(item.suites) || null;
        if (item.banheiros !== undefined) updateData.bathrooms = Number(item.banheiros) || null;
        if (item.vagasCobertas !== undefined || item.vagas !== undefined) updateData.garages = Number(item.vagasCobertas || item.vagas) || null;
        if (item.cep !== undefined) updateData.zipCode = item.cep;
        if (item.enderecoRua !== undefined || item.logradouro !== undefined) updateData.street = item.enderecoRua || item.logradouro;
        if (item.numero !== undefined) updateData.number = item.numero;
        if (item.enderecoComplemento !== undefined || item.complemento !== undefined) updateData.complement = item.enderecoComplemento || item.complemento;
        if (item.enderecoBairro !== undefined || item.bairro !== undefined) updateData.neighborhood = item.enderecoBairro || item.bairro;
        if (item.enderecoCidade !== undefined || item.cidade !== undefined) updateData.city = item.enderecoCidade || item.cidade;
        if (item.enderecoEstado !== undefined || item.estado !== undefined) updateData.state = item.enderecoEstado || item.estado;
        if (item.corretorResponsavelId !== undefined) updateData.ownerId = item.corretorResponsavelId;

        return updateData;
    }

    // Cleanup internal mock fields before DB update
    const cleaned = { ...item };
    delete cleaned._id;
    delete cleaned.id;
    delete cleaned._createdDate;
    delete cleaned._updatedDate;
    return cleaned;
}
