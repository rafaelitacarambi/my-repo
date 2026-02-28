
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { BaseCrudService } from "@/integrations";
import { FinancingStageChecklist } from "./FinancingStageChecklist";
import { Trash2, Plus, X, Search, User, ClipboardList, CheckSquare, Save, Clock, ChevronDown, CheckCircle, Smartphone, AlertCircle, Trash, Copy } from 'lucide-react';
import { CopyButton } from '@/components/ui/CopyButton';
import { ProponentChecklistCard } from './ProponentChecklistCard';
import {
    UsuriosdoSistema, Clients, ServiceParties, ChecklistdosProponentes,
    DocumentosdoFinanciamento, HistricodeInteraes, Imveis,
    FinancingVendorDocuments as FinanciamentoDocsVendedor, // Aliased
    ProponentDocuments as DocumentosProponentes, // Aliased
    PendnciasdoFinanciamento,
    FinancingTasks, AtendimentoImveis, ServiceRecords,
    DetalhesdoFinanciamento
} from '@/entities';
import { formatCurrency, handleCurrencyInput } from '@/lib/input-masks';
import { toast } from 'sonner';

// Interfaces
interface FinancingCase extends ServiceRecords {
    // Basic fields from ServiceRecords are inherited
    description?: string;

    // Custom UI fields (some might need mapping to backend)
    numeroMatricula?: string;
    numeroContrato?: string; // SIOPI
    numeroProtocoloCartorio?: string;
    enderecoImovel?: string;

    propertyValue?: number;
    desiredFinancingValue?: number;
    approvedFinancingValue?: number; // Added
    valorTaxaVista?: number;
    pagoTaxaVista?: boolean;
    appraisalValue?: number;
    valorItbi?: number;
    pagoItbi?: boolean;
    valorPrenotacaoCartorio?: number;
    pagoPrenotacao?: boolean;
    valorRegistro?: number;
    pagoRegistro?: boolean;

    pagoProdutoNegociado?: boolean; // Added

    useFgts?: boolean | null;
    fgtsValue?: number;

    hasCommercialProposal?: boolean | null;
    hasCheckingAccountWithOverdraft?: boolean;
    hasCheckingAccountWithoutOverdraft?: boolean;
    hasCreditCard?: boolean;

    // New Fields
    modalidade?: string;
    ehImovelEmpreendimentoCaixa?: boolean;
    statusFinanciamento?: string; // 'Em andamento' | 'Aprovado' | 'Condicionado' | 'Reprovado'
    statusResultadoFinanciamento?: string; // Added to match usage

    email?: string;
    phoneNumber?: string;
    notes?: string;
    pastaInterna?: string; // Added

    checklistResponses?: Record<string, any>;
    faseAtual?: string;

    proponentePrincipal?: string; // Client ID
}

interface FinancingDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    caseId?: string | null;
    initialTab?: string;
    onUpdate?: () => void;
}

interface VendorData {
    _id?: string; // Added to fix lint
    clientRef: string;
    name: string;
    banco?: string;
    agencia?: string;
    conta?: string;
    chavePix?: string;
}

// Config constants
const FINANCING_COLUMNS = [
    { id: 'analise_credito', name: 'Análise de Crédito' },
    { id: 'fgts', name: 'FGTS' },
    { id: 'avaliacao_engenharia', name: 'Avaliação Engenharia' },
    { id: 'emissao_contrato', name: 'Emissão Contrato' },
    { id: 'assinatura_registro', name: 'Assinatura e Registro' },
    { id: 'pagamento', name: 'Conclusão/Pagamento' }
];

const CHECKLIST_DISPLAY_ORDER = FINANCING_COLUMNS.map(c => c.id);

// Dummy checklist config (replace with actual import if available)
import { MODALIDADE_OPTIONS, PROPONENT_CHECKLIST_QUESTIONS } from '@/config/financing-constants';
const STAGE_CHECKLISTS: any = {};

