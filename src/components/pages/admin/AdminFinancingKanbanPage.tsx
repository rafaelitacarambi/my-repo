import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  ListTodo
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
import { ServiceRecords, UsuriosdoSistema, PendnciasdoFinanciamento, FinancingTasks, ServiceParties, Clients, DocumentosdoFinanciamento, HistricodeInteraes, Imveis, AtendimentoImveis } from '@/entities';

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
}

// Temporary interface for the new collection until entities are regenerated
interface ChecklistdosProponentes {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  atendimentoRef?: string;
  clientRef?: string;
  hasFgtsContribution?: boolean;
  hasDependent?: boolean;
  declaresIncomeTax?: boolean;
  ownsProperty?: boolean;
  hasActiveFinancing?: boolean;
  isFirstAcquisition?: boolean;
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
  dataEntradaFaseAtual?: string;
  diasNaFase: number;
  pendenciasAbertas: number;
  tarefasAbertas: number;
  
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
  valorItbi?: number;
  valorPrenotacaoCartorio?: number;
  valorProdutoNegociado?: number;
  valorTaxaVista?: number;
  
  // Financeiro do financiamento
  propertyValue?: number;
  desiredFinancingValue?: number;
  approvedFinancingValue?: number;
  
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
  createdDate: string;
  updatedDate: string;
  
  // Imóveis vinculados
  propertyRefs?: string[];
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
}

interface VendorDocument {
  _id: string;
  docTipo: string;
  recebido: boolean;
  arquivo?: string;
  ativo: boolean;
  observacoes?: string;
}

interface ProponentDocumentItem {
  _id: string;
  documentType: string;
  documentName: string;
  isReceived: boolean;
  isActive: boolean;
  fileUrl?: string;
  notes?: string;
  uploadDate?: string;
}

interface ProponentDocumentChecklist {
  _id?: string;
  atendimentoRef: string;
  clientRef: string;
  documents: ProponentDocumentItem[];
}

