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
    Gavel,
    Key
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ContractWizard } from '@/components/admin/contracts/ContractWizard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import AdminLayout from '@/components/layouts/AdminLayout';
import { BaseCrudService } from '@/integrations';
import { ServiceRecords, UsuriosdoSistema, PendnciasdoFinanciamento, FinancingTasks, ServiceParties, Clients, DocumentosdoFinanciamento, HistricodeInteraes, Imveis, AtendimentoImveis, ChecklistdosProponentes } from '@/entities';
import { formatCurrency, parseCurrency, formatCPF } from '@/lib/input-masks';

// Types and Interfaces adapted for Locações
interface LocacoesCase {
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
    bloqueioCliente?: boolean;
    bloqueioPagamento?: boolean;

    // Data fields
    propertyValue?: number;
    rentValue?: number;
    notes?: string;

    interlinks?: {
        hasProperty: boolean;
        activeSales: number;
        activeRentals: number;
        activeFinancing: number;
        activeAuctions: number;
        relatedServices: { _id: string; serviceType: string; contactName: string; pastaInterna: string; status: string }[];
    };
}

const LOCACOES_COLUMNS = [
    { id: 'Novos', name: 'Novos', color: 'bg-blue-100 border-blue-300', bgColor: 'bg-blue-100', borderColor: 'border-blue-300' },
    { id: 'Em andamento', name: 'Em andamento', color: 'bg-purple-100 border-purple-300', bgColor: 'bg-purple-100', borderColor: 'border-purple-300' },
    { id: 'Concluídos', name: 'Concluídos', color: 'bg-green-100 border-green-300', bgColor: 'bg-green-100', borderColor: 'border-green-300' },
];

