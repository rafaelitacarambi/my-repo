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
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BaseCrudService } from '@/integrations';
import { ServiceRecords, UsuriosdoSistema } from '@/entities';

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
}

interface Pending {
  _id: string;
  financingCaseId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  responsiblePartyType: string;
  responsiblePartyDetails?: string;
  taskAutomaticallyCreated: boolean;
  createdDate: string;
}

interface Task {
  _id: string;
  description: string;
  pendingItemReference: string;
  responsibleType: string;
  internalResponsibleId?: string;
  externalResponsibleName?: string;
  externalResponsibleContact?: string;
  dueDate: string;
  status: string;
  creationDate: string;
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('kanban');
  const [selectedCase, setSelectedCase] = useState<FinancingCase | null>(null);
  const [showNewCaseDialog, setShowNewCaseDialog] = useState(false);
  const [showNewPendingDialog, setShowNewPendingDialog] = useState(false);
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

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load financing cases from atendimentos
        const { items: atendimentos } = await BaseCrudService.getAll<ServiceRecords>('atendimentos');
        const financingCases = atendimentos
          .filter(a => a.serviceType === 'Financiamento')
          .map(a => ({
            _id: a._id,
            clientName: a.contactName || 'Sem nome',
            email: a.contactEmail || '',
            phoneNumber: a.contactPhone || '',
            currentPhase: 'novos-clientes',
            currentSubPhase: 'Cadastro de cliente',
            dueDate: undefined,
            isOverdue: false,
            createdDate: a._createdDate?.toString() || new Date().toISOString(),
            updatedDate: a._updatedDate?.toString() || new Date().toISOString()
          }));
        setCases(financingCases);

        // Load users
        const { items: usersList } = await BaseCrudService.getAll<UsuriosdoSistema>('usuariossistema');
        setUsers(usersList);

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
        updatedDate: new Date().toISOString()
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
      const newPending: Pending = {
        _id: crypto.randomUUID(),
        financingCaseId: selectedCase._id,
        title: newPendingData.title,
        description: newPendingData.description,
        status: 'Aberta',
        priority: newPendingData.priority,
        dueDate: newPendingData.dueDate,
        responsiblePartyType: newPendingData.responsiblePartyType,
        responsiblePartyDetails: newPendingData.responsiblePartyDetails,
        taskAutomaticallyCreated: false,
        createdDate: new Date().toISOString()
      };

      await BaseCrudService.create('pendenciasfinanciamento', newPending);

      // Create associated task automatically
      const newTask: Task = {
        _id: crypto.randomUUID(),
        description: `Tarefa: ${newPendingData.title}`,
        pendingItemReference: newPending._id,
        responsibleType: newPendingData.responsiblePartyType,
        externalResponsibleName: newPendingData.responsiblePartyDetails,
        dueDate: newPendingData.dueDate,
        status: 'Pendente',
        creationDate: new Date().toISOString()
      };

      await BaseCrudService.create('tarefasfinanciamento', newTask);

      setPendings([...pendings, newPending]);
      setTasks([...tasks, newTask]);
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
                            const daysSinceCreation = Math.floor(
                              (new Date().getTime() - new Date(caseItem.createdDate).getTime()) / (1000 * 60 * 60 * 24)
                            );
                            return (
                              <motion.div
                                key={caseItem._id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-lg p-3 border border-primary-foreground/10 cursor-pointer hover:shadow-md transition-all group"
                                onClick={() => navigate(`/admin/financiamento/${caseItem._id}`)}
                              >
                                <div className="mb-2">
                                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                                    caseItem.currentSubPhase.toLowerCase().includes('condicionado') 
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
                                
                                <h4 className="font-heading text-sm text-primary-foreground font-semibold mb-2 line-clamp-1">
                                  {caseItem.clientName}
                                </h4>
                                
                                <div className="space-y-1 mb-3">
                                  <div className="flex items-center gap-1.5 text-xs text-primary-foreground/70">
                                    <User className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{caseItem.email}</span>
                                  </div>
                                  {caseItem.phoneNumber && (
                                    <div className="flex items-center gap-1.5 text-xs text-primary-foreground/70">
                                      <Phone className="w-3 h-3 flex-shrink-0" />
                                      <span>{caseItem.phoneNumber}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-primary-foreground/10">
                                  <div className="flex items-center gap-1 text-xs text-primary-foreground/60">
                                    <Clock className="w-3 h-3" />
                                    <span className="font-semibold">{daysSinceCreation} days</span>
                                  </div>
                                  <ExternalLink className="w-3.5 h-3.5 text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
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
                      const caseItem = cases.find(c => c._id === pending.financingCaseId);
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
