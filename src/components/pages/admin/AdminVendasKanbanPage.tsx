import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import SalesNavigation from '../../SalesNavigation';
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
import { ContractWizard } from '@/components/admin/contracts/ContractWizard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AdminLayout from '@/components/layouts/AdminLayout';
import { BaseCrudService } from '@/integrations';
import { CopyButton } from '@/components/ui/CopyButton';
import { ServiceRecords, UsuriosdoSistema, PendnciasdoFinanciamento, FinancingTasks, ServiceParties, Clients, DocumentosdoFinanciamento, HistricodeInteraes, Imveis, AtendimentoImveis, ChecklistdosProponentes } from '@/entities';
import { formatCurrency, parseCurrency, formatCPF } from '@/lib/input-masks';

// Types and Interfaces adapted for Vendas
interface VendasCase {
    _id: string;
    agencia?: string;
    proponentePrincipal: string;
    cpfProponentePrincipal?: string;
    pastaInterna?: string;
    status: string;
    faseAtual: string; // Maps to 'status' field in DB for Vendas
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
    bloqueioRestricao?: boolean;

    // Data fields
    propertyValue?: number;
    notes?: string;

    // Interlinks for cross-board visibility
    interlinks?: {
        hasProperty: boolean;
        activeSales: number;
        activeRentals: number;
        activeFinancing: number;
        activeAuctions: number;
        relatedServices: { _id: string; serviceType: string; contactName: string; pastaInterna: string; status: string }[];
    };
}

const VENDAS_COLUMNS = [
    { id: 'Novos', name: 'Novos', color: 'bg-blue-100 border-blue-300', bgColor: 'bg-blue-100', borderColor: 'border-blue-300' },
    { id: 'Em andamento', name: 'Em andamento', color: 'bg-purple-100 border-purple-300', bgColor: 'bg-purple-100', borderColor: 'border-purple-300' },
    { id: 'Pausados', name: 'Pausados', color: 'bg-orange-100 border-orange-300', bgColor: 'bg-orange-100', borderColor: 'border-orange-300' },
    { id: 'Suspensos', name: 'Suspensos', color: 'bg-red-100 border-red-300', bgColor: 'bg-red-100', borderColor: 'border-red-300' },
    { id: 'Concluído', name: 'Concluído', color: 'bg-green-100 border-green-300', bgColor: 'bg-green-100', borderColor: 'border-green-300' },
];

