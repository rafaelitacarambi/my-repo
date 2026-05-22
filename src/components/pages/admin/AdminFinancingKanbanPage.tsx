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
  TrendingUp,
  Key,
  Gavel,
  Hammer,
  Hash,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/components/layouts/AdminLayout';
import { CopyButton } from '@/components/ui/CopyButton';
import FinancingNavigation from '@/components/FinancingNavigation';
import { BaseCrudService } from '@/integrations';
import { ServiceRecords, UsuriosdoSistema, PendnciasdoFinanciamento, FinancingTasks, ServiceParties, Clients, DocumentosdoFinanciamento, HistricodeInteraes, Imveis, AtendimentoImveis, ChecklistdosProponentes } from '@/entities';
import { formatCurrency, parseCurrency, formatCPF, parseCPF, validateCPF, handleCurrencyInput, handleCPFInput } from '@/lib/input-masks';
import { STAGE_CHECKLISTS, ChecklistAnswer } from '@/config/FinancingChecklists';
import { FinancingStageChecklist } from '@/components/financiamento/FinancingStageChecklist';
import { FINANCING_COLUMNS, RESPONSIBLE_TYPES, PRIORITY_LEVELS, PENDING_STATUS, TASK_STATUS, DEFAULT_PROPONENT_DOCUMENTS } from '@/config/financing-constants';
import { ProponentChecklistCard } from '@/components/financiamento/ProponentChecklistCard';
import { VendorDetailCard } from '@/components/financiamento/VendorDetailCard';

// Temporary interface for vendor documents collection
interface FinanciamentoDocsVendedor {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  atendimentoRef?: string;
  vendedorClienteRef?: string;
  docTipo?: string;
  recebido?: boolean;
  arquivo?: string;
  ativo?: boolean;
  observacoes?: string;
  obrigatorio?: boolean;
}

// Interface for Vendors (internal state)
interface Vendor {
  _id: string;
  clientRef: string;
  name: string;
  cpf: string;
  email?: string;
  contato?: string;
  estadoCivil?: string;
  ehConjugeDe?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  tipoConta?: string;
  chavePix?: string;
  conjugeNaoParticipa?: boolean;
}

// Alias for VendorDocument usage within component
type VendorDocument = FinanciamentoDocsVendedor;

// Interface for proponent documents (CMS collection)
interface DocumentosProponentes {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  financingCaseRef?: string;
  proponentRef?: string;
  documentName?: string;
  isReceived?: boolean;
  isActive?: boolean;
  isMandatory?: boolean;
  fileUrl?: string;
  notes?: string;
  uploadDate?: Date | string;
}

// Types
interface FinancingColumn {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface FinancingCase {
  _id: string;
  agencia?: string;
  proponentePrincipal: string;
  cpfProponentePrincipal?: string;
  pastaInterna?: string;
  status: string;
  faseAtual: string;
  faseAnterior?: string; // Store previous phase for rollback
  dataEntradaFaseAtual?: string;
  diasNaFase: number;
  pendenciasAbertas: number;
  tarefasAbertas: number;

  // Status de Resultado do Financiamento
  statusResultadoFinanciamento?: 'Aprovado' | 'Condicionado' | 'Reprovado' | 'Em andamento' | '';

