import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import {
    Plus,
    AlertCircle,
    CheckCircle,
    Clock,
    X,
    Save,
    FileText,
    History,
    Users,
    ClipboardList,
    Building2,
    FileCheck,
    Landmark,
    UserCheck,
    Wrench,
    Folder,
    Ban,
    Upload,
    Trash2,
    Edit2,
    Calendar,
    Search,
    Filter,
    DollarSign,
    Home,
    CreditCard,
    RotateCcw,
    CheckSquare,
    XCircle,
    AlertTriangle,
    Info,
    ChevronRight,
    Eye,
    Download,
    File,
    LayoutGrid,
    ListTodo,
    Palette,
    Settings,
    Ticket,
    Phone,
    MessageSquare,
    Hash,
    TrendingUp,
    Key,
    Gavel,
    CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AdminLayout from '@/components/layouts/AdminLayout';
import { BaseCrudService } from '@/integrations';
import { ServiceRecords, UsuriosdoSistema, PendnciasdoFinanciamento, FinancingTasks, ServiceParties, Clients, DocumentosdoFinanciamento, HistricodeInteraes, Imveis, AtendimentoImveis, ChecklistdosProponentes } from '@/entities';
import { formatCurrency, parseCurrency, formatCPF } from '@/lib/input-masks';

// Types and Interfaces adapted for Leilão
interface LeilaoCase {
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
    serviceType: string;
    contactName: string;
    contactPhone?: string;
    contactEmail?: string;

    // Blocking icons
    bloqueioDocumento?: boolean;
    bloqueioLicitacao?: boolean;

    // Data fields
    propertyValue?: number;
    bidValue?: number;
    notes?: string;
    interlinks?: {
        hasProperty: boolean;
        activeSales: number;
        activeRentals: number;
        activeFinancing: number;
        activeAuctions: number;
        relatedServices: { _id: string; serviceType: string; contactName: string; pastaInterna: string; status: string }[];
    };
    documentosAnexos?: { name: string; url: string; size: number; type: string; uploadedAt: string }[];
    leilaoExtra?: Record<string, string>;
}

const LEILAO_COLUMNS = [
    { id: 'Novos clientes', name: 'Novos clientes', color: 'bg-blue-100 border-blue-300', bgColor: 'bg-blue-100', borderColor: 'border-blue-300' },
    { id: 'Em arrematação', name: 'Em arrematação', color: 'bg-amber-100 border-amber-300', bgColor: 'bg-amber-100', borderColor: 'border-amber-300' },
    { id: 'Arrematado', name: 'Arrematado', color: 'bg-emerald-100 border-emerald-300', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-300' },
    { id: 'Em processo de Financiamento', name: 'Em processo de Financiamento', color: 'bg-indigo-100 border-indigo-300', bgColor: 'bg-indigo-100', borderColor: 'border-indigo-300' },
    { id: 'Documentos comprador', name: 'Documentos comprador', color: 'bg-violet-100 border-violet-300', bgColor: 'bg-violet-100', borderColor: 'border-violet-300' },
    { id: 'Kit documentos Caixa', name: 'Kit documentos Caixa', color: 'bg-pink-100 border-pink-300', bgColor: 'bg-pink-100', borderColor: 'border-pink-300' },
    { id: 'Enviar para escritura', name: 'Enviar para escritura', color: 'bg-rose-100 border-rose-300', bgColor: 'bg-rose-100', borderColor: 'border-rose-300' },
    { id: 'Aguardando assinatura', name: 'Aguardando assinatura', color: 'bg-orange-100 border-orange-300', bgColor: 'bg-orange-100', borderColor: 'border-orange-300' },
    { id: 'Registro', name: 'Registro', color: 'bg-cyan-100 border-cyan-300', bgColor: 'bg-cyan-100', borderColor: 'border-cyan-300' },
    { id: 'Enviar pagamentos de débitos', name: 'Enviar pagamentos de débitos', color: 'bg-red-100 border-red-300', bgColor: 'bg-red-100', borderColor: 'border-red-300' },
    { id: 'Aguardando pagamentos de débitos', name: 'Aguardando pagamentos de débitos', color: 'bg-slate-200 border-slate-400', bgColor: 'bg-slate-200', borderColor: 'border-slate-400' },
    { id: 'Nota fiscal', name: 'Nota fiscal', color: 'bg-teal-100 border-teal-300', bgColor: 'bg-teal-100', borderColor: 'border-teal-300' },
    { id: 'Enviar matrícula e IPTU', name: 'Enviar matrícula e IPTU', color: 'bg-lime-100 border-lime-300', bgColor: 'bg-lime-100', borderColor: 'border-lime-300' },
    { id: 'Documentos enviados para NF', name: 'Documentos enviados para NF', color: 'bg-fuchsia-100 border-fuchsia-300', bgColor: 'bg-fuchsia-100', borderColor: 'border-fuchsia-300' },
    { id: 'NF autorizada', name: 'NF autorizada', color: 'bg-yellow-100 border-yellow-300', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-300' },
    { id: 'Concluídos', name: 'Concluídos', color: 'bg-green-100 border-green-300', bgColor: 'bg-green-100', borderColor: 'border-green-300' },
];

const BACKGROUND_OPTIONS = [
    { id: 'default', name: 'Padrão Claro', value: 'bg-slate-50', preview: '#F8FAFC' },
    { id: 'dark', name: 'Escuro', value: 'bg-slate-900', preview: '#0F172A' },
    { id: 'amber', name: 'Âmbar Clássico', value: 'bg-amber-50', preview: '#FFFBEB' },
    { id: 'gradient-amber', name: 'Gradiente Ouro', value: 'bg-gradient-to-br from-amber-50 to-orange-100', preview: 'linear-gradient(135deg, #fffbeb, #ffedd5)' },
    { id: 'image-gavel', name: 'Leilão', value: 'bg-[url(https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920)] bg-cover bg-center', preview: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400' },
];

export default function AdminLeilaoKanbanPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation() as any;
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const scrollbarRef = useRef<HTMLDivElement>(null);
    const scrollbarThumbRef = useRef<HTMLDivElement>(null);

    const [cases, setCases] = useState<LeilaoCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCase, setSelectedCase] = useState<LeilaoCase | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [modalTab, setModalTab] = useState('dados');
    const [searchTerm, setSearchTerm] = useState('');
    const [kanbanBackground, setKanbanBackground] = useState<string>('bg-slate-50');
    const [pasteArea, setPasteArea] = useState<string>('');
    const [uploadedDocs, setUploadedDocs] = useState<{ name: string; url: string; size: number; type: string; uploadedAt: string }[]>([]);
    const [isDraggingDoc, setIsDraggingDoc] = useState(false);
    const docInputRef = useRef<HTMLInputElement>(null);
    const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
    const [showEmptyColumns, setShowEmptyColumns] = useState(true);
    type RelatedService = { _id: string; serviceType: string; contactName: string; pastaInterna: string; status: string };

    const [clients, setClients] = useState<Clients[]>([]);
    const [users, setUsers] = useState<UsuriosdoSistema[]>([]);
    const [leilaoFormData, setLeilaoFormData] = useState<Record<string, string>>({});
    const [isSavingLeilao, setIsSavingLeilao] = useState(false);

    useEffect(() => {
        loadData();
        const storedBg = localStorage.getItem('kanban-background-leilao');
        if (storedBg) setKanbanBackground(storedBg);

        const storedShowEmpty = localStorage.getItem('kanban-show-empty-leilao');
        if (storedShowEmpty !== null) setShowEmptyColumns(storedShowEmpty === 'true');
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const { items: clientsList } = await BaseCrudService.getAll<Clients>('clientes');
            setClients(clientsList);

            const { items: usersList } = await BaseCrudService.getAll<UsuriosdoSistema>('usuariossistema');
            setUsers(usersList);

            const { items: atendimentos } = await BaseCrudService.getAll<ServiceRecords>('atendimentos');
            const { items: pendingsList } = await BaseCrudService.getAll<PendnciasdoFinanciamento>('pendenciasfinanciamento');
            const { items: tasksList } = await BaseCrudService.getAll<FinancingTasks>('tarefasfinanciamento');
            const { items: partiesList } = await BaseCrudService.getAll<ServiceParties>('atendimentopartes');
            const { items: propertiesList } = await BaseCrudService.getAll<Imveis>('imoveis');
            const { items: propertyLinks } = await BaseCrudService.getAll<AtendimentoImveis>('atendimentoimoveis');

            const filteredAtendimentos = atendimentos
                .filter(a => ['Leilão'].includes(a.serviceType || '') && !a.isArchived)
                .sort((a, b) => {
                    const dateA = new Date(a._updatedDate || a._createdDate || 0).getTime();
                    const dateB = new Date(b._updatedDate || b._createdDate || 0).getTime();
                    return dateB - dateA;
                });

            const filteredCases = filteredAtendimentos.map(a => {
                const client = clientsList.find(c => c._id === a.clientePrincipalRef);
                const dataEntrada = a._updatedDate || a._createdDate || new Date();
                const diasNaFase = Math.floor((new Date().getTime() - new Date(dataEntrada).getTime()) / (1000 * 60 * 60 * 24));

                const casePendings = pendingsList.filter(p => p.atendimentoRef === a._id && p.status !== 'Resolvida');
                const caseTasks = tasksList.filter(t => t.atendimentoRef === a._id && t.status !== 'Concluída');

                const clientId = a.clientePrincipalRef;
                const otherPrimaryServices = atendimentos.filter(s => s.clientePrincipalRef === clientId && s._id !== a._id && !s.isArchived);
                const participantServicesRefs = partiesList.filter(p => p.clientRef === clientId).map(p => p.serviceRecordRef);
                const participationServices = atendimentos.filter(s => participantServicesRefs.includes(s._id) && s._id !== a._id && !s.isArchived);
                const clientPropertyIds = propertyLinks.filter(p => p.atendimentoRef === a._id).map(p => p.imovelRef);
                const propertyRelatedRefs = propertyLinks.filter(p => clientPropertyIds.includes(p.imovelRef) && p.atendimentoRef !== a._id).map(p => p.atendimentoRef);
                const propertyRelatedServices = atendimentos.filter(s => propertyRelatedRefs.includes(s._id) && !s.isArchived);

                const combinedServices = [...otherPrimaryServices, ...participationServices, ...propertyRelatedServices];
                const uniqueRelated = Array.from(new Map(combinedServices.map(s => [s._id, s])).values());

                const interlinks = {
                    hasProperty: clientPropertyIds.length > 0 || propertiesList.some(p => p.proprietarioId === clientId || p.emailProprietario === client?.emailPrincipal || p.telefoneProprietario === client?.phoneNumber),
                    activeSales: uniqueRelated.filter(s => ['Venda', 'Compra'].includes(s.serviceType || '')).length,
                    activeRentals: uniqueRelated.filter(s => ['Locação', 'Aluguel'].includes(s.serviceType || '')).length,
                    activeFinancing: uniqueRelated.filter(s => ['Financiamento', 'Crédito'].includes(s.serviceType || '')).length,
                    activeAuctions: uniqueRelated.filter(s => ['Leilão'].includes(s.serviceType || '')).length,
                    relatedServices: uniqueRelated.map(s => ({
                        _id: s._id,
                        serviceType: s.serviceType || '',
                        contactName: s.contactName || '',
                        pastaInterna: (s as any).pastaInterna || '',
                        status: s.status || ''
                    }))
                };

                return {
                    _id: a._id,
                    agencia: a.unidadeResponsavelRef || '',
                    proponentePrincipal: a.contactName || client?.clientName || 'Sem nome',
                    contactName: a.contactName || client?.clientName || 'Sem nome',
                    cpfProponentePrincipal: client?.cpfCnpj || '',
                    pastaInterna: a.pastaInterna || a._id.substring(0, 8).toUpperCase(),
                    status: (a.status === 'Novos' || !a.status) ? 'Novos clientes' : a.status,
                    faseAtual: (a.status === 'Novos' || !a.status) ? 'Novos clientes' : a.status,
                    serviceType: a.serviceType || 'Leilão',
                    contactPhone: a.contactPhone || client?.phoneNumber || '',
                    contactEmail: a.contactEmail || client?.email || '',
                    diasNaFase,
                    pendenciasAbertas: casePendings.length,
                    tarefasAbertas: caseTasks.length,
                    bloqueioDocumento: casePendings.some(p => p.categoria === 'Documento'),
                    bloqueioLicitacao: casePendings.some(p => p.categoria === 'Licitação'),
                    propertyValue: (a as any).propertyValue || 0,
                    bidValue: (a as any).bidValue || (a as any).propertyValue || 0,
                    notes: a.notes || '',
                    interlinks,
                    documentosAnexos: (a as any).documentosAnexos || [],
                    leilaoExtra: (a as any).leilaoExtra || {}
                };
            });

            setCases(filteredCases);
        } catch (error) {
            console.error('Error loading Leilão Kanban data:', error);
            toast.error('Erro ao carregar dados do Kanban');
        } finally {
            setLoading(false);
        }
    };

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

        const newStage = destination.droppableId;
        const updatedCases = Array.from(cases);
        const caseIndex = updatedCases.findIndex(c => c._id === draggableId);

        if (caseIndex !== -1) {
            const caseItem = updatedCases[caseIndex];
            caseItem.status = newStage;
            caseItem.faseAtual = newStage;
            setCases(updatedCases);
            try {
                await BaseCrudService.update('atendimentos', { _id: draggableId, status: newStage });
                toast.success('Processo movido com sucesso');
            } catch (error) {
                console.error('Error moving case:', error);
                toast.error('Erro ao mover processo');
                loadData();
            }
        }
    };

    const handleOpenDetails = (caseItem: LeilaoCase) => {
        setSelectedCase(caseItem);
        setLeilaoFormData(caseItem.leilaoExtra || {});
        setUploadedDocs(caseItem.documentosAnexos || []);
        setShowDetailsModal(true);
    };

    const handleSaveLeilaoData = async () => {
        if (!selectedCase) return;
        setIsSavingLeilao(true);
        try {
            await BaseCrudService.update('atendimentos', {
                _id: selectedCase._id,
                leilaoExtra: leilaoFormData,
                documentosAnexos: uploadedDocs,
            });
            toast.success('Dados salvos com sucesso!');
        } catch {
            toast.error('Erro ao salvar dados.');
        } finally {
            setIsSavingLeilao(false);
        }
    };

    const handleConcluirProcesso = async () => {
        if (!selectedCase) return;
        setIsSavingLeilao(true);
        try {
            await BaseCrudService.update('atendimentos', {
                _id: selectedCase._id,
                status: 'Concluídos',
                isArchived: true,
                archivedDate: new Date().toISOString()
            });
            toast.success('Processo concluído e arquivado!');
            setShowDetailsModal(false);
            loadData();
        } catch {
            toast.error('Erro ao concluir processo.');
        } finally {
            setIsSavingLeilao(false);
        }
    };

    const handleAutoFill = () => {
        if (!pasteArea.trim()) return;
        const newData: any = { ...leilaoFormData };
        const cpfRegex = /(\d{3}\.\d{3}\.\d{3}-\d{2})|(\d{11})/;
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        const phoneRegex = /(\(?\d{2}\)?\s?9?\d{4}-?\d{4})/;
        const moneyRegex = /(?:R\$|R\$\s)?(\d{1,3}(?:\.\d{3})*(?:,\d{2}))/;

        const cpfMatch = pasteArea.match(cpfRegex);
        if (cpfMatch) newData.clienteCpfCnpj = cpfMatch[0];
        const emailMatch = pasteArea.match(emailRegex);
        if (emailMatch) newData.clienteEmail = emailMatch[0];
        const phoneMatch = pasteArea.match(phoneRegex);
        if (phoneMatch) newData.clienteTelefone = phoneMatch[0];

        const moneyMatches = Array.from(pasteArea.matchAll(new RegExp(moneyRegex, 'g'))).map(m => m[1]);
        if (moneyMatches.length > 0) {
            const sorted = moneyMatches.sort((a, b) => {
                const va = parseFloat(a.replace(/\./g, '').replace(',', '.'));
                const vb = parseFloat(b.replace(/\./g, '').replace(',', '.'));
                return vb - va;
            });
            newData.finValorAvaliacao = sorted[0];
            if (sorted[1]) newData.finValorProposta = sorted[1];
        }

        setLeilaoFormData(newData);
        setPasteArea('');
        toast.info("Dados extraídos com sucesso!");
    };

    const handleDocFileDrop = async (files: FileList | null) => {
        if (!files || !selectedCase) return;
        try {
            const newDocs = Array.from(files).map(f => ({
                name: f.name,
                url: URL.createObjectURL(f),
                size: f.size,
                type: f.type,
                uploadedAt: new Date().toISOString(),
            }));
            setUploadedDocs(prev => [...prev, ...newDocs]);
            toast.success(`${newDocs.length} documento(s) anexado(s)`);
        } catch (error) {
            toast.error("Erro ao processar documentos.");
        }
    };

    const handleQuickStatusChange = async (newStatus: string) => {
        if (!selectedCase) return;
        if (selectedCase.status === newStatus) return;
        setIsSavingLeilao(true);
        try {
            await BaseCrudService.update('atendimentos', { _id: selectedCase._id, status: newStatus });
            setCases(prev => prev.map(c => c._id === selectedCase._id ? { ...c, status: newStatus, faseAtual: newStatus } : c));
            setSelectedCase(prev => prev ? { ...prev, status: newStatus, faseAtual: newStatus } : null);
            toast.success(`Fase alterada para ${newStatus}`);
        } catch (error) {
            toast.error('Erro ao mudar fase');
            loadData();
        } finally {
            setIsSavingLeilao(false);
        }
    };

    return (
        <AdminLayout>
            <div className={`h-[calc(100vh-64px)] flex flex-col overflow-hidden transition-all duration-300 ${kanbanBackground}`}>
                <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-20">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Gavel className="w-6 h-6 text-amber-600" />
                            Kanban de Leilão
                        </h1>
                        <p className="text-slate-500 text-sm">Gestão de processos de leilões e licitações</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por cliente, pasta..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-10 rounded-full border-slate-200 bg-white shadow-sm"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className={`rounded-full shadow-sm transition-all ${!showEmptyColumns ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white text-slate-400'}`}
                            onClick={() => {
                                const nextValue = !showEmptyColumns;
                                setShowEmptyColumns(nextValue);
                                localStorage.setItem('kanban-show-empty-leilao', String(nextValue));
                            }}
                        >
                            {showEmptyColumns ? <LayoutGrid className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
                        </Button>
                        <Button variant="outline" size="icon" className="rounded-full bg-white shadow-sm" onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}>
                            <Palette className="w-4 h-4" />
                        </Button>
                        <Button className="h-10 rounded-full bg-amber-600 hover:bg-amber-700 text-white gap-2 px-6 shadow-md">
                            <Plus className="w-4 h-4" /> Novo Processo
                        </Button>
                    </div>
                </div>

                <AnimatePresence>
                    {showBackgroundPicker && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-24 top-20 bg-white shadow-2xl rounded-2xl p-4 z-50 border border-slate-200 w-64">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800 text-sm">Personalizar fundo</h3>
                                <Button variant="ghost" size="icon" onClick={() => setShowBackgroundPicker(false)}><X className="w-4 h-4" /></Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {BACKGROUND_OPTIONS.map((bg) => (
                                    <button key={bg.id} onClick={() => { setKanbanBackground(bg.value); localStorage.setItem('kanban-background-leilao', bg.value); setShowBackgroundPicker(false); }} className={`group relative h-16 rounded-xl overflow-hidden border-2 transition-all ${kanbanBackground === bg.value ? 'border-amber-500 scale-95' : 'border-slate-100 hover:border-slate-200'}`}>
                                        <div className="absolute inset-x-0 bottom-0 bg-black/40 py-1 text-[8px] text-white font-medium text-center">{bg.name}</div>
                                        <div className="absolute inset-0 w-full h-full" style={{ background: bg.preview }} />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex-1 relative overflow-hidden">
                    <div ref={scrollContainerRef} className="h-full overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing no-scrollbar">
                        <DragDropContext onDragEnd={onDragEnd}>
                            <div className="flex h-full p-6 gap-6 min-w-max">
                                {LEILAO_COLUMNS.filter(column => showEmptyColumns || cases.some(c => c.faseAtual === column.id)).map((column) => (
                                    <div key={column.id} className="w-80 flex flex-col h-full rounded-2xl bg-slate-100/40 backdrop-blur-sm border border-slate-200/50">
                                        <div className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${column.borderColor.replace('border', 'bg')}`} />
                                                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">{column.name}</h3>
                                                <Badge variant="secondary" className="bg-white/50 text-slate-600 rounded-lg text-[10px] px-2 h-5 border-none">
                                                    {cases.filter(c => c.faseAtual === column.id).length}
                                                </Badge>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-amber-600 transition-colors"><Plus className="w-4 h-4" /></Button>
                                        </div>
                                        <Droppable droppableId={column.id}>
                                            {(provided, snapshot) => (
                                                <div {...provided.droppableProps} ref={provided.innerRef} className={`flex-1 px-3 pb-4 overflow-y-auto no-scrollbar transition-colors ${snapshot.isDraggingOver ? 'bg-amber-100/20' : ''}`}>
                                                    <div className="flex flex-col gap-3">
                                                        {cases.filter(c => c.faseAtual === column.id).filter(c => c.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) || c.pastaInterna?.toLowerCase().includes(searchTerm.toLowerCase())).map((caseItem, index) => (
                                                            <Draggable key={caseItem._id} draggableId={caseItem._id} index={index}>
                                                                {(provided, snapshot) => (
                                                                    <Card ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} onClick={() => handleOpenDetails(caseItem)} className={`group relative p-4 bg-white border-slate-200 hover:border-amber-300 hover:shadow-xl transition-all cursor-pointer rounded-2xl ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-amber-500 scale-105 rotate-2' : ''}`}>
                                                                        <div className="mb-3">
                                                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-between">
                                                                                <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{caseItem.pastaInterna}</span>
                                                                                <span className={`px-2 py-0.5 rounded-full text-white font-bold ${caseItem.diasNaFase > 15 ? 'bg-red-500' : caseItem.diasNaFase > 7 ? 'bg-orange-500' : 'bg-emerald-500'}`}>{caseItem.diasNaFase} d</span>
                                                                            </div>
                                                                            <h4 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-amber-600 transition-colors">{caseItem.contactName}</h4>
                                                                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                                                                                <Phone className="w-3 h-3 text-slate-400" />
                                                                                <span>{caseItem.contactPhone || 'S/ Tel'}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                                            {caseItem.pendenciasAbertas > 0 && <Badge variant="outline" className="bg-red-50 border-red-100 text-red-600 text-[10px] gap-1 px-1.5 h-6"><AlertCircle className="w-3 h-3" />{caseItem.pendenciasAbertas}</Badge>}
                                                                            {caseItem.tarefasAbertas > 0 && <Badge variant="outline" className="bg-amber-50 border-amber-100 text-amber-600 text-[10px] gap-1 px-1.5 h-6"><CheckCircle className="w-3 h-3" />{caseItem.tarefasAbertas}</Badge>}
                                                                        </div>
                                                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-3">
                                                                            <Badge variant="secondary" className="bg-slate-50 text-slate-500 text-[10px] font-normal px-2 uppercase tracking-tight">{caseItem.serviceType}</Badge>
                                                                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-all"><ChevronRight className="w-4 h-4 text-slate-400" /></Button>
                                                                        </div>
                                                                    </Card>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                    </div>
                                                </div>
                                            )}
                                        </Droppable>
                                    </div>
                                ))}
                            </div>
                        </DragDropContext>
                    </div>
                </div>

                <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                    <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden border-none shadow-2xl rounded-[32px]">
                        <DialogHeader className="px-8 py-6 border-b border-slate-100 bg-white/50 backdrop-blur-md sticky top-0 z-10 flex flex-row justify-between items-start">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-amber-100 rounded-[24px] shadow-sm"><Gavel className="w-7 h-7 text-amber-600" /></div>
                                        <div>
                                            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">{selectedCase?.contactName}</DialogTitle>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <Badge className={`${LEILAO_COLUMNS.find(c => c.id === selectedCase?.status)?.color} border-none px-3 py-1 text-[11px] uppercase font-black tracking-widest rounded-full shadow-sm`}>{selectedCase?.status}</Badge>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-all"><Edit2 className="w-3.5 h-3.5" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="w-56 p-2 rounded-2xl bg-white/90 backdrop-blur-xl border-slate-200 shadow-2xl">
                                                        {LEILAO_COLUMNS.map(col => (<DropdownMenuItem key={col.id} onClick={() => handleQuickStatusChange(col.id)} className="text-xs font-semibold p-3 rounded-xl hover:bg-amber-50 hover:text-amber-700 cursor-pointer transition-all">{col.name}</DropdownMenuItem>))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <span className="text-[11px] font-bold text-slate-400 tracking-wider">• {selectedCase?.pastaInterna}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {selectedCase?.interlinks?.relatedServices && selectedCase.interlinks.relatedServices.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4 items-center">
                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mr-1">Vínculos:</span>
                                        {selectedCase.interlinks.relatedServices.map(rel => (
                                            <button key={rel._id} onClick={() => navigate(`${rel.serviceType.includes('Venda') ? '/admin/negocios/kanban' : rel.serviceType.includes('Loca') ? '/admin/locacoes/kanban' : '/admin/financiamento-kanban'}?openCard=${rel._id}`)} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 text-[10px] font-bold bg-white text-slate-600 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-all shadow-sm">{rel.serviceType}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-3 ml-6 flex-shrink-0">
                                {selectedCase?.contactPhone && (
                                    <Button variant="outline" className="h-11 px-6 rounded-2xl bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 hover:text-emerald-800 transition-all font-bold shadow-sm" onClick={() => window.open(`https://wa.me/55${selectedCase.contactPhone?.replace(/\D/g, '')}`, '_blank')}>
                                        <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp
                                    </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl hover:bg-slate-100 transition-all" onClick={() => setShowDetailsModal(false)}><X className="w-6 h-6 text-slate-400" /></Button>
                            </div>
                        </DialogHeader>

                        <ScrollArea className="h-[calc(90vh-100px)]">
                            <div className="p-8">
                                <Tabs value={modalTab} onValueChange={setModalTab}>
                                    <TabsList className="grid grid-cols-7 mb-10 bg-slate-100/50 p-1.5 rounded-[24px] h-14 shadow-inner">
                                        <TabsTrigger value="dados" className="rounded-[18px] data-[state=active]:bg-white data-[state=active]:shadow-lg text-[11px] font-bold uppercase tracking-wider gap-2.5 transition-all"><FileText className="w-4 h-4" /> Dados</TabsTrigger>
                                        <TabsTrigger value="proponentes" className="rounded-[18px] data-[state=active]:bg-white data-[state=active]:shadow-lg text-[11px] font-bold uppercase tracking-wider gap-2.5 transition-all"><Users className="w-4 h-4" /> Partes</TabsTrigger>
                                        <TabsTrigger value="pendencias" className="rounded-[18px] data-[state=active]:bg-white data-[state=active]:shadow-lg text-[11px] font-bold uppercase tracking-wider gap-2.5 transition-all"><AlertCircle className="w-4 h-4" /> Pendências</TabsTrigger>
                                        <TabsTrigger value="tarefas" className="rounded-[18px] data-[state=active]:bg-white data-[state=active]:shadow-lg text-[11px] font-bold uppercase tracking-wider gap-2.5 transition-all"><CheckCircle className="w-4 h-4" /> Tarefas</TabsTrigger>
                                        <TabsTrigger value="documentos" className="rounded-[18px] data-[state=active]:bg-white data-[state=active]:shadow-lg text-[11px] font-bold uppercase tracking-wider gap-2.5 transition-all"><Upload className="w-4 h-4" /> Arquivos</TabsTrigger>
                                        <TabsTrigger value="imoveis" className="rounded-[18px] data-[state=active]:bg-white data-[state=active]:shadow-lg text-[11px] font-bold uppercase tracking-wider gap-2.5 transition-all"><Home className="w-4 h-4" /> Imóvel</TabsTrigger>
                                        <TabsTrigger value="historico" className="rounded-[18px] data-[state=active]:bg-white data-[state=active]:shadow-lg text-[11px] font-bold uppercase tracking-wider gap-2.5 transition-all"><History className="w-4 h-4" /> Linha do Tempo</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="dados" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
                                        <div className="space-y-8">
                                            <Card className="p-6 border-amber-200 bg-amber-50/20 rounded-[32px] border-dashed border-2 shadow-sm">
                                                <div className="flex items-center justify-between mb-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2.5 bg-amber-100 rounded-xl text-amber-600"><Wrench className="w-4 h-4" /></div>
                                                        <h3 className="text-sm font-black text-amber-900 uppercase tracking-widest">Assistente de Importação Inteligente</h3>
                                                    </div>
                                                    <Button onClick={handleAutoFill} className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl gap-2 font-bold transition-all px-5">Extrair e Preencher</Button>
                                                </div>
                                                <Textarea placeholder="Cole dados brutos do e-mail, portal ou edital aqui..." value={pasteArea} onChange={e => setPasteArea(e.target.value)} className="min-h-[140px] bg-white/80 border-amber-200 rounded-2xl text-sm italic shadow-inner focus:ring-amber-500" />
                                            </Card>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                <Card className="p-6 border-slate-100 rounded-[28px] shadow-sm hover:shadow-md transition-all">
                                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2.5"><UserCheck className="w-4 h-4 text-blue-500" /> Identificação do Cliente</h3>
                                                    <div className="space-y-5">
                                                        <div><Label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Nome do Proponente</Label><Input value={leilaoFormData.clienteNome || ''} onChange={e => setLeilaoFormData({...leilaoFormData, clienteNome: e.target.value})} className="h-11 rounded-xl bg-slate-50 border-none font-medium" /></div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div><Label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">CPF / CNPJ</Label><Input value={leilaoFormData.clienteCpfCnpj || ''} onChange={e => setLeilaoFormData({...leilaoFormData, clienteCpfCnpj: e.target.value})} className="h-11 rounded-xl bg-slate-50 border-none font-medium" /></div>
                                                            <div><Label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Contato</Label><Input value={leilaoFormData.clienteTelefone || ''} onChange={e => setLeilaoFormData({...leilaoFormData, clienteTelefone: e.target.value})} className="h-11 rounded-xl bg-slate-50 border-none font-medium" /></div>
                                                        </div>
                                                        <div><Label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">E-mail Principal</Label><Input value={leilaoFormData.clienteEmail || ''} onChange={e => setLeilaoFormData({...leilaoFormData, clienteEmail: e.target.value})} className="h-11 rounded-xl bg-slate-50 border-none font-medium" /></div>
                                                    </div>
                                                </Card>

                                                <Card className="p-6 border-slate-100 rounded-[28px] shadow-sm hover:shadow-md transition-all">
                                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2.5"><DollarSign className="w-4 h-4 text-emerald-500" /> Condições Financeiras</h3>
                                                    <div className="space-y-5">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div><Label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Valor de Avaliação</Label><Input value={leilaoFormData.finValorAvaliacao || ''} onChange={e => setLeilaoFormData({...leilaoFormData, finValorAvaliacao: e.target.value})} className="h-11 rounded-xl bg-emerald-50/50 border-none font-black text-emerald-700" /></div>
                                                            <div><Label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Valor do Lance</Label><Input value={leilaoFormData.finValorProposta || ''} onChange={e => setLeilaoFormData({...leilaoFormData, finValorProposta: e.target.value})} className="h-11 rounded-xl bg-amber-50/50 border-none font-black text-amber-700" /></div>
                                                        </div>
                                                        <div>
                                                            <Label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Forma de Pagamento</Label>
                                                            <Select value={leilaoFormData.finFormaPagamento || ''} onValueChange={v => setLeilaoFormData({...leilaoFormData, finFormaPagamento: v})}>
                                                                <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                <SelectContent className="rounded-2xl shadow-2xl p-2 border-slate-100">
                                                                    <SelectItem value="À Vista" className="rounded-xl">À Vista</SelectItem>
                                                                    <SelectItem value="Financiamento" className="rounded-xl">Financiamento</SelectItem>
                                                                    <SelectItem value="Parcelado" className="rounded-xl">Parcelado Direto</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div><Label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Observações de Pagamento</Label><Input value={leilaoFormData.finObsPagamento || ''} onChange={e => setLeilaoFormData({...leilaoFormData, finObsPagamento: e.target.value})} className="h-11 rounded-xl bg-slate-50 border-none font-medium" /></div>
                                                    </div>
                                                </Card>

                                                <Card className="p-6 border-slate-100 rounded-[28px] shadow-sm hover:shadow-md transition-all">
                                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2.5"><LayoutGrid className="w-4 h-4 text-indigo-500" /> Detalhes do Imóvel</h3>
                                                    <div className="space-y-5">
                                                        <div><Label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Número do Item / Lote</Label><Input value={leilaoFormData.imoveLote || ''} onChange={e => setLeilaoFormData({...leilaoFormData, imoveLote: e.target.value})} className="h-11 rounded-xl bg-slate-50 border-none font-black" /></div>
                                                        <div><Label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Localidade</Label><Input value={leilaoFormData.imovelLocal || ''} onChange={e => setLeilaoFormData({...leilaoFormData, imovelLocal: e.target.value})} className="h-11 rounded-xl bg-slate-50 border-none font-medium" /></div>
                                                        <div><Label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Referência Edital</Label><Input value={leilaoFormData.leilaoEdital || ''} onChange={e => setLeilaoFormData({...leilaoFormData, leilaoEdital: e.target.value})} className="h-11 rounded-xl bg-slate-50 border-none font-medium" /></div>
                                                    </div>
                                                </Card>
                                            </div>

                                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-50">
                                                <Button variant="ghost" className="rounded-2xl px-6 text-slate-400 font-bold hover:bg-slate-50">Limpar Campos</Button>
                                                <Button onClick={handleSaveLeilaoData} disabled={isSavingLeilao} className="bg-amber-600 hover:bg-amber-700 text-white rounded-[18px] px-10 font-black shadow-lg shadow-amber-200 h-12 uppercase tracking-widest text-xs transition-all">
                                                    {isSavingLeilao ? 'Processando...' : 'Salvar Todas as Alterações'}
                                                </Button>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="documentos" className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                                        <div
                                            onDragOver={e => { e.preventDefault(); setIsDraggingDoc(true); }}
                                            onDragLeave={() => setIsDraggingDoc(false)}
                                            onDrop={e => { e.preventDefault(); setIsDraggingDoc(false); handleDocFileDrop(e.dataTransfer.files); }}
                                            onClick={() => docInputRef.current?.click()}
                                            className={`border-4 border-dashed rounded-[40px] p-20 text-center cursor-pointer transition-all mb-10 ${isDraggingDoc ? 'border-amber-400 bg-amber-50 scale-105 shadow-2xl' : 'border-slate-100 bg-slate-50/50 hover:border-amber-300 hover:bg-amber-50/30'}`}
                                        >
                                            <div className="w-20 h-20 bg-white rounded-[32px] shadow-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all"><Upload className="w-10 h-10 text-amber-500" /></div>
                                            <p className="text-lg font-black text-slate-800 tracking-tight">Deposite documentos aqui</p>
                                            <p className="text-sm text-slate-400 mt-2 font-medium">Arquivos suportados: PDF, JPG, PNG, DOCX (Máx 20MB)</p>
                                            <input ref={docInputRef} type="file" multiple className="hidden" onChange={e => handleDocFileDrop(e.target.files)} />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {uploadedDocs.length === 0 ? (
                                                <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-[40px] border border-slate-100 border-dashed">
                                                    <FileCheck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                                    <p className="text-slate-400 font-bold italic">Nenhum documento anexado ao processo.</p>
                                                </div>
                                            ) : (
                                                uploadedDocs.map((doc, i) => (
                                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} key={i} className="group p-5 bg-white rounded-[28px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all flex flex-col justify-between">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600"><File className="w-6 h-6" /></div>
                                                                <div className="max-w-[140px]">
                                                                    <p className="text-sm font-black text-slate-800 truncate mb-0.5">{doc.name}</p>
                                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{ (doc.size / 1024).toFixed(0) } KB • { new Date(doc.uploadedAt).toLocaleDateString('pt-BR') }</p>
                                                                </div>
                                                            </div>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 opacity-0 group-hover:opacity-100 transition-all"><Settings className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                                                <DropdownMenuContent className="p-2 rounded-xl border-slate-100 shadow-2xl">
                                                                    <DropdownMenuItem className="p-3 rounded-lg text-xs font-bold gap-3"><Eye className="w-4 h-4" /> Visualizar</DropdownMenuItem>
                                                                    <DropdownMenuItem className="p-3 rounded-lg text-xs font-bold text-red-500 gap-3" onClick={() => setUploadedDocs(prev => prev.filter((_, idx) => idx !== i))}><Trash2 className="w-4 h-4" /> Excluir</DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <a href={doc.url} download={doc.name} className="flex-1"><Button variant="outline" className="w-full h-10 rounded-[14px] text-xs font-black gap-2 border-slate-100 hover:bg-slate-50 transition-all"><Download className="w-3.5 h-3.5" /> DOWNLOAD</Button></a>
                                                        </div>
                                                    </motion.div>
                                                ))
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="historico" className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                                        <div className="max-w-3xl mx-auto space-y-12">
                                            <div className="relative pl-12 border-l-4 border-slate-100 space-y-12 pb-10">
                                                <div className="relative">
                                                    <div className="absolute -left-[58px] top-0 w-8 h-8 rounded-full bg-white border-4 border-amber-500 shadow-xl flex items-center justify-center text-amber-500 font-black text-[10px] z-10">01</div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                                        <Clock className="w-3 h-3" /> Hoje, às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                    <h4 className="text-base font-black text-slate-800 tracking-tight">Processo imortalizado no ecossistema</h4>
                                                    <div className="mt-3 p-5 bg-slate-50 rounded-[24px] border border-slate-100 shadow-inner">
                                                        <p className="text-sm text-slate-500 leading-relaxed">Registro inicial efetuado com status <span className="font-black text-slate-900">"{selectedCase?.status}"</span>. Todas as ramificações de inteligência de negócio foram ativadas para este contrato.</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-10 border-t border-slate-100 flex flex-col items-center">
                                                <div className="p-10 bg-emerald-50/50 rounded-[48px] border-4 border-emerald-100 border-dashed text-center max-w-sm">
                                                    <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-200"><CheckCircle2 className="w-10 h-10" /></div>
                                                    <h3 className="text-xl font-black text-emerald-900 tracking-tight mb-3">Conclusão de Ciclo</h3>
                                                    <p className="text-xs text-emerald-700 font-medium mb-8 leading-relaxed">Ao arrematar, o processo será transposto para a categoria de conclusos, liberando recursos operacionais.</p>
                                                    <Button onClick={handleConcluirProcesso} disabled={isSavingLeilao || selectedCase?.status === 'Concluídos'} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white gap-3 rounded-[24px] font-black shadow-2xl shadow-emerald-200 uppercase tracking-widest text-xs transition-all ring-offset-2 hover:ring-2 ring-emerald-500">
                                                        {isSavingLeilao ? 'Processando...' : 'Finalizar e Arquivar'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="proponentes" className="py-20 text-center bg-slate-50/30 rounded-[40px] border border-slate-50">
                                        <Users className="w-16 h-16 text-slate-200 mx-auto mb-6 opacity-50" />
                                        <h3 className="text-lg font-black text-slate-300 uppercase tracking-widest">Controle de Coproponentes</h3>
                                        <p className="max-w-xs mx-auto text-slate-400 font-medium text-xs mt-3 leading-relaxed">Módulo de gestão de sócios e intervenientes garantidores está sendo otimizado pela engenharia.</p>
                                    </TabsContent>
                                    <TabsContent value="pendencias" className="py-20 text-center bg-slate-50/30 rounded-[40px] border border-slate-50">
                                        <AlertTriangle className="w-16 h-16 text-slate-200 mx-auto mb-6 opacity-50" />
                                        <h3 className="text-lg font-black text-slate-300 uppercase tracking-widest">Painel de Impedimentos</h3>
                                        <p className="max-w-xs mx-auto text-slate-400 font-medium text-xs mt-3 leading-relaxed">O rastreador de pendências críticas será integrado na próxima iteração de build.</p>
                                    </TabsContent>
                                    <TabsContent value="tarefas" className="py-20 text-center bg-slate-50/30 rounded-[40px] border border-slate-50">
                                        <CheckSquare className="w-16 h-16 text-slate-200 mx-auto mb-6 opacity-50" />
                                        <h3 className="text-lg font-black text-slate-300 uppercase tracking-widest">Workflow de Micro-tarefas</h3>
                                        <p className="max-w-xs mx-auto text-slate-400 font-medium text-xs mt-3 leading-relaxed">A gestão granular de steps operacionais está em fase alfa de calibração.</p>
                                    </TabsContent>
                                    <TabsContent value="imoveis" className="py-20 text-center bg-slate-50/30 rounded-[40px] border border-slate-50">
                                        <Home className="w-16 h-16 text-slate-200 mx-auto mb-6 opacity-50" />
                                        <h3 className="text-lg font-black text-slate-300 uppercase tracking-widest">Vinculação Patrimonial</h3>
                                        <p className="max-w-xs mx-auto text-slate-400 font-medium text-xs mt-3 leading-relaxed">Módulo de interlink direto com o inventário imobiliário em fase de sincronização.</p>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </ScrollArea>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
