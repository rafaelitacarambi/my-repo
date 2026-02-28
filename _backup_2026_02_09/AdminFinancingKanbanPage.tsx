import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import {
  Archive,
  Plus,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  Check,
  Clock,
  X,
  Save,
  FileText,
  History,
  Users,
  User,
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
  ChevronDown,
  Eye,
  Download,
  File,
  LayoutGrid,
  ListTodo,
  Palette,
  Settings
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
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FinancingNavigation from '@/components/FinancingNavigation';
import { BaseCrudService } from '@/integrations';
import { ServiceRecords, UsuriosdoSistema, PendnciasdoFinanciamento, FinancingTasks, ServiceParties, Clients, DocumentosdoFinanciamento, HistricodeInteraes, Imveis, AtendimentoImveis, ChecklistdosProponentes } from '@/entities';
import { formatCurrency, parseCurrency, formatCPF, parseCPF, validateCPF, handleCurrencyInput, handleCPFInput } from '@/lib/input-masks';
import { STAGE_CHECKLISTS, ChecklistAnswer } from '@/config/FinancingChecklists';
import { FinancingStageChecklist } from '@/components/financiamento/FinancingStageChecklist';
import { FinancingDetailModal } from '@/components/financiamento/FinancingDetailModal';

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
  isArchived?: boolean;

  // Detalhes extras
  priority?: string;
  uploadDate?: Date | string;
}

// Types
interface FinancingColumn {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  checklistItems?: string[]; // Checklist defined for this column/phase
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
  modalidade?: string;
  ehEmpreendimento?: boolean;

  // Status de Resultado do Financiamento
  statusResultadoFinanciamento?: 'Aprovado' | 'Condicionado' | 'Reprovado' | 'Em andamento' | '';

  // Ícones de bloqueio
  bloqueioDocumento?: boolean;
  bloqueioCaixa?: boolean;
  bloqueioCartorio?: boolean;
  bloqueioCliente?: boolean;
  bloqueioEngenharia?: boolean;
  bloqueioFormularios?: boolean;
  bloqueioRestricao?: boolean;
  bloqueioFgts?: boolean;

  // Dados completos do processo
  cpf?: string;
  email?: string;
  phoneNumber?: string;

  // Dados bancários e financeiros
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

  // Status de pagamento para cada valor
  pagoItbi?: boolean;
  pagoPrenotacao?: boolean;
  pagoProdutoNegociado?: boolean;
  pagoTaxaVista?: boolean;
  pagoRegistro?: boolean;

  // Financeiro do financiamento
  propertyValue?: number;
  desiredFinancingValue?: number;
  approvedFinancingValue?: number;
  appraisalValue?: number;

  // FGTS
  useFgts?: boolean;
  fgtsValue?: number;

  // Proposta comercial
  hasCommercialProposal?: boolean;
  hasCheckingAccountWithOverdraft?: boolean;
  hasCheckingAccountWithoutOverdraft?: boolean;
  hasCreditCard?: boolean;

  // Responsáveis
  responsibleInternalId?: string;
  responsibleExternal?: string;

  // Banco
  bankName?: string;
  bankAccountNumber?: string;
  financingContractNumber?: string;

  // Outros
  notes?: string;
  isArchived?: boolean;
  createdDate: string;
  updatedDate: string;