  // Checklist responses
  checklistResponses?: Record<string, any>;

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

// Move questions logic is now handled dynamically using STAGE_CHECKLISTS from config
// Ícones de bloqueio

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
  createdDate: string;
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




// Local constants removed in favor of @/config/financing-constants

// Background options for Kanban
const BACKGROUND_OPTIONS = [
  { id: 'default', name: 'Padrão Claro', value: 'bg-light-gray', preview: '#F5F6F7' },
  { id: 'dark', name: 'Escuro', value: 'bg-slate-800', preview: '#1e293b' },
  { id: 'blue', name: 'Azul Suave', value: 'bg-blue-50', preview: '#eff6ff' },
  { id: 'gradient-blue', name: 'Gradiente Azul', value: 'bg-gradient-to-br from-blue-50 to-indigo-100', preview: 'linear-gradient(135deg, #eff6ff, #e0e7ff)' },
  { id: 'gradient-purple', name: 'Gradiente Roxo', value: 'bg-gradient-to-br from-purple-50 to-pink-100', preview: 'linear-gradient(135deg, #faf5ff, #fce7f3)' },
  { id: 'gradient-green', name: 'Gradiente Verde', value: 'bg-gradient-to-br from-green-50 to-teal-100', preview: 'linear-gradient(135deg, #f0fdf4, #ccfbf1)' },
  { id: 'image-office', name: 'Imagem: Escritório', value: 'bg-[url(https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920)] bg-cover bg-center', preview: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400' },
  { id: 'image-minimal', name: 'Imagem: Minimalista', value: 'bg-[url(https://images.unsplash.com/photo-1557683316-973673baf926?w=1920)] bg-cover bg-center', preview: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400' }
];

export default function AdminFinancingKanbanPage() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const [searchParams] = useSearchParams();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const scrollbarThumbRef = useRef<HTMLDivElement>(null);
  const [cases, setCases] = useState<FinancingCase[]>([]);
  const [pendings, setPendings] = useState<Pending[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UsuriosdoSistema[]>([]);
  const [clients, setClients] = useState<Clients[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<FinancingCase | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [modalTab, setModalTab] = useState('dados');
  const [participants, setParticipants] = useState<ServiceParties[]>([]);
  const [documents, setDocuments] = useState<DocumentosdoFinanciamento[]>([]);
  const [history, setHistory] = useState<HistricodeInteraes[]>([]);
  const [properties, setProperties] = useState<Imveis[]>([]);
  const [proponentChecklists, setProponentChecklists] = useState<Map<string, ProponentChecklist>>(new Map());
  const [proponentDocuments, setProponentDocuments] = useState<DocumentosProponentes[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorDocuments, setVendorDocuments] = useState<Map<string, VendorDocument[]>>(new Map());
  const [selectedVendorId, setSelectedVendorId] = useState<string>(''); // EMPTY by default - user must select
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAgencia, setFilterAgencia] = useState('');
  const [kanbanBackground, setKanbanBackground] = useState('bg-light-gray');
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [showEmptyColumns, setShowEmptyColumns] = useState(true);
  const [currentUser, setCurrentUser] = useState<UsuriosdoSistema | null>(null);



  // Quick action modals for card
  const [showQuickTaskModal, setShowQuickTaskModal] = useState(false);
  const [showQuickPendingModal, setShowQuickPendingModal] = useState(false);
  const [quickActionCaseId, setQuickActionCaseId] = useState<string | null>(null);
  const [showCompletedPendings, setShowCompletedPendings] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);

  // Document Upload States
  const [uploadedDocs, setUploadedDocs] = useState<{ name: string; url: string; size: number; type: string; uploadedAt: string }[]>([]);
  const [isDraggingDoc, setIsDraggingDoc] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);


  // Task creation modal in Tarefas tab
  const [showTaskFormInModal, setShowTaskFormInModal] = useState(false);

  // Form states
  const [caseFormData, setCaseFormData] = useState<Partial<FinancingCase>>({
    proponentePrincipal: '',
    cpfProponentePrincipal: '',
    agencia: '',
    pastaInterna: '',
    cpf: '',
    email: '',
    phoneNumber: '',
    numeroMatricula: '',
    numeroContrato: '',
    numeroProtocoloCartorio: '',
    dataRegistroCartorio: '',
    enderecoImovel: '',
    valorItbi: 0,
    valorPrenotacaoCartorio: 0,
    valorProdutoNegociado: 0,
    valorTaxaVista: 0,
    valorRegistro: 0,
    pagoItbi: false,
    pagoPrenotacao: false,
    pagoProdutoNegociado: false,
    pagoTaxaVista: false,
    pagoRegistro: false,
    propertyValue: 0,
    desiredFinancingValue: 0,
    approvedFinancingValue: 0,
    appraisalValue: 0,
    useFgts: false,
    fgtsValue: 0,
    hasCommercialProposal: false,
    hasCheckingAccountWithOverdraft: false,
    hasCheckingAccountWithoutOverdraft: false,
    hasCreditCard: false,
    bankName: '',
    bankAccountNumber: '',
    financingContractNumber: '',
    responsibleInternalId: '',
    responsibleExternal: '',
    notes: '',
    propertyRefs: []
  });

  const [newPendingData, setNewPendingData] = useState({
    title: '',
    description: '',
    responsiblePartyType: 'Interno',
    responsiblePartyDetails: '',
    averageDaysToComplete: 7
  });

  const [editingPending, setEditingPending] = useState<Pending | null>(null);
  const [showPendingForm, setShowPendingForm] = useState(false);
  const [linkedProperties, setLinkedProperties] = useState<AtendimentoImveis[]>([]);

  const [newTaskData, setNewTaskData] = useState<{
    description: string;
    responsibleType: string;
    internalResponsibleId: string;
    externalResponsibleName: string;
    externalResponsibleContact: string;
    dueDate: string;
    responsavelExternoRef?: string;
  }>({
    description: '',
    responsibleType: 'Interno',
    internalResponsibleId: '',
    externalResponsibleName: '',
    externalResponsibleContact: '',
    dueDate: '',
    responsavelExternoRef: ''
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

  // Proponents tab state
  const [selectedProponentId, setSelectedProponentId] = useState<string>(''); // EMPTY by default - user must select
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Add Participant Modal State
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [addParticipantSearchTerm, setAddParticipantSearchTerm] = useState('');
  const [addParticipantRole, setAddParticipantRole] = useState('Participante');
  const [selectedClientForAdd, setSelectedClientForAdd] = useState<string>('');

  // Move Case Dialog State
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [movingCaseId, setMovingCaseId] = useState<string | null>(null);
  const [movingTargetColumn, setMovingTargetColumn] = useState<string | null>(null);
  const [moveAnswers, setMoveAnswers] = useState<Record<string, any>>({});

  // Linked card preview state
  type RelatedService = { _id: string; serviceType: string; contactName: string; pastaInterna: string; status: string };
  const [previewRelatedCard, setPreviewRelatedCard] = useState<RelatedService | null>(null);

  // Sync scrollbar with container
  useEffect(() => {
    const container = scrollContainerRef.current;
    const scrollbar = scrollbarRef.current;
    const thumb = scrollbarThumbRef.current;

    if (!container || !scrollbar || !thumb) return;

    const updateScrollbar = () => {
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;
      const scrollLeft = container.scrollLeft;

      // Hide scrollbar if content fits in viewport
      if (scrollWidth <= clientWidth) {
        scrollbar.style.display = 'none';
        return;
      } else {
        scrollbar.style.display = 'block';
      }

      // Calculate thumb width proportionally
      const thumbWidth = (clientWidth / scrollWidth) * clientWidth;
      thumb.style.width = `${thumbWidth}px`;

      // Calculate thumb position
      const maxScroll = scrollWidth - clientWidth;
      const scrollPercentage = maxScroll > 0 ? scrollLeft / maxScroll : 0;
      const maxThumbPosition = clientWidth - thumbWidth;
      thumb.style.transform = `translateX(${scrollPercentage * maxThumbPosition}px)`;
    };

    // Update scrollbar on container scroll
    container.addEventListener('scroll', updateScrollbar);

    // Update scrollbar on window resize
    window.addEventListener('resize', updateScrollbar);

    // Initial update
    updateScrollbar();

    // Update after content loads
    const timer = setTimeout(updateScrollbar, 100);
    const timer2 = setTimeout(updateScrollbar, 500);

    return () => {
      container.removeEventListener('scroll', updateScrollbar);
      window.removeEventListener('resize', updateScrollbar);
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [cases]);

  // Handle scrollbar thumb drag
  useEffect(() => {
    const container = scrollContainerRef.current;
    const thumb = scrollbarThumbRef.current;

    if (!container || !thumb) return;

    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      startX = e.clientX;
      startScrollLeft = container.scrollLeft;
      thumb.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startX;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;
      const maxScroll = scrollWidth - clientWidth;
      const thumbWidth = parseFloat(thumb.style.width);
      const maxThumbPosition = clientWidth - thumbWidth;

      // Calculate scroll position based on thumb movement
      const scrollRatio = maxThumbPosition > 0 ? deltaX / maxThumbPosition : 0;
      container.scrollLeft = startScrollLeft + (scrollRatio * maxScroll);
    };

    const handleMouseUp = () => {
      isDragging = false;
      thumb.style.cursor = 'grab';
      document.body.style.userSelect = '';
    };

    thumb.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      thumb.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Continuous drag-scroll on Kanban container (Trello-style)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let isMouseDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const handleMouseDown = (e: MouseEvent) => {
      // Only start drag-scroll if clicking on empty area (not on cards or interactive elements)
      const target = e.target as HTMLElement;

      // Ignore if clicking on draggable cards, buttons, inputs, or interactive elements
      if (
        target.closest('[data-rbd-draggable-id]') || // Draggable card
        target.closest('button') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('select') ||
        target.closest('[role="button"]') ||
        target.closest('a')
      ) {
        return;
      }

      isMouseDown = true;
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
      container.style.cursor = 'grabbing';
      container.style.userSelect = 'none';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;

      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 3; // Increased to 3 for faster scroll
      container.scrollLeft = scrollLeft - walk;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
      container.style.cursor = 'grab';
      container.style.userSelect = '';
    };

    const handleMouseLeave = () => {
      if (isMouseDown) {
        isMouseDown = false;
        container.style.cursor = 'grab';
        container.style.userSelect = '';
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Convert vertical scroll to horizontal scroll (mouse wheel)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Prevent default vertical scroll
      if (e.deltaY !== 0) {
        e.preventDefault();

        // Convert vertical scroll to horizontal
        container.scrollLeft += e.deltaY * 2; // Increased multiplier
      }

      // Also support horizontal scroll (trackpad or Shift+wheel)
      if (e.deltaX !== 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaX;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Load data
  useEffect(() => {
    loadData();
    loadUserBackground();
  }, []);

  // Load user's background preference
  const loadUserBackground = async () => {
    try {
      // In production, get current user from auth context
      // For now, load from localStorage or use first user
      const storedBg = localStorage.getItem('kanban-background');
      if (storedBg) {
        setKanbanBackground(storedBg);
      }
      const storedShowEmpty = localStorage.getItem('kanban-show-empty-financiamento');
      if (storedShowEmpty !== null) setShowEmptyColumns(storedShowEmpty === 'true');
    } catch (error) {
      console.error('Error loading background:', error);
    }
  };

  // URL Parameter and State Handling for Deep Linking
  useEffect(() => {
    const openCardId = searchParams.get('openCard') || location.state?.openCardId;

    // Only attempt to open if we have an ID and data is loaded (or at least we have cases)
    if (openCardId) {
      // If cases are loaded, try to find and open
      if (cases.length > 0) {
        const caseExists = cases.find(c => c._id === openCardId);
        if (caseExists) {
          // Check if already open to avoid re-renders, but allow tab switch
          if (!selectedCase || selectedCase._id !== openCardId) {
            loadCaseDetails(openCardId);
            setSelectedCase(caseExists);
            setShowDetailsModal(true);
            const initialTab = searchParams.get('initialTab');
            setModalTab(initialTab || 'dados');

            // If we opened via state, clear it to avoid reopening
            if (location.state?.openCardId === openCardId) {
              window.history.replaceState({ ...location.state, openCardId: undefined }, document.title);
            }
          }
        } else if (!loading) {
          // Only show error if we are sure loading is done and case is missing
          console.warn(`Case with ID ${openCardId} not found.`);
          toast.error('Processo não encontrado.');
        }
      }
    }
  }, [searchParams, cases, loading, selectedCase, location.state]);

  // Derived state for filtered users
  const financingTeam = users.filter(u => u.setores?.includes('Financiamento') && u.ativo !== false);

  // Save background preference
  const handleChangeBackground = async (bgValue: string) => {
    setKanbanBackground(bgValue);
    localStorage.setItem('kanban-background', bgValue);
    setShowBackgroundPicker(false);

    // In production, save to user profile in database
    // await BaseCrudService.update('usuariossistema', { _id: currentUser._id, backgroundKanban: bgValue });
  };

  const loadData = async () => {
    try {
      // Load all clients first for mapping
      const { items: clientsList } = await BaseCrudService.getAll<Clients>('clientes');
      setClients(clientsList);

      // Load financing cases from atendimentos
      const { items: atendimentos } = await BaseCrudService.getAll<ServiceRecords>('atendimentos');
      const { items: partiesList } = await BaseCrudService.getAll<ServiceParties>('atendimentopartes');
      const { items: propertiesList } = await BaseCrudService.getAll<Imveis>('imoveis');
      const { items: propertyLinks } = await BaseCrudService.getAll<AtendimentoImveis>('atendimentoimoveis');

      const filteredAtendimentos = atendimentos
        .filter(a => ['Financiamento', 'Crédito'].includes(a.serviceType || '') && !a.isArchived)
        .sort((a, b) => {
          const dateA = new Date(a._updatedDate || a._createdDate || 0).getTime();
          const dateB = new Date(b._updatedDate || b._createdDate || 0).getTime();
          return dateB - dateA;
        });

      const financingCases = filteredAtendimentos.map(a => {
        const client = clientsList.find(c => c._id === a.clientePrincipalRef);

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

        const dataEntrada = a._updatedDate || a._createdDate || new Date();
        const diasNaFase = Math.floor((new Date().getTime() - new Date(dataEntrada).getTime()) / (1000 * 60 * 60 * 24));

        // Use faseFinanciamento if available, otherwise fallback to status
        // Normalize to lowercase to match FINANCING_COLUMNS ids (e.g., 'concluido')
        let rawFase = a.faseFinanciamento || a.status || '';
        if (!rawFase || rawFase === 'Novos') rawFase = 'novos-clientes';
        
        // Normalization logic to match column IDs (e.g., "Concluído" -> "concluido")
        const faseAtual = rawFase.toLowerCase().trim()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, '-');

        return {
          _id: a._id,
          agencia: a.unidadeResponsavelRef || '',
          proponentePrincipal: a.contactName || client?.clientName || 'Sem nome',
          cpfProponentePrincipal: client?.cpfCnpj || '',
          pastaInterna: a.pastaInterna || '',
          status: a.status || '',
          faseAtual,
          diasNaFase,
          pendenciasAbertas: 0, // Will be computed later
          tarefasAbertas: 0, // Will be computed later
          statusResultadoFinanciamento: a.statusResultadoFinanciamento as any || '',
          interlinks,
          // Original fields that are still needed or will be re-computed
          clientePrincipalRef: a.clientePrincipalRef || '',
          faseAnterior: (a as any).faseAnterior || '',
          dataEntradaFaseAtual: dataEntrada,
          bloqueioDocumento: false,
          bloqueioCaixa: false,
          bloqueioCartorio: false,
          bloqueioCliente: false,
          bloqueioEngenharia: false,
          bloqueioFormularios: false,
          bloqueioRestricao: false,
          bloqueioFgts: false,
          cpf: (a as any).cpf || (a as any).cpfProponentePrincipal || client?.cpfCnpj || (a as any).proponenteCpf || (a as any).clienteCpf || (a as any).documento || '-',
          numeroContratoSiopi: (a as any).numeroContratoSiopi || (a as any).financingContractNumber || (a as any).numeroContrato || (a as any).contrato || (a as any).siopi || '-',
          email: a.contactEmail || client?.email || '',
          phoneNumber: a.contactPhone || client?.phoneNumber || '',
          propertyValue: (a as any).propertyValue || 0,
          desiredFinancingValue: (a as any).desiredFinancingValue || 0,
          approvedFinancingValue: (a as any).approvedFinancingValue || 0,
          useFgts: (a as any).useFgts || false,
          fgtsValue: (a as any).fgtsValue || 0,
          responsibleInternalId: a.responsavelInternoId,
          responsibleExternal: a.responsavelExterno,
          bankName: (a as any).bankName || '',
          bankAccountNumber: (a as any).bankAccountNumber || '',
          financingContractNumber: (a as any).financingContractNumber || (a as any).numeroContratoSiopi || '',
          notes: a.notes || '',
          createdDate: a._createdDate?.toString() || new Date().toISOString(),
          updatedDate: a._updatedDate?.toString() || new Date().toISOString()
        };
      });

      // Load pendings and tasks
      const { items: pendingsList } = await BaseCrudService.getAll<PendnciasdoFinanciamento>('pendenciasfinanciamento');
      const { items: tasksList } = await BaseCrudService.getAll<FinancingTasks>('tarefasfinanciamento');

      // Count open pendings and tasks for each case (excluding completed ones)
      financingCases.forEach(c => {
        c.pendenciasAbertas = pendingsList.filter(p =>
          p.atendimentoRef === c._id &&
          p.status !== 'Resolvida' &&
          p.status !== 'Concluída'
        ).length;
        c.tarefasAbertas = tasksList.filter(t =>
          t.atendimentoRef === c._id &&
          t.status !== 'Concluída'
        ).length;

        // Set bloqueio icons based on pending categories (only active pendings)
        const casePendings = pendingsList.filter(p =>
          p.atendimentoRef === c._id &&
          p.status !== 'Resolvida' &&
          p.status !== 'Concluída'
        );
        c.bloqueioDocumento = casePendings.some(p => p.categoria === 'Documento' || p.categoria === 'Proponente' || p.categoria === 'Documentação');
        c.bloqueioCaixa = casePendings.some(p => p.categoria === 'Caixa' || p.categoria === 'Banco');
        c.bloqueioCartorio = casePendings.some(p => p.categoria === 'Cartório');
        c.bloqueioCliente = casePendings.some(p => p.categoria === 'Cliente');
        c.bloqueioEngenharia = casePendings.some(p => p.categoria === 'Engenharia');
        c.bloqueioFormularios = casePendings.some(p => p.categoria === 'Formulários');
        c.bloqueioRestricao = casePendings.some(p => p.categoria === 'Restrição');
        c.bloqueioFgts = casePendings.some(p => p.categoria === 'FGTS');

        // Added summaries
        (c as any).pendenciasResumo = casePendings.slice(0, 2).map(p => p.title || p.description || 'Pendência');
        (c as any).tarefasResumo = tasksList.filter(t => t.atendimentoRef === c._id && t.status !== 'Concluída').slice(0, 2).map(t => t.titulo || t.description || 'Tarefa');
      });

      setCases(financingCases);
      setPendings(pendingsList as Pending[]);
      setTasks(tasksList as Task[]);

      // Load users
      const { items: usersList } = await BaseCrudService.getAll<UsuriosdoSistema>('usuariossistema');
      setUsers(usersList);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load case details for modal
  const loadCaseDetails = async (caseId: string) => {
    try {
      const atendimento = await BaseCrudService.getById<ServiceRecords>('atendimentos', caseId);
      if (!atendimento) return;

      const caseData = cases.find(c => c._id === caseId);
      if (caseData) {
        setCaseFormData({
          ...caseData,
          proponentePrincipal: atendimento.contactName || '',
          cpfProponentePrincipal: caseData.cpfProponentePrincipal || (atendimento as any).cpfProponentePrincipal || '',
          email: atendimento.contactEmail || '',
          phoneNumber: atendimento.contactPhone || '',
          responsibleInternalId: atendimento.responsavelInternoId || '',
          responsibleExternal: atendimento.responsavelExterno || '',
          notes: atendimento.notes || '',
          pastaInterna: (atendimento as any).pastaInterna || caseData.pastaInterna,
          // Load all new fields from database
          numeroMatricula: (atendimento as any).numeroMatricula || caseData.numeroMatricula || '',
          numeroContrato: (atendimento as any).numeroContrato || caseData.numeroContrato || '',
          numeroProtocoloCartorio: (atendimento as any).numeroProtocoloCartorio || caseData.numeroProtocoloCartorio || '',
          dataRegistroCartorio: (atendimento as any).dataRegistroCartorio || caseData.dataRegistroCartorio || '',
          enderecoImovel: (atendimento as any).enderecoImovel || '',
          valorItbi: (atendimento as any).valorItbi || caseData.valorItbi || 0,
          valorPrenotacaoCartorio: (atendimento as any).valorPrenotacaoCartorio || caseData.valorPrenotacaoCartorio || 0,
          valorProdutoNegociado: (atendimento as any).valorProdutoNegociado || caseData.valorProdutoNegociado || 0,
          valorTaxaVista: (atendimento as any).valorTaxaVista || caseData.valorTaxaVista || 0,
          valorRegistro: (atendimento as any).valorRegistro || 0,
          pagoItbi: (atendimento as any).pagoItbi || false,
          pagoPrenotacao: (atendimento as any).pagoPrenotacao || false,
          pagoProdutoNegociado: (atendimento as any).pagoProdutoNegociado || false,
          pagoTaxaVista: (atendimento as any).pagoTaxaVista || false,
          pagoRegistro: (atendimento as any).pagoRegistro || false,
          propertyValue: (atendimento as any).propertyValue || caseData.propertyValue || 0,
          desiredFinancingValue: (atendimento as any).desiredFinancingValue || caseData.desiredFinancingValue || 0,
          approvedFinancingValue: (atendimento as any).approvedFinancingValue || caseData.approvedFinancingValue || 0,
          appraisalValue: (atendimento as any).appraisalValue || caseData.appraisalValue || 0,
          useFgts: (atendimento as any).useFgts || caseData.useFgts || false,
          fgtsValue: (atendimento as any).fgtsValue || caseData.fgtsValue || 0,
          hasCommercialProposal: (atendimento as any).hasCommercialProposal !== undefined ? (atendimento as any).hasCommercialProposal : caseData.hasCommercialProposal,
          hasCheckingAccountWithOverdraft: (atendimento as any).hasCheckingAccountWithOverdraft || caseData.hasCheckingAccountWithOverdraft || false,
          hasCheckingAccountWithoutOverdraft: (atendimento as any).hasCheckingAccountWithoutOverdraft || caseData.hasCheckingAccountWithoutOverdraft || false,
          hasCreditCard: (atendimento as any).hasCreditCard || caseData.hasCreditCard || false,
          bankName: (atendimento as any).bankName || caseData.bankName || '',
          bankAccountNumber: (atendimento as any).bankAccountNumber || caseData.bankAccountNumber || '',
          clientePrincipalRef: atendimento.clientePrincipalRef || caseData.clientePrincipalRef || '',
          financingContractNumber: (atendimento as any).financingContractNumber || caseData.financingContractNumber || ''
        });
      }

      // Load participants - CRITICAL: EXCLUDE VENDORS (roleInService === 'Vendedor')
      const { items: participantsList } = await BaseCrudService.getAll<ServiceParties>('atendimentopartes');
      const filteredParticipants = participantsList.filter(p =>
        p.serviceRecordRef === caseId &&
        p.roleInService !== 'Vendedor' // EXCLUDE VENDORS FROM PROPONENTES
      );
      setParticipants(filteredParticipants);

      // Load proponent checklists
      const { items: checklistsList } = await BaseCrudService.getAll<ChecklistdosProponentes>('checklistproponentes');
      const checklistsMap = new Map<string, ProponentChecklist>();
      checklistsList
        .filter(c => c.atendimentoRef === caseId)
        .forEach(c => {
          if (c.clientRef) {
            checklistsMap.set(c.clientRef, c as ProponentChecklist);
          }
        });
      setProponentChecklists(checklistsMap);

      // Ensure Principal Proponent has a checklist entry
      // Use clientePrincipalRef if available, otherwise use first participant or create virtual principal
      let principalClientRef = atendimento.clientePrincipalRef;

      if (!principalClientRef && filteredParticipants.length > 0) {
        // If no principal ref but has participants, use first participant as principal
        principalClientRef = filteredParticipants[0].clientRef;
      } else if (!principalClientRef) {
        // Create a virtual principal proponent ID based on the case ID
        principalClientRef = `principal-${caseId}`;
      }

      if (principalClientRef) {
        // Check if checklist exists for principal proponent
        if (!checklistsMap.has(principalClientRef)) {
          // Create empty checklist for principal proponent
          const newChecklist: ChecklistdosProponentes = {
            _id: crypto.randomUUID(),
            atendimentoRef: caseId,
            clientRef: principalClientRef,
            hasFgtsContribution: false,
            hasDependent: false,
            declaresIncomeTax: false,
            ownsProperty: false,
            hasActiveFinancing: false,
            isFirstAcquisition: false
          };

          await BaseCrudService.create('checklistproponentes', newChecklist);
          checklistsMap.set(principalClientRef, newChecklist as ProponentChecklist);
          setProponentChecklists(new Map(checklistsMap));
        }

        // CRITICAL FIX: Do NOT auto-select principal proponent - keep empty
        // User must manually select to see details
        // setSelectedProponentId(principalClientRef); // REMOVED
      }

      // Also ensure checklist exists for all participants (EXCLUDING VENDORS)
      for (const participant of filteredParticipants) {
        // CRITICAL: Skip vendors
        if (participant.roleInService === 'Vendedor') continue;

        if (participant.clientRef && !checklistsMap.has(participant.clientRef)) {
          const newChecklist: ChecklistdosProponentes = {
            _id: crypto.randomUUID(),
            atendimentoRef: caseId,
            clientRef: participant.clientRef,
            hasFgtsContribution: false,
            hasDependent: false,
            declaresIncomeTax: false,
            ownsProperty: false,
            hasActiveFinancing: false,
            isFirstAcquisition: false
          };

          await BaseCrudService.create('checklistproponentes', newChecklist);
          checklistsMap.set(participant.clientRef, newChecklist as ProponentChecklist);
          setProponentChecklists(new Map(checklistsMap));
        }
      }

      // Load documents
      const { items: docsList } = await BaseCrudService.getAll<DocumentosdoFinanciamento>('documentosfinanciamento');
      setDocuments(docsList.filter(d => d.atendimentoRef === caseId));

      // Load history
      const { items: historyList } = await BaseCrudService.getAll<HistricodeInteraes>('historicointeracoes');
      setHistory(historyList.filter(h => h.atendimentoRef === caseId));

      // Load properties
      const { items: propertiesList } = await BaseCrudService.getAll<Imveis>('imoveis');
      setProperties(propertiesList);

      // Load linked properties
      const { items: linkedPropsList } = await BaseCrudService.getAll<AtendimentoImveis>('atendimentoimoveis');
      setLinkedProperties(linkedPropsList.filter(lp => lp.atendimentoRef === caseId));

      // Load proponent documents from CMS (only for proponents, not vendors)
      await loadProponentDocuments(caseId, principalClientRef, filteredParticipants);

      // Load vendors and their documents
      await loadVendorsAndDocuments(caseId);

    } catch (error) {
      console.error('Error loading case details:', error);
    }
  };

  // Load vendors and their documents
  const loadVendorsAndDocuments = async (caseId: string) => {
    try {
      console.log('[DEBUG] Loading vendors for atendimento:', caseId);

      // Load vendors from ServiceParties with role "Vendedor"
      const { items: allParticipants } = await BaseCrudService.getAll<ServiceParties>('atendimentopartes');
      const vendorParticipants = allParticipants.filter(
        p => p.serviceRecordRef === caseId && p.roleInService === 'Vendedor'
      );

      console.log('[DEBUG] Found vendor participants:', vendorParticipants.length);

      // Build vendors list with client data
      const vendorsList: Vendor[] = [];
      for (const vp of vendorParticipants) {
        if (vp.clientRef) {
          const client = clients.find(c => c._id === vp.clientRef);
          if (client) {
            // Load stored bank data from localStorage
            const storageKey = `vendor-bank-${caseId}-${vp.clientRef}`;
            const storedData = localStorage.getItem(storageKey);
            const bankData = storedData ? JSON.parse(storedData) : {};

            vendorsList.push({
              _id: vp._id,
              clientRef: vp.clientRef,
              name: client.clientName || client.nomeRazaoSocial || 'Vendedor',
              cpf: client.cpfCnpj || '',
              contato: bankData.contato || client.telefonePrincipal || client.whatsAppPrincipal || '',
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
      console.log('[DEBUG] Vendors loaded:', vendorsList.length);

      // Load vendor documents
      const { items: allVendorDocs } = await BaseCrudService.getAll<FinanciamentoDocsVendedor>('financiamentodocsvendedor');
      const caseVendorDocs = allVendorDocs.filter(d => d.atendimentoRef === caseId);

      console.log('[DEBUG] Found vendor documents:', caseVendorDocs.length);

      // Group documents by vendor
      const docsMap = new Map<string, VendorDocument[]>();
      caseVendorDocs.forEach(doc => {
        if (doc.vendedorClienteRef) {
          const existing = docsMap.get(doc.vendedorClienteRef) || [];
          existing.push({
            _id: doc._id,
            docTipo: doc.docTipo || '',
            recebido: doc.recebido || false,
            arquivo: doc.arquivo,
            ativo: doc.ativo !== false,
            observacoes: doc.observacoes,
            obrigatorio: doc.obrigatorio || false
          });
          docsMap.set(doc.vendedorClienteRef, existing);
        }
      });

      setVendorDocuments(docsMap);

      // CRITICAL FIX: Do NOT auto-select first vendor - keep empty
      // User must manually select to see details
      // if (vendorsList.length > 0) {
      //   setSelectedVendorId(vendorsList[0].clientRef);
      // }

    } catch (error) {
      console.error('[ERROR] Error loading vendors and documents:', error);
    }
  };

  // Load or create document checklists for all proponents (EXCLUDING VENDORS)
  const loadProponentDocuments = async (caseId: string, principalClientRef: string | undefined, participants: ServiceParties[]) => {
    try {
      // Load all documents for this case from CMS
      const { items: allDocs } = await BaseCrudService.getAll<DocumentosProponentes>('documentosproponentes');
      const caseDocs = allDocs.filter(d => d.financingCaseRef === caseId);

      // Build list of all proponents (principal + participants) - EXCLUDING VENDORS
      const allProponentRefs: string[] = [];
      if (principalClientRef) {
        allProponentRefs.push(principalClientRef);
      }
      participants.forEach(p => {
        // CRITICAL: Only add if NOT a vendor
        if (p.clientRef && !allProponentRefs.includes(p.clientRef) && p.roleInService !== 'Vendedor') {
          allProponentRefs.push(p.clientRef);
        }
      });

      // Ensure each proponent has all default documents
      for (const proponentRef of allProponentRefs) {
        for (const defaultDoc of DEFAULT_PROPONENT_DOCUMENTS) {
          // Check if document already exists for this proponent
          const existingDoc = caseDocs.find(d =>
            d.proponentRef === proponentRef &&
            d.documentName === defaultDoc.documentName
          );

          if (!existingDoc) {
            // Create the document in CMS
            const newDoc: DocumentosProponentes = {
              _id: crypto.randomUUID(),
              financingCaseRef: caseId,
              proponentRef: proponentRef,
              documentName: defaultDoc.documentName,
              isReceived: false,
              isActive: true,
              isMandatory: defaultDoc.isMandatory,
              notes: ''
            };

            await BaseCrudService.create('documentosproponentes', newDoc);
            caseDocs.push(newDoc);
          }
        }
      }

      setProponentDocuments(caseDocs);

    } catch (error) {
      console.error('Error loading proponent documents:', error);
    }
  };

  // Open details modal
  const handleOpenDetails = async (caseItem: FinancingCase, initialTab: string = 'dados') => {
    console.log('[DEBUG] Opening details modal for case:', caseItem._id);
    console.log('[DEBUG] Initial tab:', initialTab);
    console.log('[DEBUG] Case data:', caseItem);

    setSelectedCase(caseItem);
    setUploadedDocs((caseItem as any).documentosAnexos || []);

    // CRITICAL FIX: Reset selections to empty when opening modal
    setSelectedProponentId('');
    setSelectedVendorId('');

    await loadCaseDetails(caseItem._id);
    setShowDetailsModal(true);
    setModalTab(initialTab); // Set initial tab
  };

  // Save case details
  const handleSaveDetails = async () => {
    if (!selectedCase) return;

    try {
      // CRITICAL: Save all fields including new ones to atendimentos collection
      await BaseCrudService.update('atendimentos', {
        _id: selectedCase._id,
        contactName: caseFormData.proponentePrincipal,
        contactEmail: caseFormData.email,
        contactPhone: caseFormData.phoneNumber,
        responsavelInternoId: caseFormData.responsibleInternalId,
        responsavelExterno: caseFormData.responsibleExternal,
        notes: caseFormData.notes,
        unidadeResponsavelRef: caseFormData.agencia,
        pastaInterna: caseFormData.pastaInterna,
        // Store all new fields as custom properties
        numeroMatricula: caseFormData.numeroMatricula,
        numeroContrato: caseFormData.numeroContrato,
        numeroProtocoloCartorio: caseFormData.numeroProtocoloCartorio,
        dataRegistroCartorio: caseFormData.dataRegistroCartorio,
        enderecoImovel: caseFormData.enderecoImovel,
        valorItbi: caseFormData.valorItbi,
        valorPrenotacaoCartorio: caseFormData.valorPrenotacaoCartorio,
        valorProdutoNegociado: caseFormData.valorProdutoNegociado,
        valorTaxaVista: caseFormData.valorTaxaVista,
        valorRegistro: caseFormData.valorRegistro,
        pagoItbi: caseFormData.pagoItbi,
        pagoPrenotacao: caseFormData.pagoPrenotacao,
        pagoProdutoNegociado: caseFormData.pagoProdutoNegociado,
        pagoTaxaVista: caseFormData.pagoTaxaVista,
        pagoRegistro: caseFormData.pagoRegistro,
        propertyValue: caseFormData.propertyValue,
        desiredFinancingValue: caseFormData.desiredFinancingValue,
        approvedFinancingValue: caseFormData.approvedFinancingValue,
        appraisalValue: caseFormData.appraisalValue,
        useFgts: caseFormData.useFgts,
        fgtsValue: caseFormData.fgtsValue,
        hasCommercialProposal: caseFormData.hasCommercialProposal,
        hasCheckingAccountWithOverdraft: caseFormData.hasCheckingAccountWithOverdraft,
        hasCheckingAccountWithoutOverdraft: caseFormData.hasCheckingAccountWithoutOverdraft,
        hasCreditCard: caseFormData.hasCreditCard,
        bankName: caseFormData.bankName,
        bankAccountNumber: caseFormData.bankAccountNumber,
        financingContractNumber: caseFormData.financingContractNumber,
        cpfProponentePrincipal: caseFormData.cpfProponentePrincipal,
        documentosAnexos: uploadedDocs
      } as any);

      // Update local state with all form data
      setCases(cases.map(c => c._id === selectedCase._id ? {
        ...c,
        ...caseFormData,
        proponentePrincipal: caseFormData.proponentePrincipal || c.proponentePrincipal,
        agencia: caseFormData.agencia,
        pastaInterna: caseFormData.pastaInterna || c.pastaInterna,
        cpfProponentePrincipal: caseFormData.cpfProponentePrincipal || c.cpfProponentePrincipal,
        updatedDate: new Date().toISOString()
      } : c));

      // Create history entry
      await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
        _id: crypto.randomUUID(),
        atendimentoRef: selectedCase._id,
        tipoEvento: 'Atualização',
        interactionType: 'Edição de dados',
        interactionDescription: 'Dados do financiamento foram atualizados',
        interactionDate: new Date().toISOString(),
        autorTipo: 'Sistema'
      });

      await loadData();
      setShowDetailsModal(false); // Close modal on success
      toast.success("Dados salvos com sucesso!");
    } catch (error) {
      console.error('Error saving details:', error);
      toast.error("Erro ao salvar os dados.");
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

  // Handle FGTS selection change
  const handleFgtsChange = async (value: string) => {
    const willUseFgts = value === 'sim';
    setCaseFormData({ ...caseFormData, useFgts: willUseFgts, fgtsValue: willUseFgts ? caseFormData.fgtsValue : 0 });
  };

  // Handle Proponent Role Update
  const handleUpdateProponentRole = async (proponentId: string, newRole: string) => {
    if (!selectedCase) return;

    const principalKey = `principal-${selectedCase._id}`;

    if (proponentId === principalKey) {
      // Create history entry for principal role change (visual only for now as per plan constraints, or we could update notes?)
      // User asked to be able to modify it.
      // We will update the local state for roleInService if we added it to FinancingCase
      const updatedCase = { ...selectedCase, roleInService: newRole };
      setSelectedCase(updatedCase);
      setCases(cases.map(c => c._id === selectedCase._id ? updatedCase : c));

      // Optionally save to backend if we map it to a field. For now, assuming UI only or notes.
      toast.info("Papel do proponente principal atualizado (visual).");
    } else {
      // Participant
      const participant = participants.find(p => p.clientRef === proponentId);
      if (participant) {
        await BaseCrudService.update('atendimentopartes', { _id: participant._id, roleInService: newRole });
        setParticipants(prev => prev.map(p => p._id === participant._id ? { ...p, roleInService: newRole } : p));
        toast.success("Papel do participante atualizado.");
      }
    }
  };

  // Handle Proponent Spouse Update
  const handleUpdateProponentSpouse = async (proponentId: string, spouseId: string) => {
    if (!selectedCase) return;

    const principalKey = `principal-${selectedCase._id}`;
    const realPrincipalRef = selectedCase.clientePrincipalRef;

    // Helper to resolve UI ID to DB ID
    const resolveToDbId = (id: string) => {
      if (id === principalKey) return realPrincipalRef || '';
      return id;
    };

    // Helper to resolve DB ID to UI ID (not needed here but good to keep in mind)

    // 1. Identify the initiator and the spouse (target)
    const initiatorUiId = proponentId;
    const targetUiId = spouseId; // Can be empty string if removing link

    const initiatorDbId = resolveToDbId(initiatorUiId);
    const targetDbId = targetUiId ? resolveToDbId(targetUiId) : '';

    if (!initiatorDbId) {
      toast.error("Erro ao identificar o proponente principal. Verifique o cadastro.");
      return;
    }

    // Update Initiator
    if (initiatorUiId === principalKey) {
      // Initiator is Principal -> Update ServiceRecords
      await BaseCrudService.update('atendimentos', { _id: selectedCase._id, spouseRef: targetDbId });
      const updatedCase = { ...selectedCase, spouseRef: targetDbId };
      setSelectedCase(updatedCase);
      setCases(cases.map(c => c._id === selectedCase._id ? updatedCase : c));
    } else {
      // Initiator is Participant -> Update ServiceParties
      const participant = participants.find(p => p.clientRef === initiatorUiId);
      if (participant) {
        await BaseCrudService.update('atendimentopartes', { _id: participant._id, spouseRef: targetDbId });
        setParticipants(prev => prev.map(p => p._id === participant._id ? { ...p, spouseRef: targetDbId } : p));
      }
    }

    // 2. Handle Bidirectional Link
    // If we are setting a link (targetDbId is present)
    if (targetDbId) {
      // We need to link Spouse -> Initiator
      if (targetUiId === principalKey) {
        // Spouse is Principal -> Update ServiceRecords to point back to Initiator
        await BaseCrudService.update('atendimentos', { _id: selectedCase._id, spouseRef: initiatorDbId });
        // Update state
        const updatedCase = { ...selectedCase, spouseRef: initiatorDbId }; // Use spread to avoid overwriting if we just updated it above (but initiator != target so OK)
        // Wait, if we just updated selectedCase above (initiator was principal), we wouldn't be here (target is principal).
        // So we are safe.
        setSelectedCase(prev => prev ? ({ ...prev, spouseRef: initiatorDbId }) : null);
        setCases(cases.map(c => c._id === selectedCase._id ? { ...c, spouseRef: initiatorDbId } : c));
      } else {
        // Spouse is Participant -> Update ServiceParties
        const participant = participants.find(p => p.clientRef === targetUiId); // targetUiId is ClientRef for participants
        if (participant) {
          await BaseCrudService.update('atendimentopartes', { _id: participant._id, spouseRef: initiatorDbId });
          setParticipants(prev => prev.map(p => p._id === participant._id ? { ...p, spouseRef: initiatorDbId } : p));
        }
      }
    }

    // If we are removing a link (targetDbId is empty), we should probably clear the OTHER side too?
    // The user said: "Poder ligar um conjuge no outro."
    // Usually unlinking is also bidirectional.
    if (!targetDbId) {
      // Find who was previously linked?
      // This is hard because we don't know who was previously linked easily without state.
      // We can check the local state before update.
      // Let's rely on the user to unlink both or just assume one-way break is fine for now, or check current state.
      // "se ligar um conjuge em um cliente esse cliente automaticamente estará ligado nesse."
      // implies symmetry.
      // If I unlink, I should probably unlink the partner.
      // But I don't know who the partner was in this function scope easily unless I check state before update.
      // Let's skip auto-unlink for now to keep it simple, or checking `spouseRef` from state.

      let previousSpouseDbId = '';
      if (initiatorUiId === principalKey) {
        previousSpouseDbId = selectedCase.spouseRef || '';
      } else {
        const p = participants.find(p => p.clientRef === initiatorUiId);
        previousSpouseDbId = p?.spouseRef || '';
      }

      if (previousSpouseDbId) {
        // Unlink the previous spouse
        // Check if previous spouse is principal
        if (previousSpouseDbId === realPrincipalRef) {
          await BaseCrudService.update('atendimentos', { _id: selectedCase._id, spouseRef: '' });
          setSelectedCase(prev => prev ? ({ ...prev, spouseRef: '' }) : null);
          setCases(cases.map(c => c._id === selectedCase._id ? { ...c, spouseRef: '' } : c));
        } else {
          // Participant
          // We need to find the participant with clientRef === previousSpouseDbId
          // But wait, previousSpouseDbId is the Client ID.
          // We need the Participant ID to update.
          // We can find by clientRef.
          const prevPart = participants.find(p => p.clientRef === previousSpouseDbId);
          if (prevPart) {
            await BaseCrudService.update('atendimentopartes', { _id: prevPart._id, spouseRef: '' });
            setParticipants(prev => prev.map(p => p._id === prevPart._id ? { ...p, spouseRef: '' } : p));
          }
        }
      }
    }
  };

  // Handle card checklist toggle
  const handleCardChecklistToggle = async (caseId: string, itemId: string) => {
    const caseItem = cases.find(c => c._id === caseId);
    if (!caseItem) return;

    // Get current checklist state or initialize
    const currentChecklist: ChecklistAnswer[] = (caseItem as any).checklist || [];
    const existingAnswer = currentChecklist.find(a => a.id === itemId);

    let newStatus: 'checked' | 'unchecked' | 'failed' | 'irrelevant' = 'checked'; // Default next state

    if (existingAnswer) {
      // Cycle: unchecked -> checked -> failed -> irrelevant -> unchecked
      if (existingAnswer.status === 'checked') newStatus = 'failed';
      else if (existingAnswer.status === 'failed') newStatus = 'irrelevant';
      else if (existingAnswer.status === 'irrelevant') newStatus = 'unchecked';
    }

    let newChecklist: ChecklistAnswer[];

    if (newStatus === 'unchecked') {
      // Remove from checklist
      newChecklist = currentChecklist.filter(a => a.id !== itemId);
    } else {
      // Update or add
      if (existingAnswer) {
        newChecklist = currentChecklist.map(a => a.id === itemId ? { ...a, status: newStatus } : a);
      } else {
        newChecklist = [...currentChecklist, { id: itemId, status: newStatus }];
      }
    }

    // Optimistic update
    setCases(cases.map(c => c._id === caseId ? { ...c, checklist: newChecklist } : c) as any);

    // Save to database
    try {
      await BaseCrudService.update('atendimentos', {
        _id: caseId,
        checklist: newChecklist
      });
    } catch (error) {
      console.error('Error updating checklist:', error);
      // Revert on error could be implemented here
    }
  };

  // Handle drag and drop
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    // Dropped in the same position
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    // Move case to new column
    const newColumnId = destination.droppableId;
    await handleMoveCase(draggableId, newColumnId);
  };

  // Handle status change with automatic column movement
  const handleStatusResultadoChange = async (caseId: string, newStatus: 'Aprovado' | 'Condicionado' | 'Reprovado' | 'Em andamento') => {
    try {
      const caseItem = cases.find(c => c._id === caseId);
      if (!caseItem) return;

      const now = new Date().toISOString();
      const oldStatus = caseItem.statusResultadoFinanciamento || 'Não definido';

      // Determine target column based on status
      let targetColumn = caseItem.faseAtual; // Keep current by default
      let shouldMove = false;

      if (newStatus === 'Condicionado') {
        targetColumn = 'condicionados';
        shouldMove = true;
      } else if (newStatus === 'Reprovado') {
        targetColumn = 'reprovados';
        shouldMove = true;
      } else if (newStatus === 'Aprovado') {
        // If changing from Reprovado to Aprovado, try to restore previous phase
        if (oldStatus === 'Reprovado' && caseItem.faseAnterior) {
          targetColumn = caseItem.faseAnterior;
          shouldMove = true;
        }
        // Otherwise, keep in current phase (no automatic movement)
      } else if (newStatus === 'Em andamento') {
        // Em andamento keeps current phase (no automatic movement)
        shouldMove = false;
      }

      // Optimistic update
      setCases(cases.map(c => c._id === caseId ? {
        ...c,
        statusResultadoFinanciamento: newStatus,
        faseAnterior: shouldMove && newStatus !== 'Aprovado' ? c.faseAtual : c.faseAnterior, // Save current phase before moving
        faseAtual: targetColumn,
        dataEntradaFaseAtual: shouldMove ? now : c.dataEntradaFaseAtual,
        diasNaFase: shouldMove ? 0 : c.diasNaFase
      } : c));

      // Update database
      const updateData: any = {
        _id: caseId,
        statusResultadoFinanciamento: newStatus
      };

      if (shouldMove) {
        updateData.faseFinanciamento = targetColumn;
        updateData.dataPrevistaConclusao = now;

        // Save previous phase for potential rollback
        if (newStatus !== 'Aprovado') {
          updateData.faseAnterior = caseItem.faseAtual;
        }
      }

      await BaseCrudService.update<ServiceRecords>('atendimentos', updateData);

      // Create history entry for status change
      await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
        _id: crypto.randomUUID(),
        atendimentoRef: caseId,
        tipoEvento: 'Status_Resultado_Alterado',
        interactionType: 'Mudança de Status de Resultado',
        interactionDescription: `Status de resultado alterado de "${oldStatus}" para "${newStatus}"${shouldMove ? ` - Movido para coluna "${FINANCING_COLUMNS.find(c => c.id === targetColumn)?.name}"` : ''}`,
        interactionDate: now,
        autorTipo: 'Sistema'
      });

      // If moved to a different column, also create movement history
      if (shouldMove && targetColumn !== caseItem.faseAtual) {
        await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
          _id: crypto.randomUUID(),
          atendimentoRef: caseId,
          tipoEvento: 'Movimentação',
          interactionType: 'Mudança de fase automática',
          interactionDescription: `Movido automaticamente para: ${FINANCING_COLUMNS.find(c => c.id === targetColumn)?.name} (devido ao status "${newStatus}")`,
          interactionDate: now,
          autorTipo: 'Sistema'
        });
      }

      await loadData();
    } catch (error) {
      console.error('Error updating status resultado:', error);
      await loadData(); // Revert on failure
    }
  };

  // Move case to different column
  const handleMoveCase = async (caseId: string, newColumn: string) => {
    const caseItem = cases.find(c => c._id === caseId);
    if (!caseItem) return;

    // If there are questions for the CURRENT phase, show the popup
    const sourcePhase = caseItem.faseAtual;
    const phaseQuestions = STAGE_CHECKLISTS[sourcePhase] || [];

    if (phaseQuestions.length > 0) {
      setMovingCaseId(caseId);
      setMovingTargetColumn(newColumn);

      // Initialize answers from current state if they exist
      const currentResponses = (caseItem as any).checklistResponses?.[sourcePhase] || {};
      const initialAnswers: Record<string, any> = {};

      phaseQuestions.forEach(q => {
        if (currentResponses[q.id]) {
          const status = currentResponses[q.id].status;
          initialAnswers[q.id] = status === 'checked' ? 'sim' : status === 'failed' ? 'nao' : status === 'irrelevant' ? 'indiferente' : '';
        } else {
          initialAnswers[q.id] = '';
        }
      });

      setMoveAnswers(initialAnswers);
      setMoveDialogOpen(true);
      return;
    }

    // Special case: conclusion
    if (newColumn === 'concluido') {
      setSelectedCase(caseItem);
      handleConcludeProcess();
      return;
    }

    // Otherwise, move directly
    await executeMoveCase(caseId, newColumn);
  };

  const executeMoveCase = async (caseId: string, newColumn: string, answers?: Record<string, any>) => {
    try {
      const caseItem = cases.find(c => c._id === caseId);
      if (!caseItem) return;

      const now = new Date().toISOString();
      const updates: any = {
        _id: caseId,
        faseFinanciamento: newColumn,
        faseAnterior: caseItem.faseAtual,
        dataPrevistaConclusao: now
      };

      // If we have answers, update checklistResponses for the source phase
      if (answers) {
        const sourcePhase = caseItem.faseAtual;
        const currentChecklist = (caseItem as any).checklistResponses || {};
        const stageAnswers = currentChecklist[sourcePhase] || {};

        // Merge answers into checklist
        updates.checklistResponses = {
          ...currentChecklist,
          [sourcePhase]: {
            ...stageAnswers,
            ...Object.keys(answers).reduce((acc, key) => {
              const val = answers[key];
              if (val === 'sim') {
                acc[key] = { status: 'checked', checked: true };
              } else if (val === 'nao') {
                acc[key] = { status: 'failed', checked: false };
              } else if (val === 'indiferente') {
                acc[key] = { status: 'irrelevant', checked: false };
              }
              return acc;
            }, {} as any)
          }
        };
      }

      // Set status to "Concluído" if moving to the final column
      if (newColumn === 'concluido') {
        updates.status = 'Concluído';
        updates.statusResultadoFinanciamento = 'Concluído';
      }

      // Optimistic update
      setCases(cases.map(c => c._id === caseId ? {
        ...c,
        faseAnterior: c.faseAtual,
        faseAtual: newColumn,
        dataEntradaFaseAtual: now,
        status: newColumn === 'concluido' ? 'Concluído' : c.status,
        statusResultadoFinanciamento: newColumn === 'concluido' ? 'Concluído' : c.statusResultadoFinanciamento,
        diasNaFase: 0,
        ...updates
      } : c));

      await BaseCrudService.update<ServiceRecords>('atendimentos', updates);

      // Create history entry
      await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
        _id: crypto.randomUUID(),
        atendimentoRef: caseId,
        tipoEvento: 'Movimentação',
        interactionType: 'Mudança de fase',
        interactionDescription: `Movido para: ${FINANCING_COLUMNS.find(c => c.id === newColumn)?.name}${answers ? ' (Respostas automáticas preenchidas)' : ''}`,
        interactionDate: now,
        autorTipo: 'Sistema'
      });

      setMoveDialogOpen(false);
      setMovingCaseId(null);
      setMovingTargetColumn(null);
      toast.success("Ficha movida com sucesso!");

    } catch (error) {
      console.error('Error moving case:', error);
      toast.error("Erro ao mover ficha");
      await loadData();
    }
  };

  // Checklist Handlers
  const handleUpdateChecklistAnswer = async (stageId: string, itemId: string, answer: ChecklistAnswer) => {
    if (!selectedCase) return;

    // Update local form state
    setCaseFormData(prev => {
      const currentResponses = prev.checklistResponses || {};
      const stageResponses = currentResponses[stageId] || {};

      return {
        ...prev,
        checklistResponses: {
          ...currentResponses,
          [stageId]: {
            ...stageResponses,
            [itemId]: answer
          }
        }
      };
    });

    // Update selectedCase state to keep it in sync
    if (selectedCase) {
      const currentResponses = selectedCase.checklistResponses || {};
      const stageResponses = currentResponses[stageId] || {};
      const newResponses = {
        ...currentResponses,
        [stageId]: {
          ...stageResponses,
          [itemId]: answer
        }
      };
      setSelectedCase({ ...selectedCase, checklistResponses: newResponses });

      // Persist to backend
      try {
        await BaseCrudService.update('atendimentos', {
          _id: selectedCase._id,
          checklistResponses: newResponses
        });
      } catch (error) {
        console.error("Error saving checklist:", error);
      }
    }
  };

  const handleConcludeProcess = async () => {
    if (!selectedCase) return;
    try {
      await BaseCrudService.update('atendimentos', {
        _id: selectedCase._id,
        status: 'Concluído',
        faseFinanciamento: 'concluido',
        faseAtual: 'concluido', // Ensure both are set for board mapping
        dataPrevistaConclusao: new Date().toISOString()
      });

      toast.success("Processo concluído com sucesso!");
      setShowDetailsModal(false);
      await loadData(); // Refresh board
    } catch (e) {
      console.error("Error concluding process:", e);
      toast.error("Erro ao concluir processo");
    }
  };

  const handleQuickStatusChange = async (newStatus: string) => {
    if (!selectedCase) return;
    
    const previousStatus = selectedCase.faseAtual;
    if (previousStatus === newStatus) return;

    // Optimistic update locally
    const isCompleted = newStatus === 'concluido';
    const displayStatus = isCompleted ? 'Concluído' : newStatus;

    const updatedCases = cases.map(c => 
        c._id === selectedCase._id ? { 
            ...c, 
            status: displayStatus, 
            faseAtual: newStatus,
            statusResultadoFinanciamento: isCompleted ? 'Concluído' : c.statusResultadoFinanciamento
        } : c
    );
    setCases(updatedCases);
    setSelectedCase({ 
        ...selectedCase, 
        status: displayStatus, 
        faseAtual: newStatus,
        statusResultadoFinanciamento: isCompleted ? 'Concluído' : (selectedCase as any).statusResultadoFinanciamento
    } as any);

    try {
        await BaseCrudService.update('atendimentos', { 
            _id: selectedCase._id, 
            status: displayStatus, 
            faseFinanciamento: newStatus,
            statusResultadoFinanciamento: isCompleted ? 'Concluído' : undefined
        });
        toast.success(`Fase alterada com sucesso!`);
    } catch (error) {
        console.error('Error changing status:', error);
        toast.error('Erro ao mudar fase');
        loadData(); // Revert on error
    }
  };

  // Add participant (ONLY FOR PROPONENTS, NOT VENDORS)
  const handleAddParticipant = async () => {
    if (!selectedCase || !newParticipant.clientRef) return;

    // CRITICAL: Prevent adding vendors through this function
    if (newParticipant.roleInService === 'Vendedor') {
      console.error('Cannot add vendors through participant function. Use vendor tab.');
      return;
    }

    try {
      const participant: ServiceParties = {
        _id: crypto.randomUUID(),
        serviceRecordRef: selectedCase._id,
        clientRef: newParticipant.clientRef,
        roleInService: newParticipant.roleInService,
        participationPercentage: newParticipant.participationPercentage
      };

      await BaseCrudService.create('atendimentopartes', participant);
      setParticipants([...participants, participant]);

      // Create checklist for the new participant
      const existingChecklist = proponentChecklists.get(newParticipant.clientRef);
      if (!existingChecklist) {
        const newChecklist: ChecklistdosProponentes = {
          _id: crypto.randomUUID(),
          atendimentoRef: selectedCase._id,
          clientRef: newParticipant.clientRef,
          hasFgtsContribution: false,
          hasDependent: false,
          declaresIncomeTax: false,
          ownsProperty: false,
          hasActiveFinancing: false,
          isFirstAcquisition: false
        };

        await BaseCrudService.create('checklistproponentes', newChecklist);
        const updatedChecklists = new Map(proponentChecklists);
        updatedChecklists.set(newParticipant.clientRef, newChecklist as ProponentChecklist);
        setProponentChecklists(updatedChecklists);
      }

      setNewParticipant({
        clientRef: '',
        roleInService: 'Participante/Dependente',
        participationPercentage: 0
      });
    } catch (error) {
      console.error('Error adding participant:', error);
    }
  };

  // Remove participant
  const handleRemoveParticipant = async (participantId: string) => {
    try {
      await BaseCrudService.delete('atendimentopartes', participantId);
      setParticipants(participants.filter(p => p._id !== participantId));
    } catch (error) {
      console.error('Error removing participant:', error);
    }
  };

  // Add vendor
  const handleAddVendor = async () => {
    if (!selectedCase || !newVendor.clientRef) return;

    try {
      console.log('[DEBUG] Adding vendor:', newVendor);

      // Create vendor as participant with role "Vendedor"
      const vendorParticipant: ServiceParties = {
        _id: crypto.randomUUID(),
        serviceRecordRef: selectedCase._id,
        clientRef: newVendor.clientRef,
        roleInService: 'Vendedor',
        participationPercentage: 0
      };

      await BaseCrudService.create('atendimentopartes', vendorParticipant);

      // Get client data
      const client = clients.find(c => c._id === newVendor.clientRef);

      // Add to vendors list with spouse link if provided
      const newVendorObj: Vendor = {
        _id: vendorParticipant._id,
        clientRef: newVendor.clientRef,
        name: client?.clientName || client?.nomeRazaoSocial || 'Vendedor',
        cpf: client?.cpfCnpj || '',
        contato: newVendor.contato,
        email: newVendor.email,
        banco: newVendor.banco,
        agencia: newVendor.agencia,
        conta: newVendor.conta,
        tipoConta: newVendor.tipoConta,
        chavePix: newVendor.chavePix,
        estadoCivil: newVendor.estadoCivil,
        ehConjugeDe: newVendor.ehConjugeDe,
        conjugeNaoParticipa: newVendor.conjugeNaoParticipa
      };

      // Save spouse link to localStorage if provided
      if (newVendor.ehConjugeDe) {
        const storageKey = `vendor-bank-${selectedCase._id}-${newVendor.clientRef}`;
        localStorage.setItem(storageKey, JSON.stringify({
          contato: newVendor.contato,
          email: newVendor.email,
          banco: newVendor.banco,
          agencia: newVendor.agencia,
          conta: newVendor.conta,
          tipoConta: newVendor.tipoConta,
          chavePix: newVendor.chavePix,
          estadoCivil: newVendor.estadoCivil,
          ehConjugeDe: newVendor.ehConjugeDe,
          conjugeNaoParticipa: newVendor.conjugeNaoParticipa
        }));
      }

      setVendors([...vendors, newVendorObj]);

      // Create default documents for vendor
      const defaultDocs = [
        { docTipo: 'IDENTIFICACAO', obrigatorio: true },
        { docTipo: 'CERTIDAO', obrigatorio: true },
        { docTipo: 'ENDERECO', obrigatorio: false }
      ];
      const vendorDocs: VendorDocument[] = [];

      for (const docConfig of defaultDocs) {
        const doc: FinanciamentoDocsVendedor = {
          _id: crypto.randomUUID(),
          atendimentoRef: selectedCase._id,
          vendedorClienteRef: newVendor.clientRef,
          docTipo: docConfig.docTipo,
          recebido: false,
          ativo: true,
          observacoes: '',
          obrigatorio: docConfig.obrigatorio
        };

        await BaseCrudService.create('financiamentodocsvendedor', doc);

        vendorDocs.push({
          _id: doc._id,
          docTipo: docConfig.docTipo,
          recebido: false,
          ativo: true,
          observacoes: '',
          obrigatorio: docConfig.obrigatorio
        });
      }

      // Update vendor documents map
      const newDocsMap = new Map(vendorDocuments);
      newDocsMap.set(newVendor.clientRef, vendorDocs);
      setVendorDocuments(newDocsMap);

      // CRITICAL FIX: Do NOT auto-select newly added vendor
      // Keep selection empty so user must manually select
      // setSelectedVendorId(newVendor.clientRef); // REMOVED

      console.log('[DEBUG] Vendor added successfully with', vendorDocs.length, 'documents');

      // Reset form
      setNewVendor({
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

      // Create history entry
      await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
        _id: crypto.randomUUID(),
        atendimentoRef: selectedCase._id,
        tipoEvento: 'Vendedor',
        interactionType: 'Adição de vendedor',
        interactionDescription: `Vendedor ${newVendorObj.name} adicionado ao processo`,
        interactionDate: new Date().toISOString(),
        autorTipo: 'Sistema'
      });

    } catch (error) {
      console.error('[ERROR] Error adding vendor:', error);
    }
  };

  // Remove vendor
  const handleRemoveVendor = async (vendorId: string) => {
    try {
      console.log('[DEBUG] Removing vendor:', vendorId);

      // Find vendor
      const vendor = vendors.find(v => v._id === vendorId);
      if (!vendor) return;

      // Delete participant
      await BaseCrudService.delete('atendimentopartes', vendorId);

      // Mark all vendor documents as inactive
      const docs = vendorDocuments.get(vendor.clientRef) || [];
      for (const doc of docs) {
        await BaseCrudService.update<FinanciamentoDocsVendedor>('financiamentodocsvendedor', {
          _id: doc._id,
          ativo: false
        });
      }

      // Update state
      setVendors(vendors.filter(v => v._id !== vendorId));

      // CRITICAL FIX: Clear selection when removing vendor
      if (selectedVendorId === vendor.clientRef) {
        setSelectedVendorId(''); // Reset to empty - user must select again
      }

      console.log('[DEBUG] Vendor removed successfully');

    } catch (error) {
      console.error('[ERROR] Error removing vendor:', error);
    }
  };

  // Update vendor bank data
  const handleUpdateVendorBankData = async (vendorClientRef: string, field: string, value: string | boolean) => {
    const updatedVendors = vendors.map(v =>
      v.clientRef === vendorClientRef ? { ...v, [field]: value } : v
    );
    setVendors(updatedVendors);

    // Save to localStorage
    const storageKey = `vendor-bank-${selectedCase?._id}-${vendorClientRef}`;
    const vendor = updatedVendors.find(v => v.clientRef === vendorClientRef);
    if (vendor) {
      localStorage.setItem(storageKey, JSON.stringify({
        contato: vendor.contato,
        email: vendor.email,
        banco: vendor.banco,
        agencia: vendor.agencia,
        conta: vendor.conta,
        tipoConta: vendor.tipoConta,
        chavePix: vendor.chavePix,
        estadoCivil: vendor.estadoCivil,
        ehConjugeDe: vendor.ehConjugeDe,
        conjugeNaoParticipa: vendor.conjugeNaoParticipa
      }));
    }
  };

  // Update vendor document
  const handleUpdateVendorDocument = async (vendorClientRef: string, docId: string, updates: Partial<VendorDocument>) => {
    if (!selectedCase) return;

    try {
      console.log('[DEBUG] Updating vendor document:', docId, updates);

      // Update in database
      await BaseCrudService.update<FinanciamentoDocsVendedor>('financiamentodocsvendedor', {
        _id: docId,
        ...updates
      });

      // Update local state
      const docs = vendorDocuments.get(vendorClientRef) || [];
      const updatedDocs = docs.map(d =>
        d._id === docId ? { ...d, ...updates } : d
      );

      const newMap = new Map(vendorDocuments);
      newMap.set(vendorClientRef, updatedDocs);
      setVendorDocuments(newMap);

      // Create history entry
      const vendor = vendors.find(v => v.clientRef === vendorClientRef);
      const doc = updatedDocs.find(d => d._id === docId);

      if (vendor && doc) {
        let description = '';
        if (updates.recebido !== undefined) {
          description = updates.recebido
            ? `Documento "${doc.docTipo}" marcado como RECEBIDO para vendedor ${vendor.name}`
            : `Documento "${doc.docTipo}" marcado como NÃO RECEBIDO para vendedor ${vendor.name}`;
        } else if (updates.ativo === false) {
          description = `Documento "${doc.docTipo}" EXCLUÍDO do checklist do vendedor ${vendor.name}`;
        }

        if (description) {
          await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
            _id: crypto.randomUUID(),
            atendimentoRef: selectedCase._id,
            tipoEvento: 'Documento Vendedor',
            interactionType: 'Atualização de documento',
            interactionDescription: description,
            interactionDate: new Date().toISOString(),
            autorTipo: 'Sistema'
          });
        }
      }

      console.log('[DEBUG] Vendor document updated successfully');

    } catch (error) {
      console.error('[ERROR] Error updating vendor document:', error);
    }
  };

  // Delete vendor document (mark as inactive) - only for non-mandatory documents
  const handleDeleteVendorDocument = async (vendorClientRef: string, docId: string) => {
    const docs = vendorDocuments.get(vendorClientRef) || [];
    const document = docs.find(d => d._id === docId);

    // Prevent deletion of mandatory documents
    if (document?.obrigatorio) {
      console.warn('Cannot delete mandatory document:', document.docTipo);
      return;
    }

    await handleUpdateVendorDocument(vendorClientRef, docId, { ativo: false });
  };

  // Restore deleted vendor document (mark as active again)
  const handleRestoreVendorDocument = async (vendorClientRef: string, docId: string) => {
    await handleUpdateVendorDocument(vendorClientRef, docId, {
      ativo: true,
      recebido: false // Reset to pending when restored
    });
  };

  // Create or update pending
  const handleSavePending = async () => {
    if (!selectedCase || !newPendingData.description) return;

    try {
      console.log('[DEBUG] Creating pending with data:', newPendingData);
      console.log('[DEBUG] atendimentoRef:', selectedCase._id);

      // Calculate due date based on average days
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (newPendingData.averageDaysToComplete || 7));
      const now = new Date().toISOString();

      // Create new pending with minimal required fields
      const newPending: PendnciasdoFinanciamento = {
        _id: crypto.randomUUID(),
        atendimentoRef: selectedCase._id,
        title: newPendingData.title || newPendingData.description.substring(0, 50),
        description: newPendingData.description,
        status: 'Pendente',
        priority: 'Média',
        dueDate: dueDate.toISOString(),
        responsiblePartyType: newPendingData.responsiblePartyType,
        responsiblePartyDetails: newPendingData.responsiblePartyType === 'Interno' ? newPendingData.responsiblePartyDetails : '',
        taskAutomaticallyCreated: false,
        creationDate: now,
        bloqueiaFase: false,
        categoria: ''
      };
      console.log('[DEBUG] Saving pending to database:', newPending);
      await BaseCrudService.create('pendenciasfinanciamento', newPending);
      console.log('[DEBUG] Pending saved successfully');

      // Create history entry
      await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
        _id: crypto.randomUUID(),
        atendimentoRef: selectedCase._id,
        tipoEvento: 'Pendencia_Criada',
        interactionType: 'Criação de pendência',
        interactionDescription: `Nova pendência criada: "${newPending.title}"`,
        interactionDate: now,
        autorTipo: 'Sistema'
      });

      // Update local state optimistically
      setPendings([...pendings, newPending as Pending]);

      // Reset form
      setNewPendingData({
        description: '',
        responsiblePartyType: 'Interno',
        averageDaysToComplete: 7
      });
      setShowPendingForm(false);

      // Reload data to sync with backend and update counters
      console.log('[DEBUG] Reloading data after pending creation');
      await loadData();
      console.log('[DEBUG] Data reloaded successfully');
    } catch (error) {
      console.error('[ERROR] Error saving pending:', error);
    }
  };

  // Edit pending
  const handleEditPending = (pending: Pending) => {
    // Not used in minimalist form - removed editing functionality
    console.log('[INFO] Edit pending not available in minimalist form');
  };

  // Delete pending
  const handleDeletePending = async (pendingId: string) => {
    try {
      await BaseCrudService.delete('pendenciasfinanciamento', pendingId);
      setPendings(pendings.filter(p => p._id !== pendingId));

      // Delete associated tasks
      const associatedTasks = tasks.filter(t => t.pendenciaRef === pendingId);
      for (const task of associatedTasks) {
        await BaseCrudService.delete('tarefasfinanciamento', task._id);
      }
      setTasks(tasks.filter(t => t.pendenciaRef !== pendingId));

      await loadData();
    } catch (error) {
      console.error('Error deleting pending:', error);
    }
  };

  // Update pending status with history tracking
  const handleUpdatePendingStatus = async (pendingId: string, newStatus: string) => {
    const pending = pendings.find(p => p._id === pendingId);
    if (!pending) return;

    const now = new Date().toISOString();

    // Optimistic update
    setPendings(pendings.map(p => p._id === pendingId ? {
      ...p,
      status: newStatus,
      resolvedDate: newStatus === 'Resolvida' ? now : undefined
    } : p));

    try {
      await BaseCrudService.update<PendnciasdoFinanciamento>('pendenciasfinanciamento', {
        _id: pendingId,
        status: newStatus,
        resolvedDate: newStatus === 'Resolvida' ? now : undefined
      });

      // Create history entry
      if (pending.atendimentoRef) {
        await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
          _id: crypto.randomUUID(),
          atendimentoRef: pending.atendimentoRef,
          tipoEvento: newStatus === 'Resolvida' ? 'Pendencia_Concluida' : 'Pendencia_Atualizada',
          interactionType: newStatus === 'Resolvida' ? 'Conclusão de pendência' : 'Mudança de status',
          interactionDescription: `Pendência "${pending.title}" alterada para: ${newStatus}`,
          interactionDate: now,
          autorTipo: 'Sistema'
        });
      }

      // If pending is resolved, also complete linked tasks
      if (newStatus === 'Resolvida' && pending._id) {
        const linkedTasks = tasks.filter(t => t.pendenciaRef === pendingId && t.status !== 'Concluída');
        for (const task of linkedTasks) {
          await BaseCrudService.update<FinancingTasks>('tarefasfinanciamento', {
            _id: task._id,
            status: 'Concluída'
          });
        }
      }

      await loadData();
    } catch (error) {
      console.error('Error updating pending status:', error);
      await loadData(); // Revert on failure
    }
  };

  // Update task status with history tracking
  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    const now = new Date().toISOString();
    const updates: any = { _id: taskId, status: newStatus };

    // Track start date when moving to "Em Andamento"
    if (newStatus === 'Em Andamento' || newStatus === 'Em andamento') {
      updates.dataInicio = now;
    }

    // Track completion date when completing
    if (newStatus === 'Concluída') {
      updates.dataConclusao = now;
    }

    // Optimistic update
    setTasks(tasks.map(t => t._id === taskId ? { ...t, ...updates } : t));

    try {
      await BaseCrudService.update<FinancingTasks>('tarefasfinanciamento', updates);

      // Create history entry
      if (task.atendimentoRef) {
        const eventType = newStatus === 'Concluída' ? 'Tarefa_Concluida' :
          newStatus === 'Em Andamento' || newStatus === 'Em andamento' ? 'Tarefa_Iniciada' : 'Tarefa_Atualizada';

        await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
          _id: crypto.randomUUID(),
          atendimentoRef: task.atendimentoRef,
          tipoEvento: eventType,
          interactionType: 'Mudança de status',
          interactionDescription: `Tarefa "${(task as any).titulo || task.description}" alterada para: ${newStatus}`,
          interactionDate: now,
          autorTipo: 'Sistema'
        });
      }

