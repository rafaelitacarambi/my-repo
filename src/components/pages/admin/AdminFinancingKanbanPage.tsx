import { useEffect, useState } from 'react';
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
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BaseCrudService } from '@/integrations';
import { ServiceRecords, UsuriosdoSistema, PendnciasdoFinanciamento, FinancingTasks, ServiceParties, Clients, DocumentosdoFinanciamento, HistricodeInteraes, Imveis, AtendimentoImveis } from '@/entities';

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

interface VendorChecklist {
  _id?: string;
  atendimentoRef: string;
  vendorName: string;
  cpf: string;
  bankData?: string;
  documentUploaded?: boolean;
  documentStatus?: string;
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

export default function AdminFinancingKanbanPage() {
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
  const [vendorChecklists, setVendorChecklists] = useState<VendorChecklist[]>([]);
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
    title: '',
    description: '',
    priority: 'Média',
    dueDate: '',
    responsiblePartyType: 'Interno',
    responsiblePartyDetails: '',
    categoria: '',
    bloqueiaFase: false
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
    vendorName: '',
    cpf: '',
    bankData: ''
  });

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
          email: atendimento.contactEmail || '',
          phoneNumber: atendimento.contactPhone || '',
          responsibleInternalId: atendimento.responsavelInternoId || '',
          responsibleExternal: atendimento.responsavelExterno || '',
          notes: atendimento.notes || ''
        });
      }

      // Load participants
      const { items: participantsList } = await BaseCrudService.getAll<ServiceParties>('atendimentopartes');
      setParticipants(participantsList.filter(p => p.serviceRecordRef === caseId));

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

    } catch (error) {
      console.error('Error loading case details:', error);
    }
  };

  // Open details modal
  const handleOpenDetails = async (caseItem: FinancingCase) => {
    setSelectedCase(caseItem);
    await loadCaseDetails(caseItem._id);
    setShowDetailsModal(true);
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

  // Create or update pending
  const handleSavePending = async () => {
    if (!selectedCase || !newPendingData.title) return;

    try {
      if (editingPending) {
        // Update existing pending
        await BaseCrudService.update<PendnciasdoFinanciamento>('pendenciasfinanciamento', {
          _id: editingPending._id,
          title: newPendingData.title,
          description: newPendingData.description,
          priority: newPendingData.priority,
          dueDate: newPendingData.dueDate,
          responsiblePartyType: newPendingData.responsiblePartyType,
          responsiblePartyDetails: newPendingData.responsiblePartyDetails,
          bloqueiaFase: newPendingData.bloqueiaFase,
          categoria: newPendingData.categoria
        });

        setPendings(pendings.map(p => p._id === editingPending._id ? { ...p, ...newPendingData } : p));
        setEditingPending(null);
      } else {
        // Create new pending
        const newPending: PendnciasdoFinanciamento = {
          _id: crypto.randomUUID(),
          atendimentoRef: selectedCase._id,
          title: newPendingData.title,
          description: newPendingData.description,
          status: 'Aberta',
          priority: newPendingData.priority,
          dueDate: newPendingData.dueDate,
          responsiblePartyType: newPendingData.responsiblePartyType,
          responsiblePartyDetails: newPendingData.responsiblePartyDetails,
          taskAutomaticallyCreated: true,
          creationDate: new Date().toISOString(),
          bloqueiaFase: newPendingData.bloqueiaFase,
          categoria: newPendingData.categoria
        };

        await BaseCrudService.create('pendenciasfinanciamento', newPending);

        // Create associated task automatically
        const newTask: FinancingTasks = {
          _id: crypto.randomUUID(),
          description: `Tarefa: ${newPendingData.title}`,
          atendimentoRef: selectedCase._id,
          pendenciaRef: newPending._id,
          responsibleType: newPendingData.responsiblePartyType,
          externalResponsibleName: newPendingData.responsiblePartyDetails,
          dueDate: newPendingData.dueDate,
          status: 'Pendente',
          creationDate: new Date().toISOString()
        };

        await BaseCrudService.create('tarefasfinanciamento', newTask);

        setPendings([...pendings, newPending as Pending]);
        setTasks([...tasks, newTask as Task]);
      }
      
      setNewPendingData({
        title: '',
        description: '',
        priority: 'Média',
        dueDate: '',
        responsiblePartyType: 'Interno',
        responsiblePartyDetails: '',
        categoria: '',
        bloqueiaFase: false
      });
      setShowPendingForm(false);

      await loadData();
    } catch (error) {
      console.error('Error saving pending:', error);
    }
  };

  // Edit pending
  const handleEditPending = (pending: Pending) => {
    setEditingPending(pending);
    setNewPendingData({
      title: pending.title,
      description: pending.description,
      priority: pending.priority,
      dueDate: pending.dueDate,
      responsiblePartyType: pending.responsiblePartyType,
      responsiblePartyDetails: pending.responsiblePartyDetails || '',
      categoria: pending.categoria || '',
      bloqueiaFase: pending.bloqueiaFase || false
    });
    setShowPendingForm(true);
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

    const existing = proponentChecklists.get(clientRef);
    const updated = {
      ...existing,
      _id: existing?._id || crypto.randomUUID(),
      atendimentoRef: selectedCase._id,
      clientRef,
      [field]: value
    } as ProponentChecklist;

    setProponentChecklists(new Map(proponentChecklists.set(clientRef, updated)));
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
                              onClick={() => handleOpenDetails(caseItem)}
                              className="bg-white rounded-xl p-4 border border-border-gray hover:shadow-xl transition-all cursor-pointer group relative"
                            >
                              {/* Activity indicator */}
                              <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${hasActivityToday ? 'bg-green-500' : 'bg-red-500'}`} 
                                   title={hasActivityToday ? 'Atividade hoje' : 'Sem atividade hoje'}>
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
                  <TabsTrigger value="pendencias" className="text-xs">
                    <ClipboardList className="w-4 h-4 mr-1" />
                    Pendências + Tarefas
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

                  {/* Participantes */}
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
                  <div className="border border-border-gray rounded-lg p-4">
                    <h3 className="font-heading text-lg mb-4">Checklist Individual por Proponente</h3>
                    {participants.length === 0 ? (
                      <p className="text-center text-foreground/60 py-8">Adicione participantes na aba "Dados do Processo"</p>
                    ) : (
                      participants.map(participant => {
                        const client = clients.find(c => c._id === participant.clientRef);
                        const checklist = proponentChecklists.get(participant.clientRef);
                        
                        return (
                          <div key={participant._id} className="mb-6 p-4 bg-light-gray rounded-lg">
                            <h4 className="font-heading text-base font-semibold mb-3">
                              {client?.clientName || client?.nomeRazaoSocial}
                            </h4>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={checklist?.hasFgtsContribution || false}
                                  onCheckedChange={(checked) => handleUpdateProponentChecklist(participant.clientRef, 'hasFgtsContribution', checked as boolean)}
                                />
                                <Label className="font-paragraph text-sm cursor-pointer">
                                  Possui 3 anos de contribuição FGTS?
                                </Label>
                              </div>
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={checklist?.hasDependent || false}
                                  onCheckedChange={(checked) => handleUpdateProponentChecklist(participant.clientRef, 'hasDependent', checked as boolean)}
                                />
                                <Label className="font-paragraph text-sm cursor-pointer">
                                  Possui dependente?
                                </Label>
                              </div>
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={checklist?.declaresIncomeTax || false}
                                  onCheckedChange={(checked) => handleUpdateProponentChecklist(participant.clientRef, 'declaresIncomeTax', checked as boolean)}
                                />
                                <Label className="font-paragraph text-sm cursor-pointer">
                                  Declara imposto de renda?
                                </Label>
                              </div>
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={checklist?.ownsProperty || false}
                                  onCheckedChange={(checked) => handleUpdateProponentChecklist(participant.clientRef, 'ownsProperty', checked as boolean)}
                                />
                                <Label className="font-paragraph text-sm cursor-pointer">
                                  Possui imóvel?
                                </Label>
                              </div>
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={checklist?.hasActiveFinancing || false}
                                  onCheckedChange={(checked) => handleUpdateProponentChecklist(participant.clientRef, 'hasActiveFinancing', checked as boolean)}
                                />
                                <Label className="font-paragraph text-sm cursor-pointer">
                                  Possui financiamento ativo?
                                </Label>
                              </div>
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={checklist?.isFirstAcquisition || false}
                                  onCheckedChange={(checked) => handleUpdateProponentChecklist(participant.clientRef, 'isFirstAcquisition', checked as boolean)}
                                />
                                <Label className="font-paragraph text-sm cursor-pointer">
                                  Primeira aquisição no âmbito SFH?
                                </Label>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </TabsContent>

                {/* Vendedores Tab */}
                <TabsContent value="vendedores" className="space-y-6">
                  <div className="border border-border-gray rounded-lg p-4">
                    <h3 className="font-heading text-lg mb-4">Vendedores do Imóvel</h3>
                    
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <Input
                        value={newVendor.vendorName}
                        onChange={(e) => setNewVendor({ ...newVendor, vendorName: e.target.value })}
                        placeholder="Nome do vendedor"
                        className="h-10"
                      />
                      <Input
                        value={newVendor.cpf}
                        onChange={(e) => setNewVendor({ ...newVendor, cpf: e.target.value })}
                        placeholder="CPF"
                        className="h-10"
                      />
                      <Input
                        value={newVendor.bankData}
                        onChange={(e) => setNewVendor({ ...newVendor, bankData: e.target.value })}
                        placeholder="Dados bancários"
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      {vendorChecklists.map(vendor => (
                        <div key={vendor._id} className="p-4 bg-light-gray rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-paragraph font-semibold">{vendor.vendorName}</p>
                              <p className="text-xs text-foreground/60">CPF: {vendor.cpf}</p>
                              <p className="text-xs text-foreground/60">{vendor.bankData}</p>
                            </div>
                            <Badge variant={vendor.documentStatus === 'Aprovado' ? 'default' : 'secondary'}>
                              {vendor.documentStatus || 'Pendente'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <Checkbox checked={vendor.documentUploaded || false} />
                            <Label className="text-sm">Documento enviado</Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Pendências + Tarefas Tab */}
                <TabsContent value="pendencias" className="space-y-6">
                  {/* Pendências Section */}
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-heading flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-secondary" />
                          Pendências (Totalmente Editável)
                        </CardTitle>
                        <Button 
                          onClick={() => {
                            setShowPendingForm(true);
                            setEditingPending(null);
                            setNewPendingData({
                              title: '',
                              description: '',
                              priority: 'Média',
                              dueDate: '',
                              responsiblePartyType: 'Interno',
                              responsiblePartyDetails: '',
                              categoria: '',
                              bloqueiaFase: false
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
                        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-3">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-heading text-sm font-bold">
                              {editingPending ? 'Editar Pendência' : 'Nova Pendência'}
                            </h4>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setShowPendingForm(false);
                                setEditingPending(null);
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                              <Label className="text-xs mb-1 block">Título *</Label>
                              <Input
                                value={newPendingData.title}
                                onChange={(e) => setNewPendingData({ ...newPendingData, title: e.target.value })}
                                placeholder="Ex: Aguardando documento do cliente"
                                className="h-9"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs mb-1 block">Descrição</Label>
                              <Textarea
                                value={newPendingData.description}
                                onChange={(e) => setNewPendingData({ ...newPendingData, description: e.target.value })}
                                placeholder="Detalhes da pendência..."
                                rows={2}
                                className="resize-none text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs mb-1 block">Categoria</Label>
                              <Select value={newPendingData.categoria} onValueChange={(value) => setNewPendingData({ ...newPendingData, categoria: value })}>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Documento">📄 Documento</SelectItem>
                                  <SelectItem value="Caixa">🏦 Caixa</SelectItem>
                                  <SelectItem value="Cartório">🏛 Cartório</SelectItem>
                                  <SelectItem value="Cliente">👤 Cliente</SelectItem>
                                  <SelectItem value="Engenharia">🏗 Engenharia</SelectItem>
                                  <SelectItem value="Formulários">📑 Formulários</SelectItem>
                                  <SelectItem value="Restrição">🔍 Restrição</SelectItem>
                                  <SelectItem value="FGTS">💰 FGTS</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs mb-1 block">Prioridade</Label>
                              <Select value={newPendingData.priority} onValueChange={(value) => setNewPendingData({ ...newPendingData, priority: value })}>
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {PRIORITY_LEVELS.map(p => (
                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs mb-1 block">Responsável</Label>
                              <Select value={newPendingData.responsiblePartyType} onValueChange={(value) => setNewPendingData({ ...newPendingData, responsiblePartyType: value })}>
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {RESPONSIBLE_TYPES.map(r => (
                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs mb-1 block">Prazo</Label>
                              <Input
                                type="date"
                                value={newPendingData.dueDate}
                                onChange={(e) => setNewPendingData({ ...newPendingData, dueDate: e.target.value })}
                                className="h-9"
                              />
                            </div>
                            <div className="col-span-2">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={newPendingData.bloqueiaFase}
                                  onCheckedChange={(checked) => setNewPendingData({ ...newPendingData, bloqueiaFase: checked as boolean })}
                                />
                                <Label className="text-xs cursor-pointer">Bloqueia mudança de fase</Label>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 pt-2">
                            <Button onClick={handleSavePending} className="h-9 bg-secondary text-secondary-foreground">
                              <Save className="w-4 h-4 mr-2" />
                              {editingPending ? 'Salvar Alterações' : 'Criar Pendência'}
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setShowPendingForm(false);
                                setEditingPending(null);
                              }}
                              className="h-9"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Pending List */}
                      <div className="space-y-3">
                        {pendings.filter(p => p.atendimentoRef === selectedCase?._id).length === 0 ? (
                          <div className="text-center py-8 text-foreground/60">
                            <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Nenhuma pendência cadastrada</p>
                          </div>
                        ) : (
                          pendings.filter(p => p.atendimentoRef === selectedCase?._id).map(pending => (
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
                                    onClick={() => handleUpdatePendingStatus(pending._id, pending.status === 'Resolvida' ? 'Aberta' : 'Resolvida')}
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
                                    onClick={() => handleEditPending(pending)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit2 className="w-3 h-3" />
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
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tarefas Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-heading flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-secondary" />
                        Tarefas Automáticas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {tasks.filter(t => t.atendimentoRef === selectedCase?._id).length === 0 ? (
                        <div className="text-center py-8 text-foreground/60">
                          <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Nenhuma tarefa gerada</p>
                        </div>
                      ) : (
                        tasks.filter(t => t.atendimentoRef === selectedCase?._id).map(task => (
                          <div key={task._id} className={`p-4 rounded-lg border-2 ${
                            task.status === 'Concluída' ? 'bg-green-50 border-green-200' : 'bg-white border-border-gray'
                          }`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-paragraph font-semibold text-sm mb-2">{task.description}</h4>
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
                                onClick={() => handleUpdateTaskStatus(task._id, task.status === 'Concluída' ? 'Pendente' : 'Concluída')}
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
                        ))
                      )}
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
