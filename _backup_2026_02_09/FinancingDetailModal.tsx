import { useEffect, useState, useRef } from 'react';
import {
    Archive,
    Plus,
    AlertCircle,
    CheckCircle,
    Clock,
    X,
    Save,
    FileText,
    History,
    Users,
    User,
    ClipboardList,
    UserCheck,
    Upload,
    Trash2,
    Calendar,
    RotateCcw,
    CheckSquare,
    AlertTriangle,
    Download,
    Eye,
    Building2,
    Landmark,
    Wrench,
    FileCheck,
    Ban,
    Folder
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BaseCrudService } from '@/integrations';
import { ServiceRecords, UsuriosdoSistema, PendnciasdoFinanciamento, FinancingTasks, ServiceParties, Clients, DocumentosdoFinanciamento, HistricodeInteraes, Imveis, AtendimentoImveis, ChecklistdosProponentes } from '@/entities';
import { formatCurrency, parseCurrency, formatCPF, parseCPF, handleCurrencyInput, handleCPFInput } from '@/lib/input-masks';
import { STAGE_CHECKLISTS, ChecklistAnswer } from '@/config/FinancingChecklists';
import { FinancingStageChecklist } from '@/components/financiamento/FinancingStageChecklist';
import { motion, AnimatePresence } from 'framer-motion';

// --- Interfaces & Constants (copied from Kanban) ---

interface FinancingCase {
    _id: string;
    agencia?: string;
    proponentePrincipal: string;
    cpfProponentePrincipal?: string;
    pastaInterna?: string;
    status: string;
    faseAtual: string;
    faseAnterior?: string;
    dataEntradaFaseAtual?: string;
    diasNaFase: number;
    pendenciasAbertas: number;
    tarefasAbertas: number;
    modalidade?: string;
    ehEmpreendimento?: boolean;
    statusResultadoFinanciamento?: 'Aprovado' | 'Condicionado' | 'Reprovado' | 'Em andamento' | '';
    bloqueioDocumento?: boolean;
    bloqueioCaixa?: boolean;
    bloqueioCartorio?: boolean;
    bloqueioCliente?: boolean;
    bloqueioEngenharia?: boolean;
    bloqueioFormularios?: boolean;
    bloqueioRestricao?: boolean;
    bloqueioFgts?: boolean;
    cpf?: string;
    email?: string;
    phoneNumber?: string;
    numeroMatricula?: string;
    numeroContrato?: string;
    numeroProtocoloCartorio?: string;
    dataRegistroCartorio?: string;
    enderecoImovel?: string;
    valorItbi?: number;
    valorPrenotacaoCartorio?: number;
    valorProdutoNegociado?: number;
    valorTaxaVista?: number;
    valorRegistro?: number;
    pagoItbi?: boolean;
    pagoPrenotacao?: boolean;
    pagoProdutoNegociado?: boolean;
    pagoTaxaVista?: boolean;
    pagoRegistro?: boolean;
    propertyValue?: number;
    desiredFinancingValue?: number;
    approvedFinancingValue?: number;
    appraisalValue?: number;
    useFgts?: boolean;
    fgtsValue?: number;
    hasCommercialProposal?: boolean;
    hasCheckingAccountWithOverdraft?: boolean;
    hasCheckingAccountWithoutOverdraft?: boolean;
    hasCreditCard?: boolean;
    responsibleInternalId?: string;
    responsibleExternal?: string;
    bankName?: string;
    bankAccountNumber?: string;
    financingContractNumber?: string;
    notes?: string;
    isArchived?: boolean;
    createdDate: string;
    updatedDate: string;
    propertyRefs?: string[];
    checklistStatus?: Record<string, Record<string, boolean>>;
    checklistResponses?: Record<string, Record<string, ChecklistAnswer>>;
}

interface Pending {
    _id: string;
    atendimentoRef: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate: string;
    responsiblePartyType: string;
    responsiblePartyDetails?: string;
    taskAutomaticallyCreated: boolean;
    creationDate: string;
    bloqueiaFase?: boolean;
    categoria?: string;
}

interface Task {
    _id: string;
    description: string;
    atendimentoRef: string;
    pendenciaRef?: string;
    responsibleType: string;
    internalResponsibleId?: string;
    externalResponsibleName?: string;
    externalResponsibleContact?: string;
    dueDate: string;
    status: string;
    creationDate: string;
    titulo?: string; // Add optional title to match usage
}

interface ProponentChecklist {
    _id?: string;
    atendimentoRef: string;
    clientRef: string;
    hasFgtsContribution?: boolean;
    hasDependent?: boolean;
    declaresIncomeTax?: boolean;
    ownsProperty?: boolean;
    hasActiveFinancing?: boolean;
    isFirstAcquisition?: boolean;
}

interface Vendor {
    _id: string;
    clientRef: string;
    name: string;
    cpf: string;
    contato?: string;
    email?: string;
    banco?: string;
    agencia?: string;
    conta?: string;
    tipoConta?: string;
    chavePix?: string;
    estadoCivil?: string;
    ehConjugeDe?: string;
    conjugeNaoParticipa?: boolean;
}

interface VendorDocument {
    _id: string;
    docTipo: string;
    recebido: boolean;
    arquivo?: string;
    ativo: boolean;
    observacoes?: string;
    obrigatorio?: boolean;
}

// Interface for proponent documents (CMS collection)
interface DocumentosProponentes {
    _id: string;
    _createdDate?: Date;
    _updatedDate?: Date;
    financingCaseRef?: string;
    proponentRef?: string;
    documentName?: string;
    isMandatory?: boolean;
    isReceived?: boolean;
    isActive?: boolean;
    hasInsurancePrepayment?: boolean;
}

// Alias for compatibility
type FinanciamentoDocsVendedor = VendorDocument;

const FINANCING_COLUMNS = [
    { id: 'novos-clientes', name: 'Novos clientes' },
    { id: 'cadastro-cliente', name: 'Cadastro de cliente' },
    { id: 'avaliacao-risco', name: 'Avaliação de risco' },
    { id: 'engenharia', name: 'Engenharia' },
    { id: 'fgts', name: 'FGTS' },
    { id: 'siopi', name: 'SIOPI' },
    { id: 'formularios', name: 'Assinatura de Formulários' },
    { id: 'sictd', name: 'SICTD' },
    { id: 'aguardando-conformidade', name: 'Aguardando Conformidade' },
    { id: 'entrevista', name: 'Entrevista' },
    { id: 'assinatura-minuta', name: 'Minuta' },
    { id: 'itbi', name: 'ITBI' },
    { id: 'cartorio-rsales', name: 'Cartório R.Sales' },
    { id: 'garantia', name: 'Garantia' },
    { id: 'concluido', name: 'Concluído' },
    { id: 'acompanhamento-obra', name: 'Acompanhamento de obra' },
    { id: 'aguardando-imovel', name: 'Aguardando o imóvel' },
    { id: 'condicionados', name: 'Condicionados' },
    { id: 'reprovados', name: 'Reprovados' }
];