      await loadData();
    } catch (error) {
      console.error('Error updating task status:', error);
      await loadData(); // Revert on failure
    }
  };

  // Create task from modal (Tarefas tab)
  const handleCreateTaskInModal = async () => {
    if (!selectedCase || !newTaskData.description) return;

    try {
      const now = new Date().toISOString();
      const dueDate = newTaskData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const newTask: FinancingTasks = {
        _id: crypto.randomUUID(),
        atendimentoRef: selectedCase._id,
        titulo: newTaskData.description.substring(0, 100),
        description: newTaskData.description,
        status: 'A Fazer',
        responsibleType: 'Equipe Financiamento',
        responsavelExternoRef: newTaskData.responsavelExternoRef,
        dueDate,
        creationDate: now
      };

      await BaseCrudService.create('tarefasfinanciamento', newTask);

      // Create history entry
      await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
        _id: crypto.randomUUID(),
        atendimentoRef: selectedCase._id,
        tipoEvento: 'Tarefa_Criada',
        interactionType: 'Criação de tarefa',
        interactionDescription: `Nova tarefa criada: "${newTask.titulo}"`,
        interactionDate: now,
        autorTipo: 'Sistema'
      });

      // Update local state
      setTasks([...tasks, newTask as Task]);

      // Reset and close
      setNewTaskData({
        description: '',
        responsibleType: 'Interno',
        internalResponsibleId: '',
        externalResponsibleName: '',
        externalResponsibleContact: '',
        dueDate: '',
        responsavelExternoRef: ''
      });
      setShowTaskFormInModal(false);

      await loadData();
    } catch (error) {
      console.error('Error creating task in modal:', error);
    }
  };

  // Quick create task from card
  const handleQuickCreateTask = async () => {
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
        responsibleType: 'Equipe Financiamento',
        responsavelExternoRef: newTaskData.responsavelExternoRef,
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

      // Update local state
      setTasks([...tasks, newTask as Task]);

      // Reset and close
      setNewTaskData({
        description: '',
        responsibleType: 'Interno',
        internalResponsibleId: '',
        externalResponsibleName: '',
        externalResponsibleContact: '',
        dueDate: '',
        responsavelExternoRef: ''
      });
      setShowQuickTaskModal(false);
      setQuickActionCaseId(null);

      await loadData();
    } catch (error) {
      console.error('Error creating quick task:', error);
    }
  };

  // Quick create pending from card
  const handleQuickCreatePending = async () => {
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

      // Update local state
      setPendings([...pendings, newPending as Pending]);

      // Reset and close
      setNewPendingData({
        description: '',
        responsiblePartyType: 'Interno',
        averageDaysToComplete: 7
      });
      setShowQuickPendingModal(false);
      setQuickActionCaseId(null);

      await loadData();
    } catch (error) {
      console.error('Error creating quick pending:', error);
    }
  };

  // Get responsible name for task
  const getTaskResponsibleName = (task: Task) => {
    // Check for responsavelExternoRef (R Sales team) first
    if ((task as any).responsavelExternoRef) {
      // Try to find user by ID first
      const user = users.find(u => u._id === (task as any).responsavelExternoRef);
      if (user) return user.name || user.emailLogin;

      // Fallback for legacy data
      const rsalesMap: Record<string, string> = {
        'catarina': 'Catarina',
        'rafael': 'Rafael',
        'gabriela': 'Gabriela',
        'isabela': 'Isabela'
      };
      return rsalesMap[(task as any).responsavelExternoRef.toLowerCase()] || (task as any).responsavelExternoRef;
    }
    if (task.responsibleType === 'Interno' && task.internalResponsibleId) {
      const usuario = users.find(u => u._id === task.internalResponsibleId);
      return usuario?.name || 'Usuário não encontrado';
    }
    return task.externalResponsibleName || 'Não atribuído';
  };

  // Add participant from modal
  const handleConfirmAddParticipant = async (client: Clients) => {
    if (!selectedCase) return;

    try {
      // Check if already added
      if (participants.some(p => p.clientRef === client._id)) {
        toast.error("Este cliente já é um participante.");
        return;
      }

      const newPart: ServiceParties = {
        _id: crypto.randomUUID(),
        serviceRecordRef: selectedCase._id,
        clientRef: client._id,
        roleInService: addParticipantRole,
        participationPercentage: 0
      };

      await BaseCrudService.create('atendimentopartes', newPart);

      // Refresh participants
      // Ideally we would push to local state, but creating new object ensures sync
      setParticipants([...participants, newPart]);

      // Also ensure checklist exists? 
      // The checklist is created when requested usually, but we can verify.

      toast.success("Participante adicionado com sucesso!");
      setShowAddParticipantModal(false);
      setAddParticipantSearchTerm('');
      setAddParticipantRole('Participante');
    } catch (e) {
      console.error(e);
      toast.error("Erro ao adicionar participante");
    }
  };

  // Update proponent checklist
  const handleUpdateProponentChecklist = async (clientRef: string, field: keyof ProponentChecklist, value: boolean | string | null) => {
    if (!selectedCase) return;

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Update local state immediately
    const existing = proponentChecklists.get(clientRef);
    const updated = existing ? { ...existing, [field]: value } : {
      _id: crypto.randomUUID(),
      atendimentoRef: selectedCase._id,
      clientRef,
      hasFgtsContribution: field === 'hasFgtsContribution' ? value as boolean | null : false,
      hasDependent: field === 'hasDependent' ? value as boolean | null : false,
      declaresIncomeTax: field === 'declaresIncomeTax' ? value as boolean | null : false,
      ownsProperty: field === 'ownsProperty' ? value as boolean | null : false,
      hasActiveFinancing: field === 'hasActiveFinancing' ? value as boolean | null : false,
      isFirstAcquisition: field === 'isFirstAcquisition' ? value as boolean | null : false
    };

    setProponentChecklists(new Map(proponentChecklists.set(clientRef, updated)));
    setSaveStatus('saving');

    // Debounce save to database
    const timer = setTimeout(async () => {
      try {
        if (existing && existing._id) {
          // Update existing checklist
          await BaseCrudService.update<ChecklistdosProponentes>('checklistproponentes', {
            _id: existing._id,
            [field]: value
          } as any);
        } else {
          // Create new checklist
          const newChecklist: ChecklistdosProponentes = {
            _id: updated._id!,
            atendimentoRef: selectedCase._id,
            clientRef,
            hasFgtsContribution: updated.hasFgtsContribution,
            hasDependent: updated.hasDependent,
            declaresIncomeTax: updated.declaresIncomeTax,
            ownsProperty: updated.ownsProperty,
            hasActiveFinancing: updated.hasActiveFinancing,
            isFirstAcquisition: updated.isFirstAcquisition
          } as any;

          await BaseCrudService.create('checklistproponentes', newChecklist);
        }

        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Error updating proponent checklist:', error);
        setSaveStatus('idle');
        // Reload to sync with server
        await loadCaseDetails(selectedCase._id);
      }
    }, 500);

    setDebounceTimer(timer);
  };

  // Update document checklist item
  const handleUpdateDocumentItem = async (proponentRef: string, documentId: string, updates: Partial<DocumentosProponentes>) => {
    if (!selectedCase) return;

    try {
      // Update in CMS
      await BaseCrudService.update<DocumentosProponentes>('documentosproponentes', {
        _id: documentId,
        ...updates
      });

      // Update local state
      setProponentDocuments(proponentDocuments.map(doc =>
        doc._id === documentId ? { ...doc, ...updates } : doc
      ));

      // Create history entry
      const client = clients.find(c => c._id === proponentRef);
      const clientName = client?.clientName || client?.nomeRazaoSocial || 'Proponente';
      const document = proponentDocuments.find(d => d._id === documentId);

      if (document) {
        let description = '';
        if (updates.isReceived !== undefined) {
          description = updates.isReceived
            ? `Documento "${document.documentName}" marcado como RECEBIDO para ${clientName}`
            : `Documento "${document.documentName}" marcado como PENDENTE para ${clientName}`;
        } else if (updates.isActive === false) {
          description = `Documento "${document.documentName}" EXCLUÍDO do checklist de ${clientName}`;
        } else if (updates.isActive === true) {
          description = `Documento "${document.documentName}" RESTAURADO no checklist de ${clientName}`;
        }

        if (description) {
          await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
            _id: crypto.randomUUID(),
            atendimentoRef: selectedCase._id,
            tipoEvento: 'Documento',
            interactionType: 'Atualização de documento',
            interactionDescription: description,
            interactionDate: new Date().toISOString(),
            autorTipo: 'Sistema'
          });
        }
      }

      // Check and create/remove automatic pendings
      await syncDocumentPendings(proponentRef);
    } catch (error) {
      console.error('Error updating document item:', error);
    }
  };

  // Delete document item (mark as inactive) - only for non-mandatory documents
  const handleDeleteDocumentItem = async (proponentRef: string, documentId: string) => {
    const document = proponentDocuments.find(d => d._id === documentId);

    // Prevent deletion of mandatory documents
    if (document?.isMandatory) {
      console.warn('Cannot delete mandatory document:', document.documentName);
      return;
    }

    await handleUpdateDocumentItem(proponentRef, documentId, { isActive: false });
  };

  // Restore deleted document (mark as active again)
  const handleRestoreDocumentItem = async (proponentRef: string, documentId: string) => {
    await handleUpdateDocumentItem(proponentRef, documentId, {
      isActive: true,
      isReceived: false // Reset to pending when restored
    });
  };

  // Sync automatic pendings based on document checklist
  const syncDocumentPendings = async (proponentRef: string) => {
    if (!selectedCase) return;

    const client = clients.find(c => c._id === proponentRef);
    const clientName = client?.clientName || client?.nomeRazaoSocial || 'Proponente';

    // Get active documents that are not received for this proponent
    const missingDocs = proponentDocuments.filter(doc =>
      doc.proponentRef === proponentRef &&
      doc.isActive &&
      !doc.isReceived
    );

    // Get all existing document pendings for this client
    const existingPendings = pendings.filter(p =>
      p.atendimentoRef === selectedCase._id &&
      p.categoria === 'Documento' &&
      p.responsiblePartyDetails?.includes(clientName)
    );

    // Create pendings for missing documents - DEACTIVATED BY USER REQUEST
    /*
    for (const doc of missingDocs) {
      const pendingTitle = `Documento pendente: ${doc.documentName} - ${clientName}`;
      const alreadyExists = existingPendings.some(p => p.title === pendingTitle);

      if (!alreadyExists) {
        const newPending: PendnciasdoFinanciamento = {
          _id: crypto.randomUUID(),
          atendimentoRef: selectedCase._id,
          title: pendingTitle,
          description: `Aguardando recebimento do documento "${doc.documentName}" do proponente ${clientName}`,
          status: 'Aberta',
          priority: 'Alta',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          responsiblePartyType: 'Cliente',
          responsiblePartyDetails: clientName,
          taskAutomaticallyCreated: true,
          creationDate: new Date().toISOString(),
          bloqueiaFase: false,
          categoria: 'Documento',
          tipo: 'Automática - Documento Proponente'
        };

        await BaseCrudService.create('pendenciasfinanciamento', newPending);
        setPendings([...pendings, newPending as Pending]);
      }
    }
    */

    // Remove pendings for documents that are now received or deleted
    for (const pending of existingPendings) {
      const docName = pending.title.replace(`Documento pendente: `, '').replace(` - ${clientName}`, '');
      const doc = proponentDocuments.find(d =>
        d.proponentRef === proponentRef &&
        d.documentName === docName
      );

      if (!doc || !doc.isActive || doc.isReceived) {
        await BaseCrudService.update<PendnciasdoFinanciamento>('pendenciasfinanciamento', {
          _id: pending._id,
          status: 'Resolvida',
          resolvedDate: new Date().toISOString()
        });
        setPendings(pendings.map(p => p._id === pending._id ? { ...p, status: 'Resolvida' } : p));
      }
    }

    // Reload data to update counts
    await loadData();
  };

  // Upload document
  const handleUploadDocument = async (file: File) => {
    if (!selectedCase) return;

    try {
      const newDoc: DocumentosdoFinanciamento = {
        _id: crypto.randomUUID(),
        atendimentoRef: selectedCase._id,
        documentName: file.name,
        documentType: 'Upload',
        documentStatus: 'Pendente',
        uploadDate: new Date().toISOString(),
        origem: 'Sistema',
        description: ''
      };

      await BaseCrudService.create('documentosfinanciamento', newDoc);
      setDocuments([...documents, newDoc]);
    } catch (error) {
      console.error('Error uploading document:', error);
    }
  };

  // Update document status
  const handleUpdateDocumentStatus = async (docId: string, newStatus: string) => {
    try {
      await BaseCrudService.update<DocumentosdoFinanciamento>('documentosfinanciamento', {
        _id: docId,
        documentStatus: newStatus
      });

      setDocuments(documents.map(d => d._id === docId ? { ...d, documentStatus: newStatus } : d));
    } catch (error) {
      console.error('Error updating document status:', error);
    }
  };

  // Get cases by column
  const getCasesByColumn = (columnId: string) => {
    let filtered = cases.filter(c => c.faseAtual === columnId);

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.proponentePrincipal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.pastaInterna?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cpf?.includes(searchTerm)
      );
    }

    if (filterAgencia) {
      filtered = filtered.filter(c => c.agencia === filterAgencia);
    }

    return filtered;
  };

  // Get unique agencies
  const getUniqueAgencias = () => {
    return Array.from(new Set(cases.map(c => c.agencia).filter(Boolean)));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-light-gray">
          <FinancingNavigation />

          {/* Skeleton Loading */}
          <section className="w-full bg-gradient-to-br from-secondary via-secondary/90 to-buttonbackground py-16">
            <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
              <div className="animate-pulse space-y-4">
                <div className="h-12 bg-white/20 rounded-lg w-2/3"></div>
                <div className="h-8 bg-white/10 rounded-lg w-1/2"></div>
                <div className="flex gap-4 mt-6">
                  <div className="h-12 bg-white/20 rounded-lg flex-1"></div>
                  <div className="h-12 bg-white/20 rounded-lg w-64"></div>
                </div>
              </div>
            </div>
          </section>

          <section className="w-full py-8">
            <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
              <div className="flex gap-4 overflow-x-auto pb-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex-shrink-0 w-[340px]">
                    <div className="bg-white border-2 border-border-gray rounded-xl p-4 min-h-[600px] animate-pulse">
                      <div className="h-6 bg-light-gray rounded mb-4"></div>
                      <div className="space-y-3">
                        {[1, 2, 3].map((j) => (
                          <div key={j} className="h-32 bg-light-gray rounded-lg"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={`min-h-[calc(100vh-120px)] flex flex-col relative ${kanbanBackground}`}>
        <FinancingNavigation />

        {/* Page Header Bar - matches Locações style */}
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-20">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Landmark className="w-6 h-6 text-blue-600" />
              Kanban de Financiamento

            </h1>
            <p className="text-slate-500 text-sm">Controle operacional completo do fluxo de financiamentos</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por proponente, pasta ou CPF..."
                className="pl-10 h-10 rounded-full border-slate-200 bg-white"
              />
            </div>
            <Select value={filterAgencia} onValueChange={setFilterAgencia}>
              <SelectTrigger className="w-[180px] h-10 rounded-full border-slate-200 bg-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Agência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as agências</SelectItem>
                {getUniqueAgencias().map(agencia => (
                  <SelectItem key={agencia} value={agencia || ''}>
                    {agencia || 'Sem agência'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              className={`rounded-full shadow-sm hover:shadow-md transition-all ${!showEmptyColumns ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white text-slate-400'}`}
              onClick={() => {
                const nextValue = !showEmptyColumns;
                setShowEmptyColumns(nextValue);
                localStorage.setItem('kanban-show-empty-financiamento', String(nextValue));
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
                    className={`group relative h-16 rounded-xl overflow-hidden border-2 transition-all ${kanbanBackground === bg.value ? 'border-blue-500 scale-95' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <div
                      className="absolute inset-0 w-full h-full rounded-lg"
                      style={{ background: bg.preview.startsWith('http') ? `url(${bg.preview}) center/cover` : bg.preview }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[9px] font-semibold py-1 px-1 text-center truncate opacity-0 group-hover:opacity-100 transition-opacity">{bg.name}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Kanban Board */}
        <section className="w-full flex-1 overflow-hidden">
          <div className="h-full">
            <DragDropContext onDragEnd={handleDragEnd}>
              <div
                ref={scrollContainerRef}
                className="flex gap-4 pb-6"
                style={{
                  overflowX: 'auto',
                  overflowY: 'visible',
                  cursor: 'grab'
                }}
                onKeyDown={(e) => {
                  // Enable keyboard navigation (arrow keys)
                  const scrollStep = 400; // Increased for faster scroll
                  if (e.key === 'ArrowLeft') {
                    e.currentTarget.scrollLeft -= scrollStep;
                  } else if (e.key === 'ArrowRight') {
                    e.currentTarget.scrollLeft += scrollStep;
                  }
                }}
                tabIndex={0}
              >
                {/* ... keep existing code (FINANCING_COLUMNS.map) ... */}
                {FINANCING_COLUMNS.filter(column => {
                  if (showEmptyColumns) return true;
                  // Always show "Concluído" column if it's the target of a recent move or exists in the list
                  if (column.id === 'concluido') return true; 
                  const columnCases = getCasesByColumn(column.id);
                  return columnCases.length > 0;
                }).map((column) => {
                  const columnCases = getCasesByColumn(column.id);
                  return (
                    <motion.div
                      key={column.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="flex-shrink-0 w-[340px]"
                    >
                      <Droppable droppableId={column.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`w-80 flex flex-col rounded-2xl bg-slate-100/40 backdrop-blur-sm border border-slate-200/50 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/30' : ''}`}
                            style={{ minHeight: '300px', height: 'auto' }}
                          >
                            <div className="p-4 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${column.color.includes('blue') ? 'bg-blue-500' : column.color.includes('yellow') ? 'bg-yellow-500' : column.color.includes('green') ? 'bg-green-500' : column.color.includes('purple') ? 'bg-purple-500' : column.color.includes('red') ? 'bg-red-500' : 'bg-slate-400'}`} />
                                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">{column.name}</h3>
                                <Badge variant="secondary" className="bg-white/50 text-slate-600 rounded-lg text-[10px] px-2 h-5 border-none">
                                  {columnCases.length}
                                </Badge>
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-lg">
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex-1 px-3 pb-4 overflow-y-auto no-scrollbar">
                              {columnCases.map((caseItem, index) => {
                                const daysBadgeColor = caseItem.diasNaFase <= 3 ? 'bg-green-500' : caseItem.diasNaFase <= 7 ? 'bg-yellow-500' : 'bg-red-500';
                                const hasActivityToday = [...pendings, ...tasks].some(item => {
                                  const itemDate = new Date(item.createdDate || '').toDateString();
                                  return itemDate === new Date().toDateString() && (item.atendimentoRef === caseItem._id);
                                });

                                return (
                                  <Draggable key={caseItem._id} draggableId={caseItem._id} index={index}>
                                    {(provided, snapshot) => (
                                      <motion.div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        onClick={() => !snapshot.isDragging && handleOpenDetails(caseItem, 'dados')}
                                        className={`group relative bg-white border border-border-gray rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer ${snapshot.isDragging ? 'shadow-xl ring-2 ring-secondary scale-105' : ''}`}
                                      >
                                        {/* Activity Indicator */}
                                        {hasActivityToday && (
                                          <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" title="Atividade hoje" />
                                        )}

                                        {/* Quick Action Buttons (visible on hover) */}
                                        <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-border-gray rounded-lg px-1.5 py-1 shadow-sm z-10">
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleOpenDetails(caseItem, 'pendencias'); }}
                                            className="p-1 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors"
                                            title="Ver Pendências"
                                          >
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleOpenDetails(caseItem, 'tarefas'); }}
                                            className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                            title="Ver Tarefas"
                                          >
                                            <ListTodo className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleOpenDetails(caseItem, 'historico'); }}
                                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-colors"
                                            title="Ver Histórico"
                                          >
                                            <History className="w-3.5 h-3.5" />
                                          </button>
                                          {caseItem.phoneNumber && (
                                            <a
                                              href={`https://wa.me/55${caseItem.phoneNumber.replace(/\D/g, '')}`}
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

                                        {/* Card Header */}
                                        <div className="mb-2 pr-6">
                                          <h4 className="font-bold text-foreground text-sm line-clamp-1">
                                            {caseItem.proponentePrincipal}
                                          </h4>
                                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-foreground/60">
                                            {caseItem.pastaInterna && <span>• Pasta: {caseItem.pastaInterna}</span>}
                                            {caseItem.numeroContrato && <span>• Contrato: {caseItem.numeroContrato}</span>}
                                          </div>
                                        </div>

                                        {/* Status */}
                                        <div className="text-xs text-foreground/60 mb-3">
                                          Status: <span className="font-medium text-foreground/80">{caseItem.statusResultadoFinanciamento || '—'}</span>
                                        </div>

                                        {/* Mini Indicators */}
                                        <div className="flex flex-wrap gap-2 mb-3 border-t border-slate-50 pt-3">
                                          {caseItem.pendenciasAbertas > 0 && (
                                            <div className="w-full space-y-1">
                                              <Badge variant="outline" className="bg-orange-50 border-orange-100 text-orange-600 text-[10px] gap-1 px-1.5 h-6">
                                                <AlertTriangle className="w-3 h-3" />
                                                {caseItem.pendenciasAbertas} Pend.
                                              </Badge>
                                              <div className="pl-1 space-y-0.5">
                                                {(caseItem as any).pendenciasResumo?.map((p: string, i: number) => (
                                                  <p key={i} className="text-[9px] text-orange-500 font-medium truncate">• {p}</p>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          {caseItem.tarefasAbertas > 0 && (
                                            <div className="w-full space-y-1">
                                              <Badge variant="outline" className="bg-blue-50 border-blue-100 text-blue-600 text-[10px] gap-1 px-1.5 h-6">
                                                <ListTodo className="w-3 h-3" />
                                                {caseItem.tarefasAbertas} Tar.
                                              </Badge>
                                              <div className="pl-1 space-y-0.5">
                                                {(caseItem as any).tarefasResumo?.map((t: string, i: number) => (
                                                  <p key={i} className="text-[9px] text-blue-500 font-medium truncate">• {t}</p>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>


                                        {/* Days Badge */}
                                        <div className="flex items-center gap-1.5 mb-3">
                                          <Clock className="w-3.5 h-3.5 text-foreground/40" />
                                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-white text-xs font-semibold ${daysBadgeColor}`}>
                                            {caseItem.diasNaFase} {caseItem.diasNaFase === 1 ? 'dia' : 'dias'}
                                          </span>
                                        </div>

                                        {/* Bloqueio Icons */}
                                        <div className="flex flex-wrap gap-2 mb-2">
                                          {caseItem.bloqueioDocumento && (
                                            <div className="p-1.5 bg-red-100 rounded cursor-pointer hover:bg-red-200" title="Documento pendente">
                                              <FileText className="w-4 h-4 text-red-600" />
                                            </div>
                                          )}
                                          {caseItem.bloqueioCaixa && (
                                            <div className="p-1.5 bg-blue-100 rounded cursor-pointer hover:bg-blue-200" title="Caixa">
                                              <Building2 className="w-4 h-4 text-blue-600" />
                                            </div>
                                          )}
                                          {caseItem.bloqueioCartorio && (
                                            <div className="p-1.5 bg-purple-100 rounded cursor-pointer hover:bg-purple-200" title="Cartório">
                                              <Landmark className="w-4 h-4 text-purple-600" />
                                            </div>
                                          )}
                                          {caseItem.bloqueioCliente && (
                                            <div className="p-1.5 bg-orange-100 rounded cursor-pointer hover:bg-orange-200" title="Cliente">
                                              <UserCheck className="w-4 h-4 text-orange-600" />
                                            </div>
                                          )}
                                          {caseItem.bloqueioEngenharia && (
                                            <div className="p-1.5 bg-yellow-100 rounded cursor-pointer hover:bg-yellow-200" title="Engenharia">
                                              <Wrench className="w-4 h-4 text-yellow-600" />
                                            </div>
                                          )}
                                          {caseItem.bloqueioFormularios && (
                                            <div className="p-1.5 bg-green-100 rounded cursor-pointer hover:bg-green-200" title="Formulários">
                                              <FileCheck className="w-4 h-4 text-green-600" />
                                            </div>
                                          )}
                                          {caseItem.bloqueioRestricao && (
                                            <div className="p-1.5 bg-red-100 rounded cursor-pointer hover:bg-red-200" title="Restrição">
                                              <Ban className="w-4 h-4 text-red-600" />
                                            </div>
                                          )}
                                          {caseItem.bloqueioFgts && (
                                            <div className="p-1.5 bg-teal-100 rounded cursor-pointer hover:bg-teal-200" title="FGTS">
                                              <Folder className="w-4 h-4 text-teal-600" />
                                            </div>
                                          )}
                                        </div>

                                        {/* Mini Pending List (show first 2 open pendings) */}
                                        {(() => {
                                          const casePendings = pendings.filter(p =>
                                            p.atendimentoRef === caseItem._id &&
                                            p.status !== 'Resolvida' &&
                                            p.status !== 'Concluída'
                                          ).slice(0, 2);
                                          if (casePendings.length > 0) {
                                            return (
                                              <div className="space-y-1 pl-1 mb-2">
                                                <div className="text-xs font-semibold text-orange-600 mb-1">Pendências:</div>
                                                {casePendings.map(pending => (
                                                  <div key={pending._id} className="flex items-start justify-between gap-1.5 text-xs bg-orange-50 p-1.5 rounded">
                                                    <div className="flex items-start gap-1.5 flex-1 min-w-0">
                                                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-orange-500" />
                                                      <span className="line-clamp-1 flex-1 text-foreground/80">{pending.title}</span>
                                                    </div>
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUpdatePendingStatus(pending._id, 'Resolvida');
                                                      }}
                                                      className="px-1.5 py-0.5 bg-green-600 text-white rounded text-[10px] font-semibold hover:bg-green-700 transition-colors flex-shrink-0"
                                                      title="Concluir Pendência"
                                                    >
                                                      Tratar
                                                    </button>
                                                  </div>
                                                ))}
                                                {caseItem.pendenciasAbertas > 2 && (
                                                  <div className="text-xs text-foreground/50 pl-4">
                                                    +{caseItem.pendenciasAbertas - 2} mais...
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          }
                                          return null;
                                        })()}

                                        {/* Mini Task List (show first 2 open tasks) */}
                                        {(() => {
                                          const caseTasks = tasks.filter(t =>
                                            t.atendimentoRef === caseItem._id &&
                                            t.status !== 'Concluída'
                                          ).slice(0, 2);
                                          if (caseTasks.length > 0) {
                                            return (
                                              <div className="space-y-1 pl-1 mb-2">
                                                <div className="text-xs font-semibold text-blue-600 mb-1">Tarefas:</div>
                                                {caseTasks.map(task => {
                                                  const isStarted = task.status === 'Em Andamento' || task.status === 'Em andamento';
                                                  return (
                                                    <div key={task._id} className="flex items-start justify-between gap-1.5 text-xs bg-blue-50 p-1.5 rounded">
                                                      <div className="flex items-start gap-1.5 flex-1 min-w-0">
                                                        <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-500" />
                                                        <div className="flex-1 min-w-0">
                                                          <span className="line-clamp-1 text-foreground/80">{task.titulo || task.description}</span>
                                                          <div className="text-[10px] text-foreground/60 mt-0.5">
                                                            {task.responsibleType} • {task.status}
                                                          </div>
                                                        </div>
                                                      </div>
                                                      <div className="flex gap-1 flex-shrink-0">
                                                        {!isStarted && (
                                                          <button
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleUpdateTaskStatus(task._id, 'Em Andamento');
                                                            }}
                                                            className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px] font-semibold hover:bg-blue-700 transition-colors"
                                                            title="Iniciar Tarefa"
                                                          >
                                                            Iniciar
                                                          </button>
                                                        )}
                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUpdateTaskStatus(task._id, 'Concluída');
                                                          }}
                                                          className="px-1.5 py-0.5 bg-green-600 text-white rounded text-[10px] font-semibold hover:bg-green-700 transition-colors"
                                                          title="Concluir Tarefa"
                                                        >
                                                          Concluir
                                                        </button>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                                {caseItem.tarefasAbertas > 2 && (
                                                  <div className="text-xs text-foreground/50 pl-4">
                                                    +{caseItem.tarefasAbertas - 2} mais...
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          }
                                          return null;
                                        })()}

                                        {/* Action Row: + Pend. | + Tarefa | MOVER */}
                                        <div className="flex items-center gap-1.5 pt-2 border-t border-border-gray mt-1 flex-wrap">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setQuickActionCaseId(caseItem._id);
                                              setShowQuickPendingModal(true);
                                            }}
                                            className="px-2 py-1 bg-orange-50 text-orange-600 border border-orange-200 rounded text-xs font-semibold hover:bg-orange-100 transition-colors flex items-center gap-1"
                                          >
                                            <Plus className="w-3 h-3" /> Pend.
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setQuickActionCaseId(caseItem._id);
                                              setShowQuickTaskModal(true);
                                            }}
                                            className="px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded text-xs font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1"
                                          >
                                            <Plus className="w-3 h-3" /> Tarefa
                                          </button>
                                          <Select value={caseItem.faseAtual} onValueChange={(value) => handleMoveCase(caseItem._id, value)}>
                                            <SelectTrigger
                                              className="px-2 py-1 w-auto min-w-[60px] h-auto min-h-0 bg-slate-100 text-slate-700 border-none rounded text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-1 focus:ring-0 focus:ring-offset-0"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <div className="flex items-center gap-1">
                                                <span>MOVER</span>
                                              </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                              {FINANCING_COLUMNS.map(col => (
                                                <SelectItem key={col.id} value={col.id}>
                                                  {col.name}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </motion.div>

                                    )}
                                  </Draggable>
                                );
                              })}
                              {provided.placeholder}
                            </div>
                          </div>
                        )}
                      </Droppable>
                    </motion.div>
                  );
                })}
              </div>
            </DragDropContext>
          </div>
        </section>

        {/* Details Modal */}
        <Dialog open={showDetailsModal} onOpenChange={(open) => {
          if (!open) {
            const origin = searchParams.get('origin');
            console.log('[Kanban] Closing modal. Origin:', origin);

            if (origin) {
              // Priority: Try to go back in history to preserve state (scroll, filters)
              // But we need to be careful. navigate(-1) works best if we pushed a new entry.
              // Since we are just changing query params, navigate(-1) might just undo the query param change
              // which effectively closes the modal AND keeps us on the same page (Kanban).

              // However, the user request says: "If opened from X, return to X".
              // If we are on Kanban page and we just opened a modal via URL param, we are technically still on Kanban page.

              // Scenario 1: User clicks link in "Tarefas" -> Navigates to "Kanban?openCard=..."
              // This allows navigate(-1) to work perfectly to go back to "Tarefas".

              if (origin === 'tarefas' || origin === 'pendencias') {
                navigate(-1);
                return;
              }

              // Fallback for explicit routes if needed (though navigate(-1) is usually sufficient for cross-page)
              if (origin === 'tarefas') {
                navigate('/admin/financiamento-tarefas');
                return;
              }
              if (origin === 'pendencias') {
                navigate('/admin/financiamento-pendencias');
                return;
              }
            }

            // Default behavior (internal Kanban navigation): just remove the param
            if (searchParams.get('openCard')) {
              const newParams = new URLSearchParams(searchParams);
              newParams.delete('openCard');
              newParams.delete('origin');
              newParams.delete('initialTab');
              newParams.delete('returnUrl'); // Cleanup legacy
              setSearchParams(newParams);
            }
          }
          setShowDetailsModal(open);
        }}>
          <DialogContent className="max-w-6xl h-[90vh] max-h-[90vh] p-0 overflow-hidden flex flex-col bg-background">
            <DialogHeader className="px-6 py-4 border-b border-border-gray sticky top-0 bg-white z-10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <DialogTitle className="font-heading text-2xl text-secondary">
                      Financiamento — {selectedCase?.proponentePrincipal}
                    </DialogTitle>
                    <Select 
                        value={selectedCase?.faseAtual || selectedCase?.status || ''} 
                        onValueChange={handleQuickStatusChange}
                    >
                        <SelectTrigger className="h-6 text-xs font-bold border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-full px-3 w-auto min-w-[140px] focus:ring-0">
                            <SelectValue placeholder="Fase Atual" />
                        </SelectTrigger>
                        <SelectContent>
                            {FINANCING_COLUMNS.map(col => (
                                <SelectItem key={col.id} value={col.id} className="text-xs font-medium">
                                    {col.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
                  {/* Cross-board interlinks panel */}
                  {selectedCase?.interlinks?.relatedServices && selectedCase.interlinks.relatedServices.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 items-center">
                      <span className="text-xs text-gray-400 font-medium">Vínculos:</span>
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
                          'Venda': 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
                          'Compra': 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
                          'Locação': 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200',
                          'Aluguel': 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200',
                          'Financiamento': 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100',
                          'Crédito': 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100',
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
                <div className="flex gap-2 flex-shrink-0">
                  {selectedCase?.phoneNumber && (
                    <Button
                      variant="outline"
                      className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 h-10 px-4"
                      onClick={() => {
                        const phone = selectedCase.phoneNumber?.replace(/\D/g, '');
                        window.open(`https://wa.me/55${phone}`, '_blank');
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                  )}
                  <Button
                    onClick={handleSaveDetails}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90 h-10 px-6"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowDetailsModal(false)}
                    className="h-10 w-10 p-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <Tabs value={modalTab} onValueChange={setModalTab} className="flex-1 flex flex-col min-h-0 w-full">
              <TabsList className="grid grid-cols-7 mb-6 flex-shrink-0 mx-6 mt-6">
                    <TabsTrigger value="dados" className="text-xs">
                      <FileText className="w-4 h-4 mr-1" />
                      Dados
                    </TabsTrigger>
                    <TabsTrigger value="proponentes" className="text-xs">
                      <Users className="w-4 h-4 mr-1" />
                      Proponentes
                    </TabsTrigger>
                    <TabsTrigger value="vendedores" className="text-xs">
                      <UserCheck className="w-4 h-4 mr-1" />
                      Vendedores
                    </TabsTrigger>
                    <TabsTrigger value="pendencias" className="text-xs relative">
                      <ClipboardList className="w-4 h-4 mr-1" />
                      Pendências
                      {(() => {
                        const casePendings = pendings.filter(p => p.atendimentoRef === selectedCase?._id && p.status !== 'Resolvida');
                        if (casePendings.length > 0) {
                          return (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                              {casePendings.length}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </TabsTrigger>
                    <TabsTrigger value="tarefas" className="text-xs relative">
                      <ListTodo className="w-4 h-4 mr-1" />
                      Tarefas
                      {(() => {
                        const caseTasks = tasks.filter(t => t.atendimentoRef === selectedCase?._id && t.status !== 'Concluída');
                        if (caseTasks.length > 0) {
                          return (
                            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                              {caseTasks.length}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </TabsTrigger>
                    <TabsTrigger value="docs" className="text-xs">
                      <FileCheck className="w-4 h-4 mr-1" />
                      Documentos
                    </TabsTrigger>
                    <TabsTrigger value="historico" className="text-xs">
                      <History className="w-4 h-4 mr-1" />
                      Histórico
                    </TabsTrigger>
                  </TabsList>

                  {/* Dados do Processo Tab */}
                  <TabsContent value="dados" className="flex-1 overflow-y-auto min-h-0 w-full px-6 pb-6 focus-visible:outline-none mt-0 space-y-6">
                    {(() => {
                      const firstParticipant = participants[0];
                      const participantClient = clients.find(c => c._id === firstParticipant?.clientRef);

                      return (
                        <>
                          {/* Campos Obrigatórios */}
                          <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-lg font-heading flex items-center gap-2">
                                <Info className="w-5 h-5 text-secondary" />
                                Campos Obrigatórios
                              </CardTitle>
                              <Button
                                onClick={() => setShowAddParticipantModal(true)}
                                className="h-9 bg-secondary text-secondary-foreground"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Participante
                              </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="group relative">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="font-paragraph text-sm block">Proponente Principal (Nome) *</Label>
                                    <CopyButton value={caseFormData.proponentePrincipal || ''} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <Input
                                    value={caseFormData.proponentePrincipal}
                                    onChange={(e) => setCaseFormData({ ...caseFormData, proponentePrincipal: e.target.value })}
                                    placeholder="Nome completo"
                                    className="h-10"
                                  />
                                </div>
                                <div className="group relative">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="font-paragraph text-sm block">CPF do Proponente Principal *</Label>
                                    <CopyButton value={caseFormData.cpfProponentePrincipal || ''} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <Input
                                    value={caseFormData.cpfProponentePrincipal}
                                    onChange={async (e) => {
                                      const { displayValue } = handleCPFInput(e.target.value);
                                      setCaseFormData({ ...caseFormData, cpfProponentePrincipal: displayValue });

                                      // Auto-fill logic: If CPF is complete and valid, search for client
                                      if (displayValue.length === 14 && validateCPF(displayValue)) {
                                        const cleanCpf = displayValue.replace(/\D/g, '');
                                        const existingClient = clients.find(c => (c.cpfCnpj || '').replace(/\D/g, '') === cleanCpf);

                                        if (existingClient) {
                                          setCaseFormData(prev => ({
                                            ...prev,
                                            proponentePrincipal: existingClient.clientName || existingClient.nomeRazaoSocial || prev.proponentePrincipal,
                                            email: existingClient.email || prev.email,
                                            phoneNumber: existingClient.phoneNumber || prev.phoneNumber
                                          }));
                                          toast.info('Dados do cliente preenchidos automaticamente!');
                                        }
                                      }
                                    }}
                                    placeholder="000.000.000-00"
                                    className={`h-10 ${caseFormData.cpfProponentePrincipal &&
                                      caseFormData.cpfProponentePrincipal.length === 14 &&
                                      !validateCPF(caseFormData.cpfProponentePrincipal)
                                      ? 'border-red-500 border-2'
                                      : ''
                                      }`}
                                  />
                                  {caseFormData.cpfProponentePrincipal &&
                                    caseFormData.cpfProponentePrincipal.length === 14 &&
                                    !validateCPF(caseFormData.cpfProponentePrincipal) && (
                                      <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        CPF inválido
                                      </p>
                                    )}
                                </div>

                                {/* Dinâmico: Nome e CPF de todos os Participantes */}
                                {participants.length === 0 ? (
                                  <>
                                    <div className="group relative">
                                      <div className="flex items-center justify-between mb-2">
                                        <Label className="font-paragraph text-sm block">Participante (Nome)</Label>
                                      </div>
                                      <Input
                                        value=""
                                        readOnly
                                        className="h-10 bg-gray-50 cursor-default"
                                        placeholder="Nenhum participante vinculado"
                                      />
                                    </div>
                                    <div className="group relative">
                                      <div className="flex items-center justify-between mb-2">
                                        <Label className="font-paragraph text-sm block">CPF do Participante</Label>
                                      </div>
                                      <Input
                                        value=""
                                        readOnly
                                        className="h-10 bg-gray-50 cursor-default"
                                        placeholder="000.000.000-00"
                                      />
                                    </div>
                                  </>
                                ) : (
                                  participants.map((p) => {
                                    const client = clients.find(c => c._id === p.clientRef);
                                    return (
                                      <div key={p._id} className="contents">
                                        <div className="group relative">
                                          <div className="flex items-center justify-between mb-2">
                                            <Label className="font-paragraph text-sm block">Participante ({p.roleInService || 'Nome'})</Label>
                                            <div className="flex items-center gap-2">
                                              <CopyButton value={client?.clientName || client?.nomeRazaoSocial || ''} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleRemoveParticipant(p._id)}
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </Button>
                                            </div>
                                          </div>
                                          <Input
                                            value={client?.clientName || client?.nomeRazaoSocial || ''}
                                            readOnly
                                            className="h-10 bg-gray-50 cursor-default"
                                            placeholder="Nome do participante"
                                          />
                                        </div>
                                        <div className="group relative">
                                          <div className="flex items-center justify-between mb-2">
                                            <Label className="font-paragraph text-sm block">CPF do Participante ({p.roleInService || 'Papel'})</Label>
                                            <CopyButton value={client?.cpfCnpj || ''} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                          </div>
                                          <Input
                                            value={client?.cpfCnpj || ''}
                                            readOnly
                                            className="h-10 bg-gray-50 cursor-default"
                                            placeholder="000.000.000-00"
                                          />
                                        </div>
                                      </div>
                                    );
                                  })
                                )}

                                <div className="group relative">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="font-paragraph text-sm block">Agência Responsável *</Label>
                                    <CopyButton value={caseFormData.agencia || ''} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <Input
                                    value={caseFormData.agencia}
                                    onChange={(e) => setCaseFormData({ ...caseFormData, agencia: e.target.value })}
                                    placeholder="Nome da agência"
                                    className="h-10"
                                  />
                                </div>
                                <div className="group relative">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="font-paragraph text-sm block">Pasta Interna (editável) *</Label>
                                    <CopyButton value={caseFormData.pastaInterna || ''} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <Input
                                    value={caseFormData.pastaInterna}
                                    onChange={(e) => setCaseFormData({ ...caseFormData, pastaInterna: e.target.value })}
                                    placeholder="Código da pasta"
                                    className="h-10"
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>


                          {/* Dados Bancários */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg font-heading flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-secondary" />
                                Dados Bancários
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="group relative">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="font-paragraph text-sm block">Número da Matrícula</Label>
                                    <CopyButton value={caseFormData.numeroMatricula || ''} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <Input
                                    value={caseFormData.numeroMatricula}
                                    onChange={(e) => setCaseFormData({ ...caseFormData, numeroMatricula: e.target.value })}
                                    className="h-10"
                                  />
                                </div>
                                <div className="group relative">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="font-paragraph text-sm block">Número do Contrato</Label>
                                    <CopyButton value={caseFormData.numeroContrato || ''} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <Input
                                    value={caseFormData.numeroContrato}
                                    onChange={(e) => setCaseFormData({ ...caseFormData, numeroContrato: e.target.value })}
                                    className="h-10"
                                  />
                                </div>
                                <div className="group relative">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="font-paragraph text-sm block">Número do Protocolo do Cartório</Label>
                                    <CopyButton value={caseFormData.numeroProtocoloCartorio || ''} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <Input
                                    value={caseFormData.numeroProtocoloCartorio}
                                    onChange={(e) => setCaseFormData({ ...caseFormData, numeroProtocoloCartorio: e.target.value })}
                                    className="h-10"
                                  />
                                </div>
                                <div className="group relative">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="font-paragraph text-sm block">Data do Registro no Cartório</Label>
                                    <CopyButton value={caseFormData.dataRegistroCartorio ? new Date(caseFormData.dataRegistroCartorio).toLocaleDateString('pt-BR') : ''} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <Input
                                    type="date"
                                    value={caseFormData.dataRegistroCartorio ? new Date(caseFormData.dataRegistroCartorio).toISOString().split('T')[0] : ''}
                                    onChange={(e) => setCaseFormData({ ...caseFormData, dataRegistroCartorio: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                                    className="h-10"
                                  />
                                </div>
                                <div className="group relative col-span-2">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="font-paragraph text-sm block">Endereço do Imóvel</Label>
                                    <CopyButton value={caseFormData.enderecoImovel || ''} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <Input
                                    value={caseFormData.enderecoImovel}
                                    onChange={(e) => setCaseFormData({ ...caseFormData, enderecoImovel: e.target.value })}
                                    placeholder="Endereço completo do imóvel"
                                    className="h-10"
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Financeiro do Financiamento */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg font-heading flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-secondary" />
                                Financeiro do Financiamento
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-1 gap-4">
                                {/* Valor do Imóvel */}
                                <div className="group relative">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="font-paragraph text-sm block">Valor do Imóvel *</Label>
                                    <CopyButton value={formatCurrency(caseFormData.propertyValue)} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <Input
                                    value={formatCurrency(caseFormData.propertyValue)}
                                    onChange={(e) => {
                                      const { displayValue, numericValue } = handleCurrencyInput(e.target.value);
                                      setCaseFormData({ ...caseFormData, propertyValue: numericValue });
                                    }}
                                    placeholder="R$ 0,00"
                                    className="h-10"
                                  />
                                </div>

                                {/* Valor do Financiamento Desejado */}
                                <div className="group relative">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="font-paragraph text-sm block">Valor do Financiamento Desejado *</Label>
                                    <CopyButton value={formatCurrency(caseFormData.desiredFinancingValue)} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <Input
                                    value={formatCurrency(caseFormData.desiredFinancingValue)}
                                    onChange={(e) => {
                                      const { displayValue, numericValue } = handleCurrencyInput(e.target.value);
                                      setCaseFormData({ ...caseFormData, desiredFinancingValue: numericValue });
                                    }}
                                    placeholder="R$ 0,00"
                                    className="h-10"
                                  />
                                </div>

                                {/* Valor do Financiamento Possível/Aprovado + Status de Resultado */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="group relative">
                                    <div className="flex items-center justify-between mb-2">
                                      <Label className="font-paragraph text-sm block">Financiamento Possível/Aprovado</Label>
                                      <CopyButton value={formatCurrency(caseFormData.approvedFinancingValue)} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <Input
                                      value={formatCurrency(caseFormData.approvedFinancingValue)}
                                      onChange={(e) => {
                                        const { displayValue, numericValue } = handleCurrencyInput(e.target.value);
                                        setCaseFormData({ ...caseFormData, approvedFinancingValue: numericValue });
                                      }}
                                      placeholder="R$ 0,00"
                                      className="h-10"
                                    />
                                  </div>
                                  <div>
                                    <Label className="font-paragraph text-sm mb-2 block font-semibold text-xs">
                                      Resultado do financiamento?
                                    </Label>
                                    <Select
                                      value={selectedCase?.statusResultadoFinanciamento || ''}
                                      onValueChange={(value) => {
                                        if (selectedCase) {
                                          handleStatusResultadoChange(selectedCase._id, value as 'Aprovado' | 'Condicionado' | 'Reprovado' | 'Em andamento');
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="h-10 bg-white border-2 border-border-gray">
                                        <SelectValue placeholder="Selecione" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Em andamento">
                                          <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-blue-600" />
                                            <span className="font-semibold">Em andamento</span>
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="Aprovado">
                                          <div className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            <span className="font-semibold">Aprovado</span>
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="Condicionado">
                                          <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                            <span className="font-semibold">Condicionado</span>
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="Reprovado">
                                          <div className="flex items-center gap-2">
                                            <XCircle className="w-4 h-4 text-red-600" />
                                            <span className="font-semibold">Reprovado</span>
                                          </div>
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {/* Valor do Laudo */}
                                <div className="group relative">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="font-paragraph text-sm block">Valor do Laudo</Label>
                                    <CopyButton value={formatCurrency(caseFormData.appraisalValue)} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <Input
                                    value={formatCurrency(caseFormData.appraisalValue)}
                                    onChange={(e) => {
                                      const { displayValue, numericValue } = handleCurrencyInput(e.target.value);
                                      setCaseFormData({ ...caseFormData, appraisalValue: numericValue });
                                    }}
                                    placeholder="R$ 0,00"
                                    className="h-10"
                                  />
                                </div>

                                {/* Valor da Taxa à Vista */}
                                <div className="flex items-center gap-4">
                                  <div className="flex-1 group relative">
                                    <div className="flex items-center justify-between mb-2">
                                      <Label className="font-paragraph text-sm block">Valor da Taxa à Vista</Label>
                                      <CopyButton value={formatCurrency(caseFormData.valorTaxaVista)} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <Input
                                      value={formatCurrency(caseFormData.valorTaxaVista)}
                                      onChange={(e) => {
                                        const { displayValue, numericValue } = handleCurrencyInput(e.target.value);
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

                                {/* Valor do Produto Negociado */}
                                <div className="flex items-center gap-4">
                                  <div className="flex-1 group relative">
                                    <div className="flex items-center justify-between mb-2">
                                      <Label className="font-paragraph text-sm block">Valor do Produto Negociado</Label>
                                      <CopyButton value={formatCurrency(caseFormData.valorProdutoNegociado)} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <Input
                                      value={formatCurrency(caseFormData.valorProdutoNegociado)}
                                      onChange={(e) => {
                                        const { displayValue, numericValue } = handleCurrencyInput(e.target.value);
                                        setCaseFormData({ ...caseFormData, valorProdutoNegociado: numericValue });
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

                                {/* Valor do ITBI */}
                                <div className="flex items-center gap-4">
                                  <div className="flex-1 group relative">
                                    <div className="flex items-center justify-between mb-2">
                                      <Label className="font-paragraph text-sm block">Valor do ITBI</Label>
                                      <CopyButton value={formatCurrency(caseFormData.valorItbi)} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <Input
                                      value={formatCurrency(caseFormData.valorItbi)}
                                      onChange={(e) => {
                                        const { displayValue, numericValue } = handleCurrencyInput(e.target.value);
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
                                  <div className="flex-1 group relative">
                                    <div className="flex items-center justify-between mb-2">
                                      <Label className="font-paragraph text-sm block">Valor da Prenotação do Cartório</Label>
                                      <CopyButton value={formatCurrency(caseFormData.valorPrenotacaoCartorio)} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <Input
                                      value={formatCurrency(caseFormData.valorPrenotacaoCartorio)}
                                      onChange={(e) => {
                                        const { displayValue, numericValue } = handleCurrencyInput(e.target.value);
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
                                  <div className="flex-1 group relative">
                                    <div className="flex items-center justify-between mb-2">
                                      <Label className="font-paragraph text-sm block">Valor do Registro</Label>
                                      <CopyButton value={formatCurrency(caseFormData.valorRegistro)} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <Input
                                      value={formatCurrency(caseFormData.valorRegistro)}
                                      onChange={(e) => {
                                        const { displayValue, numericValue } = handleCurrencyInput(e.target.value);
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
                          <Card>
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
                                  <div className="group relative">
                                    <div className="flex items-center justify-between mb-2">
                                      <Label className="font-paragraph text-sm block">Valor desejado de débito FGTS</Label>
                                      <CopyButton value={formatCurrency(caseFormData.fgtsValue)} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <Input
                                      value={formatCurrency(caseFormData.fgtsValue)}
                                      onChange={(e) => {
                                        const { displayValue, numericValue } = handleCurrencyInput(e.target.value);
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
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg font-heading flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-secondary" />
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
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg font-heading">Contato e Observações</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="group relative">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="font-paragraph text-sm block">E-mail</Label>
                                    <CopyButton value={caseFormData.email || ''} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <Input
                                    type="email"
                                    value={caseFormData.email}
                                    onChange={(e) => setCaseFormData({ ...caseFormData, email: e.target.value })}
                                    className="h-10"
                                  />
                                </div>
                                <div className="group relative">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="font-paragraph text-sm block">Telefone</Label>
                                    <CopyButton value={caseFormData.phoneNumber || ''} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <Input
                                    value={caseFormData.phoneNumber}
                                    onChange={(e) => setCaseFormData({ ...caseFormData, phoneNumber: e.target.value })}
                                    className="h-10"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label className="font-paragraph text-sm mb-2 block">Observações</Label>
                                <Textarea
                                  value={caseFormData.notes}
                                  onChange={(e) => setCaseFormData({ ...caseFormData, notes: e.target.value })}
                                  rows={4}
                                  className="resize-none"
                                />
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      );
                    })()}
                  </TabsContent>

                  {/* Proponentes Tab */}
                  <TabsContent value="proponentes" className="flex-1 overflow-y-auto min-h-0 w-full px-6 pb-6 focus-visible:outline-none mt-0 space-y-6">
                    {/* Master-Detail Layout */}
                    <div className="flex flex-col md:flex-row gap-6 h-[600px]">
                      {/* Left Sidebar: Proponents List */}
                      <div className="w-full md:w-1/3 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-heading text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Users className="w-5 h-5 text-secondary" />
                            Proponentes
                          </h3>
                          {/* Add Participant Button */}

                        </div>

                        <ScrollArea className="flex-1 pr-4 -mr-4">
                          <div className="space-y-3">
                            {(() => {
                              // Build proponents list (same logic as before but for the sidebar)
                              const proponentsList: Array<{ clientRef: string; name: string; cpf: string; roleInService: string; isPrincipal: boolean; participantId?: string }> = [];

                              // Principal
                              if (caseFormData.proponentePrincipal) {
                                const principalKey = `principal-${selectedCase?._id}`;
                                proponentsList.push({
                                  clientRef: principalKey,
                                  name: caseFormData.proponentePrincipal,
                                  cpf: caseFormData.cpfProponentePrincipal || '',
                                  roleInService: 'Proponente/Comprador',
                                  isPrincipal: true
                                });
                              }

                              // Participants
                              participants.forEach(participant => {
                                if (participant.roleInService === 'Vendedor') return;
                                const client = clients.find(c => c._id === participant.clientRef);
                                if (client) {
                                  const isDuplicate = caseFormData.cpfProponentePrincipal && client.cpfCnpj === caseFormData.cpfProponentePrincipal;
                                  if (!isDuplicate) {
                                    proponentsList.push({
                                      clientRef: participant.clientRef,
                                      name: client.clientName || client.nomeRazaoSocial || 'Nome não disponível',
                                      cpf: client.cpfCnpj || '',
                                      roleInService: participant.roleInService || 'Participante',
                                      isPrincipal: false,
                                      participantId: participant._id
                                    });
                                  }
                                }
                              });

                              return proponentsList.map((proponent) => (
                                <div
                                  key={proponent.clientRef}
                                  onClick={() => setSelectedProponentId(proponent.clientRef)}
                                  className={`p-3 rounded-lg border transition-all cursor-pointer relative group ${selectedProponentId === proponent.clientRef
                                    ? 'bg-blue-50 border-blue-200 shadow-sm'
                                    : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                                    }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className={`font-semibold text-sm ${selectedProponentId === proponent.clientRef ? 'text-blue-700' : 'text-slate-700'}`}>
                                        {proponent.name}
                                      </p>
                                      <p className="text-xs text-slate-500 mt-0.5">{proponent.roleInService}</p>
                                    </div>
                                    {selectedProponentId === proponent.clientRef && (
                                      <div className="bg-blue-100 p-1 rounded-full">
                                        <CheckCircle className="w-3 h-3 text-blue-600" />
                                      </div>
                                    )}
                                  </div>
                                  {!proponent.isPrincipal && proponent.participantId && (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-600 hover:bg-red-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveParticipant(proponent.participantId!);
                                      }}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                </div>
                              ));
                            })()}
                          </div>
                        </ScrollArea>
                      </div>

                      {/* Right Panel: Detail View */}
                      <div className="flex-1 h-full overflow-hidden">
                        {selectedProponentId ? (() => {
                          // Re-calculate the current proponent object based on ID
                          const currentClientRef = selectedProponentId;
                          const principalKey = `principal-${selectedCase?._id}`;
                          let proponent: any = null;

                          // Build all proponents list for the dropdown
                          const allProponentsList: Array<{ clientRef: string; name: string; cpf: string }> = [];

                          // Add Principal
                          if (caseFormData.proponentePrincipal) {
                            allProponentsList.push({
                              clientRef: principalKey,
                              name: caseFormData.proponentePrincipal,
                              cpf: caseFormData.cpfProponentePrincipal || ''
                            });
                          }

                          // Add Participants
                          participants.forEach(p => {
                            if (p.roleInService === 'Vendedor') return;
                            const client = clients.find(c => c._id === p.clientRef);
                            if (client) {
                              // Exclude if duplicate of principal
                              const isDuplicate = caseFormData.cpfProponentePrincipal && client.cpfCnpj === caseFormData.cpfProponentePrincipal;
                              if (!isDuplicate) {
                                allProponentsList.push({
                                  clientRef: p.clientRef,
                                  name: client.clientName || client.nomeRazaoSocial || 'Nome não disponível',
                                  cpf: client.cpfCnpj || ''
                                });
                              }
                            }
                          });


                          // Check if is principal
                          if (caseFormData.proponentePrincipal && currentClientRef === principalKey) {
                            proponent = {
                              clientRef: currentClientRef,
                              name: caseFormData.proponentePrincipal,
                              cpf: caseFormData.cpfProponentePrincipal || '',
                              roleInService: selectedCase?.roleInService || 'Proponente/Comprador', // Use stored role or default
                              isPrincipal: true,
                              spouseRef: selectedCase?.spouseRef
                            };
                          } else {
                            // Check participants
                            const participant = participants.find(p => p.clientRef === currentClientRef);
                            const client = clients.find(c => c._id === currentClientRef);
                            if (participant && client) {
                              proponent = {
                                clientRef: participant.clientRef,
                                name: client.clientName || client.nomeRazaoSocial,
                                cpf: client.cpfCnpj,
                                roleInService: participant.roleInService,
                                isPrincipal: false,
                                spouseRef: participant.spouseRef
                              };
                            }
                          }

                          if (!proponent) return <div className="h-full flex items-center justify-center text-slate-400">Proponente não encontrado</div>;

                          const checklist = proponentChecklists.get(currentClientRef);
                          const docs = proponentDocuments.filter(d => d.proponentRef === currentClientRef);

                          const spouseRefProp = proponent.spouseRef === selectedCase?.clientePrincipalRef
                            ? principalKey
                            : proponent.spouseRef;

                          return (
                            <ProponentChecklistCard
                              proponentId={currentClientRef}
                              name={proponent.name}
                              cpf={proponent.cpf}
                              role={proponent.roleInService}
                              checklist={checklist}
                              documents={docs}
                              spouseRef={spouseRefProp}
                              allProponents={allProponentsList}
                              // onUpdateRole={handleUpdateProponentRole} // Disabled as per requirement (read-only in this tab)
                              onUpdateSpouse={handleUpdateProponentSpouse}
                              onUpdateChecklist={(pid, field, val) => handleUpdateProponentChecklist(pid, field, val)}
                              onUpdateDocument={(pid, docName, received, isMandatory) => {
                                // Find doc by name
                                const docToUpdate = docs.find(d => d.documentName === docName);
                                if (docToUpdate) {
                                  handleUpdateDocumentItem(currentClientRef, docToUpdate._id, {
                                    isReceived: received,
                                    isMandatory: isMandatory,
                                    uploadDate: received ? new Date().toISOString() : undefined
                                  });
                                } else if (received) {
                                  // Create if doesn't exist and is being marked as received
                                  // We need to create it!
                                  const newId = crypto.randomUUID();
                                  const newDoc = {
                                    _id: newId,
                                    atendimentoRef: selectedCase._id,
                                    proponentRef: currentClientRef,
                                    documentName: docName,
                                    isReceived: true,
                                    isMandatory: isMandatory,
                                    isActive: true, // Default to active
                                    uploadDate: new Date().toISOString(),
                                    updatedAt: new Date().toISOString()
                                  };

                                  BaseCrudService.create('documentosproponentes', newDoc).then(() => {
                                    setProponentDocuments(prev => [...prev, newDoc as any]);
                                  });
                                }
                              }}
                              onDeleteDocument={async (pid, docName) => {
                                const doc = docs.find(d => d.documentName === docName);
                                if (doc) {
                                  await handleDeleteDocumentItem(pid, doc._id);
                                } else {
                                  // Create as inactive if it doesn't exist yet
                                  const newDoc = {
                                    _id: crypto.randomUUID(),
                                    atendimentoRef: selectedCase._id,
                                    proponentRef: pid,
                                    documentName: docName,
                                    isReceived: false,
                                    isMandatory: false,
                                    isActive: false,
                                    updatedAt: new Date().toISOString()
                                  };
                                  await BaseCrudService.create('documentosproponentes', newDoc);
                                  setProponentDocuments(prev => [...prev, newDoc as any]);
                                }
                              }}
                              onRestoreDocument={async (pid, docName) => {
                                const doc = docs.find(d => d.documentName === docName);
                                if (doc) {
                                  await handleRestoreDocumentItem(pid, doc._id);
                                }
                              }}
                            />
                          );
                        })() : (
                          <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400">
                            <Users className="w-12 h-12 mb-3 opacity-20" />
                            <p>Selecione um proponente para ver detalhes</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Vendedores Tab */}
                  <TabsContent value="vendedores" className="flex-1 overflow-y-auto min-h-0 w-full px-6 pb-6 focus-visible:outline-none mt-0 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg font-heading flex items-center gap-2">
                          <UserCheck className="w-5 h-5 text-secondary" />
                          Vendedores do Imóvel
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          if (vendors.length === 0) {
                            return (
                              <div className="text-center py-12 bg-light-gray/50 rounded-xl border-2 border-dashed border-border-gray">
                                <UserCheck className="w-16 h-16 mx-auto mb-4 text-foreground/20" />
                                <h4 className="font-heading text-lg font-semibold mb-2 text-foreground/80">
                                  Nenhum vendedor cadastrado
                                </h4>
                                <p className="text-sm text-foreground/60 mb-4">
                                  Adicione os vendedores do imóvel para gerenciar documentos e dados bancários
                                </p>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                                      <Plus className="w-4 h-4 mr-2" />
                                      Adicionar Primeiro Vendedor
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Adicionar Novo Vendedor</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                      <div>
                                        <Label className="mb-2 block">Selecionar Cliente *</Label>
                                        <Select value={newVendor.clientRef} onValueChange={(value) => setNewVendor({ ...newVendor, clientRef: value })}>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Escolha um cliente" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {clients
                                              .filter(c => !vendors.some(v => v.clientRef === c._id))
                                              .map(client => (
                                                <SelectItem key={client._id} value={client._id}>
                                                  {client.clientName || client.nomeRazaoSocial} {client.cpfCnpj ? `- ${client.cpfCnpj}` : ''}
                                                </SelectItem>
                                              ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <Button
                                        onClick={handleAddVendor}
                                        disabled={!newVendor.clientRef}
                                        className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                      >
                                        Adicionar
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            );
                          }

                          // CRITICAL FIX: Show ALL vendors in a flat list, not hierarchical
                          // This ensures all vendors appear regardless of ehConjugeDe status

                          return (
                            <div className="space-y-6">
                              <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-250px)] min-h-[600px]">
                                {/* Left Sidebar - List of Vendors */}
                                <Card className="lg:w-1/3 flex flex-col border-2 border-border-gray shadow-sm hover:shadow-md transition-shadow">
                                  <CardHeader className="bg-gradient-to-r from-light-gray to-white border-b border-border-gray pb-4">
                                    <div className="flex justify-between items-center">
                                      <CardTitle className="text-lg font-heading flex items-center gap-2">
                                        <Ticket className="w-5 h-5 text-secondary" />
                                        Vendedores
                                        <Badge className="ml-2 bg-secondary text-secondary-foreground">
                                          {vendors.length}
                                        </Badge>
                                      </CardTitle>
                                      {/* Add Vendor Button (Small) */}
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button size="icon" variant="ghost" className="h-8 w-8 text-secondary hover:bg-secondary/10">
                                            <Plus className="w-5 h-5" />
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                          <DialogHeader>
                                            <DialogTitle>Adicionar Novo Vendedor</DialogTitle>
                                          </DialogHeader>
                                          <div className="space-y-4 py-4">
                                            <div>
                                              <Label className="mb-2 block">Selecionar Cliente *</Label>
                                              <Select value={newVendor.clientRef} onValueChange={(value) => setNewVendor({ ...newVendor, clientRef: value })}>
                                                <SelectTrigger>
                                                  <SelectValue placeholder="Escolha um cliente" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {clients
                                                    .filter(c => !vendors.some(v => v.clientRef === c._id))
                                                    .map(client => (
                                                      <SelectItem key={client._id} value={client._id}>
                                                        {client.clientName || client.nomeRazaoSocial} {client.cpfCnpj ? `- ${client.cpfCnpj}` : ''}
                                                      </SelectItem>
                                                    ))}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <Button
                                              onClick={handleAddVendor}
                                              disabled={!newVendor.clientRef}
                                              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                            >
                                              Adicionar
                                            </Button>
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="p-0 flex-1 overflow-hidden">
                                    <ScrollArea className="h-full">
                                      <div className="divide-y divide-border-gray">
                                        {vendors.length === 0 ? (
                                          <div className="p-8 text-center text-foreground/50">
                                            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p className="text-sm">Nenhum vendedor cadastrado</p>
                                          </div>
                                        ) : (
                                          vendors.map((vendor) => {
                                            const isSelected = selectedVendorId === vendor.clientRef;
                                            return (
                                              <div
                                                key={vendor._id}
                                                onClick={() => setSelectedVendorId(vendor.clientRef)}
                                                className={`p-4 cursor-pointer transition-all hover:bg-light-gray/50 ${isSelected ? 'bg-secondary/5 border-l-4 border-l-secondary' : 'border-l-4 border-l-transparent'
                                                  }`}
                                              >
                                                <div className="flex items-start justify-between">
                                                  <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${isSelected
                                                      ? 'bg-secondary text-white shadow-md'
                                                      : 'bg-light-gray text-foreground/60'
                                                      }`}>
                                                      {vendor.name.substring(0, 1).toUpperCase()}
                                                    </div>
                                                    <div>
                                                      <h4 className={`font-heading text-sm font-bold ${isSelected ? 'text-secondary' : 'text-foreground'}`}>
                                                        {vendor.name}
                                                      </h4>
                                                      <div className="flex flex-col gap-0.5 mt-1">
                                                        <span className="text-xs text-foreground/60 flex items-center gap-1">
                                                          <CreditCard className="w-3 h-3" />
                                                          {vendor.cpf}
                                                        </span>
                                                        {vendor.ehConjugeDe && (
                                                          <Badge variant="outline" className="text-[10px] w-fit px-1 py-0 h-5 mt-1 border-secondary/30 text-secondary bg-secondary/5">
                                                            Cônjuge
                                                          </Badge>
                                                        )}
                                                      </div>
                                                  </div>
                                                  </div>
                                                  <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleRemoveVendor(vendor._id);
                                                      if (isSelected) setSelectedVendorId('');
                                                    }}
                                                    className="h-8 w-8 text-gray-400 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                  >
                                                    <Trash2 className="w-4 h-4" />
                                                  </Button>
                                                </div>
                                              </div>
                                            );
                                          })
                                        )}
                                      </div>
                                    </ScrollArea>
                                  </CardContent>
                                </Card>

                                {/* Right Panel - Vendor Details */}
                                <div className="bg-light-gray/30 rounded-xl border-2 border-dashed border-border-gray lg:w-2/3 overflow-hidden flex flex-col">
                                  {selectedVendorId ? (
                                    (() => {
                                      const vendor = vendors.find(v => v.clientRef === selectedVendorId);
                                      if (!vendor) return null;
                                      const docs = vendorDocuments.get(selectedVendorId) || [];

                                      return (
                                        <ScrollArea className="h-full pr-4">
                                          <div className="py-1">
                                            <VendorDetailCard
                                              vendor={vendor}
                                              allVendors={vendors}
                                              documents={docs}
                                              onUpdateVendorData={handleUpdateVendorBankData}
                                              onUpdateDocument={handleUpdateVendorDocument}
                                              onRestoreDocument={handleRestoreVendorDocument}
                                              onDeleteDocument={handleDeleteVendorDocument}
                                            />
                                          </div>
                                        </ScrollArea>
                                      );
                                    })()
                                  ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-foreground/40 p-12 text-center h-full">
                                      <div className="w-24 h-24 bg-border-gray/30 rounded-full flex items-center justify-center mb-6">
                                        <UserCheck className="w-12 h-12 opacity-50" />
                                      </div>
                                      <h3 className="text-xl font-heading font-bold mb-2">Selecione um Vendedor</h3>
                                      <p className="max-w-md">
                                        Clique em um vendedor na lista ao lado para ver e editar seus dados bancários e documentos.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Pendências Tab */}
                  <TabsContent value="pendencias" className="flex-1 overflow-y-auto min-h-0 w-full px-6 pb-6 focus-visible:outline-none mt-0 space-y-6">
                    {/* Pendências Section */}
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg font-heading flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-secondary" />
                            Pendências
                            <Badge className="ml-2 bg-orange-500 text-white">
                              {pendings.filter(p => p.atendimentoRef === selectedCase?._id && p.status !== 'Resolvida' && p.status !== 'Concluída').length} abertas
                            </Badge>
                          </CardTitle>
                          <Button
                            onClick={() => {
                              setShowPendingForm(true);
                              setEditingPending(null);
                              setNewPendingData({
                                title: '',
                                description: '',
                                responsiblePartyType: 'Cliente',
                                responsiblePartyDetails: '',
                                averageDaysToComplete: 7
                              });
                            }}
                            className="h-9 bg-secondary text-secondary-foreground"
                          >
                            +Tarefas
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">

                        {/* Toggle Completed */}
                        <div className="flex items-center space-x-2 justify-end mb-2">
                          <Checkbox
                            id="show-completed"
                            checked={showCompletedPendings}
                            onCheckedChange={(checked) => setShowCompletedPendings(checked as boolean)}
                          />
                          <label
                            htmlFor="show-completed"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-foreground/70"
                          >
                            Mostrar concluídas
                          </label>
                        </div>

                        {/* Pending Form */}
                        {showPendingForm && (
                          <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-300 rounded-xl space-y-4 shadow-md">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-heading text-base font-bold text-secondary flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                                Nova Pendência
                              </h4>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setShowPendingForm(false);
                                  setEditingPending(null);
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm mb-2 block font-semibold">Responsável *</Label>
                                <Select
                                  value={newPendingData.responsiblePartyType}
                                  onValueChange={(value) => setNewPendingData({ ...newPendingData, responsiblePartyType: value })}
                                >
                                  <SelectTrigger className="h-11 bg-white border-2 border-border-gray">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Cliente">Cliente</SelectItem>
                                    <SelectItem value="Parceiro Externo">Parceiro Externo</SelectItem>
                                    <SelectItem value="Construtora">Construtora</SelectItem>
                                    <SelectItem value="Caixa">Caixa</SelectItem>
                                    <SelectItem value="Cartório">Cartório</SelectItem>
                                    <SelectItem value="Sistema/Prazo legal">Sistema/Prazo legal</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>


                              <div>
                                <Label className="text-sm mb-2 block font-semibold">Título *</Label>
                                <Input
                                  value={newPendingData.title}
                                  onChange={(e) => setNewPendingData({ ...newPendingData, title: e.target.value })}
                                  placeholder="Título curto da pendência..."
                                  className="h-11 bg-white border-2 border-border-gray"
                                />
                              </div>

                              <div>
                                <Label className="text-sm mb-2 block font-semibold">Descrição *</Label>
                                <Textarea
                                  value={newPendingData.description}
                                  onChange={(e) => setNewPendingData({ ...newPendingData, description: e.target.value })}
                                  placeholder="Descreva a pendência de forma clara e objetiva..."
                                  rows={4}
                                  className="resize-none text-sm bg-white border-2 border-border-gray"
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
                                  className="h-11 bg-white border-2 border-border-gray"
                                />
                                <p className="text-xs text-foreground/60 mt-1">
                                  Data de vencimento será calculada automaticamente
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-3 pt-3 border-t-2 border-blue-200">
                              <Button
                                onClick={handleSavePending}
                                disabled={!newPendingData.description || !newPendingData.title || (newPendingData.responsiblePartyType === 'Interno' && !newPendingData.responsiblePartyDetails)}
                                className="h-11 flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold"
                              >
                                <Save className="w-4 h-4 mr-2" />
                                Criar Pendência
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowPendingForm(false);
                                  setEditingPending(null);
                                }}
                                className="h-11 px-6 border-2"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Pending List */}
                        <div className="space-y-3">
                          {(() => {
                            const casePendings = pendings
                              .filter(p => {
                                const belongsToCase = p.atendimentoRef === selectedCase?._id;
                                const isCompleted = p.status === 'Concluída' || p.status === 'Resolvida';

                                if (!belongsToCase) return false;

                                return showCompletedPendings ? true : !isCompleted;
                              })
                              .sort((a, b) => {
                                // Sort by creation date DESC (most recent first)
                                const dateA = a.creationDate ? new Date(a.creationDate).getTime() : 0;
                                const dateB = b.creationDate ? new Date(b.creationDate).getTime() : 0;
                                return dateB - dateA;
                              });

                            if (casePendings.length === 0) {
                              return (
                                <div className="text-center py-8 text-foreground/60">
                                  <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                  <p className="text-sm">Nenhuma pendência pendente</p>
                                </div>
                              );
                            }

                            return casePendings.map(pending => {
                              const isOverdue = pending.dueDate && new Date(pending.dueDate) < new Date() && pending.status !== 'Concluída' && pending.status !== 'Resolvida';

                              return (
                                <div key={pending._id} className={`p-4 rounded-lg border-2 transition-all ${isOverdue
                                  ? 'bg-red-50 border-red-300 shadow-md'
                                  : (pending.status === 'Concluída' || pending.status === 'Resolvida')
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-white border-border-gray shadow-sm'
                                  }`}>
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <h4 className={`font-paragraph font-bold text-sm mb-1 ${isOverdue ? 'text-red-700' : ''}`}>
                                        {pending.title}
                                        {isOverdue && (
                                          <Badge className="ml-2 text-xs bg-red-600 text-white">ATRASADA</Badge>
                                        )}
                                      </h4>
                                      {pending.description && (
                                        <p className="text-xs text-foreground/70 mb-2">{pending.description}</p>
                                      )}
                                      <div className="flex flex-wrap gap-1.5">
                                        <Badge variant={(pending.status === 'Concluída' || pending.status === 'Resolvida') ? 'default' : 'secondary'} className="text-xs">
                                          {pending.status}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">{pending.priority}</Badge>
                                        {pending.categoria && (
                                          <Badge className="text-xs bg-secondary/10 text-secondary border-secondary/20">
                                            {pending.categoria}
                                          </Badge>
                                        )}
                                        {pending.bloqueiaFase && (
                                          <Badge variant="destructive" className="text-xs">
                                            Bloqueia fase
                                          </Badge>
                                        )}
                                        <Badge variant="outline" className="text-xs">
                                          {pending.responsiblePartyType}
                                        </Badge>
                                      </div>
                                      {pending.dueDate && (
                                        <div className={`flex items-center gap-1 mt-2 text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-foreground/60'}`}>
                                          <Calendar className="w-3 h-3" />
                                          <span>Prazo: {new Date(pending.dueDate).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex gap-1 ml-3">
                                      <Button
                                        size="sm"
                                        variant={(pending.status === 'Concluída' || pending.status === 'Resolvida') ? 'outline' : 'default'}
                                        onClick={() => handleUpdatePendingStatus(pending._id, (pending.status === 'Concluída' || pending.status === 'Resolvida') ? 'Pendente' : 'Concluída')}
                                        className={(pending.status === 'Concluída' || pending.status === 'Resolvida') ? 'h-8' : 'h-8 bg-green-600 hover:bg-green-700 text-white'}
                                      >
                                        {(pending.status === 'Concluída' || pending.status === 'Resolvida') ? (
                                          <><RotateCcw className="w-3 h-3 mr-1" /> Reabrir</>
                                        ) : (
                                          <><CheckSquare className="w-3 h-3 mr-1" /> Concluir</>
                                        )}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeletePending(pending._id)}
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Tarefas Tab */}
                  <TabsContent value="tarefas" className="flex-1 overflow-y-auto min-h-0 w-full px-6 pb-6 focus-visible:outline-none mt-0 space-y-6">
                    {/* Task Creation Form - NOW AT TOP */}
                    {showTaskFormInModal && (
                      <Card className="border-2 border-secondary/30 shadow-lg">
                        <CardHeader className="bg-gradient-to-br from-blue-50 to-blue-100/50">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base font-heading flex items-center gap-2">
                              <Plus className="w-5 h-5 text-secondary" />
                              Criar Nova Tarefa
                            </CardTitle>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowTaskFormInModal(false)}
                              className="h-8 w-8 p-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                          <div>
                            <Label className="text-sm mb-2 block font-semibold">Responsável (Logins Financiamento) *</Label>
                            <Select
                              value={newTaskData.internalResponsibleId || ''}
                              onValueChange={(value) => {
                                const user = financingTeam.find(u => u._id === value);
                                setNewTaskData({
                                  ...newTaskData,
                                  internalResponsibleId: value,
                                  responsibleType: 'Interno',
                                  externalResponsibleName: user?.name || user?.emailLogin || '',
                                  responsavelExternoRef: value
                                });
                              }}
                            >
                              <SelectTrigger className="h-11 bg-white border-2 border-border-gray">
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

                          <div>
                            <Label className="text-sm mb-2 block font-semibold">Descrição *</Label>
                            <Textarea
                              value={newTaskData.description}
                              onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                              placeholder="Descreva a tarefa de forma clara e objetiva..."
                              rows={4}
                              className="resize-none text-sm bg-white border-2 border-border-gray"
                            />
                          </div>

                          <div>
                            <Label className="text-sm mb-2 block font-semibold">Prazo</Label>
                            <Input
                              type="date"
                              value={newTaskData.dueDate ? new Date(newTaskData.dueDate).toISOString().split('T')[0] : ''}
                              onChange={(e) => setNewTaskData({ ...newTaskData, dueDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                              className="h-11 bg-white border-2 border-border-gray"
                            />
                            <p className="text-xs text-foreground/60 mt-1">
                              Se não informado, será definido para 7 dias
                            </p>
                          </div>

                          <div className="flex gap-3 pt-3 border-t-2 border-border-gray">
                            <Button
                              onClick={handleCreateTaskInModal}
                              disabled={!newTaskData.description}
                              className="h-11 flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Criar Tarefa
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setShowTaskFormInModal(false)}
                              className="h-11 px-6 border-2"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg font-heading flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-secondary" />
                            Tarefas
                            <Badge className="ml-2 bg-blue-500 text-white">
                              {tasks.filter(t => t.atendimentoRef === selectedCase?._id && t.status !== 'Concluída').length} abertas
                            </Badge>
                          </CardTitle>
                          <Button
                            onClick={() => {
                              setNewTaskData({
                                description: '',
                                responsibleType: 'Interno',
                                internalResponsibleId: '',
                                externalResponsibleName: '',
                                externalResponsibleContact: '',
                                dueDate: ''
                              });
                              setShowTaskFormInModal(true);
                            }}
                            className="h-9 bg-secondary text-secondary-foreground"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Tarefa
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Toggle Completed */}
                        <div className="flex items-center space-x-2 justify-end mb-2">
                          <Checkbox
                            id="show-completed-tasks"
                            checked={showCompletedTasks}
                            onCheckedChange={(checked) => setShowCompletedTasks(checked as boolean)}
                          />
                          <label
                            htmlFor="show-completed-tasks"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-foreground/70"
                          >
                            Mostrar concluídas
                          </label>
                        </div>

                        {(() => {
                          const caseTasks = tasks
                            .filter(t => {
                              const belongsToCase = t.atendimentoRef === selectedCase?._id;
                              const isCompleted = t.status === 'Concluída';
                              if (!belongsToCase) return false;
                              return showCompletedTasks ? true : !isCompleted;
                            })
                            .sort((a, b) => {
                              // Sort by creation date DESC (most recent first)
                              const dateA = a.creationDate ? new Date(a.creationDate).getTime() : 0;
                              const dateB = b.creationDate ? new Date(b.creationDate).getTime() : 0;
                              return dateB - dateA;
                            });

                          if (caseTasks.length === 0) {
                            return (
                              <div className="text-center py-8 text-foreground/60">
                                <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Nenhuma tarefa gerada</p>
                              </div>
                            );
                          }

                          return caseTasks.map(task => {
                            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Concluída';
                            const hasActivityToday = task.creationDate && new Date(task.creationDate).toDateString() === new Date().toDateString();
                            const responsibleName = getTaskResponsibleName(task);

                            return (
                              <div key={task._id} className={`p-4 rounded-lg border-2 transition-all ${task.status === 'Concluída'
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200 shadow-sm'
                                }`}>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className={`font-paragraph font-semibold text-sm mb-2 ${isOverdue ? 'text-red-700' : ''}`}>
                                      {task.description || task.titulo}
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      <Badge
                                        variant="outline"
                                        className={`text-xs ${task.status === 'Concluída'
                                          ? 'bg-green-100 text-green-700 border-green-200'
                                          : 'bg-red-100 text-red-700 border-red-300'
                                          }`}
                                      >
                                        {task.status}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">{task.responsibleType}</Badge>
                                      {responsibleName && (
                                        <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                                          {responsibleName}
                                        </Badge>
                                      )}
                                      {task.dueDate && (
                                        <Badge variant="outline" className={`text-xs ${isOverdue ? 'bg-red-100 text-red-700 border-red-300' : ''}`}>
                                          <Calendar className="w-3 h-3 mr-1" />
                                          {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                                        </Badge>
                                      )}
                                      {isOverdue && (
                                        <Badge className="text-xs bg-red-600 text-white">
                                          ATRASADA
                                        </Badge>
                                      )}
                                      {hasActivityToday && (
                                        <Badge className="text-xs bg-green-600 text-white">
                                          HOJE
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-1 ml-3">
                                    {(task.status === 'Aberta' || task.status === 'A Fazer') && (
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => handleUpdateTaskStatus(task._id, 'Em Andamento')}
                                        className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
                                      >
                                        <Clock className="w-3 h-3 mr-1" /> Iniciar
                                      </Button>
                                    )}
                                    {(task.status === 'Aberta' || task.status === 'A Fazer' || task.status === 'Em andamento' || task.status === 'Em Andamento') && (
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => handleUpdateTaskStatus(task._id, 'Concluída')}
                                        className="h-8 bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        <CheckSquare className="w-3 h-3 mr-1" /> Concluir
                                      </Button>
                                    )}
                                    {task.status === 'Concluída' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleUpdateTaskStatus(task._id, 'Aberta')}
                                        className="h-8"
                                      >
                                        <RotateCcw className="w-3 h-3 mr-1" /> Reabrir
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Documentos Tab */}
                  <TabsContent value="docs" className="flex-1 overflow-y-auto min-h-0 w-full px-6 pb-6 focus-visible:outline-none mt-0 space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-heading text-lg">Documentos</h3>
                        <Button className="h-9 bg-secondary text-secondary-foreground">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {documents.map(doc => (
                          <div key={doc._id} className="bg-light-gray p-3 rounded border border-border-gray">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-paragraph font-semibold text-sm">{doc.documentName}</h4>
                                <p className="text-xs text-foreground/60">{doc.documentType}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateDocumentStatus(doc._id, 'Aprovado')}
                                >
                                  Aprovar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateDocumentStatus(doc._id, 'Rejeitado')}
                                >
                                  Rejeitar
                                </Button>
                              </div>
                            </div>
                            <Badge className="mt-2" variant={doc.documentStatus === 'Aprovado' ? 'default' : 'secondary'}>
                              {doc.documentStatus}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200">
                      <h3 className="font-heading text-lg mb-4 flex items-center gap-2"><File className="w-5 h-5 text-indigo-500"/> Documentos Adicionais</h3>
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
                            ? 'border-indigo-400 bg-indigo-50 scale-[1.01]'
                            : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50'
                        }`}
                      >
                        <Upload className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                        <p className="text-sm font-semibold text-slate-600">Arraste documentos extras aqui ou clique para selecionar</p>
                        <p className="text-xs text-slate-400 mt-1">PDF, Word, Excel, imagens — arquivos gerais do processo</p>
                        <input
                          ref={docInputRef}
                          type="file"
                          multiple
                          className="hidden"
                          onChange={e => handleDocFileDrop(e.target.files)}
                        />
                      </div>

                      {uploadedDocs.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center italic">Nenhum documento adicional anexado ainda.</p>
                      ) : (
                        <div className="space-y-2">
                          {uploadedDocs.map((doc, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                                  <File className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-800">{doc.name}</p>
                                  <p className="text-[10px] text-slate-400">{(doc.size / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}</p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <a href={doc.url} download={doc.name} onClick={e => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600">
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
                    </div>
                  </TabsContent>

                  {/* Histórico Tab */}
                  <TabsContent value="historico" className="flex-1 overflow-y-auto min-h-0 w-full px-6 pb-6 focus-visible:outline-none mt-0 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg font-heading flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <ListTodo className="w-5 h-5 text-secondary" />
                            Checklist e Histórico
                          </div>
                          {selectedCase?.faseAtual !== 'concluido' && (
                            <Button 
                              onClick={handleConcludeProcess}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 rounded-xl px-4 flex items-center gap-2 shadow-lg shadow-emerald-200"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Concluir Processo
                            </Button>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Checklist Section */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <FinancingStageChecklist
                            caseData={caseFormData}
                            onUpdateAnswer={handleUpdateChecklistAnswer}
                            answers={caseFormData.checklistResponses}
                            onConclude={handleConcludeProcess}
                          />
                        </div>

                        {/* History Section */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-slate-800">Linha do Tempo</h3>
                          <div className="space-y-3">
                            {history.map(item => (
                              <div key={item._id} className="bg-light-gray p-4 rounded-lg border-l-4 border-secondary">
                                <div className="flex justify-between items-start mb-2">
                                  <p className="font-paragraph text-sm font-semibold">{item.interactionType}</p>
                                  <span className="text-xs text-foreground/60">
                                    {item.interactionDate ? new Date(item.interactionDate).toLocaleString('pt-BR') : ''}
                                  </span>
                                </div>
                                <p className="text-sm text-foreground/70">{item.interactionDescription}</p>
                                {item.tipoEvento && (
                                  <Badge className="mt-2" variant="outline">{item.tipoEvento}</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
          </DialogContent>
        </Dialog>

        {/* Quick Task Creation Modal */}
        <Dialog open={showQuickTaskModal} onOpenChange={setShowQuickTaskModal} >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl text-secondary">
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
                <Label className="text-sm font-semibold">Responsável (Logins Financiamento)</Label>
                <Select
                  value={newTaskData.responsavelExternoRef}
                  onValueChange={(val) => {
                    const user = financingTeam.find(u => u._id === val);
                    setNewTaskData({
                      ...newTaskData,
                      responsavelExternoRef: val,
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
                    {financingTeam.map(user => (
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
                onClick={handleQuickCreateTask}
                disabled={!newTaskData.description}
                className="h-11 flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90"
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
                    responsibleType: 'Interno',
                    internalResponsibleId: '',
                    externalResponsibleName: '',
                    externalResponsibleContact: '',
                    dueDate: '',
                    responsavelExternoRef: ''
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
        <Dialog open={showQuickPendingModal} onOpenChange={setShowQuickPendingModal} >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl text-secondary">
                Nova Pendência
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm mb-2 block font-semibold">Responsável *</Label>
                <Select
                  value={newPendingData.responsiblePartyType}
                  onValueChange={(value) => setNewPendingData({ ...newPendingData, responsiblePartyType: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Interno">Interno</SelectItem>
                    <SelectItem value="Cliente">Cliente</SelectItem>
                    <SelectItem value="Parceiro Externo">Parceiro Externo</SelectItem>
                    <SelectItem value="Construtora">Construtora</SelectItem>
                    <SelectItem value="Caixa">Caixa</SelectItem>
                    <SelectItem value="Cartório">Cartório</SelectItem>
                    <SelectItem value="Sistema/Prazo legal">Sistema/Prazo legal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm mb-2 block font-semibold">Descrição *</Label>
                <Textarea
                  value={newPendingData.description}
                  onChange={(e) => setNewPendingData({ ...newPendingData, description: e.target.value })}
                  placeholder="Descreva a pendência de forma clara e objetiva..."
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
                <p className="text-xs text-foreground/60 mt-1">
                  Data de vencimento será calculada automaticamente
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleQuickCreatePending}
                disabled={!newPendingData.description}
                className="h-11 flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90"
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

        {/* Add Participant Modal */}
        <Dialog open={showAddParticipantModal} onOpenChange={setShowAddParticipantModal} >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Participante</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar cliente por nome ou CPF..."
                  className="pl-10 h-10"
                  value={addParticipantSearchTerm}
                  onChange={(e) => setAddParticipantSearchTerm(e.target.value)}
                />
              </div>

              {addParticipantSearchTerm && (
                <div className="border rounded-md max-h-40 overflow-y-auto">
                  {clients.filter(c =>
                    (c.clientName || '').toLowerCase().includes(addParticipantSearchTerm.toLowerCase()) ||
                    (c.cpfCnpj || '').includes(addParticipantSearchTerm)
                  ).map(client => (
                    <div
                      key={client._id}
                      className={`p-2 cursor-pointer flex justify-between items-center transition-colors ${selectedClientForAdd === client._id
                        ? 'bg-blue-600 text-white rounded-md'
                        : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      onClick={() => setSelectedClientForAdd(client._id)}
                    >
                      <span className="font-medium text-sm">{client.clientName || client.nomeRazaoSocial}</span>
                      {selectedClientForAdd === client._id && <CheckCircle className="h-4 w-4 text-white" />}
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label>Papel na Negociação</Label>
                <Select value={addParticipantRole} onValueChange={setAddParticipantRole}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Participante">Participante</SelectItem>
                    <SelectItem value="Cônjuge com renda">Cônjuge com renda</SelectItem>
                    <SelectItem value="Cônjuge sem renda">Cônjuge sem renda</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full bg-secondary text-secondary-foreground h-10"
                disabled={!selectedClientForAdd}
                onClick={() => {
                  const client = clients.find(c => c._id === selectedClientForAdd);
                  if (client) handleConfirmAddParticipant(client);
                }}
              >
                Confirmar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {/* Move Case Questions Modal */}
        <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen} >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl text-secondary">
                Movimentação de Ficha
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-6">
              <p className="text-sm text-foreground/70">
                Responda às perguntas da fase atual para registrar o progresso:
                <strong className="block text-secondary mt-1">
                  {FINANCING_COLUMNS.find(c => c.id === (cases.find(ic => ic._id === movingCaseId)?.faseAtual || ''))?.name}
                </strong>
              </p>

              <div className="space-y-6">
                {(() => {
                  const caseItem = cases.find(c => c._id === movingCaseId);
                  const sourcePhase = caseItem?.faseAtual || '';
                  const phaseQuestions = STAGE_CHECKLISTS[sourcePhase] || [];

                  return phaseQuestions.map(q => (
                    <div key={q.id} className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <Label className="text-sm font-semibold text-slate-700 leading-relaxed block">
                        {q.text}
                      </Label>

                      <RadioGroup
                        value={moveAnswers[q.id] || ''}
                        onValueChange={(val) => setMoveAnswers({ ...moveAnswers, [q.id]: val })}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sim" id={`${q.id}-sim`} />
                          <Label htmlFor={`${q.id}-sim`} className="text-xs">Sim</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="nao" id={`${q.id}-nao`} />
                          <Label htmlFor={`${q.id}-nao`} className="text-xs">Não</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="indiferente" id={`${q.id}-indiferente`} />
                          <Label htmlFor={`${q.id}-indiferente`} className="text-xs">Indiferente</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  ));
                })()}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => movingCaseId && movingTargetColumn && executeMoveCase(movingCaseId, movingTargetColumn, moveAnswers)}
              >
                Confirmar e Mover
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setMoveDialogOpen(false);
                  loadData(); // Revert card position if it was a drag
                }}
              >
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Linked Card Preview Modal */}

      </div>
    </AdminLayout>
  );
}