const BACKGROUND_OPTIONS = [
    { id: 'default', name: 'Padrão Claro', value: 'bg-slate-50', preview: '#F8FAFC' },
    { id: 'dark', name: 'Escuro', value: 'bg-slate-900', preview: '#0F172A' },
    { id: 'green', name: 'Verde Natureza', value: 'bg-emerald-50', preview: '#ECFDF5' },
    { id: 'gradient-emerald', name: 'Gradiente Esmeralda', value: 'bg-gradient-to-br from-emerald-50 to-teal-100', preview: 'linear-gradient(135deg, #ecfdf5, #f0fdfa)' },
    { id: 'image-house', name: 'Casa Moderna', value: 'bg-[url(https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920)] bg-cover bg-center', preview: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400' },
];

export default function AdminLocacoesKanbanPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation() as any;
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const scrollbarRef = useRef<HTMLDivElement>(null);
    const scrollbarThumbRef = useRef<HTMLDivElement>(null);

    const [cases, setCases] = useState<LocacoesCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCase, setSelectedCase] = useState<LocacoesCase | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [modalTab, setModalTab] = useState('dados');
    type RelatedService = { _id: string; serviceType: string; contactName: string; pastaInterna: string; status: string };
    const [previewRelatedCard, setPreviewRelatedCard] = useState<RelatedService | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [kanbanBackground, setKanbanBackground] = useState('bg-slate-50');
    const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    const [clients, setClients] = useState<Clients[]>([]);
    const [users, setUsers] = useState<UsuriosdoSistema[]>([]);
    const [atendimentosRaw, setAtendimentosRaw] = useState<ServiceRecords[]>([]);

    useEffect(() => {
        loadData();
        const storedBg = localStorage.getItem('kanban-background-locacoes');
        if (storedBg) setKanbanBackground(storedBg);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const { items: clientsList } = await BaseCrudService.getAll<Clients>('clientes');
            setClients(clientsList);

            const { items: usersList } = await BaseCrudService.getAll<UsuriosdoSistema>('usuariossistema');
            setUsers(usersList);

            const { items: atendimentos } = await BaseCrudService.getAll<ServiceRecords>('atendimentos');
            setAtendimentosRaw(atendimentos);
            const { items: pendingsList } = await BaseCrudService.getAll<PendnciasdoFinanciamento>('pendenciasfinanciamento');
            const { items: tasksList } = await BaseCrudService.getAll<FinancingTasks>('tarefasfinanciamento');
            const { items: partiesList } = await BaseCrudService.getAll<ServiceParties>('atendimentopartes');
            const { items: propertiesList } = await BaseCrudService.getAll<Imveis>('imoveis');

            // Deduplication Logic: One active process per client per service type (Locação/Aluguel)
            const uniqueAtendimentos: ServiceRecords[] = [];
            const seenClients = new Set<string>();

            atendimentos
                .filter(a => ['Locação', 'Aluguel'].includes(a.serviceType || '') && !a.isArchived)
                .sort((a, b) => {
                    const dateA = new Date(a._updatedDate || a._createdDate || 0).getTime();
                    const dateB = new Date(b._updatedDate || b._createdDate || 0).getTime();
                    return dateB - dateA;
                })
                .forEach(a => {
                    const clientKey = a.clientePrincipalRef || a.contactPhone || a._id;
                    if (!seenClients.has(clientKey)) {
                        seenClients.add(clientKey);
                        uniqueAtendimentos.push(a);
                    }
                });

            const filteredCases = uniqueAtendimentos.map(a => {
                const client = clientsList.find(c => c._id === a.clientePrincipalRef);
                const dataEntrada = a._updatedDate || a._createdDate || new Date();
                const diasNaFase = Math.floor((new Date().getTime() - new Date(dataEntrada).getTime()) / (1000 * 60 * 60 * 24));

                const casePendings = pendingsList.filter(p => p.atendimentoRef === a._id && p.status !== 'Resolvida');
                const caseTasks = tasksList.filter(t => t.atendimentoRef === a._id && t.status !== 'Concluída');

                // Compute Interlinks
                const clientId = a.clientePrincipalRef;

                // Other services where this client is primary
                const otherPrimaryServices = atendimentos.filter(s => s.clientePrincipalRef === clientId && s._id !== a._id && !s.isArchived);

                // Services where this client is a participant
                const participantServicesRefs = partiesList.filter(p => p.clientRef === clientId).map(p => p.serviceRecordRef);
                const participationServices = atendimentos.filter(s => participantServicesRefs.includes(s._id) && s._id !== a._id && !s.isArchived);

                const allRelatedServices = [...otherPrimaryServices, ...participationServices];

                const interlinks = {
                    hasProperty: propertiesList.some(p => p.proprietarioId === clientId || p.emailProprietario === client?.emailPrincipal || p.telefoneProprietario === client?.phoneNumber),
                    activeSales: allRelatedServices.filter(s => ['Venda', 'Compra'].includes(s.serviceType || '')).length,
                    activeRentals: allRelatedServices.filter(s => ['Locação', 'Aluguel'].includes(s.serviceType || '')).length,
                    activeFinancing: allRelatedServices.filter(s => ['Financiamento', 'Crédito'].includes(s.serviceType || '')).length,
                    activeAuctions: allRelatedServices.filter(s => ['Leilão'].includes(s.serviceType || '')).length,
                    relatedServices: allRelatedServices.map(s => ({
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
                    status: a.status || 'Novos',
                    faseAtual: a.status || 'Novos',
                    serviceType: a.serviceType || 'Locação',
                    contactPhone: a.contactPhone || client?.phoneNumber || '',
                    contactEmail: a.contactEmail || client?.email || '',
                    diasNaFase,
                    pendenciasAbertas: casePendings.length,
                    tarefasAbertas: caseTasks.length,
                    bloqueioDocumento: casePendings.some(p => p.categoria === 'Documento'),
                    bloqueioPagamento: casePendings.some(p => p.categoria === 'Financeiro'),
                    bloqueioCliente: casePendings.some(p => p.categoria === 'Cliente'),
                    propertyValue: (a as any).propertyValue || 0,
                    rentValue: (a as any).rentValue || 0,
                    notes: a.notes || '',
                    interlinks
                };
            });

            setCases(filteredCases);
        } catch (error) {
            console.error('Error loading Locações Kanban data:', error);
            toast.error('Erro ao carregar dados do Kanban');
        } finally {
            setLoading(false);
        }
    };

    // Scroll Acceleration Logic
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const updateScrollbar = () => {
            if (!scrollbarRef.current || !scrollbarThumbRef.current) return;
            const scrollWidth = container.scrollWidth;
            const clientWidth = container.clientWidth;
            const scrollLeft = container.scrollLeft;
            if (scrollWidth <= clientWidth) {
                scrollbarRef.current.style.display = 'none';
                return;
            }
            scrollbarRef.current.style.display = 'block';
            const thumbWidth = (clientWidth / scrollWidth) * clientWidth;
            scrollbarThumbRef.current.style.width = `${thumbWidth}px`;
            const maxScroll = scrollWidth - clientWidth;
            const scrollPercentage = maxScroll > 0 ? scrollLeft / maxScroll : 0;
            const maxThumbPosition = clientWidth - thumbWidth;
            scrollbarThumbRef.current.style.transform = `translateX(${scrollPercentage * maxThumbPosition}px)`;
        };

        container.addEventListener('scroll', updateScrollbar);
        window.addEventListener('resize', updateScrollbar);
        updateScrollbar();
        setTimeout(updateScrollbar, 500);
        return () => {
            container.removeEventListener('scroll', updateScrollbar);
            window.removeEventListener('resize', updateScrollbar);
        };
    }, [cases]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        let isMouseDown = false;
        let startX = 0;
        let scrollLeft = 0;
        const handleMouseDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('button') || target.closest('[data-rbd-draggable-id]') || target.closest('input')) return;
            isMouseDown = true;
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
            container.style.cursor = 'grabbing';
        };
        const handleMouseMove = (e: MouseEvent) => {
            if (!isMouseDown) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 3;
            container.scrollLeft = scrollLeft - walk;
        };
        const stopScrolling = () => {
            isMouseDown = false;
            container.style.cursor = 'grab';
        };
        container.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', stopScrolling);
        return () => {
            container.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', stopScrolling);
        };
    }, []);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                container.scrollLeft += e.deltaY * 2;
            }
        };
        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, []);

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

    const handleChangeBackground = (bg: string) => {
        setKanbanBackground(bg);
        localStorage.setItem('kanban-background-locacoes', bg);
        setShowBackgroundPicker(false);
    };

    const handleOpenDetails = (caseItem: LocacoesCase) => {
        setSelectedCase(caseItem);
        setShowDetailsModal(true);
    };

    // Auto-open card from state
    useEffect(() => {
        const openCardId = searchParams.get('openCard') || location.state?.openCardId;
        if (!loading && cases.length > 0 && openCardId) {
            const cardId = openCardId;
            const cardToOpen = cases.find((c: any) => c._id === cardId);
            if (cardToOpen) {
                handleOpenDetails(cardToOpen);
                // Clear state to avoid reopening on refresh
                window.history.replaceState({ ...location.state, openCardId: undefined }, document.title);
            }
        }
    }, [cases, loading, location.state]);

    return (
        <AdminLayout>
            <div className={`h-[calc(100vh-64px)] flex flex-col overflow-hidden transition-all duration-300 ${kanbanBackground}`}>
                <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-20">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Building2 className="w-6 h-6 text-emerald-600" />
                            Kanban de Locações
                        </h1>
                        <p className="text-slate-500 text-sm">Gestão de aluguéis e contratos de locação</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por inquilino, pasta..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-10 rounded-full border-slate-200 bg-white"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full bg-white"
                            onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}
                        >
                            <Palette className="w-4 h-4" />
                        </Button>
                        <Button className="h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-6">
                            <Plus className="w-4 h-4" />
                            Nova Locação
                        </Button>
                    </div>
                </div>

                <AnimatePresence>
                    {showBackgroundPicker && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-24 top-20 bg-white shadow-2xl rounded-2xl p-4 z-50 border border-slate-200 w-64"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800 text-sm">Personalizar fundo</h3>
                                <Button variant="ghost" size="icon" onClick={() => setShowBackgroundPicker(false)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {BACKGROUND_OPTIONS.map((bg) => (
                                    <button
                                        key={bg.id}
                                        onClick={() => handleChangeBackground(bg.value)}
                                        className={`group relative h-16 rounded-xl overflow-hidden border-2 transition-all ${kanbanBackground === bg.value ? 'border-emerald-500 scale-95' : 'border-slate-100 hover:border-slate-200'}`}
                                    >
                                        {bg.id.startsWith('image') ? (
                                            <img src={bg.preview} className="absolute inset-0 w-full h-full object-cover" alt={bg.name} />
                                        ) : (
                                            <div className="absolute inset-0 w-full h-full" style={{ background: bg.preview }} />
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 bg-black/40 py-1 text-[8px] text-white font-medium text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            {bg.name}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex-1 relative overflow-hidden group/board">
                    <div ref={scrollbarRef} className="absolute bottom-4 left-6 right-6 h-2 bg-slate-900/10 rounded-full z-30 opacity-0 group-hover/board:opacity-100 transition-opacity">
                        <div ref={scrollbarThumbRef} className="h-full bg-slate-900/40 rounded-full cursor-grab active:cursor-grabbing hover:bg-slate-900/60 transition-colors" />
                    </div>

                    <div ref={scrollContainerRef} className="h-full overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing no-scrollbar scroll-smooth">
                        <DragDropContext onDragEnd={onDragEnd}>
                            <div className="flex h-full p-6 gap-6 min-w-max">
                                {LOCACOES_COLUMNS.map((column) => (
                                    <div key={column.id} className="w-80 flex flex-col h-full rounded-2xl bg-slate-100/40 backdrop-blur-sm border border-slate-200/50">
                                        <div className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${column.borderColor.replace('border', 'bg')}`} />
                                                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">{column.name}</h3>
                                                <Badge variant="secondary" className="bg-white/50 text-slate-600 rounded-lg text-[10px] px-2 h-5 border-none">
                                                    {cases.filter(c => c.faseAtual === column.id).length}
                                                </Badge>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-lg">
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        <Droppable droppableId={column.id}>
                                            {(provided, snapshot) => (
                                                <div
                                                    {...provided.droppableProps}
                                                    ref={provided.innerRef}
                                                    className={`flex-1 px-3 pb-4 overflow-y-auto no-scrollbar transition-colors ${snapshot.isDraggingOver ? 'bg-emerald-50/30' : ''}`}
                                                >
                                                    <div className="flex flex-col gap-3">
                                                        {cases
                                                            .filter(c => c.faseAtual === column.id)
                                                            .filter(c =>
                                                                c.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                                c.pastaInterna?.toLowerCase().includes(searchTerm.toLowerCase())
                                                            )
                                                            .map((caseItem, index) => (
                                                                <Draggable key={caseItem._id} draggableId={caseItem._id} index={index}>
                                                                    {(provided, snapshot) => (
                                                                        <Card
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            {...provided.dragHandleProps}
                                                                            onClick={() => handleOpenDetails(caseItem)}
                                                                            className={`group relative p-4 bg-white border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all cursor-pointer rounded-2xl ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-emerald-500 scale-105 rotate-2' : ''}`}
                                                                        >
                                                                            <div className="mb-3">
                                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-between">
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Hash className="w-3 h-3" />
                                                                                        {caseItem.pastaInterna}
                                                                                    </span>
                                                                                    <span className={`px-2 py-0.5 rounded-full text-white ${caseItem.diasNaFase > 7 ? 'bg-orange-500' : 'bg-emerald-500'}`}>
                                                                                        {caseItem.diasNaFase} {caseItem.diasNaFase === 1 ? 'dia' : 'dias'}
                                                                                    </span>
                                                                                </div>
                                                                                <h4 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-emerald-600 transition-colors">
                                                                                    {caseItem.contactName}
                                                                                </h4>
                                                                                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Phone className="w-3 h-3" />
                                                                                        {caseItem.contactPhone || 'S/ Telefone'}
                                                                                    </span>
                                                                                    {caseItem.contactPhone && (
                                                                                        <a
                                                                                            href={`https://wa.me/55${caseItem.contactPhone.replace(/\D/g, '')}`}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            onClick={(e) => e.stopPropagation()}
                                                                                            className="p-1 px-1.5 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-all flex items-center gap-1 border border-green-100/50"
                                                                                            title="WhatsApp"
                                                                                        >
                                                                                            <MessageSquare className="w-3 h-3" />
                                                                                            <span>WhatsApp</span>
                                                                                        </a>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex flex-wrap gap-2 mb-3">
                                                                                {caseItem.pendenciasAbertas > 0 && (
                                                                                    <Badge variant="outline" className="bg-orange-50 border-orange-100 text-orange-600 text-[10px] gap-1 px-1.5 h-6">
                                                                                        <AlertCircle className="w-3 h-3" />
                                                                                        {caseItem.pendenciasAbertas} Pend.
                                                                                    </Badge>
                                                                                )}
                                                                                {caseItem.tarefasAbertas > 0 && (
                                                                                    <Badge variant="outline" className="bg-blue-50 border-blue-100 text-blue-600 text-[10px] gap-1 px-1.5 h-6">
                                                                                        <CheckCircle className="w-3 h-3" />
                                                                                        {caseItem.tarefasAbertas} Tar.
                                                                                    </Badge>
                                                                                )}
                                                                            </div>

                                                                            {/* Interlinks (Cross-Board Visibility) */}
                                                                            {(caseItem.interlinks?.hasProperty ||
                                                                                caseItem.interlinks?.activeSales ||
                                                                                caseItem.interlinks?.activeRentals ||
                                                                                caseItem.interlinks?.activeFinancing ||
                                                                                caseItem.interlinks?.activeAuctions) ? (
                                                                                <div className="flex flex-wrap gap-1.5 mb-3 p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                                                                                    {caseItem.interlinks.hasProperty && (
                                                                                        <div className="w-6 h-6 rounded bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100" title="Possui Imóvel Cadastrado">
                                                                                            <Home className="w-3.5 h-3.5" />
                                                                                        </div>
                                                                                    )}
                                                                                    {(caseItem.interlinks.activeSales || 0) > 0 && (
                                                                                        <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100" title={`${caseItem.interlinks.activeSales} Outras Vendas/Compras`}>
                                                                                            <DollarSign className="w-3.5 h-3.5" />
                                                                                        </div>
                                                                                    )}
                                                                                    {(caseItem.interlinks.activeRentals || 0) > 0 && (
                                                                                        <div className="w-6 h-6 rounded bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100" title={`${caseItem.interlinks.activeRentals} Locações/Aluguéis`}>
                                                                                            <Key className="w-3.5 h-3.5" />
                                                                                        </div>
                                                                                    )}
                                                                                    {(caseItem.interlinks.activeFinancing || 0) > 0 && (
                                                                                        <div className="w-6 h-6 rounded bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100" title={`${caseItem.interlinks.activeFinancing} Processos de Financiamento`}>
                                                                                            <Landmark className="w-3.5 h-3.5" />
                                                                                        </div>
                                                                                    )}
                                                                                    {(caseItem.interlinks.activeAuctions || 0) > 0 && (
                                                                                        <div className="w-6 h-6 rounded bg-red-50 flex items-center justify-center text-red-600 border border-red-100" title={`${caseItem.interlinks.activeAuctions} Processos de Leilão`}>
                                                                                            <Gavel className="w-3.5 h-3.5" />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ) : null}

                                                                            <div className="flex gap-1.5">
                                                                                {caseItem.bloqueioDocumento && (
                                                                                    <div className="w-6 h-6 rounded bg-red-100 flex items-center justify-center text-red-600" title="Documentação Pendente">
                                                                                        <FileText className="w-3.5 h-3.5" />
                                                                                    </div>
                                                                                )}
                                                                                {caseItem.bloqueioPagamento && (
                                                                                    <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center text-amber-600" title="Pendente Financeiro">
                                                                                        <DollarSign className="w-3.5 h-3.5" />
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-3">
                                                                                <Badge variant="secondary" className="bg-slate-50 text-slate-500 text-[10px] font-normal px-2">
                                                                                    {caseItem.serviceType}
                                                                                </Badge>
                                                                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                                                                </Button>
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
                    <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden rounded-3xl">
                        <DialogHeader className="px-8 py-6 border-b border-slate-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 rounded-full px-2 py-0 text-[10px] font-bold uppercase tracking-tight">
                                            Ficha de {selectedCase?.serviceType}
                                        </Badge>
                                        <span className="text-slate-400 text-xs font-medium">Pasta: {selectedCase?.pastaInterna}</span>
                                    </div>
                                    <DialogTitle className="text-2xl font-bold text-slate-900">{selectedCase?.contactName}</DialogTitle>
                                    {selectedCase?.interlinks?.relatedServices && selectedCase.interlinks.relatedServices.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2 items-center">
                                            <span className="text-xs text-gray-400 font-medium">Vínculos:</span>
                                            {selectedCase.interlinks.relatedServices.map(rel => {
                                                const routeMap: Record<string, string> = {
                                                    'Venda': '/admin/negocios/kanban', 'Compra': '/admin/negocios/kanban',
                                                    'Locação': '/admin/locacoes/kanban', 'Aluguel': '/admin/locacoes/kanban',
                                                    'Financiamento': '/admin/financiamento-kanban', 'Crédito': '/admin/financiamento-kanban',
                                                    'Leilão': '/admin/leilao/kanban'
                                                };
                                                const colorMap: Record<string, string> = {
                                                    'Venda': 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
                                                    'Compra': 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
                                                    'Locação': 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200',
                                                    'Aluguel': 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200',
                                                    'Financiamento': 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200',
                                                    'Crédito': 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200',
                                                    'Leilão': 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                                                };
                                                const iconMap: Record<string, string> = {
                                                    'Venda': '💰', 'Compra': '💰',
                                                    'Locação': '🔑', 'Aluguel': '🔑',
                                                    'Financiamento': '🏦', 'Crédito': '🏦',
                                                    'Leilão': '🔨'
                                                };
                                                const route = routeMap[rel.serviceType];
                                                const color = colorMap[rel.serviceType] || 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200';
                                                const icon = iconMap[rel.serviceType] || '📋';
                                                if (!route) return null;
                                                return (
                                                    <button
                                                        key={rel._id}
                                                        title={`Visualizar: ${rel.serviceType} - ${rel.contactName}`}
                                                        onClick={() => {
                                                            if (route) {
                                                                navigate(`${route}?openCard=${rel._id}`);
                                                            }
                                                        }}
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-semibold transition-colors cursor-pointer ${color}`}
                                                    >
                                                        <span>{icon}</span>
                                                        <span>{rel.serviceType}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    {selectedCase?.contactPhone && (
                                        <Button
                                            variant="outline"
                                            className="h-10 px-4 rounded-2xl bg-green-50 text-green-700 border-green-100 hover:bg-green-100 hover:text-green-800 transition-all font-semibold"
                                            onClick={() => {
                                                const phone = selectedCase.contactPhone?.replace(/\D/g, '');
                                                window.open(`https://wa.me/55${phone}`, '_blank');
                                            }}
                                        >
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            WhatsApp
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowDetailsModal(false)}>
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </DialogHeader>

                        <ScrollArea className="h-[calc(90vh-100px)]">
                            <div className="p-8">
                                <Tabs value={modalTab} onValueChange={setModalTab}>
                                    <TabsList className="grid grid-cols-7 mb-8 bg-slate-100/50 p-1 rounded-2xl h-12">
                                        <TabsTrigger value="dados" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs gap-2">
                                            <FileText className="w-4 h-4" /> Dados
                                        </TabsTrigger>
                                        <TabsTrigger value="proponentes" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs gap-2">
                                            <Users className="w-4 h-4" /> Partes
                                        </TabsTrigger>
                                        <TabsTrigger value="pendencias" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs gap-2">
                                            <AlertCircle className="w-4 h-4" /> Pendências
                                        </TabsTrigger>
                                        <TabsTrigger value="tarefas" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs gap-2">
                                            <CheckCircle className="w-4 h-4" /> Tarefas
                                        </TabsTrigger>
                                        <TabsTrigger value="documentos" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs gap-2">
                                            <Upload className="w-4 h-4" /> Documentos
                                        </TabsTrigger>
                                        <TabsTrigger value="imoveis" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs gap-2">
                                            <Home className="w-4 h-4" /> Imóvel
                                        </TabsTrigger>
                                        <TabsTrigger value="historico" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs gap-2">
                                            <History className="w-4 h-4" /> Histórico
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="dados" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <Card className="p-6 border-slate-100 shadow-sm rounded-2xl">
                                                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                                    <Info className="w-4 h-4 text-emerald-500" />
                                                    Informações Básicas
                                                </h3>
                                                <div className="space-y-4">
                                                    <div>
                                                        <Label className="text-[10px] text-slate-400 uppercase tracking-wider">Inquilino Principal</Label>
                                                        <p className="text-sm font-medium text-slate-900">{selectedCase?.contactName}</p>
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px] text-slate-400 uppercase tracking-wider">CPF</Label>
                                                        <p className="text-sm font-medium text-slate-900">{selectedCase?.cpfProponentePrincipal ? formatCPF(selectedCase.cpfProponentePrincipal) : '—'}</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label className="text-[10px] text-slate-400 uppercase tracking-wider">Telefone</Label>
                                                            <p className="text-sm font-medium text-slate-900">{selectedCase?.contactPhone || '—'}</p>
                                                        </div>
                                                        <div>
                                                            <Label className="text-[10px] text-slate-400 uppercase tracking-wider">Pasta</Label>
                                                            <p className="text-sm font-medium text-slate-900">{selectedCase?.pastaInterna}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>

                                            <Card className="p-6 border-slate-100 shadow-sm rounded-2xl">
                                                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                                    <DollarSign className="w-4 h-4 text-emerald-500" />
                                                    Valores da Locação
                                                </h3>
                                                <div className="space-y-4">
                                                    <div>
                                                        <Label className="text-[10px] text-slate-400 uppercase tracking-wider">Valor do Aluguel</Label>
                                                        <p className="text-lg font-bold text-slate-900">{formatCurrency(selectedCase?.rentValue || 0)}</p>
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px] text-slate-400 uppercase tracking-wider">Tipo de Contrato</Label>
                                                        <div className="flex items-center justify-between">
                                                            <Badge className="mt-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none">{selectedCase?.serviceType}</Badge>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 border-secondary text-secondary hover:bg-secondary/10 gap-2 font-bold"
                                                                onClick={() => setIsWizardOpen(true)}
                                                            >
                                                                <FileText className="w-4 h-4" />
                                                                Gerar Contrato
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>

                                            <Card className="p-6 border-slate-100 shadow-sm rounded-2xl">
                                                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                                    <ClipboardList className="w-4 h-4 text-amber-500" />
                                                    Notas Internas
                                                </h3>
                                                <Textarea
                                                    className="min-h-[120px] bg-slate-50 border-none rounded-xl text-sm italic"
                                                    value={selectedCase?.notes || ''}
                                                    readOnly
                                                />
                                            </Card>
                                        </div>
                                    </TabsContent>

                                    {/* Remaining tabs pattern same as Vendas */}
                                </Tabs>
                            </div>
                        </ScrollArea>

                        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                            <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-2 rounded-xl">
                                <Trash2 className="w-4 h-4" /> Cancelar Processo
                            </Button>
                            <div className="flex gap-3">
                                <Button variant="outline" className="rounded-xl px-6" onClick={() => setShowDetailsModal(false)}>Fechar</Button>
                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 font-bold shadow-lg shadow-emerald-200">
                                    Salvar Alterações
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {selectedCase && (
                    <ContractWizard
                        isOpen={isWizardOpen}
                        onClose={() => setIsWizardOpen(false)}
                        onSuccess={loadData}
                        atendimento={atendimentosRaw.find(a => a._id === selectedCase._id) as any || { _id: selectedCase._id, contactName: selectedCase.contactName }}
                    />
                )}
            </div>
        </AdminLayout>
    );
}