  // Imóveis vinculados
  propertyRefs?: string[];
  // Map of columnId -> checklistItems checked status (boolean array or map)
  checklistStatus?: Record<string, Record<string, boolean>>; // columnId -> { itemText -> boolean }
  checklistResponses?: Record<string, Record<string, ChecklistAnswer>>; // columnId -> { questionId -> answer }
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
  titulo?: string;
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
  ehConjugeDe?: string; // clientRef of spouse vendor
  conjugeNaoParticipa?: boolean; // If married but spouse doesn't participate
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



// Financing Columns Configuration - Trello-style (neutral colors)
const FINANCING_COLUMNS: FinancingColumn[] = [
  {
    id: 'novos-clientes', name: 'Novos clientes', color: 'bg-blue-100 border-blue-300', bgColor: 'bg-blue-100', borderColor: 'border-blue-300',
    checklistItems: []
  },
  {
    id: 'cadastro-cliente', name: 'Cadastro de cliente', color: 'bg-purple-100 border-purple-300', bgColor: 'bg-purple-100', borderColor: 'border-purple-300',
    checklistItems: []
  },
  {
    id: 'avaliacao-risco', name: 'Avaliação de risco', color: 'bg-orange-100 border-orange-300', bgColor: 'bg-orange-100', borderColor: 'border-orange-300',
    checklistItems: []
  },
  {
    id: 'engenharia', name: 'Engenharia', color: 'bg-indigo-100 border-indigo-300', bgColor: 'bg-indigo-100', borderColor: 'border-indigo-300',
    checklistItems: []
  },
  {
    id: 'fgts', name: 'FGTS', color: 'bg-gray-100 border-gray-300', bgColor: 'bg-gray-100', borderColor: 'border-gray-300',
    checklistItems: []
  },
  {
    id: 'siopi', name: 'SIOPI', color: 'bg-cyan-100 border-cyan-300', bgColor: 'bg-cyan-100', borderColor: 'border-cyan-300',
    checklistItems: []
  },
  {
    id: 'formularios', name: 'Assinatura de Formulários', color: 'bg-teal-100 border-teal-300', bgColor: 'bg-teal-100', borderColor: 'border-teal-300',
    checklistItems: []
  },
  {
    id: 'sictd', name: 'SICTD', color: 'bg-slate-100 border-slate-300', bgColor: 'bg-slate-100', borderColor: 'border-slate-300',
    checklistItems: []
  },
  {
    id: 'aguardando-conformidade', name: 'Aguardando Conformidade', color: 'bg-amber-100 border-amber-300', bgColor: 'bg-amber-100', borderColor: 'border-amber-300',
    checklistItems: []
  },
  {
    id: 'entrevista', name: 'Entrevista', color: 'bg-violet-100 border-violet-300', bgColor: 'bg-violet-100', borderColor: 'border-violet-300',
    checklistItems: []
  },
  {
    id: 'assinatura-minuta', name: 'Minuta', color: 'bg-fuchsia-100 border-fuchsia-300', bgColor: 'bg-fuchsia-100', borderColor: 'border-fuchsia-300',
    checklistItems: []
  },
  {
    id: 'itbi', name: 'ITBI', color: 'bg-lime-100 border-lime-300', bgColor: 'bg-lime-100', borderColor: 'border-lime-300',
    checklistItems: []
  },
  {
    id: 'cartorio-rsales', name: 'Cartório R.Sales', color: 'bg-rose-100 border-rose-300', bgColor: 'bg-rose-100', borderColor: 'border-rose-300',
    checklistItems: []
  },
  {
    id: 'garantia', name: 'Garantia', color: 'bg-emerald-100 border-emerald-300', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-300',
    checklistItems: []
  },
  {
    id: 'concluido', name: 'Concluído', color: 'bg-green-100 border-green-300', bgColor: 'bg-green-100', borderColor: 'border-green-300',
    checklistItems: []
  },
  {
    id: 'acompanhamento-obra', name: 'Acompanhamento de obra', color: 'bg-gray-100 border-gray-300', bgColor: 'bg-gray-100', borderColor: 'border-gray-300',
    checklistItems: ['Medição mensal', 'Liberar parcelas']
  },
  {
    id: 'aguardando-imovel', name: 'Aguardando o imóvel', color: 'bg-gray-100 border-gray-300', bgColor: 'bg-gray-100', borderColor: 'border-gray-300',
    checklistItems: [
      'Cliente enviou opções?',
      'Agendar visitas?',
      'Validar documentação básica do imóvel?'
    ]
  },
  {
    id: 'condicionados', name: 'Condicionados', color: 'bg-yellow-100 border-yellow-300', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-300',
    checklistItems: ['Resolver pendências da condicionante', 'Reenviar para análise']
  },
  {
    id: 'reprovados', name: 'Reprovados', color: 'bg-red-100 border-red-300', bgColor: 'bg-red-100', borderColor: 'border-red-300',
    checklistItems: ['Motivo da reprovação registrado', 'Cliente comunicado', 'Verificar possibilidade de nova tentativa futura']
  }
];

// Special display order for the History/Checklist tab
// Moves 'Condicionados' and 'Reprovados' after 'Avaliação de risco'
const CHECKLIST_DISPLAY_ORDER = [
  'novos-clientes',
  'cadastro-cliente',
  'avaliacao-risco',
  'condicionados', // Moved here
  'reprovados',    // Moved here
  'engenharia',
  'fgts',
  'siopi',
  'formularios',
  'sictd',
  'aguardando-conformidade',
  'entrevista',
  'assinatura-minuta',
  'itbi',
  'cartorio-rsales',
  'garantia',
  'concluido',
  'acompanhamento-obra',
  'aguardando-imovel'
];

const RESPONSIBLE_TYPES = ['Interno', 'Cliente', 'Parceiro Externo', 'Construtora', 'Caixa', 'Cartório', 'Sistema/Prazo legal'];
const PRIORITY_LEVELS = ['Alta', 'Média', 'Baixa'];
const PENDING_STATUS = ['Aberta', 'Em Andamento', 'Resolvida', 'Cancelada'];
const TASK_STATUS = ['Pendente', 'Em Progresso', 'Concluída', 'Atrasada'];

// Default document types for each proponent
const DEFAULT_PROPONENT_DOCUMENTS = [
  { documentName: 'Documento de Identificação (RG, CPF ou CNH)', isMandatory: true },
  { documentName: 'Certidão de nascimento ou casamento', isMandatory: true },
  { documentName: 'Comprovante de residência atual', isMandatory: false },
  { documentName: 'Holerite dos últimos 2 meses', isMandatory: false },
  { documentName: 'Pró-labore dos últimos 3 meses (se houver)', isMandatory: false },
  { documentName: 'Extrato do FGTS (se houver)', isMandatory: false },
  { documentName: 'Declaração de Imposto de Renda (se houver)', isMandatory: false }
];

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
  const location = useLocation();

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
  const [phaseChecklistAnswers, setPhaseChecklistAnswers] = useState<Record<string, ChecklistAnswer>>({});
  const [selectedVendorId, setSelectedVendorId] = useState<string>(''); // EMPTY by default - user must select
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAgencia, setFilterAgencia] = useState('all'); // Fix: Default to 'all' to avoid filtering empty agencies
  const [filterPasta, setFilterPasta] = useState('');
  const [showArchived, setShowArchived] = useState(false); // New state for Archive View
  const [kanbanBackground, setKanbanBackground] = useState('bg-light-gray');
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [currentUser, setCurrentUser] = useState<UsuriosdoSistema | null>(null);

  // Ref to track if we've already handled the auto-open for a specific ID
  const handledAutoOpenRef = useRef<string | null>(null);

  // Auto-open card when navigated from client creation
  useEffect(() => {
    if (location.state?.openCardId) {
      const openCardId = location.state.openCardId;

      // Prevent re-opening if we already handled this ID
      if (handledAutoOpenRef.current === openCardId) {
        return;
      }

      const newCardData = location.state.newCardData; // Optimistic data

      // Clear filters to ensure the new card is visible
      setFilterAgencia('all');
      setFilterPasta('');
      setSearchTerm('');

      // Try to find existing card
      let caseToOpen = cases.find(c => c._id === openCardId);

      // OPTIMISTIC UI: If card not found but we have data in state, add it immediately
      if (!caseToOpen && newCardData) {
        console.log('[OPTIMISTIC] Adding new card to Kanban:', newCardData);

        const now = new Date().toISOString();
        const optimisticCase: FinancingCase = {
          _id: newCardData._id,
          agencia: newCardData.unidadeResponsavelRef || '',
          proponentePrincipal: newCardData.contactName || 'Novo Cliente',
          pastaInterna: newCardData.pastaInterna || newCardData._id.substring(0, 8).toUpperCase(),
          status: newCardData.status || 'Novo',
          faseAtual: newCardData.faseFinanciamento || 'novos-clientes',
          faseAnterior: '',
          statusResultadoFinanciamento: '',
          dataEntradaFaseAtual: now,
          diasNaFase: 0,
          pendenciasAbertas: 0,
          tarefasAbertas: 0,
          bloqueioDocumento: false,
          bloqueioCaixa: false,
          bloqueioCartorio: false,
          bloqueioCliente: false,
          bloqueioEngenharia: false,
          bloqueioFormularios: false,
          bloqueioRestricao: false,
          bloqueioFgts: false,
          cpf: newCardData.cpfProponentePrincipal || '',
          email: newCardData.contactEmail || '',
          phoneNumber: newCardData.contactPhone || '',
          propertyValue: 0,
          desiredFinancingValue: 0,
          approvedFinancingValue: 0,
          useFgts: false,
          fgtsValue: 0,
          responsibleInternalId: newCardData.responsavelInternoId,
          responsibleExternal: newCardData.responsavelExterno,
          bankName: '',
          bankAccountNumber: '',
          financingContractNumber: '',
          numeroMatricula: '',
          numeroProtocoloCartorio: '',
          modalidade: '',
          ehEmpreendimento: false,
          notes: newCardData.notes || '',
          isArchived: false,
          createdDate: now,
          updatedDate: now,
          checklistStatus: {}
        };

        // Add to state immediately
        setCases(prev => [optimisticCase, ...prev]);
        caseToOpen = optimisticCase;
      }

      if (caseToOpen) {
        // Mark as handled BEFORE opening to prevent race conditions
        handledAutoOpenRef.current = openCardId;

        // Open details with slight delay to allow rendering if it was just added
        setTimeout(() => {
          handleOpenDetails(caseToOpen!, 'dados');
        }, 100);

        // Clear the state to prevent re-opening on refresh
        // Use navigate with replace to properly update React Router location state
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, cases, loading, navigate, location.pathname]);

  const [showPhaseConfirmDialog, setShowPhaseConfirmDialog] = useState(false);
  const [pendingPhaseMove, setPendingPhaseMove] = useState<{ caseId: string, newColumn: string, oldColumn: string, extraUpdates?: any } | null>(null);
  const [phaseCompletionNote, setPhaseCompletionNote] = useState('');

  const [quickActionCaseId, setQuickActionCaseId] = useState<string | null>(null);
  const [showQuickTaskModal, setShowQuickTaskModal] = useState(false);
  const [showQuickPendingModal, setShowQuickPendingModal] = useState(false);



  // Calculate displayed columns
  const displayedColumns = showArchived
    ? [{
      id: 'arquivados',
      name: 'Arquivados',
      color: 'bg-gray-100 border-gray-300',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-300',
      checklistItems: [] as string[]
    }]
    : FINANCING_COLUMNS;

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
    modalidade: '',
    ehEmpreendimento: false,
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
    propertyRefs: [],
    checklistStatus: {}
  });

  const [newPendingData, setNewPendingData] = useState({
    description: '',
    responsiblePartyType: 'Interno',
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
    dueDate: ''
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
      const target = e.target as HTMLElement;

      // Ignore if clicking on buttons, inputs, interactive elements, or cards (let dnd handle cards)
      if (
        target.closest('[data-rbd-draggable-id]') ||
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
      container.style.scrollBehavior = 'auto'; // Disable smooth scroll while dragging
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;

      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.5; // Optimized speed
      container.scrollLeft = scrollLeft - walk;
    };

    const handleMouseUp = () => {
      if (!isMouseDown) return;
      isMouseDown = false;
      container.style.cursor = 'grab';
      container.style.userSelect = '';
      container.style.scrollBehavior = ''; // Reset to default (which will be smooth via CSS if applied)
    };

    const handleMouseLeave = () => {
      if (isMouseDown) {
        handleMouseUp();
      }
    };

    // Keyboard support
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we are typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.hasAttribute('contenteditable')
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        container.scrollTo({
          left: container.scrollLeft - 150,
          behavior: 'smooth'
        });
      } else if (e.key === 'ArrowRight') {
        container.scrollTo({
          left: container.scrollLeft + 150,
          behavior: 'smooth'
        });
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('keydown', handleKeyDown);
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
        container.scrollLeft += e.deltaY;
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
    } catch (error) {
      console.error('Error loading background:', error);
    }
  };

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
      // Load financing cases from atendimentos
      const { items: atendimentos } = await BaseCrudService.getAll<ServiceRecords>('atendimentos');
      const financingCases = atendimentos
        .filter(a => a.serviceType === 'Financiamento')
        .map(a => {
          const dataEntrada = a.dataPrevistaConclusao ? new Date(a.dataPrevistaConclusao).toISOString() : new Date(a._createdDate || new Date()).toISOString();
          const diasNaFase = Math.floor((new Date().getTime() - new Date(dataEntrada).getTime()) / (1000 * 60 * 60 * 24));

          return {
            _id: a._id,
            agencia: a.unidadeResponsavelRef || '',
            proponentePrincipal: a.contactName || 'Sem nome',
            // CRITICAL FIX: Load pastaInterna from database, fallback to auto-generated only if not set
            pastaInterna: (a as any).pastaInterna || a._id.substring(0, 8).toUpperCase(),
            status: a.status || 'Novo',
            faseAtual: a.faseFinanciamento || 'novos-clientes',
            faseAnterior: (a as any).faseAnterior || '',
            statusResultadoFinanciamento: (a as any).statusResultadoFinanciamento || '',
            dataEntradaFaseAtual: dataEntrada,
            diasNaFase,
            pendenciasAbertas: 0,
            tarefasAbertas: 0,
            bloqueioDocumento: false,
            bloqueioCaixa: false,
            bloqueioCartorio: false,
            bloqueioCliente: false,
            bloqueioEngenharia: false,
            bloqueioFormularios: false,
            bloqueioRestricao: false,
            bloqueioFgts: false,
            cpf: (a as any).cpfProponentePrincipal || '',
            email: a.contactEmail || '',
            phoneNumber: a.contactPhone || '',
            propertyValue: (a as any).propertyValue || 0,
            desiredFinancingValue: (a as any).desiredFinancingValue || 0,
            approvedFinancingValue: (a as any).approvedFinancingValue || 0,
            useFgts: (a as any).useFgts || false,
            fgtsValue: (a as any).fgtsValue || 0,
            responsibleInternalId: a.responsavelInternoId,
            responsibleExternal: a.responsavelExterno,
            bankName: (a as any).bankName || '',
            bankAccountNumber: (a as any).bankAccountNumber || '',
            financingContractNumber: (a as any).numeroContrato || '',
            numeroMatricula: (a as any).numeroMatricula || '',
            numeroProtocoloCartorio: (a as any).numeroProtocoloCartorio || '',
            modalidade: (a as any).modalidade || '',
            ehEmpreendimento: (a as any).ehEmpreendimento || false,
            notes: a.notes || '',
            isArchived: a.isArchived || false,
            createdDate: a._createdDate?.toString() || new Date().toISOString(),
            updatedDate: a._updatedDate?.toString() || new Date().toISOString(),
            checklistStatus: (a as any).checklistStatus || {}
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
      });

      setCases(financingCases);

      // CRITICAL FIX: Check if we have an optimistic card that DB hasn't returned yet
      // This prevents the card from "disappearing" when loadData completes
      if (location.state?.newCardData && location.state?.openCardId) {
        const optimisticId = location.state.openCardId;
        const existsInDb = financingCases.some(c => c._id === optimisticId);

        if (!existsInDb) {
          console.log('[OPTIMISTIC] Re-injecting optimistic card after loadData:', optimisticId);
          const newCardData = location.state.newCardData;
          const now = new Date().toISOString();

          const optimisticCase: FinancingCase = {
            _id: newCardData._id,
            agencia: newCardData.unidadeResponsavelRef || '',
            proponentePrincipal: newCardData.contactName || 'Novo Cliente',
            pastaInterna: newCardData.pastaInterna || newCardData._id.substring(0, 8).toUpperCase(),
            status: newCardData.status || 'Novo',
            faseAtual: newCardData.faseFinanciamento || 'novos-clientes',
            faseAnterior: '',
            statusResultadoFinanciamento: '',
            dataEntradaFaseAtual: now,
            diasNaFase: 0,
            pendenciasAbertas: 0,
            tarefasAbertas: 0,
            bloqueioDocumento: false,
            bloqueioCaixa: false,
            bloqueioCartorio: false,
            bloqueioCliente: false,
            bloqueioEngenharia: false,
            bloqueioFormularios: false,
            bloqueioRestricao: false,
            bloqueioFgts: false,
            cpf: newCardData.cpfProponentePrincipal || '',
            email: newCardData.contactEmail || '',
            phoneNumber: newCardData.contactPhone || '',
            propertyValue: 0,
            desiredFinancingValue: 0,
            approvedFinancingValue: 0,
            useFgts: false,
            fgtsValue: 0,
            responsibleInternalId: newCardData.responsavelInternoId,
            responsibleExternal: newCardData.responsavelExterno,
            bankName: '',
            bankAccountNumber: '',
            financingContractNumber: '',
            numeroMatricula: '',
            numeroProtocoloCartorio: '',
            modalidade: '',
            ehEmpreendimento: false,
            notes: newCardData.notes || '',
            isArchived: false,
            createdDate: now,
            updatedDate: now,
            checklistStatus: {}
          };

          // Re-inject
          setCases(prev => [optimisticCase, ...prev]);
        }
      }

      setPendings(pendingsList as Pending[]);
      setTasks(tasksList as Task[]);

      // Load users and clients
      const { items: usersList } = await BaseCrudService.getAll<UsuriosdoSistema>('usuariossistema');
      setUsers(usersList);

      const { items: clientsList } = await BaseCrudService.getAll<Clients>('clientes');
      setClients(clientsList);

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
          financingContractNumber: (atendimento as any).financingContractNumber || caseData.financingContractNumber || '',
          modalidade: (atendimento as any).modalidade || caseData.modalidade || '',
          ehEmpreendimento: (atendimento as any).ehEmpreendimento || caseData.ehEmpreendimento || false,
          checklistStatus: (atendimento as any).checklistStatus || caseData.checklistStatus || {}
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
              isMandatory: defaultDoc.isMandatory
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

    // CRITICAL FIX: Reset selections to empty when opening modal
    setSelectedProponentId('');
    setSelectedVendorId('');

    await loadCaseDetails(caseItem._id);
    setShowDetailsModal(true);
    setModalTab(initialTab); // Set initial tab
  };

  // Handle card click with selection check and target validation
  const handleCardClick = (e: React.MouseEvent, caseItem: FinancingCase) => {
    // 1. Prevent opening if text is selected
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      return;
    }

    // 2. Simplified allowed check - relying on stopPropagation from child elements
    // The previous check was too aggressive blocking valid clicks on card body
    handleOpenDetails(caseItem, 'dados');
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
        modalidade: caseFormData.modalidade,
        ehEmpreendimento: caseFormData.ehEmpreendimento,
        checklistStatus: caseFormData.checklistStatus,
        // CORRECTION: Ensure phase is persisted
        faseFinanciamento: selectedCase.faseAtual
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
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error saving details:', error);
    }
  };

  // Handle FGTS selection change
  const handleFgtsChange = async (value: string) => {
    const willUseFgts = value === 'sim';
    setCaseFormData({ ...caseFormData, useFgts: willUseFgts, fgtsValue: willUseFgts ? caseFormData.fgtsValue : 0 });
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

      // If we are moving, delegate to handleMoveCase which triggers the popup
      if (shouldMove && targetColumn !== caseItem.faseAtual) {
        handleMoveCase(caseId, targetColumn, { statusResultadoFinanciamento: newStatus });
        return;
      }

      // If not moving, just update the status immediately
      // Optimistic update
      setCases(cases.map(c => c._id === caseId ? {
        ...c,
        statusResultadoFinanciamento: newStatus,
        updatedDate: now
      } : c));

      // Update database
      await BaseCrudService.update<ServiceRecords>('atendimentos', {
        _id: caseId,
        statusResultadoFinanciamento: newStatus
      });

      // Create history entry for status change
      await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
        _id: crypto.randomUUID(),
        atendimentoRef: caseId,
        tipoEvento: 'Status_Resultado_Alterado',
        interactionType: 'Mudança de Status de Resultado',
        interactionDescription: `Status de resultado alterado de "${oldStatus}" para "${newStatus}"`,
        interactionDate: now,
        autorTipo: 'Sistema'
      });

      await loadData();
    } catch (error) {
      console.error('Error updating status resultado:', error);
      await loadData(); // Revert on failure
    }
  };

  // Move case to different column
  const handleMoveCase = async (caseId: string, newColumn: string, extraUpdates: any = {}) => {
    const caseItem = cases.find(c => c._id === caseId);
    if (!caseItem) return;

    // Store pending move and show confirmation dialog
    setPendingPhaseMove({
      caseId,
      newColumn,
      oldColumn: caseItem.faseAtual,
      extraUpdates: extraUpdates || {} // Store extra updates (like statusResult) to be applied on confirm
    });

    setPhaseCompletionNote('');
    setPhaseChecklistAnswers({}); // Reset checklist answers for the new phase

    // Check if dialog is needed (User request: "sempre que mudarmos de coluna abrisse uma pergunta pop up")
    // We already have a dialog, just need to make sure we handle the checklist logic in confirmPhaseMove
    setShowPhaseConfirmDialog(true);
  };

  // Confirm phase move after user confirmation
  const confirmPhaseMove = async () => {
    if (!pendingPhaseMove) return;

    const { caseId, newColumn, oldColumn, extraUpdates } = pendingPhaseMove;

    try {
      const caseItem = cases.find(c => c._id === caseId);
      if (!caseItem) return;

      const now = new Date().toISOString();
      const oldColumnName = FINANCING_COLUMNS.find(c => c.id === oldColumn)?.name || oldColumn;
      const newColumnName = FINANCING_COLUMNS.find(c => c.id === newColumn)?.name || newColumn;

      // Optimistic update - save previous phase
      setCases(cases.map(c => c._id === caseId ? {
        ...c,
        ...extraUpdates, // Apply extra optimistic updates
        faseAnterior: c.faseAtual, // Save current phase before moving
        faseAtual: newColumn,
        dataEntradaFaseAtual: now,
        diasNaFase: 0,
        // Update checklist data in state immediately
        checklistStatus: {
          ...caseItem.checklistStatus,
          [oldColumn]: Object.entries(phaseChecklistAnswers).reduce((acc, [key, value]) => ({
            ...acc,
            [key]: value === 'sim'
          }), {})
        },
        checklistResponses: {
          ...caseItem.checklistResponses,
          [oldColumn]: Object.entries(phaseChecklistAnswers).reduce((acc, [key, value]) => ({
            ...acc,
            [key]: value
          }), caseItem.checklistResponses?.[oldColumn] || {})
        }
      } : c));

      await BaseCrudService.update<ServiceRecords>('atendimentos', {
        _id: caseId,
        ...extraUpdates, // Apply extra DB updates
        faseFinanciamento: newColumn,
        faseAnterior: caseItem.faseAtual, // Save for rollback
        dataPrevistaConclusao: now,
        // Auto-fill checklist for the COMPLETED (old) phase? Or the new one?
        // Request: "quando fossemos movendo de coluna fosse sendo preenchido automaticamente"
        // Interpretation: We are filling the NEW phase checklist in the popup.
        // Save answers for the COMPLETED (old) phase from the popup
        // We save it in checklistStatus for legacy compatibility (optional) and checklistResponses for the new structure
        checklistStatus: {
          ...caseItem.checklistStatus,
          [oldColumn]: Object.entries(phaseChecklistAnswers).reduce((acc, [key, value]) => ({
            ...acc,
            [key]: value === 'sim'
          }), {})
        },
        // Also update the structured checklist responses
        checklistResponses: {
          ...caseItem.checklistResponses,
          [oldColumn]: Object.entries(phaseChecklistAnswers).reduce((acc, [key, value]) => ({
            ...acc,
            [key]: value
          }), caseItem.checklistResponses?.[oldColumn] || {})
        }
      });

      // Create history entry for phase completion
      await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
        _id: crypto.randomUUID(),
        atendimentoRef: caseId,
        tipoEvento: 'Conclusão_Fase',
        interactionType: 'Fase concluída',
        interactionDescription: `Fase "${oldColumnName}" concluída. ${phaseCompletionNote ? `Observação: ${phaseCompletionNote}` : ''}`,
        interactionDate: now,
        autorTipo: 'Sistema'
      });

      // Create history entry for movement
      await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
        _id: crypto.randomUUID(),
        atendimentoRef: caseId,
        tipoEvento: 'Movimentação',
        interactionType: 'Mudança de fase',
        interactionDescription: `Movido para: ${newColumnName}`,
        interactionDate: now,
        autorTipo: 'Sistema'
      });

      // Close dialog and reset
      setShowPhaseConfirmDialog(false);
      setPendingPhaseMove(null);
      setPhaseCompletionNote('');
      setPhaseChecklistAnswers({});

    } catch (error) {
      console.error('Error moving case:', error);
      // Revert on error
      await loadData();
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

      // Add "Sem responsável" option to types if not present
      // This is handled in the UI Select component


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
        title: newPendingData.description.substring(0, 100), // Use description as title (truncated)
        description: newPendingData.description,
        status: 'Pendente',
        priority: 'Média',
        dueDate: dueDate.toISOString(),
        responsiblePartyType: newPendingData.responsiblePartyType,
        responsiblePartyDetails: '',
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
        responsibleType: newTaskData.responsavelExternoRef === 'sem_responsavel' ? 'Sem responsável' : 'Interno',
        responsavelExternoRef: newTaskData.responsavelExternoRef === 'sem_responsavel' ? undefined : newTaskData.responsavelExternoRef,
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
        dueDate: ''
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
        responsibleType: newTaskData.internalResponsibleId === 'sem_responsavel' ? 'Sem responsável' : 'Interno',
        internalResponsibleId: newTaskData.internalResponsibleId === 'sem_responsavel' ? undefined : newTaskData.internalResponsibleId,
        externalResponsibleName: newTaskData.externalResponsibleName || undefined,
        externalResponsibleContact: newTaskData.externalResponsibleContact || undefined,
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
        dueDate: ''
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

      setQuickActionCaseId(null);

      await loadData();
    } catch (error) {
      console.error('Error creating quick pending:', error);
    }
  };

  // Archive / Unarchive case
  const handleToggleArchiveCase = async (caseId: string, currentArchiveStatus: boolean) => {
    try {
      const newStatus = !currentArchiveStatus;

      await BaseCrudService.update('atendimentos', {
        _id: caseId,
        isArchived: newStatus
      });

      // Update local state
      setCases(cases.map(c => c._id === caseId ? { ...c, isArchived: newStatus } : c));

      // Record in history
      await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
        _id: crypto.randomUUID(),
        atendimentoRef: caseId,
        tipoEvento: 'Sistema',
        interactionType: newStatus ? 'Card Arquivado' : 'Card Desarquivado',
        interactionDescription: newStatus
          ? 'O cartão foi removido do fluxo ativo e movido para o arquivo.'
          : 'O cartão foi restaurado para o fluxo ativo.',
        interactionDate: new Date().toISOString(),
        autorTipo: 'Sistema'
      });

      if (selectedCase && selectedCase._id === caseId) {
        setSelectedCase({ ...selectedCase, isArchived: newStatus });
        setCaseFormData({ ...caseFormData, isArchived: newStatus });
      }

    } catch (error) {
      console.error('Error toggling archive status:', error);
    }
  };

  // Get responsible name for task
  const getTaskResponsibleName = (task: Task) => {
    // Check for responsavelExternoRef (R Sales team) first
    if ((task as any).responsavelExternoRef) {
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

  // Update proponent checklist
  const handleUpdateProponentChecklist = async (clientRef: string, field: keyof ProponentChecklist, value: boolean | string) => {
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
      hasFgtsContribution: field === 'hasFgtsContribution' ? value as boolean : false,
      hasDependent: field === 'hasDependent' ? value as boolean : false,
      declaresIncomeTax: field === 'declaresIncomeTax' ? value as boolean : false,
      ownsProperty: field === 'ownsProperty' ? value as boolean : false,
      hasActiveFinancing: field === 'hasActiveFinancing' ? value as boolean : false,
      isFirstAcquisition: field === 'isFirstAcquisition' ? value as boolean : false
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
      }
    }, 1000); // 1 second debounce

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

    // Create pendings for missing documents
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

  // Update checklist answer
  const handleUpdateChecklistAnswer = async (stageId: string, itemId: string, answer: ChecklistAnswer) => {
    if (!selectedCase) return;

    // Deep copy current responses
    const currentResponses = JSON.parse(JSON.stringify(selectedCase.checklistResponses || {}));

    // Ensure stage object exists
    if (!currentResponses[stageId]) {
      currentResponses[stageId] = {};
    }

    // Update answer
    currentResponses[stageId][itemId] = answer;

    // Optimistic update
    setSelectedCase({ ...selectedCase, checklistResponses: currentResponses });
    setCases(cases.map(c => c._id === selectedCase._id ? { ...c, checklistResponses: currentResponses } : c));

    try {
      await BaseCrudService.update('atendimentos', {
        _id: selectedCase._id,
        checklistResponses: currentResponses
      });
    } catch (error) {
      console.error('Error saving checklist answer:', error);
    }
  };

  // Get cases by column
  const getCasesByColumn = (columnId: string) => {
    let filtered = cases;

    // Special handling for 'arquivados' column
    if (columnId === 'arquivados') {
      filtered = filtered.filter(c => c.isArchived);
    } else {
      // Normal columns: filter by column AND ensure not archived (unless showing archived... wait)
      // If showing archived, we show the 'arquivados' column ONLY (due to displayedColumns logic).
      // So we don't need to worry about normal columns showing archived items.
      // But if we are in normal mode, we hide archived.
      filtered = filtered.filter(c => c.faseAtual === columnId && !c.isArchived);
    }

    if (searchTerm) {
      filtered = filtered.filter(caseItem => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          caseItem.proponentePrincipal.toLowerCase().includes(searchLower) ||
          (caseItem.cpf && caseItem.cpf.includes(searchLower)) ||
          ((caseItem as any).pastaInterna && (caseItem as any).pastaInterna.toLowerCase().includes(searchLower)) ||
          (caseItem.agencia && caseItem.agencia.toLowerCase().includes(searchLower)) ||
          ((caseItem as any).numeroMatricula && (caseItem as any).numeroMatricula.includes(searchLower));

        return matchesSearch;
      });
    }

    // Apply Agency Filter
    if (filterAgencia && filterAgencia !== 'all') {
      filtered = filtered.filter(c => c.agencia === filterAgencia);
    }

    // Apply Pasta Filter
    if (filterPasta) {
      filtered = filtered.filter(c => c.pastaInterna && c.pastaInterna.toLowerCase().includes(filterPasta.toLowerCase()));
    }

    return filtered;
  };

  // Get unique agencies
  const getUniqueAgencias = () => {
    return Array.from(new Set(cases.map(c => c.agencia).filter(Boolean)));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-gray">
        <Header />
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

        <Footer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${kanbanBackground}`}>
      <Header />
      <FinancingNavigation />

      {/* Fixed Header Section */}
      <section className="w-full bg-gradient-to-br from-secondary via-secondary/90 to-buttonbackground py-8 sticky top-0 z-40 shadow-lg">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          {showBackgroundPicker && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Button
                variant="ghost"
                onClick={() => setShowBackgroundPicker(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>

              <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {BACKGROUND_OPTIONS.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => handleChangeBackground(bg.value)}
                    className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${kanbanBackground === bg.value ? 'border-secondary shadow-lg' : 'border-border-gray'
                      }`}
                  >
                    <div
                      className="w-full h-16 rounded-md mb-2"
                      style={{
                        background: bg.preview.startsWith('http') ? `url(${bg.preview}) center/cover` : bg.preview
                      }}
                    />
                    <p className="text-xs font-semibold text-foreground text-center">{bg.name}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>


        {/* Filters & Actions */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className="pl-9 h-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 text-sm"
            />
          </div>



          <Button
            onClick={() => setShowArchived(!showArchived)}
            className={`h-10 border transition-all text-sm ${showArchived
              ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-400'
              : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
          >
            <Archive className="w-4 h-4 mr-2" />
            {showArchived ? 'Voltar' : 'Arquivados'}
          </Button>
        </div>
      </section>

      {/* Fixed Horizontal Scrollbar - Trello Style */}
      <div className="sticky top-[180px] z-30 bg-white/95 backdrop-blur-sm border-b border-border-gray shadow-sm">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-2.5">
          <div
            ref={scrollbarRef}
            className="w-full h-2.5 bg-gray-200/80 rounded-full overflow-hidden cursor-pointer relative hover:h-3 transition-all"
            onClick={(e) => {
              const container = scrollContainerRef.current;
              const scrollbar = scrollbarRef.current;
              if (!container || !scrollbar) return;

              const rect = scrollbar.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const scrollbarWidth = rect.width;
              const scrollWidth = container.scrollWidth;
              const clientWidth = container.clientWidth;
              const maxScroll = scrollWidth - clientWidth;

              // Calculate target scroll position
              const scrollPercentage = clickX / scrollbarWidth;
              container.scrollLeft = scrollPercentage * maxScroll;
            }}
          >
            <div
              ref={scrollbarThumbRef}
              className="absolute top-0 left-0 h-full bg-secondary/90 rounded-full cursor-grab active:cursor-grabbing transition-all hover:bg-secondary shadow-sm"
              style={{ width: '100px' }}
            />
          </div>
        </div>
      </div>

      {/* Kanban Board with Drag & Drop */}
      <section className="w-full py-6">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div
              ref={scrollContainerRef}
              className="flex gap-4 pb-6"
              style={{
                overflowX: 'auto',
                overflowY: 'visible',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                cursor: 'grab'
              }}
              tabIndex={0}
            >
              {/* ... keep existing code (FINANCING_COLUMNS.map) ... */}
              {displayedColumns.map((column) => {
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
                          className={`${column.color} border-2 rounded-xl p-4 flex flex-col shadow-md transition-all ${snapshot.isDraggingOver ? 'ring-4 ring-secondary/50 scale-105' : ''
                            }`}
                          style={{ minHeight: 'auto', height: 'auto' }}
                        >
                          <div className="mb-4">
                            <h3 className="font-heading text-sm text-foreground font-bold uppercase tracking-wide mb-2">
                              {column.name}
                            </h3>
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700 border-gray-300">
                                {columnCases.length} {columnCases.length === 1 ? 'caso' : 'casos'}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex-1 space-y-3 pr-2">
                            {columnCases.map((caseItem, index) => {
                              const daysBadgeColor = caseItem.diasNaFase <= 3 ? 'bg-green-500' : caseItem.diasNaFase <= 7 ? 'bg-yellow-500' : 'bg-red-500';
                              const hasActivityToday = [...pendings, ...tasks].some(item => {
                                const itemDate = new Date(item.creationDate || '').toDateString();
                                return itemDate === new Date().toDateString() && (item.atendimentoRef === caseItem._id);
                              });

                              return (
                                <Draggable key={caseItem._id} draggableId={caseItem._id} index={index}>
                                  {(provided, snapshot) => (
                                    <motion.div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      whileHover={{ scale: snapshot.isDragging ? 1 : 1.02 }}
                                      transition={{ duration: 0.2 }}
                                      onClick={(e) => !snapshot.isDragging && handleCardClick(e, caseItem)}
                                      className={`bg-white rounded-xl p-4 border border-border-gray hover:shadow-xl transition-all cursor-grab active:cursor-grabbing group relative ${snapshot.isDragging ? 'shadow-2xl ring-4 ring-secondary/50 rotate-2 scale-105' : ''
                                        }`}
                                      style={{
                                        ...provided.draggableProps.style,
                                        opacity: snapshot.isDragging ? 0.9 : 1
                                      }}
                                    >
                                      {/* Activity indicator */}
                                      <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${hasActivityToday ? 'bg-green-500' : 'bg-red-500'}`}
                                        title={hasActivityToday ? 'Atividade hoje' : 'Sem atividade hoje'}>
                                      </div>

                                      {/* Quick action icons - top right corner */}
                                      <div className="absolute top-3 right-8 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleOpenDetails(caseItem, 'pendencias_tarefas');
                                          }}
                                          onPointerDown={(e) => e.stopPropagation()}
                                          onMouseDown={(e) => e.stopPropagation()}
                                          className="p-1.5 bg-orange-100 rounded hover:bg-orange-200 transition-colors interactive-prevent"
                                          title="Abrir Pendências"
                                        >
                                          <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleOpenDetails(caseItem, 'pendencias_tarefas');
                                          }}
                                          onPointerDown={(e) => e.stopPropagation()}
                                          onMouseDown={(e) => e.stopPropagation()}
                                          className="p-1.5 bg-blue-100 rounded hover:bg-blue-200 transition-colors interactive-prevent"
                                          title="Abrir Tarefas"
                                        >
                                          <ListTodo className="w-3.5 h-3.5 text-blue-600" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleOpenDetails(caseItem, 'historico');
                                          }}
                                          onPointerDown={(e) => e.stopPropagation()}
                                          onMouseDown={(e) => e.stopPropagation()}
                                          className="p-1.5 rounded transition-colors interactive-prevent bg-gray-100 text-gray-600 hover:bg-gray-200"
                                          title="Histórico"
                                        >
                                          <History className="w-3.5 h-3.5" />
                                        </button>
                                      </div>

                                      {/* Header */}
                                      <div className="mb-3">
                                        <h4 className="font-heading text-base text-foreground font-bold mb-1 pr-6 line-clamp-1">
                                          {caseItem.proponentePrincipal}
                                        </h4>
                                        <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-foreground/60">
                                          {caseItem.agencia && <span>Agência: {caseItem.agencia}</span>}
                                          {caseItem.pastaInterna && <span>• Pasta: {caseItem.pastaInterna}</span>}
                                        </div>
                                      </div>

                                      {/* Status and Modalidade */}
                                      <div className="mb-3 space-y-1.5">
                                        <div className="text-xs text-foreground/70">
                                          <span className="font-semibold">Status:</span>{' '}
                                          {caseItem.statusResultadoFinanciamento || '—'}
                                        </div>
                                        {caseItem.modalidade && (
                                          <div className="text-xs text-foreground/70">
                                            {caseItem.modalidade}
                                            {(() => {
                                              const supportsEmpreendimento = [
                                                'MCMV Faixa 1',
                                                'MCMV Faixa 2',
                                                'MCMV Faixa 3',
                                                'NPMCMV Faixa 4',
                                                'SBPE'
                                              ].includes(caseItem.modalidade || '');

                                              if (supportsEmpreendimento && caseItem.ehEmpreendimento) {
                                                return ' (Empreendimento)';
                                              }
                                              return null;
                                            })()}
                                          </div>
                                        )}
                                        <div className="text-xs text-foreground/70 flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          <span className={`font-bold px-2 py-0.5 rounded ${daysBadgeColor} text-white`}>
                                            {caseItem.diasNaFase} {caseItem.diasNaFase === 1 ? 'dia' : 'dias'}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Pendings and Tasks with Mini-List */}
                                      <div className="mb-3 space-y-2">
                                        {/* Counters with Quick Action Buttons */}
                                        <div className="flex items-center justify-end gap-2 text-xs">
                                          <div className="flex gap-1">
                                            <button
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setQuickActionCaseId(caseItem._id);
                                                setShowQuickPendingModal(true);
                                              }}
                                              onPointerDown={(e) => e.stopPropagation()}
                                              onMouseDown={(e) => e.stopPropagation()}
                                              className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold hover:bg-orange-200 transition-colors interactive-prevent"
                                              title="Criar Pendência"
                                            >
                                              + Pend.
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setQuickActionCaseId(caseItem._id);
                                                setShowQuickTaskModal(true);
                                              }}
                                              onPointerDown={(e) => e.stopPropagation()}
                                              onMouseDown={(e) => e.stopPropagation()}
                                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold hover:bg-blue-200 transition-colors interactive-prevent"
                                              title="Criar Tarefa"
                                            >
                                              + Tarefa
                                            </button>
                                            <Select value={caseItem.faseAtual} onValueChange={(value) => handleMoveCase(caseItem._id, value)}>
                                              <SelectTrigger
                                                className="h-auto px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold hover:bg-purple-200 border-none shadow-none focus:ring-0 gap-1 interactive-prevent"
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                }}
                                                onPointerDown={(e) => e.stopPropagation()}
                                                onMouseDown={(e) => e.stopPropagation()}
                                              >
                                                <span>Mover</span>
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
                                              <div className="space-y-1 pl-1">
                                                <div className="text-xs font-semibold text-orange-600 mb-1">Pendências:</div>
                                                {casePendings.map(pending => (
                                                  <div key={pending._id} className="flex items-start justify-between gap-1.5 text-xs bg-orange-50 p-1.5 rounded">
                                                    <div className="flex items-start gap-1.5 flex-1 min-w-0">
                                                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-orange-500" />
                                                      <span className="line-clamp-1 flex-1 text-foreground/80">{pending.title}</span>
                                                    </div>
                                                    <button
                                                      onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleUpdatePendingStatus(pending._id, 'Resolvida');
                                                      }}
                                                      onPointerDown={(e) => e.stopPropagation()}
                                                      onMouseDown={(e) => e.stopPropagation()}
                                                      className="px-1.5 py-0.5 bg-green-600 text-white rounded text-[10px] font-semibold hover:bg-green-700 transition-colors flex-shrink-0 interactive-prevent"
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
                                              <div className="space-y-1 pl-1">
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
                                                            onPointerDown={(e) => e.stopPropagation()}
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                            onClick={(e) => {
                                                              e.preventDefault();
                                                              e.stopPropagation();
                                                              handleUpdateTaskStatus(task._id, 'Em Andamento');
                                                            }}
                                                            className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px] font-semibold hover:bg-blue-700 transition-colors interactive-prevent"
                                                            title="Iniciar Tarefa"
                                                          >
                                                            Iniciar
                                                          </button>
                                                        )}
                                                        <button
                                                          onPointerDown={(e) => e.stopPropagation()}
                                                          onMouseDown={(e) => e.stopPropagation()}
                                                          onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleUpdateTaskStatus(task._id, 'Concluída');
                                                          }}
                                                          className="px-1.5 py-0.5 bg-green-600 text-white rounded text-[10px] font-semibold hover:bg-green-700 transition-colors interactive-prevent"
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
                                      </div>

                                      {/* Bloqueio Icons */}
                                      <div className="flex flex-wrap gap-2 mb-3">
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

                                    </motion.div>
                                  )
                                  }
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
      </section >

      {/* Details Modal */}
      <FinancingDetailModal open={showDetailsModal} onOpenChange={setShowDetailsModal} caseId={selectedCase?._id || null} initialTab={modalTab} onUpdate={loadData} />

      {/* Quick Task Creation Modal */}
      < Dialog open={showQuickTaskModal} onOpenChange={setShowQuickTaskModal} >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-secondary">
              Nova Tarefa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm mb-2 block font-semibold">Responsável</Label>
                <Select
                  value={newTaskData.internalResponsibleId}
                  onValueChange={(value) => setNewTaskData({ ...newTaskData, internalResponsibleId: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecione um responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem_responsavel">Sem Responsável</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

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
                  dueDate: ''
                });
              }}
              className="h-11 px-6"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog >

      {/* Quick Pending Creation Modal */}
      < Dialog open={showQuickPendingModal} onOpenChange={setShowQuickPendingModal} >
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
      </Dialog >

      {/* Phase Confirmation Dialog */}
      < Dialog open={showPhaseConfirmDialog} onOpenChange={setShowPhaseConfirmDialog} >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-secondary">
              <CheckSquare className="w-5 h-5" />
              Conclusão da Fase
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800">
              Checklist de conclusão da fase <strong>{FINANCING_COLUMNS.find(c => c.id === pendingPhaseMove?.oldColumn)?.name}</strong>.
            </div>

            <div className="space-y-3">
              <Label className="font-semibold text-sm text-foreground/80 block mb-2">Checklist da Fase Atual ({FINANCING_COLUMNS.find(c => c.id === pendingPhaseMove?.oldColumn)?.name}):</Label>
              {(() => {
                const checkCol = pendingPhaseMove?.oldColumn;
                if (!checkCol) return null;

                // Use the enhanced checklist config if available
                const checklistConfig = STAGE_CHECKLISTS[checkCol];

                if (!checklistConfig || !checklistConfig.items || checklistConfig.items.length === 0) {
                  return <p className="text-xs text-gray-500 italic">Nenhum item de verificação para esta fase.</p>;
                }

                return checklistConfig.items.map((item, idx) => {
                  // Skip if conditional check fails
                  if (item.condition && !item.condition(cases.find(c => c._id === pendingPhaseMove.caseId))) {
                    return null;
                  }

                  return (
                    <div key={item.id} className="flex flex-col p-3 hover:bg-gray-50 rounded border border-gray-100 mb-2">
                      <Label className="text-sm font-medium mb-2 block">{item.text}</Label>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          type="button"
                          variant={phaseChecklistAnswers[item.id] === 'sim' ? 'default' : 'outline'}
                          className={`h-7 text-xs ${phaseChecklistAnswers[item.id] === 'sim' ? 'bg-green-600 hover:bg-green-700' : 'text-gray-500'}`}
                          onClick={() => setPhaseChecklistAnswers(prev => ({ ...prev, [item.id]: 'sim' }))}
                        >
                          <Check className="w-3 h-3 mr-1" /> Sim
                        </Button>
                        <Button
                          size="sm"
                          type="button"
                          variant={phaseChecklistAnswers[item.id] === 'nao' ? 'default' : 'outline'}
                          className={`h-7 text-xs ${phaseChecklistAnswers[item.id] === 'nao' ? 'bg-red-600 hover:bg-red-700' : 'text-gray-500'}`}
                          onClick={() => setPhaseChecklistAnswers(prev => ({ ...prev, [item.id]: 'nao' }))}
                        >
                          <X className="w-3 h-3 mr-1" /> Não
                        </Button>
                        <Button
                          size="sm"
                          type="button"
                          variant={phaseChecklistAnswers[item.id] === 'irrelevante' ? 'default' : 'outline'}
                          className={`h-7 text-xs ${phaseChecklistAnswers[item.id] === 'irrelevante' ? 'bg-gray-600 hover:bg-gray-700' : 'text-gray-500'}`}
                          onClick={() => setPhaseChecklistAnswers(prev => ({ ...prev, [item.id]: 'irrelevante' }))}
                        >
                          N/A
                        </Button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Optional Note */}
            <div>
              <Label className="text-xs font-semibold text-foreground/70 mb-1 block">Observação de Conclusão (Opcional)</Label>
              <Textarea
                value={phaseCompletionNote}
                onChange={(e) => setPhaseCompletionNote(e.target.value)}
                placeholder="Alguma observação sobre a conclusão desta etapa?"
                className="resize-none text-sm h-20"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPhaseConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmPhaseMove}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Confirmar e Mover
            </Button>
          </div>
        </DialogContent>
      </Dialog >

      <Footer />
    </div >
  );
}