export function FinancingDetailModal({ open, onOpenChange, caseId, initialTab = 'dados', onUpdate }: FinancingDetailModalProps) {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(initialTab);

    // Core Data
    const [selectedCase, setSelectedCase] = useState<FinancingCase | null>(null);
    const [caseFormData, setCaseFormData] = useState<FinancingCase>({} as FinancingCase);

    // Related Data Lists
    const [users, setUsers] = useState<UsuriosdoSistema[]>([]);
    const [clients, setClients] = useState<Clients[]>([]);
    const [participants, setParticipants] = useState<ServiceParties[]>([]);
    const [properties, setProperties] = useState<Imveis[]>([]);
    const [pendings, setPendings] = useState<PendnciasdoFinanciamento[]>([]);
    const [tasks, setTasks] = useState<FinancingTasks[]>([]);
    const [documents, setDocuments] = useState<DocumentosdoFinanciamento[]>([]);
    const [history, setHistory] = useState<HistricodeInteraes[]>([]);
    const [atendimentoImoveis, setAtendimentoImoveis] = useState<AtendimentoImveis[]>([]);

    // Proponent Data
    const [proponentChecklists, setProponentChecklists] = useState<Map<string, ChecklistdosProponentes>>(new Map());
    const [proponentDocuments, setProponentDocuments] = useState<DocumentosProponentes[]>([]);
    const [selectedProponentId, setSelectedProponentId] = useState<string | null>(null);
    const [activeProponentId, setActiveProponentId] = useState<string | null>(null);
    const [removedParticipants, setRemovedParticipants] = useState<ServiceParties[]>([]);

    // Vendor Data
    const [vendors, setVendors] = useState<VendorData[]>([]); // Derived or fetched
    const [vendorDocuments, setVendorDocuments] = useState<Map<string, FinanciamentoDocsVendedor[]>>(new Map());
    const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
    const [newVendor, setNewVendor] = useState({ clientRef: '' });

    // New Feature Search States
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [propertySearchTerm, setPropertySearchTerm] = useState('');
    const [showClientSearch, setShowClientSearch] = useState(false);
    const [showPropertySearch, setShowPropertySearch] = useState(false);

    // Form States
    const [showPendingForm, setShowPendingForm] = useState(false);
    const [newPendingData, setNewPendingData] = useState({ description: '', title: '' });
    const [showTaskFormInModal, setShowTaskFormInModal] = useState(false);
    const [newTaskData, setNewTaskData] = useState({ description: '', title: '', responsavelExternoRef: '' });

    // Load Data
    const loadData = async (id: string) => {
        setLoading(true);
        try {
            // Fetch main case first
            const atendimento = await BaseCrudService.getById<ServiceRecords>('atendimentos', id);
            if (!atendimento) {
                toast.error("Atendimento não encontrado");
                return;
            }

            // Fetch all related data in parallel
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
                allTasks,
                atendImoveisList
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
                BaseCrudService.getAll<AtendimentoImveis>('atendimentoimoveis')
            ]);

            setUsers(usersList.items);
            setClients(clientsList.items);
            setProperties(propsList.items);

            // Filter for this case
            const caseParts = participantsList.items.filter(p => p.serviceRecordRef === id);
            setParticipants(caseParts.filter(p => p.roleInService !== 'Vendedor'));

            // Vendors logic (assuming vendors are ServiceParties with role 'Vendedor' or similar)
            const vendorParts = participantsList.items.filter(p => p.serviceRecordRef === id && p.roleInService === 'Vendedor');
            // Transform to VendorData (Need to fetch bank details separately? Assuming for now they are in notes or auxiliary)
            setVendors(vendorParts.map(p => ({
                _id: p._id, // Map ID
                clientRef: p.clientRef || '',
                name: clientsList.items.find(c => c._id === p.clientRef)?.clientName || 'Vendedor'
            })));

            const caseDocs = docsList.items.filter(d => d.atendimentoRef === id);
            setDocuments(caseDocs);

            const caseHistory = allHistory.items
                .filter(h => h.atendimentoRef === id)
                .sort((a, b) => new Date(b.interactionDate || '').getTime() - new Date(a.interactionDate || '').getTime());
            setHistory(caseHistory);

            const casePendings = allPendings.items
                .filter(p => p.financingCaseId === id)
                .sort((a, b) => new Date(a.creationDate || a._createdDate || '').getTime() - new Date(b.creationDate || b._createdDate || '').getTime());
            setPendings(casePendings);

            const caseTasks = allTasks.items
                .filter(t => t.atendimentoRef === id)
                .sort((a, b) => new Date(a.creationDate || a._createdDate || '').getTime() - new Date(b.creationDate || b._createdDate || '').getTime());
            setTasks(caseTasks);

            const caseAtendImoveis = atendImoveisList.items.filter(ai => ai.atendimentoRef === id);
            setAtendimentoImoveis(caseAtendImoveis);

            // Proponent Data Maps
            setProponentDocuments(allProponentDocs.items.filter(d => d.financingCaseRef === id));

            const checksMap = new Map<string, ChecklistdosProponentes>();
            checklistsList.items.filter(c => c.atendimentoRef === id).forEach(c => {
                if (c.clientRef) checksMap.set(c.clientRef, c);
            });
            setProponentChecklists(checksMap);

            const vendorDocsMap = new Map<string, FinanciamentoDocsVendedor[]>();
            allVendorDocs.items.filter(d => d.atendimentoRef === id).forEach(d => {
                if (d.vendedorClienteRef) {
                    const list = vendorDocsMap.get(d.vendedorClienteRef) || [];
                    list.push(d);
                    vendorDocsMap.set(d.vendedorClienteRef, list);
                }
            });
            setVendorDocuments(vendorDocsMap);

            // Construct FinancingCase object (merge remote data with new fields)
            const caseObj: FinancingCase = {
                ...atendimento,
                numeroMatricula: (atendimento as any).numeroMatricula,
                numeroContrato: (atendimento as any).numeroContrato,
                numeroProtocoloCartorio: (atendimento as any).numeroProtocoloCartorio,
                enderecoImovel: (atendimento as any).enderecoImovel,
                modalidade: (atendimento as any).modalidade,
                ehImovelEmpreendimentoCaixa: (atendimento as any).ehImovelEmpreendimentoCaixa,
                statusFinanciamento: (atendimento as any).statusFinanciamento,
                // Map other stats from notes or other fields if needed
            };
            setSelectedCase(caseObj);
            setCaseFormData(caseObj);

            // Set initial active proponent
            if (caseObj.proponentePrincipal) {
                setActiveProponentId(caseObj.proponentePrincipal);
            } else if (participantsList.items.length > 0) {
                // Try to set first participant if no main proponent (edge case)
                const firstPart = participantsList.items.find(p => p.serviceRecordRef === id && p.roleInService !== 'Vendedor');
                if (firstPart) setActiveProponentId(firstPart.clientRef);
            }

        } catch (error) {
            console.error('Error loading case details:', error);
            toast.error("Erro ao carregar detalhes do atendimento");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && caseId) {
            loadData(caseId);
            setRemovedParticipants([]); // Reset removed list on open
        }
    }, [open, caseId]);

    // HANDLERS

    const handleSaveDetails = async () => {
        if (!selectedCase || !caseId) return;
        try {
            // Check for status change trigger
            let updateData: any = { ...caseFormData };

            // Logic to move card based on status
            if (caseFormData.statusResultadoFinanciamento === 'Condicionado') {
                updateData.faseAtual = 'condicionados';
            } else if (caseFormData.statusResultadoFinanciamento === 'Reprovado') {
                updateData.faseAtual = 'reprovados';
            } else if (caseFormData.statusResultadoFinanciamento === 'Aprovado') {
                updateData.faseAtual = 'aprovados';
            } else if (caseFormData.statusResultadoFinanciamento === 'Em andamento') {
                updateData.faseAtual = 'avaliacao-risco';
            }

            await BaseCrudService.update('atendimentos', {
                _id: caseId,
                ...updateData
            });
            toast.success("Dados salvos com sucesso!");
            if (onUpdate) onUpdate();
            onOpenChange(false); // Close modal
        } catch (error) {
            console.error('Error saving:', error);
            toast.error("Erro ao salvar dados");
        }
    };

    const handleConcludeProcess = async () => {
        if (!selectedCase || !caseId) return;
        try {
            await BaseCrudService.update('atendimentos', {
                _id: caseId,
                faseAtual: 'concluido',
                status: 'Concluído',
                dataEntradaFaseAtual: new Date().toISOString()
            });
            toast.success("Processo concluído com sucesso!");
            if (onUpdate) onUpdate();
            onOpenChange(false);
        } catch (error) {
            console.error('Error concluding:', error);
            toast.error("Erro ao concluir processo");
        }
    };

    const handleFgtsChange = (val: string) => {
        setCaseFormData({ ...caseFormData, useFgts: val === 'sim' });
    };

    const handleToggleOptions = (field: keyof FinancingCase, value: boolean) => {
        setCaseFormData(prev => {
            let currentVal = prev[field];

            // Normalize potential string values from DB
            if (currentVal === 'true') currentVal = true;
            if (currentVal === 'false') currentVal = false;

            // If clicking the same value (e.g. True when already True), toggle to null
            // otherwise set to the new value
            const newValue = currentVal === value ? null : value;

            console.log(`[Toggle] Field: ${field}, Current: ${currentVal} (${typeof currentVal}), New: ${newValue}`);

            return {
                ...prev,
                [field]: newValue
            } as any;
        });
    };

    // 2. Checklist & Proponents
    const handleUpdateProponentChecklist = async (proponentId: string, field: string, value: boolean) => {
        // Implementation
        const checklist = proponentChecklists.get(proponentId);
        if (!checklist) return;

        try {
            await BaseCrudService.update('checklistproponentes', { _id: checklist._id, [field]: value });
            // Update local state
            const newMap = new Map(proponentChecklists);
            newMap.set(proponentId, { ...checklist, [field]: value });
            setProponentChecklists(newMap);
        } catch (e) { toast.error("Erro ao atualizar checklist"); }
    };

    const handleUpdateProponentDocument = async (proponentId: string, docName: string, received: boolean, isMandatory: boolean) => {
        try {
            // @ts-ignore
            const existingDoc = proponentDocuments.find(d => d.proponenteRef === proponentId && d.documentName === docName);
            if (existingDoc) {
                // Update
                await BaseCrudService.update('documentosproponentes', { _id: existingDoc._id, recebido: received });
                setProponentDocuments(prev => prev.map(d => d._id === existingDoc._id ? { ...d, recebido: received } : d));
            } else {
                // Create
                const newDoc: any = {
                    financingCaseRef: caseId,
                    proponenteRef: proponentId,
                    documentName: docName,
                    recebido: received,
                    isMandatory: isMandatory,
                    ativo: true,
                    dataRecebimento: new Date().toISOString()
                };
                const created = await BaseCrudService.create('documentosproponentes', newDoc);
                setProponentDocuments(prev => [...prev, created]);
            }
        } catch (e) {
            console.error(e);
            toast.error("Erro ao atualizar documento");
        }
    };

    const handleUpdateChecklistAnswer = async (stageId: string, itemId: string, answer: any) => {
        // Update local state deeply
        const newResponses = { ...caseFormData.checklistResponses };
        if (!newResponses[stageId]) newResponses[stageId] = {};
        newResponses[stageId][itemId] = answer;

        setCaseFormData({ ...caseFormData, checklistResponses: newResponses });

        // Save to backend (debounced or immediate?)
        // For now, let's auto-save the whole case data or specific field
        try {
            await BaseCrudService.update('atendimentos', {
                _id: caseId,
                checklistResponses: newResponses
            });
        } catch (e) {
            console.error("Failed to save checklist answer", e);
        }
    };

    const handleUpdateDocumentItem = async (proponentId: string, docId: string, data: any) => {
        try {
            await BaseCrudService.update('documentosproponentes', { _id: docId, ...data });
            setProponentDocuments(prev => prev.map(d => d._id === docId ? { ...d, ...data } : d));
        } catch (e) { toast.error("Erro ao atualizar documento"); }
    };

    const handleDeleteDocumentItem = async (proponentId: string, docId: string) => {
        try {
            await BaseCrudService.delete('documentosproponentes', docId);
            setProponentDocuments(prev => prev.filter(d => d._id !== docId));
        } catch (e) { toast.error("Erro ao remover documento"); }
    };

    // 3. Vendors
    const handleAddVendor = async () => {
        if (!newVendor.clientRef || !caseId) return;
        // Logic to add vendor
    };

    const handleUpdateVendorBankData = (clientId: string, field: string, value: string) => {
        setVendors(prev => prev.map(v => v.clientRef === clientId ? { ...v, [field]: value } : v));
        // Note: Should probably save to backend too
    };

    const handleUpdateVendorDocument = async (vendorId: string, docId: string, data: any) => {
        try {
            await BaseCrudService.update('financiamentodocsvendedor', { _id: docId, ...data });
            const list = vendorDocuments.get(vendorId) || [];
            const newList = list.map(d => d._id === docId ? { ...d, ...data } : d);
            const newMap = new Map(vendorDocuments);
            newMap.set(vendorId, newList);
            setVendorDocuments(newMap);
        } catch (e) { toast.error("Erro ao atualizar documento"); }
    };

    // 4. Tasks & Pendings
    const handleSavePending = async () => {
        if (!caseId) return;
        // Impl
        setShowPendingForm(false);
    };

    const handleUpdatePendingStatus = async (id: string, status: string) => {
        // Impl
    };

    const handleDeletePending = async (id: string) => {
        // Impl
    };

    const handleCreateTaskInModal = async () => {
        if (!caseId || !newTaskData.description) return;
        try {
            const now = new Date().toISOString();
            const newTask: any = {
                _id: crypto.randomUUID(),
                atendimentoRef: caseId,
                titulo: newTaskData.description.substring(0, 50),
                description: newTaskData.description,
                status: 'Aberta',
                creationDate: now,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                responsibleType: 'Equipe Financiamento',
                responsavelExternoRef: newTaskData.responsavelExternoRef
            };

            await BaseCrudService.create('tarefasfinanciamento', newTask);
            setTasks(prev => [...prev, newTask]);
            setNewTaskData({ ...newTaskData, description: '', responsavelExternoRef: '' });
            setShowTaskFormInModal(false);
            toast.success("Tarefa criada com sucesso!");
        } catch (e) {
            toast.error("Erro ao criar tarefa");
        }
    };

    const handleUpdateTaskStatus = async (id: string, status: string) => {
        // Impl
    };

    const getTaskResponsibleName = (task: FinancingTasks) => {
        // Check for responsavelExternoRef (R Sales team) first
        if ((task as any).responsavelExternoRef) {
            const user = users.find(u => u._id === (task as any).responsavelExternoRef);
            if (user) return user.name || user.emailLogin;

            const rsalesMap: Record<string, string> = {
                'catarina': 'Catarina',
                'rafael': 'Rafael',
                'gabriela': 'Gabriela',
                'isabela': 'Isabela'
            };
            return rsalesMap[(task as any).responsavelExternoRef.toLowerCase()] || (task as any).responsavelExternoRef;
        }

        if (task.internalResponsibleId) {
            const user = users.find(u => u._id === task.internalResponsibleId);
            if (user) return user.name || user.emailLogin;
        }
        return task.externalResponsibleName || "Não atribuído";
    };

    // 5. Helpers
    const handleError = (e: any) => {
        console.error(e);
        toast.error("Ocorreu um erro");
    };

    const handleAddParticipant = async (client: Clients) => {
        if (!caseId) return;
        try {
            const newPart: ServiceParties = {
                _id: crypto.randomUUID(),
                serviceRecordRef: caseId,
                clientRef: client._id,
                roleInService: 'Participante', // Default
                participationPercentage: 0
            };
            await BaseCrudService.create('atendimentopartes', newPart);
            // Reload simple specific part or full data
            const partRes = await BaseCrudService.getAll<ServiceParties>('atendimentopartes');
            const caseParticipants = partRes.items.filter(p => p.serviceRecordRef === caseId && p.roleInService !== 'Vendedor');
            setParticipants(caseParticipants);
            setShowClientSearch(false);
            setClientSearchTerm('');
        } catch (e) { handleError(e); }
    };

    // Handler for linking property
    const handleLinkProperty = async (property: Imveis) => {
        if (!caseId) return;
        try {
            // Check if already linked
            const existing = atendimentoImoveis.find(ai => ai.imovelRef === property._id);
            if (existing) return;

            const newLink: AtendimentoImveis = {
                _id: crypto.randomUUID(),
                atendimentoRef: caseId,
                imovelRef: property._id,
                role: 'Financiamento',
                dateAdded: new Date().toISOString()
            };
            await BaseCrudService.create('atendimentoimoveis', newLink);

            // Update local state
            const linkRes = await BaseCrudService.getAll<AtendimentoImveis>('atendimentoimoveis');
            setAtendimentoImoveis(linkRes.items.filter(ai => ai.atendimentoRef === caseId));

            // Optionally update address text if empty
            if (!caseFormData.enderecoImovel) {
                const address = `${property.logradouro || ''}, ${property.numero || ''} - ${property.bairro || ''}`;
                setCaseFormData(prev => ({ ...prev, enderecoImovel: address }));
            }

            setShowPropertySearch(false);
            setPropertySearchTerm('');
        } catch (e) { handleError(e); }
    };

    const handleUnlinkProperty = async (linkId: string) => {
        try {
            await BaseCrudService.delete('atendimentoimoveis', linkId);
            setAtendimentoImoveis(prev => prev.filter(ai => ai._id !== linkId));
        } catch (e) { handleError(e); }
    };

    // Filtered lists for search
    const filteredClients = clientSearchTerm
        ? clients.filter(c =>
            (c.clientName || '').toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
            (c.cpfCnpj || '').includes(clientSearchTerm)
        ).slice(0, 5)
        : [];

    const filteredProperties = propertySearchTerm
        ? properties.filter(p =>
            (p.logradouro || '').toLowerCase().includes(propertySearchTerm.toLowerCase()) ||
            (p.bairro || '').toLowerCase().includes(propertySearchTerm.toLowerCase())
        ).slice(0, 5)
        : [];

    // Linked Properties Display
    const linkedProperties = properties.filter(p => atendimentoImoveis.some(ai => ai.imovelRef === p._id));

    const financingTeam = users.filter(u => u.setores?.includes('Financiamento') && u.ativo !== false);


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[90vw] w-[1200px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
                <div className="p-6 pb-2">
                    <DialogHeader className="mb-0">
                        <DialogTitle className="text-2xl font-bold flex items-center justify-between">
                            <span>{selectedCase?.contactName || 'Detalhes do Financiamento'}</span>
                        </DialogTitle>
                    </DialogHeader>
                </div>
                <ScrollArea className="flex-1 w-full border-t border-slate-100">
                    <div className="p-6 pt-4">

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="mb-6 w-full justify-start bg-slate-100 p-1">
                                <TabsTrigger value="dados" className="data-[state=active]:bg-white">Dados do Processo</TabsTrigger>
                                <TabsTrigger value="proponentes">Proponentes</TabsTrigger>
                                <TabsTrigger value="vendedores">Vendedores</TabsTrigger>
                                <TabsTrigger value="pendencias_tarefas">Pendências e Tarefas</TabsTrigger>
                                <TabsTrigger value="docs">Documentos</TabsTrigger>
                                <TabsTrigger value="historico">Histórico e Checklist</TabsTrigger>
                            </TabsList>

                            {/* Merged Checklist into History Tab (logic handled below in History content) */}

                            <TabsContent value="dados" className="space-y-6">
                                <ScrollArea className="h-[600px] w-full pr-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg font-heading flex items-center gap-2">
                                                <FileTextIcon className="w-5 h-5 text-secondary" />
                                                Informações Básicas
                                            </CardTitle>
                                        </CardHeader>
                                        {/* Custom Close Button - Larger and absolute */}
                                        <div className="absolute top-4 right-4 z-50">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 rounded-full hover:bg-slate-100"
                                                onClick={() => onOpenChange(false)}
                                            >
                                                <X className="h-6 w-6 text-slate-500" />
                                            </Button>
                                        </div>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-4">
                                                {/* Proponente Principal Info */}
                                                <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
                                                    <Label className="text-xs text-slate-500 mb-1 block">Proponente Principal (Read-only)</Label>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <User className="w-4 h-4 text-primary" />
                                                            <span className="font-medium text-sm">
                                                                {selectedCase?.proponentePrincipal ? clients.find(c => c._id === selectedCase.proponentePrincipal)?.clientName || 'Não identificado' : 'Não selecionado'}
                                                            </span>
                                                            <span className="text-xs text-slate-400">
                                                                {selectedCase?.proponentePrincipal ? clients.find(c => c._id === selectedCase.proponentePrincipal)?.cpfCnpj || '' : ''}
                                                            </span>
                                                        </div>
                                                        <Button
                                                            variant="link"
                                                            size="sm"
                                                            className="text-xs h-6 px-0 text-blue-600"
                                                            onClick={() => toast.info("Funcionalidade de redirecionar para Gestão de Clientes em breve")}
                                                        >
                                                            Gerenciar Cliente
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label className="font-paragraph text-sm mb-2 block">Modalidade</Label>
                                                        <Select
                                                            value={caseFormData.modalidade || ''}
                                                            onValueChange={(val) => setCaseFormData({ ...caseFormData, modalidade: val })}
                                                        >
                                                            <SelectTrigger className="h-10">
                                                                <SelectValue placeholder="Selecione" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {MODALIDADE_OPTIONS.map(opt => (
                                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label className="font-paragraph text-sm mb-2 block">Pasta Interna</Label>
                                                        <Input
                                                            value={caseFormData.pastaInterna || ''}
                                                            onChange={(e) => setCaseFormData({ ...caseFormData, pastaInterna: e.target.value })}
                                                            placeholder="Ex: #1234"
                                                            className="h-10"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Conditional Empreendimento Question */}
                                                {['MCMV faixa 1', 'MCMV faixa 2', 'MCMV faixa 3', 'NPMCMV faixa 4', 'SBPE'].includes(caseFormData.modalidade || '') && (
                                                    <div className="flex items-center gap-2 bg-yellow-50 p-2 rounded border border-yellow-100">
                                                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                                                        <Label className="text-sm cursor-pointer flex-1">É Imóvel de empreendimento financiado pela Caixa?</Label>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant={caseFormData.ehImovelEmpreendimentoCaixa ? "default" : "outline"}
                                                                onClick={() => setCaseFormData({ ...caseFormData, ehImovelEmpreendimentoCaixa: true })}
                                                                className={caseFormData.ehImovelEmpreendimentoCaixa ? "bg-green-600 hover:bg-green-700 h-7" : "h-7"}
                                                            >
                                                                Sim
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant={caseFormData.ehImovelEmpreendimentoCaixa === false ? "default" : "outline"}
                                                                onClick={() => setCaseFormData({ ...caseFormData, ehImovelEmpreendimentoCaixa: false })}
                                                                className={caseFormData.ehImovelEmpreendimentoCaixa === false ? "bg-red-600 hover:bg-red-700 h-7" : "h-7"}
                                                            >
                                                                Não
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* NEW: Contract Info Row */}
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <Label className="font-paragraph text-sm mb-2 block">Nº Contrato (SIOPI)</Label>
                                                    <Input
                                                        value={caseFormData.numeroContrato || ''}
                                                        onChange={(e) => setCaseFormData({ ...caseFormData, numeroContrato: e.target.value })}
                                                        placeholder="0000.0000..."
                                                        className="h-10"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="font-paragraph text-sm mb-2 block">Nº Matrícula</Label>
                                                    <Input
                                                        value={caseFormData.numeroMatricula || ''}
                                                        onChange={(e) => setCaseFormData({ ...caseFormData, numeroMatricula: e.target.value })}
                                                        placeholder="Registro..."
                                                        className="h-10"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="font-paragraph text-sm mb-2 block">Protocolo Cartório</Label>
                                                    <Input
                                                        value={caseFormData.numeroProtocoloCartorio || ''}
                                                        onChange={(e) => setCaseFormData({ ...caseFormData, numeroProtocoloCartorio: e.target.value })}
                                                        placeholder="Protocolo..."
                                                        className="h-10"
                                                    />
                                                </div>
                                            </div>

                                            {/* NEW: Property Lookup */}
                                            <div>
                                                <Label className="font-paragraph text-sm mb-2 block">Endereço do Imóvel</Label>
                                                <div className="flex gap-2 mb-2">
                                                    <Input
                                                        value={caseFormData.enderecoImovel || ''}
                                                        onChange={(e) => setCaseFormData({ ...caseFormData, enderecoImovel: e.target.value })}
                                                        placeholder="Endereço completo..."
                                                        className="h-10"
                                                    />
                                                    <div className="relative">
                                                        <Button
                                                            variant="outline"
                                                            className="h-10 px-3"
                                                            onClick={() => setShowPropertySearch(!showPropertySearch)}
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </Button>

                                                        {showPropertySearch && (
                                                            <div className="absolute top-12 right-0 w-80 bg-white border border-slate-200 shadow-lg rounded-lg z-50 p-2">
                                                                <div className="flex items-center border-b border-slate-100 pb-2 mb-2">
                                                                    <Search className="w-4 h-4 text-slate-400 mr-2" />
                                                                    <Input
                                                                        className="border-none h-8 text-sm focus-visible:ring-0 px-0"
                                                                        placeholder="Buscar imóvel (Rua, Bairro...)"
                                                                        value={propertySearchTerm}
                                                                        onChange={(e) => setPropertySearchTerm(e.target.value)}
                                                                        autoFocus
                                                                    />
                                                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setShowPropertySearch(false)}>
                                                                        <X className="w-3 h-3" />
                                                                    </Button>
                                                                </div>
                                                                <div className="max-h-48 overflow-y-auto space-y-1">
                                                                    {filteredProperties.map(prop => (
                                                                        <div
                                                                            key={prop._id}
                                                                            className="p-2 hover:bg-slate-50 rounded cursor-pointer text-sm"
                                                                            onClick={() => handleLinkProperty(prop)}
                                                                        >
                                                                            <p className="font-medium text-slate-700">{prop.logradouro}, {prop.numero}</p>
                                                                            <p className="text-xs text-slate-500">{prop.bairro} - {prop.cidade}</p>
                                                                        </div>
                                                                    ))}
                                                                    {propertySearchTerm && filteredProperties.length === 0 && (
                                                                        <p className="text-xs text-slate-400 text-center py-2">Nenhum imóvel encontrado</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Display Linked Properties */}
                                                {linkedProperties.length > 0 && (
                                                    <div className="space-y-2 mt-2">
                                                        {linkedProperties.map(p => {
                                                            const link = atendimentoImoveis.find(ai => ai.imovelRef === p._id);
                                                            return (
                                                                <div key={p._id} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                                                                    <div className="flex items-center gap-2">
                                                                        <Building className="w-4 h-4 text-secondary" />
                                                                        <div>
                                                                            <p className="text-sm font-medium text-slate-700">{p.logradouro}, {p.numero}</p>
                                                                            <p className="text-xs text-slate-500">{p.bairro}</p>
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => link && handleUnlinkProperty(link._id)}
                                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </Button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* NEW: Participants Participants */}
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <Label className="font-paragraph text-sm block">Participantes do Processo</Label>
                                                    <div className="relative">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 text-xs"
                                                            onClick={() => setShowClientSearch(!showClientSearch)}
                                                        >
                                                            <Plus className="w-3 h-3 mr-1" /> Adicionar Participante
                                                        </Button>

                                                        {showClientSearch && (
                                                            <div className="absolute top-10 right-0 w-80 bg-white border border-slate-200 shadow-lg rounded-lg z-50 p-2">
                                                                <div className="flex items-center border-b border-slate-100 pb-2 mb-2">
                                                                    <Search className="w-4 h-4 text-slate-400 mr-2" />
                                                                    <Input
                                                                        className="border-none h-8 text-sm focus-visible:ring-0 px-0"
                                                                        placeholder="Buscar cliente (Nome, CPF...)"
                                                                        value={clientSearchTerm}
                                                                        onChange={(e) => setClientSearchTerm(e.target.value)}
                                                                        autoFocus
                                                                    />
                                                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setShowClientSearch(false)}>
                                                                        <X className="w-3 h-3" />
                                                                    </Button>
                                                                </div>
                                                                <div className="max-h-48 overflow-y-auto space-y-1">
                                                                    {filteredClients.map(client => (
                                                                        <div
                                                                            key={client._id}
                                                                            className="p-2 hover:bg-slate-50 rounded cursor-pointer text-sm"
                                                                            onClick={() => handleAddParticipant(client)}
                                                                        >
                                                                            <p className="font-medium text-slate-700">{client.clientName || client.nomeRazaoSocial}</p>
                                                                            <p className="text-xs text-slate-500">{client.cpfCnpj}</p>
                                                                        </div>
                                                                    ))}
                                                                    {clientSearchTerm && filteredClients.length === 0 && (
                                                                        <p className="text-xs text-slate-400 text-center py-2">Nenhum cliente encontrado</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-2 bg-slate-50">
                                                    {participants.length === 0 ? (
                                                        <p className="text-sm text-muted-foreground text-center py-4">Nenhum participante adicionado</p>
                                                    ) : (
                                                        participants.map(part => {
                                                            const client = clients.find(c => c._id === part.clientRef);
                                                            return (
                                                                <div key={part._id} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200 shadow-sm">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                                            {(client?.clientName?.[0] || 'P').toUpperCase()}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-bold text-slate-700">{client?.clientName || 'Cliente'}</p>
                                                                            <p className="text-xs text-slate-400">{client?.cpfCnpj || 'CPF não inf.'}</p>
                                                                            <Badge variant="outline" className="text-[10px] h-5">{part.roleInService}</Badge>
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={async () => {
                                                                            await BaseCrudService.delete('atendimentopartes', part._id);
                                                                            setParticipants(prev => prev.filter(p => p._id !== part._id));
                                                                        }}
                                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>

                                        </CardContent>
                                    </Card>

                                    {/* Other Cards in "Dados" tab */}
                                    {/* ... existing Valors, FGTS cards ... */}


                                    {/* Negociação e Valores */}
                                    <Card className="mt-6">
                                        <CardHeader>
                                            <CardTitle className="text-lg font-heading flex items-center gap-2">
                                                <Landmark className="w-5 h-5 text-secondary" />
                                                Negociação e Valores
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex flex-col gap-6">
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

                                                {/* Valor do Financiamento & Status (Side-by-Side) */}
                                                <div className="flex gap-4">
                                                    <div className="flex-1">
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
                                                    <div className="w-1/3">
                                                        <Label className="font-paragraph text-sm mb-2 block">Status do Financiamento</Label>
                                                        <Select
                                                            value={caseFormData.statusResultadoFinanciamento || 'Em andamento'}
                                                            onValueChange={(val) => setCaseFormData({ ...caseFormData, statusResultadoFinanciamento: val })}
                                                        >
                                                            <SelectTrigger className={`h-10 ${caseFormData.statusResultadoFinanciamento === 'Aprovado' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                caseFormData.statusResultadoFinanciamento === 'Reprovado' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                    caseFormData.statusResultadoFinanciamento === 'Condicionado' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                                        ''
                                                                }`}>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Em andamento">🔵 Em andamento</SelectItem>
                                                                <SelectItem value="Aprovado">🟢 Aprovado</SelectItem>
                                                                <SelectItem value="Condicionado">🟡 Condicionado</SelectItem>
                                                                <SelectItem value="Reprovado">🔴 Reprovado</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
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
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant={caseFormData.useFgts === true ? "default" : "outline"}
                                                            onClick={() => handleToggleOptions('useFgts', true)}
                                                            className={caseFormData.useFgts === true ? "bg-green-600 hover:bg-green-700 h-8 w-20" : "h-8 w-20"}
                                                        >
                                                            Sim
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant={caseFormData.useFgts === false ? "default" : "outline"}
                                                            onClick={() => handleToggleOptions('useFgts', false)}
                                                            className={caseFormData.useFgts === false ? "bg-red-600 hover:bg-red-700 h-8 w-20" : "h-8 w-20"}
                                                        >
                                                            Não
                                                        </Button>
                                                    </div>
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
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant={caseFormData.hasCommercialProposal === true ? "default" : "outline"}
                                                            onClick={() => handleToggleOptions('hasCommercialProposal', true)}
                                                            className={caseFormData.hasCommercialProposal === true ? "bg-green-600 hover:bg-green-700 h-8 w-32" : "h-8 w-32"}
                                                        >
                                                            Sim (Anexada)
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant={caseFormData.hasCommercialProposal === false ? "default" : "outline"}
                                                            onClick={() => handleToggleOptions('hasCommercialProposal', false)}
                                                            className={caseFormData.hasCommercialProposal === false ? "bg-red-600 hover:bg-red-700 h-8 w-20" : "h-8 w-20"}
                                                        >
                                                            Não
                                                        </Button>
                                                    </div>
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
                            </TabsContent >

                            <TabsContent value="proponentes" className="flex flex-col h-[600px]">
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <Label className="font-heading text-lg block text-slate-800">Proponentes e Participantes</Label>
                                    <div className="relative">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2"
                                            onClick={() => setShowClientSearch(!showClientSearch)}
                                        >
                                            <Plus className="w-4 h-4" /> Adicionar
                                        </Button>

                                        {showClientSearch && (
                                            <div className="absolute top-10 right-0 w-80 bg-white border border-slate-200 shadow-xl rounded-lg z-50 p-2">
                                                <div className="flex items-center border-b border-slate-100 pb-2 mb-2">
                                                    <Search className="w-4 h-4 text-slate-400 mr-2" />
                                                    <Input
                                                        className="border-none h-8 text-sm focus-visible:ring-0 px-0"
                                                        placeholder="Buscar cliente..."
                                                        value={clientSearchTerm}
                                                        onChange={(e) => setClientSearchTerm(e.target.value)}
                                                        autoFocus
                                                    />
                                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setShowClientSearch(false)}>
                                                        <X className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                                <div className="max-h-48 overflow-y-auto space-y-1">
                                                    {filteredClients.map(client => (
                                                        <div
                                                            key={client._id}
                                                            className="p-2 hover:bg-slate-50 rounded cursor-pointer text-sm"
                                                            onClick={() => handleAddParticipant(client)}
                                                        >
                                                            <p className="font-medium text-slate-900">{client.clientName || client.nomeRazaoSocial}</p>
                                                            <p className="text-xs text-slate-500">{client.cpfCnpj}</p>
                                                        </div>
                                                    ))}
                                                    {clientSearchTerm && filteredClients.length === 0 && (
                                                        <p className="text-xs text-slate-400 text-center py-2">Nenhum cliente encontrado</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-1 gap-6 overflow-hidden">
                                    {/* Left Sidebar: Proponent List */}
                                    <div className="w-1/3 border rounded-lg bg-slate-50 flex flex-col overflow-hidden">
                                        <div className="p-3 bg-white border-b border-slate-200">
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selecionar Proponente</h3>
                                        </div>
                                        <ScrollArea className="flex-1">
                                            <div className="p-2 space-y-2">
                                                {/* Principal Proponent */}
                                                {selectedCase?.proponentePrincipal && (() => {
                                                    const client = clients.find(c => c._id === selectedCase.proponentePrincipal);
                                                    const isActive = activeProponentId === selectedCase.proponentePrincipal;
                                                    return (
                                                        <div
                                                            className={`p-3 rounded-md border cursor-pointer transition-all ${isActive
                                                                ? 'bg-white border-blue-400 shadow-sm ring-1 ring-blue-100'
                                                                : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                                                                }`}
                                                            onClick={() => setActiveProponentId(selectedCase.proponentePrincipal!)}
                                                        >
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className="font-bold text-sm text-slate-800 line-clamp-1">
                                                                    {client?.clientName || 'Cliente Principal'}
                                                                </span>
                                                                {isActive && <CheckCircle className="w-4 h-4 text-blue-500" />}
                                                            </div>
                                                            <p className="text-xs text-slate-500 mb-2">{client?.cpfCnpj}</p>
                                                            <Badge variant={isActive ? "default" : "secondary"} className={`text-[10px] ${isActive ? 'bg-blue-600 hover:bg-blue-700' : ''}`}>
                                                                Principal
                                                            </Badge>
                                                        </div>
                                                    );
                                                })()}

                                                {/* Participants */}
                                                {participants.map(part => {
                                                    const client = clients.find(c => c._id === part.clientRef);
                                                    const isActive = activeProponentId === part.clientRef;
                                                    return (
                                                        <div
                                                            key={part._id}
                                                            className={`p-3 rounded-md border cursor-pointer transition-all relative group ${isActive
                                                                ? 'bg-white border-blue-400 shadow-sm ring-1 ring-blue-100'
                                                                : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                                                                }`}
                                                            onClick={() => setActiveProponentId(part.clientRef)}
                                                        >
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className="font-bold text-sm text-slate-800 line-clamp-1 pr-6">
                                                                    {client?.clientName || 'Participante'}
                                                                </span>
                                                                {isActive && <CheckCircle className="w-4 h-4 text-blue-500" />}
                                                            </div>
                                                            <p className="text-xs text-slate-500 mb-2">{client?.cpfCnpj}</p>
                                                            <div className="flex items-center justify-between">
                                                                <Badge variant="outline" className="text-[10px] bg-slate-50">
                                                                    {part.roleInService || 'Participante'}
                                                                </Badge>

                                                                {/* Helper Delete Button */}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        // Logic to remove
                                                                        const participantToRem = part;
                                                                        setRemovedParticipants(prev => [...prev, participantToRem]);
                                                                        BaseCrudService.delete('atendimentopartes', part._id).then(() => {
                                                                            setParticipants(prev => prev.filter(p => p._id !== part._id));
                                                                            if (isActive) setActiveProponentId(null); // Deselect if removed
                                                                            toast.success("Participante removido.");
                                                                        });
                                                                    }}
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Restore Section Helper */}
                                                {removedParticipants.length > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                                        <Label className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 block px-1">Restaurar</Label>
                                                        <div className="space-y-2">
                                                            {removedParticipants.map((remPart, idx) => {
                                                                const client = clients.find(c => c._id === remPart.clientRef);
                                                                return (
                                                                    <div key={idx} className="flex items-center justify-between bg-slate-100 p-2 rounded text-xs opacity-75 hover:opacity-100">
                                                                        <span className="truncate max-w-[120px]">{client?.clientName}</span>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-5 text-[10px] text-green-700 hover:bg-green-100 px-1"
                                                                            onClick={async () => {
                                                                                try {
                                                                                    const newItem = await BaseCrudService.create('atendimentopartes', {
                                                                                        atendimentoRef: caseId,
                                                                                        clientRef: remPart.clientRef,
                                                                                        roleInService: remPart.roleInService,
                                                                                        active: true
                                                                                    });
                                                                                    setParticipants(prev => [...prev, newItem]);
                                                                                    setRemovedParticipants(prev => prev.filter((_, i) => i !== idx));
                                                                                    toast.success("Participante restaurado!");
                                                                                } catch (e) {
                                                                                    toast.error("Erro ao restaurar");
                                                                                }
                                                                            }}
                                                                        >
                                                                            Restaurar
                                                                        </Button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>

                                    {/* Right Detail Pane */}
                                    <div className="flex-1 flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                        {activeProponentId ? (() => {
                                            // Determine if it's main or participant
                                            const isMain = activeProponentId === selectedCase?.proponentePrincipal;
                                            const part = participants.find(p => p.clientRef === activeProponentId);
                                            const client = clients.find(c => c._id === activeProponentId);

                                            // Safety check
                                            if (!client) return (
                                                <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50">
                                                    <User className="w-12 h-12 mb-2 opacity-20" />
                                                    <p>Proponente não encontrado nos dados carregados.</p>
                                                </div>
                                            );

                                            const role = isMain ? "Proponente Principal" : (part?.roleInService || 'Participante');

                                            return (
                                                <ProponentChecklistCard
                                                    proponentId={activeProponentId}
                                                    role={role}
                                                    name={client.clientName || 'Sem nome'}
                                                    cpf={client.cpfCnpj || ''}
                                                    checklist={proponentChecklists.get(activeProponentId)}
                                                    documents={proponentDocuments.filter(d => d.proponentRef === activeProponentId)}
                                                    onUpdateChecklist={handleUpdateProponentChecklist}
                                                    onUpdateDocument={handleUpdateProponentDocument}
                                                // Remove handler is handled in sidebar for participants
                                                />
                                            );
                                        })() : (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50/50">
                                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                                    <User className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <p className="font-medium">Selecione um proponente ao lado</p>
                                                <p className="text-sm text-slate-400">para visualizar checklist e documentos</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* VENDEDORES TAB */}
                            < TabsContent value="vendedores" className="space-y-6" >
                                {/* Similar structure to Proponentes but with Bank Info inputs */}
                                < div className="grid grid-cols-12 gap-6" >
                                    <div className="col-span-4 border-r pr-6 space-y-4">
                                        {vendors.map(v => (
                                            <div key={v._id}
                                                className={`p-3 border rounded cursor-pointer group relative ${selectedVendorId === v.clientRef ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}
                                                onClick={() => setSelectedVendorId(v.clientRef)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="font-medium">{v.name}</div>
                                                    <CopyButton value={v.name} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
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
                                                                        <div className="group relative">
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <Label>Banco</Label>
                                                                                <CopyButton value={vendor.banco || ''} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                            </div>
                                                                            <Input value={vendor.banco || ''} onChange={e => handleUpdateVendorBankData(vendor.clientRef, 'banco', e.target.value)} />
                                                                        </div>
                                                                        <div className="group relative">
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <Label>Agência</Label>
                                                                                <CopyButton value={vendor.agencia || ''} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                            </div>
                                                                            <Input value={vendor.agencia || ''} onChange={e => handleUpdateVendorBankData(vendor.clientRef, 'agencia', e.target.value)} />
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div className="group relative">
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <Label>Conta</Label>
                                                                                <CopyButton value={vendor.conta || ''} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                            </div>
                                                                            <Input value={vendor.conta || ''} onChange={e => handleUpdateVendorBankData(vendor.clientRef, 'conta', e.target.value)} />
                                                                        </div>
                                                                        <div className="group relative">
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <Label>Chave Pix</Label>
                                                                                <CopyButton value={vendor.chavePix || ''} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                            </div>
                                                                            <Input value={vendor.chavePix || ''} onChange={e => handleUpdateVendorBankData(vendor.clientRef, 'chavePix', e.target.value)} />
                                                                        </div>
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
                                </div >
                            </TabsContent >

                            {/* PENDÊNCIAS E TAREFAS TAB (Combined) */}
                            < TabsContent value="pendencias_tarefas" className="space-y-6" >
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
                                                            <Badge className={`text-[10px] ${p.status === 'Resolvida' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}>
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
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-semibold">Responsável (Logins Financiamento)</Label>
                                                        <Select
                                                            value={newTaskData.responsavelExternoRef}
                                                            onValueChange={val => setNewTaskData({ ...newTaskData, responsavelExternoRef: val })}
                                                        >
                                                            <SelectTrigger className="h-10">
                                                                <SelectValue placeholder="Selecione o responsável" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {financingTeam.map(user => (
                                                                    <SelectItem key={user._id} value={user._id}>
                                                                        {user.name || user.emailLogin}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
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
                                                            <Badge className={`text-[10px] ${t.status === 'Concluída' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}>
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
                            </TabsContent >

                            {/* DOCUMENTOS TAB */}
                            < TabsContent value="docs" className="space-y-6" >
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
                            </TabsContent >

                            {/* HISTORICO TAB (Styled Timeline) */}
                            <TabsContent value="historico" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg font-heading flex items-center gap-2">
                                            <ListTodo className="w-5 h-5 text-secondary" />
                                            Checklist e Histórico
                                        </CardTitle>
                                        <CardDescription>
                                            Processo iniciado em {new Date(selectedCase?.creationDate || '').toLocaleDateString()}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Checklist Section */}
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                            <h3 className="font-semibold text-slate-800 mb-3">Checklist do Processo (DEBUG: COMPONENT SHOULD BE HERE)</h3>
                                            <div className="p-4 bg-red-100 text-red-600 border border-red-300 mb-4">
                                                DEBUG: If you see this, the Modal is updating.
                                                <br />
                                                Next line is the component.
                                            </div>

                                            <FinancingStageChecklist
                                                caseData={caseFormData}
                                                onUpdateAnswer={handleUpdateChecklistAnswer}
                                                answers={caseFormData.checklistResponses}
                                                onConclude={handleConcludeProcess}
                                            />
                                        </div>

                                        <div className="border-t border-slate-200 pt-4">
                                            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                                <History className="w-4 h-4" />
                                                Histórico de Interações
                                            </h3>
                                            <ScrollArea className="h-[400px]">
                                                <div className="space-y-4">
                                                    {history.length === 0 ? (
                                                        <p className="text-sm text-slate-400 text-center py-4">Nenhuma interação registrada</p>
                                                    ) : (
                                                        history.map(item => (
                                                            <div key={item._id} className="flex gap-3 text-sm bg-white p-3 rounded border border-slate-100 shadow-sm">
                                                                <div className="mt-0.5">
                                                                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <span className="font-medium text-slate-700">{item.interactionType}</span>
                                                                        <span className="text-xs text-slate-400">
                                                                            {new Date(item.interactionDate || '').toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-slate-600">{item.interactionDescription}</p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                        </Tabs>
                    </div>
                </ScrollArea>
                <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
                    <Button onClick={handleSaveDetails} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                        <Save className="w-4 h-4" />
                        Salvar
                    </Button>
                </div>
            </DialogContent>
        </Dialog >
    );
}

