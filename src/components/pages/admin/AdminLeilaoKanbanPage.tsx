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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
    const [kanbanBackground, setKanbanBackground] = useState('bg-slate-50');
    const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
    const [showEmptyColumns, setShowEmptyColumns] = useState(true);
    type RelatedService = { _id: string; serviceType: string; contactName: string; pastaInterna: string; status: string };
    const [previewRelatedCard, setPreviewRelatedCard] = useState<RelatedService | null>(null);

    const [clients, setClients] = useState<Clients[]>([]);
    const [users, setUsers] = useState<UsuriosdoSistema[]>([]);
    const [leilaoFormData, setLeilaoFormData] = useState<Record<string, string>>({});
    const [isSavingLeilao, setIsSavingLeilao] = useState(false);
    const [uploadedDocs, setUploadedDocs] = useState<{ name: string; url: string; size: number; type: string; uploadedAt: string }[]>([]);
    const [isDraggingDoc, setIsDraggingDoc] = useState(false);
    const docInputRef = useRef<HTMLInputElement>(null);

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

                // Compute Interlinks
                const clientId = a.clientePrincipalRef;

                // Other services where this client is primary
                const otherPrimaryServices = atendimentos.filter(s => s.clientePrincipalRef === clientId && s._id !== a._id && !s.isArchived);

                // Services where this client is a participant
                const participantServicesRefs = partiesList.filter(p => p.clientRef === clientId).map(p => p.serviceRecordRef);
                const participationServices = atendimentos.filter(s => participantServicesRefs.includes(s._id) && s._id !== a._id && !s.isArchived);

                // Services related to the same property
                const clientPropertyIds = propertyLinks.filter(p => p.atendimentoRef === a._id).map(p => p.imovelRef);
                const propertyRelatedRefs = propertyLinks
                    .filter(p => clientPropertyIds.includes(p.imovelRef) && p.atendimentoRef !== a._id)
                    .map(p => p.atendimentoRef);
                const propertyRelatedServices = atendimentos.filter(s => propertyRelatedRefs.includes(s._id) && !s.isArchived);

                // Combine and unique by ID
                const combinedServices = [...otherPrimaryServices, ...participationServices, ...propertyRelatedServices];
                const uniqueRelated = Array.from(new Map(combinedServices.map(s => [s._id, s])).values());

                const interlinks = {
                    hasProperty: clientPropertyIds.length > 0 || propertiesList.some(p => p.proprietarioId === clientId || p.emailProprietario === client?.emailPrincipal || p.telefoneProprietario === client?.phoneNumber),
                    activeSales: uniqueRelated.filter(s => ['Venda', 'Compra', 'Leilão'].includes(s.serviceType || '')).length,
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
                    status: a.status || 'Novos clientes',
                    faseAtual: a.status || 'Novos clientes',
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
                    interlinks
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
            window.addEventListener('resize', updateScrollbar);
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
        localStorage.setItem('kanban-background-leilao', bg);
        setShowBackgroundPicker(false);
    };

    const handleOpenDetails = (caseItem: LeilaoCase) => {
        setSelectedCase(caseItem);
        // Populate form from existing data stored in atendimento
        setLeilaoFormData((caseItem as any).leilaoExtra || {});
        setUploadedDocs((caseItem as any).documentosAnexos || []);
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

    const handleDocFileDrop = (files: FileList | null) => {
        if (!files) return;
        const newDocs = Array.from(files).map(f => ({
            name: f.name,
            url: URL.createObjectURL(f),
            size: f.size,
            type: f.type,
            uploadedAt: new Date().toISOString(),
        }));
        setUploadedDocs(prev => [...prev, ...newDocs]);
        toast.success(`${newDocs.length} documento(s) adicionado(s)`);
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
                                className="pl-10 h-10 rounded-full border-slate-200 bg-white"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className={`rounded-full shadow-sm hover:shadow-md transition-all ${!showEmptyColumns ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white text-slate-400'}`}
                            onClick={() => {
                                const nextValue = !showEmptyColumns;
                                setShowEmptyColumns(nextValue);
                                localStorage.setItem('kanban-show-empty-leilao', String(nextValue));
                                toast.info(nextValue ? 'Mostrando todas as colunas' : 'Ocultando colunas vazias');
                            }}
                            title={showEmptyColumns ? "Ocultar colunas vazias" : "Mostrar todas as colunas"}
                        >
                            {showEmptyColumns ? <LayoutGrid className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full bg-white shadow-sm hover:shadow-md transition-all"
                            onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}
                        >
                            <Palette className="w-4 h-4" />
                        </Button>
                        <Button className="h-10 rounded-full bg-amber-600 hover:bg-amber-700 text-white gap-2 px-6">
                            <Plus className="w-4 h-4" />
                            Novo Processo
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
                                        className={`group relative h-16 rounded-xl overflow-hidden border-2 transition-all ${kanbanBackground === bg.value ? 'border-amber-500 scale-95' : 'border-slate-100 hover:border-slate-200'}`}
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
                                {LEILAO_COLUMNS.filter(column => {
                                    if (showEmptyColumns) return true;
                                    const hasCards = cases.some(c => c.faseAtual === column.id);
                                    return hasCards;
                                }).map((column) => (
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
                                                    className={`flex-1 px-3 pb-4 overflow-y-auto no-scrollbar transition-colors ${snapshot.isDraggingOver ? 'bg-amber-50/30' : ''}`}
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
                                                                            className={`group relative p-4 bg-white border-slate-200 hover:border-amber-300 hover:shadow-xl transition-all cursor-pointer rounded-2xl ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-amber-500 scale-105 rotate-2' : ''}`}
                                                                        >
                                                                            <div className="mb-3">
                                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-between">
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Hash className="w-3 h-3" />
                                                                                        {caseItem.pastaInterna}
                                                                                    </span>
                                                                                    <span className={`px-2 py-0.5 rounded-full text-white ${caseItem.diasNaFase > 10 ? 'bg-orange-500' : 'bg-amber-500'}`}>
                                                                                        {caseItem.diasNaFase} {caseItem.diasNaFase === 1 ? 'dia' : 'dias'}
                                                                                    </span>
                                                                                </div>
                                                                                <h4 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-amber-600 transition-colors">
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
                                                                                {caseItem.bloqueioLicitacao && (
                                                                                    <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center text-amber-600" title="Pendente Licitação">
                                                                                        <Gavel className="w-3.5 h-3.5" />
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
                                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 rounded-full px-2 py-0 text-[10px] font-bold uppercase tracking-tight">
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

                                    <TabsContent value="dados" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {/* Helper to render labeled input */}
                                        {(() => {
                                            const F = ({ label, field, type = 'text' }: { label: string; field: string; type?: string }) => (
                                                <div>
                                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">{label}</Label>
                                                    <Input
                                                        type={type}
                                                        value={leilaoFormData[field] || ''}
                                                        onChange={e => setLeilaoFormData(p => ({ ...p, [field]: e.target.value }))}
                                                        className="h-9 text-sm bg-slate-50 border-slate-200 rounded-lg"
                                                    />
                                                </div>
                                            );
                                            const S = ({ label, field, options }: { label: string; field: string; options: string[] }) => (
                                                <div>
                                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">{label}</Label>
                                                    <select
                                                        value={leilaoFormData[field] || ''}
                                                        onChange={e => setLeilaoFormData(p => ({ ...p, [field]: e.target.value }))}
                                                        className="w-full h-9 text-sm bg-slate-50 border border-slate-200 rounded-lg px-2"
                                                    >
                                                        <option value="">—</option>
                                                        {options.map(o => <option key={o} value={o}>{o}</option>)}
                                                    </select>
                                                </div>
                                            );

                                            return (
                                                <div className="space-y-6">
                                                    {/* 🟦 Identificação da Proposta */}
                                                    <Card className="p-5 border-slate-100 shadow-sm rounded-2xl">
                                                        <h3 className="text-sm font-bold text-amber-700 mb-4 flex items-center gap-2"><Hash className="w-4 h-4" /> Identificação da Proposta / Oportunidade</h3>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                            <F label="Nº da Proposta / ID" field="numeroProposta" />
                                                            <S label="Modalidade da Oferta" field="modalidadeOferta" options={['Lance Viva Voz', 'Lance Online', 'Primeiro Licitante', 'Proposta Fechada']} />
                                                            <S label="Status da Proposta" field="statusProposta" options={['Em aberto', 'Aprovada', 'Reprovada', 'Em análise', 'Arrematado', 'Cancelado']} />
                                                            <F label="Data da Proposta" field="dataProposta" type="date" />
                                                        </div>
                                                    </Card>

                                                    {/* 🟦 Dados do Cliente */}
                                                    <Card className="p-5 border-slate-100 shadow-sm rounded-2xl">
                                                        <h3 className="text-sm font-bold text-blue-700 mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> Dados do Cliente</h3>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                            <div className="md:col-span-2"><F label="Nome Completo" field="clienteNome" /></div>
                                                            <F label="CPF / CNPJ" field="clienteCpfCnpj" />
                                                            <F label="Telefone" field="clienteTelefone" />
                                                            <div className="md:col-span-2"><F label="E-mail" field="clienteEmail" /></div>
                                                        </div>
                                                    </Card>

                                                    {/* 🟦 Endereço do Imóvel */}
                                                    <Card className="p-5 border-slate-100 shadow-sm rounded-2xl">
                                                        <h3 className="text-sm font-bold text-emerald-700 mb-4 flex items-center gap-2"><Home className="w-4 h-4" /> Endereço do Imóvel</h3>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                            <div className="md:col-span-2"><F label="Logradouro" field="endLogradouro" /></div>
                                                            <F label="Número" field="endNumero" />
                                                            <F label="Complemento" field="endComplemento" />
                                                            <F label="Bairro" field="endBairro" />
                                                            <F label="Cidade" field="endCidade" />
                                                            <F label="Estado" field="endEstado" />
                                                            <div className="md:col-span-2"><F label="Endereço Completo" field="endCompleto" /></div>
                                                        </div>
                                                    </Card>

                                                    {/* 🟦 Dados Financeiros da Proposta */}
                                                    <Card className="p-5 border-slate-100 shadow-sm rounded-2xl">
                                                        <h3 className="text-sm font-bold text-green-700 mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Dados Financeiros da Proposta</h3>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                            <F label="Valor de Avaliação" field="finValorAvaliacao" />
                                                            <F label="Valor da Proposta" field="finValorProposta" />
                                                            <F label="Valor Recursos Próprios" field="finRecursosProprios" />
                                                            <F label="Validade do Boleto" field="finValidadeBoleto" type="date" />
                                                            <S label="Forma de Pagamento" field="finFormaPagamento" options={['À Vista', 'Financiamento CEF', 'Financiamento BB', 'Consórcio', 'FGTS', 'Parcelamento direto']} />
                                                        </div>
                                                    </Card>

                                                    {/* 🟦 Dados Registrais do Imóvel */}
                                                    <Card className="p-5 border-slate-100 shadow-sm rounded-2xl">
                                                        <h3 className="text-sm font-bold text-violet-700 mb-4 flex items-center gap-2"><FileCheck className="w-4 h-4" /> Dados Registrais do Imóvel</h3>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                            <F label="Nº da Matrícula" field="regMatricula" />
                                                            <div className="md:col-span-2"><F label="Cartório / Circunscrição" field="regCartorio" /></div>
                                                            <F label="Inscrição Imobiliária" field="regInscricao" />
                                                            <S label="Status da Averbação" field="regStatusAverbacao" options={['Pendente', 'Solicitada', 'Concluída', 'Com restrições']} />
                                                        </div>
                                                    </Card>

                                                    {/* 🟦 Dados do Leiloeiro */}
                                                    <Card className="p-5 border-slate-100 shadow-sm rounded-2xl">
                                                        <h3 className="text-sm font-bold text-amber-700 mb-4 flex items-center gap-2"><Gavel className="w-4 h-4" /> Dados do Leiloeiro</h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <F label="Nome do Leiloeiro" field="leiloeiroNome" />
                                                            <F label="Telefone do Leiloeiro" field="leiloeiroTelefone" />
                                                            <F label="E-mail do Leiloeiro" field="leiloeiroEmail" />
                                                        </div>
                                                    </Card>

                                                    {/* 🟦 Dados da Intermediação */}
                                                    <Card className="p-5 border-slate-100 shadow-sm rounded-2xl">
                                                        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Dados da Intermediação</h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <S label="Tipo de Serviço Prestado" field="intermediacaoTipo" options={['Intermediação', 'Assessoramento', 'Consultoria', 'Representação']} />
                                                            <div>
                                                                <Label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Observações</Label>
                                                                <Textarea
                                                                    value={leilaoFormData['intermediacaoObs'] || ''}
                                                                    onChange={e => setLeilaoFormData(p => ({ ...p, intermediacaoObs: e.target.value }))}
                                                                    className="min-h-[80px] bg-slate-50 border-slate-200 rounded-lg text-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                    </Card>

                                                    <div className="flex justify-end">
                                                        <Button
                                                            onClick={handleSaveLeilaoData}
                                                            disabled={isSavingLeilao}
                                                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-8 font-bold shadow-lg shadow-amber-200"
                                                        >
                                                            {isSavingLeilao ? 'Salvando...' : 'Salvar Dados'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </TabsContent>

                                    {/* Documentos Tab - Drag & Drop */}
                                    <TabsContent value="documentos" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div
                                            onDragOver={e => { e.preventDefault(); setIsDraggingDoc(true); }}
                                            onDragLeave={() => setIsDraggingDoc(false)}
                                            onDrop={e => {
                                                e.preventDefault();
                                                setIsDraggingDoc(false);
                                                handleDocFileDrop(e.dataTransfer.files);
                                            }}
                                            onClick={() => docInputRef.current?.click()}
                                            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all mb-6 ${
                                                isDraggingDoc
                                                    ? 'border-amber-400 bg-amber-50 scale-[1.01]'
                                                    : 'border-slate-200 bg-slate-50 hover:border-amber-300 hover:bg-amber-50/50'
                                            }`}
                                        >
                                            <Upload className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                                            <p className="text-sm font-semibold text-slate-600">Arraste documentos aqui ou clique para selecionar</p>
                                            <p className="text-xs text-slate-400 mt-1">PDF, Word, Excel, imagens — qualquer formato aceito</p>
                                            <input
                                                ref={docInputRef}
                                                type="file"
                                                multiple
                                                className="hidden"
                                                onChange={e => handleDocFileDrop(e.target.files)}
                                            />
                                        </div>

                                        {uploadedDocs.length === 0 ? (
                                            <p className="text-sm text-slate-400 text-center italic">Nenhum documento anexado ainda.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {uploadedDocs.map((doc, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                                                                <File className="w-4 h-4 text-amber-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-800">{doc.name}</p>
                                                                <p className="text-[10px] text-slate-400">{(doc.size / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <a href={doc.url} download={doc.name} onClick={e => e.stopPropagation()}>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-amber-600">
                                                                    <Download className="w-4 h-4" />
                                                                </Button>
                                                            </a>
                                                            <Button
                                                                variant="ghost" size="icon"
                                                                className="h-8 w-8 text-slate-400 hover:text-red-500"
                                                                onClick={() => setUploadedDocs(prev => prev.filter((_, idx) => idx !== i))}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* Remaining tabs pattern same as Vendas */}
                                </Tabs>
                            </div>
                        </ScrollArea>

                        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                            <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-2 rounded-xl">
                                <Trash2 className="w-4 h-4" /> Cancelar Lote
                            </Button>
                            <div className="flex gap-3">
                                <Button variant="outline" className="rounded-xl px-6" onClick={() => setShowDetailsModal(false)}>Fechar</Button>
                                <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-8 font-bold shadow-lg shadow-amber-200">
                                    Salvar Alterações
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