// Financing Columns Configuration (exact order as requested)
const FINANCING_COLUMNS: FinancingColumn[] = [
  { id: 'aguardando-imovel', name: 'Aguardando o imóvel', color: 'bg-slate-50 border-slate-200', bgColor: 'bg-slate-50', borderColor: 'border-slate-300' },
  { id: 'condicionados', name: 'Condicionados', color: 'bg-orange-50 border-orange-200', bgColor: 'bg-orange-50', borderColor: 'border-orange-300' },
  { id: 'pendencia', name: 'Pendência', color: 'bg-red-50 border-red-200', bgColor: 'bg-red-50', borderColor: 'border-red-300' },
  { id: 'consultar-restricao', name: 'Consultar restrição', color: 'bg-yellow-50 border-yellow-200', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300' },
  { id: 'novos-clientes', name: 'Novos clientes', color: 'bg-blue-50 border-blue-200', bgColor: 'bg-blue-50', borderColor: 'border-blue-300' },
  { id: 'analise-documentos', name: 'Análise de documentos', color: 'bg-indigo-50 border-indigo-200', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-300' },
  { id: 'cadastro-cliente', name: 'Cadastro de cliente', color: 'bg-cyan-50 border-cyan-200', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-300' },
  { id: 'avaliacao-risco', name: 'Avaliação de risco', color: 'bg-purple-50 border-purple-200', bgColor: 'bg-purple-50', borderColor: 'border-purple-300' },
  { id: 'engenharia', name: 'Engenharia', color: 'bg-violet-50 border-violet-200', bgColor: 'bg-violet-50', borderColor: 'border-violet-300' },
  { id: 'fgts', name: 'FGTS', color: 'bg-green-50 border-green-200', bgColor: 'bg-green-50', borderColor: 'border-green-300' },
  { id: 'formularios', name: 'Formulários', color: 'bg-teal-50 border-teal-200', bgColor: 'bg-teal-50', borderColor: 'border-teal-300' },
  { id: 'siopi', name: 'SIOPI', color: 'bg-sky-50 border-sky-200', bgColor: 'bg-sky-50', borderColor: 'border-sky-300' },
  { id: 'solicitar-reserva', name: 'Solicitar reserva orçamentária', color: 'bg-lime-50 border-lime-200', bgColor: 'bg-lime-50', borderColor: 'border-lime-300' },
  { id: 'sictd', name: 'SICTD', color: 'bg-emerald-50 border-emerald-200', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-300' },
  { id: 'conformidade', name: 'Conformidade', color: 'bg-amber-50 border-amber-200', bgColor: 'bg-amber-50', borderColor: 'border-amber-300' },
  { id: 'entrevista', name: 'Entrevista', color: 'bg-rose-50 border-rose-200', bgColor: 'bg-rose-50', borderColor: 'border-rose-300' },
  { id: 'assinatura-minuta', name: 'Assinatura minuta', color: 'bg-pink-50 border-pink-200', bgColor: 'bg-pink-50', borderColor: 'border-pink-300' },
  { id: 'itbi', name: 'ITBI', color: 'bg-fuchsia-50 border-fuchsia-200', bgColor: 'bg-fuchsia-50', borderColor: 'border-fuchsia-300' },
  { id: 'cartorio-rsales', name: 'Cartório (R Sales)', color: 'bg-purple-50 border-purple-200', bgColor: 'bg-purple-50', borderColor: 'border-purple-300' },
  { id: 'cartorio-cliente', name: 'Cartório por conta do cliente', color: 'bg-indigo-50 border-indigo-200', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-300' },
  { id: 'garantia', name: 'Garantia', color: 'bg-blue-50 border-blue-200', bgColor: 'bg-blue-50', borderColor: 'border-blue-300' },
  { id: 'concluido', name: 'Concluído', color: 'bg-green-50 border-green-200', bgColor: 'bg-green-50', borderColor: 'border-green-300' },
  { id: 'acompanhamento-obra', name: 'Acompanhamento de obra', color: 'bg-yellow-50 border-yellow-200', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300' },
  { id: 'reprovados', name: 'Reprovados', color: 'bg-red-50 border-red-200', bgColor: 'bg-red-50', borderColor: 'border-red-300' }
];

const RESPONSIBLE_TYPES = ['Interno', 'Cliente', 'Parceiro Externo', 'Construtora', 'Caixa', 'Cartório', 'Sistema/Prazo legal'];
const PRIORITY_LEVELS = ['Alta', 'Média', 'Baixa'];
const PENDING_STATUS = ['Aberta', 'Em Andamento', 'Resolvida', 'Cancelada'];
const TASK_STATUS = ['Pendente', 'Em Progresso', 'Concluída', 'Atrasada'];

// Default document types for each proponent
const DEFAULT_PROPONENT_DOCUMENTS = [
  { documentType: 'RG, CPF ou CNH', documentName: 'RG, CPF ou CNH' },
  { documentType: 'Comprovante de residência atual', documentName: 'Comprovante de residência atual' },
  { documentType: 'Certidão de nascimento ou casamento', documentName: 'Certidão de nascimento ou casamento' },
  { documentType: 'Holerite dos últimos 2 meses', documentName: 'Holerite dos últimos 2 meses' },
  { documentType: 'Pró-labore dos últimos 3 meses', documentName: 'Pró-labore dos últimos 3 meses (se houver)' },
  { documentType: 'Extrato do FGTS', documentName: 'Extrato do FGTS (se houver)' },
  { documentType: 'Declaração de Imposto de Renda', documentName: 'Declaração de Imposto de Renda (se houver)' }
];

export default function AdminFinancingKanbanPage() {
  const navigate = useNavigate();
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
  const [proponentDocumentChecklists, setProponentDocumentChecklists] = useState<Map<string, ProponentDocumentChecklist>>(new Map());
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorDocuments, setVendorDocuments] = useState<Map<string, VendorDocument[]>>(new Map());
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAgencia, setFilterAgencia] = useState('');

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
    valorItbi: 0,
    valorPrenotacaoCartorio: 0,
    valorProdutoNegociado: 0,
    valorTaxaVista: 0,
    propertyValue: 0,
    desiredFinancingValue: 0,
    approvedFinancingValue: 0,
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
    description: '',
    responsiblePartyType: 'Interno',
    averageDaysToComplete: 7
  });

  const [editingPending, setEditingPending] = useState<Pending | null>(null);
  const [showPendingForm, setShowPendingForm] = useState(false);
  const [linkedProperties, setLinkedProperties] = useState<AtendimentoImveis[]>([]);

  const [newTaskData, setNewTaskData] = useState({
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
    chavePix: ''
  });

  // Proponents tab state
  const [selectedProponentId, setSelectedProponentId] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

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
            pastaInterna: a._id.substring(0, 8).toUpperCase(),
            status: a.status || 'Novo',
            faseAtual: a.faseFinanciamento || 'novos-clientes',
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
            cpf: '',
            email: a.contactEmail || '',
            phoneNumber: a.contactPhone || '',
            propertyValue: 0,
            desiredFinancingValue: 0,
            approvedFinancingValue: 0,
            useFgts: false,
            fgtsValue: 0,
            responsibleInternalId: a.responsavelInternoId,
            responsibleExternal: a.responsavelExterno,
            bankName: '',
            bankAccountNumber: '',
            financingContractNumber: '',
            notes: a.notes || '',
            createdDate: a._createdDate?.toString() || new Date().toISOString(),
            updatedDate: a._updatedDate?.toString() || new Date().toISOString()
          };
        });

      // Load pendings and tasks
      const { items: pendingsList } = await BaseCrudService.getAll<PendnciasdoFinanciamento>('pendenciasfinanciamento');
      const { items: tasksList } = await BaseCrudService.getAll<FinancingTasks>('tarefasfinanciamento');

      // Count open pendings and tasks for each case
      financingCases.forEach(c => {
        c.pendenciasAbertas = pendingsList.filter(p => p.atendimentoRef === c._id && p.status !== 'Resolvida').length;
        c.tarefasAbertas = tasksList.filter(t => t.atendimentoRef === c._id && t.status !== 'Concluída').length;
        
        // Set bloqueio icons based on pending categories
        const casePendings = pendingsList.filter(p => p.atendimentoRef === c._id && p.status !== 'Resolvida');
        c.bloqueioDocumento = casePendings.some(p => p.categoria === 'Documento');
        c.bloqueioCaixa = casePendings.some(p => p.categoria === 'Caixa');
        c.bloqueioCartorio = casePendings.some(p => p.categoria === 'Cartório');
        c.bloqueioCliente = casePendings.some(p => p.categoria === 'Cliente');
        c.bloqueioEngenharia = casePendings.some(p => p.categoria === 'Engenharia');
        c.bloqueioFormularios = casePendings.some(p => p.categoria === 'Formulários');
        c.bloqueioRestricao = casePendings.some(p => p.categoria === 'Restrição');
        c.bloqueioFgts = casePendings.some(p => p.categoria === 'FGTS');
      });

      setCases(financingCases);
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
          cpfProponentePrincipal: caseData.cpfProponentePrincipal || '',
          email: atendimento.contactEmail || '',
          phoneNumber: atendimento.contactPhone || '',
          responsibleInternalId: atendimento.responsavelInternoId || '',
          responsibleExternal: atendimento.responsavelExterno || '',
          notes: atendimento.notes || ''
        });
      }

      // Load participants
      const { items: participantsList } = await BaseCrudService.getAll<ServiceParties>('atendimentopartes');
      const filteredParticipants = participantsList.filter(p => p.serviceRecordRef === caseId);
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

        // Set principal proponent as selected by default
        setSelectedProponentId(principalClientRef);
      }

      // Also ensure checklist exists for all participants
      for (const participant of filteredParticipants) {
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

      // Load document checklists for proponents
      await loadProponentDocumentChecklists(caseId, principalClientRef, filteredParticipants);

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
              chavePix: bankData.chavePix || ''
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
            observacoes: doc.observacoes
          });
          docsMap.set(doc.vendedorClienteRef, existing);
        }
      });
      
      setVendorDocuments(docsMap);
      
      // Set first vendor as selected if exists
      if (vendorsList.length > 0) {
        setSelectedVendorId(vendorsList[0].clientRef);
      }
      
    } catch (error) {
      console.error('[ERROR] Error loading vendors and documents:', error);
    }
  };

  // Load or create document checklists for all proponents
  const loadProponentDocumentChecklists = async (caseId: string, principalClientRef: string | undefined, participants: ServiceParties[]) => {
    try {
      // For now, we'll store document checklists in localStorage since we don't have a dedicated collection
      // In production, you would create a new collection 'documentosproponentes'
      const storageKey = `doc-checklist-${caseId}`;
      const stored = localStorage.getItem(storageKey);
      
      const checklistsMap = new Map<string, ProponentDocumentChecklist>();
      
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.keys(parsed).forEach(clientRef => {
          checklistsMap.set(clientRef, parsed[clientRef]);
        });
      }
      
      // Ensure principal proponent has document checklist
      if (principalClientRef && !checklistsMap.has(principalClientRef)) {
        const newChecklist: ProponentDocumentChecklist = {
          _id: crypto.randomUUID(),
          atendimentoRef: caseId,
          clientRef: principalClientRef,
          documents: DEFAULT_PROPONENT_DOCUMENTS.map(doc => ({
            _id: crypto.randomUUID(),
            documentType: doc.documentType,
            documentName: doc.documentName,
            isReceived: false,
            isActive: true,
            notes: ''
          }))
        };
        checklistsMap.set(principalClientRef, newChecklist);
      }
      
      // Ensure all participants have document checklists
      for (const participant of participants) {
        if (participant.clientRef && !checklistsMap.has(participant.clientRef)) {
          const newChecklist: ProponentDocumentChecklist = {
            _id: crypto.randomUUID(),
            atendimentoRef: caseId,
            clientRef: participant.clientRef,
            documents: DEFAULT_PROPONENT_DOCUMENTS.map(doc => ({
              _id: crypto.randomUUID(),
              documentType: doc.documentType,
              documentName: doc.documentName,
              isReceived: false,
              isActive: true,
              notes: ''
            }))
          };
          checklistsMap.set(participant.clientRef, newChecklist);
        }
      }
      
      setProponentDocumentChecklists(checklistsMap);
      
      // Save to localStorage
      const toStore: Record<string, ProponentDocumentChecklist> = {};
      checklistsMap.forEach((value, key) => {
        toStore[key] = value;
      });
      localStorage.setItem(storageKey, JSON.stringify(toStore));
      
    } catch (error) {
      console.error('Error loading proponent document checklists:', error);
    }
  };

  // Open details modal
  const handleOpenDetails = async (caseItem: FinancingCase, initialTab: string = 'dados') => {
    console.log('[DEBUG] Opening details modal for case:', caseItem._id);
    console.log('[DEBUG] Initial tab:', initialTab);
    console.log('[DEBUG] Case data:', caseItem);
    
    setSelectedCase(caseItem);
    await loadCaseDetails(caseItem._id);
    setShowDetailsModal(true);
    setModalTab(initialTab); // Set initial tab
    // selectedProponentId is set in loadCaseDetails to principal proponent
  };

  // Save case details
  const handleSaveDetails = async () => {
    if (!selectedCase) return;

    try {
      await BaseCrudService.update<ServiceRecords>('atendimentos', {
        _id: selectedCase._id,
        contactName: caseFormData.proponentePrincipal,
        contactEmail: caseFormData.email,
        contactPhone: caseFormData.phoneNumber,
        responsavelInternoId: caseFormData.responsibleInternalId,
        responsavelExterno: caseFormData.responsibleExternal,
        notes: caseFormData.notes,
        unidadeResponsavelRef: caseFormData.agencia
      });

      // Update local state
      setCases(cases.map(c => c._id === selectedCase._id ? {
        ...c,
        ...caseFormData,
        proponentePrincipal: caseFormData.proponentePrincipal || c.proponentePrincipal,
        agencia: caseFormData.agencia,
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
    } catch (error) {
      console.error('Error saving details:', error);
    }
  };

  // Move case to different column
  const handleMoveCase = async (caseId: string, newColumn: string) => {
    try {
      const now = new Date().toISOString();
      
      await BaseCrudService.update<ServiceRecords>('atendimentos', {
        _id: caseId,
        faseFinanciamento: newColumn,
        dataPrevistaConclusao: now
      });

      // Create history entry
      await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
        _id: crypto.randomUUID(),
        atendimentoRef: caseId,
        tipoEvento: 'Movimentação',
        interactionType: 'Mudança de fase',
        interactionDescription: `Movido para: ${FINANCING_COLUMNS.find(c => c.id === newColumn)?.name}`,
        interactionDate: now,
        autorTipo: 'Sistema'
      });

      // Update local state
      setCases(cases.map(c => c._id === caseId ? {
        ...c,
        faseAtual: newColumn,
        dataEntradaFaseAtual: now,
        diasNaFase: 0
      } : c));

    } catch (error) {
      console.error('Error moving case:', error);
    }
  };

  // Add participant
  const handleAddParticipant = async () => {
    if (!selectedCase || !newParticipant.clientRef) return;

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
      
      // Add to vendors list
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
        chavePix: newVendor.chavePix
      };
      
      setVendors([...vendors, newVendorObj]);
      
      // Create default documents for vendor
      const defaultDocs = ['IDENTIFICACAO', 'CERTIDAO', 'ENDERECO'];
      const vendorDocs: VendorDocument[] = [];
      
      for (const docTipo of defaultDocs) {
        const doc: FinanciamentoDocsVendedor = {
          _id: crypto.randomUUID(),
          atendimentoRef: selectedCase._id,
          vendedorClienteRef: newVendor.clientRef,
          docTipo,
          recebido: false,
          ativo: true,
          observacoes: ''
        };
        
        await BaseCrudService.create('financiamentodocsvendedor', doc);
        
        vendorDocs.push({
          _id: doc._id,
          docTipo,
          recebido: false,
          ativo: true,
          observacoes: ''
        });
      }
      
      // Update vendor documents map
      const newDocsMap = new Map(vendorDocuments);
      newDocsMap.set(newVendor.clientRef, vendorDocs);
      setVendorDocuments(newDocsMap);
      
      // Set as selected
      setSelectedVendorId(newVendor.clientRef);
      
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
        chavePix: ''
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
      
      // Remove from selected if it was selected
      if (selectedVendorId === vendor.clientRef) {
        const remaining = vendors.filter(v => v._id !== vendorId);
        setSelectedVendorId(remaining.length > 0 ? remaining[0].clientRef : '');
      }
      
      console.log('[DEBUG] Vendor removed successfully');
      
    } catch (error) {
      console.error('[ERROR] Error removing vendor:', error);
    }
  };

  // Update vendor bank data
  const handleUpdateVendorBankData = async (vendorClientRef: string, field: string, value: string) => {
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
        chavePix: vendor.chavePix
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

  // Delete vendor document (mark as inactive)
  const handleDeleteVendorDocument = async (vendorClientRef: string, docId: string) => {
    await handleUpdateVendorDocument(vendorClientRef, docId, { ativo: false });
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
      
      // Create new pending with minimal required fields
      const newPending: PendnciasdoFinanciamento = {
        _id: crypto.randomUUID(),
        atendimentoRef: selectedCase._id,
        title: newPendingData.description.substring(0, 100), // Use description as title (truncated)
        description: newPendingData.description,
        status: 'Aberta',
        priority: 'Média',
        dueDate: dueDate.toISOString(),
        responsiblePartyType: newPendingData.responsiblePartyType,
        responsiblePartyDetails: '',
        taskAutomaticallyCreated: false,
        creationDate: new Date().toISOString(),
        bloqueiaFase: false,
        categoria: ''
      };

      console.log('[DEBUG] Saving pending to database:', newPending);
      await BaseCrudService.create('pendenciasfinanciamento', newPending);
      console.log('[DEBUG] Pending saved successfully');

      // Update local state optimistically
      setPendings([...pendings, newPending as Pending]);
      
      // Reset form
      setNewPendingData({
        description: '',
        responsiblePartyType: 'Interno',
        averageDaysToComplete: 7
      });
      setShowPendingForm(false);

      // Reload data to sync with backend (including hook-created tasks)
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

  // Update pending status
  const handleUpdatePendingStatus = async (pendingId: string, newStatus: string) => {
    try {
      await BaseCrudService.update<PendnciasdoFinanciamento>('pendenciasfinanciamento', {
        _id: pendingId,
        status: newStatus,
        resolvedDate: newStatus === 'Resolvida' ? new Date().toISOString() : undefined
      });

      setPendings(pendings.map(p => p._id === pendingId ? { ...p, status: newStatus } : p));
      await loadData();
    } catch (error) {
      console.error('Error updating pending status:', error);
    }
  };

  // Update task status
  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await BaseCrudService.update<FinancingTasks>('tarefasfinanciamento', {
        _id: taskId,
        status: newStatus
      });

      setTasks(tasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
      await loadData();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  // Update proponent checklist
  const handleUpdateProponentChecklist = async (clientRef: string, field: keyof ProponentChecklist, value: boolean) => {
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
      hasFgtsContribution: field === 'hasFgtsContribution' ? value : false,
      hasDependent: field === 'hasDependent' ? value : false,
      declaresIncomeTax: field === 'declaresIncomeTax' ? value : false,
      ownsProperty: field === 'ownsProperty' ? value : false,
      hasActiveFinancing: field === 'hasActiveFinancing' ? value : false,
      isFirstAcquisition: field === 'isFirstAcquisition' ? value : false
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
          });
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
          };

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
  const handleUpdateDocumentItem = async (clientRef: string, documentId: string, updates: Partial<ProponentDocumentItem>) => {
    if (!selectedCase) return;

    const checklist = proponentDocumentChecklists.get(clientRef);
    if (!checklist) return;

    const updatedDocuments = checklist.documents.map(doc => 
      doc._id === documentId ? { ...doc, ...updates } : doc
    );

    const updatedChecklist: ProponentDocumentChecklist = {
      ...checklist,
      documents: updatedDocuments
    };

    const newMap = new Map(proponentDocumentChecklists);
    newMap.set(clientRef, updatedChecklist);
    setProponentDocumentChecklists(newMap);

    // Save to localStorage
    const storageKey = `doc-checklist-${selectedCase._id}`;
    const toStore: Record<string, ProponentDocumentChecklist> = {};
    newMap.forEach((value, key) => {
      toStore[key] = value;
    });
    localStorage.setItem(storageKey, JSON.stringify(toStore));

    // Create history entry
    const client = clients.find(c => c._id === clientRef);
    const clientName = client?.clientName || client?.nomeRazaoSocial || 'Proponente';
    const document = updatedDocuments.find(d => d._id === documentId);
    
    if (document) {
      let description = '';
      if (updates.isReceived !== undefined) {
        description = updates.isReceived 
          ? `Documento "${document.documentName}" marcado como RECEBIDO para ${clientName}`
          : `Documento "${document.documentName}" marcado como NÃO RECEBIDO para ${clientName}`;
      } else if (updates.isActive === false) {
        description = `Documento "${document.documentName}" EXCLUÍDO do checklist de ${clientName}`;
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
    await syncDocumentPendings(clientRef);
  };

  // Delete document item (mark as inactive)
  const handleDeleteDocumentItem = async (clientRef: string, documentId: string) => {
    await handleUpdateDocumentItem(clientRef, documentId, { isActive: false });
  };

  // Sync automatic pendings based on document checklist
  const syncDocumentPendings = async (clientRef: string) => {
    if (!selectedCase) return;

    const checklist = proponentDocumentChecklists.get(clientRef);
    if (!checklist) return;

    const client = clients.find(c => c._id === clientRef);
    const clientName = client?.clientName || client?.nomeRazaoSocial || 'Proponente';

    // Get active documents that are not received
    const missingDocs = checklist.documents.filter(doc => doc.isActive && !doc.isReceived);

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
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
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
      const doc = checklist.documents.find(d => d.documentName === docName);

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
      <div className="min-h-screen bg-light-gray">
        <Header />
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-20">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-primary rounded-2xl shadow-lg"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-gray">
      <Header />
      <FinancingNavigation />

      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-secondary via-secondary/90 to-buttonbackground py-16">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-heading text-5xl lg:text-6xl text-white mb-4">
              Kanban de Financiamento Bancário
            </h1>
            <p className="font-paragraph text-lg text-white/90 mb-6">
              Controle operacional completo do fluxo de financiamentos da R Sales Imóveis
            </p>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por proponente, pasta ou CPF..."
                  className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
              </div>
              <Select value={filterAgencia} onValueChange={setFilterAgencia}>
                <SelectTrigger className="w-[250px] h-12 bg-white/10 border-white/20 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrar por agência" />
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
            </div>
          </motion.div>
        </div>
      </section>

      {/* Kanban Board */}
      <section className="w-full py-8">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <div className="flex gap-4 overflow-x-auto pb-6">
            {FINANCING_COLUMNS.map((column) => {
              const columnCases = getCasesByColumn(column.id);
              return (
                <motion.div
                  key={column.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex-shrink-0 w-[340px]"
                >
                  <div className={`${column.color} border-2 rounded-xl p-4 min-h-[600px] flex flex-col shadow-md`}>
                    <div className="mb-4">
                      <h3 className="font-heading text-sm text-foreground font-bold uppercase tracking-wide mb-2">
                        {column.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {columnCases.length} {columnCases.length === 1 ? 'caso' : 'casos'}
                        </Badge>
                      </div>
                    </div>

                    <ScrollArea className="flex-1">
                      <div className="space-y-3 pr-2">
                        {columnCases.map((caseItem) => {
                          const daysBadgeColor = caseItem.diasNaFase <= 3 ? 'bg-green-500' : caseItem.diasNaFase <= 7 ? 'bg-yellow-500' : 'bg-red-500';
                          const hasActivityToday = [...pendings, ...tasks].some(item => {
                            const itemDate = new Date(item.createdDate || '').toDateString();
                            return itemDate === new Date().toDateString() && (item.atendimentoRef === caseItem._id);
                          });
                          
                          return (
                            <motion.div
                              key={caseItem._id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              whileHover={{ scale: 1.02, boxShadow: '0 12px 24px rgba(0,0,0,0.15)' }}
                              transition={{ duration: 0.2 }}
                              onClick={() => handleOpenDetails(caseItem, 'dados')}
                              className="bg-white rounded-xl p-4 border border-border-gray hover:shadow-xl transition-all cursor-pointer group relative"
                            >
                              {/* Activity indicator */}
                              <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${hasActivityToday ? 'bg-green-500' : 'bg-red-500'}`} 
                                   title={hasActivityToday ? 'Atividade hoje' : 'Sem atividade hoje'}>
                              </div>
                              
                              {/* Quick action icons - top right corner */}
                              <div className="absolute top-3 right-8 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDetails(caseItem, 'pendencias');
                                  }}
                                  className="p-1.5 bg-orange-100 rounded hover:bg-orange-200 transition-colors"
                                  title="Abrir Pendências"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDetails(caseItem, 'pendencias');
                                  }}
                                  className="p-1.5 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                                  title="Abrir Tarefas"
                                >
                                  <ListTodo className="w-3.5 h-3.5 text-blue-600" />
                                </button>
                              </div>
                              
                              {/* Header */}
                              <div className="mb-3">
                                <h4 className="font-heading text-base text-foreground font-bold mb-1 pr-6 line-clamp-1">
                                  {caseItem.proponentePrincipal}
                                </h4>
                                <div className="flex flex-wrap gap-1 text-xs text-foreground/60">
                                  {caseItem.agencia && <span>Agência: {caseItem.agencia}</span>}
                                  {caseItem.pastaInterna && <span>• Pasta: {caseItem.pastaInterna}</span>}
                                </div>
                              </div>

                              {/* Status and Phase */}
                              <div className="mb-3 space-y-1">
                                <Badge className="text-xs font-semibold">
                                  {caseItem.status}
                                </Badge>
                                <div className="flex items-center gap-1 text-xs text-foreground/70">
                                  <Clock className="w-3 h-3" />
                                  <span className={`font-bold px-2 py-0.5 rounded ${daysBadgeColor} text-white`}>
                                    {caseItem.diasNaFase} {caseItem.diasNaFase === 1 ? 'dia' : 'dias'}
                                  </span>
                                </div>
                              </div>

                              {/* Pendings and Tasks */}
                              <div className="flex items-center gap-3 mb-3 text-xs">
                                <div className="flex items-center gap-1">
                                  <AlertCircle className={`w-4 h-4 ${caseItem.pendenciasAbertas > 0 ? 'text-red-500' : 'text-green-500'}`} />
                                  <span className="font-semibold">{caseItem.pendenciasAbertas} pend.</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CheckCircle className={`w-4 h-4 ${caseItem.tarefasAbertas > 0 ? 'text-yellow-500' : 'text-green-500'}`} />
                                  <span className="font-semibold">{caseItem.tarefasAbertas} tarefas</span>
                                </div>
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

                              {/* Move to column selector */}
                              <div className="pt-3 border-t border-border-gray">
                                <Select value={caseItem.faseAtual} onValueChange={(value) => handleMoveCase(caseItem._id, value)}>
                                  <SelectTrigger className="h-8 text-xs" onClick={(e) => e.stopPropagation()}>
                                    <SelectValue placeholder="Mover para..." />
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
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-border-gray sticky top-0 bg-white z-10">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="font-heading text-2xl text-secondary">
                  Financiamento — {selectedCase?.proponentePrincipal}
                </DialogTitle>
                <div className="flex gap-2 mt-2">
                  <Badge>{selectedCase?.status}</Badge>
                  <Badge variant="outline">{FINANCING_COLUMNS.find(c => c.id === selectedCase?.faseAtual)?.name}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
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

          <ScrollArea className="h-[calc(90vh-120px)]">
            <div className="px-6 py-4">
              <Tabs value={modalTab} onValueChange={setModalTab}>
                <TabsList className="grid w-full grid-cols-6 mb-6">
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
                    Pendências + Tarefas
                    {(() => {
                      const casePendings = pendings.filter(p => p.atendimentoRef === selectedCase?._id && p.status !== 'Resolvida');
                      const caseTasks = tasks.filter(t => t.atendimentoRef === selectedCase?._id && t.status !== 'Concluída');
                      const totalOpen = casePendings.length + caseTasks.length;
                      if (totalOpen > 0) {
                        return (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                            {totalOpen}
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
                <TabsContent value="dados" className="space-y-6">
                  {/* Campos Obrigatórios */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-heading flex items-center gap-2">
                        <Info className="w-5 h-5 text-secondary" />
                        Campos Obrigatórios
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="font-paragraph text-sm mb-2 block">Agência Responsável *</Label>
                          <Input
                            value={caseFormData.agencia}
                            onChange={(e) => setCaseFormData({ ...caseFormData, agencia: e.target.value })}
                            placeholder="Nome da agência"
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label className="font-paragraph text-sm mb-2 block">Pasta Interna (editável) *</Label>
                          <Input
                            value={caseFormData.pastaInterna}
                            onChange={(e) => setCaseFormData({ ...caseFormData, pastaInterna: e.target.value })}
                            placeholder="Código da pasta"
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label className="font-paragraph text-sm mb-2 block">Proponente Principal (Nome) *</Label>
                          <Input
                            value={caseFormData.proponentePrincipal}
                            onChange={(e) => setCaseFormData({ ...caseFormData, proponentePrincipal: e.target.value })}
                            placeholder="Nome completo"
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label className="font-paragraph text-sm mb-2 block">CPF do Proponente Principal *</Label>
                          <Input
                            value={caseFormData.cpfProponentePrincipal}
                            onChange={(e) => setCaseFormData({ ...caseFormData, cpfProponentePrincipal: e.target.value })}
                            placeholder="000.000.000-00"
                            className="h-10"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Participantes Vinculados */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-heading flex items-center gap-2">
                        <Users className="w-5 h-5 text-secondary" />
                        Participantes Vinculados
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <Select value={newParticipant.clientRef} onValueChange={(value) => setNewParticipant({ ...newParticipant, clientRef: value })}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Selecionar cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map(client => (
                              <SelectItem key={client._id} value={client._id}>
                                {client.clientName || client.nomeRazaoSocial}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={newParticipant.roleInService}
                          onChange={(e) => setNewParticipant({ ...newParticipant, roleInService: e.target.value })}
                          placeholder="Papel (ex: Dependente)"
                          className="h-10"
                        />
                        <Button onClick={handleAddParticipant} className="h-10 bg-secondary text-secondary-foreground">
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {participants.map(participant => {
                          const client = clients.find(c => c._id === participant.clientRef);
                          return (
                            <div key={participant._id} className="flex items-center justify-between bg-light-gray p-3 rounded-lg">
                              <div>
                                <p className="font-paragraph text-sm font-semibold">{client?.clientName || client?.nomeRazaoSocial}</p>
                                <p className="text-xs text-foreground/60">{participant.roleInService}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveParticipant(participant._id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Campos Bancários */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-heading flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-secondary" />
                        Campos Bancários
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="font-paragraph text-sm mb-2 block">Número da Matrícula</Label>
                          <Input
                            value={caseFormData.numeroMatricula}
                            onChange={(e) => setCaseFormData({ ...caseFormData, numeroMatricula: e.target.value })}
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label className="font-paragraph text-sm mb-2 block">Número do Contrato</Label>
                          <Input
                            value={caseFormData.numeroContrato}
                            onChange={(e) => setCaseFormData({ ...caseFormData, numeroContrato: e.target.value })}
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label className="font-paragraph text-sm mb-2 block">Número do Protocolo do Cartório</Label>
                          <Input
                            value={caseFormData.numeroProtocoloCartorio}
                            onChange={(e) => setCaseFormData({ ...caseFormData, numeroProtocoloCartorio: e.target.value })}
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label className="font-paragraph text-sm mb-2 block">Valor do ITBI</Label>
                          <Input
                            type="number"
                            value={caseFormData.valorItbi}
                            onChange={(e) => setCaseFormData({ ...caseFormData, valorItbi: parseFloat(e.target.value) || 0 })}
                            placeholder="R$ 0,00"
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label className="font-paragraph text-sm mb-2 block">Valor da Prenotação Cartório</Label>
                          <Input
                            type="number"
                            value={caseFormData.valorPrenotacaoCartorio}
                            onChange={(e) => setCaseFormData({ ...caseFormData, valorPrenotacaoCartorio: parseFloat(e.target.value) || 0 })}
                            placeholder="R$ 0,00"
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label className="font-paragraph text-sm mb-2 block">Valor do Produto Negociado</Label>
                          <Input
                            type="number"
                            value={caseFormData.valorProdutoNegociado}
                            onChange={(e) => setCaseFormData({ ...caseFormData, valorProdutoNegociado: parseFloat(e.target.value) || 0 })}
                            placeholder="R$ 0,00"
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label className="font-paragraph text-sm mb-2 block">Valor da Taxa à Vista</Label>
                          <Input
                            type="number"
                            value={caseFormData.valorTaxaVista}
                            onChange={(e) => setCaseFormData({ ...caseFormData, valorTaxaVista: parseFloat(e.target.value) || 0 })}
                            placeholder="R$ 0,00"
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
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="font-paragraph text-sm mb-2 block">Valor do Imóvel *</Label>
                          <Input
                            type="number"
                            value={caseFormData.propertyValue}
                            onChange={(e) => setCaseFormData({ ...caseFormData, propertyValue: parseFloat(e.target.value) || 0 })}
                            placeholder="R$ 0,00"
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label className="font-paragraph text-sm mb-2 block">Valor de Financiamento Desejado *</Label>
                          <Input
                            type="number"
                            value={caseFormData.desiredFinancingValue}
                            onChange={(e) => setCaseFormData({ ...caseFormData, desiredFinancingValue: parseFloat(e.target.value) || 0 })}
                            placeholder="R$ 0,00"
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label className="font-paragraph text-sm mb-2 block">Valor de Financiamento Possível/Aprovado</Label>
                          <Input
                            type="number"
                            value={caseFormData.approvedFinancingValue}
                            onChange={(e) => setCaseFormData({ ...caseFormData, approvedFinancingValue: parseFloat(e.target.value) || 0 })}
                            placeholder="R$ 0,00"
                            className="h-10"
                          />
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
                          <Label className="font-paragraph text-sm mb-2 block">Utilizará FGTS? *</Label>
                          <Select 
                            value={caseFormData.useFgts ? 'sim' : 'nao'} 
                            onValueChange={(value) => setCaseFormData({ ...caseFormData, useFgts: value === 'sim', fgtsValue: value === 'nao' ? 0 : caseFormData.fgtsValue })}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sim">Sim</SelectItem>
                              <SelectItem value="nao">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {caseFormData.useFgts && (
                          <div>
                            <Label className="font-paragraph text-sm mb-2 block">Valor desejado de débito FGTS</Label>
                            <Input
                              type="number"
                              value={caseFormData.fgtsValue}
                              onChange={(e) => setCaseFormData({ ...caseFormData, fgtsValue: parseFloat(e.target.value) || 0 })}
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
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={caseFormData.hasCommercialProposal || false}
                            onCheckedChange={(checked) => setCaseFormData({ ...caseFormData, hasCommercialProposal: checked as boolean })}
                          />
                          <Label className="font-paragraph text-sm cursor-pointer">
                            Possui proposta comercial?
                          </Label>
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
                        <div>
                          <Label className="font-paragraph text-sm mb-2 block">E-mail</Label>
                          <Input
                            type="email"
                            value={caseFormData.email}
                            onChange={(e) => setCaseFormData({ ...caseFormData, email: e.target.value })}
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label className="font-paragraph text-sm mb-2 block">Telefone</Label>
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
                </TabsContent>

                {/* Proponentes Tab */}
                <TabsContent value="proponentes" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-heading flex items-center gap-2">
                          <Users className="w-5 h-5 text-secondary" />
                          Checklist dos Proponentes
                        </CardTitle>
                        {saveStatus === 'saved' && (
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Salvo
                          </Badge>
                        )}
                        {saveStatus === 'saving' && (
                          <Badge variant="outline" className="text-foreground/60">
                            Salvando...
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        // Build proponents list: Principal first, then participants (avoiding duplicates)
                        const proponentsList: Array<{ clientRef: string; name: string; cpf: string; roleInService: string; isPrincipal: boolean }> = [];
                        
                        // Add principal proponent first (from form data)
                        if (caseFormData.proponentePrincipal) {
                          const principalKey = `principal-${selectedCase?._id}`;
                          proponentsList.push({
                            clientRef: principalKey,
                            name: caseFormData.proponentePrincipal,
                            cpf: caseFormData.cpfProponentePrincipal || '',
                            roleInService: 'Proponente Principal',
                            isPrincipal: true
                          });
                        }
                        
                        // Add participants (excluding principal if duplicate)
                        participants.forEach(participant => {
                          const client = clients.find(c => c._id === participant.clientRef);
                          if (client) {
                            // Check if this participant is the same as principal (by CPF)
                            const isDuplicate = caseFormData.cpfProponentePrincipal && 
                                               client.cpfCnpj === caseFormData.cpfProponentePrincipal;
                            
                            if (!isDuplicate) {
                              proponentsList.push({
                                clientRef: participant.clientRef,
                                name: client.clientName || client.nomeRazaoSocial || 'Nome não disponível',
                                cpf: client.cpfCnpj || '',
                                roleInService: participant.roleInService || 'Participante',
                                isPrincipal: false
                              });
                            }
                          }
                        });
                        
                        if (proponentsList.length === 0) {
                          return (
                            <div className="text-center py-12 bg-light-gray/50 rounded-xl border-2 border-dashed border-border-gray">
                              <Users className="w-16 h-16 mx-auto mb-4 text-foreground/20" />
                              <h4 className="font-heading text-lg font-semibold mb-2 text-foreground/80">
                                Nenhum proponente configurado
                              </h4>
                              <p className="text-sm text-foreground/60 mb-4">
                                Preencha o nome e CPF do Proponente Principal na aba 'Dados' para começar
                              </p>
                              <Button 
                                onClick={() => setModalTab('dados')}
                                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Ir para Dados
                              </Button>
                            </div>
                          );
                        }
                        
                        return (
                          <div className="space-y-6">
                            {/* Participant Selector (only show if more than 1) */}
                            {proponentsList.length > 1 && (
                              <div>
                                <Label className="font-paragraph text-sm mb-2 block font-semibold">
                                  Selecione o participante
                                </Label>
                                <Select 
                                  value={selectedProponentId || proponentsList[0]?.clientRef} 
                                  onValueChange={setSelectedProponentId}
                                >
                                  <SelectTrigger className="h-12 bg-white border-2 border-border-gray">
                                    <SelectValue placeholder="Escolha um proponente" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {proponentsList.map((proponent, index) => (
                                      <SelectItem key={`${proponent.clientRef}-${index}`} value={proponent.clientRef}>
                                        <div className="flex items-center gap-2">
                                          {proponent.isPrincipal && (
                                            <Badge className="bg-secondary text-secondary-foreground text-xs px-2 py-0">
                                              Principal
                                            </Badge>
                                          )}
                                          <span className="font-semibold">
                                            {proponent.name}
                                          </span>
                                          <span className="text-xs text-foreground/60">
                                            ({proponent.roleInService})
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {/* Display selected proponent or first one */}
                            {(() => {
                              const currentClientRef = selectedProponentId || proponentsList[0]?.clientRef;
                              const proponent = proponentsList.find(p => p.clientRef === currentClientRef);
                              const checklist = proponentChecklists.get(currentClientRef);
                              
                              if (!proponent) return null;

                              return (
                                <div className="border-2 border-secondary/20 rounded-xl p-6 bg-gradient-to-br from-white to-light-gray/30">
                                  {/* Proponent Info Header */}
                                  <div className="mb-6 pb-5 border-b-2 border-border-gray">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <h4 className="font-heading text-xl font-bold text-secondary mb-2">
                                          {proponent.name}
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                          {proponent.cpf && (
                                            <div className="flex items-center gap-2">
                                              <span className="font-semibold text-foreground/70">CPF:</span>
                                              <span className="text-foreground">{proponent.cpf}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <Badge className="bg-secondary text-secondary-foreground text-sm px-3 py-1">
                                        {proponent.roleInService}
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* Checklist Section */}
                                  <div className="mb-8">
                                    <h5 className="font-heading text-base font-bold mb-5 flex items-center gap-2 text-foreground">
                                      <ClipboardList className="w-5 h-5 text-secondary" />
                                      Checklist Individual
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* FGTS 3 anos */}
                                      <div className="p-4 bg-white rounded-lg border-2 border-border-gray hover:border-secondary/40 hover:shadow-md transition-all">
                                        <Label className="font-paragraph text-sm font-semibold leading-tight block mb-2">
                                          Possui 3 anos de contribuição FGTS?
                                        </Label>
                                        <p className="text-xs text-foreground/60 mb-3">Necessário para utilizar FGTS no financiamento</p>
                                        <RadioGroup
                                          value={checklist?.hasFgtsContribution === true ? 'sim' : checklist?.hasFgtsContribution === false ? 'nao' : ''}
                                          onValueChange={(value) => handleUpdateProponentChecklist(proponent.clientRef, 'hasFgtsContribution', value === 'sim')}
                                          className="flex gap-4"
                                        >
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="sim" id={`fgts-sim-${proponent.clientRef}`} />
                                            <Label htmlFor={`fgts-sim-${proponent.clientRef}`} className="cursor-pointer font-medium">SIM</Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="nao" id={`fgts-nao-${proponent.clientRef}`} />
                                            <Label htmlFor={`fgts-nao-${proponent.clientRef}`} className="cursor-pointer font-medium">NÃO</Label>
                                          </div>
                                        </RadioGroup>
                                      </div>

                                      {/* Dependente */}
                                      <div className="p-4 bg-white rounded-lg border-2 border-border-gray hover:border-secondary/40 hover:shadow-md transition-all">
                                        <Label className="font-paragraph text-sm font-semibold leading-tight block mb-2">
                                          Possui dependente ou participante?
                                        </Label>
                                        <p className="text-xs text-foreground/60 mb-3">Pode influenciar na análise de crédito</p>
                                        <RadioGroup
                                          value={checklist?.hasDependent === true ? 'sim' : checklist?.hasDependent === false ? 'nao' : ''}
                                          onValueChange={(value) => handleUpdateProponentChecklist(proponent.clientRef, 'hasDependent', value === 'sim')}
                                          className="flex gap-4"
                                        >
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="sim" id={`dependent-sim-${proponent.clientRef}`} />
                                            <Label htmlFor={`dependent-sim-${proponent.clientRef}`} className="cursor-pointer font-medium">SIM</Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="nao" id={`dependent-nao-${proponent.clientRef}`} />
                                            <Label htmlFor={`dependent-nao-${proponent.clientRef}`} className="cursor-pointer font-medium">NÃO</Label>
                                          </div>
                                        </RadioGroup>
                                      </div>

                                      {/* Imposto de Renda */}
                                      <div className="p-4 bg-white rounded-lg border-2 border-border-gray hover:border-secondary/40 hover:shadow-md transition-all">
                                        <Label className="font-paragraph text-sm font-semibold leading-tight block mb-2">
                                          Declara imposto de renda?
                                        </Label>
                                        <p className="text-xs text-foreground/60 mb-3">Documento necessário para comprovação de renda</p>
                                        <RadioGroup
                                          value={checklist?.declaresIncomeTax === true ? 'sim' : checklist?.declaresIncomeTax === false ? 'nao' : ''}
                                          onValueChange={(value) => handleUpdateProponentChecklist(proponent.clientRef, 'declaresIncomeTax', value === 'sim')}
                                          className="flex gap-4"
                                        >
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="sim" id={`ir-sim-${proponent.clientRef}`} />
                                            <Label htmlFor={`ir-sim-${proponent.clientRef}`} className="cursor-pointer font-medium">SIM</Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="nao" id={`ir-nao-${proponent.clientRef}`} />
                                            <Label htmlFor={`ir-nao-${proponent.clientRef}`} className="cursor-pointer font-medium">NÃO</Label>
                                          </div>
                                        </RadioGroup>
                                      </div>

                                      {/* Possui Imóvel */}
                                      <div className="p-4 bg-white rounded-lg border-2 border-border-gray hover:border-secondary/40 hover:shadow-md transition-all">
                                        <Label className="font-paragraph text-sm font-semibold leading-tight block mb-2">
                                          Possui imóvel?
                                        </Label>
                                        <p className="text-xs text-foreground/60 mb-3">Pode afetar condições do financiamento</p>
                                        <RadioGroup
                                          value={checklist?.ownsProperty === true ? 'sim' : checklist?.ownsProperty === false ? 'nao' : ''}
                                          onValueChange={(value) => handleUpdateProponentChecklist(proponent.clientRef, 'ownsProperty', value === 'sim')}
                                          className="flex gap-4"
                                        >
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="sim" id={`property-sim-${proponent.clientRef}`} />
                                            <Label htmlFor={`property-sim-${proponent.clientRef}`} className="cursor-pointer font-medium">SIM</Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="nao" id={`property-nao-${proponent.clientRef}`} />
                                            <Label htmlFor={`property-nao-${proponent.clientRef}`} className="cursor-pointer font-medium">NÃO</Label>
                                          </div>
                                        </RadioGroup>
                                      </div>

                                      {/* Financiamento Ativo */}
                                      <div className="p-4 bg-white rounded-lg border-2 border-border-gray hover:border-secondary/40 hover:shadow-md transition-all">
                                        <Label className="font-paragraph text-sm font-semibold leading-tight block mb-2">
                                          Possui financiamento ativo?
                                        </Label>
                                        <p className="text-xs text-foreground/60 mb-3">Impacta na capacidade de endividamento</p>
                                        <RadioGroup
                                          value={checklist?.hasActiveFinancing === true ? 'sim' : checklist?.hasActiveFinancing === false ? 'nao' : ''}
                                          onValueChange={(value) => handleUpdateProponentChecklist(proponent.clientRef, 'hasActiveFinancing', value === 'sim')}
                                          className="flex gap-4"
                                        >
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="sim" id={`financing-sim-${proponent.clientRef}`} />
                                            <Label htmlFor={`financing-sim-${proponent.clientRef}`} className="cursor-pointer font-medium">SIM</Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="nao" id={`financing-nao-${proponent.clientRef}`} />
                                            <Label htmlFor={`financing-nao-${proponent.clientRef}`} className="cursor-pointer font-medium">NÃO</Label>
                                          </div>
                                        </RadioGroup>
                                      </div>

                                      {/* Primeira Aquisição SFH */}
                                      <div className="p-4 bg-white rounded-lg border-2 border-border-gray hover:border-secondary/40 hover:shadow-md transition-all">
                                        <Label className="font-paragraph text-sm font-semibold leading-tight block mb-2">
                                          Primeira aquisição no âmbito SFH?
                                        </Label>
                                        <p className="text-xs text-foreground/60 mb-3">Pode garantir melhores taxas de juros</p>
                                        <RadioGroup
                                          value={checklist?.isFirstAcquisition === true ? 'sim' : checklist?.isFirstAcquisition === false ? 'nao' : ''}
                                          onValueChange={(value) => handleUpdateProponentChecklist(proponent.clientRef, 'isFirstAcquisition', value === 'sim')}
                                          className="flex gap-4"
                                        >
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="sim" id={`first-sim-${proponent.clientRef}`} />
                                            <Label htmlFor={`first-sim-${proponent.clientRef}`} className="cursor-pointer font-medium">SIM</Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="nao" id={`first-nao-${proponent.clientRef}`} />
                                            <Label htmlFor={`first-nao-${proponent.clientRef}`} className="cursor-pointer font-medium">NÃO</Label>
                                          </div>
                                        </RadioGroup>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Document Checklist Section */}
                                  <div className="mt-8 pt-8 border-t-2 border-border-gray">
                                    <h5 className="font-heading text-base font-bold mb-5 flex items-center gap-2 text-foreground">
                                      <FileCheck className="w-5 h-5 text-secondary" />
                                      Checklist de Documentos
                                    </h5>
                                    
                                    {(() => {
                                      const docChecklist = proponentDocumentChecklists.get(currentClientRef);
                                      
                                      if (!docChecklist) {
                                        return (
                                          <div className="text-center py-8 bg-light-gray/50 rounded-xl">
                                            <File className="w-12 h-12 mx-auto mb-3 text-foreground/20" />
                                            <p className="text-sm text-foreground/60">Carregando checklist de documentos...</p>
                                          </div>
                                        );
                                      }

                                      const activeDocuments = docChecklist.documents.filter(doc => doc.isActive);
                                      const receivedCount = activeDocuments.filter(doc => doc.isReceived).length;
                                      const totalCount = activeDocuments.length;

                                      return (
                                        <div className="space-y-4">
                                          {/* Progress indicator */}
                                          <div className="bg-gradient-to-r from-secondary/10 to-secondary/5 p-4 rounded-lg border border-secondary/20">
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="font-paragraph text-sm font-semibold text-foreground">
                                                Progresso dos Documentos
                                              </span>
                                              <Badge className="bg-secondary text-secondary-foreground">
                                                {receivedCount} de {totalCount} recebidos
                                              </Badge>
                                            </div>
                                            <div className="w-full bg-white rounded-full h-3 overflow-hidden border border-border-gray">
                                              <div 
                                                className="bg-secondary h-full transition-all duration-500 ease-out"
                                                style={{ width: `${totalCount > 0 ? (receivedCount / totalCount) * 100 : 0}%` }}
                                              />
                                            </div>
                                          </div>

                                          {/* Document items */}
                                          <div className="space-y-3">
                                            {activeDocuments.map((doc) => (
                                              <motion.div
                                                key={doc._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`p-4 rounded-lg border-2 transition-all ${
                                                  doc.isReceived 
                                                    ? 'bg-green-50 border-green-300' 
                                                    : 'bg-white border-border-gray hover:border-secondary/40'
                                                }`}
                                              >
                                                <div className="space-y-3">
                                                  {/* Document header */}
                                                  <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-3 flex-1">
                                                      <Checkbox
                                                        checked={doc.isReceived}
                                                        onCheckedChange={(checked) => 
                                                          handleUpdateDocumentItem(currentClientRef, doc._id, { 
                                                            isReceived: checked as boolean,
                                                            uploadDate: checked ? new Date().toISOString() : undefined
                                                          })
                                                        }
                                                        className="mt-1"
                                                      />
                                                      <div className="flex-1">
                                                        <Label className={`font-paragraph text-sm font-semibold block mb-1 cursor-pointer ${
                                                          doc.isReceived ? 'text-green-700' : 'text-foreground'
                                                        }`}>
                                                          {doc.documentName}
                                                        </Label>
                                                        {doc.isReceived && doc.uploadDate && (
                                                          <p className="text-xs text-green-600 flex items-center gap-1">
                                                            <CheckCircle className="w-3 h-3" />
                                                            Recebido em {new Date(doc.uploadDate).toLocaleDateString('pt-BR')}
                                                          </p>
                                                        )}
                                                      </div>
                                                    </div>
                                                    <Button
                                                      size="sm"
                                                      variant="ghost"
                                                      onClick={() => handleDeleteDocumentItem(currentClientRef, doc._id)}
                                                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                      title="Excluir item (não aplicável)"
                                                    >
                                                      <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                  </div>

                                                  {/* File upload section */}
                                                  <div className="ml-8 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                      <Label className="text-xs text-foreground/70 font-semibold">
                                                        Arquivo:
                                                      </Label>
                                                      {doc.fileUrl ? (
                                                        <div className="flex items-center gap-2">
                                                          <a 
                                                            href={doc.fileUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-secondary hover:underline flex items-center gap-1"
                                                          >
                                                            <Download className="w-3 h-3" />
                                                            Ver arquivo
                                                          </a>
                                                          <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleUpdateDocumentItem(currentClientRef, doc._id, { fileUrl: undefined })}
                                                            className="h-6 w-6 p-0"
                                                          >
                                                            <X className="w-3 h-3" />
                                                          </Button>
                                                        </div>
                                                      ) : (
                                                        <Button
                                                          size="sm"
                                                          variant="outline"
                                                          className="h-7 text-xs"
                                                          onClick={() => {
                                                            // Simulate file upload - in production, implement actual file upload
                                                            const fakeUrl = `https://example.com/docs/${doc._id}.pdf`;
                                                            handleUpdateDocumentItem(currentClientRef, doc._id, { fileUrl: fakeUrl });
                                                          }}
                                                        >
                                                          <Upload className="w-3 h-3 mr-1" />
                                                          Upload
                                                        </Button>
                                                      )}
                                                    </div>

                                                    {/* Notes field */}
                                                    <div>
                                                      <Label className="text-xs text-foreground/70 font-semibold mb-1 block">
                                                        Observações:
                                                      </Label>
                                                      <Textarea
                                                        value={doc.notes || ''}
                                                        onChange={(e) => handleUpdateDocumentItem(currentClientRef, doc._id, { notes: e.target.value })}
                                                        placeholder="Adicione observações sobre este documento..."
                                                        rows={2}
                                                        className="text-xs resize-none"
                                                      />
                                                    </div>
                                                  </div>
                                                </div>
                                              </motion.div>
                                            ))}
                                          </div>

                                          {/* Info message */}
                                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                                            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-blue-800">
                                              <strong>Importante:</strong> Documentos ativos e não recebidos geram pendências automáticas. 
                                              Use o botão "Excluir item" para remover documentos não aplicáveis a este proponente.
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Vendedores Tab */}
                <TabsContent value="vendedores" className="space-y-6">
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
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-6">
                            {/* Vendor Selector */}
                            {vendors.length > 1 && (
                              <div>
                                <Label className="font-paragraph text-sm mb-2 block font-semibold">
                                  Selecione o vendedor
                                </Label>
                                <Select 
                                  value={selectedVendorId || vendors[0]?.clientRef} 
                                  onValueChange={setSelectedVendorId}
                                >
                                  <SelectTrigger className="h-12 bg-white border-2 border-border-gray">
                                    <SelectValue placeholder="Escolha um vendedor" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {vendors.map((vendor) => (
                                      <SelectItem key={vendor.clientRef} value={vendor.clientRef}>
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold">{vendor.name}</span>
                                          <span className="text-xs text-foreground/60">
                                            CPF: {vendor.cpf}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {/* Display selected vendor */}
                            {(() => {
                              const currentVendorClientRef = selectedVendorId || vendors[0]?.clientRef;
                              const vendor = vendors.find(v => v.clientRef === currentVendorClientRef);
                              const docs = vendorDocuments.get(currentVendorClientRef) || [];
                              const activeDocs = docs.filter(d => d.ativo);
                              
                              if (!vendor) return null;

                              return (
                                <div className="border-2 border-secondary/20 rounded-xl p-6 bg-gradient-to-br from-white to-light-gray/30">
                                  {/* Vendor Info Header */}
                                  <div className="mb-6 pb-5 border-b-2 border-border-gray">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <h4 className="font-heading text-xl font-bold text-secondary mb-2">
                                          {vendor.name}
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                          {vendor.cpf && (
                                            <div className="flex items-center gap-2">
                                              <span className="font-semibold text-foreground/70">CPF:</span>
                                              <span className="text-foreground">{vendor.cpf}</span>
                                            </div>
                                          )}
                                          {vendor.contato && (
                                            <div className="flex items-center gap-2">
                                              <span className="font-semibold text-foreground/70">Contato:</span>
                                              <span className="text-foreground">{vendor.contato}</span>
                                            </div>
                                          )}
                                          {vendor.email && (
                                            <div className="flex items-center gap-2">
                                              <span className="font-semibold text-foreground/70">E-mail:</span>
                                              <span className="text-foreground">{vendor.email}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleRemoveVendor(vendor._id)}
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Remover
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Dados do Vendedor Section */}
                                  <div className="mb-8">
                                    <h5 className="font-heading text-base font-bold mb-5 flex items-center gap-2 text-foreground">
                                      <UserCheck className="w-5 h-5 text-secondary" />
                                      Dados do Vendedor
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <Label className="font-paragraph text-sm mb-2 block">Nome *</Label>
                                        <Input
                                          value={vendor.name}
                                          disabled
                                          className="h-10 bg-light-gray/50"
                                        />
                                      </div>
                                      <div>
                                        <Label className="font-paragraph text-sm mb-2 block">CPF *</Label>
                                        <Input
                                          value={vendor.cpf}
                                          disabled
                                          className="h-10 bg-light-gray/50"
                                        />
                                      </div>
                                      <div>
                                        <Label className="font-paragraph text-sm mb-2 block">Contato (Telefone/WhatsApp) *</Label>
                                        <Input
                                          value={vendor.contato || ''}
                                          onChange={(e) => handleUpdateVendorBankData(vendor.clientRef, 'contato', e.target.value)}
                                          placeholder="(00) 00000-0000"
                                          className="h-10"
                                        />
                                      </div>
                                      <div>
                                        <Label className="font-paragraph text-sm mb-2 block">E-mail *</Label>
                                        <Input
                                          value={vendor.email || ''}
                                          onChange={(e) => handleUpdateVendorBankData(vendor.clientRef, 'email', e.target.value)}
                                          placeholder="email@exemplo.com"
                                          className="h-10"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Bank Data Section */}
                                  <div className="mb-8">
                                    <h5 className="font-heading text-base font-bold mb-5 flex items-center gap-2 text-foreground">
                                      <Building2 className="w-5 h-5 text-secondary" />
                                      Dados Bancários
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <Label className="font-paragraph text-sm mb-2 block">Banco *</Label>
                                        <Input
                                          value={vendor.banco || ''}
                                          onChange={(e) => handleUpdateVendorBankData(vendor.clientRef, 'banco', e.target.value)}
                                          placeholder="Ex: Banco do Brasil"
                                          className="h-10"
                                        />
                                      </div>
                                      <div>
                                        <Label className="font-paragraph text-sm mb-2 block">Agência *</Label>
                                        <Input
                                          value={vendor.agencia || ''}
                                          onChange={(e) => handleUpdateVendorBankData(vendor.clientRef, 'agencia', e.target.value)}
                                          placeholder="Ex: 1234-5"
                                          className="h-10"
                                        />
                                      </div>
                                      <div>
                                        <Label className="font-paragraph text-sm mb-2 block">Conta *</Label>
                                        <Input
                                          value={vendor.conta || ''}
                                          onChange={(e) => handleUpdateVendorBankData(vendor.clientRef, 'conta', e.target.value)}
                                          placeholder="Ex: 12345-6"
                                          className="h-10"
                                        />
                                      </div>
                                      <div>
                                        <Label className="font-paragraph text-sm mb-2 block">Tipo de Conta *</Label>
                                        <Select 
                                          value={vendor.tipoConta || 'Corrente'} 
                                          onValueChange={(value) => handleUpdateVendorBankData(vendor.clientRef, 'tipoConta', value)}
                                        >
                                          <SelectTrigger className="h-10">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Corrente">Corrente</SelectItem>
                                            <SelectItem value="Poupança">Poupança</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="md:col-span-2">
                                        <Label className="font-paragraph text-sm mb-2 block">Chave Pix (se houver)</Label>
                                        <Input
                                          value={vendor.chavePix || ''}
                                          onChange={(e) => handleUpdateVendorBankData(vendor.clientRef, 'chavePix', e.target.value)}
                                          placeholder="CPF, e-mail, telefone ou chave aleatória"
                                          className="h-10"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Document Checklist Section */}
                                  <div className="mt-8 pt-8 border-t-2 border-border-gray">
                                    <h5 className="font-heading text-base font-bold mb-5 flex items-center gap-2 text-foreground">
                                      <FileCheck className="w-5 h-5 text-secondary" />
                                      Checklist de Documentos do Vendedor
                                    </h5>
                                    
                                    <div className="space-y-4">
                                      {/* Progress indicator */}
                                      <div className="bg-gradient-to-r from-secondary/10 to-secondary/5 p-4 rounded-lg border border-secondary/20">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="font-paragraph text-sm font-semibold text-foreground">
                                            Progresso dos Documentos
                                          </span>
                                          <Badge className="bg-secondary text-secondary-foreground">
                                            {activeDocs.filter(d => d.recebido).length} de {activeDocs.length} recebidos
                                          </Badge>
                                        </div>
                                        <div className="w-full bg-white rounded-full h-3 overflow-hidden border border-border-gray">
                                          <div 
                                            className="bg-secondary h-full transition-all duration-500 ease-out"
                                            style={{ width: `${activeDocs.length > 0 ? (activeDocs.filter(d => d.recebido).length / activeDocs.length) * 100 : 0}%` }}
                                          />
                                        </div>
                                      </div>

                                      {/* Document items */}
                                      <div className="space-y-3">
                                        {activeDocs.map((doc) => {
                                          const docNames: Record<string, string> = {
                                            'IDENTIFICACAO': 'Documento de Identificação (RG, CPF ou CNH)',
                                            'CERTIDAO': 'Certidão de Casamento ou Nascimento',
                                            'ENDERECO': 'Comprovante de Endereço'
                                          };
                                          
                                          return (
                                            <motion.div
                                              key={doc._id}
                                              initial={{ opacity: 0, y: 10 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              className={`p-4 rounded-lg border-2 transition-all ${
                                                doc.recebido 
                                                  ? 'bg-green-50 border-green-300' 
                                                  : 'bg-white border-border-gray hover:border-secondary/40'
                                              }`}
                                            >
                                              <div className="space-y-3">
                                                {/* Document header */}
                                                <div className="flex items-start justify-between gap-3">
                                                  <div className="flex items-start gap-3 flex-1">
                                                    <Checkbox
                                                      checked={doc.recebido}
                                                      onCheckedChange={(checked) => 
                                                        handleUpdateVendorDocument(vendor.clientRef, doc._id, { 
                                                          recebido: checked as boolean
                                                        })
                                                      }
                                                      className="mt-1"
                                                    />
                                                    <div className="flex-1">
                                                      <Label className={`font-paragraph text-sm font-semibold block mb-1 cursor-pointer ${
                                                        doc.recebido ? 'text-green-700' : 'text-foreground'
                                                      }`}>
                                                        {docNames[doc.docTipo] || doc.docTipo}
                                                      </Label>
                                                      {doc.recebido && (
                                                        <p className="text-xs text-green-600 flex items-center gap-1">
                                                          <CheckCircle className="w-3 h-3" />
                                                          Documento recebido
                                                        </p>
                                                      )}
                                                    </div>
                                                  </div>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDeleteVendorDocument(vendor.clientRef, doc._id)}
                                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    title="Excluir item (não aplicável)"
                                                  >
                                                    <Trash2 className="w-4 h-4" />
                                                  </Button>
                                                </div>

                                                {/* File upload section */}
                                                <div className="ml-8 space-y-2">
                                                  <div className="flex items-center gap-2">
                                                    <Label className="text-xs text-foreground/70 font-semibold">
                                                      Arquivo:
                                                    </Label>
                                                    {doc.arquivo ? (
                                                      <div className="flex items-center gap-2">
                                                        <a 
                                                          href={doc.arquivo} 
                                                          target="_blank" 
                                                          rel="noopener noreferrer"
                                                          className="text-xs text-secondary hover:underline flex items-center gap-1"
                                                        >
                                                          <Download className="w-3 h-3" />
                                                          Ver arquivo
                                                        </a>
                                                        <Button
                                                          size="sm"
                                                          variant="ghost"
                                                          onClick={() => handleUpdateVendorDocument(vendor.clientRef, doc._id, { arquivo: undefined })}
                                                          className="h-6 w-6 p-0"
                                                        >
                                                          <X className="w-3 h-3" />
                                                        </Button>
                                                      </div>
                                                    ) : (
                                                      <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs"
                                                        onClick={() => {
                                                          // Simulate file upload - in production, implement actual file upload
                                                          const fakeUrl = `https://example.com/vendor-docs/${doc._id}.pdf`;
                                                          handleUpdateVendorDocument(vendor.clientRef, doc._id, { arquivo: fakeUrl });
                                                        }}
                                                      >
                                                        <Upload className="w-3 h-3 mr-1" />
                                                        Upload
                                                      </Button>
                                                    )}
                                                  </div>

                                                  {/* Notes field */}
                                                  <div>
                                                    <Label className="text-xs text-foreground/70 font-semibold mb-1 block">
                                                      Observações:
                                                    </Label>
                                                    <Textarea
                                                      value={doc.observacoes || ''}
                                                      onChange={(e) => handleUpdateVendorDocument(vendor.clientRef, doc._id, { observacoes: e.target.value })}
                                                      placeholder="Adicione observações sobre este documento..."
                                                      rows={2}
                                                      className="text-xs resize-none"
                                                    />
                                                  </div>
                                                </div>
                                              </div>
                                            </motion.div>
                                          );
                                        })}
                                      </div>

                                      {/* Info message */}
                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                                        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-blue-800">
                                          <strong>Importante:</strong> Marque os documentos como recebidos conforme forem entregues pelo vendedor. 
                                          Use o botão "Excluir item" para remover documentos não aplicáveis.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })()}

                      {/* Add Vendor Section */}
                      <div className="mt-6 pt-6 border-t-2 border-border-gray">
                        <h4 className="font-heading text-base font-bold mb-4 flex items-center gap-2">
                          <Plus className="w-5 h-5 text-secondary" />
                          Adicionar Novo Vendedor
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <Label className="font-paragraph text-sm mb-2 block">Selecionar Cliente *</Label>
                            <Select value={newVendor.clientRef} onValueChange={(value) => setNewVendor({ ...newVendor, clientRef: value })}>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Escolha um cliente da lista" />
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
                          <div className="md:col-span-2">
                            <Button 
                              onClick={handleAddVendor} 
                              disabled={!newVendor.clientRef}
                              className="h-10 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Adicionar Vendedor
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Pendências + Tarefas Tab */}
                <TabsContent value="pendencias" className="space-y-6">
                  {/* Debug Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-blue-800 font-mono">
                      <strong>DEBUG:</strong> atendimentoId = {selectedCase?._id || 'undefined'}
                    </p>
                    <p className="text-xs text-blue-800 font-mono mt-1">
                      <strong>DEBUG:</strong> Total Pendências = {pendings.filter(p => p.atendimentoRef === selectedCase?._id).length}
                    </p>
                    <p className="text-xs text-blue-800 font-mono mt-1">
                      <strong>DEBUG:</strong> Total Tarefas = {tasks.filter(t => t.atendimentoRef === selectedCase?._id).length}
                    </p>
                  </div>

                  {/* Pendências Section */}
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-heading flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-secondary" />
                          Pendências
                          <Badge className="ml-2 bg-orange-500 text-white">
                            {pendings.filter(p => p.atendimentoRef === selectedCase?._id && p.status !== 'Resolvida').length} abertas
                          </Badge>
                        </CardTitle>
                        <Button 
                          onClick={() => {
                            console.log('[DEBUG] Opening new pending form for case:', selectedCase?._id);
                            setShowPendingForm(true);
                            setEditingPending(null);
                            setNewPendingData({
                              description: '',
                              responsiblePartyType: 'Interno',
                              averageDaysToComplete: 7
                            });
                          }} 
                          className="h-9 bg-secondary text-secondary-foreground"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Nova Pendência
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                              disabled={!newPendingData.description}
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
                            .filter(p => p.atendimentoRef === selectedCase?._id)
                            .sort((a, b) => {
                              // Sort by dueDate (earliest first)
                              if (!a.dueDate && !b.dueDate) return 0;
                              if (!a.dueDate) return 1;
                              if (!b.dueDate) return -1;
                              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                            });

                          console.log('[DEBUG] Filtered pendings for case:', selectedCase?._id, 'Count:', casePendings.length);

                          if (casePendings.length === 0) {
                            return (
                              <div className="text-center py-8 text-foreground/60">
                                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Nenhuma pendência cadastrada</p>
                              </div>
                            );
                          }

                          return casePendings.map(pending => (
                            <div key={pending._id} className={`p-4 rounded-lg border-2 transition-all ${
                              pending.status === 'Resolvida' ? 'bg-green-50 border-green-200' : 'bg-white border-border-gray shadow-sm'
                            }`}>
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="font-paragraph font-bold text-sm mb-1">{pending.title}</h4>
                                  {pending.description && (
                                    <p className="text-xs text-foreground/70 mb-2">{pending.description}</p>
                                  )}
                                  <div className="flex flex-wrap gap-1.5">
                                    <Badge variant={pending.status === 'Resolvida' ? 'default' : 'secondary'} className="text-xs">
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
                                        🚫 Bloqueia fase
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      {pending.responsiblePartyType}
                                    </Badge>
                                  </div>
                                  {pending.dueDate && (
                                    <div className="flex items-center gap-1 mt-2 text-xs text-foreground/60">
                                      <Calendar className="w-3 h-3" />
                                      <span>Prazo: {new Date(pending.dueDate).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-1 ml-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      console.log('[DEBUG] Updating pending status:', pending._id);
                                      handleUpdatePendingStatus(pending._id, pending.status === 'Resolvida' ? 'Aberta' : 'Resolvida');
                                    }}
                                    className="h-8"
                                  >
                                    {pending.status === 'Resolvida' ? (
                                      <><RotateCcw className="w-3 h-3 mr-1" /> Reabrir</>
                                    ) : (
                                      <><CheckSquare className="w-3 h-3 mr-1" /> Concluir</>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      console.log('[DEBUG] Editing pending:', pending._id);
                                      handleEditPending(pending);
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      console.log('[DEBUG] Deleting pending:', pending._id);
                                      handleDeletePending(pending._id);
                                    }}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tarefas Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-heading flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-secondary" />
                        Tarefas Automáticas
                        <Badge className="ml-2 bg-blue-500 text-white">
                          {tasks.filter(t => t.atendimentoRef === selectedCase?._id && t.status !== 'Concluída').length} abertas
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(() => {
                        const caseTasks = tasks
                          .filter(t => t.atendimentoRef === selectedCase?._id)
                          .sort((a, b) => {
                            // Sort by dueDate (earliest first)
                            if (!a.dueDate && !b.dueDate) return 0;
                            if (!a.dueDate) return 1;
                            if (!b.dueDate) return -1;
                            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                          });

                        console.log('[DEBUG] Filtered tasks for case:', selectedCase?._id, 'Count:', caseTasks.length);

                        if (caseTasks.length === 0) {
                          return (
                            <div className="text-center py-8 text-foreground/60">
                              <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-30" />
                              <p className="text-sm">Nenhuma tarefa gerada</p>
                            </div>
                          );
                        }

                        return caseTasks.map(task => (
                          <div key={task._id} className={`p-4 rounded-lg border-2 ${
                            task.status === 'Concluída' ? 'bg-green-50 border-green-200' : 'bg-white border-border-gray'
                          }`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-paragraph font-semibold text-sm mb-2">{task.description || task.titulo}</h4>
                                <div className="flex gap-2">
                                  <Badge variant={task.status === 'Concluída' ? 'default' : 'secondary'} className="text-xs">
                                    {task.status}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">{task.responsibleType}</Badge>
                                  {task.dueDate && (
                                    <Badge variant="outline" className="text-xs">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  console.log('[DEBUG] Updating task status:', task._id);
                                  handleUpdateTaskStatus(task._id, task.status === 'Concluída' ? 'Pendente' : 'Concluída');
                                }}
                                className="h-8"
                              >
                                {task.status === 'Concluída' ? (
                                  <><RotateCcw className="w-3 h-3 mr-1" /> Reabrir</>
                                ) : (
                                  <><CheckSquare className="w-3 h-3 mr-1" /> Concluir</>
                                )}
                              </Button>
                            </div>
                          </div>
                        ));
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Documentos Tab */}
                <TabsContent value="docs" className="space-y-6">
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
                </TabsContent>

                {/* Histórico Tab */}
                <TabsContent value="historico" className="space-y-4">
                  <h3 className="font-heading text-lg">Linha do Tempo</h3>
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
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
