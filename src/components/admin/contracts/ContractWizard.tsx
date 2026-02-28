import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BaseCrudService } from '@/integrations';
import { ContractTemplates, Clients, Imveis, ServiceRecords, Contracts } from '@/entities';
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
    Save
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
    { id: 2, title: 'Partes', icon: Users },
    { id: 3, title: 'Imóvel', icon: Home },
    { id: 4, title: 'Financeiro', icon: DollarSign },
    { id: 5, title: 'Opcionais', icon: Settings },
    { id: 6, title: 'Revisão', icon: Eye },
    { id: 7, title: 'Assinatura', icon: PenTool },
];

export function ContractWizard({ isOpen, onClose, atendimento, onSuccess }: ContractWizardProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [saving, setSaving] = useState(false);
    const [contractId, setContractId] = useState<string | null>(null);
    const [isSeeding, setIsSeeding] = useState(false);
    const [isTemplateMissing, setIsTemplateMissing] = useState(false);
    const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
    const [editingParticipantKey, setEditingParticipantKey] = useState<string | null>(null);

    // Sync & Protection States
    const [isSyncConfirmationOpen, setIsSyncConfirmationOpen] = useState(false);
    const [pendingParticipantSync, setPendingParticipantSync] = useState<any>(null);
    const [hasSignedContract, setHasSignedContract] = useState(false);
    const [comparisonData, setComparisonData] = useState<{ current: any, next: any } | null>(null);

    // Data States
    const [templates, setTemplates] = useState<ContractTemplates[]>([]);
    const [clientes, setClientes] = useState<Clients[]>([]);
    const [imoveis, setImoveis] = useState<Imveis[]>([]);

    // Selection States
    const [selectedType, setSelectedType] = useState<string>('');
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [selectedImovelId, setSelectedImovelId] = useState<string>('');

    // Form States
    const [formData, setFormData] = useState<any>({
        // Partes (Múltiplos)
        LOCADORES_IDS: [],
        LOCATARIOS_IDS: [],
        VENDEDORES_IDS: [],
        COMPRADORES_IDS: [],
        PARTES_RELACIONADAS: [], // Ex: cônjuges
        PARTICIPANT_DETAILS: {}, // Overrides for client data {(clientId): {name, cpf, rg, profession, maritalStatus, etc}}
        // Financeiro
        VALOR_TOTAL: 0,
        VALOR_ENTRADA: 0,
        VALOR_ALUGUEL: 0,
        VALOR_CONDOMINIO: 0,
        VALOR_IPTU: 0,
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
        },
        // Testemunhas
        TESTEMUNHA1_NOME: '',
        TESTEMUNHA1_RG: '',
        TESTEMUNHA2_NOME: '',
        TESTEMUNHA2_RG: '',
    });

    const [previewContent, setPreviewContent] = useState('');
    const [pdfDiagnostics, setPdfDiagnostics] = useState<any>({
        templateId: '',
        templateName: '',
        htmlLength: 0,
        placeholderCount: 0,
        replacementsCount: 0,
        containerStats: { width: 0, height: 0 },
        lastError: '',
        status: 'idle'
    });
    const [showDebug, setShowDebug] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadInitialData();
            loadDraft();
        }
    }, [isOpen]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [templatesRes, clientsRes, imoveisRes] = await Promise.all([
                BaseCrudService.getAll<ContractTemplates>('templatescontratos'),
                BaseCrudService.getAll<Clients>('clientes'),
                BaseCrudService.getAll<Imveis>('imoveis')
            ]);

            setTemplates(templatesRes.items.filter(i => i.isActive));
            setClientes(clientsRes.items);
            setImoveis(imoveisRes.items);

            // Verifica se já existe algum contrato assinado para este atendimento
            const { items: allContracts } = await BaseCrudService.getAll<Contracts>('contratos');
            const signed = allContracts.some(c => c.atendimentoRef === atendimento._id && c.status === 'Assinado');
            setHasSignedContract(signed);

            // Tenta pré-vincular o cliente do atendimento na etapa de partes
            if (atendimento.clientePrincipalRef && formData.LOCATARIOS_IDS?.length === 0 && formData.COMPRADORES_IDS?.length === 0) {
                const client = clientsRes.items.find(c => c._id === atendimento.clientePrincipalRef);
                if (client) {
                    setFormData(prev => ({
                        ...prev,
                        LOCATARIOS_IDS: [client._id],
                        COMPRADORES_IDS: [client._id]
                    }));
                }
            }
        } catch (error) {
            toast.error('Erro ao conectar com o banco de dados');
        } finally {
            setLoading(false);
        }
    };

    const syncParticipantsWithCRM = async () => {
        try {
            setSaving(true);
            const { items: currentParties } = await BaseCrudService.getAll<ServiceParties>('atendimentopartes');
            const caseParties = currentParties.filter(p => p.serviceRecordRef === atendimento._id);

            // Coleta participantes do formData
            const group1Ids = selectedType.startsWith('Loc') ? formData.LOCADORES_IDS : formData.VENDEDORES_IDS;
            const group2Ids = selectedType.startsWith('Loc') ? formData.LOCATARIOS_IDS : formData.COMPRADORES_IDS;
            const relatedIds = formData.PARTES_RELACIONADAS || [];

            const participants = [
                ...(group1Ids || []).map((id: string) => ({ id, role: 'Vendedor' })),
                ...(group2Ids || []).map((id: string) => ({ id, role: 'Proponente' })),
                ...(relatedIds || []).map((id: string) => ({ id, role: 'Proponente' }))
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
                address: data.address || client.address,
                phoneNumber: data.phoneNumber || client.phoneNumber,
                rg: data.rg || (client as any).rg,
                profession: data.profession || (client as any).profession,
                maritalStatus: data.maritalStatus || (client as any).maritalStatus,
                gender: data.gender || (client as any).gender,
            };

            await BaseCrudService.update('clientes', updatePayload);

            // Se for o cliente principal do atendimento atual, atualiza também o atendimento
            if (atendimento.clientePrincipalRef === clientId) {
                await BaseCrudService.update('atendimentos', {
                    _id: atendimento._id,
                    contactName: data.name || (client as any).clientName,
                    contactPhone: data.phoneNumber || (client as any).phoneNumber,
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
            case 1: return !!selectedType;
            case 2:
                if (['LocacaoResidencial', 'LocacaoComercial'].includes(selectedType)) {
                    return formData.LOCADORES_IDS?.length > 0 && formData.LOCATARIOS_IDS?.length > 0;
                }
                if (selectedType === 'CompraEVenda') {
                    return formData.VENDEDORES_IDS?.length > 0 && formData.COMPRADORES_IDS?.length > 0;
                }
                return true;
            case 3:
                if (['EntregaChaves', 'AutorizacaoDivulgacao'].includes(selectedType)) return true;
                return !!selectedImovelId;
            case 4:
                if (selectedType.startsWith('Locacao')) return !!formData.VALOR_ALUGUEL;
                if (selectedType === 'CompraEVenda') return !!formData.VALOR_TOTAL;
                return true;
            default: return true;
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

        return true;
    };

    const generateAndSavePDF = async (downloadName?: string) => {
        setIsGeneratingPdf(true);
        setPdfDiagnostics(prev => ({ ...prev, status: 'generating', lastError: '' }));
        console.log('[PDF] Iniciando fluxo de geração...', { downloadName, contentLength: previewContent?.length });

        try {
            // 1. Validar conteúdo HTML
            console.log('[PDF] Etapa 1: Validando HTML...');
            validatePDFBeforeGeneration(previewContent);

            // 2. Garantir container visível para o renderizador
            console.log('[PDF] Etapa 2: Preparando renderizador off-screen...');
            const sourceContainer = document.getElementById('contract-preview-container');
            if (!sourceContainer) throw new Error('Container de preview não encontrado');

            const hiddenRenderContainer = document.createElement('div');
            hiddenRenderContainer.id = 'robotic-pdf-renderer';
            hiddenRenderContainer.style.position = 'fixed';
            hiddenRenderContainer.style.left = '-9999px';
            hiddenRenderContainer.style.top = '0';
            hiddenRenderContainer.style.width = '794px'; // Largura A4 aprox
            hiddenRenderContainer.style.background = 'white';
            hiddenRenderContainer.style.display = 'block';
            hiddenRenderContainer.style.zIndex = '-1';
            hiddenRenderContainer.innerHTML = previewContent;
            document.body.appendChild(hiddenRenderContainer);

            // 3. Aguardar renderização (frames e assets)
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            await new Promise(resolve => setTimeout(resolve, 500)); // Delay para fontes/imagens

            const height = hiddenRenderContainer.offsetHeight;
            const width = hiddenRenderContainer.offsetWidth;

            setPdfDiagnostics(prev => ({
                ...prev,
                htmlLength: previewContent.length,
                containerStats: { width, height },
                placeholderCount: (previewContent.match(/\{\{/g) || []).length
            }));

            if (height < 200) {
                document.body.removeChild(hiddenRenderContainer);
                throw new Error(`Falha no render: a altura do documento está muito baixa (${height}px). Certifique-se que o preview não está vazio.`);
            }

            // 4. Capturar Canvas
            console.log('[PDF] Etapa 3: Capturando Canvas (html2canvas)...');
            const canvas = await html2canvas(hiddenRenderContainer, {
                scale: 2,
                useCORS: true,
                logging: true,
                windowWidth: 800,
                backgroundColor: '#ffffff'
            });

            // Limpar container temporário
            document.body.removeChild(hiddenRenderContainer);

            console.log('[PDF] Etapa 4: Gerando documento jsPDF...');
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            let heightLeft = pdfHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();

            while (heightLeft >= 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();
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
                containerHeight: height,
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
                currentStep: 7,
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
            const group1Ids = selectedType.startsWith('Loc') ? formData.LOCADORES_IDS : formData.VENDEDORES_IDS;
            const group2Ids = selectedType.startsWith('Loc') ? formData.LOCATARIOS_IDS : formData.COMPRADORES_IDS;

            const allParticipants = [
                ...(group1Ids || []).map((id: string) => ({ id, role: selectedType.startsWith('Loc') ? 'Locador' : 'Vendedor' })),
                ...(group2Ids || []).map((id: string) => ({ id, role: selectedType.startsWith('Loc') ? 'Locatário' : 'Comprador' }))
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

        if (currentStep === 7) {
            try {
                // 1. Gerar e Salvar PDF Final (já faz o commit no banco de documentos)
                const pdfUrl = await generateAndSavePDF();

                // 1.1 Sincronizar participantes com o CRM
                await syncParticipantsWithCRM();

                // 2. Registrar Contrato na Coleção 'contratos' com HTML Final
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

        if (nextStep === 6) {
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
            await BaseCrudService.create<ContractTemplates>('templatescontratos', {
                templateName: `Template Padrão ${selectedType}`,
                contractType: selectedType as any,
                templateFormat: 'HTML',
                templateBody: templateHtml,
                isActive: true,
                version: 1
            });
            toast.success("Template instalado com sucesso!");

            // Recarregar templates
            const res = await BaseCrudService.getAll<ContractTemplates>('templatescontratos');
            setTemplates(res.items.filter(i => i.isActive));
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

    const generatePreview = () => {
        // Tenta encontrar o template exato, senão busca o primeiro do mesmo tipo, senão qualquer um ativo
        let template = templates.find(t => t.contractType === selectedType && t.isActive);
        if (!template) template = templates.find(t => t.isActive);

        const imovel = imoveis.find(i => i._id === selectedImovelId);

        const engineData = ContractEngine.mapEntitiesToData(atendimento, clientes, imovel, formData);

        // Suporte para múltiplos campos de conteúdo (flexibilidade do schema)
        const templateRaw = template?.templateBody || template?.templateContent;

        if (templateRaw && templateRaw.length > 50) {
            setIsTemplateMissing(false);
            const processed = ContractEngine.renderContract(templateRaw, engineData);
            setPreviewContent(processed);
            return processed;
        } else {
            setIsTemplateMissing(true);
            setPreviewContent('');
            return '';
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
                                { id: 'LocacaoResidencial', name: 'Locação Residencial', icon: Home, color: 'bg-emerald-500', desc: 'Contratos padrão de moradia 12-30 meses.' },
                                { id: 'LocacaoComercial', name: 'Locação Comercial', icon: Building2, color: 'bg-blue-500', desc: 'Salas, lojas e galpões para empresas.' },
                                { id: 'CompraEVenda', name: 'Compra e Venda', icon: DollarSign, color: 'bg-amber-500', desc: 'Promessa de compra e venda de imóveis.' },
                                { id: 'EntregaChaves', name: 'Entrega de Chaves', icon: Key, color: 'bg-purple-500', desc: 'Termo de entrega e vistoria final.' },
                                { id: 'AutorizacaoDivulgacao', name: 'Autorização de Divulgação', icon: Globe, color: 'bg-pink-500', desc: 'Autorização do proprietário para marketing.' },
                            ].map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedType(item.id)}
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

            case 2: // ETAPA 2: PARTES (Múltiplos)
                const isLocStep = selectedType.startsWith('Locacao');
                const group1Label = isLocStep ? 'Locador (Proprietário)' : 'Vendedor';
                const group2Label = isLocStep ? 'Locatário (Inquilino)' : 'Comprador';
                const group1Key = isLocStep ? 'LOCADORES_IDS' : 'VENDEDORES_IDS';
                const group2Key = isLocStep ? 'LOCATARIOS_IDS' : 'COMPRADORES_IDS';

                const renderParticipantGroup = (label: string, fieldKey: string, color: 'emerald' | 'blue') => {
                    const ids = formData[fieldKey] || [];
                    const bgColor = color === 'emerald' ? 'bg-emerald-50' : 'bg-blue-50';
                    const borderColor = color === 'emerald' ? 'border-emerald-100' : 'border-blue-100';
                    const textColor = color === 'emerald' ? 'text-emerald-900' : 'text-blue-900';
                    const subTextColor = color === 'emerald' ? 'text-emerald-700/80' : 'text-blue-700/80';

                    return (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-black uppercase tracking-widest text-slate-400">{label}</Label>
                                <Badge variant="secondary" className="rounded-md">{ids.length} Selecionados</Badge>
                            </div>

                            <div className="space-y-4">
                                {ids.map((id: string, index: number) => {
                                    const client = clientes.find(c => c._id === id);
                                    return (
                                        <div key={`${fieldKey}-${index}`} className="animate-in fade-in slide-in-from-left-2 duration-300">
                                            <div className="flex gap-2 mb-2">
                                                <Select
                                                    value={id}
                                                    onValueChange={(val) => {
                                                        const newIds = [...ids];
                                                        newIds[index] = val;
                                                        setFormData((p: any) => ({ ...p, [fieldKey]: newIds }));
                                                    }}
                                                >
                                                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none px-6 focus:ring-secondary flex-1">
                                                        <SelectValue placeholder="Selecionar cliente..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl">
                                                        {clientes.map(c => {
                                                            const d = formData.PARTICIPANT_DETAILS?.[c._id] || {};
                                                            const displayName = d.name || c.clientName;
                                                            return (
                                                                <SelectItem key={c._id} value={c._id} disabled={ids.includes(c._id) && c._id !== id}>
                                                                    {displayName} - {formatCPF(d.cpf || c.cpfCnpj || '')}
                                                                </SelectItem>
                                                            );
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                    onClick={() => {
                                                        const newIds = ids.filter((_: any, i: number) => i !== index);
                                                        setFormData((p: any) => ({ ...p, [fieldKey]: newIds }));
                                                    }}
                                                >
                                                    <ChevronLeft className="rotate-45 w-5 h-5" />
                                                </Button>
                                            </div>

                                            {client && (() => {
                                                const d = (formData?.PARTICIPANT_DETAILS?.[id]) || {};
                                                const name = d.name || client.clientName;
                                                const cpf = d.cpf || client.cpfCnpj || '';
                                                const emailOrCivil = color === 'emerald'
                                                    ? (d.maritalStatus || (client as any).maritalStatus || 'N/D')
                                                    : (d.email || client.emailPrincipal || 'N/D');

                                                return (
                                                    <div className={`p-6 ${bgColor} rounded-[24px] border ${borderColor} space-y-4`}>
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex items-center gap-2">
                                                                <p className={`text-sm font-bold ${textColor}`}>{name}</p>
                                                                {d.name && <Badge variant="secondary" className="text-[8px] h-4 bg-secondary/10 text-secondary border-none">Editado</Badge>}
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className={`h-8 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest ${color === 'emerald' ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20' : 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20'}`}
                                                                onClick={() => {
                                                                    setEditingParticipantId(id);
                                                                    setEditingParticipantKey(fieldKey);
                                                                }}
                                                            >
                                                                < PenTool className="w-3 h-3 mr-1.5" /> Editar Dados
                                                            </Button>
                                                        </div>
                                                        <div className={`grid grid-cols-2 gap-2 text-[11px] ${subTextColor}`}>
                                                            <span>CPF: {formatCPF(cpf)}</span>
                                                            <span>{color === 'emerald' ? `Civil: ${emailOrCivil}` : `Email: ${emailOrCivil}`}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    );
                                })}

                                <Button
                                    variant="outline"
                                    className="w-full h-14 rounded-2xl border-dashed border-2 border-slate-200 text-slate-400 hover:text-secondary hover:border-secondary transition-all"
                                    onClick={() => {
                                        setFormData((p: any) => ({ ...p, [fieldKey]: [...ids, ''] }));
                                    }}
                                >
                                    + Adicionar outro {label}
                                </Button>
                            </div>
                        </div>
                    );
                };

                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="text-center space-y-2">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Vincular Partes do CRM</h3>
                            <p className="text-slate-500">Adicione todos os vendedores e compradores envolvidos no registro.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
                            {renderParticipantGroup(group1Label, group1Key, 'emerald')}
                            {renderParticipantGroup(group2Label, group2Key, 'blue')}
                        </div>
                    </div>
                );

            case 3: // ETAPA 3: IMÓVEL
                const imovel = imoveis.find(i => i._id === selectedImovelId);
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="text-center space-y-2">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">O Imóvel do Contrato</h3>
                            <p className="text-slate-500">Os dados serão extraídos da matrícula cadastrada para evitar erros jurídicos.</p>
                        </div>
                        <Select value={selectedImovelId} onValueChange={setSelectedImovelId}>
                            <SelectTrigger className="h-20 rounded-[24px] bg-slate-50 border-none px-8 text-lg font-bold">
                                <SelectValue placeholder="Selecionar Imóvel pelo Código (Ex: AP120)..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                {imoveis.map(i => <SelectItem key={i._id} value={i._id}>{i.codigoReference} - {i.logradouro}, {i.numero}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        {imovel && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm space-y-1">
                                    <Badge variant="outline" className="text-xs uppercase text-slate-400 border-none px-0">Matrícula</Badge>
                                    <p className="text-lg font-black text-slate-900">{(imovel as any).matricula || 'PENDENTE'}</p>
                                </div>
                                <div className="p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm space-y-1">
                                    <Badge variant="outline" className="text-xs uppercase text-slate-400 border-none px-0">IPTU (SQL)</Badge>
                                    <p className="text-lg font-black text-slate-900">{imovel.valorIPTU || 'N/D'}</p>
                                </div>
                                <div className="p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm space-y-1">
                                    <Badge variant="outline" className="text-xs uppercase text-slate-400 border-none px-0">Área Útil</Badge>
                                    <p className="text-lg font-black text-slate-900">{(imovel as any).areaPrivativa || (imovel as any).areaConstruida || 0} m²</p>
                                </div>
                                <div className="col-span-1 md:col-span-3 p-8 bg-slate-50 rounded-[32px] flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                        <Globe className="w-6 h-6 text-secondary" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Localização Completa</p>
                                        <p className="text-slate-900 font-medium">{imovel.logradouro}, {imovel.numero} - {imovel.bairro}, {imovel.cidade}/{imovel.estado}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 4: // ETAPA 4: FINANCEIRO
                const isRentStep = selectedType.startsWith('Locacao');
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="text-center space-y-2">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Acordo Financeiro</h3>
                            <p className="text-slate-500">Formatado automaticamente para evitar divergências de valores.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {isRentStep ? (
                                <>
                                    <div className="space-y-3">
                                        <Label className="font-bold text-slate-700">Valor do Aluguel (Mensal)</Label>
                                        <Input
                                            value={formatCurrency(formData.VALOR_ALUGUEL || 0)}
                                            onChange={(e) => setFormData({ ...formData, VALOR_ALUGUEL: parseCurrency(e.target.value) })}
                                            className="h-16 rounded-2xl text-xl font-black bg-slate-50 border-none px-6"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="font-bold text-slate-700">Tipo de Garantia</Label>
                                        <Select value={formData.GARANTIA} onValueChange={(v) => setFormData({ ...formData, GARANTIA: v })}>
                                            <SelectTrigger className="h-16 rounded-2xl bg-slate-50 border-none px-6">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl">
                                                <SelectItem value="Caucao">Depósito Caução (3 meses)</SelectItem>
                                                <SelectItem value="SeguroFianca">Seguro Fiança / Título de Capitalização</SelectItem>
                                                <SelectItem value="Fiador">Fiador com Imóvel Escriturado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {formData.GARANTIA === 'Caucao' && (
                                        <div className="col-span-1 md:col-span-2 p-8 bg-blue-50/50 rounded-[32px] border border-blue-100 space-y-6">
                                            <div className="flex items-center gap-2 text-blue-700 font-black uppercase text-xs tracking-widest">
                                                <ShieldCheck className="w-5 h-5" />
                                                Dados para Depósito da Caução
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-slate-500">Banco</Label>
                                                    <Input
                                                        value={formData.CAUCAO_BANCO}
                                                        onChange={(e) => setFormData({ ...formData, CAUCAO_BANCO: e.target.value })}
                                                        className="bg-white border-slate-200 rounded-xl"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-slate-500">Agência</Label>
                                                    <Input
                                                        value={formData.CAUCAO_AGENCIA}
                                                        onChange={(e) => setFormData({ ...formData, CAUCAO_AGENCIA: e.target.value })}
                                                        className="bg-white border-slate-200 rounded-xl"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-slate-500">Conta / Operação</Label>
                                                    <Input
                                                        value={formData.CAUCAO_CONTA}
                                                        onChange={(e) => setFormData({ ...formData, CAUCAO_CONTA: e.target.value })}
                                                        className="bg-white border-slate-200 rounded-xl"
                                                    />
                                                </div>
                                                <div className="space-y-2 md:col-span-2">
                                                    <Label className="text-xs font-bold text-slate-500">Titular da Conta</Label>
                                                    <Input
                                                        value={formData.CAUCAO_TITULAR}
                                                        onChange={(e) => setFormData({ ...formData, CAUCAO_TITULAR: e.target.value })}
                                                        className="bg-white border-slate-200 rounded-xl"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-slate-500">CPF/CNPJ do Titular</Label>
                                                    <Input
                                                        value={formData.CAUCAO_CPF}
                                                        onChange={(e) => setFormData({ ...formData, CAUCAO_CPF: e.target.value })}
                                                        className="bg-white border-slate-200 rounded-xl"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <Label className="font-bold text-slate-700">Prazo de Contrato (Meses)</Label>
                                        <Input
                                            type="number"
                                            value={formData.PRAZO_MESES}
                                            onChange={(e) => setFormData({ ...formData, PRAZO_MESES: e.target.value })}
                                            className="h-16 rounded-2xl bg-slate-50 border-none px-6"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="font-bold text-slate-700">Índice de Reajuste</Label>
                                        <Select value={formData.REAJUSTE_INDICE} onValueChange={(v) => setFormData({ ...formData, REAJUSTE_INDICE: v })}>
                                            <SelectTrigger className="h-16 rounded-2xl bg-slate-50 border-none px-6">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl">
                                                <SelectItem value="IPCA">IPCA (IBGE)</SelectItem>
                                                <SelectItem value="IGPM">IGP-M (FGV)</SelectItem>
                                                <SelectItem value="INPC">INPC</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        <Label className="font-bold text-slate-700">Valor Total da Transação</Label>
                                        <Input
                                            value={formatCurrency(formData.VALOR_TOTAL || 0)}
                                            onChange={(e) => setFormData({ ...formData, VALOR_TOTAL: parseCurrency(e.target.value) })}
                                            className="h-16 rounded-2xl text-xl font-black bg-slate-50 border-none px-6"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="font-bold text-slate-700">Valor de Entrada (Sinal)</Label>
                                        <Input
                                            value={formatCurrency(formData.VALOR_ENTRADA || 0)}
                                            onChange={(e) => setFormData({ ...formData, VALOR_ENTRADA: parseCurrency(e.target.value) })}
                                            className="h-16 rounded-2xl bg-slate-50 border-none px-6"
                                        />
                                    </div>
                                    <div className="space-y-3 col-span-2">
                                        <Label className="font-bold text-slate-700">Observações de Pagamento</Label>
                                        <textarea
                                            placeholder="Descreva as parcelas, financiamento, ou troca de bens..."
                                            value={formData.FORMA_PAGAMENTO}
                                            onChange={(e) => setFormData({ ...formData, FORMA_PAGAMENTO: e.target.value })}
                                            className="w-full min-h-[120px] rounded-[24px] bg-slate-50 border-none p-6 text-sm resize-none"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                );

            case 5: // ETAPA 5: OPCIONAIS
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 text-center">
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Customizações Legais</h3>
                            <p className="text-slate-500">Selecione cláusulas que serão inseridas automaticamente no corpo do texto.</p>
                        </div>
                        <div className="space-y-12">
                            <div className="space-y-4">
                                <Label className="text-secondary font-black uppercase tracking-widest text-xs">Testemunhas do Contrato</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                                    <div className="p-6 bg-slate-50 rounded-3xl space-y-4 border border-slate-100">
                                        <Label className="font-bold text-slate-700">Testemunha 1 (Nome)</Label>
                                        <Input
                                            placeholder="Nome completo"
                                            value={formData.TESTEMUNHA1_NOME}
                                            onChange={(e) => setFormData({ ...formData, TESTEMUNHA1_NOME: e.target.value })}
                                            className="bg-white border-none rounded-xl"
                                        />
                                        <Label className="font-bold text-slate-700">RG / CPF</Label>
                                        <Input
                                            placeholder="Documento"
                                            value={formData.TESTEMUNHA1_RG}
                                            onChange={(e) => setFormData({ ...formData, TESTEMUNHA1_RG: e.target.value })}
                                            className="bg-white border-none rounded-xl"
                                        />
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-3xl space-y-4 border border-slate-100">
                                        <Label className="font-bold text-slate-700">Testemunha 2 (Nome)</Label>
                                        <Input
                                            placeholder="Nome completo"
                                            value={formData.TESTEMUNHA2_NOME}
                                            onChange={(e) => setFormData({ ...formData, TESTEMUNHA2_NOME: e.target.value })}
                                            className="bg-white border-none rounded-xl"
                                        />
                                        <Label className="font-bold text-slate-700">RG / CPF</Label>
                                        <Input
                                            placeholder="Documento"
                                            value={formData.TESTEMUNHA2_RG}
                                            onChange={(e) => setFormData({ ...formData, TESTEMUNHA2_RG: e.target.value })}
                                            className="bg-white border-none rounded-xl"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-secondary font-black uppercase tracking-widest text-xs">Cláusulas Acessórias</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { id: 'SUBLOCACAO', label: 'Proibir Sublocação', icon: ShieldCheck },
                                        { id: 'PINTURA_NOVA', label: 'Entrega com Pintura Nova (Suvinil)', icon: Hammer },
                                        { id: 'VISTORIA_DETALHADA', label: 'Laudo de Vistoria com Fotos anexo', icon: FileCheck },
                                        { id: 'EXCLUSIVIDADE', label: 'Cláusula de Exclusividade', icon: ShieldCheck },
                                        { id: 'FORO_SAO_PAULO', label: 'Eleição de Foro: São Paulo/SP', icon: Globe },
                                    ].map(clause => (
                                        <div
                                            key={clause.id}
                                            className={`p-6 rounded-[24px] border-2 transition-all flex items-center gap-4 justify-between ${formData.OPCIONAIS[clause.id] ? 'border-secondary bg-secondary/5' : 'border-slate-100 bg-white'
                                                }`}
                                        >
                                            <div className="flex-1 text-left">
                                                <p className="text-sm font-bold text-slate-900">{clause.label}</p>
                                            </div>
                                            <Switch
                                                checked={formData.OPCIONAIS[clause.id]}
                                                onCheckedChange={(checked) => setFormData((p: any) => ({
                                                    ...p,
                                                    OPCIONAIS: { ...p.OPCIONAIS, [clause.id]: checked }
                                                }))}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 6: // ETAPA 6: REVISÃO
                return (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 h-full flex flex-col">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Prévia do Instrumento</h3>
                                <p className="text-slate-500 text-sm">O texto abaixo foi gerado dinamicamente. Revise cada parágrafo.</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hover:text-secondary"
                                    onClick={() => setShowDebug(!showDebug)}
                                >
                                    {showDebug ? 'Ocultar Diagnóstico' : 'Diagnóstico PDF'}
                                </Button>
                                <Button variant="outline" className="rounded-xl border-slate-200 gap-2 font-bold" onClick={generatePreview}>
                                    <Save className="w-4 h-4" /> Recarregar Variáveis
                                </Button>
                                <Button
                                    className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white gap-2 font-bold"
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

            case 7: // ETAPA 7: ASSINATURA
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
                                                    <p className="text-sm font-black text-white">{templates.find(t => t.contractType === selectedType)?.templateName || selectedType}</p>
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
                                    <DialogTitle className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">Etapa {currentStep} de 7</DialogTitle>
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
                                            {s.id < 7 && (
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
                                        {currentStep === 7 ? 'Finalizar e Registrar' : 'Avançar Etapa'}
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
                                    name: client?.clientName || '',
                                    cpf: client?.cpfCnpj || '',
                                    rg: (client as any)?.rg || '',
                                    profession: (client as any)?.profession || '',
                                    maritalStatus: (client as any)?.maritalStatus || '',
                                    gender: (client as any)?.gender || 'Masculino',
                                    email: client?.emailPrincipal || '',
                                    address: client?.address || '',
                                    spouseId: (client as any)?.spouseRef || ''
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

                                return (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase">Nome Completo</Label>
                                                <Input
                                                    value={details.name}
                                                    onChange={(e) => updateDetail('name', e.target.value)}
                                                    className="h-14 rounded-2xl bg-white border-slate-200"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase">Email</Label>
                                                <Input
                                                    value={details.email}
                                                    onChange={(e) => updateDetail('email', e.target.value)}
                                                    className="h-14 rounded-2xl bg-white border-slate-200"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase">CPF</Label>
                                                <Input
                                                    value={details.cpf}
                                                    onChange={(e) => updateDetail('cpf', e.target.value)}
                                                    className="h-14 rounded-2xl bg-white border-slate-200"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase">RG</Label>
                                                <Input
                                                    value={details.rg}
                                                    onChange={(e) => updateDetail('rg', e.target.value)}
                                                    className="h-14 rounded-2xl bg-white border-slate-200"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase">Profissão</Label>
                                                <Input
                                                    value={details.profession}
                                                    onChange={(e) => updateDetail('profession', e.target.value)}
                                                    className="h-14 rounded-2xl bg-white border-slate-200"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase">Estado Civil</Label>
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
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase">Endereço Completo</Label>
                                            <Input
                                                value={details.address}
                                                onChange={(e) => updateDetail('address', e.target.value)}
                                                className="h-14 rounded-2xl bg-white border-slate-200"
                                            />
                                        </div>

                                        <div className="p-6 bg-secondary/5 rounded-[24px] border border-secondary/10 space-y-4">
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
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="p-8 bg-white border-t border-slate-100 flex justify-end">
                            <Button
                                className="px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold h-12"
                                onClick={async () => {
                                    const clientId = editingParticipantId!;
                                    const updatedData = formData.PARTICIPANT_DETAILS[clientId] || {};
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
