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
    CheckCircle2,
    ListTodo,
    Palette,
    Settings,
    Ticket,
    Phone,
    MessageSquare,
    Hash,
    Gavel,
    Key,
    Loader2,
    Layers,
    ChevronDown
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
import { BaseCrudService, WixDataItem } from '@/integrations';
import { ServiceRecords, UsuriosdoSistema, PendnciasdoFinanciamento, FinancingTasks, ServiceParties, Clients, DocumentosdoFinanciamento, HistricodeInteraes, Imveis, AtendimentoImveis, ChecklistdosProponentes } from '@/entities';
import { formatCurrency, parseCurrency, formatCPF } from '@/lib/input-masks';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { TasksAndPendenciesTabs } from '@/components/admin/tasks/TasksAndPendenciesTabs';

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

    // Contract conditions
    garantia?: string;
    prazoMeses?: string | number;
    diaPagamento?: string | number;
    reajusteIndice?: string;
    multaRescisaoAlugueis?: string | number;
    
    // Caução Bank Details
    caucaoValor?: number;
    caucaoBanco?: string;
    caucaoAgencia?: string;
    caucaoConta?: string;
    caucaoTitular?: string;
    caucaoCpf?: string;

    clientePrincipalRef?: string;
    propertyRefs?: string[];

    interlinks?: {
        hasProperty: boolean;
        activeSales: number;
        activeRentals: number;
        activeFinancing: number;
        activeAuctions: number;
        relatedServices: {
            _id: string;
            serviceType: string;
            contactName: string;
            pastaInterna: string;
            status: string;
            imovelRef: string | null;
            imovelCod: string | null;
            imovelEndereco: string;
        }[];
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
    const [showEmptyColumns, setShowEmptyColumns] = useState(true);
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    const [clients, setClients] = useState<Clients[]>([]);
    const [users, setUsers] = useState<UsuriosdoSistema[]>([]);
    const [atendimentosRaw, setAtendimentosRaw] = useState<ServiceRecords[]>([]);
    const [atendimentoPartes, setAtendimentoPartes] = useState<ServiceParties[]>([]);
    const [imoveis, setImoveis] = useState<Imveis[]>([]);
    const [atendimentoImoveis, setAtendimentoImoveis] = useState<AtendimentoImveis[]>([]);
    const [selectedImovelId, setSelectedImovelId] = useState('');

    // Popup Modal States
    const [showNewClientModal, setShowNewClientModal] = useState(false);
    const [showVincularParteModal, setShowVincularParteModal] = useState(false);
    const [activeModalTrigger, setActiveModalTrigger] = useState<'dados' | 'partes'>('dados');
    const [newClientFormData, setNewClientFormData] = useState<Partial<Clients>>({
        clientName: '',
        cpfCnpj: '',
        email: '',
        phoneNumber: '',
        rg: '',
        nationality: 'Brasileiro(a)',
        profession: '',
        maritalStatus: 'Solteiro(a)',
        gender: 'Masculino',
        address: '',
        notes: '',
        tipoPessoa: 'FÍSICA',
        status: 'Ativo'
    });

    // Property Modal States
    const [showNewImovelModal, setShowNewImovelModal] = useState(false);
    const [showVincularImovelModal, setShowVincularImovelModal] = useState(false);
    const [editingImovelId, setEditingImovelId] = useState<string | null>(null);

    // Edit Parte Modal State
    const [editingParte, setEditingParte] = useState<{ parteId: string; clientId: string } | null>(null);
    const [editingParteForm, setEditingParteForm] = useState<Partial<Clients>>({});
    const [isSavingParte, setIsSavingParte] = useState(false);

    const [newImovelFormData, setNewImovelFormData] = useState<Partial<Imveis>>({
        codImovel: '',
        tipoImovel: 'Apartamento',
        pretensao: 'Locação',
        statusImovel: 'Ativo',
        origemCaptacao: '',
        corretorExternoNome: '',
        corretorExternoContato: '',
        precoLocacao: undefined,
        precoVenda: undefined,
        valorCondominio: undefined,
        valorIPTU: undefined,
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: 'SP',
        nomeProprietario: '',
        telefoneProprietario: '',
        emailProprietario: ''
    });

    // Autocomplete Search States
    const [clientSearchQuery, setClientSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [imovelSearchQuery, setImovelSearchQuery] = useState('');
    const [isImovelDropdownOpen, setIsImovelDropdownOpen] = useState(false);

    // Part / Participant Autocomplete States
    const [partClientSearchQuery, setPartClientSearchQuery] = useState('');
    const [isPartDropdownOpen, setIsPartDropdownOpen] = useState(false);
    const [selectedPartRole, setSelectedPartRole] = useState<string>('Locatário');
    
    // Document Upload States
    const [uploadedDocs, setUploadedDocs] = useState<{ name: string; url: string; size: number; type: string; uploadedAt: string }[]>([]);
    const [isDraggingDoc, setIsDraggingDoc] = useState(false);
    const [isSavingLocacao, setIsSavingLocacao] = useState(false);
    const docInputRef = useRef<HTMLInputElement>(null);
    const [isEditingPasta, setIsEditingPasta] = useState(false);
    const [pastaInputValue, setPastaInputValue] = useState('');
    const [selectedPartClient, setSelectedPartClient] = useState<any | null>(null);
    useEffect(() => {
        loadData();
        const storedBg = localStorage.getItem('kanban-background-locacoes');
        if (storedBg) setKanbanBackground(storedBg);

        const storedShowEmpty = localStorage.getItem('kanban-show-empty-locacoes');
        if (storedShowEmpty !== null) setShowEmptyColumns(storedShowEmpty === 'true');
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            async function safeGetAll<T extends WixDataItem>(collectionId: string): Promise<{ items: T[] }> {
                try {
                    return await BaseCrudService.getAll<T>(collectionId);
                } catch (e) {
                    console.error(`Error loading collection ${collectionId}:`, e);
                    return { items: [] };
                }
            }

            const [
                { items: clientsList },
                { items: usersList },
                { items: atendimentos },
                { items: pendingsList },
                { items: tasksList },
                { items: partiesList },
                { items: propertiesList },
                { items: propertyLinks }
            ] = await Promise.all([
                safeGetAll<Clients>('clientes'),
                safeGetAll<UsuriosdoSistema>('usuariossistema'),
                safeGetAll<ServiceRecords>('atendimentos'),
                safeGetAll<PendnciasdoFinanciamento>('pendenciaslocacoes'),
                safeGetAll<FinancingTasks>('tarefaslocacoes'),
                safeGetAll<ServiceParties>('atendimentopartes'),
                safeGetAll<Imveis>('imoveis'),
                safeGetAll<AtendimentoImveis>('atendimentoimoveis')
            ]);

            setClients(clientsList);
            setUsers(usersList);
            setAtendimentosRaw(atendimentos);
            setAtendimentoPartes(partiesList);
            setImoveis(propertiesList);
            setAtendimentoImoveis(propertyLinks);

            const filteredAtendimentos = atendimentos
                .filter(a => {
                    const types = (a.serviceType || '').split(',').map(t => t.trim().toLowerCase());
                    return (types.includes('locação') || types.includes('aluguel')) && !a.isArchived;
                })
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
                    activeSales: uniqueRelated.filter(s => {
                        const types = (s.serviceType || '').split(',').map(t => t.trim().toLowerCase());
                        return types.includes('venda') || types.includes('compra');
                    }).length,
                    activeRentals: uniqueRelated.filter(s => {
                        const types = (s.serviceType || '').split(',').map(t => t.trim().toLowerCase());
                        return types.includes('locação') || types.includes('aluguel');
                    }).length,
                    activeFinancing: uniqueRelated.filter(s => {
                        const types = (s.serviceType || '').split(',').map(t => t.trim().toLowerCase());
                        return types.includes('financiamento') || types.includes('crédito');
                    }).length,
                    activeAuctions: uniqueRelated.filter(s => {
                        const types = (s.serviceType || '').split(',').map(t => t.trim().toLowerCase());
                        return types.includes('leilão');
                    }).length,
                    relatedServices: uniqueRelated.map(s => {
                        const plink = propertyLinks.find(pl => pl.atendimentoRef === s._id);
                        const prop = plink ? propertiesList.find(pr => pr._id === plink.imovelRef) : null;
                        return {
                            _id: s._id,
                            serviceType: s.serviceType || '',
                            contactName: s.contactName || '',
                            pastaInterna: (s as any).pastaInterna || '',
                            status: s.status || '',
                            imovelRef: plink ? plink.imovelRef : null,
                            imovelCod: prop ? (prop.codImovel || prop.codigoReference || '') : null,
                            imovelEndereco: prop ? (prop.enderecoRua || prop.logradouro || prop.enderecoBairro || prop.bairro || '') : ''
                        };
                    })
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
                    pendenciasResumo: casePendings.slice(0, 2).map(p => p.title || (p as any).description || 'Pendência'),
                    tarefasResumo: caseTasks.slice(0, 2).map(t => t.titulo || (t as any).description || 'Tarefa'),
                    bloqueioDocumento: casePendings.some(p => p.categoria === 'Documento'),
                    bloqueioPagamento: casePendings.some(p => p.categoria === 'Financeiro'),
                    bloqueioCliente: casePendings.some(p => p.categoria === 'Cliente'),
                    propertyValue: (a as any).propertyValue || 0,
                    rentValue: (a as any).rentValue || 0,
                    notes: a.notes || '',
                    garantia: (a as any).garantia || 'Caucao',
                    prazoMeses: (a as any).prazoMeses || '30',
                    diaPagamento: (a as any).diaPagamento || '10',
                    reajusteIndice: (a as any).reajusteIndice || 'IPCA',
                    multaRescisaoAlugueis: (a as any).multaRescisaoAlugueis || '3',
                    caucaoValor: (a as any).caucaoValor || 0,
                    caucaoBanco: (a as any).caucaoBanco || 'Caixa Econômica Federal',
                    caucaoAgencia: (a as any).caucaoAgencia || '',
                    caucaoConta: (a as any).caucaoConta || '',
                    caucaoTitular: (a as any).caucaoTitular || '',
                    caucaoCpf: (a as any).caucaoCpf || '',
                    clientePrincipalRef: a.clientePrincipalRef || '',
                    propertyRefs: clientPropertyIds,
                    interlinks
                };
            });

            setCases(filteredCases);

            // Sync active case details if modal is open
            if (selectedCase) {
                const freshCase = filteredCases.find(c => c._id === selectedCase._id);
                if (freshCase) {
                    setSelectedCase(freshCase);
                }
            }
        } catch (error: any) {
            console.error('Error loading Locações Kanban data:', error);
            toast.error(`Erro ao carregar dados do Kanban: ${error?.message || error}`);
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

    const handleChangeBackground = (bg: string) => {
        setKanbanBackground(bg);
        localStorage.setItem('kanban-background-locacoes', bg);
        setShowBackgroundPicker(false);
    };

    const handleOpenDetails = (caseItem: LocacoesCase) => {
        setSelectedCase(caseItem);
        setUploadedDocs((caseItem as any).documentosAnexos || []);
        setShowDetailsModal(true);
    };

    const currentModalities = selectedCase?.serviceType
        ? selectedCase.serviceType.split(',').map((t: string) => t.trim())
        : [];

    const handleToggleModality = (modality: string) => {
        if (!selectedCase) return;
        const current = selectedCase.serviceType
            ? selectedCase.serviceType.split(',').map((t: string) => t.trim())
            : [];
        let updated: string[];
        if (current.includes(modality)) {
            updated = current.filter((m: string) => m !== modality);
        } else {
            updated = [...current, modality];
        }
        setSelectedCase(prev => prev ? { ...prev, serviceType: updated.join(', ') } : null);
    };

    const handleSaveLocacaoData = async () => {
        if (!selectedCase) return;
        setIsSavingLocacao(true);
        try {
            await BaseCrudService.update('atendimentos', {
                _id: selectedCase._id,
                clientePrincipalRef: selectedCase.clientePrincipalRef,
                contactName: selectedCase.contactName,
                contactPhone: selectedCase.contactPhone,
                contactEmail: selectedCase.contactEmail,
                pastaInterna: selectedCase.pastaInterna,
                rentValue: selectedCase.rentValue,
                propertyValue: selectedCase.propertyValue,
                serviceType: selectedCase.serviceType,
                notes: selectedCase.notes,
                
                // Contract parameters
                garantia: selectedCase.garantia,
                prazoMeses: selectedCase.prazoMeses,
                diaPagamento: selectedCase.diaPagamento,
                reajusteIndice: selectedCase.reajusteIndice,
                multaRescisaoAlugueis: selectedCase.multaRescisaoAlugueis,
                
                // Caução details
                caucaoValor: selectedCase.caucaoValor,
                caucaoBanco: selectedCase.caucaoBanco,
                caucaoAgencia: selectedCase.caucaoAgencia,
                caucaoConta: selectedCase.caucaoConta,
                caucaoTitular: selectedCase.caucaoTitular,
                caucaoCpf: selectedCase.caucaoCpf,
                
                documentosAnexos: uploadedDocs,
            });
            toast.success('Dados salvos com sucesso!');
            await loadData();
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            toast.error('Erro ao salvar dados.');
        } finally {
            setIsSavingLocacao(false);
        }
    };

    const handleSavePasta = async () => {
        if (!selectedCase) return;
        try {
            await BaseCrudService.update('atendimentos', {
                _id: selectedCase._id,
                pastaInterna: pastaInputValue
            });
            setCases(prev => prev.map(c => c._id === selectedCase._id ? { ...c, pastaInterna: pastaInputValue } : c));
            setSelectedCase(prev => prev ? { ...prev, pastaInterna: pastaInputValue } : null);
            setIsEditingPasta(false);
            toast.success('Nome da pasta atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar nome da pasta:', error);
            toast.error('Erro ao atualizar nome da pasta.');
        }
    };

    const handleConfirmVincularParte = async () => {
        if (!selectedCase || !selectedPartClient) {
            toast.error('Por favor, selecione um cliente primeiro.');
            return;
        }
        setIsSavingLocacao(true);
        try {
            const existsPart = atendimentoPartes.some(p => p.serviceRecordRef === selectedCase._id && p.clientRef === selectedPartClient._id && p.roleInService === selectedPartRole);
            if (existsPart) {
                toast.error('Este cliente já está vinculado com esta função.');
                return;
            }
            const partyId = crypto.randomUUID();
            await BaseCrudService.create('atendimentopartes', {
                _id: partyId,
                serviceRecordRef: selectedCase._id,
                clientRef: selectedPartClient._id,
                roleInService: selectedPartRole,
                participationPercentage: 100,
                notes: 'Adicionado via Kanban'
            });
            toast.success('Parte vinculada com sucesso!');
            setShowVincularParteModal(false);
            setPartClientSearchQuery('');
            setSelectedPartClient(null);
            await loadData();
        } catch (err) {
            toast.error('Erro ao vincular parte.');
        } finally {
            setIsSavingLocacao(false);
        }
    };

    const handleCreateNewClientFromPopup = async () => {
        if (!newClientFormData.clientName?.trim()) {
            toast.error('O nome completo do cliente é obrigatório.');
            return;
        }
        if (!newClientFormData.cpfCnpj?.trim()) {
            toast.error('O CPF/CNPJ é obrigatório.');
            return;
        }

        const cpfClean = newClientFormData.cpfCnpj.replace(/\D/g, '');
        const exists = clients.some(c => c.cpfCnpj?.replace(/\D/g, '') === cpfClean);
        if (exists) {
            toast.error('Já existe um cliente com este CPF/CNPJ cadastrado.');
            return;
        }

        setIsSavingLocacao(true);
        try {
            const clientId = crypto.randomUUID();
            const clientPayload: Clients = {
                _id: clientId,
                clientName: newClientFormData.clientName.trim(),
                cpfCnpj: newClientFormData.cpfCnpj.trim(),
                email: newClientFormData.email?.trim() || '',
                phoneNumber: newClientFormData.phoneNumber?.trim() || '',
                rg: newClientFormData.rg?.trim() || '',
                nationality: newClientFormData.nationality?.trim() || 'Brasileiro(a)',
                profession: newClientFormData.profession?.trim() || '',
                maritalStatus: newClientFormData.maritalStatus || 'Solteiro(a)',
                gender: newClientFormData.gender || 'Masculino',
                address: newClientFormData.address?.trim() || '',
                notes: newClientFormData.notes?.trim() || '',
                tipoPessoa: newClientFormData.tipoPessoa || 'FÍSICA',
                status: 'Ativo',
                whatsAppPrincipal: newClientFormData.phoneNumber?.trim() || '',
                telefonePrincipal: newClientFormData.phoneNumber?.trim() || '',
                emailPrincipal: newClientFormData.email?.trim() || '',
                nomeRazaoSocial: newClientFormData.clientName.trim(),
                papeis: 'Cliente',
            };

            await BaseCrudService.create('clientes', clientPayload);
            toast.success('Cliente cadastrado com sucesso!');

            // If we are in "dados" mode, update selectedCase
            if (activeModalTrigger === 'dados' && selectedCase) {
                setSelectedCase(prev => prev ? {
                    ...prev,
                    clientePrincipalRef: clientId,
                    contactName: clientPayload.clientName,
                    contactPhone: clientPayload.phoneNumber || '',
                    contactEmail: clientPayload.email || '',
                    cpfProponentePrincipal: clientPayload.cpfCnpj
                } : null);
                setClientSearchQuery('');
            } else if (activeModalTrigger === 'partes' && selectedCase) {
                // If we are in "partes" mode, create link automatically
                const partyId = crypto.randomUUID();
                await BaseCrudService.create('atendimentopartes', {
                    _id: partyId,
                    serviceRecordRef: selectedCase._id,
                    clientRef: clientId,
                    roleInService: selectedPartRole || 'Locatário',
                    participationPercentage: 100,
                    notes: 'Adicionado pós-cadastro rápido'
                });
                toast.success(`Adicionado como ${selectedPartRole} com sucesso!`);
                setPartClientSearchQuery('');
            }

            // Reload all lists
            await loadData();
            
            // Close modal and reset form
            setShowNewClientModal(false);
            setNewClientFormData({
                clientName: '',
                cpfCnpj: '',
                email: '',
                phoneNumber: '',
                rg: '',
                nationality: 'Brasileiro(a)',
                profession: '',
                maritalStatus: 'Solteiro(a)',
                gender: 'Masculino',
                address: '',
                notes: '',
                tipoPessoa: 'FÍSICA',
                status: 'Ativo'
            });
        } catch (error) {
            console.error('Erro ao cadastrar cliente:', error);
            toast.error('Erro ao salvar o cadastro do cliente.');
        } finally {
            setIsSavingLocacao(false);
        }
    };

    const handleOpenNewImovelModal = () => {
        const randomCode = `IMO-${Math.floor(1000 + Math.random() * 9000)}`;
        setNewImovelFormData({
            codImovel: randomCode,
            codigoReference: randomCode,
            tipoImovel: 'Apartamento',
            pretensao: 'Locação',
            statusImovel: 'Ativo',
            precoLocacao: undefined,
            precoVenda: undefined,
            valorCondominio: undefined,
            valorIPTU: undefined,
            cep: '',
            logradouro: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: 'SP',
            nomeProprietario: '',
            telefoneProprietario: '',
            emailProprietario: ''
        });
        setEditingImovelId(null);
        setShowNewImovelModal(true);
    };

    const handleOpenEditImovelModal = (imovel: Imveis) => {
        setNewImovelFormData({
            codImovel: imovel.codImovel || imovel.codigoReference || '',
            codigoReference: imovel.codigoReference || imovel.codImovel || '',
            tipoImovel: imovel.tipoImovel || 'Apartamento',
            pretensao: imovel.pretensao || 'Locação',
            statusImovel: imovel.statusImovel || 'Ativo',
            precoLocacao: imovel.precoLocacao,
            precoVenda: imovel.precoVenda,
            valorCondominio: imovel.valorCondominio,
            valorIPTU: imovel.valorIPTU,
            cep: imovel.cep || '',
            logradouro: imovel.logradouro || imovel.enderecoRua || '',
            numero: imovel.numero || '',
            complemento: imovel.complemento || imovel.enderecoComplemento || '',
            bairro: imovel.bairro || imovel.enderecoBairro || '',
            cidade: imovel.cidade || imovel.enderecoCidade || '',
            estado: imovel.estado || imovel.enderecoEstado || 'SP',
            nomeProprietario: imovel.nomeProprietario || '',
            telefoneProprietario: imovel.telefoneProprietario || '',
            emailProprietario: imovel.emailProprietario || ''
        });
        setEditingImovelId(imovel._id);
        setShowNewImovelModal(true);
    };

    const handleSaveImovel = async () => {
        if (!newImovelFormData.codImovel?.trim()) {
            toast.error('O código do imóvel é obrigatório.');
            return;
        }
        if (!newImovelFormData.tipoImovel) {
            toast.error('O tipo do imóvel é obrigatório.');
            return;
        }

        setIsSavingLocacao(true);
        try {
            const imovelPayload: Imveis = {
                _id: editingImovelId || crypto.randomUUID(),
                codImovel: newImovelFormData.codImovel.trim(),
                codigoReference: newImovelFormData.codImovel.trim(),
                tipoImovel: newImovelFormData.tipoImovel,
                pretensao: newImovelFormData.pretensao || 'Locação',
                statusImovel: newImovelFormData.statusImovel || 'Ativo',
                origemCaptacao: newImovelFormData.origemCaptacao || '',
                corretorExternoNome: newImovelFormData.corretorExternoNome?.trim() || '',
                corretorExternoContato: newImovelFormData.corretorExternoContato?.trim() || '',
                precoLocacao: newImovelFormData.precoLocacao,
                precoVenda: newImovelFormData.precoVenda,
                valorCondominio: newImovelFormData.valorCondominio,
                valorIPTU: newImovelFormData.valorIPTU,
                cep: newImovelFormData.cep?.trim() || '',
                logradouro: newImovelFormData.logradouro?.trim() || '',
                numero: newImovelFormData.numero?.trim() || '',
                complemento: newImovelFormData.complemento?.trim() || '',
                bairro: newImovelFormData.bairro?.trim() || '',
                cidade: newImovelFormData.cidade?.trim() || '',
                estado: newImovelFormData.estado || 'SP',
                nomeProprietario: newImovelFormData.nomeProprietario?.trim() || '',
                telefoneProprietario: newImovelFormData.telefoneProprietario?.trim() || '',
                emailProprietario: newImovelFormData.emailProprietario?.trim() || ''
            };

            if (editingImovelId) {
                await BaseCrudService.update('imoveis', imovelPayload);
                toast.success('Imóvel atualizado com sucesso!');
            } else {
                await BaseCrudService.create('imoveis', imovelPayload);
                toast.success('Imóvel cadastrado com sucesso!');

                if (selectedCase) {
                    const linkExists = atendimentoImoveis.some(
                        ai => ai.atendimentoRef === selectedCase._id && ai.imovelRef === imovelPayload._id
                    );
                    if (!linkExists) {
                        await BaseCrudService.create('atendimentoimoveis', {
                            _id: crypto.randomUUID(),
                            atendimentoRef: selectedCase._id,
                            imovelRef: imovelPayload._id,
                            status: 'Ativo'
                        });
                        toast.success('Imóvel vinculado automaticamente à locação!');
                    }
                }
            }

            await loadData();
            setShowNewImovelModal(false);
            setEditingImovelId(null);
        } catch (error) {
            console.error('Erro ao salvar imóvel:', error);
            toast.error('Erro ao salvar as informações do imóvel.');
        } finally {
            setIsSavingLocacao(false);
        }
    };

    const handleCpfCnpjChange = (val: string) => {
        const clean = val.replace(/\D/g, '');
        let formatted = clean;
        if (clean.length <= 11) {
            formatted = formatCPF(clean);
        } else {
            const limited = clean.substring(0, 14);
            if (limited.length <= 2) {
                formatted = limited;
            } else if (limited.length <= 5) {
                formatted = `${limited.slice(0, 2)}.${limited.slice(2)}`;
            } else if (limited.length <= 8) {
                formatted = `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5)}`;
            } else if (limited.length <= 12) {
                formatted = `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8)}`;
            } else {
                formatted = `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8, 12)}-${limited.slice(12)}`;
            }
        }
        setNewClientFormData(prev => ({ ...prev, cpfCnpj: formatted }));
    };

    const handlePhoneChange = (val: string) => {
        const clean = val.replace(/\D/g, '');
        let formatted = clean;
        const limited = clean.substring(0, 11);
        if (limited.length <= 2) {
            formatted = limited;
        } else if (limited.length <= 6) {
            formatted = `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
        } else if (limited.length <= 10) {
            formatted = `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
        } else {
            formatted = `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
        }
        setNewClientFormData(prev => ({ ...prev, phoneNumber: formatted }));
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
                    documentUrl: URL.createObjectURL(f),
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
        setIsSavingLocacao(true);
        try {
            await BaseCrudService.update('atendimentos', {
                _id: selectedCase._id,
                status: 'Concluídos',
            });
            toast.success('Processo concluído com sucesso!');
            setShowDetailsModal(false);
            loadData();
        } catch {
            toast.error('Erro ao concluir processo.');
        } finally {
            setIsSavingLocacao(false);
        }
    };

    const handleLinkImovel = async () => {
        if (!selectedCase) return;
        if (!selectedImovelId) {
            toast.error('Selecione um imóvel para vincular.');
            return;
        }

        // Evitar duplicidade de vínculo de imóvel para o mesmo atendimento
        const isDuplicate = atendimentoImoveis.some(
            (p) => p.atendimentoRef === selectedCase._id && p.imovelRef === selectedImovelId
        );
        if (isDuplicate) {
            toast.error('Este imóvel já está vinculado a esta locação.');
            return;
        }

        try {
            const newLink: any = {
                _id: crypto.randomUUID(),
                atendimentoRef: selectedCase._id,
                imovelRef: selectedImovelId,
                status: 'Ativo'
            };

            await BaseCrudService.create('atendimentoimoveis', newLink);
            toast.success('Imóvel vinculado com sucesso!');
            setShowVincularImovelModal(false);
            setSelectedImovelId('');
            await loadData();
        } catch (error) {
            console.error('Erro ao vincular imóvel:', error);
            toast.error('Erro ao vincular imóvel.');
        }
    };

    const handleUnlinkImovel = async (linkId: string) => {
        try {
            await BaseCrudService.delete('atendimentoimoveis', linkId);
            toast.success('Vínculo do imóvel removido com sucesso!');
            await loadData();
        } catch (error) {
            console.error('Erro ao desvincular imóvel:', error);
            toast.error('Erro ao desvincular imóvel.');
        }
    };

    const handleQuickStatusChange = async (newStatus: string) => {
        if (!selectedCase) return;
        
        const previousStatus = selectedCase.status;
        if (previousStatus === newStatus) return;

        setIsSavingLocacao(true);
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
            setIsSavingLocacao(false);
        }
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
                            className={`rounded-full shadow-sm hover:shadow-md transition-all ${!showEmptyColumns ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white text-slate-400'}`}
                            onClick={() => {
                                const nextValue = !showEmptyColumns;
                                setShowEmptyColumns(nextValue);
                                localStorage.setItem('kanban-show-empty-locacoes', String(nextValue));
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
                                {LOCACOES_COLUMNS.filter(column => {
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
                                                                            {/* Quick Action Buttons (visible on hover) */}
                                                                            <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-1.5 py-1 shadow-sm z-10">
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); handleOpenDetails(caseItem); }}
                                                                                    className="p-1 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors"
                                                                                    title="Ver Pendências"
                                                                                >
                                                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                                                </button>
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); handleOpenDetails(caseItem); }}
                                                                                    className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                                                                    title="Ver Tarefas"
                                                                                >
                                                                                    <ListTodo className="w-3.5 h-3.5" />
                                                                                </button>
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); handleOpenDetails(caseItem); }}
                                                                                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-colors"
                                                                                    title="Ver Histórico"
                                                                                >
                                                                                    <History className="w-3.5 h-3.5" />
                                                                                </button>
                                                                                {caseItem.contactPhone && (
                                                                                    <a
                                                                                        href={`https://wa.me/55${caseItem.contactPhone.replace(/\D/g, '')}`}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                        className="p-1 text-green-500 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                                                                                        title="Abrir WhatsApp"
                                                                                    >
                                                                                        <MessageSquare className="w-3.5 h-3.5" />
                                                                                    </a>
                                                                                )}
                                                                            </div>

                                                                            <div className="mb-2">
                                                                                {/* Top row: pasta + dias */}
                                                                                <div className="flex justify-between items-start mb-2">
                                                                                    <div className="flex-1 min-w-0 pr-2">
                                                                                        <h4 className="font-bold text-slate-950 text-sm line-clamp-1">
                                                                                            {caseItem.contactName}
                                                                                        </h4>
                                                                                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                                                                                            • Pasta: {caseItem.pastaInterna || '—'}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                                                        <span className={`text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center h-5 ${caseItem.diasNaFase > 15 ? 'bg-red-500' : caseItem.diasNaFase > 7 ? 'bg-orange-500' : 'bg-emerald-500'}`}>
                                                                                            {caseItem.diasNaFase} {caseItem.diasNaFase === 1 ? 'dia' : 'dias'}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>

                                                                                {/* Endereço do Imóvel */}
                                                                                {(() => {
                                                                                    const vinculado = atendimentoImoveis.find(ai => ai.atendimentoRef === caseItem._id);
                                                                                    const imovel = vinculado ? imoveis.find(i => i._id === vinculado.imovelRef) : null;
                                                                                    if (!imovel) return null;
                                                                                    return (
                                                                                        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] bg-slate-50 border border-slate-100/50 rounded-lg px-2.5 py-1.5 text-slate-600 font-medium hover:bg-slate-100 hover:border-slate-200 transition-all">
                                                                                            <Home className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                                                                            {(imovel.codImovel || imovel.codigoReference) && (
                                                                                                <span className="font-black text-emerald-700 text-[9px] uppercase tracking-wider">{imovel.codImovel || imovel.codigoReference}</span>
                                                                                            )}
                                                                                            {(imovel.codImovel || imovel.codigoReference) && (imovel.enderecoRua || imovel.logradouro) && (
                                                                                                <span className="text-slate-300">•</span>
                                                                                            )}
                                                                                            <span className="truncate flex-1">{imovel.enderecoRua || imovel.logradouro || imovel.bairro || 'Sem endereço'}</span>
                                                                                        </div>
                                                                                    );
                                                                                })()}
                                                                            </div>

                                                                            {/* Pendência em destaque */}
                                                                            {caseItem.pendenciasAbertas > 0 && (caseItem as any).pendenciasResumo?.[0] && (
                                                                                <div className="space-y-1 mb-2">
                                                                                    <div className="flex items-center gap-1.5 text-[10px] bg-orange-50 p-1.5 rounded-lg border border-orange-100/50">
                                                                                        <AlertCircle className="w-3 h-3 flex-shrink-0 text-orange-500" />
                                                                                        <span className="line-clamp-1 flex-1 text-slate-700 font-medium">{(caseItem as any).pendenciasResumo[0]}</span>
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {/* Action Row */}
                                                                            <div className="border-t border-slate-100 mt-3 pt-3 flex items-center gap-1.5 flex-wrap">
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); handleOpenDetails(caseItem); }}
                                                                                    className="px-2.5 py-1.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg text-xs font-bold hover:bg-orange-100 transition-colors flex items-center gap-1"
                                                                                >
                                                                                    <Plus className="w-3.5 h-3.5" /> Pend.
                                                                                </button>
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); handleOpenDetails(caseItem); }}
                                                                                    className="px-2.5 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1"
                                                                                >
                                                                                    <Plus className="w-3.5 h-3.5" /> Tarefa
                                                                                </button>
                                                                                <Select value={caseItem.faseAtual} onValueChange={(value) => handleMoveCase(caseItem._id, value)}>
                                                                                    <SelectTrigger
                                                                                        className="px-3 py-1.5 w-auto min-w-[65px] h-8 bg-slate-100 text-slate-700 border-none rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-1 focus:ring-0 focus:ring-offset-0"
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                    >
                                                                                        <div className="flex items-center gap-1"><span>MOVER</span></div>
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        {LOCACOES_COLUMNS.map(col => (
                                                                                            <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
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
                    <DialogContent className="max-w-6xl h-[90vh] max-h-[90vh] p-0 gap-0 overflow-hidden rounded-3xl flex flex-col bg-white">
                        <DialogHeader className="px-8 py-6 border-b border-slate-100 bg-white/50 backdrop-blur-md sticky top-0 z-10 flex flex-row justify-between items-start flex-shrink-0">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-blue-100 rounded-2xl">
                                            <Users className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <DialogTitle className="text-xl font-bold text-slate-800">
                                                {selectedCase?.contactName}
                                            </DialogTitle>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge className={`${LOCACOES_COLUMNS.find(c => c.id === selectedCase?.status)?.color} border-none px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider`}>
                                                    {selectedCase?.status}
                                                </Badge>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600">
                                                            <Edit2 className="w-3 h-3" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="w-48 bg-white border-slate-200">
                                                        {LOCACOES_COLUMNS.map(col => (
                                                            <DropdownMenuItem
                                                                key={col.id}
                                                                onClick={() => handleQuickStatusChange(col.id)}
                                                                className="text-xs hover:bg-slate-50 cursor-pointer"
                                                            >
                                                                {col.name}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <span className="text-[10px] text-slate-400">•</span>
                                                {isEditingPasta ? (
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="text"
                                                            value={pastaInputValue}
                                                            onChange={(e) => setPastaInputValue(e.target.value)}
                                                            className="text-[10px] text-slate-750 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-emerald-400 h-5"
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleSavePasta();
                                                                if (e.key === 'Escape') setIsEditingPasta(false);
                                                            }}
                                                        />
                                                        <Button onClick={handleSavePasta} variant="ghost" className="h-5 w-5 p-0 text-emerald-500 hover:text-emerald-700">
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button onClick={() => setIsEditingPasta(false)} variant="ghost" className="h-5 w-5 p-0 text-rose-500 hover:text-rose-700">
                                                            <XCircle className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 group/pasta">
                                                        <span className="text-[10px] text-slate-400">{selectedCase?.pastaInterna || '—'}</span>
                                                        <Button
                                                            onClick={() => {
                                                                setPastaInputValue(selectedCase?.pastaInterna || '');
                                                                setIsEditingPasta(true);
                                                            }}
                                                            variant="ghost"
                                                            className="h-5 w-5 p-0 text-slate-400 hover:text-slate-650 opacity-100 sm:opacity-0 group-hover/pasta:opacity-100 transition-opacity"
                                                        >
                                                            <Edit2 className="w-2.5 h-2.5" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {(() => {
                                    const propertyPills = selectedCase?.interlinks?.relatedServices?.filter(rel => 
                                        rel.imovelRef && selectedCase.propertyRefs?.includes(rel.imovelRef)
                                    ) || [];
                                    if (propertyPills.length === 0) return null;
                                    return (
                                        <div className="flex flex-col gap-2 mt-2">
                                            <div className="flex flex-wrap gap-2 items-center">
                                                <span className="text-xs text-gray-400 font-medium">Vínculos:</span>
                                                {propertyPills.map(rel => {
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
                                                    const firstType = (rel.serviceType || '').split(',').map(t => t.trim())[0] || '';
                                                    const route = routeMap[firstType];
                                                    const color = colorMap[firstType] || 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200';
                                                    const icon = iconMap[firstType] || '📋';
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
                                        </div>
                                    );
                                })()}
                                {selectedCase?.interlinks?.relatedServices && selectedCase.interlinks.relatedServices.length > 0 && (
                                    <div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-7 w-auto px-3 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center gap-1.5 justify-start">
                                                    Outros cartões <ChevronDown className="w-3.5 h-3.5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-[350px] bg-white border-slate-200 p-2 flex flex-col gap-3 shadow-xl rounded-xl">
                                                    {(() => {
                                                        const groupsMap = new Map<string, {
                                                            imovelRef: string | null;
                                                            imovelCod: string | null;
                                                            imovelEndereco: string;
                                                            services: typeof selectedCase.interlinks.relatedServices;
                                                        }>();
                                                        const noPropertyGroup: typeof selectedCase.interlinks.relatedServices = [];

                                                        selectedCase.interlinks.relatedServices.forEach(rel => {
                                                            if (rel.imovelRef) {
                                                                if (!groupsMap.has(rel.imovelRef)) {
                                                                    groupsMap.set(rel.imovelRef, {
                                                                        imovelRef: rel.imovelRef,
                                                                        imovelCod: rel.imovelCod,
                                                                        imovelEndereco: rel.imovelEndereco,
                                                                        services: []
                                                                    });
                                                                }
                                                                groupsMap.get(rel.imovelRef)!.services.push(rel);
                                                            } else {
                                                                noPropertyGroup.push(rel);
                                                            }
                                                        });

                                                        const groups = Array.from(groupsMap.values());
                                                        
                                                        const routeMap: Record<string, string> = {
                                                            'Venda': '/admin/negocios/kanban', 'Compra': '/admin/negocios/kanban',
                                                            'Locação': '/admin/locacoes/kanban', 'Aluguel': '/admin/locacoes/kanban',
                                                            'Financiamento': '/admin/financiamento-kanban', 'Crédito': '/admin/financiamento-kanban',
                                                            'Leilão': '/admin/leilao/kanban'
                                                        };
                                                        const iconMap: Record<string, string> = {
                                                            'Venda': '💰', 'Compra': '💰', 'Locação': '🔑', 'Aluguel': '🔑',
                                                            'Financiamento': '🏦', 'Crédito': '🏦', 'Leilão': '🔨'
                                                        };

                                                        return (
                                                            <>
                                                                {groups.map(group => (
                                                                    <div key={group.imovelRef} className="flex flex-col gap-1.5">
                                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                                                                            <span>🏠</span>
                                                                            <span className="truncate max-w-[280px]">
                                                                                {group.imovelCod ? `${group.imovelCod} - ` : ''}{group.imovelEndereco || 'Imóvel sem endereço'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-50/50 rounded-lg border border-slate-100">
                                                                            {group.services.map(rel => {
                                                                                const firstType = (rel.serviceType || '').split(',').map(t => t.trim())[0] || '';
                                                                                const route = routeMap[firstType];
                                                                                const icon = iconMap[firstType] || '📋';
                                                                                const colorMap: Record<string, string> = {
                                                                                    'Venda': 'hover:bg-blue-50 hover:border-blue-200 border-slate-200',
                                                                                    'Compra': 'hover:bg-blue-50 hover:border-blue-200 border-slate-200',
                                                                                    'Locação': 'hover:bg-purple-50 hover:border-purple-200 border-slate-200',
                                                                                    'Aluguel': 'hover:bg-purple-50 hover:border-purple-200 border-slate-200',
                                                                                    'Financiamento': 'hover:bg-amber-50 hover:border-amber-200 border-slate-200',
                                                                                    'Crédito': 'hover:bg-amber-50 hover:border-amber-200 border-slate-200',
                                                                                    'Leilão': 'hover:bg-red-50 hover:border-red-200 border-slate-200'
                                                                                };
                                                                                const color = colorMap[firstType] || 'hover:bg-slate-50 hover:border-slate-300 border-slate-200';
                                                                                if (!route) return null;
                                                                                return (
                                                                                    <DropdownMenuItem
                                                                                        key={rel._id}
                                                                                        asChild
                                                                                        className="focus:bg-transparent p-0 border-none cursor-pointer flex-1 min-w-[140px]"
                                                                                    >
                                                                                        <button
                                                                                            onClick={() => navigate(`${route}?openCard=${rel._id}`)}
                                                                                            className={`flex items-center gap-2 p-2 rounded-lg border bg-white shadow-sm transition-all text-left ${color}`}
                                                                                        >
                                                                                            <span className="text-sm">{icon}</span>
                                                                                            <div className="flex flex-col min-w-0">
                                                                                                <span className="font-bold text-slate-700 text-[11px] truncate leading-tight">{rel.serviceType}</span>
                                                                                                <span className="text-[9px] text-slate-400 font-medium truncate leading-none mt-0.5">
                                                                                                    {rel.pastaInterna || rel.contactName}
                                                                                                </span>
                                                                                            </div>
                                                                                        </button>
                                                                                    </DropdownMenuItem>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {noPropertyGroup.length > 0 && (
                                                                    <div className="flex flex-col gap-1.5">
                                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                                                                            <span>📋</span>
                                                                            <span>Outros Serviços</span>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-50/50 rounded-lg border border-slate-100">
                                                                            {noPropertyGroup.map(rel => {
                                                                                const firstType = (rel.serviceType || '').split(',').map(t => t.trim())[0] || '';
                                                                                const route = routeMap[firstType];
                                                                                const icon = iconMap[firstType] || '📋';
                                                                                const colorMap: Record<string, string> = {
                                                                                    'Venda': 'hover:bg-blue-50 hover:border-blue-200 border-slate-200',
                                                                                    'Compra': 'hover:bg-blue-50 hover:border-blue-200 border-slate-200',
                                                                                    'Locação': 'hover:bg-purple-50 hover:border-purple-200 border-slate-200',
                                                                                    'Aluguel': 'hover:bg-purple-50 hover:border-purple-200 border-slate-200',
                                                                                    'Financiamento': 'hover:bg-amber-50 hover:border-amber-200 border-slate-200',
                                                                                    'Crédito': 'hover:bg-amber-50 hover:border-amber-200 border-slate-200',
                                                                                    'Leilão': 'hover:bg-red-50 hover:border-red-200 border-slate-200'
                                                                                };
                                                                                const color = colorMap[firstType] || 'hover:bg-slate-50 hover:border-slate-300 border-slate-200';
                                                                                if (!route) return null;
                                                                                return (
                                                                                    <DropdownMenuItem
                                                                                        key={rel._id}
                                                                                        asChild
                                                                                        className="focus:bg-transparent p-0 border-none cursor-pointer flex-1 min-w-[140px]"
                                                                                    >
                                                                                        <button
                                                                                            onClick={() => navigate(`${route}?openCard=${rel._id}`)}
                                                                                            className={`flex items-center gap-2 p-2 rounded-lg border bg-white shadow-sm transition-all text-left ${color}`}
                                                                                        >
                                                                                            <span className="text-sm">{icon}</span>
                                                                                            <div className="flex flex-col min-w-0">
                                                                                                <span className="font-bold text-slate-700 text-[11px] truncate leading-tight">{rel.serviceType}</span>
                                                                                                <span className="text-[9px] text-slate-400 font-medium truncate leading-none mt-0.5">
                                                                                                    {rel.pastaInterna || rel.contactName}
                                                                                                </span>
                                                                                            </div>
                                                                                        </button>
                                                                                    </DropdownMenuItem>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
                        </DialogHeader>

                        <Tabs value={modalTab} onValueChange={setModalTab} className="flex-1 flex flex-col min-h-0 w-full">
                            <TabsList className="grid grid-cols-5 mb-6 bg-slate-100/50 p-1 rounded-2xl h-12 flex-shrink-0 mx-8 mt-6">
                                        <TabsTrigger value="dados" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs gap-2">
                                            <FileText className="w-4 h-4" /> Dados
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

                                        <TabsTrigger value="historico" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs gap-2">
                                            <History className="w-4 h-4" /> Histórico
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="dados" className="flex-1 overflow-y-auto min-h-0 w-full px-8 pb-8 focus-visible:outline-none mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        
                                        {/* SEÇÃO: Imóvel da Locação */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between">
                                                <span className="flex items-center gap-2 text-slate-850 font-bold">
                                                    <Home className="w-4 h-4 text-emerald-500" />
                                                    Imóvel da Locação
                                                </span>
                                                <div className="flex items-center gap-3">
                                                    <button type="button" onClick={() => setShowVincularImovelModal(true)} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1">
                                                        <Plus className="w-3.5 h-3.5" /> Vincular Imóvel
                                                    </button>
                                                </div>
                                            </h3>
                                            
                                            <div className="w-full">
                                                {/* Left card (Property detail or placeholder) */}
                                                <div className="lg:col-span-2">
                                                    {atendimentoImoveis.filter(ai => ai.atendimentoRef === selectedCase?._id).length > 0 ? (
                                                        atendimentoImoveis
                                                            .filter(ai => ai.atendimentoRef === selectedCase?._id)
                                                            .map(ai => {
                                                                const imovel = imoveis.find(i => i._id === ai.imovelRef);
                                                                return (
                                                                    <Card key={ai._id} className="p-5 border-slate-150 hover:border-emerald-300 transition-all rounded-2xl flex flex-col sm:flex-row gap-5 shadow-sm bg-white overflow-hidden relative group">
                                                                        {imovel?.propertyImages?.[0] || imovel?.galeriaFotos?.[0] ? (
                                                                            <div className="w-full sm:w-32 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                                                                <img src={imovel.propertyImages?.[0] || imovel.galeriaFotos?.[0]} alt={imovel.tipoImovel} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                                            </div>
                                                                        ) : (
                                                                            <div className="w-full sm:w-32 h-24 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0 border border-slate-100">
                                                                                <Building2 className="w-8 h-8 animate-pulse text-slate-350" />
                                                                            </div>
                                                                        )}
                                                                        <div className="flex-1 flex flex-col justify-between">
                                                                            <div>
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">
                                                                                        {imovel?.codImovel || imovel?.codigoReference || 'SEM CÓDIGO'}
                                                                                    </span>
                                                                                    <span className="text-xs text-slate-400 font-medium">
                                                                                        {imovel?.tipoImovel}
                                                                                    </span>
                                                                                </div>
                                                                                <h4 className="text-base font-bold text-slate-800 mt-1.5 line-clamp-1">{imovel?.enderecoRua || imovel?.logradouro || 'Endereço não informado'}</h4>
                                                                                <p className="text-xs text-slate-500 mt-1">
                                                                                    {imovel?.bairro ? `${imovel.bairro}, ` : ''}{imovel?.cidade ? `${imovel.cidade} - ${imovel.estado || 'SP'}` : ''}
                                                                                </p>
                                                                            </div>
                                                                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                                                                                <div className="text-xs text-slate-400">
                                                                                    Valor do aluguel estimado: <span className="font-bold text-slate-800 text-sm">{imovel?.precoLocacao ? formatCurrency(imovel.precoLocacao) : 'Não informado'}</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    {imovel && (
                                                                                        <Button 
                                                                                            variant="ghost" 
                                                                                            size="sm" 
                                                                                            className="text-slate-650 hover:text-emerald-600 hover:bg-slate-50 font-bold text-xs gap-1 rounded-xl h-8 px-3"
                                                                                            onClick={() => handleOpenEditImovelModal(imovel)}
                                                                                        >
                                                                                            <Edit2 className="w-3.5 h-3.5" />
                                                                                            Editar
                                                                                        </Button>
                                                                                    )}
                                                                                    <Button 
                                                                                        variant="ghost" 
                                                                                        size="sm" 
                                                                                        className="text-red-500 hover:text-red-650 hover:bg-red-50 font-bold text-xs gap-1 rounded-xl h-8 px-3"
                                                                                        onClick={() => handleUnlinkImovel(ai._id)}
                                                                                    >
                                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                                        Desvincular
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </Card>
                                                                );
                                                            })
                                                    ) : (
                                                        <div className="text-center p-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl text-slate-400 h-full flex flex-col justify-center items-center">
                                                            <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                                                            <p className="text-sm font-semibold">Nenhum imóvel vinculado.</p>
                                                            <p className="text-xs mt-1">Selecione e vincule o imóvel correspondente no painel ao lado.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                                 
                                                 {/* Valores da Locação */}
                                                 {currentModalities.some(m => m.toLowerCase() === 'locação' || m.toLowerCase() === 'aluguel') && (
                                                     <Card className="p-6 border-slate-100 shadow-sm rounded-2xl">
                                                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                        <DollarSign className="w-4 h-4 text-emerald-500" />
                                                        Valores Negociados da Locação
                                                    </h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <Label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Valor do Aluguel</Label>
                                                            <CurrencyInput
                                                                className="h-11 bg-slate-50 border-none rounded-xl text-lg font-bold text-slate-850 focus-visible:ring-emerald-500 w-full"
                                                                value={selectedCase?.rentValue}
                                                                onValueChange={val => {
                                                                    setSelectedCase(prev => prev ? { ...prev, rentValue: val } : null);
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center justify-end h-full">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-8 border-secondary text-secondary hover:bg-secondary/15 gap-2 font-bold rounded-lg text-xs"
                                                                    onClick={() => {
                                                                        const partesAtuais = atendimentoPartes.filter(p => p.serviceRecordRef === selectedCase?._id);
                                                                        const locadores = partesAtuais.filter(p => p.roleInService === 'Locador');
                                                                        const locatarios = partesAtuais.filter(p => p.roleInService === 'Locatário');
                                                                        
                                                                        if (locadores.length === 0 || locatarios.length === 0) {
                                                                            toast.error('O contrato precisa ter pelo menos um locador e um locatário.');
                                                                            return;
                                                                        }

                                                                        const hasMissingInfo = partesAtuais.some(part => {
                                                                            const client = clients.find(c => c._id === part.clientRef);
                                                                            if (!client) return true;
                                                                            
                                                                            const isPessoaJuridica = client.tipoPessoa === 'JURÍDICA' || (client.cpfCnpj && client.cpfCnpj.length > 14);
                                                                            
                                                                            if (!client.clientName || !client.cpfCnpj || !client.email || !client.phoneNumber || !client.address) {
                                                                                return true;
                                                                            }
                                                                            
                                                                            if (!isPessoaJuridica) {
                                                                                if (!(client as any).rg || !(client as any).profession || !(client as any).nationality || !(client as any).maritalStatus) {
                                                                                    return true;
                                                                                }
                                                                            }
                                                                            
                                                                            return false;
                                                                        });

                                                                        if (hasMissingInfo) {
                                                                            toast.error('Preencha todas as informações obrigatórias de todas as partes (nome, CPF, RG, etc) antes de gerar o contrato. Clique em "Editar" nas partes vinculadas.');
                                                                            return;
                                                                        }

                                                                        setIsWizardOpen(true);
                                                                    }}
                                                                >
                                                                    <FileText className="w-3.5 h-3.5" />
                                                                    Gerar Contrato
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    </Card>
                                                 )}

                                                 {/* Valores da Venda */}
                                                 {currentModalities.some(m => m.toLowerCase() === 'venda' || m.toLowerCase() === 'compra') && (
                                                     <Card className="p-6 border-slate-100 shadow-sm rounded-2xl">
                                                         <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                             <DollarSign className="w-4 h-4 text-emerald-500" />
                                                             Valores Negociados da Venda
                                                         </h3>
                                                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                             <div>
                                                                 <Label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Valor da Venda</Label>
                                                                 <CurrencyInput
                                                                     className="h-11 bg-slate-50 border-none rounded-xl text-lg font-bold text-slate-850 focus-visible:ring-emerald-500 w-full"
                                                                     value={selectedCase?.propertyValue}
                                                                     onValueChange={val => {
                                                                         setSelectedCase(prev => prev ? { ...prev, propertyValue: val } : null);
                                                                     }}
                                                                 />
                                                             </div>
                                                         </div>
                                                     </Card>
                                                 )}

                                                {/* Partes Vinculadas ao Contrato */}
                                                <Card className="p-6 border-slate-100 shadow-sm rounded-2xl">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                            <Users className="w-4 h-4 text-emerald-500" />
                                                            Partes Vinculadas ao Contrato ({atendimentoPartes.filter(p => p.serviceRecordRef === selectedCase?._id).length})
                                                        </h3>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowVincularParteModal(true)}
                                                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                            Vincular Nova Parte
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                                        {atendimentoPartes.filter(p => p.serviceRecordRef === selectedCase?._id).length === 0 ? (
                                                            <div className="text-center py-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
                                                                <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                                                <p className="text-xs font-medium text-slate-500">Nenhuma parte vinculada ainda</p>
                                                                <p className="text-[10px] text-slate-400 mt-0.5">Clique em "Vincular Nova Parte" para começar.</p>
                                                            </div>
                                                        ) : (
                                                            atendimentoPartes
                                                                .filter(p => p.serviceRecordRef === selectedCase?._id)
                                                                .map((part) => {
                                                                    const client = clients.find(c => c._id === part.clientRef);
                                                                    return (
                                                                        <div key={part._id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                                                                            <div className="flex items-center gap-3.5 min-w-0">
                                                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[11px] flex-shrink-0 ${
                                                                                    part.roleInService === 'Locatário' ? 'bg-purple-100 text-purple-700' :
                                                                                    part.roleInService === 'Locador' ? 'bg-emerald-100 text-emerald-700' :
                                                                                    'bg-amber-100 text-amber-700'
                                                                                }`}>
                                                                                    {part.roleInService === 'Locatário' ? 'LT' : part.roleInService === 'Locador' ? 'LD' : 'FD'}
                                                                                </div>
                                                                                <div className="min-w-0">
                                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                                        <span className="text-sm font-bold text-slate-800 truncate">{client?.clientName || 'Cliente desconhecido'}</span>
                                                                                        <Badge className={`text-[9px] font-bold border-none px-2 py-0.5 rounded-full flex-shrink-0 ${
                                                                                            part.roleInService === 'Locatário' ? 'bg-purple-100 text-purple-700 hover:bg-purple-100' :
                                                                                            part.roleInService === 'Locador' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' :
                                                                                            'bg-amber-100 text-amber-700 hover:bg-amber-100'
                                                                                        }`}>
                                                                                            {part.roleInService || 'Locatário'}
                                                                                        </Badge>
                                                                                    </div>
                                                                                    <p className="text-xs text-slate-500 truncate mt-0.5">
                                                                                        CPF/CNPJ: {client?.cpfCnpj ? formatCPF(client.cpfCnpj) : '—'} • E-mail: {client?.email || '—'}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-8 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl text-xs gap-1 px-2"
                                                                                    onClick={() => {
                                                                                        if (client) {
                                                                                            setEditingParte({ parteId: part._id, clientId: client._id });
                                                                                            setEditingParteForm({
                                                                                                clientName: client.clientName || '',
                                                                                                cpfCnpj: client.cpfCnpj || '',
                                                                                                email: client.email || '',
                                                                                                phoneNumber: client.phoneNumber || '',
                                                                                                rg: (client as any).rg || '',
                                                                                                nationality: (client as any).nationality || 'Brasileiro(a)',
                                                                                                profession: (client as any).profession || '',
                                                                                                maritalStatus: (client as any).maritalStatus || 'Solteiro(a)',
                                                                                                address: client.address || '',
                                                                                            });
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                                    Editar
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl flex-shrink-0"
                                                                                    onClick={async () => {
                                                                                        if (confirm('Tem certeza que deseja remover esta parte deste processo?')) {
                                                                                            setIsSavingLocacao(true);
                                                                                            try {
                                                                                                await BaseCrudService.delete('atendimentopartes', part._id);
                                                                                                toast.success('Parte desvinculada com sucesso!');
                                                                                                await loadData();
                                                                                            } catch (err) {
                                                                                                toast.error('Erro ao remover parte.');
                                                                                            } finally {
                                                                                                setIsSavingLocacao(false);
                                                                                            }
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })
                                                        )}
                                                    </div>
                                                </Card>



                                                {/* Notas Internas Card */}
                                                <Card className="p-6 border-slate-100 shadow-sm rounded-2xl">
                                                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                        <ClipboardList className="w-4 h-4 text-amber-500" />
                                                        Notas Internas do Atendimento
                                                    </h3>
                                                    <Textarea
                                                        className="min-h-[120px] bg-slate-50 border-none rounded-xl text-sm italic focus-visible:ring-emerald-500"
                                                        placeholder="Digite observações importantes sobre este atendimento..."
                                                        value={selectedCase?.notes || ''}
                                                        onChange={e => setSelectedCase(prev => prev ? { ...prev, notes: e.target.value } : null)}
                                                    />
                                                </Card>

                                            </div>
                                    </TabsContent>

                                    <TabsContent value="pendencias" className="flex-1 overflow-y-auto min-h-0 w-full px-8 pb-8 focus-visible:outline-none mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {selectedCase && (
                                            <TasksAndPendenciesTabs
                                                atendimentoRef={selectedCase._id}
                                                serviceType="locacoes"
                                                tab="pendencias"
                                                clients={clients}
                                                users={users}
                                                onSuccess={loadData}
                                            />
                                        )}
                                    </TabsContent>

                                    <TabsContent value="tarefas" className="flex-1 overflow-y-auto min-h-0 w-full px-8 pb-8 focus-visible:outline-none mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {selectedCase && (
                                            <TasksAndPendenciesTabs
                                                atendimentoRef={selectedCase._id}
                                                serviceType="locacoes"
                                                tab="tarefas"
                                                clients={clients}
                                                users={users}
                                                onSuccess={loadData}
                                            />
                                        )}
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
                                                    ? 'border-emerald-400 bg-emerald-50 scale-[1.01]'
                                                    : 'border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/50'
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
                                                            <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                                                                <File className="w-4 h-4 text-emerald-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-800">{doc.name}</p>
                                                                <p className="text-[10px] text-slate-400">{(doc.size / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <a href={doc.url} download={doc.name} onClick={e => e.stopPropagation()}>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600">
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

                                    <TabsContent value="imoveis" className="flex-1 overflow-y-auto min-h-0 w-full px-8 pb-8 focus-visible:outline-none mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* Formulário de Vínculo de Imóvel */}
                                            <Card className="p-6 border-slate-100 shadow-sm rounded-2xl lg:col-span-1 bg-slate-50/30">
                                                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-emerald-500" />
                                                    Vincular Imóvel
                                                </h3>
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold text-slate-700">Selecione o Imóvel</Label>
                                                        {selectedImovelId ? (
                                                            <div className="flex items-center justify-between p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                                                                        <Building2 className="w-4.5 h-4.5" />
                                                                    </div>
                                                                    <div className="text-left">
                                                                        <span className="text-xs font-black text-emerald-700 uppercase tracking-wider block">
                                                                            {imoveis.find(i => i._id === selectedImovelId)?.codImovel || imoveis.find(i => i._id === selectedImovelId)?.codigoReference || 'SEM CÓDIGO'}
                                                                        </span>
                                                                        <span className="text-xs text-slate-500 font-medium">
                                                                            {imoveis.find(i => i._id === selectedImovelId)?.tipoImovel} • {imoveis.find(i => i._id === selectedImovelId)?.bairro || 'Sem Bairro'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <Button 
                                                                    type="button"
                                                                    variant="ghost" 
                                                                    size="sm" 
                                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                                    onClick={() => {
                                                                        setSelectedImovelId('');
                                                                        setImovelSearchQuery('');
                                                                    }}
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <div className="relative">
                                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                    <Search className="h-4 w-4 text-slate-400" />
                                                                </div>
                                                                <Input
                                                                    type="text"
                                                                    placeholder="Buscar por código, endereço, proprietário..."
                                                                    className="pl-10 h-11 bg-white border border-slate-200 rounded-xl text-sm w-full focus-visible:ring-emerald-500"
                                                                    value={imovelSearchQuery}
                                                                    onChange={(e) => {
                                                                        setImovelSearchQuery(e.target.value);
                                                                        setIsImovelDropdownOpen(true);
                                                                    }}
                                                                    onFocus={() => setIsImovelDropdownOpen(true)}
                                                                    onBlur={() => setTimeout(() => setIsImovelDropdownOpen(false), 200)}
                                                                />
                                                                {isImovelDropdownOpen && (
                                                                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 shadow-xl rounded-xl max-h-64 overflow-y-auto p-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                                                        {imoveis
                                                                            .filter(i => {
                                                                                if (!imovelSearchQuery.trim()) return true;
                                                                                const q = imovelSearchQuery.toLowerCase().trim();
                                                                                const matchesCode = (i.codImovel || '').toLowerCase().includes(q) || (i.codigoReference || '').toLowerCase().includes(q);
                                                                                const matchesAddress = (i.enderecoRua || '').toLowerCase().includes(q) || 
                                                                                                       (i.logradouro || '').toLowerCase().includes(q) || 
                                                                                                       (i.bairro || '').toLowerCase().includes(q) || 
                                                                                                       (i.cidade || '').toLowerCase().includes(q);
                                                                                const matchesOwnerName = (i.nomeProprietario || '').toLowerCase().includes(q);
                                                                                const cleanPhoneQuery = q.replace(/\D/g, '');
                                                                                const matchesOwnerPhone = cleanPhoneQuery !== '' && (i.telefoneProprietario || '').replace(/\D/g, '').includes(cleanPhoneQuery);
                                                                                return matchesCode || matchesAddress || matchesOwnerName || matchesOwnerPhone;
                                                                            })
                                                                            .map(i => (
                                                                                <button
                                                                                    key={i._id}
                                                                                    type="button"
                                                                                    className="w-full flex flex-col items-start text-left p-3 rounded-lg hover:bg-slate-50 transition-colors"
                                                                                    onClick={() => {
                                                                                        setSelectedImovelId(i._id);
                                                                                        setIsImovelDropdownOpen(false);
                                                                                    }}
                                                                                >
                                                                                    <div className="flex items-center justify-between w-full">
                                                                                        <span className="text-xs font-bold text-slate-800">
                                                                                            {i.codImovel || i.codigoReference || 'SEM CÓDIGO'} - {i.tipoImovel}
                                                                                        </span>
                                                                                        {i.precoLocacao && (
                                                                                            <span className="text-xs font-bold text-emerald-600">
                                                                                                {formatCurrency(i.precoLocacao)}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <span className="text-xs text-slate-500 mt-0.5 line-clamp-1 text-left">
                                                                                        📍 {i.logradouro || i.enderecoRua || 'Sem rua'}, {i.numero || 'S/N'} - {i.bairro || 'Sem Bairro'}
                                                                                    </span>
                                                                                    {i.nomeProprietario && (
                                                                                        <span className="text-[10px] text-slate-400 mt-0.5 block text-left">
                                                                                            👤 Proprietário: {i.nomeProprietario} {i.telefoneProprietario ? `(${i.telefoneProprietario})` : ''}
                                                                                        </span>
                                                                                    )}
                                                                                </button>
                                                                            ))}
                                                                        {imoveis.filter(i => {
                                                                            if (!imovelSearchQuery.trim()) return true;
                                                                            const q = imovelSearchQuery.toLowerCase().trim();
                                                                            const matchesCode = (i.codImovel || '').toLowerCase().includes(q) || (i.codigoReference || '').toLowerCase().includes(q);
                                                                            const matchesAddress = (i.enderecoRua || '').toLowerCase().includes(q) || 
                                                                                                   (i.logradouro || '').toLowerCase().includes(q) || 
                                                                                                   (i.bairro || '').toLowerCase().includes(q) || 
                                                                                                   (i.cidade || '').toLowerCase().includes(q);
                                                                            const matchesOwnerName = (i.nomeProprietario || '').toLowerCase().includes(q);
                                                                            const cleanPhoneQuery = q.replace(/\D/g, '');
                                                                            const matchesOwnerPhone = cleanPhoneQuery !== '' && (i.telefoneProprietario || '').replace(/\D/g, '').includes(cleanPhoneQuery);
                                                                            return matchesCode || matchesAddress || matchesOwnerName || matchesOwnerPhone;
                                                                        }).length === 0 && (
                                                                            <div className="text-center py-4 text-xs text-slate-400">
                                                                                Nenhum imóvel correspondente encontrado.
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Button 
                                                        onClick={handleLinkImovel}
                                                        className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center justify-center mt-2"
                                                    >
                                                        <Plus className="w-4 h-4 mr-2" />
                                                        Vincular Imóvel
                                                    </Button>

                                                    <div className="text-center pt-2 border-t border-slate-100 mt-4">
                                                        <button 
                                                            type="button"
                                                            onClick={handleOpenNewImovelModal}
                                                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center justify-center gap-1 mx-auto"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                            Cadastrar Novo Imóvel
                                                        </button>
                                                    </div>
                                                </div>
                                            </Card>

                                            {/* Listagem de Imóveis Vinculados */}
                                            <div className="lg:col-span-2 space-y-4">
                                                <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between">
                                                    <span>Imóvel da Locação</span>
                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                                        {atendimentoImoveis.filter(ai => ai.atendimentoRef === selectedCase?._id).length} vinculado
                                                    </Badge>
                                                </h3>

                                                <div className="space-y-3">
                                                    {atendimentoImoveis
                                                        .filter(ai => ai.atendimentoRef === selectedCase?._id)
                                                        .map(ai => {
                                                            const imovel = imoveis.find(i => i._id === ai.imovelRef);
                                                            return (
                                                                <Card key={ai._id} className="p-5 border-slate-150 hover:border-emerald-300 transition-all rounded-2xl flex flex-col md:flex-row gap-5 shadow-sm bg-white overflow-hidden relative group">
                                                                    {imovel?.propertyImages?.[0] || imovel?.galeriaFotos?.[0] ? (
                                                                        <div className="w-full md:w-32 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                                                            <img src={imovel.propertyImages?.[0] || imovel.galeriaFotos?.[0]} alt={imovel.tipoImovel} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-full md:w-32 h-24 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0 border border-slate-100">
                                                                            <Building2 className="w-8 h-8" />
                                                                        </div>
                                                                    )}
                                                                    <div className="flex-1 flex flex-col justify-between">
                                                                        <div>
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">
                                                                                    {imovel?.codImovel || imovel?.codigoReference || 'SEM CÓDIGO'}
                                                                                </span>
                                                                                <span className="text-xs text-slate-400 font-medium">
                                                                                    {imovel?.tipoImovel}
                                                                                </span>
                                                                            </div>
                                                                            <h4 className="text-base font-bold text-slate-800 mt-1.5">{imovel?.enderecoRua || imovel?.logradouro || 'Endereço não informado'}</h4>
                                                                            <p className="text-xs text-slate-500 mt-1">
                                                                                {imovel?.bairro ? `${imovel.bairro}, ` : ''}{imovel?.cidade ? `${imovel.cidade} - ${imovel.estado || 'SP'}` : ''}
                                                                            </p>
                                                                        </div>
                                                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                                                                            <div className="text-xs text-slate-400">
                                                                                Valor do aluguel estimado: <span className="font-bold text-slate-800 text-sm">{imovel?.precoLocacao ? formatCurrency(imovel.precoLocacao) : 'Não informado'}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                {imovel && (
                                                                                    <Button 
                                                                                        variant="ghost" 
                                                                                        size="sm" 
                                                                                        className="text-slate-600 hover:text-emerald-600 hover:bg-slate-50 font-bold text-xs gap-1 rounded-xl h-8 px-3"
                                                                                        onClick={() => handleOpenEditImovelModal(imovel)}
                                                                                    >
                                                                                        <Edit2 className="w-3.5 h-3.5" />
                                                                                        Editar
                                                                                    </Button>
                                                                                )}
                                                                                <Button 
                                                                                    variant="ghost" 
                                                                                    size="sm" 
                                                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-xs gap-1 rounded-xl h-8 px-3"
                                                                                    onClick={() => handleUnlinkImovel(ai._id)}
                                                                                >
                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                    Desvincular
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </Card>
                                                            );
                                                        })}

                                                    {atendimentoImoveis.filter(ai => ai.atendimentoRef === selectedCase?._id).length === 0 && (
                                                        <div className="text-center p-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl text-slate-400">
                                                            <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                                                            <p className="text-sm font-medium">Nenhum imóvel vinculado.</p>
                                                            <p className="text-xs mt-1">Selecione e vincule o imóvel correspondente no painel ao lado.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="historico" className="flex-1 overflow-y-auto min-h-0 w-full px-8 pb-8 focus-visible:outline-none mt-0">
                                        <div className="space-y-6">
                                            <div className="relative pl-8 border-l-2 border-slate-100 space-y-8">
                                                <div className="relative">
                                                    <div className="absolute -left-[37px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Hoje</p>
                                                    <p className="text-sm font-bold text-slate-800">Processo criado no sistema</p>
                                                    <p className="text-xs text-slate-500 mt-1">Status inicial definido como "{selectedCase?.status}"</p>
                                                </div>
                                            </div>

                                            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-4">
                                                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                                                    <Button variant="outline" className="text-red-500 border-red-100 hover:text-red-600 hover:bg-red-50 gap-2 px-8 rounded-xl font-bold">
                                                        <Trash2 className="w-5 h-5" /> Cancelar Processo
                                                    </Button>
                                                    <Button
                                                        onClick={handleConcluirProcesso}
                                                        disabled={isSavingLocacao || selectedCase?.status === 'Concluídos'}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-8 rounded-xl font-bold shadow-lg shadow-emerald-200"
                                                    >
                                                        <CheckCircle2 className="w-5 h-5" /> Concluir e Arquivar Processo
                                                    </Button>
                                                </div>
                                                <p className="text-center text-xs text-slate-500 mt-1">
                                                    Ao concluir, o negócio será movido para a etapa de "Concluídos". Ao cancelar, o processo é encerrado.
                                                </p>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>

                        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end items-center flex-shrink-0 gap-3">
                            <Button variant="outline" className="rounded-xl px-6" onClick={() => setShowDetailsModal(false)}>Fechar</Button>
                            <Button disabled={isSavingLocacao} onClick={handleSaveLocacaoData} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 font-bold shadow-lg shadow-emerald-200">
                                {isSavingLocacao ? 'Salvando...' : 'Salvar Alterações'}
                            </Button>
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

                {/* Edit Parte (Locador/Locatário) Dialog */}
                <Dialog open={!!editingParte} onOpenChange={(open) => { if (!open) setEditingParte(null); }}>
                    <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden rounded-3xl flex flex-col bg-white border border-slate-100 shadow-2xl">
                        <DialogHeader className="px-8 py-5 border-b border-slate-100 bg-slate-50/60 flex flex-row justify-between items-center flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                                    <UserCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-bold text-slate-800">Editar Dados da Parte</DialogTitle>
                                    <p className="text-xs text-slate-500 mt-0.5">Atualize as informações do locador ou locatário.</p>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="overflow-y-auto px-8 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Nome */}
                                <div className="md:col-span-2 space-y-1.5">
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Nome Completo *</Label>
                                    <Input
                                        className="h-11 bg-slate-50 border-none rounded-xl text-sm"
                                        placeholder="Nome completo"
                                        value={editingParteForm.clientName || ''}
                                        onChange={e => setEditingParteForm(p => ({ ...p, clientName: e.target.value }))}
                                    />
                                </div>
                                {/* CPF/CNPJ */}
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">CPF / CNPJ</Label>
                                    <Input
                                        className="h-11 bg-slate-50 border-none rounded-xl text-sm"
                                        placeholder="000.000.000-00"
                                        value={editingParteForm.cpfCnpj || ''}
                                        onChange={e => setEditingParteForm(p => ({ ...p, cpfCnpj: e.target.value }))}
                                    />
                                </div>
                                {/* RG */}
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">RG</Label>
                                    <Input
                                        className="h-11 bg-slate-50 border-none rounded-xl text-sm"
                                        placeholder="00.000.000-0"
                                        value={(editingParteForm as any).rg || ''}
                                        onChange={e => setEditingParteForm(p => ({ ...p, rg: e.target.value } as any))}
                                    />
                                </div>
                                {/* Email */}
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">E-mail</Label>
                                    <Input
                                        type="email"
                                        className="h-11 bg-slate-50 border-none rounded-xl text-sm"
                                        placeholder="email@exemplo.com"
                                        value={editingParteForm.email || ''}
                                        onChange={e => setEditingParteForm(p => ({ ...p, email: e.target.value }))}
                                    />
                                </div>
                                {/* Telefone */}
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Telefone</Label>
                                    <Input
                                        className="h-11 bg-slate-50 border-none rounded-xl text-sm"
                                        placeholder="(11) 99999-9999"
                                        value={editingParteForm.phoneNumber || ''}
                                        onChange={e => setEditingParteForm(p => ({ ...p, phoneNumber: e.target.value }))}
                                    />
                                </div>
                                {/* Profissão */}
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Profissão</Label>
                                    <Input
                                        className="h-11 bg-slate-50 border-none rounded-xl text-sm"
                                        placeholder="Ex: Engenheiro, Médico..."
                                        value={(editingParteForm as any).profession || ''}
                                        onChange={e => setEditingParteForm(p => ({ ...p, profession: e.target.value } as any))}
                                    />
                                </div>
                                {/* Nacionalidade */}
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Nacionalidade</Label>
                                    <Input
                                        className="h-11 bg-slate-50 border-none rounded-xl text-sm"
                                        placeholder="Ex: Brasileiro(a)"
                                        value={(editingParteForm as any).nationality || ''}
                                        onChange={e => setEditingParteForm(p => ({ ...p, nationality: e.target.value } as any))}
                                    />
                                </div>
                                {/* Estado Civil */}
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Estado Civil</Label>
                                    <Select value={(editingParteForm as any).maritalStatus || 'Solteiro(a)'} onValueChange={val => setEditingParteForm(p => ({ ...p, maritalStatus: val } as any))}>
                                        <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border border-slate-100 rounded-xl shadow-lg">
                                            <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                                            <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                                            <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                                            <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                                            <SelectItem value="União Estável">União Estável</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {/* Endereço */}
                                <div className="md:col-span-2 space-y-1.5">
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Endereço Completo</Label>
                                    <Input
                                        className="h-11 bg-slate-50 border-none rounded-xl text-sm"
                                        placeholder="Rua, número, bairro, cidade - UF"
                                        value={editingParteForm.address || ''}
                                        onChange={e => setEditingParteForm(p => ({ ...p, address: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-5 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0 bg-slate-50/40">
                            <Button variant="ghost" className="h-11 rounded-xl text-slate-600 font-bold" onClick={() => setEditingParte(null)}>
                                Cancelar
                            </Button>
                            <Button
                                className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                                disabled={isSavingParte}
                                onClick={async () => {
                                    if (!editingParte) return;
                                    setIsSavingParte(true);
                                    try {
                                        await BaseCrudService.update('clientes', { _id: editingParte.clientId, ...editingParteForm });
                                        toast.success('Dados atualizados com sucesso!');
                                        await loadData();
                                        setEditingParte(null);
                                    } catch (err) {
                                        toast.error('Erro ao salvar. Tente novamente.');
                                    } finally {
                                        setIsSavingParte(false);
                                    }
                                }}
                            >
                                {isSavingParte ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : <><Save className="w-4 h-4 mr-2" />Salvar Alterações</>}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>


                {/* Modal de Vincular Parte */}
                <Dialog open={showVincularParteModal} onOpenChange={setShowVincularParteModal}>
                    <DialogContent className="max-w-[420px] p-6 bg-white border-slate-100 rounded-3xl shadow-xl outline-none border-0">
                        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                                    <Plus className="w-4 h-4 text-indigo-500" />
                                                    Vincular Nova Parte
                                                </h3>
                                                
                                                <div className="space-y-4">
                                                    <div className="relative">
                                                        <Label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Buscar Cliente</Label>
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <Search className="h-4 w-4 text-slate-400" />
                                                            </div>
                                                            <Input
                                                                type="text"
                                                                placeholder="Nome ou CPF/CNPJ..."
                                                                className="pl-10 h-11 bg-slate-50 border-none rounded-xl text-sm w-full"
                                                                value={partClientSearchQuery}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setPartClientSearchQuery(val);
                                                                    setIsPartDropdownOpen(true);
                                                                    if (selectedPartClient && val !== selectedPartClient.clientName) {
                                                                        setSelectedPartClient(null);
                                                                    }
                                                                }}
                                                                onFocus={() => setIsPartDropdownOpen(true)}
                                                                onBlur={() => setTimeout(() => setIsPartDropdownOpen(false), 200)}
                                                            />
                                                            {isPartDropdownOpen && (
                                                                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 shadow-xl rounded-xl max-h-60 overflow-y-auto p-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                                                    {clients
                                                                        .filter(c => {
                                                                            const q = partClientSearchQuery.toLowerCase();
                                                                            return (c.clientName || '').toLowerCase().includes(q) || 
                                                                                   (c.cpfCnpj || '').replace(/\D/g, '').includes(q.replace(/\D/g, ''));
                                                                        })
                                                                        .slice(0, 5)
                                                                        .map((c) => (
                                                                            <button
                                                                                key={c._id}
                                                                                type="button"
                                                                                className="w-full flex flex-col items-start text-left p-3 rounded-lg hover:bg-slate-50 transition-colors"
                                                                                onClick={() => {
                                                                                    setSelectedPartClient(c);
                                                                                    setPartClientSearchQuery(c.clientName || '');
                                                                                    setIsPartDropdownOpen(false);
                                                                                }}
                                                                            >
                                                                                <span className="text-sm font-bold text-slate-800">{c.clientName}</span>
                                                                                <span className="text-xs text-slate-500 mt-0.5">
                                                                                    CPF/CNPJ: {c.cpfCnpj ? formatCPF(c.cpfCnpj) : '—'}
                                                                                </span>
                                                                            </button>
                                                                        ))}
                                                                    <div className="border-t border-slate-50 mt-1 pt-1">
                                                                        <button
                                                                            type="button"
                                                                            className="w-full flex items-center justify-center gap-2 p-2.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50/50 rounded-lg transition-colors"
                                                                            onClick={() => {
                                                                                setActiveModalTrigger('partes');
                                                                                setShowNewClientModal(true);
                                                                                setShowVincularParteModal(false);
                                                                                setIsPartDropdownOpen(false);
                                                                            }}
                                                                        >
                                                                            <Plus className="w-4 h-4" />
                                                                            Cadastrar Novo Cliente
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <Label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Papel / Função</Label>
                                                        <Select value={selectedPartRole} onValueChange={setSelectedPartRole}>
                                                            <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl">
                                                                <SelectValue placeholder="Selecione o papel..." />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-white border border-slate-100 rounded-xl shadow-lg">
                                                                <SelectItem value="Locatário" className="rounded-lg">Locatário (Inquilino)</SelectItem>
                                                                <SelectItem value="Locador" className="rounded-lg">Locador (Proprietário)</SelectItem>
                                                                <SelectItem value="Fiador" className="rounded-lg">Fiador</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <p className="text-xs text-slate-400 italic">
                                                        Dica: Digite o nome no campo acima e selecione o cliente, depois escolha a função desejada e clique em Vincular Parte abaixo.
                                                    </p>

                                                    <Button
                                                        onClick={handleConfirmVincularParte}
                                                        disabled={!selectedPartClient || isSavingLocacao}
                                                        className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all mt-2"
                                                    >
                                                        {isSavingLocacao ? 'Vinculando...' : 'Vincular Parte'}
                                                    </Button>
                                                </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={showNewClientModal} onOpenChange={setShowNewClientModal}>
                    <DialogContent className="max-w-4xl h-[90vh] max-h-[90vh] p-0 gap-0 overflow-hidden rounded-3xl flex flex-col bg-white border border-slate-100 shadow-2xl">
                        <DialogHeader className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 backdrop-blur-md sticky top-0 z-10 flex flex-row justify-between items-center flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
                                    <UserCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold text-slate-800">
                                        Novo Cadastro de Cliente
                                    </DialogTitle>
                                    <p className="text-xs text-slate-500 mt-1">Preencha todos os dados cadastrais solicitados para geração do contrato.</p>
                                </div>
                            </div>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100" 
                                onClick={() => setShowNewClientModal(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto min-h-0 w-full px-8 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                                {/* Row 1: Tipo Pessoa & CPF/CNPJ */}
                                <div className="space-y-2">
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Tipo de Pessoa</Label>
                                    <Select 
                                        value={newClientFormData.tipoPessoa || 'FÍSICA'} 
                                        onValueChange={(val) => setNewClientFormData(prev => ({ ...prev, tipoPessoa: val as 'FÍSICA' | 'JURÍDICA' }))}
                                    >
                                        <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border border-slate-100 rounded-xl shadow-lg">
                                            <SelectItem value="FÍSICA" className="rounded-lg">Pessoa Física</SelectItem>
                                            <SelectItem value="JURÍDICA" className="rounded-lg">Pessoa Jurídica</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">CPF / CNPJ *</Label>
                                    <Input
                                        type="text"
                                        placeholder={newClientFormData.tipoPessoa === 'JURÍDICA' ? '00.000.000/0000-00' : '000.000.000-00'}
                                        className="h-11 bg-slate-50 border-none rounded-xl text-sm"
                                        value={newClientFormData.cpfCnpj || ''}
                                        onChange={(e) => handleCpfCnpjChange(e.target.value)}
                                    />
                                </div>

                                {/* Row 2: Nome Completo & RG */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                                        {newClientFormData.tipoPessoa === 'JURÍDICA' ? 'Razão Social / Nome Fantasia *' : 'Nome Completo *'}
                                    </Label>
                                    <Input
                                        type="text"
                                        placeholder={newClientFormData.tipoPessoa === 'JURÍDICA' ? 'Ex: R. Sales Empreendimentos LTDA' : 'Ex: Gabriel Souza Santos'}
                                        className="h-11 bg-slate-50 border-none rounded-xl text-sm"
                                        value={newClientFormData.clientName || ''}
                                        onChange={(e) => setNewClientFormData(prev => ({ ...prev, clientName: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                                        {newClientFormData.tipoPessoa === 'JURÍDICA' ? 'Inscrição Estadual' : 'RG / Órgão Expedidor'}
                                    </Label>
                                    <Input
                                        type="text"
                                        placeholder={newClientFormData.tipoPessoa === 'JURÍDICA' ? 'Isento ou 000.000.000' : 'Ex: 12.345.678-9 SSP/SP'}
                                        className="h-11 bg-slate-50 border-none rounded-xl text-sm"
                                        value={newClientFormData.rg || ''}
                                        onChange={(e) => setNewClientFormData(prev => ({ ...prev, rg: e.target.value }))}
                                    />
                                </div>

                                {/* Row 3: E-mail & Telefone */}
                                <div className="space-y-2">
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">E-mail</Label>
                                    <Input
                                        type="email"
                                        placeholder="Ex: cliente@email.com"
                                        className="h-11 bg-slate-50 border-none rounded-xl text-sm"
                                        value={newClientFormData.email || ''}
                                        onChange={(e) => setNewClientFormData(prev => ({ ...prev, email: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Telefone / WhatsApp</Label>
                                    <Input
                                        type="text"
                                        placeholder="Ex: (11) 99999-9999"
                                        className="h-11 bg-slate-50 border-none rounded-xl text-sm"
                                        value={newClientFormData.phoneNumber || ''}
                                        onChange={(e) => handlePhoneChange(e.target.value)}
                                    />
                                </div>

                                {/* Row 4: Nacionalidade, Estado Civil & Gênero */}
                                <div className="space-y-2">
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Nacionalidade</Label>
                                    <Input
                                        type="text"
                                        placeholder="Ex: Brasileiro(a)"
                                        className="h-11 bg-slate-50 border-none rounded-xl text-sm"
                                        value={newClientFormData.nationality || ''}
                                        onChange={(e) => setNewClientFormData(prev => ({ ...prev, nationality: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Estado Civil</Label>
                                    <Select 
                                        value={newClientFormData.maritalStatus || 'Solteiro(a)'} 
                                        onValueChange={(val) => setNewClientFormData(prev => ({ ...prev, maritalStatus: val }))}
                                    >
                                        <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border border-slate-100 rounded-xl shadow-lg">
                                            <SelectItem value="Solteiro(a)" className="rounded-lg">Solteiro(a)</SelectItem>
                                            <SelectItem value="Casado(a)" className="rounded-lg">Casado(a)</SelectItem>
                                            <SelectItem value="Divorciado(a)" className="rounded-lg">Divorciado(a)</SelectItem>
                                            <SelectItem value="Viúvo(a)" className="rounded-lg">Viúvo(a)</SelectItem>
                                            <SelectItem value="União Estável" className="rounded-lg">União Estável</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Gênero</Label>
                                    <Select 
                                        value={newClientFormData.gender || 'Masculino'} 
                                        onValueChange={(val) => setNewClientFormData(prev => ({ ...prev, gender: val as 'Masculino' | 'Feminino' | 'Outro' }))}
                                    >
                                        <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border border-slate-100 rounded-xl shadow-lg">
                                            <SelectItem value="Masculino" className="rounded-lg">Masculino</SelectItem>
                                            <SelectItem value="Feminino" className="rounded-lg">Feminino</SelectItem>
                                            <SelectItem value="Outro" className="rounded-lg">Outro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Profissão</Label>
                                    <Input
                                        type="text"
                                        placeholder="Ex: Engenheiro(a) Civil"
                                        className="h-11 bg-slate-50 border-none rounded-xl text-sm"
                                        value={newClientFormData.profession || ''}
                                        onChange={(e) => setNewClientFormData(prev => ({ ...prev, profession: e.target.value }))}
                                    />
                                </div>

                                {/* Row 5: Endereço Completo */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Endereço Completo</Label>
                                    <Input
                                        type="text"
                                        placeholder="Ex: Av. Paulista, 1000 - Apto 51 - Bela Vista, São Paulo/SP - CEP 01310-100"
                                        className="h-11 bg-slate-50 border-none rounded-xl text-sm"
                                        value={newClientFormData.address || ''}
                                        onChange={(e) => setNewClientFormData(prev => ({ ...prev, address: e.target.value }))}
                                    />
                                </div>

                                {/* Row 6: Notas / Observações */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Observações / Notas</Label>
                                    <Textarea
                                        placeholder="Informações adicionais como referências comerciais, conjugais ou de renda..."
                                        className="bg-slate-50 border-none rounded-xl text-sm min-h-[100px] resize-none"
                                        value={newClientFormData.notes || ''}
                                        onChange={(e) => setNewClientFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
                            <Button 
                                type="button"
                                variant="outline" 
                                className="rounded-xl px-6 h-11 text-slate-600 border-slate-200 hover:bg-slate-100 transition-colors" 
                                onClick={() => setShowNewClientModal(false)}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                disabled={isSavingLocacao} 
                                onClick={handleCreateNewClientFromPopup} 
                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-11 font-bold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
                            >
                                {isSavingLocacao ? 'Salvando...' : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Salvar e Vincular
                                    </>
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Modal de Vincular Imóvel */}
                <Dialog open={showVincularImovelModal} onOpenChange={setShowVincularImovelModal}>
                    <DialogContent className="max-w-[420px] p-6 bg-white border-slate-100 rounded-3xl shadow-xl outline-none border-0">
                        <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                                        <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                                                        Vincular Imóvel
                                                    </p>

                                                    {selectedImovelId ? (
                                                        <div className="flex items-center justify-between p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
                                                                    <Building2 className="w-3.5 h-3.5" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block truncate">
                                                                        {imoveis.find(i => i._id === selectedImovelId)?.codImovel || imoveis.find(i => i._id === selectedImovelId)?.codigoReference || 'SEM CÓDIGO'}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-500 truncate block">
                                                                        {imoveis.find(i => i._id === selectedImovelId)?.tipoImovel} • {imoveis.find(i => i._id === selectedImovelId)?.bairro || 'Sem Bairro'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0" onClick={() => { setSelectedImovelId(''); setImovelSearchQuery(''); }}>
                                                                <X className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <Search className="h-3.5 w-3.5 text-slate-400" />
                                                            </div>
                                                            <Input
                                                                type="text"
                                                                placeholder="Código, endereço, proprietário..."
                                                                className="pl-9 h-10 bg-white border-slate-200 rounded-xl text-xs w-full focus-visible:ring-emerald-500"
                                                                value={imovelSearchQuery}
                                                                onChange={(e) => { setImovelSearchQuery(e.target.value); setIsImovelDropdownOpen(true); }}
                                                                onFocus={() => setIsImovelDropdownOpen(true)}
                                                                onBlur={() => setTimeout(() => setIsImovelDropdownOpen(false), 200)}
                                                            />
                                                            {isImovelDropdownOpen && (
                                                                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 shadow-xl rounded-xl max-h-56 overflow-y-auto p-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                                                    {imoveis
                                                                        .filter(i => {
                                                                            if (!imovelSearchQuery.trim()) return true;
                                                                            const q = imovelSearchQuery.toLowerCase().trim();
                                                                            return (i.codImovel || '').toLowerCase().includes(q) ||
                                                                                   (i.codigoReference || '').toLowerCase().includes(q) ||
                                                                                   (i.enderecoRua || '').toLowerCase().includes(q) ||
                                                                                   (i.logradouro || '').toLowerCase().includes(q) ||
                                                                                   (i.bairro || '').toLowerCase().includes(q) ||
                                                                                   (i.cidade || '').toLowerCase().includes(q) ||
                                                                                   (i.nomeProprietario || '').toLowerCase().includes(q) ||
                                                                                   (imovelSearchQuery.replace(/\D/g, '') !== '' && (i.telefoneProprietario || '').replace(/\D/g, '').includes(imovelSearchQuery.replace(/\D/g, '')));
                                                                        })
                                                                        .map(i => (
                                                                            <button
                                                                                key={i._id}
                                                                                type="button"
                                                                                className="w-full flex flex-col items-start text-left p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                                                                                onClick={() => { setSelectedImovelId(i._id); setIsImovelDropdownOpen(false); }}
                                                                            >
                                                                                <div className="flex items-center justify-between w-full">
                                                                                    <span className="text-xs font-bold text-slate-800">{i.codImovel || i.codigoReference || 'SEM CÓD'} - {i.tipoImovel}</span>
                                                                                    {i.precoLocacao && <span className="text-xs font-bold text-emerald-600">{formatCurrency(i.precoLocacao)}</span>}
                                                                                </div>
                                                                                <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">📍 {i.logradouro || i.enderecoRua || 'Sem rua'}, {i.numero || 'S/N'} - {i.bairro}</span>
                                                                                {i.nomeProprietario && <span className="text-[10px] text-slate-400 mt-0.5">👤 {i.nomeProprietario}</span>}
                                                                            </button>
                                                                        ))}
                                                                    {imoveis.filter(i => {
                                                                        if (!imovelSearchQuery.trim()) return true;
                                                                        const q = imovelSearchQuery.toLowerCase().trim();
                                                                        return (i.codImovel || '').toLowerCase().includes(q) || (i.logradouro || '').toLowerCase().includes(q) || (i.nomeProprietario || '').toLowerCase().includes(q);
                                                                    }).length === 0 && (
                                                                        <div className="text-center py-3 text-xs text-slate-400">Nenhum imóvel encontrado.</div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <Button
                                                        onClick={handleLinkImovel}
                                                        className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center"
                                                    >
                                                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                                                        Vincular Imóvel
                                                    </Button>

                                                    <button
                                                        type="button"
                                                        onClick={() => { handleOpenNewImovelModal(); setShowVincularImovelModal(false); }}
                                                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        Cadastrar Novo Imóvel
                                                    </button>
                    </DialogContent>
                </Dialog>

                <Dialog open={showNewImovelModal} onOpenChange={setShowNewImovelModal}>
                    <DialogContent className="max-w-4xl h-[90vh] max-h-[90vh] p-0 gap-0 overflow-hidden rounded-3xl flex flex-col bg-white border border-slate-100 shadow-2xl">
                        <DialogHeader className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 backdrop-blur-md sticky top-0 z-10 flex flex-row justify-between items-center flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold text-slate-800">
                                        {editingImovelId ? 'Editar Informações do Imóvel' : 'Cadastrar Novo Imóvel'}
                                    </DialogTitle>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {editingImovelId ? 'Altere as informações abaixo e clique em Salvar' : 'Preencha as informações básicas para cadastrar e vincular o imóvel'}
                                    </p>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto min-h-0 w-full px-8 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Seção 1: Identificação */}
                                <div className="space-y-4 md:col-span-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-2 border-b border-slate-100 pb-2">
                                        <Building2 className="w-3.5 h-3.5" />
                                        Identificação do Imóvel
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Código do Imóvel</Label>
                                            <Input
                                                placeholder="Ex: LOC-004"
                                                className="bg-slate-50 border-none rounded-xl text-sm"
                                                value={newImovelFormData.codImovel || ''}
                                                onChange={(e) => setNewImovelFormData(prev => ({ ...prev, codImovel: e.target.value, codigoReference: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Tipo de Imóvel</Label>
                                            <Select 
                                                value={newImovelFormData.tipoImovel || 'Apartamento'} 
                                                onValueChange={(val) => setNewImovelFormData(prev => ({ ...prev, tipoImovel: val }))}
                                            >
                                                <SelectTrigger className="h-10 bg-slate-50 border-none rounded-xl text-sm">
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border border-slate-100 rounded-xl shadow-lg">
                                                    <SelectItem value="Apartamento">Apartamento</SelectItem>
                                                    <SelectItem value="Casa">Casa</SelectItem>
                                                    <SelectItem value="Sobrado">Sobrado</SelectItem>
                                                    <SelectItem value="Comercial">Comercial</SelectItem>
                                                    <SelectItem value="Terreno">Terreno</SelectItem>
                                                    <SelectItem value="Outro">Outro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Pretensão</Label>
                                            <Select 
                                                value={newImovelFormData.pretensao || 'Locação'} 
                                                onValueChange={(val) => setNewImovelFormData(prev => ({ ...prev, pretensao: val }))}
                                            >
                                                <SelectTrigger className="h-10 bg-slate-50 border-none rounded-xl text-sm">
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border border-slate-100 rounded-xl shadow-lg">
                                                    <SelectItem value="Locação">Locação</SelectItem>
                                                    <SelectItem value="Venda">Venda</SelectItem>
                                                    <SelectItem value="Venda e Locação">Venda e Locação</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Seção 1.5: Origem da Captação */}
                                <div className="space-y-4 md:col-span-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-2 border-b border-slate-100 pb-2">
                                        <UserCheck className="w-3.5 h-3.5" />
                                        Origem da Captação
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[
                                            { value: 'R.Sales', label: 'R.Sales', desc: 'Captado pela própria equipe', icon: '🏢' },
                                            { value: 'Corretor Interno', label: 'Corretor Interno', desc: 'Corretor cadastrado no sistema', icon: '👤' },
                                            { value: 'Proprietário', label: 'Proprietário', desc: 'Direto pelo dono do imóvel', icon: '🔑' },
                                            { value: 'Corretor Externo', label: 'Corretor Externo', desc: 'Parceiro não cadastrado', icon: '🤝' },
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setNewImovelFormData(prev => ({ ...prev, origemCaptacao: opt.value }))}
                                                className={`flex flex-col items-start gap-1 p-3.5 rounded-xl border-2 text-left transition-all ${
                                                    newImovelFormData.origemCaptacao === opt.value
                                                        ? 'border-emerald-500 bg-emerald-50/50'
                                                        : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                                                }`}
                                            >
                                                <span className="text-xl">{opt.icon}</span>
                                                <span className={`text-xs font-bold ${ newImovelFormData.origemCaptacao === opt.value ? 'text-emerald-700' : 'text-slate-700'}`}>{opt.label}</span>
                                                <span className="text-[10px] text-slate-400 leading-tight">{opt.desc}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Campo extra: Corretor Interno - selecionar do sistema */}
                                    {newImovelFormData.origemCaptacao === 'Corretor Interno' && (
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Corretor Responsável</Label>
                                            <Select
                                                value={newImovelFormData.corretorResponsavelId || ''}
                                                onValueChange={(val) => setNewImovelFormData(prev => ({ ...prev, corretorResponsavelId: val }))}
                                            >
                                                <SelectTrigger className="h-10 bg-slate-50 border-none rounded-xl text-sm">
                                                    <SelectValue placeholder="Selecione o corretor..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border border-slate-100 rounded-xl shadow-lg">
                                                    {users.map(u => (
                                                        <SelectItem key={u._id} value={u._id}>
                                                        {u.name || u.emailLogin}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Campo extra: Corretor Externo - nome e contato */}
                                    {newImovelFormData.origemCaptacao === 'Corretor Externo' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Nome do Corretor Externo</Label>
                                                <Input
                                                    placeholder="Nome completo"
                                                    className="bg-slate-50 border-none rounded-xl text-sm"
                                                    value={newImovelFormData.corretorExternoNome || ''}
                                                    onChange={(e) => setNewImovelFormData(prev => ({ ...prev, corretorExternoNome: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Contato (Tel / Email / CRECI)</Label>
                                                <Input
                                                    placeholder="(11) 99999-9999 ou email"
                                                    className="bg-slate-50 border-none rounded-xl text-sm"
                                                    value={newImovelFormData.corretorExternoContato || ''}
                                                    onChange={(e) => setNewImovelFormData(prev => ({ ...prev, corretorExternoContato: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Seção 2: Valores */}
                                <div className="space-y-4 md:col-span-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-2 border-b border-slate-100 pb-2">
                                        <DollarSign className="w-3.5 h-3.5" />
                                        Acordo Financeiro
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Aluguel Estimado</Label>
                                            <CurrencyInput
                                                className="bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-800"
                                                value={newImovelFormData.precoLocacao}
                                                onValueChange={val => {
                                                    setNewImovelFormData(prev => ({ ...prev, precoLocacao: val || undefined }));
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Valor de Venda</Label>
                                            <CurrencyInput
                                                className="bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-800"
                                                value={newImovelFormData.precoVenda}
                                                onValueChange={val => {
                                                    setNewImovelFormData(prev => ({ ...prev, precoVenda: val || undefined }));
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Condomínio</Label>
                                            <CurrencyInput
                                                className="bg-slate-50 border-none rounded-xl text-sm"
                                                value={newImovelFormData.valorCondominio}
                                                onValueChange={val => {
                                                    setNewImovelFormData(prev => ({ ...prev, valorCondominio: val || undefined }));
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">IPTU Estimado</Label>
                                            <CurrencyInput
                                                className="bg-slate-50 border-none rounded-xl text-sm"
                                                value={newImovelFormData.valorIPTU}
                                                onValueChange={val => {
                                                    setNewImovelFormData(prev => ({ ...prev, valorIPTU: val || undefined }));
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Seção 3: Endereço */}
                                <div className="space-y-4 md:col-span-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-2 border-b border-slate-100 pb-2">
                                        <Home className="w-3.5 h-3.5" />
                                        Localização / Endereço
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">CEP</Label>
                                            <Input
                                                placeholder="00000-000"
                                                className="bg-slate-50 border-none rounded-xl text-sm"
                                                value={newImovelFormData.cep || ''}
                                                onChange={(e) => setNewImovelFormData(prev => ({ ...prev, cep: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Rua / Logradouro</Label>
                                            <Input
                                                placeholder="Avenida Paulista"
                                                className="bg-slate-50 border-none rounded-xl text-sm"
                                                value={newImovelFormData.logradouro || ''}
                                                onChange={(e) => setNewImovelFormData(prev => ({ ...prev, logradouro: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Número</Label>
                                            <Input
                                                placeholder="123"
                                                className="bg-slate-50 border-none rounded-xl text-sm"
                                                value={newImovelFormData.numero || ''}
                                                onChange={(e) => setNewImovelFormData(prev => ({ ...prev, numero: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Complemento</Label>
                                            <Input
                                                placeholder="Apt 42"
                                                className="bg-slate-50 border-none rounded-xl text-sm"
                                                value={newImovelFormData.complemento || ''}
                                                onChange={(e) => setNewImovelFormData(prev => ({ ...prev, complemento: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Bairro</Label>
                                            <Input
                                                placeholder="Bela Vista"
                                                className="bg-slate-50 border-none rounded-xl text-sm"
                                                value={newImovelFormData.bairro || ''}
                                                onChange={(e) => setNewImovelFormData(prev => ({ ...prev, bairro: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Cidade</Label>
                                            <Input
                                                placeholder="São Paulo"
                                                className="bg-slate-50 border-none rounded-xl text-sm"
                                                value={newImovelFormData.cidade || ''}
                                                onChange={(e) => setNewImovelFormData(prev => ({ ...prev, cidade: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Estado</Label>
                                            <Input
                                                placeholder="SP"
                                                maxLength={2}
                                                className="bg-slate-50 border-none rounded-xl text-sm uppercase"
                                                value={newImovelFormData.estado || 'SP'}
                                                onChange={(e) => setNewImovelFormData(prev => ({ ...prev, estado: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Seção 4: Proprietário */}
                                <div className="space-y-4 md:col-span-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-2 border-b border-slate-100 pb-2">
                                        <Users className="w-3.5 h-3.5" />
                                        Informações do Proprietário
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Nome do Proprietário</Label>
                                            <Input
                                                placeholder="Nome Completo"
                                                className="bg-slate-50 border-none rounded-xl text-sm"
                                                value={newImovelFormData.nomeProprietario || ''}
                                                onChange={(e) => setNewImovelFormData(prev => ({ ...prev, nomeProprietario: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Telefone / WhatsApp</Label>
                                            <Input
                                                placeholder="(11) 99999-9999"
                                                className="bg-slate-50 border-none rounded-xl text-sm"
                                                value={newImovelFormData.telefoneProprietario || ''}
                                                onChange={(e) => setNewImovelFormData(prev => ({ ...prev, telefoneProprietario: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">E-mail</Label>
                                            <Input
                                                type="email"
                                                placeholder="exemplo@email.com"
                                                className="bg-slate-50 border-none rounded-xl text-sm"
                                                value={newImovelFormData.emailProprietario || ''}
                                                onChange={(e) => setNewImovelFormData(prev => ({ ...prev, emailProprietario: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
                            <Button 
                                type="button"
                                variant="outline" 
                                className="rounded-xl px-6 h-11 text-slate-600 border-slate-200 hover:bg-slate-100 transition-colors" 
                                onClick={() => setShowNewImovelModal(false)}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                disabled={isSavingLocacao} 
                                onClick={handleSaveImovel} 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 h-11 font-bold shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
                            >
                                {isSavingLocacao ? 'Salvando...' : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Salvar
                                    </>
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
