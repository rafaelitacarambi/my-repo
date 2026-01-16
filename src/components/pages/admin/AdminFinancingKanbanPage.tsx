import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  ChevronDown,
  X,
  Edit2,
  Trash2,
  Eye,
  ExternalLink,
  Save,
  FileText,
  History,
  Users,
  Home,
  ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BaseCrudService } from '@/integrations';
import { ServiceRecords, UsuriosdoSistema, PendnciasdoFinanciamento, FinancingTasks, ServiceParties, Clients, DocumentosdoFinanciamento, HistricodeInteraes, Imveis } from '@/entities';

// Types
interface FinancingPhase {
  id: string;
  name: string;
  color: string;
  subPhases: string[];
}

interface FinancingCase {
  _id: string;
  clientName: string;
  email: string;
  phoneNumber: string;
  currentPhase: string;
  currentSubPhase: string;
  responsibleInternalId?: string;
  responsibleExternal?: string;
  dueDate?: string;
  isOverdue?: boolean;
  createdDate: string;
  updatedDate: string;
  phaseEntryDate?: string;
  daysInCurrentPhase?: number;
  cpf?: string;
  useFgts?: boolean;
  fgtsValue?: number;
  propertyValue?: number;
  desiredFinancingValue?: number;
  approvedFinancingValue?: number;
  lastActivityDate?: string;
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
  _id: string;
  atendimentoRef: string;
  clientRef: string;
  hasFgtsContribution?: boolean;
  hasDependent?: boolean;
  declaresIncomeTax?: boolean;
  ownsProperty?: boolean;
  hasActiveFinancing?: boolean;
  isFirstAcquisition?: boolean;
}

interface FinancingDetailsData {
  proponentePrincipal: string;
  cpf: string;
  email: string;
  phoneNumber: string;
  propertyValue: number;
  desiredFinancingValue: number;
  approvedFinancingValue: number;
  useFgts: boolean;
  fgtsValue: number;
  responsibleInternalId: string;
  responsibleExternal: string;
  notes: string;
}

// Financing Phases Configuration
const FINANCING_PHASES: FinancingPhase[] = [
  {
    id: 'novos-clientes',
    name: 'NOVOS CLIENTES',
    color: 'bg-blue-100 border-blue-300',
    subPhases: ['Cadastro de cliente', 'Análise de documentos', 'Avaliação de risco', 'Consultar restrição', 'Aguardando o imóvel', 'Condicionado', 'Reprovados']
  },
  {
    id: 'engenharia',
    name: 'ENGENHARIA',
    color: 'bg-purple-100 border-purple-300',
    subPhases: ['Engenharia', 'Avaliação de laudo']
  },
  {
    id: 'fgts',
    name: 'FGTS',
    color: 'bg-green-100 border-green-300',
    subPhases: ['FGTS', 'Formulários CIOP']
  },
  {
    id: 'sistemas-caixa',
    name: 'SISTEMAS CAIXA',
    color: 'bg-yellow-100 border-yellow-300',
    subPhases: ['SIOPI', 'Solicitar reserva orçamentária', 'SICTD', 'Garantia']
  },
  {
    id: 'conformidade',
    name: 'CONFORMIDADE',
    color: 'bg-red-100 border-red-300',
    subPhases: ['Conformidade']
  },
  {
    id: 'agencia',
    name: 'AGÊNCIA',
    color: 'bg-indigo-100 border-indigo-300',
    subPhases: ['Entrevista', 'Assinatura da minuta']
  },
  {
    id: 'registro',
    name: 'REGISTRO',
    color: 'bg-pink-100 border-pink-300',
    subPhases: ['ITBI', 'Cartório (R Sales)', 'Cartório por conta do cliente']
  },
  {
    id: 'conclusao',
    name: 'CONCLUSÃO',
    color: 'bg-emerald-100 border-emerald-300',
    subPhases: ['Concluído']
  },
  {
    id: 'acompanhamento-obra',
    name: 'ACOMPANHAMENTO DE OBRA',
    color: 'bg-orange-100 border-orange-300',
    subPhases: ['Acompanhamento de obra']
  }
];

const RESPONSIBLE_TYPES = [
  'Interno',
  'Cliente',
  'Parceiro Externo',
  'Construtora',
  'Caixa',
  'Cartório',
  'Sistema/Prazo legal'
];

const PRIORITY_LEVELS = ['Alta', 'Média', 'Baixa'];
const PENDING_STATUS = ['Aberta', 'Em Andamento', 'Resolvida', 'Cancelada'];
const TASK_STATUS = ['Pendente', 'Em Progresso', 'Concluída', 'Atrasada'];

