import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BaseCrudService } from '@/integrations';
import { ContractTemplates, Clients, Imveis, ServiceRecords, Contracts, ServiceParties } from '@/entities';
import { ContractEngine } from '@/services/ContractEngine';
import { toast } from 'sonner';
import {
    Check,
    ChevronRight,
    ChevronLeft,
    FileText,
    Users,
    Home,
    DollarSign,
    Settings,
    Eye,
    PenTool,
    Loader2,
    ShieldCheck,
    Calendar,
    Hammer,
    FileCheck,
    Globe,
    Clock,
    AlertCircle,
    Menu,
    X,
    LogOut,
    LayoutDashboard,
    MessageSquare,
    Upload,
    Building2,
    Key,
    Save,
    Trash2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { formatCurrency, parseCurrency, formatCPF } from '@/lib/input-masks';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { DEFAULT_TEMPLATES } from '@/services/templates/defaultTemplates';

interface ContractWizardProps {
    isOpen: boolean;
    onClose: () => void;
    atendimento: ServiceRecords;
    onSuccess?: () => void;
}

const STEPS = [
    { id: 1, title: 'Tipo', icon: FileText },
    { id: 2, title: 'Opcionais', icon: Settings },
    { id: 3, title: 'Revisão', icon: Eye },
    { id: 4, title: 'Assinatura', icon: PenTool },
];

const isLocacao = (t: string | undefined) => t?.startsWith('Loc') || t?.startsWith('Vis') || t === 'EntregaChaves' || t === 'DevolucaoChaves' || t === 'AutorizacaoDivulgacao';

export function ContractWizard({ isOpen, onClose, atendimento, onSuccess }: ContractWizardProps) {
    const isLocacaoCard = atendimento?.serviceType?.toLowerCase().includes('loca') || 
                          atendimento?.serviceType?.toLowerCase().includes('alug');
                          
    const isVendaCard = atendimento?.serviceType?.toLowerCase().includes('vend') || 
                        atendimento?.serviceType?.toLowerCase().includes('comp') ||
                        atendimento?.serviceType?.toLowerCase().includes('leil') ||
                        atendimento?.serviceType?.toLowerCase().includes('finan');

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [saving, setSaving] = useState(false);
    const [contractId, setContractId] = useState<string | null>(null);
    const [isSeeding, setIsSeeding] = useState(false);
    const [isTemplateMissing, setIsTemplateMissing] = useState(false);
    const [useDefaultTemplateOverride, setUseDefaultTemplateOverride] = useState(false);
    const [availableTemplatesForType, setAvailableTemplatesForType] = useState<any[]>([]);
    const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
    const [editingParticipantKey, setEditingParticipantKey] = useState<string | null>(null);

    // Sync & Protection States
    const [isSyncConfirmationOpen, setIsSyncConfirmationOpen] = useState(false);
    const [pendingParticipantSync, setPendingParticipantSync] = useState<any>(null);
    const [hasSignedContract, setHasSignedContract] = useState(false);
    const [comparisonData, setComparisonData] = useState<{ current: any, next: any } | null>(null);

    // Data States
    const [templates, setTemplates] = useState<any[]>([]);
    const [clientes, setClientes] = useState<Clients[]>([]);
    const [imoveis, setImoveis] = useState<Imveis[]>([]);

    // Selection States
    const [selectedType, setSelectedType] = useState<string>('');
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [selectedImovelId, setSelectedImovelId] = useState<string>('');

    // Form States
    const INITIAL_FORM_DATA = {
        // Partes (Múltiplos)
        LOCADORES_IDS: [],
        LOCATARIOS_IDS: [],
        VENDEDORES_IDS: [],
        COMPRADORES_IDS: [],
        FIADORES_IDS: [],
        PARTES_RELACIONADAS: [], // Ex: cônjuges
        PARTICIPANT_DETAILS: {}, // Overrides for client data {(clientId): {name, cpf, rg, profession, maritalStatus, etc}}
        // Financeiro
        VALOR_TOTAL: 0,
        VALOR_ENTRADA: 0,
        VALOR_ALUGUEL: 0,
        VALOR_CONDOMINIO: 0,
        VALOR_IPTU: 0,
        IS_PACOTE: false,
        PRAZO_MESES: '30',
        FORMA_PAGAMENTO: '',
        DIA_PAGAMENTO: '10',
        DATA_INICIO_PREVISTA: '',
        DATA_ENTREGA_CHAVES_OBS: '',
        GARANTIA: 'Caucao',
        REAJUSTE_INDICE: 'IGPM',
        MULTA_RESCISAO_ALUGUEIS: '3',
        // Dados Caução
        CAUCAO_VALOR: 0,
        CAUCAO_BANCO: 'Caixa Econômica Federal',
        CAUCAO_BANCO_CODIGO: '104',
        CAUCAO_TITULAR: '',
        CAUCAO_CPF: '',
        CAUCAO_AGENCIA: '',
        CAUCAO_CONTA: '',
        // Opcionais
        OPCIONAIS: {
            SUBLOCACAO: true,
            PINTURA_NOVA: true,
            VISTORIA_DETALHADA: true,
            EXCLUSIVIDADE: false,
            FORO_SAO_PAULO: true,
            SEGURO_INCENDIO: true,
            LGPD: true,
            TRANSFERENCIA_CONTAS: true,
        },
        // Seguros e Financiamento
        SEGURO_FIANCA_NOME: '',
        SEGURO_FIANCA_CNPJ: '',
        SEGURO_FIANCA_APOLICE: '',
        MODALIDADE_VENDA: 'Financiada',
        FINANCIAMENTO_BANCO: 'Caixa Econômica Federal',
        FINANCIAMENTO_VALOR: 0,
        PRAZO_APROVACAO_DIAS: '90',
        ITBI_RESPONSABILIDADE: 'Comprador',
        PRAZO_LAVRATURA_DIAS: '30',
        TAXA_OCUPACAO_MENSAL: 0,
        DATA_LIMITE_CHAVES: '',
        DATA_DOCUMENTO: '',
        // Vistorias e Rescisão
        DATA_VISTORIA: '',
        DATA_ENTREGA_CHAVES: '',
        ESTADO_CONSERVACAO: '',
        LEITURA_AGUA: '',
        LEITURA_LUZ: '',
        MULTA_RESCISORIA_VALOR: 0,
        OBSERVACOES_CHAVES: '',
        INVENTARIO_MOVEIS: '',
        LAUDO_FOTOS: [],
        DISABLED_CLAUSES: [],
        // Testemunhas
        TESTEMUNHA1_NOME: '',
        TESTEMUNHA1_RG: '',
        TESTEMUNHA2_NOME: '',
        TESTEMUNHA2_RG: '',
        // Dados de Imóvel Editáveis
        IMOVEL_TIPO: '',
        IMOVEL_LOGRADOURO: '',
        IMOVEL_NUMERO: '',
        IMOVEL_COMPLEMENTO: '',
        IMOVEL_BAIRRO: '',
        IMOVEL_CIDADE: '',
        IMOVEL_ESTADO: '',
        IMOVEL_CEP: '',
        MATRICULA: '',
        IMOVEL_VAGAS_GARAGEM: 0,
    };

    // Atualiza os campos de imóvel editáveis no formData quando o imóvel é selecionado
    useEffect(() => {
        if (selectedImovelId) {
            const imovel = imoveis.find(i => i._id === selectedImovelId);
            if (imovel) {
                const translatePropertyType = (type: string) => {
                    if (!type) return 'Apartamento';
                    const clean = type.toUpperCase().trim();
                    if (clean === 'TWO_STORY_HOUSE' || clean === 'SOBRADO') return 'Sobrado';
                    if (clean === 'HOUSE' || clean === 'CASA') return 'Casa';
                    if (clean === 'APARTMENT' || clean === 'APARTAMENTO' || clean === 'APTO') return 'Apartamento';
                    if (clean === 'COMMERCIAL' || clean === 'SALA_COMERCIAL' || clean === 'SALA') return 'Sala Comercial';
                    if (clean === 'LAND' || clean === 'TERRENO') return 'Terreno';
                    return type;
                };

                setFormData(prev => ({
                    ...prev,
                    IMOVEL_TIPO: prev.IMOVEL_TIPO || translatePropertyType(imovel.tipoImovel || ''),
                    IMOVEL_LOGRADOURO: prev.IMOVEL_LOGRADOURO || imovel.logradouro || '',
                    IMOVEL_NUMERO: prev.IMOVEL_NUMERO || imovel.numero || '',
                    IMOVEL_COMPLEMENTO: prev.IMOVEL_COMPLEMENTO || imovel.complemento || '',
                    IMOVEL_BAIRRO: prev.IMOVEL_BAIRRO || imovel.bairro || '',
                    IMOVEL_CIDADE: prev.IMOVEL_CIDADE || imovel.cidade || '',
                    IMOVEL_ESTADO: prev.IMOVEL_ESTADO || imovel.estado || (imovel as any).uf || 'SP',
                    IMOVEL_CEP: prev.IMOVEL_CEP || imovel.cep || '',
                    MATRICULA: prev.MATRICULA || (imovel as any).matricula || '',
                    IMOVEL_VAGAS_GARAGEM: prev.IMOVEL_VAGAS_GARAGEM !== undefined ? prev.IMOVEL_VAGAS_GARAGEM : (imovel.vagas || 0),
                    VALOR_CONDOMINIO: prev.VALOR_CONDOMINIO !== undefined && prev.VALOR_CONDOMINIO !== 0 ? prev.VALOR_CONDOMINIO : (imovel.valorCondominio || 0),
                    VALOR_IPTU: prev.VALOR_IPTU !== undefined && prev.VALOR_IPTU !== 0 ? prev.VALOR_IPTU : (imovel.valorIPTU || 0)
                }));
            }
        }
    }, [selectedImovelId, imoveis]);

    const [formData, setFormData] = useState<any>(INITIAL_FORM_DATA);

    // Auto-calcula o valor da caução (3x o aluguel) como sugestão inicial editável
    useEffect(() => {
        if (formData.VALOR_ALUGUEL && formData.GARANTIA === 'Caucao' && !formData.CAUCAO_VALOR) {
            setFormData(prev => ({
                ...prev,
                CAUCAO_VALOR: prev.VALOR_ALUGUEL * 3
            }));
        }
    }, [formData.VALOR_ALUGUEL, formData.GARANTIA]);

    const [previewContent, setPreviewContent] = useState('');
    const [pdfDiagnostics, setPdfDiagnostics] = useState<any>({
        templateId: '',
        templateName: '',
        htmlLength: 0,
        placeholderCount: 0,
        replacementsCount: 0,
        templateSource: '',
        containerStats: { width: 0, height: 0 },
        lastError: '',
        status: 'idle'
    });
    const [showDebug, setShowDebug] = useState(false);

    // Estados para o Modal de Cadastro/Vínculo de Fiador
    const INITIAL_FIADOR_FORM = {
        name: '',
        cpf: '',
        rg: '',
        nationality: 'brasileiro(a)',
        maritalStatus: 'solteiro(a)',
        profession: '',
        gender: 'Masculino',
        email: '',
        phone: '',
        address: '',
        spouseId: 'no_spouse',
        tipoPessoa: 'Física',
        tradeName: '',
        representativeName: '',
        representativeCpf: '',
        representativeRg: ''
    };
    const [isFiadorModalOpen, setIsFiadorModalOpen] = useState(false);
    const [prevGarantia, setPrevGarantia] = useState('Caucao');
    const [newFiadorForm, setNewFiadorForm] = useState<any>(INITIAL_FIADOR_FORM);
    const [isRegisteringNewFiador, setIsRegisteringNewFiador] = useState(false);
    const [selectedExistingFiadorId, setSelectedExistingFiadorId] = useState('');
    const [searchFiadorQuery, setSearchFiadorQuery] = useState('');

    const syncLatestCardData = async (type = selectedType) => {
        try {
            console.log('[ContractWizard] Sincronizando dados mais recentes do cartão...');
            
            // 1. Fresh CRM objects and linked tables
            const [freshAtendimentosRes, partiesRes, linkImovelRes, allClients, allImoveis] = await Promise.all([
                BaseCrudService.getAll<any>('atendimentos'),
                BaseCrudService.getAll<any>('atendimentopartes'),
                BaseCrudService.getAll<any>('atendimentoimoveis'),
                BaseCrudService.getAll<any>('clientes'),
                BaseCrudService.getAll<any>('imoveis')
            ]);

            const freshCase = freshAtendimentosRes.items?.find((a: any) => a._id === atendimento._id) || atendimento;
            const freshParties = partiesRes.items?.filter((p: any) => p.serviceRecordRef === atendimento._id) || [];
            const freshImoveis = linkImovelRes.items?.filter((ai: any) => ai.atendimentoRef === atendimento._id) || [];

            // Update templates/clients/imoveis state to match fresh data
            setClientes(allClients.items || []);
            setImoveis(allImoveis.items || []);

            let newFormData = { ...formData };

            // 2. Map Parties
            if (freshParties.length > 0) {
                const locadores: string[] = [];
                const locatarios: string[] = [];
                const vendedores: string[] = [];
                const compradores: string[] = [];
                const fiadores: string[] = [];

                freshParties.forEach((p: any) => {
                    if (p.clientRef) {
                        if (p.roleInService === 'Locador' || p.roleInService === 'Vendedor') {
                            if (isLocacao(type)) locadores.push(p.clientRef);
                            else vendedores.push(p.clientRef);
                        } else if (p.roleInService === 'Locatário' || p.roleInService === 'Proponente' || p.roleInService === 'Comprador') {
                            if (isLocacao(type)) locatarios.push(p.clientRef);
                            else compradores.push(p.clientRef);
                        } else if (p.roleInService === 'Fiador') {
                            fiadores.push(p.clientRef);
                        }
                    }
                });

                // Fallback for primary client if empty
                if (locatarios.length === 0 && compradores.length === 0 && freshCase.clientePrincipalRef) {
                    if (isLocacao(type)) locatarios.push(freshCase.clientePrincipalRef);
                    else compradores.push(freshCase.clientePrincipalRef);
                }

                newFormData.LOCADORES_IDS = locadores;
                newFormData.LOCATARIOS_IDS = locatarios;
                newFormData.VENDEDORES_IDS = vendedores;
                newFormData.COMPRADORES_IDS = compradores;
                newFormData.FIADORES_IDS = fiadores;
            } else if (freshCase.clientePrincipalRef) {
                newFormData.LOCATARIOS_IDS = [freshCase.clientePrincipalRef];
                newFormData.COMPRADORES_IDS = [freshCase.clientePrincipalRef];
                newFormData.FIADORES_IDS = [];
            }

            // 3. Map Imóvel
            if (freshImoveis.length > 0 && freshImoveis[0].imovelRef) {
                const matchedImovelId = freshImoveis[0].imovelRef;
                setSelectedImovelId(matchedImovelId);
                const imovel = allImoveis.items?.find((i: any) => i._id === matchedImovelId);
                if (imovel) {
                    const translatePropertyType = (t: string) => {
                        if (!t) return 'Apartamento';
                        const clean = t.toUpperCase().trim();
                        if (clean === 'TWO_STORY_HOUSE' || clean === 'SOBRADO') return 'Sobrado';
                        if (clean === 'HOUSE' || clean === 'CASA') return 'Casa';
                        if (clean === 'APARTMENT' || clean === 'APARTAMENTO' || clean === 'APTO') return 'Apartamento';
                        if (clean === 'COMMERCIAL' || clean === 'SALA_COMERCIAL' || clean === 'SALA') return 'Sala Comercial';
                        if (clean === 'LAND' || clean === 'TERRENO') return 'Terreno';
                        return t;
                    };
                    newFormData.IMOVEL_TIPO = translatePropertyType(imovel.tipoImovel || '');
                    newFormData.IMOVEL_LOGRADOURO = imovel.logradouro || '';
                    newFormData.IMOVEL_NUMERO = imovel.numero || '';
                    newFormData.IMOVEL_COMPLEMENTO = imovel.complemento || '';
                    newFormData.IMOVEL_BAIRRO = imovel.bairro || '';
                    newFormData.IMOVEL_CIDADE = imovel.cidade || '';
                    newFormData.IMOVEL_ESTADO = imovel.estado || imovel.uf || 'SP';
                    newFormData.IMOVEL_CEP = imovel.cep || '';
                    newFormData.MATRICULA = imovel.matricula || '';
                    newFormData.IMOVEL_VAGAS_GARAGEM = imovel.vagas || 0;
                    newFormData.VALOR_CONDOMINIO = imovel.valorCondominio || 0;
                    newFormData.VALOR_IPTU = imovel.valorIPTU || 0;
                }
            }

            // 4. Map Financeiro
            newFormData.VALOR_ALUGUEL = freshCase.rentValue || 0;
            newFormData.GARANTIA = freshCase.garantia || 'Caucao';
            newFormData.VALOR_CONDOMINIO = freshCase.valorCondominio || newFormData.VALOR_CONDOMINIO || 0;
            newFormData.VALOR_IPTU = freshCase.valorIPTU || newFormData.VALOR_IPTU || 0;
            newFormData.PRAZO_MESES = freshCase.prazoMeses || '30';
            newFormData.DIA_PAGAMENTO = freshCase.diaPagamento || '10';
            newFormData.REAJUSTE_INDICE = freshCase.reajusteIndice || 'IPCA';
            newFormData.MULTA_RESCISAO_ALUGUEIS = freshCase.multaRescisaoAlugueis || '3';

            // Caução mappings
            newFormData.CAUCAO_VALOR = freshCase.caucaoValor || 0;
            newFormData.CAUCAO_BANCO = freshCase.caucaoBanco || 'Caixa Econômica Federal';
            newFormData.CAUCAO_AGENCIA = freshCase.caucaoAgencia || '';
            newFormData.CAUCAO_CONTA = freshCase.caucaoConta || '';
            newFormData.CAUCAO_TITULAR = freshCase.caucaoTitular || '';
            newFormData.CAUCAO_CPF = freshCase.caucaoCpf || '';

            setFormData(newFormData);
            console.log('[ContractWizard] Sincronização concluída com sucesso. Novo formData:', newFormData);
            return newFormData;
        } catch (err) {
            console.error('[ContractWizard] Erro em syncLatestCardData:', err);
            toast.error('Erro ao sincronizar dados com o Kanban');
        }
    };

    useEffect(() => {
        const initializeWizard = async () => {
            if (isOpen) {
                console.log('[ContractWizard] Abrindo para atendimento:', atendimento._id);
                // Reset total do estado para evitar poluição entre atendimentos
                setCurrentStep(1);
                setContractId(null);
                setSelectedType('');
                setSelectedTemplate('');
                setSelectedImovelId('');
                setFormData(INITIAL_FORM_DATA);
                setPreviewContent('');
                
                setLoading(true);
                await syncLatestCardData('');
                await loadDraft();
                setLoading(false);
            }
        };
        initializeWizard();
    }, [isOpen, atendimento._id]);

    // Re-sincroniza participantes quando o tipo de contrato muda (Step 1 -> Step 2)
    useEffect(() => {
        if (isOpen && selectedType && currentStep === 1) {
            syncLatestCardData(selectedType);
        }
    }, [selectedType]);

    const loadInitialData = async (forceReloadCRM = false) => {
        setLoading(true);
        try {
            const [templatesRes, clientsRes, imoveisRes] = await Promise.all([
                fetch('/api/v1/contract-templates').then(res => res.json()),
                BaseCrudService.getAll<Clients>('clientes'),
                BaseCrudService.getAll<Imveis>('imoveis')
            ]);

            setTemplates(templatesRes.items?.filter((i: any) => (i.ativo || i.isActive)) || []);
            setClientes(clientsRes.items);
            setImoveis(imoveisRes.items);

            // Verifica se já existe algum contrato assinado para este atendimento
            const { items: allContracts } = await BaseCrudService.getAll<Contracts>('contratos');
            const signed = allContracts.some(c => c.atendimentoRef === atendimento._id && c.status === 'Assinado');
            setHasSignedContract(signed);

            // Se for carregamento inicial ou reload forçado, tenta puxar participantes do CRM
            if (forceReloadCRM || (formData.LOCATARIOS_IDS?.length === 0 && formData.COMPRADORES_IDS?.length === 0)) {
                console.log('[ContractWizard] Buscando participantes vinculados ao atendimento no CRM...');
                const { items: allParties } = await BaseCrudService.getAll<ServiceParties>('atendimentopartes');
                const parties = allParties.filter(p => p.serviceRecordRef === atendimento._id);

                let newFormData = { ...formData };

                if (parties.length > 0) {
                    const locadores: string[] = [];
                    const locatarios: string[] = [];
                    const vendedores: string[] = [];
                    const compradores: string[] = [];
                    const fiadores: string[] = [];

                    parties.forEach(p => {
                        if (p.clientRef) {
                            if (p.roleInService === 'Locador' || p.roleInService === 'Vendedor') {
                                if (isLocacao(selectedType)) locadores.push(p.clientRef);
                                else vendedores.push(p.clientRef);
                            } else if (p.roleInService === 'Locatário' || p.roleInService === 'Proponente' || p.roleInService === 'Comprador') {
                                if (isLocacao(selectedType)) locatarios.push(p.clientRef);
                                else compradores.push(p.clientRef);
                            } else if (p.roleInService === 'Fiador') {
                                fiadores.push(p.clientRef);
                            }
                        }
                    });

                    // Se não encontrou via parties mas tem cliente principal, usa ele
                    if (locatarios.length === 0 && compradores.length === 0 && atendimento.clientePrincipalRef) {
                        if (isLocacao(selectedType)) locatarios.push(atendimento.clientePrincipalRef);
                        else compradores.push(atendimento.clientePrincipalRef);
                    }

                    newFormData = {
                        ...newFormData,
                        LOCADORES_IDS: locadores.length > 0 ? locadores : newFormData.LOCADORES_IDS,
                        LOCATARIOS_IDS: locatarios.length > 0 ? locatarios : newFormData.LOCATARIOS_IDS,
                        VENDEDORES_IDS: vendedores.length > 0 ? vendedores : newFormData.VENDEDORES_IDS,
                        COMPRADORES_IDS: compradores.length > 0 ? compradores : newFormData.COMPRADORES_IDS,
                        FIADORES_IDS: fiadores.length > 0 ? fiadores : newFormData.FIADORES_IDS,
                    };
                } else if (atendimento.clientePrincipalRef) {
                    newFormData = {
                        ...newFormData,
                        LOCATARIOS_IDS: [atendimento.clientePrincipalRef!],
                        COMPRADORES_IDS: [atendimento.clientePrincipalRef!],
                        FIADORES_IDS: []
                    };
                }
                
                setFormData(newFormData);
                return newFormData;
            }
        } catch (error) {
            console.error('[ContractWizard] Erro ao carregar dados iniciais:', error);
            toast.error('Erro ao conectar com o banco de dados');
        } finally {
            setLoading(false);
        }
        return formData;
    };

    const syncParticipantsWithCRM = async () => {
        try {
            setSaving(true);
            const { items: currentParties } = await BaseCrudService.getAll<ServiceParties>('atendimentopartes');
            const caseParties = currentParties.filter(p => p.serviceRecordRef === atendimento._id);

            // Coleta participantes do formData
            const group1Ids = isLocacao(selectedType) ? formData.LOCADORES_IDS : formData.VENDEDORES_IDS;
            const group2Ids = isLocacao(selectedType) ? formData.LOCATARIOS_IDS : formData.COMPRADORES_IDS;
            const relatedIds = formData.PARTES_RELACIONADAS || [];
            const fiadorIds = formData.FIADORES_IDS || [];

            const participants = [
                ...(group1Ids || []).map((id: string) => ({ id, role: isLocacao(selectedType) ? 'Locador' : 'Vendedor' })),
                ...(group2Ids || []).map((id: string) => ({ id, role: isLocacao(selectedType) ? 'Locatário' : 'Proponente' })),
                ...(relatedIds || []).map((id: string) => ({ id, role: isLocacao(selectedType) ? 'Locatário' : 'Proponente' })),
                ...(fiadorIds || []).map((id: string) => ({ id, role: 'Fiador' }))
            ].filter(p => p.id);

            // Deduplica por ID de cliente
            const uniqueParticipants = Array.from(new Map(participants.map(p => [p.id, p])).values());

            for (const participant of uniqueParticipants) {
                const exists = caseParties.some(p => p.clientRef === participant.id);
                if (!exists) {
                    await BaseCrudService.create('atendimentopartes', {
                        serviceRecordRef: atendimento._id,
                        clientRef: participant.id,
                        roleInService: participant.role as any,
                        notes: 'Adicionado via Motor de Contratos'
                    });
                }
            }

            console.log('[CRM] Participantes sincronizados com sucesso');
        } catch (error) {
            console.error('Erro ao sincronizar participantes com CRM:', error);
        } finally {
            setSaving(false);
        }
    };

    const syncClientWithCRM = async (clientId: string, data: any) => {
        try {
            setSaving(true);
            const client = clientes.find(c => c._id === clientId);
            if (!client) return;

            // Mapeamento de campos para o CRM
            const updatePayload: any = {
                _id: clientId,
                clientName: data.name || client.clientName,
                cpfCnpj: data.cpf || client.cpfCnpj,
                email: data.email || client.email,
                emailPrincipal: data.email || client.emailPrincipal || client.email,
                address: data.address || client.address,
                phoneNumber: data.phone || data.phoneNumber || client.phoneNumber || client.telefonePrincipal,
                telefonePrincipal: data.phone || (client as any).telefonePrincipal || client.phoneNumber,
                rg: data.rg || (client as any).rg,
                nationality: data.nationality || (client as any).nationality,
                profession: data.profession || (client as any).profession,
                maritalStatus: data.maritalStatus || (client as any).maritalStatus,
                gender: data.gender || (client as any).gender,
                tipoPessoa: data.tipoPessoa || (client as any).tipoPessoa,
                nomeRazaoSocial: data.tipoPessoa === 'Jurídica' ? data.name : (client as any).nomeRazaoSocial || data.name,
                nomeFantasia: data.tradeName || (client as any).nomeFantasia || '',
            };

            await BaseCrudService.update('clientes', updatePayload);

            // Se for o cliente principal do atendimento atual, atualiza também o atendimento
            if (atendimento.clientePrincipalRef === clientId) {
                await BaseCrudService.update('atendimentos', {
                    _id: atendimento._id,
                    contactName: data.name || (client as any).clientName,
                    contactPhone: updatePayload.phoneNumber || (client as any).phoneNumber,
                    contactEmail: data.email || (client as any).email,
                });
            }

            // Atualiza estado local de clientes para refletir em todo o wizard
            setClientes(prev => prev.map(c => c._id === clientId ? { ...c, ...updatePayload } : c));

            toast.success('Dados sincronizados com o CRM global!');
            onSuccess?.();
        } catch (error) {
            console.error('Erro ao sincronizar com CRM:', error);
            toast.error('Erro ao salvar no CRM. A alteração ficou apenas neste contrato.');
        } finally {
            setSaving(false);
        }
    };

    const loadDraft = async () => {
        try {
            const { items } = await BaseCrudService.getAll<Contracts>('contratos');
            const draft = items.find(c => c.atendimentoRef === atendimento._id && c.status === 'Rascunho');

            if (draft) {
                setContractId(draft._id);
                setCurrentStep(draft.currentStep || 1);
                setSelectedTemplate(draft.templateRef || '');
                setSelectedType(draft.contractType || '');
                setSelectedImovelId(draft.imovelRef || '');
                if (draft.filledData) {
                    const parsed = JSON.parse(draft.filledData);
                    // Migração simples de V1 para V2 (singular para plural)
                    if (parsed.LOCADOR_ID && !parsed.LOCADORES_IDS) parsed.LOCADORES_IDS = [parsed.LOCADOR_ID];
                    if (parsed.LOCATARIO_ID && !parsed.LOCATARIOS_IDS) parsed.LOCATARIOS_IDS = [parsed.LOCATARIO_ID];
                    if (parsed.VENDEDOR_ID && !parsed.VENDEDORES_IDS) parsed.VENDEDORES_IDS = [parsed.VENDEDOR_ID];
                    if (parsed.COMPRADOR_ID && !parsed.COMPRADORES_IDS) parsed.COMPRADORES_IDS = [parsed.COMPRADOR_ID];

                    // Garantir que campos novos da V2 existam mesmo se o rascunho for antigo
                    if (!parsed.PARTICIPANT_DETAILS) parsed.PARTICIPANT_DETAILS = {};
                    if (!parsed.PARTES_RELACIONADAS) parsed.PARTES_RELACIONADAS = [];
                    if (!parsed.DISABLED_CLAUSES) parsed.DISABLED_CLAUSES = [];

                    setFormData(parsed);
                }
            }
        } catch (error) {
            console.error('Erro ao buscar rascunho:', error);
        }
    };

    const saveDraft = async (step: number) => {
        setSaving(true);
        try {
            const data: Partial<Contracts> = {
                atendimentoRef: atendimento._id,
                templateRef: selectedTemplate,
                contractType: selectedType,
                imovelRef: selectedImovelId,
                filledData: JSON.stringify(formData),
                currentStep: step,
                status: 'Rascunho'
            };

            if (contractId) {
                await BaseCrudService.update('contratos', { ...data, _id: contractId });
            } else {
                const newContract = await BaseCrudService.create('contratos', data);
                setContractId(newContract._id);
            }
        } catch (error) {
            console.error('Erro ao salvar rascunho:', error);
        } finally {
            setSaving(false);
        }
    };

    const isStepValid = () => {
        switch (currentStep) {
            case 1: 
                return !!selectedType;
            case 2: { // Opcionais (Step 2)
                // We perform the complete checks for Partes, Imóvel, and Financeiro that are now synchronized from the card!
                const errors: string[] = [];
                
                // 1. Partes validation
                if (isLocacao(selectedType)) {
                    if (!formData.LOCADORES_IDS || formData.LOCADORES_IDS.length === 0) {
                        errors.push('Vinculação de Locador (Proprietário)');
                    }
                    if (!formData.LOCATARIOS_IDS || formData.LOCATARIOS_IDS.length === 0) {
                        errors.push('Vinculação de Locatário (Inquilino)');
                    }
                } else if (selectedType === 'CompraEVenda' || selectedType === 'EntregaChavesVenda') {
                    if (!formData.VENDEDORES_IDS || formData.VENDEDORES_IDS.length === 0) {
                        errors.push('Vinculação de Vendedor');
                    }
                    if (!formData.COMPRADORES_IDS || formData.COMPRADORES_IDS.length === 0) {
                        errors.push('Vinculação de Comprador');
                    }
                }

                // 2. Imóvel validation
                if (!['EntregaChaves', 'AutorizacaoDivulgacao', 'EntregaChavesVenda'].includes(selectedType)) {
                    if (!selectedImovelId) {
                        errors.push('Vinculação de Imóvel da Locação');
                    }
                }

                // 3. Financeiro validation
                if (isLocacao(selectedType)) {
                    if (!formData.VALOR_ALUGUEL || formData.VALOR_ALUGUEL <= 0) {
                        errors.push('Valor do Aluguel (preencher no acordo financeiro do cartão)');
                    }
                    if (!formData.PRAZO_MESES || Number(formData.PRAZO_MESES) <= 0) {
                        errors.push('Prazo do Contrato (meses)');
                    }
                } else if (selectedType === 'CompraEVenda') {
                    if (!formData.VALOR_TOTAL || formData.VALOR_TOTAL <= 0) {
                        errors.push('Valor Total da Transação');
                    }
                }

                if (['VistoriaEntrada', 'VistoriaSaida'].includes(selectedType)) {
                    if (!formData.DATA_VISTORIA) {
                        errors.push('Data da Vistoria (Preencher neste formulário de Opções Específicas)');
                    }
                }

                if (errors.length > 0) {
                    // Display a nice custom warning toast listing the missing items!
                    toast.error(
                        <div>
                            <p className="font-bold mb-1 text-red-800">Dados ausentes no cartão Kanban:</p>
                            <ul className="list-disc pl-4 text-[11px] text-red-700 space-y-1 my-2">
                                {errors.map((e, idx) => <li key={idx} className="font-medium">{e}</li>)}
                            </ul>
                            <p className="text-[10px] text-slate-500 font-semibold mt-2">Por favor, feche este assistente e preencha estas informações na aba "Dados" do cartão antes de gerar o contrato.</p>
                        </div>,
                        { duration: 7000 }
                    );
                    return false;
                }
                return true;
            }
            default: 
                return true;
        }
    };

    const validatePDFBeforeGeneration = (html: string) => {
        if (!html || html.length < 500) {
            const currentLen = html?.length || 0;
            const msg = currentLen < 100
                ? 'O conteúdo do contrato está vazio ou muito curto. Verifique se o template foi carregado corretamente.'
                : `Conteúdo insuficiente (${currentLen} caracteres). O mínimo esperado para um documento é 500.`;
            throw new Error(msg);
        }

        const hasContractText = /CONTRATO|TERMO|INSTRUMENTO|LOCAÇÃO|VENDA/i.test(html);
        if (!hasContractText) {
            throw new Error('O conteúdo gerado não parece ser um contrato válido (palavras-chave ausentes).');
        }

        // Tenta contar placeholders não preenchidos
        const pendingCount = (html.match(/\{\{/g) || []).length;
        if (pendingCount > 15) { // Arbitrário, mas seguro se o template tiver muitos campos
            // Apenas aviso, não bloqueia necessariamente se for intencional
            console.warn(`Atenção: ${pendingCount} variáveis não preenchidas.`);
        }
    };

    const generateAndSavePDF = async (downloadName?: string) => {
        setIsGeneratingPdf(true);
        setPdfDiagnostics(prev => ({ ...prev, status: 'generating', lastError: '' }));
        console.log('[PDF] Iniciando fluxo de geração com quebra de página inteligente...', { downloadName, contentLength: previewContent?.length });

        try {
            // 1. Validar conteúdo HTML
            console.log('[PDF] Etapa 1: Validando HTML...');
            validatePDFBeforeGeneration(previewContent);

            // 2. Preparar as páginas A4 divididas para evitar cortes horizontais de texto
            console.log('[PDF] Etapa 2: Processando quebra de páginas inteligente...');
            
            // Container temporário para carregar todo o HTML
            const parserContainer = document.createElement('div');
            parserContainer.innerHTML = previewContent;
            
            // Ajustar CORS nas imagens
            const images = parserContainer.querySelectorAll('img');
            images.forEach(img => {
                img.setAttribute('crossorigin', 'anonymous');
            });

            const pages: HTMLElement[] = [];
            let currentPage = document.createElement('div');
            
            const setupPageStyles = (page: HTMLElement, forMeasurement: boolean = false) => {
                page.style.width = '794px';
                if (forMeasurement) {
                    page.style.height = 'auto';
                    page.style.minHeight = '0px';
                    page.style.maxHeight = 'none';
                } else {
                    page.style.height = '1122px'; // A4 exato a 72/96 DPI
                    page.style.minHeight = '1122px';
                    page.style.maxHeight = '1122px';
                }
                page.style.padding = '65px 70px 75px 70px'; // Margens com espaço para header/footer
                page.style.boxSizing = 'border-box';
                page.style.background = 'white';
                page.style.position = 'relative';
                page.style.overflow = 'hidden';
                page.style.display = 'block';
                page.style.fontFamily = 'Arial, sans-serif';
                page.style.color = '#333';
            };

            setupPageStyles(currentPage, true);
            document.body.appendChild(currentPage);

            // Função recursiva para achatar o HTML preservando estilos dos containers
            const flattenHTMLNode = (node: Node): HTMLElement[] => {
                if (node.nodeType === Node.TEXT_NODE) {
                    if (!node.textContent?.trim()) return [];
                    const span = document.createElement('span');
                    span.textContent = node.textContent;
                    return [span];
                }
                if (node.nodeType !== Node.ELEMENT_NODE) {
                    return [];
                }
                
                const el = node as HTMLElement;
                const tagName = el.tagName.toLowerCase();
                
                const isFlex = el.style?.display === 'flex';
                const isKeepTogether = el.classList?.contains('keep-together');
                const isLeafBlock = isFlex || isKeepTogether || ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'ul', 'ol', 'blockquote', 'address'].includes(tagName);
                
                const childrenArr = Array.from(el.childNodes);
                const hasBlockChildren = childrenArr.some(child => {
                    if (child.nodeType !== Node.ELEMENT_NODE) return false;
                    const childTag = (child as HTMLElement).tagName.toLowerCase();
                    return ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'ul', 'ol', 'div', 'section', 'blockquote', 'address'].includes(childTag);
                });
                
                if (isLeafBlock || !hasBlockChildren) {
                    return [el.cloneNode(true) as HTMLElement];
                }
                
                const result: HTMLElement[] = [];
                for (const child of childrenArr) {
                    const flattened = flattenHTMLNode(child);
                    for (const flatChild of flattened) {
                        const parentClone = el.cloneNode(false) as HTMLElement;
                        parentClone.style.marginTop = '0px';
                        parentClone.style.marginBottom = '0px';
                        parentClone.style.paddingTop = '0px';
                        parentClone.style.paddingBottom = '0px';
                        parentClone.style.border = 'none';
                        parentClone.style.borderTop = 'none';
                        parentClone.style.borderBottom = 'none';
                        
                        parentClone.appendChild(flatChild);
                        result.push(parentClone);
                    }
                }
                return result;
            };

            const flatElements: HTMLElement[] = [];
            Array.from(parserContainer.childNodes).forEach(node => {
                flatElements.push(...flattenHTMLNode(node));
            });

            for (const child of flatElements) {
                const clone = child.cloneNode(true);
                currentPage.appendChild(clone);
                
                // Mede a altura. Se ultrapassar a margem de segurança de 1020px, movemos para a próxima página.
                if (currentPage.scrollHeight > 1020 && currentPage.childNodes.length > 1) {
                    currentPage.removeChild(clone);
                    
                    // Remove do DOM, aplica estilo rígido A4 final e salva a página atual
                    document.body.removeChild(currentPage);
                    setupPageStyles(currentPage, false);
                    pages.push(currentPage);
                    
                    // Cria nova página de medição (height: auto) e insere o elemento nela
                    currentPage = document.createElement('div');
                    setupPageStyles(currentPage, true);
                    document.body.appendChild(currentPage);
                    
                    currentPage.appendChild(clone);
                }
            }
            
            // Adiciona a última página aplicando o estilo rígido A4 final
            document.body.removeChild(currentPage);
            setupPageStyles(currentPage, false);
            pages.push(currentPage);

            console.log(`[PDF] Total de páginas geradas: ${pages.length}`);

            setPdfDiagnostics(prev => ({
                ...prev,
                htmlLength: previewContent.length,
                containerStats: { width: 794, height: pages.length * 1122 },
                placeholderCount: (previewContent.match(/\{\{/g) || []).length
            }));

            // 3. Gerar PDF página por página via canvas
            console.log('[PDF] Etapa 3: Capturando páginas separadamente...');
            
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            for (let i = 0; i < pages.length; i++) {
                const pageContainer = pages[i];
                
                // Adiciona cabeçalho e rodapé profissionais em cada página
                const header = document.createElement('div');
                header.style.position = 'absolute';
                header.style.top = '20px';
                header.style.left = '70px';
                header.style.right = '70px';
                header.style.borderBottom = '1px solid #f1f5f9';
                header.style.paddingBottom = '5px';
                header.style.display = 'flex';
                header.style.justifyContent = 'space-between';
                header.style.alignItems = 'center';
                header.style.fontSize = '9px';
                header.style.color = '#94a3b8';
                header.style.fontWeight = 'bold';
                header.style.textTransform = 'uppercase';
                header.innerHTML = `<span>R.Sales Imóveis</span><span>Contrato de ${isLocacao(selectedType) ? 'Locação' : 'Compra e Venda'}</span>`;
                pageContainer.appendChild(header);

                const footer = document.createElement('div');
                footer.style.position = 'absolute';
                footer.style.bottom = '20px';
                footer.style.left = '70px';
                footer.style.right = '70px';
                footer.style.borderTop = '1px solid #f1f5f9';
                footer.style.paddingTop = '5px';
                footer.style.display = 'flex';
                footer.style.justifyContent = 'space-between';
                footer.style.fontSize = '9px';
                footer.style.color = '#94a3b8';
                footer.innerHTML = `<span>Gerado pelo Motor Jurídico R.Sales</span><span>Página ${i + 1} de ${pages.length}</span>`;
                pageContainer.appendChild(footer);

                document.body.appendChild(pageContainer);
                
                // Aguarda pequena renderização de imagem/logo
                await new Promise(resolve => setTimeout(resolve, 100));

                const canvas = await html2canvas(pageContainer, {
                    scale: 1.5,
                    useCORS: true,
                    logging: false,
                    windowWidth: 800,
                    backgroundColor: '#ffffff'
                });
                
                document.body.removeChild(pageContainer);
                
                const imgData = canvas.toDataURL('image/jpeg', 0.85);
                
                if (i > 0) {
                    pdf.addPage();
                }
                
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            }

            const pdfBase64 = pdf.output('datauristring');

            if (downloadName) {
                pdf.save(downloadName);
            }

            // 5. Salvar Log de Debug
            await BaseCrudService.create('contratos_debug', {
                atendimentoRef: atendimento._id,
                tipoContrato: selectedType,
                templateRef: selectedTemplate,
                htmlLength: previewContent.length,
                containerHeight: pages.length * 1122,
                status: 'Sucesso',
                dataHora: new Date().toISOString()
            }).catch(e => console.error('Erro ao salvar log de debug', e));

            // 6. Salvar na coleção de documentos principal
            await BaseCrudService.create('documentosfinanciamento', {
                atendimentoRef: atendimento._id,
                documentName: `Contrato_${selectedType}_${new Date().toISOString().split('T')[0]}.pdf`,
                documentType: 'Contrato Gerado',
                documentUrl: pdfBase64,
                uploadDate: new Date().toISOString(),
                documentStatus: 'Concluído',
                origem: 'Automático - Motor de Contratos (v2 Robust)',
                description: `Contrato ${selectedType} gerado com sucesso.`
            });

            setPdfDiagnostics(prev => ({ ...prev, status: 'success' }));
            return pdfBase64;

        } catch (error: any) {
            console.error('Erro no fluxo robusto de PDF:', error);
            const errMsg = error?.message || 'Erro desconhecido';
            setPdfDiagnostics(prev => ({ ...prev, status: 'error', lastError: errMsg }));

            // Log de erro
            BaseCrudService.create('contratos_debug', {
                atendimentoRef: atendimento._id,
                tipoContrato: selectedType,
                status: 'Falha',
                erro: errMsg,
                dataHora: new Date().toISOString()
            }).catch(() => { });

            toast.error(`Falha ao gerar PDF: ${errMsg}`);
            throw error;
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleFinalize = async (method: 'Digital' | 'Manual') => {
        setSaving(true);
        try {
            // 1. Gerar e Salvar PDF nos documentos do cliente
            const pdfUrl = await generateAndSavePDF();

            // 1.1 Sincronizar participantes com o CRM
            await syncParticipantsWithCRM();

            // 2. Atualizar Contrato
            await BaseCrudService.update('contratos', {
                _id: contractId!,
                status: 'EmRevisao',
                currentStep: 4,
                generatedPdfUrl: pdfUrl
            });

            // 3. Registrar no Histórico
            await BaseCrudService.create('historicocontratos', {
                contractRef: contractId!,
                action: `Finalizado - Aguardando Assinatura ${method}`,
                details: JSON.stringify({ method, date: new Date().toISOString(), pdfSaved: true })
            });

            // 4. Criar Registros de Assinatura para as partes
            // Registrar Assinaturas para todos os participantes
            const group1Ids = isLocacao(selectedType) ? formData.LOCADORES_IDS : formData.VENDEDORES_IDS;
            const group2Ids = isLocacao(selectedType) ? formData.LOCATARIOS_IDS : formData.COMPRADORES_IDS;

            const allParticipants = [
                ...(group1Ids || []).map((id: string) => ({ id, role: isLocacao(selectedType) ? 'Locador' : 'Vendedor' })),
                ...(group2Ids || []).map((id: string) => ({ id, role: isLocacao(selectedType) ? 'Locatário' : 'Comprador' }))
            ].filter(p => p.id);

            await Promise.all(allParticipants.map(participant =>
                BaseCrudService.create('contratoassinaturas', {
                    contractRef: contractId!,
                    participantRef: participant.id,
                    role: participant.role,
                    status: 'Pendente',
                    method: method === 'Digital' ? 'Eletronica' : 'Manual'
                })
            ));

            toast.success(`Contrato gerado e salvo nos documentos do cliente! Fluxo iniciado: ${method}`);
            onClose();
        } catch (error) {
            toast.error('Erro ao finalizar contrato ou gerar PDF');
        } finally {
            setSaving(false);
        }
    };

    const handleNext = async () => {
        if (!isStepValid()) {
            toast.error('Opa! Preencha os campos obrigatórios para continuar.');
            return;
        }

        if (currentStep === 4) {
            try {
                // 1. Gerar e Salvar PDF Final (já faz o commit no banco de documentos)
                const pdfUrl = await generateAndSavePDF();

                // 1.1 Sincronizar participantes com o CRM
                await syncParticipantsWithCRM();

                // 2. Registrar Contrato na Coleção 'generated-contracts' (Prisma)
                await fetch('/api/v1/generated-contracts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        leadId: atendimento._id,
                        templateId: selectedTemplate,
                        nomeDocumento: `Contrato_${selectedType}_${new Date().toISOString().split('T')[0]}`,
                        conteudoFinalHtml: previewContent,
                        status: 'GERADO'
                    })
                });

                // Mantém registro no CRM legado para Kanban
                await BaseCrudService.create('contratos', {
                    atendimentoRef: atendimento._id,
                    imovelRef: selectedImovelId,
                    contractType: selectedType,
                    templateRef: selectedTemplate,
                    filledData: JSON.stringify(formData),
                    htmlFinal: previewContent,
                    generatedPdfUrl: pdfUrl,
                    status: 'Gerado',
                    createdBy: (atendimento as any).responsibleAgentRef || 'Motor Automático'
                });

                toast.success('Contrato gerado e registrado com sucesso!');
                onClose();
            } catch (error) {
                console.error('Erro ao finalizar contrato:', error);
                toast.error('Erro ao finalizar contrato. Verifique o console.');
            } finally {
                // Estado é controlado internamente pelo generateAndSavePDF
            }
            return;
        }

        const nextStep = currentStep + 1;
        await saveDraft(nextStep);

        // Registrar Log de Auditoria ao mudar de etapa
        if (contractId) {
            BaseCrudService.create('historicocontratos', {
                contractRef: contractId,
                action: 'Avance Etapa',
                details: `Usuário avançou para etapa ${nextStep}`
            }).catch(() => { });
        }

        if (nextStep === 3) {
            generatePreview();
        }

        setCurrentStep(nextStep);
    };

    const handleSeedTemplate = async () => {
        const templateHtml = (DEFAULT_TEMPLATES as any)[selectedType];
        if (!templateHtml) {
            toast.error(`Não há template padrão para o tipo: ${selectedType}`);
            return;
        }

        setIsSeeding(true);
        try {
            toast.info("Instalando template padrão...");
            
            // 1. Salvar no IndexedDB (CRM legado/Kanban)
            await BaseCrudService.create<ContractTemplates>('templatescontratos', {
                templateName: `Template Padrão ${selectedType}`,
                contractType: selectedType as any,
                templateFormat: 'HTML',
                templateBody: templateHtml,
                isActive: true,
                version: 1
            });

            // 2. Salvar no PostgreSQL (Prisma)
            const cat = isLocacao(selectedType) ? 'LOCACAO' : ['CompraEVenda', 'EntregaChavesVenda'].includes(selectedType) ? 'VENDA' : 'OUTROS';
            const prismaRes = await fetch('/api/v1/contract-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: `Template Padrão ${selectedType}`,
                    categoria: cat,
                    tipoOperacao: selectedType,
                    conteudoHtml: templateHtml,
                    ativo: true
                })
            });

            if (!prismaRes.ok) {
                throw new Error(`Erro na API do Postgres: ${prismaRes.status}`);
            }

            toast.success("Template instalado com sucesso em ambas as bases!");

            // 3. Recarregar templates do PostgreSQL (fonte da verdade do wizard)
            const templatesRes = await fetch('/api/v1/contract-templates').then(res => res.json());
            setTemplates(templatesRes.items?.filter((i: any) => (i.ativo || i.isActive)) || []);
        } catch (error) {
            console.error('Erro ao instalar template:', error);
            toast.error("Falha ao instalar template no banco de dados.");
        } finally {
            setIsSeeding(false);
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    // Atualiza a lista de templates disponíveis para o tipo selecionado
    useEffect(() => {
        if (selectedType) {
            const filtered = templates.filter(t => (t.tipoOperacao === selectedType || t.contractType === selectedType) && (t.ativo || t.isActive));
            setAvailableTemplatesForType(filtered);
            if (filtered.length > 0 && !selectedTemplate) {
                setSelectedTemplate(filtered[0]._id);
            }
        }
    }, [selectedType, templates]);

    const generatePreview = (overrideData?: any) => {
        const dataToUse = overrideData || formData;
        console.log(`[ContractWizard] Gerando prévia para: ${selectedType}. Override Default: ${useDefaultTemplateOverride}`);
        
        let templateRaw = '';
        let templateNameUsed = '';

        if (useDefaultTemplateOverride && DEFAULT_TEMPLATES[selectedType]) {
            templateRaw = DEFAULT_TEMPLATES[selectedType];
            templateNameUsed = 'MODELO OFICIAL (RESTORED)';
            setIsTemplateMissing(false);
        } else {
            let template = selectedTemplate ? templates.find(t => t._id === selectedTemplate) : availableTemplatesForType[0];
            
            if (template) {
                console.log(`[ContractWizard] Template selecionado do DB: ${template.templateName || template.nome} (${template._id})`);
                templateNameUsed = template.templateName || template.nome;
                templateRaw = template?.conteudoHtml || template?.templateBody || template?.templateContent;
            } else if (DEFAULT_TEMPLATES[selectedType]) {
                console.log(`[ContractWizard] Auto-fallback para template padrão oficial de ${selectedType} acionado`);
                templateRaw = DEFAULT_TEMPLATES[selectedType];
                templateNameUsed = 'MODELO OFICIAL (AUTO-FALLBACK)';
            } else {
                console.warn(`[ContractWizard] Nenhum template encontrado. Tentando fallback genérico do banco...`);
                template = templates.find(t => t.ativo || t.isActive);
                if (template) {
                    templateNameUsed = template.templateName || template.nome;
                    templateRaw = template?.conteudoHtml || template?.templateBody || template?.templateContent;
                }
            }
        }

        const imovel = imoveis.find(i => i._id === selectedImovelId);
        const engineData = ContractEngine.mapEntitiesToData(atendimento, clientes, imovel, dataToUse, selectedType);

        if (templateRaw && templateRaw.length > 50) {
            setIsTemplateMissing(false);
            setPdfDiagnostics(prev => ({ ...prev, templateSource: templateNameUsed }));
            const processed = ContractEngine.renderContract(templateRaw, engineData);
            setPreviewContent(processed);
            return processed;
        } else {
            console.warn(`[ContractWizard] Conteúdo do template está vazio ou muito curto.`);
            setIsTemplateMissing(true);
            setPreviewContent('');
            return '';
        }
    };

    // Atualiza a prévia automaticamente quando o formData mudar (se estiver na etapa de revisão)
    useEffect(() => {
        if (currentStep === 3 && isOpen) {
            const timer = setTimeout(() => {
                generatePreview();
            }, 500); // Debounce para evitar múltiplas gerações pesadas
            return () => clearTimeout(timer);
        }
    }, [formData, currentStep, isOpen]);

    const [isDragging, setIsDragging] = useState(false);

    const processUploadFiles = (files: File[]) => {
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const base64 = ev.target?.result as string;
                setFormData((prev: any) => ({
                    ...prev,
                    LAUDO_FOTOS: [...(prev.LAUDO_FOTOS || []), base64]
                }));
            };
            reader.readAsDataURL(file);
        });
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files);
        processUploadFiles(files);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
            if (files.length > 0) {
                processUploadFiles(files);
            }
        }
    };

    const renderStepContent = () => {
        if (loading) return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className="w-16 h-16 text-secondary animate-spin" />
                <p className="text-slate-500 font-medium">Sincronizando com o CRM...</p>
            </div>
        );

        switch (currentStep) {
            case 1: // ETAPA 1: TIPO
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center space-y-2">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Qual o tipo de contrato?</h3>
                            <p className="text-slate-500 text-lg">Selecione uma categoria para carregar os templates exclusivos.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { id: 'LocacaoResidencial', name: 'Locação Residencial', icon: Home, color: 'bg-emerald-500', desc: 'Contratos padrão de moradia 12-30 meses.', category: 'locacao' },
                                { id: 'LocacaoComercial', name: 'Locação Comercial', icon: Building2, color: 'bg-blue-500', desc: 'Salas, lojas e galpões para empresas.', category: 'locacao' },
                                { id: 'CompraEVenda', name: 'Compra e Venda', icon: DollarSign, color: 'bg-amber-500', desc: 'Promessa de compra e venda de imóveis.', category: 'venda' },
                                { id: 'EntregaChaves', name: 'Entrega de Chaves', icon: Key, color: 'bg-emerald-600', desc: 'Termo de entrega de chaves no início.', category: 'locacao' },
                                { id: 'EntregaChavesVenda', name: 'Entrega de Chaves (Venda)', icon: Key, color: 'bg-amber-600', desc: 'Termo de entrega de chaves na compra.', category: 'venda' },
                                { id: 'DevolucaoChaves', name: 'Devolução de Chaves', icon: LogOut, color: 'bg-purple-500', desc: 'Termo de devolução de chaves no fim.', category: 'locacao' },
                                { id: 'AutorizacaoDivulgacao', name: 'Autorização de Divulgação', icon: Globe, color: 'bg-pink-500', desc: 'Autorização do proprietário para marketing.', category: 'venda' },
                                { id: 'VistoriaEntrada', name: 'Vistoria de Entrada', icon: FileCheck, color: 'bg-teal-500', desc: 'Termo de vistoria inicial do imóvel.', category: 'locacao' },
                                { id: 'VistoriaSaida', name: 'Vistoria de Saída', icon: LogOut, color: 'bg-rose-500', desc: 'Termo de vistoria de rescisão/saída.', category: 'locacao' },
                            ].filter(item => {
                                if (isLocacaoCard) return item.category === 'locacao';
                                if (isVendaCard) return item.category === 'venda';
                                return true;
                            }).map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => {
                                        setSelectedType(item.id);
                                        setSelectedTemplate('');
                                        setUseDefaultTemplateOverride(true);
                                    }}
                                    className={`p-8 rounded-[32px] border-4 cursor-pointer transition-all flex flex-col gap-4 group relative overflow-hidden ${selectedType === item.id
                                        ? 'border-secondary bg-secondary/5'
                                        : 'border-slate-50 hover:border-slate-100 bg-white shadow-sm'
                                        }`}
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${selectedType === item.id ? 'bg-secondary text-white scale-110' : 'bg-slate-100 text-slate-400 group-hover:scale-110'
                                        }`}>
                                        <item.icon className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-xl text-slate-900 leading-tight">{item.name}</h4>
                                        <p className="text-sm text-slate-500 mt-2">{item.desc}</p>
                                    </div>
                                    {selectedType === item.id && (
                                        <div className="absolute top-4 right-4 text-secondary">
                                            <ShieldCheck className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 2: { // ETAPA 2: OPCIONAIS
                let templateRaw = '';
                if (useDefaultTemplateOverride && DEFAULT_TEMPLATES[selectedType]) {
                    templateRaw = DEFAULT_TEMPLATES[selectedType];
                } else {
                    let template = selectedTemplate ? templates.find(t => t._id === selectedTemplate) : availableTemplatesForType[0];
                    if (template) {
                        templateRaw = template?.conteudoHtml || template?.templateBody || template?.templateContent;
                    } else if (DEFAULT_TEMPLATES[selectedType]) {
                        templateRaw = DEFAULT_TEMPLATES[selectedType];
                    }
                }
                const activeClauses = ContractEngine.parseTemplateClauses(templateRaw);
                const showModulesSection = activeClauses.length > 0 && activeClauses[0].key !== 'legacy_content';

                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 text-center">
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Customizações do Documento</h3>
                            <p className="text-slate-500">Preencha os dados e selecione as cláusulas para este tipo de negócio.</p>
                        </div>
                        <div className="space-y-12">
                            
                            {/* --- DATA DO DOCUMENTO (GLOBAL) --- */}
                            <div className="space-y-4 text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <Label className="text-secondary font-black uppercase tracking-widest text-xs">Informações de Emissão</Label>
                                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                                    <Label className="font-bold text-slate-700 text-sm">Data de Emissão do Documento</Label>
                                    <Input 
                                        type="date" 
                                        value={formData.DATA_DOCUMENTO} 
                                        onChange={(e) => setFormData({ ...formData, DATA_DOCUMENTO: e.target.value })} 
                                        className="bg-white border-none rounded-xl" 
                                    />
                                    <p className="text-xs text-slate-500">Se deixada em branco, será utilizada automaticamente a data atual do dia.</p>
                                </div>
                            </div>
                            
                            {/* --- FORMULÁRIO DE LOCAÇÃO --- */}
                            {(selectedType === 'LocacaoResidencial' || selectedType === 'LocacaoComercial') && (
                                <div className="space-y-8 text-left">
                                    {/* --- VALORES DA LOCAÇÃO --- */}
                                    <div className="space-y-4">
                                        <Label className="text-secondary font-black uppercase tracking-widest text-xs">Valores da Locação</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="p-5 bg-slate-50 rounded-3xl space-y-2 border border-slate-100">
                                                <Label className="font-bold text-slate-700 text-sm">Valor do Aluguel <span className="text-red-500">*</span></Label>
                                                <Input 
                                                    type="text" 
                                                    value={formData.VALOR_ALUGUEL ? formatCurrency(formData.VALOR_ALUGUEL) : ''} 
                                                    onChange={(e) => setFormData({ ...formData, VALOR_ALUGUEL: parseCurrency(e.target.value) })} 
                                                    className="bg-white border-none rounded-xl font-bold" 
                                                />
                                            </div>
                                            <div className="p-5 bg-slate-50 rounded-3xl space-y-2 border border-slate-100">
                                                <Label className="font-bold text-slate-700 text-sm">Locação em Pacote?</Label>
                                                <Select 
                                                    value={formData.IS_PACOTE ? 'Sim' : 'Nao'} 
                                                    onValueChange={(val) => setFormData({ ...formData, IS_PACOTE: val === 'Sim' })}
                                                >
                                                    <SelectTrigger className="bg-white border-none rounded-xl font-bold">
                                                        <SelectValue placeholder="Selecione..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white border border-slate-100 rounded-xl">
                                                        <SelectItem value="Sim">Sim (Pacote Fechado)</SelectItem>
                                                        <SelectItem value="Nao">Não (Detalhado)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {!formData.IS_PACOTE && (
                                                <>
                                                    <div className="p-5 bg-slate-50 rounded-3xl space-y-2 border border-slate-100 animate-in fade-in duration-200">
                                                        <Label className="font-bold text-slate-700 text-sm">Valor do Condomínio</Label>
                                                        <Input 
                                                            type="text" 
                                                            value={formData.VALOR_CONDOMINIO ? formatCurrency(formData.VALOR_CONDOMINIO) : ''} 
                                                            onChange={(e) => setFormData({ ...formData, VALOR_CONDOMINIO: parseCurrency(e.target.value) })} 
                                                            className="bg-white border-none rounded-xl" 
                                                        />
                                                    </div>
                                                    <div className="p-5 bg-slate-50 rounded-3xl space-y-2 border border-slate-100 animate-in fade-in duration-200">
                                                        <Label className="font-bold text-slate-700 text-sm">Valor do IPTU</Label>
                                                        <Input 
                                                            type="text" 
                                                            value={formData.VALOR_IPTU ? formatCurrency(formData.VALOR_IPTU) : ''} 
                                                            onChange={(e) => setFormData({ ...formData, VALOR_IPTU: parseCurrency(e.target.value) })} 
                                                            className="bg-white border-none rounded-xl" 
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* --- CONDIÇÕES GERAIS --- */}
                                    <div className="space-y-4">
                                        <Label className="text-secondary font-black uppercase tracking-widest text-xs">Condições de Locação</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="p-5 bg-slate-50 rounded-3xl space-y-2 border border-slate-100">
                                            <Label className="font-bold text-slate-700 text-sm">Prazo (Meses)</Label>
                                            <Input type="number" value={formData.PRAZO_MESES} onChange={(e) => setFormData({ ...formData, PRAZO_MESES: e.target.value })} className="bg-white border-none rounded-xl" />
                                        </div>
                                        <div className="p-5 bg-slate-50 rounded-3xl space-y-2 border border-slate-100">
                                            <Label className="font-bold text-slate-700 text-sm">Vencimento (Dia)</Label>
                                            <Input type="number" value={formData.DIA_PAGAMENTO} onChange={(e) => setFormData({ ...formData, DIA_PAGAMENTO: e.target.value })} className="bg-white border-none rounded-xl" />
                                        </div>
                                        <div className="p-5 bg-slate-50 rounded-3xl space-y-2 border border-slate-100">
                                            <Label className="font-bold text-slate-700 text-sm">Índice</Label>
                                            <Select value={formData.REAJUSTE_INDICE} onValueChange={(val) => setFormData({ ...formData, REAJUSTE_INDICE: val })}>
                                                <SelectTrigger className="bg-white border-none rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                <SelectContent className="bg-white border border-slate-100 rounded-xl">
                                                    <SelectItem value="IPCA">IPCA</SelectItem>
                                                    <SelectItem value="IGPM">IGP-M</SelectItem>
                                                    <SelectItem value="IPC-Fipe">IPC (Fipe)</SelectItem>
                                                    <SelectItem value="Sem Reajuste">Sem Reajuste</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="p-5 bg-slate-50 rounded-3xl space-y-2 border border-slate-100">
                                            <Label className="font-bold text-slate-700 text-sm">Multa (Aluguéis)</Label>
                                            <Input type="number" value={formData.MULTA_RESCISAO_ALUGUEIS} onChange={(e) => setFormData({ ...formData, MULTA_RESCISAO_ALUGUEIS: e.target.value })} className="bg-white border-none rounded-xl" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                         <div className="p-5 bg-slate-50 rounded-3xl space-y-2 border border-slate-100">
                                             <Label className="font-bold text-slate-700 text-sm">Garantia Locatícia</Label>
                                             <Select value={formData.GARANTIA} onValueChange={(val) => {
                                                 const oldGarantia = formData.GARANTIA;
                                                 setFormData({ ...formData, GARANTIA: val });
                                                 if (val === 'Fiador' && (!formData.FIADORES_IDS || formData.FIADORES_IDS.length === 0)) {
                                                     setPrevGarantia(oldGarantia);
                                                     setNewFiadorForm(INITIAL_FIADOR_FORM);
                                                     setIsRegisteringNewFiador(false);
                                                     setSelectedExistingFiadorId('');
                                                     setSearchFiadorQuery('');
                                                     setIsFiadorModalOpen(true);
                                                 }
                                             }}>
                                                 <SelectTrigger className="bg-white border-none rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                 <SelectContent className="bg-white border border-slate-100 rounded-xl">
                                                     <SelectItem value="Caucao">Caução (Depósito)</SelectItem>
                                                     <SelectItem value="SeguroFianca">Seguro Fiança</SelectItem>
                                                     <SelectItem value="Fiador">Fiador</SelectItem>
                                                     <SelectItem value="SemGarantia">Sem Garantia</SelectItem>
                                                 </SelectContent>
                                             </Select>
                                         </div>
                                         {formData.GARANTIA === 'Caucao' && (
                                             <div className="p-5 bg-slate-50 rounded-3xl space-y-2 border border-slate-100">
                                                 <Label className="font-bold text-slate-700 text-sm">Valor do Caução</Label>
                                                 <Input type="text" value={formData.CAUCAO_VALOR ? formatCurrency(formData.CAUCAO_VALOR) : ''} onChange={(e) => setFormData({ ...formData, CAUCAO_VALOR: parseCurrency(e.target.value) })} className="bg-white border-none rounded-xl font-bold" />
                                             </div>
                                         )}
                                         {formData.GARANTIA === 'SeguroFianca' && (
                                             <div className="p-5 bg-slate-50 rounded-3xl space-y-2 border border-slate-100">
                                                 <Label className="font-bold text-slate-700 text-sm">Nome da Seguradora (Ex: Loft)</Label>
                                                 <Input type="text" value={formData.SEGURO_FIANCA_NOME} onChange={(e) => setFormData({ ...formData, SEGURO_FIANCA_NOME: e.target.value })} className="bg-white border-none rounded-xl" />
                                             </div>
                                         )}
                                         {formData.GARANTIA === 'Fiador' && (
                                             <div className="col-span-1 md:col-span-2 p-5 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
                                                 <div className="space-y-1">
                                                     <Label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Fiador Vinculado</Label>
                                                     {(() => {
                                                         const firstFiadorId = formData.FIADORES_IDS?.[0];
                                                         const fiador = clientes.find(c => c._id === firstFiadorId);
                                                         if (!fiador) {
                                                             return <p className="text-sm font-bold text-red-500">Nenhum fiador cadastrado/vinculado!</p>;
                                                         }
                                                         const o = formData.PARTICIPANT_DETAILS?.[firstFiadorId] || {};
                                                         const name = o.name || fiador.clientName;
                                                         const cpf = o.cpf || fiador.cpfCnpj;
                                                         return (
                                                             <div className="text-slate-800">
                                                                 <p className="text-sm font-bold">{name}</p>
                                                                 <p className="text-xs text-slate-500">CPF/CNPJ: {cpf || 'Não informado'}</p>
                                                             </div>
                                                         );
                                                     })()}
                                                 </div>
                                                 <div className="flex gap-2 flex-shrink-0">
                                                     <Button 
                                                         type="button"
                                                         variant="outline" 
                                                         className="h-10 px-4 rounded-xl border-slate-200 text-xs font-bold hover:bg-slate-100"
                                                         onClick={() => {
                                                             const firstFiadorId = formData.FIADORES_IDS?.[0];
                                                             if (firstFiadorId) {
                                                                 const fiadorClient = clientes.find(c => c._id === firstFiadorId);
                                                                 const o = formData.PARTICIPANT_DETAILS?.[firstFiadorId] || {};
                                                                 setNewFiadorForm({
                                                                     name: o.name || fiadorClient?.clientName || '',
                                                                     cpf: o.cpf || fiadorClient?.cpfCnpj || '',
                                                                     rg: o.rg || (fiadorClient as any)?.rg || '',
                                                                     nationality: o.nationality || (fiadorClient as any)?.nationality || 'brasileiro(a)',
                                                                     maritalStatus: o.maritalStatus || (fiadorClient as any)?.maritalStatus || 'solteiro(a)',
                                                                     profession: o.profession || (fiadorClient as any)?.profession || '',
                                                                     gender: o.gender || (fiadorClient as any)?.gender || 'Masculino',
                                                                     email: o.email || fiadorClient?.emailPrincipal || fiadorClient?.email || '',
                                                                     phone: o.phone || fiadorClient?.telefonePrincipal || fiadorClient?.phoneNumber || '',
                                                                     address: o.address || fiadorClient?.address || '',
                                                                     spouseId: o.spouseId || (fiadorClient as any)?.spouseRef || 'no_spouse',
                                                                     tipoPessoa: o.tipoPessoa || fiadorClient?.tipoPessoa || 'Física',
                                                                     tradeName: o.tradeName || fiadorClient?.nomeFantasia || '',
                                                                     representativeName: o.representativeName || (fiadorClient as any)?.representativeName || '',
                                                                     representativeCpf: o.representativeCpf || (fiadorClient as any)?.representativeCpf || '',
                                                                     representativeRg: o.representativeRg || (fiadorClient as any)?.representativeRg || ''
                                                                 });
                                                                 setSelectedExistingFiadorId(firstFiadorId);
                                                                 setIsRegisteringNewFiador(false);
                                                                 setIsFiadorModalOpen(true);
                                                             } else {
                                                                 setNewFiadorForm(INITIAL_FIADOR_FORM);
                                                                 setIsRegisteringNewFiador(false);
                                                                 setSelectedExistingFiadorId('');
                                                                 setIsFiadorModalOpen(true);
                                                             }
                                                         }}
                                                     >
                                                         Editar Fiador
                                                     </Button>
                                                     <Button 
                                                         type="button"
                                                         variant="outline" 
                                                         className="h-10 px-4 rounded-xl border-slate-200 text-xs font-bold hover:bg-slate-100"
                                                         onClick={() => {
                                                             setNewFiadorForm(INITIAL_FIADOR_FORM);
                                                             setIsRegisteringNewFiador(false);
                                                             setSelectedExistingFiadorId('');
                                                             setIsFiadorModalOpen(true);
                                                         }}
                                                     >
                                                         Alterar Fiador
                                                     </Button>
                                                 </div>
                                             </div>
                                         )}
                                     </div>
                                    
                                    {/* Campos Extras Garantia */}
                                    {formData.GARANTIA === 'Caucao' && (
                                        <div className="p-5 bg-slate-50/50 rounded-3xl border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="col-span-2"><Label className="text-xs text-slate-500 font-bold block mb-1">Titular da Conta</Label><Input value={formData.CAUCAO_TITULAR} onChange={(e) => setFormData({ ...formData, CAUCAO_TITULAR: e.target.value })} className="bg-white border-none rounded-xl" /></div>
                                            <div className="col-span-2"><Label className="text-xs text-slate-500 font-bold block mb-1">CPF do Titular</Label><Input value={formData.CAUCAO_CPF} onChange={(e) => setFormData({ ...formData, CAUCAO_CPF: e.target.value })} className="bg-white border-none rounded-xl" /></div>
                                            <div><Label className="text-xs text-slate-500 font-bold block mb-1">Banco</Label><Input value={formData.CAUCAO_BANCO} onChange={(e) => setFormData({ ...formData, CAUCAO_BANCO: e.target.value })} className="bg-white border-none rounded-xl" /></div>
                                            <div><Label className="text-xs text-slate-500 font-bold block mb-1">Agência</Label><Input value={formData.CAUCAO_AGENCIA} onChange={(e) => setFormData({ ...formData, CAUCAO_AGENCIA: e.target.value })} className="bg-white border-none rounded-xl" /></div>
                                            <div className="col-span-2"><Label className="text-xs text-slate-500 font-bold block mb-1">Conta Corrente</Label><Input value={formData.CAUCAO_CONTA} onChange={(e) => setFormData({ ...formData, CAUCAO_CONTA: e.target.value })} className="bg-white border-none rounded-xl" /></div>
                                        </div>
                                    )}
                                    {formData.GARANTIA === 'SeguroFianca' && (
                                        <div className="p-5 bg-slate-50/50 rounded-3xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><Label className="text-xs text-slate-500 font-bold block mb-1">CNPJ da Seguradora</Label><Input value={formData.SEGURO_FIANCA_CNPJ} onChange={(e) => setFormData({ ...formData, SEGURO_FIANCA_CNPJ: e.target.value })} className="bg-white border-none rounded-xl" /></div>
                                            <div><Label className="text-xs text-slate-500 font-bold block mb-1">Nº Apólice / Condições</Label><Input value={formData.SEGURO_FIANCA_APOLICE} onChange={(e) => setFormData({ ...formData, SEGURO_FIANCA_APOLICE: e.target.value })} className="bg-white border-none rounded-xl" /></div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* --- FORMULÁRIO DE COMPRA E VENDA --- */}
                            {selectedType === 'CompraEVenda' && (
                                <div className="space-y-4 text-left">
                                    <Label className="text-secondary font-black uppercase tracking-widest text-xs">Dados da Venda</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-5 bg-slate-50 rounded-3xl space-y-2 border border-slate-100">
                                            <Label className="font-bold text-slate-700 text-sm">Modalidade</Label>
                                            <Select value={formData.MODALIDADE_VENDA} onValueChange={(val) => setFormData({ ...formData, MODALIDADE_VENDA: val })}>
                                                <SelectTrigger className="bg-white border-none rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                <SelectContent className="bg-white border border-slate-100 rounded-xl">
                                                    <SelectItem value="AVista">Pagamento À Vista</SelectItem>
                                                    <SelectItem value="Financiada">Venda Financiada (Bancário)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="p-5 bg-slate-50 rounded-3xl space-y-2 border border-slate-100">
                                            <Label className="font-bold text-slate-700 text-sm">Valor de Entrada (R$)</Label>
                                            <Input type="text" value={formData.VALOR_ENTRADA ? formatCurrency(formData.VALOR_ENTRADA) : ''} onChange={(e) => setFormData({ ...formData, VALOR_ENTRADA: parseCurrency(e.target.value) })} className="bg-white border-none rounded-xl font-bold" />
                                        </div>
                                    </div>
                                    
                                    {formData.MODALIDADE_VENDA === 'Financiada' && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                            <div className="p-5 bg-slate-50 rounded-3xl space-y-2 border border-slate-100">
                                                <Label className="font-bold text-slate-700 text-sm">Banco Financiador</Label>
                                                <Input value={formData.FINANCIAMENTO_BANCO} onChange={(e) => setFormData({ ...formData, FINANCIAMENTO_BANCO: e.target.value })} className="bg-white border-none rounded-xl" />
                                            </div>
                                            <div className="p-5 bg-slate-50 rounded-3xl space-y-2 border border-slate-100">
                                                <Label className="font-bold text-slate-700 text-sm">Valor Financiado</Label>
                                                <Input type="text" value={formData.FINANCIAMENTO_VALOR ? formatCurrency(formData.FINANCIAMENTO_VALOR) : ''} onChange={(e) => setFormData({ ...formData, FINANCIAMENTO_VALOR: parseCurrency(e.target.value) })} className="bg-white border-none rounded-xl font-bold text-amber-600" />
                                            </div>
                                            <div className="p-5 bg-slate-50 rounded-3xl space-y-2 border border-slate-100">
                                                <Label className="font-bold text-slate-700 text-sm">Prazo Aprovação (Dias)</Label>
                                                <Input type="number" value={formData.PRAZO_APROVACAO_DIAS} onChange={(e) => setFormData({ ...formData, PRAZO_APROVACAO_DIAS: e.target.value })} className="bg-white border-none rounded-xl" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                                        <Label className="font-bold text-slate-700 text-sm">Inventário "Porteira Fechada" (Móveis Planejados/Itens)</Label>
                                        <p className="text-xs text-slate-500">Liste os móveis por ambiente que ficarão no imóvel. Eles serão inclusos no contrato.</p>
                                        <textarea
                                            placeholder="Ex: SALA: 1 Sofá retrátil, 1 Rack. COZINHA: Armários planejados..."
                                            value={formData.INVENTARIO_MOVEIS}
                                            onChange={(e) => setFormData({ ...formData, INVENTARIO_MOVEIS: e.target.value })}
                                            className="w-full h-32 p-4 bg-white border border-slate-200 rounded-xl focus:ring-secondary outline-none text-sm resize-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* --- FORMULÁRIO DE VISTORIAS E CHAVES (DATAS) --- */}
                            {['VistoriaEntrada', 'VistoriaSaida', 'EntregaChaves', 'DevolucaoChaves', 'EntregaChavesVenda'].includes(selectedType) && (
                                <div className="space-y-4 text-left">
                                    <Label className="text-secondary font-black uppercase tracking-widest text-xs">Dados do Laudo de Vistoria</Label>

                                    <div className={`grid grid-cols-1 ${selectedType === 'VistoriaSaida' || selectedType === 'DevolucaoChaves' ? '' : 'md:grid-cols-2'} gap-4`}>
                                        <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                                            <Label className="font-bold text-slate-700 text-sm">Data da Vistoria <span className="text-red-500">*</span></Label>
                                            <Input 
                                                type="date" 
                                                value={formData.DATA_VISTORIA} 
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setFormData(prev => ({ 
                                                        ...prev, 
                                                        DATA_VISTORIA: val, 
                                                        DATA_ENTREGA_CHAVES: (!prev.DATA_ENTREGA_CHAVES || prev.DATA_ENTREGA_CHAVES === prev.DATA_VISTORIA) ? val : prev.DATA_ENTREGA_CHAVES
                                                    }));
                                                }} 
                                                className="bg-white border-none rounded-xl" 
                                            />
                                        </div>
                                        {selectedType !== 'VistoriaSaida' && selectedType !== 'DevolucaoChaves' && (
                                            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <Label className="font-bold text-slate-700 text-sm">Data de Entrega das Chaves</Label>
                                                <Input type="date" value={formData.DATA_ENTREGA_CHAVES} onChange={(e) => setFormData({ ...formData, DATA_ENTREGA_CHAVES: e.target.value })} className="bg-white border-none rounded-xl" />
                                                <p className="text-xs text-slate-500">Se vazio, o texto será adaptado sem data.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* --- FORMULÁRIO GLOBAL DE LAUDO DE CONSERVAÇÃO E FOTOS --- */}
                            {selectedType !== 'AutorizacaoDivulgacao' && (
                                <div className="space-y-4 text-left">
                                    <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <FileCheck className="w-5 h-5 text-secondary" />
                                            <Label className="font-extrabold text-slate-800 text-sm">
                                                Laudo de Vistoria & Conservação (Descrição Detalhada do Imóvel)
                                            </Label>
                                        </div>
                                        <p className="text-[11px] text-slate-500 pl-7 leading-relaxed -mt-1">
                                            Utilize este espaço para registrar o estado de conservação dos ambientes, danos identificados, desgastes existentes, reparos necessários e outras observações relevantes da vistoria.
                                        </p>
                                        <textarea
                                            placeholder="Ex: SALA: Pintura em bom estado com leves marcas de uso perto do rodapé. 3 furos de bucha na parede. QUARTO: Porta e janelas fechando perfeitamente, trinco funcional. BANHEIRO: Pequeno vazamento sob a pia (necessita reparo no sifão), azulejos intactos. COZINHA: Armários planejados com dobradiças reguladas..."
                                            value={formData.ESTADO_CONSERVACAO}
                                            onChange={(e) => setFormData({ ...formData, ESTADO_CONSERVACAO: e.target.value })}
                                            className="w-full h-32 p-4 bg-white border border-slate-200 rounded-2xl focus:ring-secondary focus:border-secondary outline-none text-sm resize-none transition-all placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div 
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        className={`p-5 bg-slate-50 rounded-3xl border border-dashed ${isDragging ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300'} space-y-4 flex flex-col items-center justify-center transition-all duration-200 relative`}
                                    >
                                        {formData.LAUDO_FOTOS && formData.LAUDO_FOTOS.length > 0 && (
                                            <div className="w-full flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, LAUDO_FOTOS: [] })}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-red-650 hover:bg-red-55 rounded-xl transition-all"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    Limpar Todas ({formData.LAUDO_FOTOS.length})
                                                </button>
                                            </div>
                                        )}

                                        <label className="w-full flex flex-col items-center justify-center cursor-pointer">
                                            <input 
                                                type="file" 
                                                multiple 
                                                accept="image/*" 
                                                onChange={handlePhotoUpload} 
                                                className="hidden" 
                                            />
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2 hover:bg-blue-200 transition-colors">
                                                <Upload className="w-6 h-6" />
                                            </div>
                                            <div className="text-center">
                                                <span className="font-bold text-slate-700 text-sm block">
                                                    Anexar Fotos para o Laudo
                                                </span>
                                                <p className="text-xs text-slate-500 mt-1">Arraste as fotos ou clique aqui para abrir o computador.</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">As fotos anexadas serão geradas como apêndice no final do PDF.</p>
                                            </div>
                                        </label>

                                        {formData.LAUDO_FOTOS && formData.LAUDO_FOTOS.length > 0 && (
                                            <div className="flex gap-2 mt-4 flex-wrap justify-center w-full">
                                                {formData.LAUDO_FOTOS.map((foto: string, idx: number) => (
                                                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shadow-sm group">
                                                        <img src={foto} className="w-full h-full object-cover" alt="Laudo" />
                                                        <button 
                                                            type="button"
                                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                e.preventDefault();
                                                                const novas = [...formData.LAUDO_FOTOS];
                                                                novas.splice(idx, 1);
                                                                setFormData({...formData, LAUDO_FOTOS: novas});
                                                            }}
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}



                            {/* --- MÓDULOS DO CONTRATO --- */}
                            {showModulesSection && (
                                <div className="space-y-4 text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <Label className="text-secondary font-black uppercase tracking-widest text-xs">Módulos do Contrato</Label>
                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                                        <p className="text-xs text-slate-500 mb-2">Configure os capítulos e cláusulas opcionais que farão parte do documento final.</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {activeClauses.map((clause) => {
                                                const isMandatory = clause.obrigatoria;
                                                const conditionMet = clause.condicional ? ContractEngine.evaluateCondition(clause.condicional, formData) : true;
                                                const isUserDisabled = Array.isArray(formData.DISABLED_CLAUSES) && formData.DISABLED_CLAUSES.includes(clause.key);
                                                const isChecked = isMandatory || (conditionMet && !isUserDisabled);
                                                const isDisabled = isMandatory || !conditionMet;

                                                return (
                                                    <div 
                                                        key={clause.key}
                                                        className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${
                                                            isMandatory 
                                                                ? 'bg-slate-100/50 border-slate-200/60' 
                                                                : !conditionMet 
                                                                    ? 'bg-slate-100/30 border-slate-200/40 opacity-50'
                                                                    : isChecked 
                                                                        ? 'bg-white border-secondary/20 shadow-sm'
                                                                        : 'bg-white border-slate-250 opacity-70'
                                                        }`}
                                                    >
                                                        <div className="pt-0.5">
                                                            {isMandatory ? (
                                                                <div className="w-5 h-5 flex items-center justify-center text-slate-400">
                                                                    📌
                                                                </div>
                                                            ) : (
                                                                <Checkbox 
                                                                    id={`clause-${clause.key}`}
                                                                    checked={isChecked}
                                                                    disabled={isDisabled}
                                                                    onCheckedChange={(checked) => {
                                                                        const currentDisabled = Array.isArray(formData.DISABLED_CLAUSES) ? [...formData.DISABLED_CLAUSES] : [];
                                                                        if (checked) {
                                                                            const updated = currentDisabled.filter(k => k !== clause.key);
                                                                            setFormData({ ...formData, DISABLED_CLAUSES: updated });
                                                                        } else {
                                                                            if (!currentDisabled.includes(clause.key)) {
                                                                                currentDisabled.push(clause.key);
                                                                            }
                                                                            setFormData({ ...formData, DISABLED_CLAUSES: currentDisabled });
                                                                        }
                                                                    }}
                                                                    className="data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label 
                                                                htmlFor={`clause-${clause.key}`}
                                                                className={`text-sm font-bold block ${isDisabled && !isMandatory ? 'text-slate-400' : 'text-slate-850'}`}
                                                            >
                                                                {clause.titulo}
                                                            </Label>
                                                            <div className="flex gap-2 items-center">
                                                                {isMandatory && (
                                                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded">Obrigatória</span>
                                                                )}
                                                                {!isMandatory && conditionMet && (
                                                                    <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded">Opcional</span>
                                                                )}
                                                                {!isMandatory && !conditionMet && (
                                                                    <span className="text-[10px] font-bold text-slate-450 bg-slate-200/50 px-2 py-0.5 rounded">Oculto por regra</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- TESTEMUNHAS --- */}
                            {!['VistoriaEntrada', 'VistoriaSaida', 'EntregaChaves', 'EntregaChavesVenda', 'DevolucaoChaves', 'TermoDevolucaoChavesVistoriaSaida'].includes(selectedType) && (
                                <div className="space-y-4 text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <Label className="text-secondary font-black uppercase tracking-widest text-xs">Testemunhas do Contrato</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                                        <div className="p-6 bg-slate-50 rounded-3xl space-y-4 border border-slate-100">
                                            <Label className="font-bold text-slate-700">Testemunha 1 (Nome)</Label>
                                            <Input value={formData.TESTEMUNHA1_NOME} onChange={(e) => setFormData({ ...formData, TESTEMUNHA1_NOME: e.target.value })} className="bg-white border-none rounded-xl" />
                                            <Label className="font-bold text-slate-700">RG / CPF</Label>
                                            <Input value={formData.TESTEMUNHA1_RG} onChange={(e) => setFormData({ ...formData, TESTEMUNHA1_RG: e.target.value })} className="bg-white border-none rounded-xl" />
                                        </div>
                                        <div className="p-6 bg-slate-50 rounded-3xl space-y-4 border border-slate-100">
                                            <Label className="font-bold text-slate-700">Testemunha 2 (Nome)</Label>
                                            <Input value={formData.TESTEMUNHA2_NOME} onChange={(e) => setFormData({ ...formData, TESTEMUNHA2_NOME: e.target.value })} className="bg-white border-none rounded-xl" />
                                            <Label className="font-bold text-slate-700">RG / CPF</Label>
                                            <Input value={formData.TESTEMUNHA2_RG} onChange={(e) => setFormData({ ...formData, TESTEMUNHA2_RG: e.target.value })} className="bg-white border-none rounded-xl" />
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                );
            }

            case 3: // ETAPA 3: REVISÃO
                return (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 h-full flex flex-col">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Prévia do Instrumento</h3>
                                <p className="text-slate-500 text-sm">O texto abaixo foi gerado dinamicamente. Revise cada parágrafo.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {availableTemplatesForType.length > 1 && (
                                    <Select value={selectedTemplate} onValueChange={(v) => { setSelectedTemplate(v); setUseDefaultTemplateOverride(false); }}>
                                        <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold min-w-[200px]">
                                            <SelectValue placeholder="Trocar Modelo..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {availableTemplatesForType.map(t => (
                                                <SelectItem key={t._id} value={t._id}>{t.templateName || t.nome}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                
                                {DEFAULT_TEMPLATES[selectedType] && (
                                    <Button
                                        variant={useDefaultTemplateOverride ? "secondary" : "outline"}
                                        size="sm"
                                        className={`rounded-xl h-10 gap-2 font-bold text-xs ${useDefaultTemplateOverride ? 'bg-amber-100 text-amber-700 border-amber-200' : 'border-slate-200'}`}
                                        onClick={() => {
                                            setUseDefaultTemplateOverride(!useDefaultTemplateOverride);
                                            toast.info(useDefaultTemplateOverride ? "Usando template do banco" : "FORÇANDO MODELO PADRÃO DO SISTEMA");
                                        }}
                                    >
                                        <PenTool className="w-4 h-4" /> {useDefaultTemplateOverride ? 'Usando Padrão' : 'Forçar Padrão'}
                                    </Button>
                                )}

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hover:text-secondary h-10"
                                    onClick={() => setShowDebug(!showDebug)}
                                >
                                    {showDebug ? 'Ocultar Diagnóstico' : 'Diagnóstico PDF'}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="rounded-xl border-slate-200 gap-2 font-bold h-10 text-xs"
                                    onClick={async () => {
                                        const freshData = await loadInitialData(true);
                                        generatePreview(freshData);
                                        toast.success("Variáveis sincronizadas com o CRM!");
                                    }}
                                >
                                    <Save className="w-4 h-4" /> Recarregar Variáveis
                                </Button>
                                <Button
                                    className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white gap-2 font-bold h-10 text-xs"
                                    onClick={async () => {
                                        try {
                                            toast.info("Iniciando geração do PDF...");
                                            generatePreview(); // Garante conteúdo fresco
                                            await generateAndSavePDF(`Contrato_${selectedType}_${new Date().toISOString().substring(0, 10)}.pdf`);
                                            toast.success("Download iniciado!");
                                        } catch (e: any) {
                                            // Erros já são tratados e logados no generateAndSavePDF
                                        }
                                    }}
                                >
                                    <FileText className="w-4 h-4" /> Baixar PDF
                                </Button>
                            </div>
                        </div>

                        {showDebug && (
                            <div className="p-6 bg-slate-900 rounded-[32px] text-white space-y-4 animate-in slide-in-from-top-4 duration-300">
                                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                    <div className="flex items-center gap-2">
                                        <Settings className="w-5 h-5 text-secondary" />
                                        <span className="font-black uppercase tracking-tighter text-sm">Painel de Diagnóstico (Admin)</span>
                                    </div>
                                    <Badge variant="outline" className={pdfDiagnostics.status === 'error' ? 'border-red-500 text-red-500' : 'border-emerald-500 text-emerald-500'}>
                                        Status: {pdfDiagnostics.status}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-[11px]">
                                    <div className="space-y-1">
                                        <p className="text-slate-400 uppercase font-bold">Tamanho HTML</p>
                                        <p className="text-lg font-mono">{pdfDiagnostics.htmlLength} chars</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-slate-400 uppercase font-bold">Variáveis {"{{ }}"}</p>
                                        <p className="text-lg font-mono">{pdfDiagnostics.placeholderCount} total</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-slate-400 uppercase font-bold">Altura Container</p>
                                        <p className="text-lg font-mono">{pdfDiagnostics.containerStats.height}px</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-slate-400 uppercase font-bold">Template Ativo</p>
                                        <p className="text-xs truncate">{selectedTemplate || 'Nenhum selected'}</p>
                                    </div>
                                </div>
                                {pdfDiagnostics.lastError && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-mono">
                                        ERRO: {pdfDiagnostics.lastError}
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-[10px] border-white/20 hover:bg-white/10 text-white"
                                        onClick={() => {
                                            const win = window.open('', '_blank');
                                            win?.document.write(`<html><body><pre>${previewContent.replace(/</g, '&lt;')}</pre></body></html>`);
                                            win?.document.close();
                                        }}
                                    >
                                        Ver HTML Completo
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-[10px] border-white/20 hover:bg-white/10 text-white"
                                        onClick={() => {
                                            const container = document.getElementById('contract-preview-container');
                                            console.log('Container Stats:', {
                                                id: container?.id,
                                                height: container?.offsetHeight,
                                                width: container?.offsetWidth,
                                                visible: container?.getBoundingClientRect()
                                            });
                                            toast.info('Dados do container logados no console (F12)');
                                        }}
                                    >
                                        Logar DOM Stats
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-hidden bg-white border border-slate-200 rounded-[32px] shadow-2xl flex flex-col relative">
                            {isTemplateMissing ? (
                                <div className="absolute inset-0 z-40 bg-slate-50 flex items-center justify-center p-8">
                                    <div className="max-w-md w-full bg-white p-10 rounded-[40px] shadow-xl border border-slate-100 flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-300">
                                        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                            <FileText className="w-10 h-10" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-black text-slate-900">Template não localizado</h3>
                                            <p className="text-slate-500">O tipo <strong className="text-secondary">{selectedType}</strong> ainda não possui um conteúdo definido no banco de dados.</p>
                                        </div>

                                        {DEFAULT_TEMPLATES[selectedType] ? (
                                            <div className="space-y-4 w-full pt-4">
                                                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-blue-800 text-xs font-bold flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4" />
                                                    Existe um template oficial disponível!
                                                </div>
                                                <Button
                                                    className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs gap-2"
                                                    onClick={handleSeedTemplate}
                                                    disabled={isSeeding}
                                                >
                                                    {isSeeding ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <PenTool className="w-5 h-5" />
                                                    )}
                                                    Instalar Template Padrão
                                                </Button>
                                            </div>
                                        ) : (
                                            <p className="text-slate-400 text-xs">Crie um novo template na coleção "templatescontratos" para prosseguir.</p>
                                        )}
                                    </div>
                                </div>
                            ) : previewContent.includes('{{') && (
                                <div className="absolute top-4 left-4 right-4 z-20 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 animate-bounce shadow-lg">
                                    <AlertCircle className="w-6 h-6 text-amber-500" />
                                    <div className="flex-1">
                                        <p className="text-sm font-black text-amber-900 leading-none">Atenção! Placeholders Pendentes</p>
                                        <p className="text-[11px] text-amber-700 mt-1">Existem variáveis não preenchidas destacadas em amarelo no contrato.</p>
                                    </div>
                                </div>
                            )}

                            {/* PDF Generation Loader Overlay */}
                            {isGeneratingPdf && (
                                <div className="absolute inset-0 z-30 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                                    <div className="w-16 h-16 border-4 border-slate-100 border-t-secondary rounded-full animate-spin" />
                                    <p className="text-slate-900 font-black uppercase tracking-widest text-xs">Preparando PDF Profissional...</p>
                                    <p className="text-slate-400 text-[10px]">Isso pode levar alguns segundos dependendo do tamanho.</p>
                                </div>
                            )}

                            <div
                                id="contract-preview-container"
                                className="w-full h-full overflow-y-auto bg-white p-4"
                                dangerouslySetInnerHTML={{
                                    // Destacar placeholders não preenchidos em amarelo
                                    __html: previewContent
                                        ? previewContent.replace(/\{\{([\w.]+)\}\}/g, '<span style="background: #fef3c7; color: #92400e; padding: 2px 4px; border-radius: 4px; font-weight: bold;">$1 [PENDENTE]</span>')
                                        : ''
                                }}
                            />
                        </div>
                    </div>
                );

            case 4: // ETAPA 4: ASSINATURA
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="p-10 bg-emerald-50 rounded-[48px] border border-emerald-100 flex flex-col items-center text-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xl shadow-emerald-200">
                                <FileCheck className="w-10 h-10" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-emerald-900">Contrato Validado e Pronto</h3>
                                <p className="text-slate-500 max-w-md">Selecione o método de assinatura para prosseguir com o registro oficial.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-8 bg-white rounded-[32px] border-2 border-slate-100 hover:border-secondary transition-all cursor-pointer group space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                                        <PenTool className="w-6 h-6" />
                                    </div>
                                    <div className="px-3 py-1 bg-secondary text-white text-[10px] font-black rounded-lg uppercase">Recomendado</div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-lg font-black text-slate-900 leading-tight">Assinatura Eletrônica (Sms/OTP)</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">Assinatura avançada com validade jurídica (MP 2.200-2). Envio imediato para e-mail/WhatsApp dos envolvidos.</p>
                                </div>
                                <Button
                                    className="w-full h-12 rounded-xl bg-slate-900 hover:bg-black font-bold"
                                    onClick={() => toast.info('Preparando envelope para envio eletrônico...')}
                                >
                                    Configurar Envio
                                </Button>
                            </div>

                            <div className="p-8 bg-white rounded-[32px] border-2 border-slate-100 hover:border-blue-500 transition-all cursor-pointer group space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <div className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-lg uppercase">Oficial</div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-lg font-black text-slate-900 leading-tight">Assinatura ICP-Brasil (Certificado Digital)</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">Exigida para atos públicos e escrituras. Suporte a Certisign, YouDigital e tokens nacionais.</p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full h-12 rounded-xl border-slate-200 hover:bg-blue-50 hover:text-blue-600 font-bold"
                                    onClick={() => toast.info('Aguardando provedor ICP-Brasil para validação...')}
                                >
                                    Configurar Provedor
                                </Button>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-900 rounded-[32px] flex items-center gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-secondary">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-bold leading-none">Trilha de Auditoria Ativada</p>
                                <p className="text-slate-400 text-[10px] mt-1 uppercase tracking-widest">Registrando IP, Hora e Dispositivo para conformidade jurídica.</p>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-[1300px] h-[92vh] p-0 overflow-hidden rounded-[48px] border-none shadow-[0_32px_128px_-32px_rgba(0,0,0,0.5)] bg-slate-100 flex flex-col">
                    <div className="flex h-full">
                        {/* Lateral Summary Side-bar (Glassmorphism look on dark bg) */}
                        <div className="w-[340px] bg-slate-900 p-10 hidden lg:flex flex-col gap-10 text-white relative">
                            <div className="flex items-center gap-4 text-secondary">
                                <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center font-black text-sm">RS</div>
                                <span className="text-xs font-black uppercase tracking-[0.2em]">Motor Jurídico</span>
                            </div>

                            <div className="space-y-10 flex-1 overflow-y-auto pr-2 custom-scrollbar scroll-smooth">
                                <div className="space-y-4 pb-10">
                                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Resumo em Tempo Real</p>

                                    {selectedType ? (
                                        <div className="space-y-6">
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-400">
                                                    <FileCheck className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Modalidade</p>
                                                    <p className="text-sm font-black text-white">{templates.find(t => t.tipoOperacao === selectedType || t.contractType === selectedType)?.templateName || templates.find(t => t.tipoOperacao === selectedType || t.contractType === selectedType)?.nome || selectedType}</p>
                                                </div>
                                            </div>

                                            {((formData.LOCATARIOS_IDS?.length || 0) > 0 || (formData.COMPRADORES_IDS?.length || 0) > 0) && (
                                                <div className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-400">
                                                        <Users className="w-5 h-5" />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase">Principais</p>
                                                        <p className="text-sm font-black text-white truncate max-w-[180px]">
                                                            {(() => {
                                                                const ids = (formData.LOCATARIOS_IDS?.length > 0 ? formData.LOCATARIOS_IDS : formData.COMPRADORES_IDS) || [];
                                                                const first = clientes.find(c => c._id === ids[0]);
                                                                if (!first) return 'Sincronizando...';
                                                                const d = formData.PARTICIPANT_DETAILS?.[first._id] || {};
                                                                const name = d.name || first.clientName;
                                                                return ids.length > 1 ? `${name} + ${ids.length - 1}` : name;
                                                            })()}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {((formData.LOCADORES_IDS?.length || 0) > 0 || (formData.VENDEDORES_IDS?.length || 0) > 0) && (
                                                <div className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-400">
                                                        <ShieldCheck className="w-5 h-5 opacity-50" />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase">Proprietários</p>
                                                        <p className="text-sm font-black text-white truncate max-w-[180px]">
                                                            {(() => {
                                                                const ids = (formData.LOCADORES_IDS?.length > 0 ? formData.LOCADORES_IDS : formData.VENDEDORES_IDS) || [];
                                                                const first = clientes.find(c => c._id === ids[0]);
                                                                if (!first) return 'Sincronizando...';
                                                                const d = formData.PARTICIPANT_DETAILS?.[first._id] || {};
                                                                const name = d.name || first.clientName;
                                                                return ids.length > 1 ? `${name} + ${ids.length - 1}` : name;
                                                            })()}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedImovelId && (
                                                <div className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-400">
                                                        <Home className="w-5 h-5" />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase">Imóvel</p>
                                                        <p className="text-sm font-black text-white truncate max-w-[180px]">
                                                            {imoveis.find(i => i._id === selectedImovelId)?.codigoReference || 'Localizando...'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {(formData.VALOR_ALUGUEL > 0 || formData.VALOR_TOTAL > 0) && (
                                                <div className="flex gap-4 p-6 bg-white/5 rounded-3xl border border-white/5">
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase">Valor Negociado</p>
                                                        <p className="text-2xl font-black text-secondary">
                                                            {formatCurrency(formData.VALOR_ALUGUEL || formData.VALOR_TOTAL)}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-20">
                                            <Loader2 className="w-10 h-10 animate-spin" />
                                            <p className="text-xs font-bold text-center">Inicie prechendo a etapa 1</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 text-secondary animate-spin" />
                                    ) : (
                                        <CloudCheck className="w-4 h-4 text-emerald-500" />
                                    )}
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${saving ? 'text-slate-500' : 'text-emerald-500'}`}>
                                        {saving ? 'Auto-salvando...' : 'Nuvem Atualizada'}
                                    </span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-600 bg-slate-800 px-2 py-1 rounded-md">V2.0</span>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 bg-white flex flex-col relative rounded-r-[48px] overflow-hidden">
                            <DialogHeader className="p-10 flex flex-row items-center justify-between space-y-0 bg-white/80 backdrop-blur-md sticky top-0 z-20">
                                <div className="flex flex-col gap-1">
                                    <DialogTitle className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">Etapa {currentStep} de 4</DialogTitle>
                                    <p className="text-3xl font-black text-slate-900 tracking-tight">{STEPS.find(s => s.id === currentStep)?.title}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100"
                                    onClick={onClose}
                                >
                                    <ChevronLeft className="rotate-[135deg] w-6 h-6" />
                                </Button>
                            </DialogHeader>

                            {/* Modern Progress Bar */}
                            <div className="px-10 pb-6 pt-0 bg-white/80 backdrop-blur-md sticky top-[120px] z-20">
                                <div className="flex justify-between items-center mb-4 px-2">
                                    {STEPS.map((s) => (
                                        <div key={s.id} className="flex flex-col items-center gap-2 flex-grow relative group">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 z-10 ${currentStep === s.id ? 'bg-secondary text-white scale-125 shadow-lg shadow-secondary/30' :
                                                currentStep > s.id ? 'bg-emerald-100 text-emerald-600' :
                                                    'bg-slate-50 text-slate-300'
                                                }`}>
                                                {currentStep > s.id ? <Check className="w-4 h-4 font-black" /> : <s.icon className="w-4 h-4" />}
                                            </div>
                                            {s.id < 4 && (
                                                <div className={`absolute left-[50%] top-4 w-full h-[3px] -z-0 transition-colors duration-500 ${currentStep > s.id ? 'bg-emerald-100' : 'bg-slate-50'
                                                    }`} />
                                            )}
                                            <p className={`text-[9px] font-black uppercase mt-1 tracking-widest ${currentStep === s.id ? 'text-secondary' : 'text-slate-300'
                                                }`}>{s.title}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <div className="max-w-4xl mx-auto py-10 px-10 pb-20">
                                    {renderStepContent()}
                                </div>
                            </div>

                            {/* Dynamic Floating Footer */}
                            <div className="p-10 border-t border-slate-50 flex justify-between items-center bg-white/95 backdrop-blur-lg sticky bottom-0 z-20">
                                <Button
                                    variant="ghost"
                                    onClick={handleBack}
                                    disabled={currentStep === 1 || loading}
                                    className="rounded-[22px] h-14 px-8 gap-3 text-slate-400 hover:text-slate-900 transition-all font-bold"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    <span>Retornar</span>
                                </Button>

                                <div className="flex gap-4">
                                    <Button
                                        variant="outline"
                                        className="rounded-[22px] h-14 px-8 border-slate-200 text-slate-500 font-bold hover:bg-slate-50"
                                        onClick={onClose}
                                    >
                                        Sair do Motor
                                    </Button>
                                    <Button
                                        onClick={handleNext}
                                        disabled={loading || saving}
                                        className="rounded-[22px] h-14 px-12 gap-3 bg-secondary hover:bg-secondary/90 text-white font-black shadow-[0_12px_24px_-8px_rgba(255,108,0,0.5)] transition-all hover:-translate-y-1"
                                    >
                                        {currentStep === 4 ? 'Finalizar e Registrar' : 'Avançar Etapa'}
                                        <ChevronRight className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>

                {/* Modal de Edição de Detalhes dos Participantes */}
                <Dialog open={!!editingParticipantId} onOpenChange={() => setEditingParticipantId(null)}>
                    <DialogContent className="max-w-2xl rounded-[32px] p-0 overflow-hidden border-none bg-slate-100 flex flex-col h-[80vh]">
                        <DialogHeader className="p-8 bg-white border-b border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                                    <PenTool className="w-6 h-6" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-black text-slate-900">Detalhamento do Participante</DialogTitle>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Qualificação para Fins de Contrato</p>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            {(() => {
                                const client = clientes.find(c => c._id === editingParticipantId);
                                const details = (formData?.PARTICIPANT_DETAILS?.[editingParticipantId!]) || {
                                    name: client?.nomeRazaoSocial || client?.clientName || (client as any)?.name || '',
                                    cpf: client?.cpfCnpj || '',
                                    rg: (client as any)?.rg || '',
                                    nationality: (client as any)?.nationality || '',
                                    profession: (client as any)?.profession || '',
                                    maritalStatus: (client as any)?.maritalStatus || '',
                                    gender: (client as any)?.gender || 'Masculino',
                                    email: client?.emailPrincipal || client?.email || '',
                                    address: client?.address || '',
                                    spouseId: (client as any)?.spouseRef || '',
                                    tipoPessoa: client?.tipoPessoa || (client?.cpfCnpj && client.cpfCnpj.replace(/\D/g, '').length > 11 ? 'Jurídica' : 'Física'),
                                    tradeName: client?.nomeFantasia || '',
                                    phone: client?.telefonePrincipal || client?.phoneNumber || '',
                                    representativeName: (client as any)?.representativeName || '',
                                    representativeCpf: (client as any)?.representativeCpf || '',
                                    representativeRg: (client as any)?.representativeRg || ''
                                };

                                const updateDetail = (field: string, val: string) => {
                                    setFormData((prev: any) => ({
                                        ...prev,
                                        PARTICIPANT_DETAILS: {
                                            ...prev.PARTICIPANT_DETAILS,
                                            [editingParticipantId!]: { ...details, [field]: val }
                                        }
                                    }));
                                };

                                const isPJ = details.tipoPessoa === 'Jurídica' || (details.cpf && details.cpf.replace(/\D/g, '').length > 11);

                                return (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Seletor Tipo de Pessoa */}
                                            <div className="col-span-1 md:col-span-2 space-y-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase">
                                                    Tipo de Pessoa
                                                </Label>
                                                <Select value={details.tipoPessoa} onValueChange={(v) => updateDetail('tipoPessoa', v)}>
                                                    <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-200">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl">
                                                        <SelectItem value="Física">Pessoa Física</SelectItem>
                                                        <SelectItem value="Jurídica">Pessoa Jurídica</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {isPJ ? (
                                                <>
                                                    {/* Campos PJ */}
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                                            Razão Social <span className="text-red-500 font-black">*</span>
                                                        </Label>
                                                        <Input
                                                            value={details.name}
                                                            onChange={(e) => updateDetail('name', e.target.value)}
                                                            className="h-14 rounded-2xl bg-white border-slate-200"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                                            Nome Fantasia (se houver)
                                                        </Label>
                                                        <Input
                                                            value={details.tradeName}
                                                            onChange={(e) => updateDetail('tradeName', e.target.value)}
                                                            className="h-14 rounded-2xl bg-white border-slate-200"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                                            CNPJ <span className="text-red-500 font-black">*</span>
                                                        </Label>
                                                        <Input
                                                            value={details.cpf}
                                                            onChange={(e) => updateDetail('cpf', e.target.value)}
                                                            className="h-14 rounded-2xl bg-white border-slate-200"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                                            Telefone <span className="text-red-500 font-black">*</span>
                                                        </Label>
                                                        <Input
                                                            value={details.phone}
                                                            onChange={(e) => updateDetail('phone', e.target.value)}
                                                            className="h-14 rounded-2xl bg-white border-slate-200"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                                            Email <span className="text-red-500 font-black">*</span>
                                                        </Label>
                                                        <Input
                                                            value={details.email}
                                                            onChange={(e) => updateDetail('email', e.target.value)}
                                                            className="h-14 rounded-2xl bg-white border-slate-200"
                                                        />
                                                    </div>
                                                    <div className="space-y-2"></div>
                                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                                        <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                                            Endereço Completo <span className="text-red-500 font-black">*</span>
                                                        </Label>
                                                        <Input
                                                            value={details.address}
                                                            onChange={(e) => updateDetail('address', e.target.value)}
                                                            className="h-14 rounded-2xl bg-white border-slate-200"
                                                        />
                                                    </div>

                                                    <div className="col-span-1 md:col-span-2 p-6 bg-secondary/5 rounded-[24px] border border-secondary/10 space-y-4">
                                                        <div className="flex items-center gap-2 text-secondary font-black uppercase text-[10px] tracking-widest">
                                                            <PenTool className="w-4 h-4" /> Representante Legal (quando aplicável)
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-bold text-slate-500">Nome do Representante</Label>
                                                                <Input
                                                                    value={details.representativeName}
                                                                    onChange={(e) => updateDetail('representativeName', e.target.value)}
                                                                    className="h-12 rounded-xl bg-white border-slate-200"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-bold text-slate-500">CPF do Representante</Label>
                                                                <Input
                                                                    value={details.representativeCpf}
                                                                    onChange={(e) => updateDetail('representativeCpf', e.target.value)}
                                                                    className="h-12 rounded-xl bg-white border-slate-200"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-bold text-slate-500">RG do Representante</Label>
                                                                <Input
                                                                    value={details.representativeRg}
                                                                    onChange={(e) => updateDetail('representativeRg', e.target.value)}
                                                                    className="h-12 rounded-xl bg-white border-slate-200"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    {/* Campos PF */}
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                                            Nome Completo <span className="text-red-500 font-black">*</span>
                                                        </Label>
                                                        <Input
                                                            value={details.name}
                                                            onChange={(e) => updateDetail('name', e.target.value)}
                                                            className="h-14 rounded-2xl bg-white border-slate-200"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                                            Email <span className="text-red-500 font-black">*</span>
                                                        </Label>
                                                        <Input
                                                            value={details.email}
                                                            onChange={(e) => updateDetail('email', e.target.value)}
                                                            className="h-14 rounded-2xl bg-white border-slate-200"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                                            CPF <span className="text-red-500 font-black">*</span>
                                                        </Label>
                                                        <Input
                                                            value={details.cpf}
                                                            onChange={(e) => updateDetail('cpf', e.target.value)}
                                                            className="h-14 rounded-2xl bg-white border-slate-200"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                                            RG <span className="text-red-500 font-black">*</span>
                                                        </Label>
                                                        <Input
                                                            value={details.rg}
                                                            onChange={(e) => updateDetail('rg', e.target.value)}
                                                            className="h-14 rounded-2xl bg-white border-slate-200"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                                            Nacionalidade <span className="text-red-500 font-black">*</span>
                                                        </Label>
                                                        <Input
                                                            value={details.nationality || ''}
                                                            onChange={(e) => updateDetail('nationality', e.target.value)}
                                                            className="h-14 rounded-2xl bg-white border-slate-200"
                                                            placeholder="Ex: brasileira"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                                            Profissão <span className="text-red-500 font-black">*</span>
                                                        </Label>
                                                        <Input
                                                            value={details.profession}
                                                            onChange={(e) => updateDetail('profession', e.target.value)}
                                                            className="h-14 rounded-2xl bg-white border-slate-200"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                                            Estado Civil <span className="text-red-500 font-black">*</span>
                                                        </Label>
                                                        <Select value={details.maritalStatus} onValueChange={(v) => updateDetail('maritalStatus', v)}>
                                                            <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-200">
                                                                <SelectValue placeholder="Selecione..." />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-2xl">
                                                                <SelectItem value="solteiro(a)">Solteiro(a)</SelectItem>
                                                                <SelectItem value="casado(a) - Comunhão Parcial de Bens">Casado(a) - Comunhão Parcial de Bens</SelectItem>
                                                                <SelectItem value="casado(a) - Comunhão Total de Bens">Casado(a) - Comunhão Total de Bens</SelectItem>
                                                                <SelectItem value="casado(a) - Comunhão Universal de Bens">Casado(a) - Comunhão Universal de Bens</SelectItem>
                                                                <SelectItem value="casado(a) - Separação Total de Bens">Casado(a) - Separação Total de Bens</SelectItem>
                                                                <SelectItem value="casado(a) - Participação Final nos Aquestos">Casado(a) - Participação Final nos Aquestos</SelectItem>
                                                                <SelectItem value="divorciado(a)">Divorciado(a)</SelectItem>
                                                                <SelectItem value="viúvo(a)">Viúvo(a)</SelectItem>
                                                                <SelectItem value="uniao_estavel">União Estável</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold text-slate-500 uppercase">Gênero</Label>
                                                        <Select value={details.gender} onValueChange={(v) => updateDetail('gender', v)}>
                                                            <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-200">
                                                                <SelectValue placeholder="Selecione..." />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-2xl">
                                                                <SelectItem value="Masculino">Masculino</SelectItem>
                                                                <SelectItem value="Feminino">Feminino</SelectItem>
                                                                <SelectItem value="Outro">Outro</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                                        <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                                            Endereço Completo <span className="text-red-500 font-black">*</span>
                                                        </Label>
                                                        <Input
                                                            value={details.address}
                                                            onChange={(e) => updateDetail('address', e.target.value)}
                                                            className="h-14 rounded-2xl bg-white border-slate-200"
                                                        />
                                                    </div>

                                                    <div className="col-span-1 md:col-span-2 p-6 bg-secondary/5 rounded-[24px] border border-secondary/10 space-y-4">
                                                        <div className="flex items-center gap-2 text-secondary font-black uppercase text-[10px] tracking-widest">
                                                            <Users className="w-4 h-4" /> Interligação de Cônjuge
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-bold text-slate-500">Selecionar Cônjuge no CRM</Label>
                                                            <Select value={details.spouseId} onValueChange={(v) => updateDetail('spouseId', v)}>
                                                                <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-200">
                                                                    <SelectValue placeholder="Nenhum cônjuge selecionado" />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-2xl">
                                                                    <SelectItem value="no_spouse">Sem Cônjuge</SelectItem>
                                                                    {clientes.map(c => (
                                                                        <SelectItem key={c._id} value={c._id} disabled={c._id === editingParticipantId}>
                                                                            {c.clientName} - {formatCPF(c.cpfCnpj || '')}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <p className="text-[10px] text-slate-400">Ao vincular, o sistema qualificará automaticamente ambos como um par no contrato.</p>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="p-8 bg-white border-t border-slate-100 flex justify-end">
                            <Button
                                className="px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold h-12"
                                onClick={async () => {
                                    const clientId = editingParticipantId!;
                                    const client = clientes.find(c => c._id === clientId);
                                    const currentDetails = formData.PARTICIPANT_DETAILS?.[clientId] || {};

                                    const updatedData = {
                                        name: client?.nomeRazaoSocial || client?.clientName || (client as any)?.name || '',
                                        cpf: client?.cpfCnpj || '',
                                        rg: (client as any)?.rg || '',
                                        nationality: (client as any)?.nationality || '',
                                        profession: (client as any)?.profession || '',
                                        maritalStatus: (client as any)?.maritalStatus || '',
                                        gender: (client as any)?.gender || 'Masculino',
                                        email: client?.emailPrincipal || client?.email || '',
                                        address: client?.address || '',
                                        spouseId: (client as any)?.spouseRef || '',
                                        tipoPessoa: client?.tipoPessoa || (client?.cpfCnpj && client.cpfCnpj.replace(/\D/g, '').length > 11 ? 'Jurídica' : 'Física'),
                                        tradeName: client?.nomeFantasia || '',
                                        phone: client?.telefonePrincipal || client?.phoneNumber || '',
                                        representativeName: (client as any)?.representativeName || '',
                                        representativeCpf: (client as any)?.representativeCpf || '',
                                        representativeRg: (client as any)?.representativeRg || '',
                                        ...currentDetails
                                    };

                                    const isPJ = updatedData.tipoPessoa === 'Jurídica' || (updatedData.cpf && updatedData.cpf.replace(/\D/g, '').length > 11);

                                    // Validar campos obrigatórios no motor
                                    const missingFields: string[] = [];
                                    if (isPJ) {
                                        if (!updatedData.name?.trim()) missingFields.push('Razão Social');
                                        if (!updatedData.cpf?.trim()) missingFields.push('CNPJ');
                                        if (!updatedData.address?.trim()) missingFields.push('Endereço Completo');
                                        if (!updatedData.email?.trim()) missingFields.push('Email');
                                        if (!updatedData.phone?.trim()) missingFields.push('Telefone');
                                    } else {
                                        if (!updatedData.name?.trim()) missingFields.push('Nome Completo');
                                        if (!updatedData.nationality?.trim()) missingFields.push('Nacionalidade');
                                        if (!updatedData.maritalStatus?.trim()) missingFields.push('Estado Civil');
                                        if (!updatedData.profession?.trim()) missingFields.push('Profissão');
                                        if (!updatedData.rg?.trim()) missingFields.push('RG');
                                        if (!updatedData.cpf?.trim()) missingFields.push('CPF');
                                        if (!updatedData.address?.trim()) missingFields.push('Endereço Completo');
                                        if (!updatedData.email?.trim()) missingFields.push('Email');
                                    }

                                    if (missingFields.length > 0) {
                                        toast.error(`Campos obrigatórios ausentes: ${missingFields.join(', ')}`);
                                        return;
                                    }

                                    // Atualiza formData com o objeto mesclado e completo
                                    setFormData((prev: any) => ({
                                        ...prev,
                                        PARTICIPANT_DETAILS: {
                                            ...prev.PARTICIPANT_DETAILS,
                                            [clientId]: updatedData
                                        }
                                    }));

                                    const originalClient = clientes.find(c => c._id === clientId);

                                    if (hasSignedContract) {
                                        // Se tem contrato assinado, força a comparação e confirmação secundária
                                        setPendingParticipantSync({ clientId, updatedData });
                                        setComparisonData({
                                            current: originalClient,
                                            next: { ...originalClient, ...updatedData }
                                        });
                                        setIsSyncConfirmationOpen(true);
                                    } else {
                                        // Se não tem contrato assinado, sincroniza direto (proativo)
                                        await syncClientWithCRM(clientId, updatedData);
                                        setEditingParticipantId(null);
                                        setEditingParticipantKey(null);
                                    }
                                }}
                            >
                                Salvar Detalhes
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Modal de Confirmação Secundária para Sincronização e Proteção */}
                <Dialog open={isSyncConfirmationOpen} onOpenChange={setIsSyncConfirmationOpen}>
                    <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden rounded-[32px]">
                        <div className="p-8 bg-amber-50 border-b border-amber-100 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-amber-900 tracking-tight">Confirmação de Alteração Crítica</h3>
                                <p className="text-amber-700/80 text-sm font-medium">Este atendimento possui um contrato **ASSINADO**. Alterar dados agora exige cautela.</p>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dados Atuais no CRM</p>
                                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                                        <DetailRow label="Nome" value={comparisonData?.current?.clientName} />
                                        <DetailRow label="CPF" value={comparisonData?.current?.cpfCnpj} />
                                        <DetailRow label="RG" value={comparisonData?.current?.rg} />
                                        <DetailRow label="Profissão" value={comparisonData?.current?.profession} />
                                        <DetailRow label="Est. Civil" value={comparisonData?.current?.maritalStatus} />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Novos Dados Propostos</p>
                                    <div className="p-5 rounded-2xl bg-secondary/5 border border-secondary/20 space-y-3">
                                        <DetailRow label="Nome" value={comparisonData?.next?.name || comparisonData?.next?.clientName} isNew />
                                        <DetailRow label="CPF" value={comparisonData?.next?.cpf || comparisonData?.next?.cpfCnpj} isNew />
                                        <DetailRow label="RG" value={comparisonData?.next?.rg} isNew />
                                        <DetailRow label="Profissão" value={comparisonData?.next?.profession} isNew />
                                        <DetailRow label="Est. Civil" value={comparisonData?.next?.maritalStatus} isNew />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-900 rounded-2xl text-white flex gap-4 items-center">
                                <ShieldCheck className="w-6 h-6 text-secondary" />
                                <p className="text-xs leading-relaxed opacity-80">
                                    Ao confirmar, estes dados serão atualizados **GLOBALMENTE** no CRM e refletirão em todos os documentos futuros e cartões deste cliente.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-12 rounded-xl"
                                    onClick={() => setIsSyncConfirmationOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    className="flex-1 h-12 rounded-xl bg-slate-900 hover:bg-black text-white font-bold"
                                    onClick={async () => {
                                        if (pendingParticipantSync) {
                                            await syncClientWithCRM(pendingParticipantSync.clientId, pendingParticipantSync.updatedData);
                                            setIsSyncConfirmationOpen(false);
                                            setEditingParticipantId(null);
                                            setEditingParticipantKey(null);
                                        }
                                    }}
                                >
                                    Confirmar Alteração Crítica
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </Dialog>

            {/* Modal de Cadastro / Seleção de Fiador */}
            <Dialog open={isFiadorModalOpen} onOpenChange={(open) => {
                if (!open) {
                    // Revert to prev guarantee if no fiador is linked
                    if (!formData.FIADORES_IDS || formData.FIADORES_IDS.length === 0) {
                        setFormData(prev => ({ ...prev, GARANTIA: prevGarantia }));
                        toast.warning('É necessário cadastrar ou selecionar um fiador para utilizar esta garantia.');
                    }
                    setIsFiadorModalOpen(false);
                }
            }}>
                <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden rounded-[32px] flex flex-col max-h-[85vh]">
                    <DialogHeader className="p-8 bg-white border-b border-slate-100 flex-shrink-0 flex flex-row items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl font-black text-slate-900">Configurar Garantia: Fiador</DialogTitle>
                            <p className="text-xs text-slate-400 font-bold uppercase mt-1">Vincule ou Cadastre o Fiador do Atendimento</p>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                        {/* Tabs to switch between Select Existing and Register New */}
                        <div className="flex bg-slate-100 p-1 rounded-2xl">
                            <button
                                type="button"
                                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${!isRegisteringNewFiador ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                onClick={() => setIsRegisteringNewFiador(false)}
                            >
                                Selecionar Existente
                            </button>
                            <button
                                type="button"
                                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${isRegisteringNewFiador ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                onClick={() => {
                                    setIsRegisteringNewFiador(true);
                                    if (!selectedExistingFiadorId) {
                                        setNewFiadorForm(INITIAL_FIADOR_FORM);
                                    }
                                }}
                            >
                                Cadastrar Novo
                            </button>
                        </div>

                        {!isRegisteringNewFiador ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">Buscar Cliente Existente</Label>
                                    <Input
                                        type="text"
                                        placeholder="Digite o nome, CPF ou email do cliente..."
                                        value={searchFiadorQuery}
                                        onChange={(e) => setSearchFiadorQuery(e.target.value)}
                                        className="bg-slate-50 border-none rounded-xl h-12"
                                    />
                                </div>

                                {searchFiadorQuery.trim().length > 1 && (
                                    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50 max-h-48 overflow-y-auto space-y-1 p-2">
                                        {(() => {
                                            const query = searchFiadorQuery.toLowerCase();
                                            const filtered = clientes.filter(c => 
                                                (c.clientName || '').toLowerCase().includes(query) || 
                                                (c.cpfCnpj || '').includes(query) || 
                                                (c.email || '').toLowerCase().includes(query)
                                            );

                                            if (filtered.length === 0) {
                                                return <p className="text-xs text-slate-400 p-3 text-center">Nenhum cliente encontrado.</p>;
                                            }

                                            return filtered.map(c => (
                                                <button
                                                    key={c._id}
                                                    type="button"
                                                    className={`w-full text-left p-3 rounded-xl transition-all text-xs font-bold flex flex-col gap-0.5 ${selectedExistingFiadorId === c._id ? 'bg-secondary text-white' : 'hover:bg-slate-100 text-slate-700'}`}
                                                    onClick={() => {
                                                        setSelectedExistingFiadorId(c._id);
                                                        setNewFiadorForm({
                                                            name: c.clientName || '',
                                                            cpf: c.cpfCnpj || '',
                                                            rg: (c as any).rg || '',
                                                            nationality: (c as any).nationality || 'brasileiro(a)',
                                                            maritalStatus: (c as any).maritalStatus || 'solteiro(a)',
                                                            profession: (c as any).profession || '',
                                                            gender: (c as any).gender || 'Masculino',
                                                            email: c.emailPrincipal || c.email || '',
                                                            phone: c.telefonePrincipal || c.phoneNumber || '',
                                                            address: c.address || '',
                                                            spouseId: (c as any).spouseRef || 'no_spouse',
                                                            tipoPessoa: c.tipoPessoa || 'Física',
                                                            tradeName: c.nomeFantasia || '',
                                                            representativeName: (c as any).representativeName || '',
                                                            representativeCpf: (c as any).representativeCpf || '',
                                                            representativeRg: (c as any).representativeRg || ''
                                                        });
                                                    }}
                                                >
                                                    <span>{c.clientName}</span>
                                                    <span className={selectedExistingFiadorId === c._id ? 'text-white/80' : 'text-slate-400'}>
                                                        CPF/CNPJ: {c.cpfCnpj || 'Não cadastrado'} • Email: {c.email || 'Não cadastrado'}
                                                    </span>
                                                </button>
                                            ));
                                        })()}
                                    </div>
                                )}

                                {selectedExistingFiadorId && (
                                    <div className="p-5 rounded-2xl bg-secondary/5 border border-secondary/20 space-y-4">
                                        <p className="text-xs font-black uppercase text-secondary tracking-wider">Confirmar & Editar Qualificação do Fiador</p>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <Label className="text-[10px] text-slate-400 font-bold block mb-1">Nome Completo *</Label>
                                                <Input className="bg-white border-none rounded-xl h-10 font-bold" value={newFiadorForm.name} onChange={(e) => setNewFiadorForm({...newFiadorForm, name: e.target.value})} />
                                            </div>
                                            <div>
                                                <Label className="text-[10px] text-slate-400 font-bold block mb-1">CPF/CNPJ</Label>
                                                <Input className="bg-white border-none rounded-xl h-10" value={newFiadorForm.cpf} onChange={(e) => setNewFiadorForm({...newFiadorForm, cpf: e.target.value})} />
                                            </div>
                                            <div>
                                                <Label className="text-[10px] text-slate-400 font-bold block mb-1">RG</Label>
                                                <Input className="bg-white border-none rounded-xl h-10" value={newFiadorForm.rg} onChange={(e) => setNewFiadorForm({...newFiadorForm, rg: e.target.value})} />
                                            </div>
                                            <div>
                                                <Label className="text-[10px] text-slate-400 font-bold block mb-1">Nacionalidade</Label>
                                                <Input className="bg-white border-none rounded-xl h-10" value={newFiadorForm.nationality} onChange={(e) => setNewFiadorForm({...newFiadorForm, nationality: e.target.value})} />
                                            </div>
                                            <div>
                                                <Label className="text-[10px] text-slate-400 font-bold block mb-1">Estado Civil</Label>
                                                <Input className="bg-white border-none rounded-xl h-10" value={newFiadorForm.maritalStatus} onChange={(e) => setNewFiadorForm({...newFiadorForm, maritalStatus: e.target.value})} />
                                            </div>
                                            <div>
                                                <Label className="text-[10px] text-slate-400 font-bold block mb-1">Profissão</Label>
                                                <Input className="bg-white border-none rounded-xl h-10" value={newFiadorForm.profession} onChange={(e) => setNewFiadorForm({...newFiadorForm, profession: e.target.value})} />
                                            </div>
                                            <div>
                                                <Label className="text-[10px] text-slate-400 font-bold block mb-1">Gênero</Label>
                                                <Select value={newFiadorForm.gender} onValueChange={(v) => setNewFiadorForm({...newFiadorForm, gender: v})}>
                                                    <SelectTrigger className="bg-white border-none rounded-xl h-10"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-white border"><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Feminino">Feminino</SelectItem></SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-2">
                                                <Label className="text-[10px] text-slate-400 font-bold block mb-1">Endereço Completo</Label>
                                                <Input className="bg-white border-none rounded-xl h-10" value={newFiadorForm.address} onChange={(e) => setNewFiadorForm({...newFiadorForm, address: e.target.value})} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase text-secondary tracking-wider">Novo Cadastro de Fiador</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <Label className="text-[10px] text-slate-400 font-bold block mb-1">Nome Completo *</Label>
                                        <Input className="bg-slate-50 border-none rounded-xl h-10 font-bold" value={newFiadorForm.name} onChange={(e) => setNewFiadorForm({...newFiadorForm, name: e.target.value})} />
                                    </div>
                                    <div>
                                        <Label className="text-[10px] text-slate-400 font-bold block mb-1">CPF/CNPJ *</Label>
                                        <Input className="bg-slate-50 border-none rounded-xl h-10" value={newFiadorForm.cpf} onChange={(e) => setNewFiadorForm({...newFiadorForm, cpf: e.target.value})} />
                                    </div>
                                    <div>
                                        <Label className="text-[10px] text-slate-400 font-bold block mb-1">RG</Label>
                                        <Input className="bg-slate-50 border-none rounded-xl h-10" value={newFiadorForm.rg} onChange={(e) => setNewFiadorForm({...newFiadorForm, rg: e.target.value})} />
                                    </div>
                                    <div>
                                        <Label className="text-[10px] text-slate-400 font-bold block mb-1">E-mail</Label>
                                        <Input className="bg-slate-50 border-none rounded-xl h-10" type="email" value={newFiadorForm.email} onChange={(e) => setNewFiadorForm({...newFiadorForm, email: e.target.value})} />
                                    </div>
                                    <div>
                                        <Label className="text-[10px] text-slate-400 font-bold block mb-1">Telefone</Label>
                                        <Input className="bg-slate-50 border-none rounded-xl h-10" value={newFiadorForm.phone} onChange={(e) => setNewFiadorForm({...newFiadorForm, phone: e.target.value})} />
                                    </div>
                                    <div>
                                        <Label className="text-[10px] text-slate-400 font-bold block mb-1">Nacionalidade</Label>
                                        <Input className="bg-slate-50 border-none rounded-xl h-10" value={newFiadorForm.nationality} onChange={(e) => setNewFiadorForm({...newFiadorForm, nationality: e.target.value})} />
                                    </div>
                                    <div>
                                        <Label className="text-[10px] text-slate-400 font-bold block mb-1">Estado Civil</Label>
                                        <Input className="bg-slate-50 border-none rounded-xl h-10" value={newFiadorForm.maritalStatus} onChange={(e) => setNewFiadorForm({...newFiadorForm, maritalStatus: e.target.value})} />
                                    </div>
                                    <div>
                                        <Label className="text-[10px] text-slate-400 font-bold block mb-1">Profissão</Label>
                                        <Input className="bg-slate-50 border-none rounded-xl h-10" value={newFiadorForm.profession} onChange={(e) => setNewFiadorForm({...newFiadorForm, profession: e.target.value})} />
                                    </div>
                                    <div>
                                        <Label className="text-[10px] text-slate-400 font-bold block mb-1">Gênero</Label>
                                        <Select value={newFiadorForm.gender} onValueChange={(v) => setNewFiadorForm({...newFiadorForm, gender: v})}>
                                            <SelectTrigger className="bg-slate-50 border-none rounded-xl h-10"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-white border"><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Feminino">Feminino</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-[10px] text-slate-400 font-bold block mb-1">Endereço Completo</Label>
                                        <Input className="bg-slate-50 border-none rounded-xl h-10" value={newFiadorForm.address} onChange={(e) => setNewFiadorForm({...newFiadorForm, address: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-3 flex-shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 h-12 rounded-xl"
                            onClick={() => {
                                if (!formData.FIADORES_IDS || formData.FIADORES_IDS.length === 0) {
                                    setFormData(prev => ({ ...prev, GARANTIA: prevGarantia }));
                                    toast.warning('Garantia redefinida para a anterior por falta de fiador.');
                                }
                                setIsFiadorModalOpen(false);
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            className="flex-1 h-12 rounded-xl bg-secondary hover:bg-secondary/90 text-white font-bold"
                            disabled={saving || (!isRegisteringNewFiador && !selectedExistingFiadorId) || (isRegisteringNewFiador && !newFiadorForm.name)}
                            onClick={async () => {
                                try {
                                    setSaving(true);
                                    let targetClientId = selectedExistingFiadorId;

                                    if (isRegisteringNewFiador) {
                                        const newId = crypto.randomUUID();
                                        await BaseCrudService.create('clientes', {
                                            _id: newId,
                                            clientName: newFiadorForm.name,
                                            cpfCnpj: newFiadorForm.cpf,
                                            email: newFiadorForm.email,
                                            phoneNumber: newFiadorForm.phone,
                                            address: newFiadorForm.address,
                                            status: 'Ativo',
                                            papeis: 'Fiador',
                                            rg: newFiadorForm.rg,
                                            nationality: newFiadorForm.nationality,
                                            maritalStatus: newFiadorForm.maritalStatus,
                                            profession: newFiadorForm.profession,
                                            gender: newFiadorForm.gender
                                        } as any);
                                        targetClientId = newId;
                                        toast.success('Novo fiador cadastrado com sucesso!');
                                    } else {
                                        const existing = clientes.find(c => c._id === targetClientId);
                                        await BaseCrudService.update('clientes', {
                                            _id: targetClientId,
                                            clientName: newFiadorForm.name || existing?.clientName,
                                            cpfCnpj: newFiadorForm.cpf || existing?.cpfCnpj,
                                            email: newFiadorForm.email || existing?.email,
                                            phoneNumber: newFiadorForm.phone || existing?.phoneNumber,
                                            address: newFiadorForm.address || existing?.address,
                                            rg: newFiadorForm.rg || (existing as any)?.rg,
                                            nationality: newFiadorForm.nationality || (existing as any)?.nationality,
                                            maritalStatus: newFiadorForm.maritalStatus || (existing as any)?.maritalStatus,
                                            profession: newFiadorForm.profession || (existing as any)?.profession,
                                            gender: newFiadorForm.gender || (existing as any)?.gender
                                        } as any);
                                        toast.success('Qualificação do fiador atualizada com sucesso!');
                                    }

                                    const { items: allParties } = await BaseCrudService.getAll<ServiceParties>('atendimentopartes');
                                    const linked = allParties.some(p => p.serviceRecordRef === atendimento._id && p.clientRef === targetClientId && p.roleInService === 'Fiador');
                                    
                                    if (!linked) {
                                        await BaseCrudService.create('atendimentopartes', {
                                            serviceRecordRef: atendimento._id,
                                            clientRef: targetClientId,
                                            roleInService: 'Fiador',
                                            notes: 'Vinculado via Garantia Locatícia no assistente'
                                        });
                                    }

                                    const [allClientsRes] = await Promise.all([
                                        BaseCrudService.getAll<Clients>('clientes')
                                    ]);
                                    setClientes(allClientsRes.items);

                                    setFormData(prev => ({
                                        ...prev,
                                        FIADORES_IDS: [targetClientId],
                                        PARTICIPANT_DETAILS: {
                                            ...prev.PARTICIPANT_DETAILS,
                                            [targetClientId]: {
                                                name: newFiadorForm.name,
                                                cpf: newFiadorForm.cpf,
                                                rg: newFiadorForm.rg,
                                                nationality: newFiadorForm.nationality,
                                                maritalStatus: newFiadorForm.maritalStatus,
                                                profession: newFiadorForm.profession,
                                                gender: newFiadorForm.gender,
                                                email: newFiadorForm.email,
                                                phone: newFiadorForm.phone,
                                                address: newFiadorForm.address,
                                                spouseId: newFiadorForm.spouseId,
                                                tipoPessoa: newFiadorForm.tipoPessoa,
                                                tradeName: newFiadorForm.tradeName,
                                                representativeName: newFiadorForm.representativeName,
                                                representativeCpf: newFiadorForm.representativeCpf,
                                                representativeRg: newFiadorForm.representativeRg
                                            }
                                        }
                                    }));

                                    setIsFiadorModalOpen(false);
                                } catch (err) {
                                    console.error('Erro ao salvar fiador:', err);
                                    toast.error('Erro ao salvar e vincular fiador no banco.');
                                } finally {
                                    setSaving(false);
                                }
                            }}
                        >
                            Salvar e Vincular Fiador
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

// Sub-components & Utility icons
function CloudCheck(props: any) { return <FileCheck {...props} />; }

function DetailRow({ label, value, isNew }: { label: string, value: any, isNew?: boolean }) {
    if (!value) return null;
    return (
        <div className="space-y-1 text-left">
            <p className="text-[9px] font-bold uppercase tracking-tighter opacity-40">{label}</p>
            <p className={`text-sm font-bold truncate ${isNew ? 'text-secondary' : 'text-slate-900'}`}>{value}</p>
        </div>
    );
}
