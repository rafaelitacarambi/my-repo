import { publicProperty } from '@/lib/public-property';
import { requireAdmin } from '@/lib/require-admin';
import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

// Mapeamento das coleções antigas Mockadas para tabelas Prisma
const resolveModel = (collectionId: string) => {
    switch (collectionId) {
        case 'imoveis': return prisma.property;
        case 'leads':
        case 'clientes': return prisma.client;
        case 'leadsdecontato': return prisma.lead;
        case 'usuariossistema': return prisma.user;
        case 'contratos': return prisma.contract;
        case 'cobrancas': return prisma.invoice;
        default: return null;
    }
}

export const GET: APIRoute = async ({ params, request, locals }) => {
    if (params.collection === 'usuariossistema') {
        const denied = await requireAdmin(request);
        if (denied) return denied;
    }
    const { collection } = params;
    const model = resolveModel(collection as string);
    if (!model) return new Response(JSON.stringify({ error: `Not implemented for ${collection}` }), { status: 404 });

    try {
        const { searchParams } = new URL(request.url);
        const filterField = searchParams.get('filterField');
        const filterValue = searchParams.get('filterValue');

        let whereClause = {};
        if (filterField && filterValue) {
            whereClause = { [filterField]: filterValue };
        }

        const isPublic = collection === 'imoveis' && !(locals as any)?.propertyStaffAccess;
        if (isPublic) whereClause = { AND: [whereClause, { status: 'AVAILABLE' }] };

        // Return all fields for all collections by default to ensure all metadata is sent to frontend
        let queryOptions: any = {
            where: whereClause,
            take: 2000,
            orderBy: { createdAt: 'desc' }
        };

        // @ts-ignore
        const items = await model.findMany(queryOptions);

        const mappedItems = items.map((item: any) => {
            const mapped = mapForFrontend(collection as string, item);
            return isPublic ? publicProperty(mapped) : mapped;
        });

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
    if (params.collection === 'usuariossistema') {
        const denied = await requireAdmin(request);
        if (denied) return denied;
    }
    const { collection } = params;
    const model = resolveModel(collection as string);
    if (!model) return new Response(JSON.stringify({ error: `Not implemented for ${collection}` }), { status: 404 });

    try {
        const body = await request.json();

        let dataForPrisma: any = {};
        if (collection === 'usuariossistema') {
            const temp = mapForPrismaCreate(collection, body);
            // extract values for upsert
            const created = await prisma.user.upsert({
                where: { email: temp.email },
                create: {
                    id: temp.id,
                    clerkId: temp.clerkId,
                    name: temp.name,
                    email: temp.email,
                    role: temp.role,
                    status: temp.status,
                    setores: temp.setores || [],
                    unidadeRef: temp.unidadeRef,
                    memberRef: temp.memberRef,
                    ativo: temp.ativo ?? true
                },
                update: {
                    clerkId: temp.clerkId || undefined,
                    name: temp.name,
                    role: temp.role,
                    status: temp.status,
                    setores: temp.setores || [],
                    unidadeRef: temp.unidadeRef,
                    memberRef: temp.memberRef,
                    ativo: temp.ativo ?? true
                }
            });
            return new Response(JSON.stringify(mapForFrontend(collection, created)), { status: 201 });
        }

        dataForPrisma = mapForPrismaCreate(collection as string, body);

        // @ts-ignore
        const created = await model.create({ data: dataForPrisma });
        return new Response(JSON.stringify(mapForFrontend(collection, created)), { status: 201 });
    } catch (err: any) {
        console.error('Error in POST', collection, err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

export const mapForPrismaCreate = (collection: string, item: any) => {
    if (collection === 'imoveis') {
        const typeStr = item.tipoImovel || 'Casa';
        const mappedStatus = item.statusImovel === 'Ativo' ? 'AVAILABLE' : (item.statusImovel === 'Locado' ? 'RENTED' : (item.statusImovel === 'Vendido' ? 'SOLD' : (item.statusImovel === 'Suspenso' ? 'UNAVAILABLE' : 'AVAILABLE')));

        // Coletar amenidades (campos booleanos do formulário)
        const AMENITY_FIELDS = [
            'mobiliado','dormitorioReversivel','escritorio','aceitaPet','edicula','despensa','adega',
            'lavanderia','vestiario','closet','suiteHidro','banheira','peDireitoDuplo','homeOffice',
            'salaEstar','cozinhaAmericana','cozinhaPlanejada','ilha','lareira','arCondicionado',
            'aquecimentoGas','energiaSolar','automacao','iluminacaoLed','persianas','fechaduraEletronica',
            'deposito','quintal','jardim','pergolado','espacoZen','firePit','redario','pomar','horta',
            'espacoPet','canil','lounge','gazebo','espacoDescanso','solarium','churrasqueira',
            'varandaGourmet','piscina','ofuro','sauna','playground','quadraPoliesportiva','salaoFestas',
            'academia','piscinaCondominio','spa','cinema','coworking','biblioteca','loungeCondominio',
            'vagasVisitantes','carroEletrico','bicicletario','portaria24h','seguranca','elevador',
            'acessibilidade','coletaSeletiva','reusoAgua','captacaoChuva','telhadoVerde',
            'ventilacaoCruzada','iluminacaoNatural','tratamentoAcustico','isolamentoTermico'
        ];
        const amenidades: Record<string, boolean> = {};
        for (const field of AMENITY_FIELDS) {
            if (item[field] === true) amenidades[field] = true;
        }

        return {
            id: item._id || crypto.randomUUID(),
            code: item.codigoReference || item.codImovel || `MCK-NEW-${Date.now()}`,
            title: item.resumoImovel || 'Novo Imóvel',
            type: typeStr,
            finalidade: item.finalidade || null,
            pretensao: item.pretensao || null,
            status: mappedStatus,
            situacaoImovel: item.situacaoImovel || null,
            midiaOrigem: item.midiaOrigem || null,
            // Valores
            salePrice: Number(item.precoVenda) || null,
            rentPrice: Number(item.precoLocacao) || null,
            condoPrice: Number(item.valorCondominio) || null,
            iptuPrice: Number(item.valorIPTU) || null,
            periodicidadeIPTU: item.periodicidadeIPTU || 'Anual',
            entradaMinimaEstimada: Number(item.entradaMinimaEstimada) || null,
            pacoteLocacao: Number(item.pacoteLocacao) || null,
            // Flags
            aceitaFinanciamento: item.aceitaFinanciamento === true,
            aceitaFgts: item.aceitaFgts === true,
            imovelCondominio: item.imovelCondominio === true,
            investimentoOportunidade: item.investimentoOportunidade === true,
            permiteFinanciamento: item.permiteFinanciamento !== false,
            // Conteúdo
            description: item.descricaoAnuncio || item.description || null,
            mainImage: (item.propertyImages && item.propertyImages.length > 0) ? item.propertyImages[0] : (item.galeriaFotos && item.galeriaFotos.length > 0 ? item.galeriaFotos[0] : null),
            images: item.galeriaFotos || item.images || [],
            areaTotal: Number(item.areaTerreno || item.areaTotal) || null,
            areaUtil: Number(item.areaConstruida || item.areaUtil) || null,
            bedrooms: Number(item.dormitorios || item.quartos) || null,
            suites: Number(item.suites) || null,
            bathrooms: Number(item.banheiros) || null,
            garages: Number(item.vagasCobertas || item.vagas) || null,
            amenidades: Object.keys(amenidades).length > 0 ? amenidades : undefined,
            // Endereço
            zipCode: item.cep || null,
            street: item.enderecoRua || item.logradouro || null,
            number: item.numero || null,
            complement: item.enderecoComplemento || item.complemento || null,
            neighborhood: item.enderecoBairro || item.bairro || null,
            city: item.enderecoCidade || item.cidade || null,
            state: item.enderecoEstado || item.estado || null,
            // Proprietário
            nomeProprietario: item.nomeProprietario || null,
            telefoneProprietario: item.telefoneProprietario || null,
            emailProprietario: item.emailProprietario || null,
            ownerId: item.corretorResponsavelId || null
        }
    }

    if (collection === 'clientes' || collection === 'leads') {
        return {
            id: item._id || crypto.randomUUID(),
            name: item.clientName || item.nomeFantasia || item.nomeRazaoSocial || item.name || 'Sem Nome',
            email: item.email || item.emailPrincipal || null,
            phone: item.phoneNumber || item.telefonePrincipal || item.whatsAppPrincipal || item.phone || null,
            document: item.cpfCnpj || item.document || null,
            type: item.type || (collection === 'leads' ? 'LEAD' : 'CLIENT'),
            address: item.address || null,
            status: item.status || 'Ativo',
            papeis: item.papeis || null,
            notes: item.notes || null,
            gender: item.gender || null,
            canalOrigem: item.canalOrigem || null,
            responsavelInternoId: item.responsavelInternoId || null,
            rg: item.rg || null,
            nationality: item.nationality || null,
            maritalStatus: item.maritalStatus || null,
            profession: item.profession || null,
        };
    }

    if (collection === 'leadsdecontato') {
        return {
            id: item._id || crypto.randomUUID(),
            client: { connect: { id: item.clientePrincipalRef || item.clientRef || item.clientId } },
            fullName: item.fullName || 'Sem Nome',
            email: item.email || null,
            phoneNumber: item.phoneNumber || null,
            interessePrincipal: item.interessePrincipal || 'Não especificado',
            tipoImovelDesejado: item.tipoImovelDesejado || null,
            cidadeDesejada: item.cidadeDesejada || null,
            bairroDesejado: item.bairroDesejado || null,
            faixaValorMin: item.faixaValorMin ? Number(item.faixaValorMin) : null,
            faixaValorMax: item.faixaValorMax ? Number(item.faixaValorMax) : null,
            potencialEntrada: item.potencialEntrada ? Number(item.potencialEntrada) : null,
            rendaBruta: item.rendaBruta ? Number(item.rendaBruta) : null,
            perfilCompra: item.perfilCompra || null,
            urgencia: item.urgencia || null,
            leadStatus: item.leadStatus || 'Novo',
            statusFunil: item.statusFunil || 'Novo',
            leadSource: item.leadSource || 'Área Restrita',
            submissionDate: item.submissionDate instanceof Date ? item.submissionDate : (item.submissionDate ? new Date(item.submissionDate) : new Date()),
            ultimaInteracao: item.ultimaInteracao instanceof Date ? item.ultimaInteracao : (item.ultimaInteracao ? new Date(item.ultimaInteracao) : new Date()),
            responsavelRef: item.responsavelRef || null,
            unidadeRef: item.unidadeRef || null,
        };
    }

    if (collection === 'usuariossistema') {
        return {
            id: item._id || crypto.randomUUID(),
            clerkId: item.clerkId || null,
            name: item.name || 'Sem Nome',
            email: item.emailLogin || item.email,
            role: item.profile || 'USER',
            status: item.status === 'Ativo' ? 'ACTIVE' : (item.status === 'Inativo' ? 'INACTIVE' : 'PENDING'),
            setores: item.setores || [],
            unidadeRef: item.unidadeRef || null,
            memberRef: item.memberRef || null,
            ativo: typeof item.ativo !== 'undefined' ? item.ativo : true
        };
    }

    // Repassa raw as is e espera que as props coincidam (Aviso: para funcionar 100% de imediato vamos aceitar erros e adaptar caso a caso)
    return { ...item, id: item._id || crypto.randomUUID() };
}

export const mapForFrontend = (collection: string, row: any) => {
    if (collection === 'imoveis' && row) {
        // Spread amenidades como campos booleanos individuais
        const amenidadesObj = (row.amenidades && typeof row.amenidades === 'object') ? row.amenidades : {};
        return {
            ...row,
            ...amenidadesObj,
            _id: row.id,
            codigoReference: row.code,
            codImovel: row.code,
            resumoImovel: row.title,
            tipoImovel: row.type,
            finalidade: row.finalidade,
            pretensao: row.pretensao,
            situacaoImovel: row.situacaoImovel,
            midiaOrigem: row.midiaOrigem,
            statusImovel: row.status === 'AVAILABLE' ? 'Ativo' : (row.status === 'RENTED' ? 'Locado' : (row.status === 'SOLD' ? 'Vendido' : 'Suspenso')),
            // Valores
            precoVenda: row.salePrice,
            precoLocacao: row.rentPrice,
            valorCondominio: row.condoPrice,
            valorIPTU: row.iptuPrice,
            periodicidadeIPTU: row.periodicidadeIPTU || 'Anual',
            entradaMinimaEstimada: row.entradaMinimaEstimada,
            pacoteLocacao: row.pacoteLocacao,
            // Flags
            aceitaFinanciamento: row.aceitaFinanciamento,
            aceitaFgts: row.aceitaFgts,
            imovelCondominio: row.imovelCondominio,
            investimentoOportunidade: row.investimentoOportunidade,
            permiteFinanciamento: row.permiteFinanciamento,
            // Conteúdo
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
            // Endereço
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
            // Proprietário
            nomeProprietario: row.nomeProprietario,
            telefoneProprietario: row.telefoneProprietario,
            emailProprietario: row.emailProprietario,
            _createdDate: row.createdAt,
            _updatedDate: row.updatedAt,
            corretorResponsavelId: row.ownerId,
        };
    }

    if (collection === 'usuariossistema' && row) {
        return {
            ...row,
            _id: row.id,
            emailLogin: row.email,
            profile: row.role,
            status: row.status === 'ACTIVE' ? 'Ativo' : (row.status === 'INACTIVE' ? 'Inativo' : 'Pendente'),
            _createdDate: row.createdAt,
            _updatedDate: row.updatedAt,
            name: row.name,
            setores: typeof row.setores !== 'undefined' ? row.setores : [],
            unidadeRef: row.unidadeRef,
            memberRef: row.memberRef,
            ativo: row.ativo,
            lastLogin: row.lastLogin
        };
    }

    if ((collection === 'clientes' || collection === 'leads') && row) {
        return {
            ...row,
            _id: row.id,
            clientName: row.name,
            nomeRazaoSocial: row.name,
            email: row.email,
            emailPrincipal: row.email,
            phoneNumber: row.phone,
            telefonePrincipal: row.phone,
            cpfCnpj: row.document,
            type: row.type,
            address: row.address,
            status: row.status,
            papeis: row.papeis,
            notes: row.notes,
            gender: row.gender,
            canalOrigem: row.canalOrigem,
            responsavelInternoId: row.responsavelInternoId,
            rg: row.rg,
            nationality: row.nationality,
            maritalStatus: row.maritalStatus,
            profession: row.profession,
            _createdDate: row.createdAt,
            _updatedDate: row.updatedAt,
        };
    }

    if (collection === 'leadsdecontato' && row) {
        return {
            ...row,
            _id: row.id,
            clientePrincipalRef: row.clientRef,
            _createdDate: row.createdAt,
            _updatedDate: row.updatedAt,
        };
    }

    return { ...row, _id: row.id || row._id, _createdDate: row.createdAt, _updatedDate: row.updatedAt };
}