export default function AdminFinancingKanbanPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<FinancingCase[]>([]);
  const [pendings, setPendings] = useState<Pending[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UsuriosdoSistema[]>([]);
  const [clients, setClients] = useState<Clients[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('kanban');
  const [selectedCase, setSelectedCase] = useState<FinancingCase | null>(null);
  const [showNewCaseDialog, setShowNewCaseDialog] = useState(false);
  const [showNewPendingDialog, setShowNewPendingDialog] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [modalTab, setModalTab] = useState('dados');
  const [participants, setParticipants] = useState<ServiceParties[]>([]);
  const [documents, setDocuments] = useState<DocumentosdoFinanciamento[]>([]);
  const [history, setHistory] = useState<HistricodeInteraes[]>([]);
  const [properties, setProperties] = useState<Imveis[]>([]);
  const [proponentChecklist, setProponentChecklist] = useState<ProponentChecklist | null>(null);
  
  const [detailsData, setDetailsData] = useState<FinancingDetailsData>({
    proponentePrincipal: '',
    cpf: '',
    email: '',
    phoneNumber: '',
    propertyValue: 0,
    desiredFinancingValue: 0,
    approvedFinancingValue: 0,
    useFgts: false,
    fgtsValue: 0,
    responsibleInternalId: '',
    responsibleExternal: '',
    notes: ''
  });
  
  const [newCaseData, setNewCaseData] = useState({
    clientName: '',
    email: '',
    phoneNumber: '',
    currentPhase: 'novos-clientes',
    currentSubPhase: ''
  });
  const [newPendingData, setNewPendingData] = useState({
    title: '',
    description: '',
    priority: 'Média',
    dueDate: '',
    responsiblePartyType: 'Interno',
    responsiblePartyDetails: ''
  });
  const [newParticipant, setNewParticipant] = useState({
    clientRef: '',
    roleInService: 'Participante/Dependente',
    participationPercentage: 0
  });


  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load financing cases from atendimentos
        const { items: atendimentos } = await BaseCrudService.getAll<ServiceRecords>('atendimentos');
        const financingCases = atendimentos
          .filter(a => a.serviceType === 'Financiamento')
          .map(a => {
            const phaseEntryDate = a.dataPrevistaConclusao ? new Date(a.dataPrevistaConclusao).toISOString() : new Date(a._createdDate || new Date()).toISOString();
            const daysInPhase = Math.floor((new Date().getTime() - new Date(phaseEntryDate).getTime()) / (1000 * 60 * 60 * 24));
            
            return {
              _id: a._id,
              clientName: a.contactName || 'Sem nome',
              email: a.contactEmail || '',
              phoneNumber: a.contactPhone || '',
              currentPhase: a.faseFinanciamento || 'novos-clientes',
              currentSubPhase: a.status || 'Cadastro de cliente',
              responsibleInternalId: a.responsavelInternoId,
              responsibleExternal: a.responsavelExterno,
              dueDate: a.dataPrevistaConclusao?.toString(),
              isOverdue: false,
              createdDate: a._createdDate?.toString() || new Date().toISOString(),
              updatedDate: a._updatedDate?.toString() || new Date().toISOString(),
              phaseEntryDate,
              daysInCurrentPhase: daysInPhase,
              cpf: '',
              useFgts: false,
              fgtsValue: 0,
              propertyValue: 0,
              desiredFinancingValue: 0,
              approvedFinancingValue: 0,
              lastActivityDate: a._updatedDate?.toString()
            };
          });
        setCases(financingCases);

        // Load users
        const { items: usersList } = await BaseCrudService.getAll<UsuriosdoSistema>('usuariossistema');
        setUsers(usersList);

        // Load clients
        const { items: clientsList } = await BaseCrudService.getAll<Clients>('clientes');
        setClients(clientsList);

        // Load pendings
        const { items: pendingsList } = await BaseCrudService.getAll('pendenciasfinanciamento');
        setPendings(pendingsList as Pending[]);

        // Load tasks
        const { items: tasksList } = await BaseCrudService.getAll('tarefasfinanciamento');
        setTasks(tasksList as Task[]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Load case details for modal
  const loadCaseDetails = async (caseId: string) => {
    try {
      const atendimento = await BaseCrudService.getById<ServiceRecords>('atendimentos', caseId);
      if (!atendimento) return;

      setDetailsData({
        proponentePrincipal: atendimento.contactName || '',
        cpf: '',
        email: atendimento.contactEmail || '',
        phoneNumber: atendimento.contactPhone || '',
        propertyValue: 0,
        desiredFinancingValue: 0,
        approvedFinancingValue: 0,
        useFgts: false,
        fgtsValue: 0,
        responsibleInternalId: atendimento.responsavelInternoId || '',
        responsibleExternal: atendimento.responsavelExterno || '',
        notes: atendimento.notes || ''
      });

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
        contactName: detailsData.proponentePrincipal,
        contactEmail: detailsData.email,
        contactPhone: detailsData.phoneNumber,
        responsavelInternoId: detailsData.responsibleInternalId,
        responsavelExterno: detailsData.responsibleExternal,
        notes: detailsData.notes
      });

      // Update local state
      setCases(cases.map(c => c._id === selectedCase._id ? {
        ...c,
        clientName: detailsData.proponentePrincipal,
        email: detailsData.email,
        phoneNumber: detailsData.phoneNumber,
        useFgts: detailsData.useFgts,
        fgtsValue: detailsData.fgtsValue,
        propertyValue: detailsData.propertyValue,
        desiredFinancingValue: detailsData.desiredFinancingValue,
        approvedFinancingValue: detailsData.approvedFinancingValue
      } : c));

      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error saving details:', error);
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

  // Update checklist
  const handleUpdateChecklist = async (field: keyof ProponentChecklist, value: boolean) => {
    if (!selectedCase) return;

    const updatedChecklist = {
      ...proponentChecklist,
      [field]: value
    };
    setProponentChecklist(updatedChecklist as ProponentChecklist);
  };

  // Create new financing case
  const handleCreateCase = async () => {
    if (!newCaseData.clientName || !newCaseData.email) return;

    try {
      const newCase: ServiceRecords = {
        _id: crypto.randomUUID(),
        contactName: newCaseData.clientName,
        contactEmail: newCaseData.email,
        contactPhone: newCaseData.phoneNumber,
        serviceType: 'Financiamento',
        status: 'Novo',
        creationDate: new Date().toISOString()
      };

      await BaseCrudService.create('atendimentos', newCase);
      
      const financingCase: FinancingCase = {
        _id: newCase._id,
        clientName: newCase.contactName || '',
        email: newCase.contactEmail || '',
        phoneNumber: newCase.contactPhone || '',
        currentPhase: newCaseData.currentPhase,
        currentSubPhase: newCaseData.currentSubPhase || FINANCING_PHASES[0].subPhases[0],
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        cpf: '',
        useFgts: false,
        fgtsValue: 0,
        propertyValue: 0,
        desiredFinancingValue: 0,
        approvedFinancingValue: 0
      };

      setCases([...cases, financingCase]);
      setNewCaseData({
        clientName: '',
        email: '',
        phoneNumber: '',
        currentPhase: 'novos-clientes',
        currentSubPhase: ''
      });
      setShowNewCaseDialog(false);
    } catch (error) {
      console.error('Error creating case:', error);
    }
  };

  // Create new pending
  const handleCreatePending = async () => {
    if (!selectedCase || !newPendingData.title) return;

    try {
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
        taskAutomaticallyCreated: false,
        creationDate: new Date().toISOString(),
        bloqueiaFase: false
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
      setNewPendingData({
        title: '',
        description: '',
        priority: 'Média',
        dueDate: '',
        responsiblePartyType: 'Interno',
        responsiblePartyDetails: ''
      });
      setShowNewPendingDialog(false);
    } catch (error) {
      console.error('Error creating pending:', error);
    }
  };

  // Get cases by phase
  const getCasesByPhase = (phaseId: string) => {
    return cases.filter(c => c.currentPhase === phaseId);
  };

  // Get overdue pendings and tasks
  const getOverdueItems = () => {
    const now = new Date();
    const overduePendings = pendings.filter(p => {
      const dueDate = new Date(p.dueDate);
      return dueDate < now && p.status !== 'Resolvida';
    });
    const overdueTasks = tasks.filter(t => {
      const dueDate = new Date(t.dueDate);
      return dueDate < now && t.status !== 'Concluída';
    });
    return { overduePendings, overdueTasks };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary">
        <Header />
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-20">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-primary-foreground/5 rounded-2xl"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const { overduePendings, overdueTasks } = getOverdueItems();

  return (
    <div className="min-h-screen bg-primary">
      <Header />

      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-secondary/10 to-secondary/5 py-12">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-heading text-5xl lg:text-6xl text-secondary mb-4">
              Kanban de Financiamento
            </h1>
            <p className="font-paragraph text-lg text-primary-foreground/80">
              Gerencie o fluxo de financiamentos através das 9 fases do processo
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tabs */}
      <section className="w-full py-8 border-b border-border-gray">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-primary-foreground/10">
              <TabsTrigger value="kanban" className="font-paragraph">
                Kanban Visual
              </TabsTrigger>
              <TabsTrigger value="pendings" className="font-paragraph">
                Pendências + Tarefas ({overduePendings.length + overdueTasks.length})
              </TabsTrigger>
            </TabsList>

            {/* Kanban Tab */}
            <TabsContent value="kanban" className="space-y-6 mt-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-heading text-2xl text-primary-foreground">
                  Fluxo de Financiamentos
                </h2>
                <Dialog open={showNewCaseDialog} onOpenChange={setShowNewCaseDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-paragraph font-semibold h-12 px-6 rounded-lg">
                      <Plus className="w-5 h-5 mr-2" />
                      Novo Financiamento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Novo Caso de Financiamento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="font-paragraph text-sm text-primary-foreground mb-2 block">
                          Nome do Cliente *
                        </Label>
                        <Input
                          value={newCaseData.clientName}
                          onChange={(e) => setNewCaseData({ ...newCaseData, clientName: e.target.value })}
                          placeholder="Nome completo"
                          className="h-10 bg-primary border-border-gray text-primary-foreground rounded-lg"
                        />
                      </div>
                      <div>
                        <Label className="font-paragraph text-sm text-primary-foreground mb-2 block">
                          E-mail *
                        </Label>
                        <Input
                          type="email"
                          value={newCaseData.email}
                          onChange={(e) => setNewCaseData({ ...newCaseData, email: e.target.value })}
                          placeholder="email@example.com"
                          className="h-10 bg-primary border-border-gray text-primary-foreground rounded-lg"
                        />
                      </div>
                      <div>
                        <Label className="font-paragraph text-sm text-primary-foreground mb-2 block">
                          Telefone
                        </Label>
                        <Input
                          value={newCaseData.phoneNumber}
                          onChange={(e) => setNewCaseData({ ...newCaseData, phoneNumber: e.target.value })}
                          placeholder="(11) 98765-4321"
                          className="h-10 bg-primary border-border-gray text-primary-foreground rounded-lg"
                        />
                      </div>
                      <div>
                        <Label className="font-paragraph text-sm text-primary-foreground mb-2 block">
                          Fase Inicial
                        </Label>
                        <Select value={newCaseData.currentPhase} onValueChange={(value) => setNewCaseData({ ...newCaseData, currentPhase: value, currentSubPhase: '' })}>
                          <SelectTrigger className="h-10 bg-primary border-border-gray text-primary-foreground rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FINANCING_PHASES.map(phase => (
                              <SelectItem key={phase.id} value={phase.id}>
                                {phase.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {newCaseData.currentPhase && (
                        <div>
                          <Label className="font-paragraph text-sm text-primary-foreground mb-2 block">
                            Sub-fase
                          </Label>
                          <Select value={newCaseData.currentSubPhase} onValueChange={(value) => setNewCaseData({ ...newCaseData, currentSubPhase: value })}>
                            <SelectTrigger className="h-10 bg-primary border-border-gray text-primary-foreground rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FINANCING_PHASES.find(p => p.id === newCaseData.currentPhase)?.subPhases.map(subPhase => (
                                <SelectItem key={subPhase} value={subPhase}>
                                  {subPhase}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <Button
                        onClick={handleCreateCase}
                        className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-paragraph font-semibold h-10 rounded-lg"
                      >
                        Criar Financiamento
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Kanban Board */}
              <div className="flex gap-4 overflow-x-auto pb-6">
                {FINANCING_PHASES.map((phase) => {
                  const phaseCases = getCasesByPhase(phase.id);
                  return (
                    <motion.div
                      key={phase.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="flex-shrink-0 w-80"
                    >
                      <div className={`${phase.color} border-2 rounded-xl p-3 min-h-[500px] flex flex-col`}>
                        <div className="mb-3">
                          <h3 className="font-heading text-sm text-primary-foreground font-bold uppercase tracking-wide mb-1">
                            {phase.name}
                          </h3>
                          <div className="flex items-center justify-between">
                            <p className="font-paragraph text-xs text-primary-foreground/60">
                              {phaseCases.length} {phaseCases.length === 1 ? 'caso' : 'casos'}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs hover:bg-primary-foreground/10"
                              onClick={() => {
                                setNewCaseData({ ...newCaseData, currentPhase: phase.id, currentSubPhase: phase.subPhases[0] });
                                setShowNewCaseDialog(true);
                              }}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Adicionar um cartão
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2 flex-1">
                          {phaseCases.map((caseItem) => {
                            const daysInPhase = caseItem.daysInCurrentPhase || 0;
                            const casePendings = pendings.filter(p => p.atendimentoRef === caseItem._id && p.status !== 'Resolvida');
                            const caseTasks = tasks.filter(t => t.atendimentoRef === caseItem._id && t.status !== 'Concluída');
                            const openPendings = casePendings.filter(p => p.status === 'Aberta').length;
                            const openTasks = caseTasks.filter(t => t.status === 'Pendente').length;
                            
                            // Badge color based on days in phase
                            const daysBadgeColor = daysInPhase <= 3 ? 'bg-green-500' : daysInPhase <= 7 ? 'bg-yellow-500' : 'bg-red-500';
                            
                            // Pending indicator color
                            const pendingColor = openPendings === 0 ? 'bg-green-500' : openPendings <= 2 ? 'bg-yellow-500' : 'bg-red-500';
                            
                            // Check if any action was taken today
                            const today = new Date().toDateString();
                            const hasActivityToday = [...casePendings, ...caseTasks].some(item => {
                              const itemDate = new Date(item.createdDate || '').toDateString();
                              return itemDate === today;
                            });
                            const productivityColor = hasActivityToday ? 'bg-green-500' : 'bg-red-500';
                            
                            return (
                              <motion.div
                                key={caseItem._id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.02, boxShadow: '0 8px 16px rgba(0,0,0,0.12)' }}
                                transition={{ duration: 0.2 }}
                                onClick={() => handleOpenDetails(caseItem)}
                                className="bg-white rounded-lg p-3 border border-primary-foreground/10 hover:shadow-lg transition-all cursor-pointer group relative"
                              >
                                {/* Productivity indicator */}
                                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${productivityColor}`} title={hasActivityToday ? 'Atividade hoje' : 'Sem atividade hoje'}></div>
                                
                                {/* Client name */}
                                <h4 className="font-heading text-sm text-primary-foreground font-semibold mb-2 line-clamp-1 pr-4">
                                  {caseItem.clientName}
                                </h4>

                                {/* CPF */}
                                {caseItem.cpf && (
                                  <p className="text-xs text-primary-foreground/60 mb-2">
                                    CPF: {caseItem.cpf}
                                  </p>
                                )}

                                {/* FGTS Indicator */}
                                <div className="mb-2">
                                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${caseItem.useFgts ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    FGTS: {caseItem.useFgts ? 'Sim' : 'Não'}
                                  </span>
                                </div>
                                
                                {/* Current phase and subphase */}
                                <div className="mb-2 space-y-1">
                                  <div className="text-xs text-primary-foreground/60">
                                    Fase: <span className="font-semibold">{FINANCING_PHASES.find(p => p.id === caseItem.currentPhase)?.name || caseItem.currentPhase}</span>
                                  </div>
                                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                                    caseItem.currentSubPhase.toLowerCase().includes('condicionado') || caseItem.currentSubPhase.toLowerCase().includes('reprovado')
                                      ? 'bg-red-500 text-white'
                                      : caseItem.currentSubPhase.toLowerCase().includes('aprovado') || caseItem.currentSubPhase.toLowerCase().includes('concluído')
                                      ? 'bg-green-600 text-white'
                                      : caseItem.currentSubPhase.toLowerCase().includes('análise') || caseItem.currentSubPhase.toLowerCase().includes('aguardando')
                                      ? 'bg-yellow-500 text-white'
                                      : 'bg-blue-600 text-white'
                                  }`}>
                                    {caseItem.currentSubPhase}
                                  </span>
                                </div>
                                
                                {/* Pending and tasks count */}
                                <div className="flex items-center gap-3 mb-2 text-xs">
                                  <div className="flex items-center gap-1">
                                    <div className={`w-2 h-2 rounded-full ${pendingColor}`}></div>
                                    <AlertCircle className="w-3 h-3 text-primary-foreground/60" />
                                    <span className="text-primary-foreground/70">{openPendings} pendências</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-primary-foreground/60" />
                                    <span className="text-primary-foreground/70">{openTasks} tarefas</span>
                                  </div>
                                </div>

                                {/* Days in phase */}
                                <div className="flex items-center gap-1 mb-3">
                                  <Clock className="w-3 h-3 text-primary-foreground/60" />
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${daysBadgeColor} text-white`}>
                                    {daysInPhase} {daysInPhase === 1 ? 'dia' : 'dias'} nesta fase
                                  </span>
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-2 pt-2 border-t border-primary-foreground/10">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 h-7 text-xs hover:bg-secondary/10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedCase(caseItem);
                                      setShowNewPendingDialog(true);
                                    }}
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Pendência
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="flex-1 h-7 text-xs bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenDetails(caseItem);
                                    }}
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    Abrir
                                  </Button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Details Modal */}
              <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
                  <DialogHeader className="px-6 py-4 border-b border-border-gray sticky top-0 bg-white z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <DialogTitle className="font-heading text-2xl text-secondary">
                          Financiamento — {selectedCase?.clientName}
                        </DialogTitle>
                        <p className="text-sm text-primary-foreground/60 mt-1">
                          Fase: {FINANCING_PHASES.find(p => p.id === selectedCase?.currentPhase)?.name}
                        </p>
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

                  <ScrollArea className="h-[calc(90vh-100px)]">
                    <div className="px-6 py-4">
                      <Tabs value={modalTab} onValueChange={setModalTab}>
                        <TabsList className="grid w-full grid-cols-6 mb-6">
                          <TabsTrigger value="dados" className="text-xs">
                            <FileText className="w-4 h-4 mr-1" />
                            Dados do Processo
                          </TabsTrigger>
                          <TabsTrigger value="proponentes" className="text-xs">
                            <Users className="w-4 h-4 mr-1" />
                            Proponente(s)
                          </TabsTrigger>
                          <TabsTrigger value="vendedores" className="text-xs">
                            <User className="w-4 h-4 mr-1" />
                            Vendedor(es)
                          </TabsTrigger>
                          <TabsTrigger value="pendencias" className="text-xs">
                            <ClipboardList className="w-4 h-4 mr-1" />
                            Pendências + Tarefas
                          </TabsTrigger>
                          <TabsTrigger value="docs" className="text-xs">
                            <FileText className="w-4 h-4 mr-1" />
                            Docs
                          </TabsTrigger>
                          <TabsTrigger value="historico" className="text-xs">
                            <History className="w-4 h-4 mr-1" />
                            Histórico
                          </TabsTrigger>
                        </TabsList>

                        {/* Dados do Processo Tab */}
                        <TabsContent value="dados" className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="font-paragraph text-sm text-primary-foreground mb-2 block">
                                Proponente Principal *
                              </Label>
                              <Input
                                value={detailsData.proponentePrincipal}
                                onChange={(e) => setDetailsData({ ...detailsData, proponentePrincipal: e.target.value })}
                                className="h-10 bg-primary border-border-gray text-primary-foreground"
                              />
                            </div>
                            <div>
                              <Label className="font-paragraph text-sm text-primary-foreground mb-2 block">
                                CPF
                              </Label>
                              <Input
                                value={detailsData.cpf}
                                onChange={(e) => setDetailsData({ ...detailsData, cpf: e.target.value })}
                                placeholder="000.000.000-00"
                                className="h-10 bg-primary border-border-gray text-primary-foreground"
                              />
                            </div>
                          </div>

                          {/* Participants Section */}
                          <div className="border border-border-gray rounded-lg p-4">
                            <h3 className="font-heading text-lg text-primary-foreground mb-3">+ Participantes</h3>
                            
                            {/* Add Participant Form */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                              <Select value={newParticipant.clientRef} onValueChange={(value) => setNewParticipant({ ...newParticipant, clientRef: value })}>
                                <SelectTrigger className="h-10 bg-primary border-border-gray">
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
                                className="h-10 bg-primary border-border-gray"
                              />
                              <Button onClick={handleAddParticipant} className="h-10 bg-secondary text-secondary-foreground">
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar
                              </Button>
                            </div>

                            {/* Participants List */}
                            <div className="space-y-2">
                              {participants.map(participant => {
                                const client = clients.find(c => c._id === participant.clientRef);
                                return (
                                  <div key={participant._id} className="flex items-center justify-between bg-light-gray p-3 rounded">
                                    <div>
                                      <p className="font-paragraph text-sm font-semibold">{client?.clientName || client?.nomeRazaoSocial}</p>
                                      <p className="text-xs text-primary-foreground/60">{participant.roleInService}</p>
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
                          </div>

                          {/* Financial Fields */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="font-paragraph text-sm text-primary-foreground mb-2 block">
                                Valor do Imóvel *
                              </Label>
                              <Input
                                type="number"
                                value={detailsData.propertyValue}
                                onChange={(e) => setDetailsData({ ...detailsData, propertyValue: parseFloat(e.target.value) })}
                                placeholder="R$ 0,00"
                                className="h-10 bg-primary border-border-gray text-primary-foreground"
                              />
                            </div>
                            <div>
                              <Label className="font-paragraph text-sm text-primary-foreground mb-2 block">
                                Valor de Financiamento Desejado *
                              </Label>
                              <Input
                                type="number"
                                value={detailsData.desiredFinancingValue}
                                onChange={(e) => setDetailsData({ ...detailsData, desiredFinancingValue: parseFloat(e.target.value) })}
                                placeholder="R$ 0,00"
                                className="h-10 bg-primary border-border-gray text-primary-foreground"
                              />
                            </div>
                            <div>
                              <Label className="font-paragraph text-sm text-primary-foreground mb-2 block">
                                Valor de Financiamento Aprovado
                              </Label>
                              <Input
                                type="number"
                                value={detailsData.approvedFinancingValue}
                                onChange={(e) => setDetailsData({ ...detailsData, approvedFinancingValue: parseFloat(e.target.value) })}
                                placeholder="R$ 0,00"
                                className="h-10 bg-primary border-border-gray text-primary-foreground"
                              />
                            </div>
                            <div>
                              <Label className="font-paragraph text-sm text-primary-foreground mb-2 block">
                                Utilizará FGTS? *
                              </Label>
                              <Select 
                                value={detailsData.useFgts ? 'sim' : 'nao'} 
                                onValueChange={(value) => setDetailsData({ ...detailsData, useFgts: value === 'sim', fgtsValue: value === 'nao' ? 0 : detailsData.fgtsValue })}
                              >
                                <SelectTrigger className="h-10 bg-primary border-border-gray">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sim">Sim</SelectItem>
                                  <SelectItem value="nao">Não</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* FGTS Value (conditional) */}
                          {detailsData.useFgts && (
                            <div>
                              <Label className="font-paragraph text-sm text-primary-foreground mb-2 block">
                                Valor desejado de débito FGTS
                              </Label>
                              <Input
                                type="number"
                                value={detailsData.fgtsValue}
                                onChange={(e) => setDetailsData({ ...detailsData, fgtsValue: parseFloat(e.target.value) })}
                                placeholder="R$ 0,00"
                                className="h-10 bg-primary border-border-gray text-primary-foreground"
                              />
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="font-paragraph text-sm text-primary-foreground mb-2 block">
                                E-mail
                              </Label>
                              <Input
                                type="email"
                                value={detailsData.email}
                                onChange={(e) => setDetailsData({ ...detailsData, email: e.target.value })}
                                className="h-10 bg-primary border-border-gray text-primary-foreground"
                              />
                            </div>
                            <div>
                              <Label className="font-paragraph text-sm text-primary-foreground mb-2 block">
                                Telefone
                              </Label>
                              <Input
                                value={detailsData.phoneNumber}
                                onChange={(e) => setDetailsData({ ...detailsData, phoneNumber: e.target.value })}
                                className="h-10 bg-primary border-border-gray text-primary-foreground"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="font-paragraph text-sm text-primary-foreground mb-2 block">
                              Observações
                            </Label>
                            <Textarea
                              value={detailsData.notes}
                              onChange={(e) => setDetailsData({ ...detailsData, notes: e.target.value })}
                              rows={4}
                              className="bg-primary border-border-gray text-primary-foreground resize-none"
                            />
                          </div>
                        </TabsContent>

                        {/* Proponentes Tab */}
                        <TabsContent value="proponentes" className="space-y-6">
                          <div className="border border-border-gray rounded-lg p-4">
                            <h3 className="font-heading text-lg text-primary-foreground mb-4">Checklist de Documentos e Informações</h3>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={proponentChecklist?.hasFgtsContribution || false}
                                  onCheckedChange={(checked) => handleUpdateChecklist('hasFgtsContribution', checked as boolean)}
                                />
                                <Label className="font-paragraph text-sm cursor-pointer">
                                  Possui 3 anos de contribuição FGTS?
                                </Label>
                              </div>
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={proponentChecklist?.hasDependent || false}
                                  onCheckedChange={(checked) => handleUpdateChecklist('hasDependent', checked as boolean)}
                                />
                                <Label className="font-paragraph text-sm cursor-pointer">
                                  Possui dependente ou participante?
                                </Label>
                              </div>
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={proponentChecklist?.declaresIncomeTax || false}
                                  onCheckedChange={(checked) => handleUpdateChecklist('declaresIncomeTax', checked as boolean)}
                                />
                                <Label className="font-paragraph text-sm cursor-pointer">
                                  Declara imposto de renda?
                                </Label>
                              </div>
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={proponentChecklist?.ownsProperty || false}
                                  onCheckedChange={(checked) => handleUpdateChecklist('ownsProperty', checked as boolean)}
                                />
                                <Label className="font-paragraph text-sm cursor-pointer">
                                  Possui imóvel?
                                </Label>
                              </div>
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={proponentChecklist?.hasActiveFinancing || false}
                                  onCheckedChange={(checked) => handleUpdateChecklist('hasActiveFinancing', checked as boolean)}
                                />
                                <Label className="font-paragraph text-sm cursor-pointer">
                                  Possui financiamento ativo?
                                </Label>
                              </div>
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={proponentChecklist?.isFirstAcquisition || false}
                                  onCheckedChange={(checked) => handleUpdateChecklist('isFirstAcquisition', checked as boolean)}
                                />
                                <Label className="font-paragraph text-sm cursor-pointer">
                                  Primeira aquisição no âmbito SFH?
                                </Label>
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        {/* Vendedores Tab */}
                        <TabsContent value="vendedores">
                          <p className="text-center text-primary-foreground/60 py-8">Seção de vendedores em desenvolvimento</p>
                        </TabsContent>

                        {/* Pendências + Tarefas Tab */}
                        <TabsContent value="pendencias" className="space-y-6">
                          <div>
                            <h3 className="font-heading text-lg text-primary-foreground mb-3">Pendências</h3>
                            <div className="space-y-2">
                              {pendings.filter(p => p.atendimentoRef === selectedCase?._id).map(pending => (
                                <div key={pending._id} className="bg-light-gray p-3 rounded border border-border-gray">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-paragraph font-semibold text-sm">{pending.title}</h4>
                                      <p className="text-xs text-primary-foreground/60 mt-1">{pending.description}</p>
                                      <div className="flex gap-2 mt-2">
                                        <span className="text-xs bg-primary-foreground/10 px-2 py-1 rounded">{pending.status}</span>
                                        <span className="text-xs bg-primary-foreground/10 px-2 py-1 rounded">{pending.priority}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h3 className="font-heading text-lg text-primary-foreground mb-3">Tarefas</h3>
                            <div className="space-y-2">
                              {tasks.filter(t => t.atendimentoRef === selectedCase?._id).map(task => (
                                <div key={task._id} className="bg-light-gray p-3 rounded border border-border-gray">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-paragraph font-semibold text-sm">{task.description}</h4>
                                      <div className="flex gap-2 mt-2">
                                        <span className="text-xs bg-primary-foreground/10 px-2 py-1 rounded">{task.status}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TabsContent>

                        {/* Docs Tab */}
                        <TabsContent value="docs">
                          <div className="space-y-2">
                            {documents.map(doc => (
                              <div key={doc._id} className="bg-light-gray p-3 rounded border border-border-gray">
                                <h4 className="font-paragraph font-semibold text-sm">{doc.documentName}</h4>
                                <p className="text-xs text-primary-foreground/60">{doc.documentType}</p>
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        {/* Histórico Tab */}
                        <TabsContent value="historico">
                          <div className="space-y-2">
                            {history.map(item => (
                              <div key={item._id} className="bg-light-gray p-3 rounded border border-border-gray">
                                <p className="font-paragraph text-sm">{item.interactionDescription}</p>
                                <p className="text-xs text-primary-foreground/60 mt-1">
                                  {item.interactionDate ? new Date(item.interactionDate).toLocaleString('pt-BR') : ''}
                                </p>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Pendings & Tasks Tab */}
            <TabsContent value="pendings" className="space-y-6 mt-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-heading text-2xl text-primary-foreground">
                  Pendências e Tarefas
                </h2>
                <Dialog open={showNewPendingDialog} onOpenChange={setShowNewPendingDialog}>
                  <DialogTrigger asChild>
                    <Button
                      disabled={!selectedCase}
                      className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-paragraph font-semibold h-12 px-6 rounded-lg disabled:opacity-50"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Nova Pendência
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-96 overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Nova Pendência</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="font-paragraph text-sm text-primary-foreground mb-2 block">
                          Caso: {selectedCase?.clientName}
                        </Label>
                      </div>
                      <div>
                        <Label className="font-paragraph text-sm text-primary-foreground mb-2 block">
                          Título *
                        </Label>
                        <Input
                          value={newPendingData.title}
                          onChange={(e) => setNewPendingData({ ...newPendingData, title: e.target.value })}
                          placeholder="Título da pendência"
                          className="h-10 bg-primary border-border-gray text-primary-foreground rounded-lg"
                        />
                      </div>
                      <div>
                        <Label className="font-paragraph text-sm text-primary-foreground mb-2 block">
                          Descrição
                        </Label>
                        <Textarea
                          value={newPendingData.description}
                          onChange={(e) => setNewPendingData({ ...newPendingData, description: e.target.value })}
                          placeholder="Descrição detalhada"
                          rows={3}
                          className="bg-primary border-border-gray text-primary-foreground rounded-lg resize-none"
                        />
                      </div>
                      <div>
                        <Label className="font-paragraph text-sm text-primary-foreground mb-2 block">
                          Prioridade
                        </Label>
                        <Select value={newPendingData.priority} onValueChange={(value) => setNewPendingData({ ...newPendingData, priority: value })}>
                          <SelectTrigger className="h-10 bg-primary border-border-gray text-primary-foreground rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRIORITY_LEVELS.map(level => (
                              <SelectItem key={level} value={level}>{level}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="font-paragraph text-sm text-primary-foreground mb-2 block">
                          Prazo
                        </Label>
                        <Input
                          type="datetime-local"
                          value={newPendingData.dueDate}
                          onChange={(e) => setNewPendingData({ ...newPendingData, dueDate: e.target.value })}
                          className="h-10 bg-primary border-border-gray text-primary-foreground rounded-lg"
                        />
                      </div>
                      <div>
                        <Label className="font-paragraph text-sm text-primary-foreground mb-2 block">
                          Responsável
                        </Label>
                        <Select value={newPendingData.responsiblePartyType} onValueChange={(value) => setNewPendingData({ ...newPendingData, responsiblePartyType: value })}>
                          <SelectTrigger className="h-10 bg-primary border-border-gray text-primary-foreground rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RESPONSIBLE_TYPES.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {newPendingData.responsiblePartyType !== 'Interno' && (
                        <div>
                          <Label className="font-paragraph text-sm text-primary-foreground mb-2 block">
                            Detalhes do Responsável
                          </Label>
                          <Input
                            value={newPendingData.responsiblePartyDetails}
                            onChange={(e) => setNewPendingData({ ...newPendingData, responsiblePartyDetails: e.target.value })}
                            placeholder="Nome/Entidade + Contato"
                            className="h-10 bg-primary border-border-gray text-primary-foreground rounded-lg"
                          />
                        </div>
                      )}
                      <Button
                        onClick={handleCreatePending}
                        className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-paragraph font-semibold h-10 rounded-lg"
                      >
                        Criar Pendência
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Overdue Alert */}
              {(overduePendings.length > 0 || overdueTasks.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-heading text-lg text-red-800 mb-2">
                        ⚠️ Itens em Atraso
                      </h3>
                      <p className="font-paragraph text-sm text-red-700">
                        {overduePendings.length} pendência(s) e {overdueTasks.length} tarefa(s) vencidas
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Pendings List */}
              <div>
                <h3 className="font-heading text-xl text-secondary mb-4 font-semibold">
                  Pendências
                </h3>
                <div className="space-y-3">
                  {pendings.length === 0 ? (
                    <p className="font-paragraph text-primary-foreground/60 text-center py-8">
                      Nenhuma pendência registrada
                    </p>
                  ) : (
                    pendings.map((pending) => {
                      const isOverdue = new Date(pending.dueDate) < new Date() && pending.status !== 'Resolvida';
                      const caseItem = cases.find(c => c._id === pending.atendimentoRef);
                      return (
                        <motion.div
                          key={pending._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`rounded-lg p-4 border-2 ${
                            isOverdue
                              ? 'bg-red-50 border-red-300'
                              : pending.priority === 'Alta'
                              ? 'bg-orange-50 border-orange-300'
                              : 'bg-light-gray border-border-gray'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-heading text-base text-primary-foreground font-semibold">
                                  {pending.title}
                                </h4>
                                {isOverdue && (
                                  <AlertCircle className="w-5 h-5 text-red-500" />
                                )}
                              </div>
                              <p className="font-paragraph text-sm text-primary-foreground/70 mb-2">
                                {pending.description}
                              </p>
                              <div className="flex flex-wrap gap-2 text-xs">
                                <span className="bg-primary-foreground/10 px-2 py-1 rounded">
                                  {pending.priority}
                                </span>
                                <span className="bg-primary-foreground/10 px-2 py-1 rounded">
                                  {pending.status}
                                </span>
                                <span className="bg-primary-foreground/10 px-2 py-1 rounded">
                                  {pending.responsiblePartyType}
                                </span>
                              </div>
                              {caseItem && (
                                <p className="font-paragraph text-xs text-primary-foreground/60 mt-2">
                                  Caso: {caseItem.clientName}
                                </p>
                              )}
                            </div>
                            {pending.dueDate && (
                              <div className="flex items-center gap-1 text-xs text-primary-foreground/60 flex-shrink-0">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(pending.dueDate).toLocaleDateString('pt-BR')}</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Tasks List */}
              <div>
                <h3 className="font-heading text-xl text-secondary mb-4 font-semibold">
                  Tarefas Associadas
                </h3>
                <div className="space-y-3">
                  {tasks.length === 0 ? (
                    <p className="font-paragraph text-primary-foreground/60 text-center py-8">
                      Nenhuma tarefa registrada
                    </p>
                  ) : (
                    tasks.map((task) => {
                      const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Concluída';
                      return (
                        <motion.div
                          key={task._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`rounded-lg p-4 border-2 ${
                            isOverdue
                              ? 'bg-red-50 border-red-300'
                              : task.status === 'Concluída'
                              ? 'bg-green-50 border-green-300'
                              : 'bg-light-gray border-border-gray'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {task.status === 'Concluída' ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : isOverdue ? (
                                  <AlertCircle className="w-5 h-5 text-red-500" />
                                ) : (
                                  <Clock className="w-5 h-5 text-primary-foreground/60" />
                                )}
                                <h4 className="font-heading text-base text-primary-foreground font-semibold">
                                  {task.description}
                                </h4>
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs">
                                <span className="bg-primary-foreground/10 px-2 py-1 rounded">
                                  {task.status}
                                </span>
                                <span className="bg-primary-foreground/10 px-2 py-1 rounded">
                                  {task.responsibleType}
                                </span>
                                {task.externalResponsibleName && (
                                  <span className="bg-primary-foreground/10 px-2 py-1 rounded">
                                    {task.externalResponsibleName}
                                  </span>
                                )}
                              </div>
                            </div>
                            {task.dueDate && (
                              <div className="flex items-center gap-1 text-xs text-primary-foreground/60 flex-shrink-0">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
}