const CHECKLIST_DISPLAY_ORDER = [
    'novos-clientes', 'cadastro-cliente', 'avaliacao-risco', 'condicionados', 'reprovados',
    'engenharia', 'fgts', 'siopi', 'formularios', 'sictd', 'aguardando-conformidade',
    'entrevista', 'assinatura-minuta', 'itbi', 'cartorio-rsales', 'garantia',
    'concluido', 'acompanhamento-obra', 'aguardando-imovel'
];

const DEFAULT_PROPONENT_DOCUMENTS = [
    { documentName: 'Documento de Identificação (RG, CPF ou CNH)', isMandatory: true },
    { documentName: 'Certidão de nascimento ou casamento', isMandatory: true },
    { documentName: 'Comprovante de residência atual', isMandatory: false },
    { documentName: 'Holerite dos últimos 2 meses', isMandatory: false },
    { documentName: 'Pró-labore dos últimos 3 meses (se houver)', isMandatory: false },
    { documentName: 'Extrato do FGTS (se houver)', isMandatory: false },
    { documentName: 'Declaração de Imposto de Renda (se houver)', isMandatory: false }
];

interface FinancingDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    caseId: string | null;
    initialTab?: string;
    onUpdate?: () => void;
}

export function FinancingDetailModal({ open, onOpenChange, caseId, initialTab = 'dados', onUpdate }: FinancingDetailModalProps) {
    const [selectedCase, setSelectedCase] = useState<FinancingCase | null>(null);
    const [modalTab, setModalTab] = useState(initialTab);
    const [loading, setLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // Data States
    const [participants, setParticipants] = useState<ServiceParties[]>([]);
    const [users, setUsers] = useState<UsuriosdoSistema[]>([]);
    const [clients, setClients] = useState<Clients[]>([]);
    const [proponentChecklists, setProponentChecklists] = useState<Map<string, ProponentChecklist>>(new Map());
    const [proponentDocuments, setProponentDocuments] = useState<DocumentosProponentes[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [vendorDocuments, setVendorDocuments] = useState<Map<string, VendorDocument[]>>(new Map());
    const [pendings, setPendings] = useState<Pending[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [documents, setDocuments] = useState<DocumentosdoFinanciamento[]>([]);
    const [history, setHistory] = useState<HistricodeInteraes[]>([]);
    const [properties, setProperties] = useState<Imveis[]>([]);

    // UI States
    const [selectedProponentId, setSelectedProponentId] = useState<string>('');
    const [selectedVendorId, setSelectedVendorId] = useState<string>('');
    const [showPendingForm, setShowPendingForm] = useState(false);
    const [editingPending, setEditingPending] = useState<Pending | null>(null);
    const [newPendingData, setNewPendingData] = useState({
        description: '',
        responsiblePartyType: 'Interno',
        averageDaysToComplete: 7
    });
    const [showTaskFormInModal, setShowTaskFormInModal] = useState(false);
    const [newTaskData, setNewTaskData] = useState({
        description: '',
        responsibleType: 'Interno',
        internalResponsibleId: '',
        externalResponsibleName: '',
        externalResponsibleContact: '',
        dueDate: '',
        responsavelExternoRef: '' // Added missing field
    });
    const [newParticipant, setNewParticipant] = useState({
        clientRef: '',
        roleInService: 'Participante/Dependente',
        participationPercentage: 0
    });
    const [newVendor, setNewVendor] = useState({
        clientRef: '',
        name: '',
        cpf: '',
        contato: '',
        email: '',
        banco: '',
        agencia: '',
        conta: '',
        tipoConta: 'Corrente',
        chavePix: '',
        estadoCivil: '',
        ehConjugeDe: '',
        conjugeNaoParticipa: false
    });

    // Form State
    const [caseFormData, setCaseFormData] = useState<Partial<FinancingCase>>({});
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

    // Load Data Effect
    useEffect(() => {
        if (open && caseId) {
            loadData(caseId);
            setModalTab(initialTab);
        }
    }, [open, caseId, initialTab]);

    const loadData = async (id: string) => {
        setLoading(true);
        try {
            // 1. Fetch main service record
            const atendimento = await BaseCrudService.getById<ServiceRecords>('atendimentos', id);
            if (!atendimento) return;

            // 2. Fetch related data (filtered where possible, or all then filtered)
            const [
                usersList,
                clientsList,
                participantsList,
                checklistsList,
                docsList,
                allHistory,
                propsList,
                allVendorDocs,
                allProponentDocs,
                allPendings,
                allTasks
            ] = await Promise.all([
                BaseCrudService.getAll<UsuriosdoSistema>('usuariossistema'),
                BaseCrudService.getAll<Clients>('clientes'),
                BaseCrudService.getAll<ServiceParties>('atendimentopartes'),
                BaseCrudService.getAll<ChecklistdosProponentes>('checklistproponentes'),
                BaseCrudService.getAll<DocumentosdoFinanciamento>('documentosfinanciamento'),
                BaseCrudService.getAll<HistricodeInteraes>('historicointeracoes'),
                BaseCrudService.getAll<Imveis>('imoveis'),
                BaseCrudService.getAll<FinanciamentoDocsVendedor>('financiamentodocsvendedor'),
                BaseCrudService.getAll<DocumentosProponentes>('documentosproponentes'),
                BaseCrudService.getAll<PendnciasdoFinanciamento>('pendenciasfinanciamento'),
                BaseCrudService.getAll<FinancingTasks>('tarefasfinanciamento'),
            ]);

            // Set simple lists
            setUsers(usersList.items);
            setClients(clientsList.items);
            setProperties(propsList.items);

            const filteredPendings = allPendings.items.filter(p => p.atendimentoRef === id);
            setPendings(filteredPendings as Pending[]);

            const filteredTasks = allTasks.items.filter(t => t.atendimentoRef === id);
            setTasks(filteredTasks as Task[]);

            const filteredDocs = docsList.items.filter(d => d.atendimentoRef === id);
            setDocuments(filteredDocs);

            const filteredHistory = allHistory.items.filter(h => h.atendimentoRef === id);
            setHistory(filteredHistory);

            // --- Construct FinancingCase object ---
            const now = new Date().toISOString();
            // Logic to calculate derived fields (status blocks)
            const hasBlock = (category: string) => filteredPendings.some(p =>
                p.categoria === category && p.status !== 'Resolvida' && p.status !== 'Concluída'
            );

            const caseObj: FinancingCase = {
                _id: atendimento._id,
                agencia: atendimento.unidadeResponsavelRef,
                proponentePrincipal: atendimento.contactName || 'Cliente',
                pastaInterna: (atendimento as any).pastaInterna,
                status: (atendimento as any).status || 'Novo',
                faseAtual: (atendimento as any).faseFinanciamento || 'novos-clientes',
                faseAnterior: (atendimento as any).faseAnterior,
                statusResultadoFinanciamento: (atendimento as any).statusResultadoFinanciamento,
                dataEntradaFaseAtual: now, // Simplification
                diasNaFase: 0,
                pendenciasAbertas: filteredPendings.filter(p => p.status !== 'Resolvida').length,
                tarefasAbertas: filteredTasks.filter(t => t.status !== 'Concluída').length,
                modalidade: (atendimento as any).modalidade,
                ehEmpreendimento: (atendimento as any).ehEmpreendimento,
                bloqueioDocumento: hasBlock('Documento') || hasBlock('Proponente') || hasBlock('Documentação'),
                bloqueioCaixa: hasBlock('Caixa') || hasBlock('Banco'),
                bloqueioCartorio: hasBlock('Cartório'),
                bloqueioCliente: hasBlock('Cliente'),
                bloqueioEngenharia: hasBlock('Engenharia'),
                bloqueioFormularios: hasBlock('Formulários'),
                bloqueioRestricao: hasBlock('Restrição'),
                bloqueioFgts: hasBlock('FGTS'),
                // Mapping flat fields
                cpf: (atendimento as any).cpfProponentePrincipal,
                email: atendimento.contactEmail,
                phoneNumber: atendimento.contactPhone,
                checklistStatus: (atendimento as any).checklistStatus,
                checklistResponses: (atendimento as any).checklistResponses,
                // ... include other fields if needed for display
                ...atendimento as any
            };

            setSelectedCase(caseObj);
            setCaseFormData(caseObj); // Init form data

            // --- Process Participants (Proponents vs Vendors) ---
            const caseParticipants = participantsList.items.filter(p => p.serviceRecordRef === id);
            const filteredProponents = caseParticipants.filter(p => p.roleInService !== 'Vendedor');
            setParticipants(filteredProponents);

            // --- Process Vendors ---
            const vendorParticipants = caseParticipants.filter(p => p.roleInService === 'Vendedor');
            const vendorsList: Vendor[] = [];
            for (const vp of vendorParticipants) {
                if (vp.clientRef) {
                    const client = clientsList.items.find(c => c._id === vp.clientRef);
                    if (client) {
                        const storageKey = `vendor-bank-${id}-${vp.clientRef}`;
                        const storedData = localStorage.getItem(storageKey);
                        const bankData = storedData ? JSON.parse(storedData) : {};
                        vendorsList.push({
                            _id: vp._id,
                            clientRef: vp.clientRef,
                            name: client.clientName || client.nomeRazaoSocial || 'Vendedor',
                            cpf: client.cpfCnpj || '',
                            contato: bankData.contato || client.telefonePrincipal || '',
                            email: bankData.email || client.emailPrincipal || '',
                            banco: bankData.banco || '',
                            agencia: bankData.agencia || '',
                            conta: bankData.conta || '',
                            tipoConta: bankData.tipoConta || 'Corrente',
                            chavePix: bankData.chavePix || '',
                            estadoCivil: bankData.estadoCivil || '',
                            ehConjugeDe: bankData.ehConjugeDe || '',
                            conjugeNaoParticipa: bankData.conjugeNaoParticipa || false
                        });
                    }
                }
            }
            setVendors(vendorsList);

            // --- Process Vendor Documents ---
            const caseVendorDocs = allVendorDocs.items.filter(d => d.atendimentoRef === id);
            const vDocsMap = new Map<string, VendorDocument[]>();
            caseVendorDocs.forEach(doc => {
                if (doc.vendedorClienteRef) {
                    const existing = vDocsMap.get(doc.vendedorClienteRef) || [];
                    existing.push({
                        _id: doc._id,
                        docTipo: doc.docTipo || '',
                        recebido: doc.recebido || false,
                        arquivo: doc.arquivo,
                        ativo: doc.ativo !== false,
                        observacoes: doc.observacoes,
                        obrigatorio: doc.obrigatorio || false
                    });
                    vDocsMap.set(doc.vendedorClienteRef, existing);
                }
            });
            setVendorDocuments(vDocsMap);

            // --- Process Proponent Checklists ---
            const checklistsMap = new Map<string, ProponentChecklist>();
            checklistsList.items
                .filter(c => c.atendimentoRef === id)
                .forEach(c => {
                    if (c.clientRef) checklistsMap.set(c.clientRef, c as ProponentChecklist);
                });
            setProponentChecklists(checklistsMap);

            // --- Process Proponent Documents ---
            const caseProponentDocs = allProponentDocs.items.filter(d => d.financingCaseRef === id);
            setProponentDocuments(caseProponentDocs);

            // --- Ensure Checklists & Docs exist (Logic from loadCaseDetails/loadProponentDocuments) ---
            // This is simplified but ensures data consistency
            // In a real scenario, we might want to trigger the specific ensure logic here 
            // but assuming they exist or will be created on interaction is safer for read-only load.

        } catch (error) {
            console.error('Error loading case details:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers (Adapted from Kanban) ---

    const handleSaveDetails = async () => {
        if (!selectedCase || !caseId) return;
        try {
            await BaseCrudService.update('atendimentos', {
                _id: caseId,
                ...caseFormData
            });
            if (onUpdate) onUpdate();
            onOpenChange(false);
        } catch (error) {
            console.error('Error saving:', error);
        }
    };

    const handleError = (error: any) => console.error(error);

    // Proponent Checklist Update
    const handleUpdateProponentChecklist = async (clientRef: string, field: keyof ProponentChecklist, value: boolean | string) => {
        if (!caseId) return;

        // Update local state
        const existing = proponentChecklists.get(clientRef);
        const updated = existing ? { ...existing, [field]: value } : {
            _id: crypto.randomUUID(),
            atendimentoRef: caseId,
            clientRef,
            [field]: value
        } as ProponentChecklist;

        setProponentChecklists(new Map(proponentChecklists.set(clientRef, updated)));

        // Debounced save
        if (debounceTimer) clearTimeout(debounceTimer);
        const timer = setTimeout(async () => {
            try {
                if (existing && existing._id) {
                    await BaseCrudService.update('checklistproponentes', { _id: existing._id, [field]: value });
                } else {
                    await BaseCrudService.create('checklistproponentes', updated);
                }
            } catch (e) { handleError(e); }
        }, 1000);
        setDebounceTimer(timer);
    };

    // Proponent Document Update
    const handleUpdateDocumentItem = async (proponentRef: string, documentId: string, updates: Partial<DocumentosProponentes>) => {
        if (!caseId) return;
        try {
            await BaseCrudService.update('documentosproponentes', { _id: documentId, ...updates });
            setProponentDocuments(prev => prev.map(d => d._id === documentId ? { ...d, ...updates } : d));
            // Sync pendings logic omitted for brevity, but could be added
        } catch (e) { handleError(e); }
    };

    const handleDeleteDocumentItem = async (proponentRef: string, documentId: string) => {
        await handleUpdateDocumentItem(proponentRef, documentId, { isActive: false });
    };

    const handleRestoreDocumentItem = async (proponentRef: string, documentId: string) => {
        await handleUpdateDocumentItem(proponentRef, documentId, { isActive: true, isReceived: false });
    };

    // Vendor Helpers
    const handleUpdateVendorBankData = async (vendorClientRef: string, field: string, value: string | boolean) => {
        const updatedVendors = vendors.map(v => v.clientRef === vendorClientRef ? { ...v, [field]: value } : v);
        setVendors(updatedVendors);
        const vendor = updatedVendors.find(v => v.clientRef === vendorClientRef);
        if (vendor && caseId) {
            localStorage.setItem(`vendor-bank-${caseId}-${vendorClientRef}`, JSON.stringify(vendor));
        }
    };

    const handleRemoveVendor = async (vendorId: string) => {
        try {
            await BaseCrudService.delete('atendimentopartes', vendorId);
            setVendors(prev => prev.filter(v => v._id !== vendorId));
            if (selectedVendorId === vendorId) setSelectedVendorId('');
        } catch (e) { handleError(e); }
    };

    const handleAddVendor = async () => {
        if (!caseId || !newVendor.clientRef) return;
        try {
            const vendorParticipant: ServiceParties = {
                _id: crypto.randomUUID(),
                serviceRecordRef: caseId,
                clientRef: newVendor.clientRef,
                roleInService: 'Vendedor',
                participationPercentage: 0
            };
            await BaseCrudService.create('atendimentopartes', vendorParticipant);
            await loadData(caseId); // Reload to pull properly
            setNewVendor({ ...newVendor, clientRef: '' }); // Reset
        } catch (e) { handleError(e); }
    };

    const handleUpdateVendorDocument = async (vendorClientRef: string, docId: string, updates: Partial<VendorDocument>) => {
        try {
            await BaseCrudService.update('financiamentodocsvendedor', { _id: docId, ...updates });
            const docs = vendorDocuments.get(vendorClientRef) || [];
            const updatedDocs = docs.map(d => d._id === docId ? { ...d, ...updates } : d);
            setVendorDocuments(new Map(vendorDocuments.set(vendorClientRef, updatedDocs)));
        } catch (e) { handleError(e); }
    };

    // Pendings & Tasks
    const handleSavePending = async () => {
        if (!caseId || !newPendingData.description) return;
        try {
            const newPending = {
                _id: crypto.randomUUID(),
                atendimentoRef: caseId,
                title: newPendingData.description.substring(0, 50),
                description: newPendingData.description,
                status: 'Aberta',
                priority: 'Média',
                dueDate: new Date(Date.now() + newPendingData.averageDaysToComplete * 86400000).toISOString(),
                responsiblePartyType: newPendingData.responsiblePartyType,
                creationDate: new Date().toISOString()
            };
            await BaseCrudService.create('pendenciasfinanciamento', newPending);
            setPendings([...pendings, newPending as Pending]);
            setShowPendingForm(false);
            setNewPendingData({ ...newPendingData, description: '' });
        } catch (e) { handleError(e); }
    };

    const handleUpdatePendingStatus = async (pendingId: string, status: string) => {
        try {
            await BaseCrudService.update('pendenciasfinanciamento', { _id: pendingId, status });
            setPendings(prev => prev.map(p => p._id === pendingId ? { ...p, status } : p));
        } catch (e) { handleError(e); }
    };

    const handleDeletePending = async (pendingId: string) => {
        try {
            await BaseCrudService.delete('pendenciasfinanciamento', pendingId);
            setPendings(prev => prev.filter(p => p._id !== pendingId));
        } catch (e) { handleError(e); }
    };

    const handleCreateTaskInModal = async () => {
        if (!caseId || !newTaskData.description) return;
        try {
            const newTask = {
                _id: crypto.randomUUID(),
                atendimentoRef: caseId,
                description: newTaskData.description,
                status: 'A Fazer',
                responsibleType: newTaskData.responsibleType,
                dueDate: newTaskData.dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
                creationDate: new Date().toISOString(),
                internalResponsibleId: newTaskData.internalResponsibleId, // Add missing fields
                externalResponsibleName: newTaskData.externalResponsibleName
            };
            await BaseCrudService.create('tarefasfinanciamento', newTask);
            setTasks([...tasks, newTask as Task]);
            setShowTaskFormInModal(false);
            setNewTaskData({ ...newTaskData, description: '' });
        } catch (e) { handleError(e); }
    };

    const handleUpdateTaskStatus = async (taskId: string, status: string) => {
        try {
            await BaseCrudService.update('tarefasfinanciamento', { _id: taskId, status });
            setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status } : t));
        } catch (e) { handleError(e); }
    };

    const getTaskResponsibleName = (task: Task) => {
        if ((task as any).responsavelExternoRef) return (task as any).responsavelExternoRef;
        if (task.responsibleType === 'Interno' && task.internalResponsibleId) {
            return users.find(u => u._id === task.internalResponsibleId)?.name || 'N/A';
        }
        return task.externalResponsibleName || 'N/A';
    };

    // Helper for FGTS
    const handleFgtsChange = (value: string) => {
        setCaseFormData({
            ...caseFormData,
            useFgts: value === 'sim',
            fgtsValue: value === 'sim' ? caseFormData.fgtsValue : 0
        });
    };

    // Documents
    const handleUploadDocument = async (file: File) => {
        // Placeholder - assume uploaded
        console.log('Upload not fully implemented in snippet, assuming success');
    };

    const handleUpdateDocumentStatus = async (docId: string, status: string) => {
        try {
            await BaseCrudService.update('documentosfinanciamento', { _id: docId, documentStatus: status });
            setDocuments(prev => prev.map(d => d._id === docId ? { ...d, documentStatus: status } : d));
        } catch (e) { handleError(e); }
    };

    const handleUpdateChecklistAnswer = async (stageId: string, itemId: string, answer: ChecklistAnswer) => {
        if (!selectedCase || !caseId) return; // Guard clause

        // Deep copy current responses to avoid mutation
        const currentResponses = JSON.parse(JSON.stringify(selectedCase.checklistResponses || {}));
        if (!currentResponses[stageId]) currentResponses[stageId] = {};
        currentResponses[stageId][itemId] = answer;

        setSelectedCase({ ...selectedCase, checklistResponses: currentResponses });
        await BaseCrudService.update('atendimentos', { _id: caseId, checklistResponses: currentResponses });
    };

    if (!selectedCase) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b border-border-gray sticky top-0 bg-white z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="font-heading text-2xl text-secondary">
                                Financiamento — {selectedCase.proponentePrincipal}
                            </DialogTitle>
                            <div className="flex gap-2 mt-2">
                                <Badge>{selectedCase.status}</Badge>
                                <Badge variant="outline">{FINANCING_COLUMNS.find(c => c.id === selectedCase.faseAtual)?.name}</Badge>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleSaveDetails} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 h-10 px-6">
                                <Save className="w-4 h-4 mr-2" /> Salvar
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="h-[calc(90vh-120px)]">
                    <div className="px-6 py-4">
                        <Tabs value={modalTab} onValueChange={setModalTab}>
                            <TabsList className="grid w-full grid-cols-6 mb-6">
                                <TabsTrigger value="dados" className="text-xs"><FileText className="w-4 h-4 mr-1" /> Dados</TabsTrigger>
                                <TabsTrigger value="proponentes" className="text-xs"><Users className="w-4 h-4 mr-1" /> Proponentes</TabsTrigger>
                                <TabsTrigger value="vendedores" className="text-xs"><UserCheck className="w-4 h-4 mr-1" /> Vendedores</TabsTrigger>
                                <TabsTrigger value="pendencias_tarefas" className="text-xs"><ClipboardList className="w-4 h-4 mr-1" /> Pendências e Tarefas</TabsTrigger>
                                <TabsTrigger value="docs" className="text-xs"><FileText className="w-4 h-4 mr-1" /> Documentos</TabsTrigger>
                                <TabsTrigger value="historico" className="text-xs"><History className="w-4 h-4 mr-1" /> Histórico</TabsTrigger>
                            </TabsList>

                            {/* DADOS TAB RECOVERED */}
                            <TabsContent value="dados" className="space-y-6">
                                <ScrollArea className="h-[600px] w-full pr-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg font-heading flex items-center gap-2">
                                                <FileText className="w-5 h-5 text-secondary" />
                                                Informações Básicas
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="font-paragraph text-sm mb-2 block">Nome/Identificação do Processo</Label>
                                                    <Input
                                                        value={caseFormData.proponentePrincipal || ''}
                                                        onChange={(e) => setCaseFormData({ ...caseFormData, proponentePrincipal: e.target.value })}
                                                        className="h-10"
                                                        placeholder="Ex: Financiamento João Silva"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="font-paragraph text-sm mb-2 block">CPF Principal</Label>
                                                    <Input
                                                        value={caseFormData.cpf}
                                                        disabled
                                                        className="h-10 bg-light-gray"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="font-paragraph text-sm mb-2 block">Número do Processo (Interno)</Label>
                                                    <Input
                                                        value={caseFormData.pastaInterna || ''}
                                                        onChange={(e) => setCaseFormData({ ...caseFormData, pastaInterna: e.target.value })}
                                                        placeholder="Ex: PROC-2024-001"
                                                        className="h-10"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="font-paragraph text-sm mb-2 block">Agência Responsável</Label>
                                                    {/* Assuming UnidadeSelect or similar exists, else simplified input */}
                                                    <Input
                                                        value={caseFormData.agencia || ''}
                                                        disabled
                                                        className="h-10 bg-light-gray"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Negociação e Valores */}
                                    <Card className="mt-6">
                                        <CardHeader>
                                            <CardTitle className="text-lg font-heading flex items-center gap-2">
                                                <Landmark className="w-5 h-5 text-secondary" />
                                                Negociação e Valores
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Valor de Venda e Compra */}
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1">
                                                        <Label className="font-paragraph text-sm mb-2 block">Valor de Venda e Compra</Label>
                                                        <Input
                                                            value={formatCurrency(caseFormData.propertyValue)}
                                                            onChange={(e) => {
                                                                const { numericValue } = handleCurrencyInput(e.target.value);
                                                                setCaseFormData({ ...caseFormData, propertyValue: numericValue });
                                                            }}
                                                            placeholder="R$ 0,00"
                                                            className="h-10"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 pt-7">
                                                        <Checkbox
                                                            checked={caseFormData.pagoProdutoNegociado || false}
                                                            onCheckedChange={(checked) => setCaseFormData({ ...caseFormData, pagoProdutoNegociado: checked as boolean })}
                                                        />
                                                        <Label className="font-paragraph text-sm cursor-pointer">Pago?</Label>
                                                    </div>
                                                </div>

                                                {/* Valor do Financiamento */}
                                                <div>
                                                    <Label className="font-paragraph text-sm mb-2 block">Valor do Financiamento</Label>
                                                    <Input
                                                        value={formatCurrency(caseFormData.desiredFinancingValue)}
                                                        onChange={(e) => {
                                                            const { numericValue } = handleCurrencyInput(e.target.value);
                                                            setCaseFormData({ ...caseFormData, desiredFinancingValue: numericValue });
                                                        }}
                                                        placeholder="R$ 0,00"
                                                        className="h-10"
                                                    />
                                                </div>

                                                {/* Taxa a Vista */}
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1">
                                                        <Label className="font-paragraph text-sm mb-2 block">Recursos Próprios (Entrada)</Label>
                                                        <Input
                                                            value={formatCurrency(caseFormData.valorTaxaVista)}
                                                            onChange={(e) => {
                                                                const { numericValue } = handleCurrencyInput(e.target.value);
                                                                setCaseFormData({ ...caseFormData, valorTaxaVista: numericValue });
                                                            }}
                                                            placeholder="R$ 0,00"
                                                            className="h-10"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 pt-7">
                                                        <Checkbox
                                                            checked={caseFormData.pagoTaxaVista || false}
                                                            onCheckedChange={(checked) => setCaseFormData({ ...caseFormData, pagoTaxaVista: checked as boolean })}
                                                        />
                                                        <Label className="font-paragraph text-sm cursor-pointer">Pago?</Label>
                                                    </div>
                                                </div>

                                                {/* Valor de Avaliação */}
                                                <div>
                                                    <Label className="font-paragraph text-sm mb-2 block">Valor de Avaliação (Engenharia)</Label>
                                                    <Input
                                                        value={formatCurrency(caseFormData.appraisalValue)}
                                                        onChange={(e) => {
                                                            const { numericValue } = handleCurrencyInput(e.target.value);
                                                            setCaseFormData({ ...caseFormData, appraisalValue: numericValue });
                                                        }}
                                                        placeholder="R$ 0,00"
                                                        className="h-10"
                                                    />
                                                </div>

                                                {/* Valor de ITBI */}
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1">
                                                        <Label className="font-paragraph text-sm mb-2 block">Valor de ITBI</Label>
                                                        <Input
                                                            value={formatCurrency(caseFormData.valorItbi)}
                                                            onChange={(e) => {
                                                                const { numericValue } = handleCurrencyInput(e.target.value);
                                                                setCaseFormData({ ...caseFormData, valorItbi: numericValue });
                                                            }}
                                                            placeholder="R$ 0,00"
                                                            className="h-10"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 pt-7">
                                                        <Checkbox
                                                            checked={caseFormData.pagoItbi || false}
                                                            onCheckedChange={(checked) => setCaseFormData({ ...caseFormData, pagoItbi: checked as boolean })}
                                                        />
                                                        <Label className="font-paragraph text-sm cursor-pointer">Pago?</Label>
                                                    </div>
                                                </div>

                                                {/* Valor da Prenotação do Cartório */}
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1">
                                                        <Label className="font-paragraph text-sm mb-2 block">Valor da Prenotação do Cartório</Label>
                                                        <Input
                                                            value={formatCurrency(caseFormData.valorPrenotacaoCartorio)}
                                                            onChange={(e) => {
                                                                const { numericValue } = handleCurrencyInput(e.target.value);
                                                                setCaseFormData({ ...caseFormData, valorPrenotacaoCartorio: numericValue });
                                                            }}
                                                            placeholder="R$ 0,00"
                                                            className="h-10"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 pt-7">
                                                        <Checkbox
                                                            checked={caseFormData.pagoPrenotacao || false}
                                                            onCheckedChange={(checked) => setCaseFormData({ ...caseFormData, pagoPrenotacao: checked as boolean })}
                                                        />
                                                        <Label className="font-paragraph text-sm cursor-pointer">Pago?</Label>
                                                    </div>
                                                </div>

                                                {/* Valor do Registro */}
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1">
                                                        <Label className="font-paragraph text-sm mb-2 block">Valor do Registro</Label>
                                                        <Input
                                                            value={formatCurrency(caseFormData.valorRegistro)}
                                                            onChange={(e) => {
                                                                const { numericValue } = handleCurrencyInput(e.target.value);
                                                                setCaseFormData({ ...caseFormData, valorRegistro: numericValue });
                                                            }}
                                                            placeholder="R$ 0,00"
                                                            className="h-10"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 pt-7">
                                                        <Checkbox
                                                            checked={caseFormData.pagoRegistro || false}
                                                            onCheckedChange={(checked) => setCaseFormData({ ...caseFormData, pagoRegistro: checked as boolean })}
                                                        />
                                                        <Label className="font-paragraph text-sm cursor-pointer">Pago?</Label>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* FGTS */}
                                    <Card className="mt-6">
                                        <CardHeader>
                                            <CardTitle className="text-lg font-heading flex items-center gap-2">
                                                <Folder className="w-5 h-5 text-secondary" />
                                                FGTS
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="font-paragraph text-sm mb-3 block font-semibold">Utilizará FGTS na proposta? *</Label>
                                                    <RadioGroup
                                                        value={caseFormData.useFgts ? 'sim' : 'nao'}
                                                        onValueChange={handleFgtsChange}
                                                        className="flex gap-6"
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="sim" id="fgts-sim" />
                                                            <Label htmlFor="fgts-sim" className="cursor-pointer font-medium">Sim</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="nao" id="fgts-nao" />
                                                            <Label htmlFor="fgts-nao" className="cursor-pointer font-medium">Não</Label>
                                                        </div>
                                                    </RadioGroup>
                                                </div>
                                                {caseFormData.useFgts && (
                                                    <div>
                                                        <Label className="font-paragraph text-sm mb-2 block">Valor desejado de débito FGTS</Label>
                                                        <Input
                                                            value={formatCurrency(caseFormData.fgtsValue)}
                                                            onChange={(e) => {
                                                                const { numericValue } = handleCurrencyInput(e.target.value);
                                                                setCaseFormData({ ...caseFormData, fgtsValue: numericValue });
                                                            }}
                                                            placeholder="R$ 0,00"
                                                            className="h-10"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Proposta Comercial */}
                                    <Card className="mt-6">
                                        <CardHeader>
                                            <CardTitle className="text-lg font-heading flex items-center gap-2">
                                                <Building2 className="w-5 h-5 text-secondary" />
                                                Proposta Comercial
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-4">
                                                {/* Radio button for commercial proposal */}
                                                <div>
                                                    <Label className="font-paragraph text-sm mb-3 block font-semibold">
                                                        Possui proposta comercial?
                                                    </Label>
                                                    <RadioGroup
                                                        value={caseFormData.hasCommercialProposal === true ? 'sim' : caseFormData.hasCommercialProposal === false ? 'nao' : ''}
                                                        onValueChange={(value) => setCaseFormData({ ...caseFormData, hasCommercialProposal: value === 'sim' })}
                                                        className="flex gap-6"
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="sim" id="commercial-proposal-sim" />
                                                            <Label htmlFor="commercial-proposal-sim" className="cursor-pointer font-medium">Sim</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="nao" id="commercial-proposal-nao" />
                                                            <Label htmlFor="commercial-proposal-nao" className="cursor-pointer font-medium">Não</Label>
                                                        </div>
                                                    </RadioGroup>
                                                </div>

                                                {caseFormData.hasCommercialProposal && (
                                                    <div className="ml-6 space-y-2 p-4 bg-light-gray rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <Checkbox
                                                                checked={caseFormData.hasCheckingAccountWithOverdraft || false}
                                                                onCheckedChange={(checked) => setCaseFormData({ ...caseFormData, hasCheckingAccountWithOverdraft: checked as boolean })}
                                                            />
                                                            <Label className="font-paragraph text-sm cursor-pointer">
                                                                Conta com cheque especial
                                                            </Label>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <Checkbox
                                                                checked={caseFormData.hasCheckingAccountWithoutOverdraft || false}
                                                                onCheckedChange={(checked) => setCaseFormData({ ...caseFormData, hasCheckingAccountWithoutOverdraft: checked as boolean })}
                                                            />
                                                            <Label className="font-paragraph text-sm cursor-pointer">
                                                                Conta sem cheque especial
                                                            </Label>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <Checkbox
                                                                checked={caseFormData.hasCreditCard || false}
                                                                onCheckedChange={(checked) => setCaseFormData({ ...caseFormData, hasCreditCard: checked as boolean })}
                                                            />
                                                            <Label className="font-paragraph text-sm cursor-pointer">
                                                                Cartão de crédito
                                                            </Label>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Contato e Observações */}
                                    <Card className="mt-6 mb-10">
                                        <CardHeader>
                                            <CardTitle className="text-lg font-heading">Contato e Observações</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="font-paragraph text-sm mb-2 block">E-mail</Label>
                                                    <Input
                                                        type="email"
                                                        value={caseFormData.email || ''}
                                                        onChange={(e) => setCaseFormData({ ...caseFormData, email: e.target.value })}
                                                        className="h-10"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="font-paragraph text-sm mb-2 block">Telefone</Label>
                                                    <Input
                                                        value={caseFormData.phoneNumber || ''}
                                                        onChange={(e) => setCaseFormData({ ...caseFormData, phoneNumber: e.target.value })}
                                                        className="h-10"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="font-paragraph text-sm mb-2 block">Observações</Label>
                                                <Textarea
                                                    value={caseFormData.notes || ''}
                                                    onChange={(e) => setCaseFormData({ ...caseFormData, notes: e.target.value })}
                                                    rows={4}
                                                    className="resize-none"
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </ScrollArea>
                            </TabsContent>

                            {/* PROPONENTES TAB */}
                            <TabsContent value="proponentes" className="space-y-6">
                                <div className="grid grid-cols-12 gap-6">
                                    {/* Left: List */}
                                    <div className="col-span-4 border-r pr-6 space-y-4">
                                        {/* Logic to list proponents */}
                                        {participants.length === 0 && <div className="text-center text-gray-500">Nenhum proponente adicional</div>}
                                        {participants.map(p => {
                                            const client = clients.find(c => c._id === p.clientRef);
                                            return (
                                                <div key={p._id}
                                                    className={`p-3 border rounded cursor-pointer ${selectedProponentId === p.clientRef ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}
                                                    onClick={() => setSelectedProponentId(p.clientRef)}
                                                >
                                                    <div className="font-medium">{client?.clientName || 'Proponente'}</div>
                                                    <div className="text-xs text-gray-500">{p.roleInService}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {/* Right: Details (Checklist & Documents) */}
                                    <div className="col-span-8">
                                        {selectedProponentId ? (
                                            <div className="space-y-6">
                                                <Card>
                                                    <CardHeader><CardTitle>Checklist</CardTitle></CardHeader>
                                                    <CardContent>
                                                        {/* Checklist Toggles */}
                                                        <div className="space-y-4">
                                                            {/* Example Item */}
                                                            <div className="flex justify-between items-center">
                                                                <Label>Possui conta ativa?</Label>
                                                                <Checkbox
                                                                    checked={proponentChecklists.get(selectedProponentId)?.hasActiveFinancing}
                                                                    onCheckedChange={(c) => handleUpdateProponentChecklist(selectedProponentId, 'hasActiveFinancing', !!c)}
                                                                />
                                                            </div>
                                                            {/* Add other checklist items similarly */}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardHeader><CardTitle>Documentos</CardTitle></CardHeader>
                                                    <CardContent>
                                                        {proponentDocuments.filter(d => d.proponentRef === selectedProponentId && d.isActive).map(doc => (
                                                            <div key={doc._id} className="flex justify-between items-center p-2 border-b last:border-0">
                                                                <span className={doc.isMandatory ? 'font-bold' : ''}>{doc.documentName}</span>
                                                                <div className="flex gap-2">
                                                                    <Checkbox
                                                                        checked={doc.isReceived}
                                                                        onCheckedChange={(c) => handleUpdateDocumentItem(selectedProponentId, doc._id, { isReceived: !!c })}
                                                                    />
                                                                    {!doc.isMandatory && (
                                                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteDocumentItem(selectedProponentId, doc._id)}>
                                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400">Selecione um proponente</div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* VENDEDORES TAB */}
                            <TabsContent value="vendedores" className="space-y-6">
                                {/* Similar structure to Proponentes but with Bank Info inputs */}
                                <div className="grid grid-cols-12 gap-6">
                                    <div className="col-span-4 border-r pr-6 space-y-4">
                                        {vendors.map(v => (
                                            <div key={v._id}
                                                className={`p-3 border rounded cursor-pointer ${selectedVendorId === v.clientRef ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}
                                                onClick={() => setSelectedVendorId(v.clientRef)}
                                            >
                                                <div className="font-medium">{v.name}</div>
                                            </div>
                                        ))}
                                        <div className="pt-4 border-t">
                                            <Label className="mb-2 block">Adicionar Vendedor</Label>
                                            <Select value={newVendor.clientRef} onValueChange={v => setNewVendor({ ...newVendor, clientRef: v })}>
                                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                <SelectContent>
                                                    {clients.map(c => <SelectItem key={c._id} value={c._id}>{c.clientName}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <Button className="w-full mt-2" onClick={handleAddVendor} disabled={!newVendor.clientRef}>Adicionar</Button>
                                        </div>
                                    </div>
                                    <div className="col-span-8">
                                        {selectedVendorId ? (
                                            <div className="space-y-6">
                                                <Card>
                                                    <CardHeader><CardTitle>Dados Bancários</CardTitle></CardHeader>
                                                    <CardContent className="space-y-4">
                                                        {(() => {
                                                            const vendor = vendors.find(v => v.clientRef === selectedVendorId);
                                                            if (!vendor) return null;
                                                            return (
                                                                <>
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div><Label>Banco</Label><Input value={vendor.banco || ''} onChange={e => handleUpdateVendorBankData(vendor.clientRef, 'banco', e.target.value)} /></div>
                                                                        <div><Label>Agência</Label><Input value={vendor.agencia || ''} onChange={e => handleUpdateVendorBankData(vendor.clientRef, 'agencia', e.target.value)} /></div>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div><Label>Conta</Label><Input value={vendor.conta || ''} onChange={e => handleUpdateVendorBankData(vendor.clientRef, 'conta', e.target.value)} /></div>
                                                                        <div><Label>Chave Pix</Label><Input value={vendor.chavePix || ''} onChange={e => handleUpdateVendorBankData(vendor.clientRef, 'chavePix', e.target.value)} /></div>
                                                                    </div>
                                                                </>
                                                            );
                                                        })()}
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardHeader><CardTitle>Documentos do Vendedor</CardTitle></CardHeader>
                                                    <CardContent>
                                                        {(vendorDocuments.get(selectedVendorId) || []).filter(d => d.ativo).map(doc => (
                                                            <div key={doc._id} className="flex justify-between items-center p-2 border-b">
                                                                <span>{doc.docTipo}</span>
                                                                <Checkbox checked={doc.recebido} onCheckedChange={(c) => handleUpdateVendorDocument(selectedVendorId, doc._id, { recebido: !!c })} />
                                                            </div>
                                                        ))}
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400">Selecione um vendedor</div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* PENDÊNCIAS E TAREFAS TAB (Combined) */}
                            <TabsContent value="pendencias_tarefas" className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Left Column: Pendências */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                <ClipboardList className="w-5 h-5 text-secondary" />
                                                Pendências
                                                <Badge variant="secondary" className="ml-2">{pendings.filter(p => p.status !== 'Resolvida').length}</Badge>
                                            </h3>
                                            <Button size="sm" onClick={() => setShowPendingForm(true)}><Plus className="w-4 h-4 mr-2" /> Nova</Button>
                                        </div>

                                        {showPendingForm && (
                                            <Card className="bg-blue-50 border-blue-200 animate-in fade-in zoom-in-95">
                                                <CardContent className="pt-6 space-y-4">
                                                    <Label>Descrição da Pendência</Label>
                                                    <Textarea
                                                        value={newPendingData.description}
                                                        onChange={e => setNewPendingData({ ...newPendingData, description: e.target.value })}
                                                        placeholder="Descreva o que precisa ser resolvido..."
                                                    />
                                                    <div className="flex gap-2 justify-end">
                                                        <Button variant="ghost" size="sm" onClick={() => setShowPendingForm(false)}>Cancelar</Button>
                                                        <Button size="sm" onClick={handleSavePending}>Salvar</Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        <ScrollArea className="h-[500px] w-full pr-4">
                                            <div className="space-y-3">
                                                {pendings.length === 0 && (
                                                    <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                                                        Nenhuma pendência registrada
                                                    </div>
                                                )}
                                                {pendings.map(p => (
                                                    <div key={p._id} className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-all">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <div className="font-bold text-sm text-secondary">{p.title || 'Sem título'}</div>
                                                                <div className="text-xs text-gray-500">{p.responsiblePartyType}</div>
                                                            </div>
                                                            <Badge variant={p.status === 'Resolvida' ? 'default' : 'destructive'} className="text-[10px]">
                                                                {p.status}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-gray-700 mb-3 line-clamp-2">{p.description}</p>
                                                        <div className="flex justify-end gap-2">
                                                            {p.status !== 'Resolvida' && (
                                                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleUpdatePendingStatus(p._id, 'Resolvida')}>
                                                                    <CheckSquare className="w-3 h-3 mr-1" /> Resolver
                                                                </Button>
                                                            )}
                                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50" onClick={() => handleDeletePending(p._id)}>
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>

                                    {/* Right Column: Tarefas */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                <CheckCircle className="w-5 h-5 text-secondary" />
                                                Tarefas
                                                <Badge variant="secondary" className="ml-2">{tasks.filter(t => t.status !== 'Concluída').length}</Badge>
                                            </h3>
                                            <Button size="sm" onClick={() => setShowTaskFormInModal(true)}><Plus className="w-4 h-4 mr-2" /> Nova</Button>
                                        </div>

                                        {showTaskFormInModal && (
                                            <Card className="bg-blue-50 border-blue-200 animate-in fade-in zoom-in-95">
                                                <CardContent className="pt-6 space-y-4">
                                                    <Label>Descrição da Tarefa</Label>
                                                    <Textarea
                                                        value={newTaskData.description}
                                                        onChange={e => setNewTaskData({ ...newTaskData, description: e.target.value })}
                                                        placeholder="O que precisa ser feito?"
                                                    />
                                                    <div className="flex gap-2 justify-end">
                                                        <Button variant="ghost" size="sm" onClick={() => setShowTaskFormInModal(false)}>Cancelar</Button>
                                                        <Button size="sm" onClick={handleCreateTaskInModal}>Salvar</Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        <ScrollArea className="h-[500px] w-full pr-4">
                                            <div className="space-y-3">
                                                {tasks.length === 0 && (
                                                    <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                                                        Nenhuma tarefa registrada
                                                    </div>
                                                )}
                                                {tasks.map(t => (
                                                    <div key={t._id} className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-all">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <div className="font-bold text-sm text-secondary">{t.titulo || t.description}</div>
                                                                <div className="text-xs text-gray-500">Resp: {getTaskResponsibleName(t)}</div>
                                                            </div>
                                                            <Badge variant={t.status === 'Concluída' ? 'default' : 'outline'} className="text-[10px]">
                                                                {t.status}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex justify-between items-center mt-3">
                                                            <div className="text-xs text-gray-400 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {new Date(t.dueDate).toLocaleDateString()}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {t.status === 'A Fazer' && (
                                                                    <Button size="sm" variant="outline" className="h-7 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200" onClick={() => handleUpdateTaskStatus(t._id, 'Em Andamento')}>
                                                                        Iniciar
                                                                    </Button>
                                                                )}
                                                                {t.status !== 'Concluída' && (
                                                                    <Button size="sm" variant="default" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleUpdateTaskStatus(t._id, 'Concluída')}>
                                                                        Concluir
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* DOCUMENTOS TAB */}
                            <TabsContent value="docs" className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold">Documentos do Processo</h3>
                                    {/* Upload logic would go here */}
                                </div>
                                <div className="space-y-2">
                                    {documents.map(d => (
                                        <div key={d._id} className="p-3 border rounded flex justify-between items-center">
                                            <span>{d.documentName}</span>
                                            <Badge>{d.documentStatus}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            {/* HISTORICO TAB (Styled Timeline) */}
                            <TabsContent value="historico" className="space-y-6">
                                <Card className="bg-slate-50 border-slate-200 mb-6">
                                    <CardHeader><CardTitle className="text-base">Checklist do Processo</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {CHECKLIST_DISPLAY_ORDER.map(colId => {
                                                const col = FINANCING_COLUMNS.find(c => c.id === colId);
                                                if (!col) return null;
                                                const checklistConfig = STAGE_CHECKLISTS[col.id];
                                                if (!checklistConfig) return null;

                                                // Skip based on condition
                                                if (colId === 'fgts' && !selectedCase.useFgts) return null;

                                                const visibleItems = checklistConfig.items.filter(item => !item.condition || item.condition(selectedCase));
                                                if (visibleItems.length === 0) return null;

                                                return (
                                                    <div key={colId}>
                                                        <FinancingStageChecklist
                                                            stageId={colId}
                                                            stageName={col.name}
                                                            items={visibleItems}
                                                            answers={selectedCase.checklistResponses?.[colId] || {}}
                                                            onAnswerChange={handleUpdateChecklistAnswer}
                                                            isCurrentStage={selectedCase.faseAtual === colId}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="px-4">
                                    <h4 className="font-bold text-lg mb-6 flex items-center gap-2">
                                        <History className="w-5 h-5 text-secondary" />
                                        Linha do Tempo
                                    </h4>

                                    <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
                                        {history.length === 0 && (
                                            <p className="ml-8 text-gray-500 italic">Nenhuma atividade registrada.</p>
                                        )}
                                        {history.map(h => (
                                            <div key={h._id} className="ml-6 relative group">
                                                {/* Dot */}
                                                <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-secondary ring-4 ring-white group-hover:scale-110 transition-transform">
                                                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                                                </span>

                                                {/* Content */}
                                                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-bold text-secondary">{h.interactionType}</span>
                                                        <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(h.interactionDate || '').toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 leading-relaxed">
                                                        {h.interactionDescription}
                                                    </p>
                                                    {h.tipoEvento && (
                                                        <Badge variant="outline" className="mt-2 text-[10px] text-gray-500">
                                                            {h.tipoEvento}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                        </Tabs>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

// Helper component for imported Icons if needed (e.g. ListTodo)
function ListTodo(props: any) {
    return <ClipboardList {...props} />;
}