const BACKGROUND_OPTIONS = [
    { id: 'default', name: 'Padrão Claro', value: 'bg-slate-50', preview: '#F8FAFC' },
    { id: 'dark', name: 'Escuro', value: 'bg-slate-900', preview: '#0F172A' },
    { id: 'blue', name: 'Azul Suave', value: 'bg-blue-50', preview: '#EFF6FF' },
    { id: 'gradient-blue', name: 'Gradiente Azul', value: 'bg-gradient-to-br from-blue-50 to-indigo-100', preview: 'linear-gradient(135deg, #eff6ff, #e0e7ff)' },
    { id: 'image-office', name: 'Escritório', value: 'bg-[url(https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920)] bg-cover bg-center', preview: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400' },
];

export default function AdminVendasKanbanPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation() as any;
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const scrollbarRef = useRef<HTMLDivElement>(null);
    const scrollbarThumbRef = useRef<HTMLDivElement>(null);

    const [cases, setCases] = useState<VendasCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCase, setSelectedCase] = useState<VendasCase | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [modalTab, setModalTab] = useState('dados');
    const [searchTerm, setSearchTerm] = useState('');
    const [kanbanBackground, setKanbanBackground] = useState('bg-slate-50');
    const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
    const [showEmptyColumns, setShowEmptyColumns] = useState(true);
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    // Mini loaders and states
    const [clients, setClients] = useState<Clients[]>([]);
    const [users, setUsers] = useState<UsuriosdoSistema[]>([]);
    const [atendimentosRaw, setAtendimentosRaw] = useState<ServiceRecords[]>([]);
    
    // Document Upload States
    const [uploadedDocs, setUploadedDocs] = useState<{ name: string; url: string; size: number; type: string; uploadedAt: string }[]>([]);
    const [isDraggingDoc, setIsDraggingDoc] = useState(false);
    const [isSavingVenda, setIsSavingVenda] = useState(false);
    const docInputRef = useRef<HTMLInputElement>(null);

    // Linked card preview state
    type RelatedService = { _id: string; serviceType: string; contactName: string; pastaInterna: string; status: string };
    const [previewRelatedCard, setPreviewRelatedCard] = useState<RelatedService | null>(null);

    // Quick action modals for card
    const [showQuickTaskModal, setShowQuickTaskModal] = useState(false);
    const [showQuickPendingModal, setShowQuickPendingModal] = useState(false);
    const [quickActionCaseId, setQuickActionCaseId] = useState<string | null>(null);

    const [newTaskData, setNewTaskData] = useState({
        description: '',
        internalResponsibleId: '',
        dueDate: '',
        externalResponsibleName: '',
        responsibleType: 'Interno' as 'Interno' | 'Externo'
    });

    const [newPendingData, setNewPendingData] = useState({
        description: '',
        responsiblePartyType: 'Interno' as 'Interno' | 'Cliente',
        averageDaysToComplete: 7
    });

    // Derived state for filtered users
    const vendasTeam = users.filter(u => (u.setores?.includes('Vendas') || u.setores?.includes('Venda')) && u.ativo !== false);

    const handleCreateQuickTask = async () => {
        if (!quickActionCaseId || !newTaskData.description) return;

        try {
            const now = new Date().toISOString();
            const dueDate = newTaskData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

            const newTask: FinancingTasks = {
                _id: crypto.randomUUID(),
                atendimentoRef: quickActionCaseId,
                titulo: newTaskData.description.substring(0, 100),
                description: newTaskData.description,
                status: 'A Fazer',
                responsibleType: 'Equipe Vendas',
                responsavelExternoRef: newTaskData.internalResponsibleId,
                dueDate,
                creationDate: now
            };

            await BaseCrudService.create('tarefasfinanciamento', newTask);

            // Create history entry
            await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
                _id: crypto.randomUUID(),
                atendimentoRef: quickActionCaseId,
                tipoEvento: 'Tarefa_Criada',
                interactionType: 'Criação de tarefa',
                interactionDescription: `Nova tarefa criada: "${newTask.titulo}"`,
                interactionDate: now,
                autorTipo: 'Sistema'
            });

            // Reset and close
            setNewTaskData({
                description: '',
                internalResponsibleId: '',
                dueDate: '',
                externalResponsibleName: '',
                responsibleType: 'Interno'
            });
            setShowQuickTaskModal(false);
            setQuickActionCaseId(null);

            toast.success('Tarefa criada com sucesso!');
            loadData();
        } catch (error) {
            console.error('Error creating quick task:', error);
            toast.error('Erro ao criar tarefa');
        }
    };

    const handleCreateQuickPending = async () => {
        if (!quickActionCaseId || !newPendingData.description) return;

        try {
            const now = new Date().toISOString();
            const dueDate = new Date(Date.now() + (newPendingData.averageDaysToComplete || 7) * 24 * 60 * 60 * 1000).toISOString();

            const newPending: PendnciasdoFinanciamento = {
                _id: crypto.randomUUID(),
                atendimentoRef: quickActionCaseId,
                title: newPendingData.description.substring(0, 100),
                description: newPendingData.description,
                status: 'Pendente',
                priority: 'Média',
                dueDate,
                responsiblePartyType: newPendingData.responsiblePartyType,
                responsiblePartyDetails: '',
                taskAutomaticallyCreated: false,
                creationDate: now,
                bloqueiaFase: false,
                categoria: ''
            };

            await BaseCrudService.create('pendenciasfinanciamento', newPending);

            // Create history entry
            await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
                _id: crypto.randomUUID(),
                atendimentoRef: quickActionCaseId,
                tipoEvento: 'Pendencia_Criada',
                interactionType: 'Criação de pendência',
                interactionDescription: `Nova pendência criada: "${newPending.title}"`,
                interactionDate: now,
                autorTipo: 'Sistema'
            });

            // Reset and close
            setNewPendingData({
                description: '',
                responsiblePartyType: 'Interno',
                averageDaysToComplete: 7
            });
            setShowQuickPendingModal(false);
            setQuickActionCaseId(null);

            toast.success('Pendência criada com sucesso!');
            loadData();
        } catch (error) {
            console.error('Error creating quick pending:', error);
            toast.error('Erro ao criar pendência');
        }
    };

    useEffect(() => {
        loadData();
        const storedBg = localStorage.getItem('kanban-background-vendas');
        if (storedBg) setKanbanBackground(storedBg);
        
        const storedShowEmpty = localStorage.getItem('kanban-show-empty-vendas');
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
            setAtendimentosRaw(atendimentos);
            const { items: pendingsList } = await BaseCrudService.getAll<PendnciasdoFinanciamento>('pendenciasfinanciamento');
            const { items: tasksList } = await BaseCrudService.getAll<FinancingTasks>('tarefasfinanciamento');
            const { items: partiesList } = await BaseCrudService.getAll<ServiceParties>('atendimentopartes');
            const { items: propertiesList } = await BaseCrudService.getAll<Imveis>('imoveis');
            const { items: propertyLinks } = await BaseCrudService.getAll<AtendimentoImveis>('atendimentoimoveis');

            const filteredAtendimentos = atendimentos
                .filter(a => ['Venda', 'Compra'].includes(a.serviceType || '') && !a.isArchived)
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
                    status: a.status || 'Novos',
                    faseAtual: a.status || 'Novos',
                    serviceType: a.serviceType || 'Venda',
                    contactPhone: a.contactPhone || client?.phoneNumber || '',
                    contactEmail: a.contactEmail || client?.email || '',
                    diasNaFase,
                    pendenciasAbertas: casePendings.length,
                    tarefasAbertas: caseTasks.length,
                    pendenciasResumo: casePendings.slice(0, 2).map(p => p.title || (p as any).description || 'Pendência'),
                    tarefasResumo: caseTasks.slice(0, 2).map(t => t.titulo || (t as any).description || 'Tarefa'),
                    bloqueioDocumento: casePendings.some(p => p.categoria === 'Documento'),
                    bloqueioCliente: casePendings.some(p => p.categoria === 'Cliente'),
                    propertyValue: (a as any).propertyValue || 0,
                    notes: a.notes || '',
                    interlinks
                };
            });

            setCases(filteredCases);
        } catch (error) {
            console.error('Error loading Vendas Kanban data:', error);
            toast.error('Erro ao carregar dados do Kanban');
        } finally {
            setLoading(false);
        }
    };

    // Scroll Acceleration Logic (Ported from Financing)
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        // Custom horizontal scrollbar sync
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

    // Continuous Mouse Drag Scroll
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
            const walk = (x - startX) * 3; // Acceleration 3x
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

    // Wheel to Horizontal Scroll
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                container.scrollLeft += e.deltaY * 2; // Acceleration 2x
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
                toast.success('Negócio movido com sucesso');
            } catch (error) {
                console.error('Error moving case:', error);
                toast.error('Erro ao mover negócio');
                loadData();
            }
        }
    };

    const handleChangeBackground = (bg: string) => {
        setKanbanBackground(bg);
        localStorage.setItem('kanban-background-vendas', bg);
        setShowBackgroundPicker(false);
    };

    const handleOpenDetails = (caseItem: VendasCase) => {
        setSelectedCase(caseItem);
        setUploadedDocs((caseItem as any).documentosAnexos || []);
        setShowDetailsModal(true);
    };

    const handleSaveVendaData = async () => {
        if (!selectedCase) return;
        setIsSavingVenda(true);
        try {
            await BaseCrudService.update('atendimentos', {
                _id: selectedCase._id,
                documentosAnexos: uploadedDocs,
            });
            toast.success('Dados salvos com sucesso!');
        } catch {
            toast.error('Erro ao salvar dados.');
        } finally {
            setIsSavingVenda(false);
        }
    };

    const handleDocFileDrop = async (files: FileList | null) => {
        if (!files || !selectedCase) return;
        
        try {
            const uploadPromises = Array.from(files).map(async (f) => {
                const docId = crypto.randomUUID();
                const newDoc = {
                    _id: docId,
                    documentName: f.name,
                    atendimentoRef: selectedCase._id,
                    uploadDate: new Date().toISOString(),
                    documentUrl: URL.createObjectURL(f), // In a real app, this would be the bucket URL
                    documentStatus: 'Enviado',
                    description: 'Enviado via Drag & Drop'
                };
                
                await BaseCrudService.create('documentosfinanciamento', newDoc);
                return {
                    name: f.name,
                    url: newDoc.documentUrl,
                    size: f.size,
                    type: f.type,
                    uploadedAt: newDoc.uploadDate,
                };
            });

            const newDocs = await Promise.all(uploadPromises);
            setUploadedDocs(prev => [...prev, ...newDocs]);
            toast.success(`${newDocs.length} documento(s) salvo(s) com sucesso`);
        } catch (error) {
            console.error("Erro ao salvar documentos:", error);
            toast.error("Erro ao salvar um ou mais documentos no banco de dados.");
        }
    };

    const handleConcluirProcesso = async () => {
        if (!selectedCase) return;
        setIsSavingVenda(true);
        try {
            await BaseCrudService.update('atendimentos', {
                _id: selectedCase._id,
                status: 'Concluído',
                faseAtual: 'Concluído',
                isArchived: false, // Ensure it's not archived so it stays in the concluded column
            });
            toast.success('Processo concluído com sucesso!');
            setShowDetailsModal(false);
            loadData();
        } catch {
            toast.error('Erro ao concluir processo.');
        } finally {
            setIsSavingVenda(false);
        }
    };

    const handleMoveCase = async (caseId: string, newStatus: string) => {
        const caseItem = cases.find(c => c._id === caseId);
        if (!caseItem || caseItem.status === newStatus) return;

        // Optimistic update
        setCases(prev => prev.map(c => c._id === caseId ? { ...c, status: newStatus, faseAtual: newStatus } : c));

        try {
            await BaseCrudService.update('atendimentos', { _id: caseId, status: newStatus });
            toast.success(`Fase alterada para ${newStatus}`);
        } catch (error) {
            console.error('Error moving case:', error);
            toast.error('Erro ao mover processo');
            loadData();
        }
    };

    const handleQuickStatusChange = async (newStatus: string) => {
        if (!selectedCase) return;
        
        const previousStatus = selectedCase.status;
        if (previousStatus === newStatus) return;

        setIsSavingVenda(true);
        // Optimistic update locally
        const updatedCases = cases.map(c => 
            c._id === selectedCase._id ? { ...c, status: newStatus, faseAtual: newStatus } : c
        );
        setCases(updatedCases);
        setSelectedCase({ ...selectedCase, status: newStatus, faseAtual: newStatus } as any);

        try {
            await BaseCrudService.update('atendimentos', { _id: selectedCase._id, status: newStatus });
            toast.success(`Fase alterada para ${newStatus}`);
        } catch (error) {
            console.error('Error changing status:', error);
            toast.error('Erro ao mudar fase');
            loadData(); // Revert on error
        } finally {
            setIsSavingVenda(false);
        }
    };

    return (
        <AdminLayout>
            <SalesNavigation />
            <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-slate-50/50">
                {/* Header */}
                <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-20">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                            Kanban de Vendas
                        </h1>
                        <p className="text-slate-500 text-sm">Controle sua esteira de vendas e compras</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por nome, pasta ou CPF..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-10 rounded-full border-slate-200 bg-white"
                            />
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            className={`rounded-full shadow-sm hover:shadow-md transition-all ${!showEmptyColumns ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white text-slate-400'}`}
                            onClick={() => {
                                const nextValue = !showEmptyColumns;
                                setShowEmptyColumns(nextValue);
                                localStorage.setItem('kanban-show-empty-vendas', String(nextValue));
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

                        <Button className="h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white gap-2 px-6">
                            <Plus className="w-4 h-4" />
                            Novo Negócio
                        </Button>
                    </div>
                </div>

                {/* Background Picker Popover */}
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
                                        className={`group relative h-16 rounded-xl overflow-hidden border-2 transition-all ${kanbanBackground === bg.value ? 'border-blue-500 scale-95' : 'border-slate-100 hover:border-slate-200'}`}
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

                {/* Kanban Board Container */}
                <div className="flex-1 relative overflow-hidden group/board">
                    {/* Custom Scrollbar */}
                    <div ref={scrollbarRef} className="absolute bottom-4 left-6 right-6 h-2 bg-slate-900/10 rounded-full z-30 opacity-0 group-hover/board:opacity-100 transition-opacity">
                        <div ref={scrollbarThumbRef} className="h-full bg-slate-900/40 rounded-full cursor-grab active:cursor-grabbing hover:bg-slate-900/60 transition-colors" />
                    </div>

                    <div
                        ref={scrollContainerRef}
                        className="h-full overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing no-scrollbar scroll-smooth"
                    >
                        <DragDropContext onDragEnd={onDragEnd}>
                            <div className="flex h-full p-6 gap-6 min-w-max">
                                {VENDAS_COLUMNS.filter(column => {
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
                                                    className={`flex-1 px-3 pb-4 overflow-y-auto no-scrollbar transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/30' : ''}`}
                                                >
                                                    <div className="flex flex-col gap-3">
                                                        {cases
                                                            .filter(c => c.faseAtual === column.id)
                                                            .filter(c =>
                                                                c.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                                c.pastaInterna?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                                c.cpfProponentePrincipal?.includes(searchTerm)
                                                            )
                                                            .map((caseItem, index) => (
                                                                <Draggable key={caseItem._id} draggableId={caseItem._id} index={index}>
                                                                    {(provided, snapshot) => (
                                                                        <Card
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            {...provided.dragHandleProps}
                                                                            onClick={() => handleOpenDetails(caseItem)}
                                                                            className={`group relative p-4 bg-white border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all cursor-pointer rounded-2xl ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-blue-500 scale-105 rotate-2' : ''}`}
                                                                        >
                                                                            {/* Card Content (Standardized) */}
                                                                            <div className="mb-3">
                                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-between">
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Hash className="w-3 h-3" />
                                                                                        {caseItem.pastaInterna}
                                                                                    </span>
                                                                                    <span className={`px-2 py-0.5 rounded-full text-white ${caseItem.diasNaFase > 15 ? 'bg-red-500' : 'bg-blue-500'}`}>
                                                                                        {caseItem.diasNaFase} {caseItem.diasNaFase === 1 ? 'dia' : 'dias'}
                                                                                    </span>
                                                                                </div>
                                                                                <h4 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-blue-600 transition-colors">
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

                                                                            {/* Quick Action Buttons */}
                                                                            <div className="flex flex-wrap gap-2 mb-3">
                                                                                <button 
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setQuickActionCaseId(caseItem._id);
                                                                                        setShowQuickPendingModal(true);
                                                                                    }}
                                                                                    className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-colors border border-red-100/50"
                                                                                >
                                                                                    <Plus className="w-2.5 h-2.5" />
                                                                                    Pend. {caseItem.pendenciasAbertas > 0 && `(${caseItem.pendenciasAbertas})`}
                                                                                </button>
                                                                                <button 
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setQuickActionCaseId(caseItem._id);
                                                                                        setShowQuickTaskModal(true);
                                                                                    }}
                                                                                    className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-bold hover:bg-amber-100 transition-colors border border-amber-100/50"
                                                                                >
                                                                                    <Plus className="w-2.5 h-2.5" />
                                                                                    Tarefa {caseItem.tarefasAbertas > 0 && `(${caseItem.tarefasAbertas})`}
                                                                                </button>
                                                                            </div>

                                                                             {/* Blocking Icons */}
                                                                             <div className="flex items-center justify-end mb-3">
                                                                                 <div className="flex gap-1.5">
                                                                                     {caseItem.bloqueioDocumento && (
                                                                                         <div className="w-6 h-6 rounded bg-red-100 flex items-center justify-center text-red-600" title="Pendência de Documento">
                                                                                             <FileText className="w-3.5 h-3.5" />
                                                                                         </div>
                                                                                     )}
                                                                                     {caseItem.bloqueioCliente && (
                                                                                         <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center text-amber-600" title="Pendência de Cliente">
                                                                                             <Users className="w-3.5 h-3.5" />
                                                                                         </div>
                                                                                     )}
                                                                                 </div>
                                                                             </div>
                                                                            {/* Action Row: MOVER */}
                                                                             <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-3">
                                                                                 <Badge variant="secondary" className="bg-slate-50 text-slate-500 text-[10px] font-normal px-2">
                                                                                     {caseItem.serviceType}
                                                                                 </Badge>
                                                                                 
                                                                                 <Select value={caseItem.faseAtual} onValueChange={(value) => handleMoveCase(caseItem._id, value)}>
                                                                                  <SelectTrigger 
                                                                                         className="px-2 py-1 w-auto min-w-[60px] h-7 bg-blue-100 text-blue-700 border-none rounded text-[10px] font-bold hover:bg-blue-200 transition-colors flex items-center justify-center gap-1 focus:ring-0 focus:ring-offset-0"
                                                                                         onClick={(e) => e.stopPropagation()}
                                                                                     >
                                                                                         <span>MOVER</span>
                                                                                     </SelectTrigger>
                                                                                     <SelectContent>
                                                                                         {VENDAS_COLUMNS.map(col => (
                                                                                             <SelectItem key={col.id} value={col.id}>
                                                                                                 {col.name}
                                                                                             </SelectItem>
                                                                                         ))}
                                                                                     </SelectContent>
                                                                                 </Select>
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
                    <DialogContent className="max-w-6xl h-[90vh] max-h-[90vh] p-0 overflow-hidden rounded-3xl flex flex-col bg-white">
                        <DialogHeader className="px-8 py-6 border-b border-slate-100 bg-white sticky top-0 z-50 flex flex-row items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">
                                                Vendas — {selectedCase?.contactName}
                                            </DialogTitle>
                                            <Select 
                                                value={selectedCase?.status || ''} 
                                                onValueChange={(val) => handleMoveCase(selectedCase?._id || '', val)}
                                            >
                                                <SelectTrigger className="h-7 text-[10px] font-black uppercase tracking-widest border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-full px-4 w-auto min-w-[160px] transition-all focus:ring-0">
                                                    <SelectValue placeholder="Mover Processo" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {VENDAS_COLUMNS.map((col) => (
                                                        <SelectItem key={col.id} value={col.id} className="text-[10px] font-bold uppercase tracking-wider">
                                                            {col.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <span className="text-[11px] font-bold text-slate-300 tracking-wider">• {selectedCase?.pastaInterna}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2 items-center">
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pasta: {selectedCase?.pastaInterna}</span>
                                            </div>
                                            {selectedCase?.interlinks?.relatedServices && selectedCase.interlinks.relatedServices.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mr-1">Vínculos:</span>
                                                    {selectedCase.interlinks.relatedServices.map(rel => {
                                                        const routeMap: Record<string, string> = {
                                                            'Venda': '/admin/negocios/kanban',
                                                            'Compra': '/admin/negocios/kanban',
                                                            'Locação': '/admin/locacoes/kanban',
                                                            'Aluguel': '/admin/locacoes/kanban',
                                                            'Financiamento': '/admin/financiamento-kanban',
                                                            'Crédito': '/admin/financiamento-kanban',
                                                            'Leilão': '/admin/leilao/kanban'
                                                        };
                                                        const colorMap: Record<string, string> = {
                                                            'Venda': 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100',
                                                            'Locação': 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100',
                                                            'Financiamento': 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100',
                                                            'Leilão': 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                                                        };
                                                        const route = routeMap[rel.serviceType.split(' ')[0]];
                                                        if (!route) return null;
                                                        return (
                                                            <button 
                                                                key={rel._id} 
                                                                onClick={() => navigate(`${route}?openCard=${rel._id}`)} 
                                                                className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-tighter transition-all ${colorMap[rel.serviceType.split(' ')[0]] || 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}`}
                                                            >
                                                                {rel.serviceType}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                {selectedCase?.contactPhone && (
                                    <Button 
                                        variant="outline" 
                                        className="h-10 px-5 rounded-xl bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 transition-all font-bold text-xs" 
                                        onClick={() => {
                                            const phone = selectedCase.contactPhone?.replace(/\D/g, '');
                                            window.open(`https://wa.me/55${phone}`, '_blank');
                                        }}
                                    >
                                        <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp
                                    </Button>
                                )}
                                <Button 
                                    onClick={handleSaveVendaData} 
                                    className="h-10 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-200 transition-all"
                                >
                                    <Save className="w-4 h-4 mr-2" /> Salvar
                                </Button>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100" onClick={() => setShowDetailsModal(false)}>
                                    <X className="w-5 h-5 text-slate-400" />
                                </Button>
                            </div>
                        </DialogHeader>

                        <Tabs value={modalTab} onValueChange={setModalTab} className="flex-1 flex flex-col min-h-0 w-full">
                            <TabsList className="grid grid-cols-7 mb-6 bg-slate-100/50 p-1 rounded-2xl h-12 flex-shrink-0 mx-8 mt-6">
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
                                            <Home className="w-4 h-4" /> Imóveis
                                        </TabsTrigger>
                                        <TabsTrigger value="historico" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs gap-2">
                                            <History className="w-4 h-4" /> Histórico
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="dados" className="flex-1 overflow-y-auto min-h-0 w-full px-8 pb-8 focus-visible:outline-none mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <Card className="p-6 border-slate-100 shadow-sm rounded-2xl">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                        <Info className="w-4 h-4 text-blue-500" />
                                                        Informações Básicas
                                                    </h3>
                                                    <CopyButton value={`Cliente: ${selectedCase?.contactName}\nCPF: ${selectedCase?.cpfProponentePrincipal ? formatCPF(selectedCase.cpfProponentePrincipal) : ''}\nPasta: ${selectedCase?.pastaInterna}`} className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200" />
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <Label className="text-[10px] text-slate-400 uppercase tracking-wider">Nome Principal</Label>
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
                                                            <Label className="text-[10px] text-slate-400 uppercase tracking-wider">Pasta Interna</Label>
                                                            <p className="text-sm font-medium text-slate-900">{selectedCase?.pastaInterna}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>

                                            <Card className="p-6 border-slate-100 shadow-sm rounded-2xl">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                        <DollarSign className="w-4 h-4 text-green-500" />
                                                        Valores do Negócio
                                                    </h3>
                                                    <CopyButton value={`Valor: ${formatCurrency(selectedCase?.propertyValue || 0)}\nServiço: ${selectedCase?.serviceType}`} className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200" />
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <Label className="text-[10px] text-slate-400 uppercase tracking-wider">Valor do Imóvel</Label>
                                                        <p className="text-lg font-bold text-slate-900">{formatCurrency(selectedCase?.propertyValue || 0)}</p>
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px] text-slate-400 uppercase tracking-wider">Tipo de Serviço</Label>
                                                        <div className="flex items-center justify-between">
                                                            <Badge className="mt-1 bg-slate-100 text-slate-700 hover:bg-slate-200 border-none">{selectedCase?.serviceType}</Badge>
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
                                                    <Wrench className="w-4 h-4 text-amber-500" />
                                                    Observações Internas
                                                </h3>
                                                <div className="space-y-4">
                                                    <Textarea
                                                        className="min-h-[120px] bg-slate-50 border-none rounded-xl text-sm italic"
                                                        value={selectedCase?.notes || ''}
                                                        placeholder="Nenhuma observação registrada."
                                                        readOnly
                                                    />
                                                </div>
                                            </Card>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="documentos" className="flex-1 overflow-y-auto min-h-0 w-full px-8 pb-8 focus-visible:outline-none mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                                                    ? 'border-blue-400 bg-blue-50 scale-[1.01]'
                                                    : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50'
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
                                                            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                                                                <File className="w-4 h-4 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-800">{doc.name}</p>
                                                                <p className="text-[10px] text-slate-400">{(doc.size / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <a href={doc.url} download={doc.name} onClick={e => e.stopPropagation()}>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
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

                                    <TabsContent value="proponentes" className="flex-1 overflow-y-auto min-h-0 w-full px-8 pb-8 focus-visible:outline-none mt-0 space-y-6">
                                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                                            <div>
                                                <h3 className="font-bold text-slate-800">Partes do Negócio</h3>
                                                <p className="text-xs text-slate-500">Compradores, Vendedores e Intervenientes</p>
                                            </div>
                                            <Button className="bg-blue-600 hover:bg-blue-700 gap-2 rounded-xl">
                                                <Plus className="w-4 h-4" /> Adicionar Parte
                                            </Button>
                                        </div>
                                        {/* Placeholder for parties list */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Card className="p-4 border-slate-100 flex items-center justify-between rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                                        {selectedCase?.contactName?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-slate-900">{selectedCase?.contactName}</p>
                                                        <p className="text-xs text-slate-500">Proponente Principal</p>
                                                    </div>
                                                </div>
                                                <Badge className="bg-blue-50 text-blue-600 border-blue-100">100%</Badge>
                                            </Card>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="pendencias" className="flex-1 overflow-y-auto min-h-0 w-full px-8 pb-8 focus-visible:outline-none mt-0 space-y-4">
                                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-4">
                                            <AlertTriangle className="w-6 h-6 text-amber-600" />
                                            <div>
                                                <p className="text-sm font-bold text-amber-800">Pendências Ativas</p>
                                                <p className="text-xs text-amber-700">Este card possui {selectedCase?.pendenciasAbertas} pendências que podem travar o processo.</p>
                                            </div>
                                        </div>
                                        {/* Simplified list */}
                                        <div className="space-y-2">
                                            {selectedCase?.pendenciasAbertas === 0 ? (
                                                <div className="text-center py-12 bg-slate-50 rounded-3xl">
                                                    <CheckCircle className="w-12 h-12 text-green-200 mx-auto mb-4" />
                                                    <p className="text-slate-400 font-medium">Nenhuma pendência aberta!</p>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-400 py-4 italic">Lista de pendências carregada do banco de dados.</p>
                                            )}
                                        </div>
                                    </TabsContent>

                                    {/* Other tabs follow same premium pattern... */}
                                    <TabsContent value="historico" className="flex-1 overflow-y-auto min-h-0 w-full px-8 pb-8 focus-visible:outline-none mt-0">
                                        <div className="space-y-6">
                                            <div className="relative pl-8 border-l-2 border-slate-100 space-y-8">
                                                <div className="relative">
                                                    <div className="absolute -left-[37px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm" />
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Hoje</p>
                                                    <p className="text-sm font-bold text-slate-800">Negócio criado no sistema</p>
                                                    <p className="text-xs text-slate-500 mt-1">Status inicial definido como "Novos"</p>
                                                </div>
                                            </div>

                                            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center">
                                                <Button 
                                                    onClick={handleConcluirProcesso}
                                                    disabled={isSavingVenda || selectedCase?.status === 'Concluído'}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-8 rounded-xl font-bold shadow-lg shadow-emerald-200"
                                                >
                                                    <CheckCircle2 className="w-5 h-5" /> Concluir Processo
                                                </Button>
                                                <p className="text-center text-xs text-slate-500 mt-3">
                                                    Ao concluir, o negócio será movido para a etapa de "Concluído" e o status será atualizado.
                                                </p>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>

                        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                            <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-2 rounded-xl">
                                <Trash2 className="w-4 h-4" /> Excluir Ficha
                            </Button>
                            <div className="flex gap-3">
                                <Button variant="outline" className="rounded-xl px-6" onClick={() => setShowDetailsModal(false)}>Cancelar</Button>
                                <Button disabled={isSavingVenda} onClick={handleSaveVendaData} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-8 font-bold shadow-lg shadow-slate-200">
                                    {isSavingVenda ? 'Salvando...' : 'Salvar Alterações'}
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

                {/* Quick Task Creation Modal */}
                <Dialog open={showQuickTaskModal} onOpenChange={setShowQuickTaskModal}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="font-heading text-xl text-slate-800">
                                Nova Tarefa
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label className="text-sm mb-2 block font-semibold">Descrição *</Label>
                                <Textarea
                                    value={newTaskData.description}
                                    onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                                    placeholder="Descreva a tarefa..."
                                    rows={3}
                                    className="resize-none"
                                />
                            </div>

                            <div>
                                <Label className="text-sm mb-2 block font-semibold">Prazo</Label>
                                <Input
                                    type="date"
                                    value={newTaskData.dueDate ? new Date(newTaskData.dueDate).toISOString().split('T')[0] : ''}
                                    onChange={(e) => setNewTaskData({ ...newTaskData, dueDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                                    className="h-11"
                                />
                                <p className="text-xs text-foreground/60 mt-1">
                                    Se não informado, será definido para 7 dias
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Responsável (Logins Vendas)</Label>
                                <Select
                                    value={newTaskData.internalResponsibleId}
                                    onValueChange={(val) => {
                                        const user = vendasTeam.find(u => u._id === val);
                                        setNewTaskData({
                                            ...newTaskData,
                                            internalResponsibleId: val,
                                            externalResponsibleName: user?.name || user?.emailLogin || '',
                                            responsibleType: 'Interno'
                                        });
                                    }}
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Selecione o responsável" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vendasTeam.map(user => (
                                            <SelectItem key={user._id} value={user._id}>
                                                {user.name || user.emailLogin}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={handleCreateQuickTask}
                                disabled={!newTaskData.description}
                                className="h-11 flex-1 bg-slate-900 text-white hover:bg-slate-800"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Criar Tarefa
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowQuickTaskModal(false);
                                    setQuickActionCaseId(null);
                                    setNewTaskData({
                                        description: '',
                                        internalResponsibleId: '',
                                        dueDate: '',
                                        externalResponsibleName: '',
                                        responsibleType: 'Interno'
                                    });
                                }}
                                className="h-11 px-6"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Quick Pending Creation Modal */}
                <Dialog open={showQuickPendingModal} onOpenChange={setShowQuickPendingModal}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="font-heading text-xl text-slate-800">
                                Nova Pendência
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label className="text-sm mb-2 block font-semibold">Responsável *</Label>
                                <Select
                                    value={newPendingData.responsiblePartyType}
                                    onValueChange={(value) => setNewPendingData({ ...newPendingData, responsiblePartyType: value as any })}
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Interno">Interno</SelectItem>
                                        <SelectItem value="Cliente">Cliente</SelectItem>
                                        <SelectItem value="Parceiro Externo">Parceiro Externo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-sm mb-2 block font-semibold">Descrição *</Label>
                                <Textarea
                                    value={newPendingData.description}
                                    onChange={(e) => setNewPendingData({ ...newPendingData, description: e.target.value })}
                                    placeholder="Descreva a pendência..."
                                    rows={4}
                                    className="resize-none"
                                />
                            </div>

                            <div>
                                <Label className="text-sm mb-2 block font-semibold">Prazo Médio para Conclusão (dias) *</Label>
                                <Input
                                    type="number"
                                    value={newPendingData.averageDaysToComplete}
                                    onChange={(e) => setNewPendingData({ ...newPendingData, averageDaysToComplete: parseInt(e.target.value) || 7 })}
                                    placeholder="7"
                                    min="1"
                                    className="h-11"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={handleCreateQuickPending}
                                disabled={!newPendingData.description}
                                className="h-11 flex-1 bg-slate-900 text-white hover:bg-slate-800"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Criar Pendência
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowQuickPendingModal(false);
                                    setQuickActionCaseId(null);
                                    setNewPendingData({
                                        description: '',
                                        responsiblePartyType: 'Interno',
                                        averageDaysToComplete: 7
                                    });
                                }}
                                className="h-11 px-6"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
