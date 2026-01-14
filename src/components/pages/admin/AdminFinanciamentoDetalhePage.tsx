import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertCircle,
  Upload,
  FileText,
  User,
  Building,
  Calendar,
  Phone,
  Mail,
  DollarSign,
  TrendingUp,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BaseCrudService } from '@/integrations';
import { 
  ServiceRecords, 
  Clients, 
  RealEstateBrokers, 
  UsuriosdoSistema,
  Companies,
  Units,
  PendnciasdoFinanciamento,
  FinancingTasks,
  DocumentosdoFinanciamento,
  HistricodeInteraes,
  DetalhesdoFinanciamento
} from '@/entities';

// Financing Phases Configuration
const FINANCING_PHASES = [
  { id: 'novos-clientes', name: 'NOVOS CLIENTES', subPhases: ['Cadastro de cliente', 'Análise de documentos', 'Avaliação de risco', 'Consultar restrição', 'Aguardando o imóvel', 'Condicionado', 'Reprovados'] },
  { id: 'engenharia', name: 'ENGENHARIA', subPhases: ['Engenharia', 'Avaliação de laudo'] },
  { id: 'fgts', name: 'FGTS', subPhases: ['FGTS', 'Formulários CIOP'] },
  { id: 'sistemas-caixa', name: 'SISTEMAS CAIXA', subPhases: ['SIOPI', 'Solicitar reserva orçamentária', 'SICTD', 'Garantia'] },
  { id: 'conformidade', name: 'CONFORMIDADE', subPhases: ['Conformidade'] },
  { id: 'agencia', name: 'AGÊNCIA', subPhases: ['Entrevista', 'Assinatura da minuta'] },
  { id: 'registro', name: 'REGISTRO', subPhases: ['ITBI', 'Cartório (R Sales)', 'Cartório por conta do cliente'] },
  { id: 'conclusao', name: 'CONCLUSÃO', subPhases: ['Concluído'] },
  { id: 'acompanhamento-obra', name: 'ACOMPANHAMENTO DE OBRA', subPhases: ['Acompanhamento de obra'] }
];

const RESPONSIBLE_TYPES = ['Interno', 'Cliente', 'Parceiro Externo', 'Construtora', 'Caixa', 'Cartório', 'Sistema/Prazo legal'];
const PRIORITY_LEVELS = ['Alta', 'Média', 'Baixa'];
const DOCUMENT_TYPES = ['RG', 'CPF', 'Comprovante de Renda', 'Comprovante de Residência', 'Certidão de Casamento', 'Escritura', 'Matrícula', 'Laudo de Avaliação', 'Outros'];
const DOCUMENT_STATUS = ['Pendente', 'Recebido', 'Aprovado', 'Rejeitado'];

export default function AdminFinanciamentoDetalhePage() {
  const { atendimentoId } = useParams<{ atendimentoId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('dados');
  
  // Main data
  const [atendimento, setAtendimento] = useState<ServiceRecords | null>(null);
  const [financingDetails, setFinancingDetails] = useState<DetalhesdoFinanciamento | null>(null);
  
  // Related data
  const [clientes, setClientes] = useState<Clients[]>([]);
  const [corretores, setCorretores] = useState<RealEstateBrokers[]>([]);
  const [usuarios, setUsuarios] = useState<UsuriosdoSistema[]>([]);
  const [empresas, setEmpresas] = useState<Companies[]>([]);
  const [unidades, setUnidades] = useState<Units[]>([]);
  const [pendencias, setPendencias] = useState<PendnciasdoFinanciamento[]>([]);
  const [tarefas, setTarefas] = useState<FinancingTasks[]>([]);
  const [documentos, setDocumentos] = useState<DocumentosdoFinanciamento[]>([]);
  const [historico, setHistorico] = useState<HistricodeInteraes[]>([]);
  
  // Form states
  const [formData, setFormData] = useState({
    clientePrincipalRef: '',
    corretorResponsavelRef: '',
    responsavelInternoId: '',
    responsavelExterno: '',
    empresaResponsavelRef: '',
    unidadeResponsavelRef: '',
    faseFinanciamento: 'novos-clientes',
    subfase: '',
    dataPrevistaConclusao: '',
    notes: ''
  });
  
  const [financingFormData, setFinancingFormData] = useState({
    bankName: '',
    bankAccountNumber: '',
    financingContractNumber: '',
    financingAmount: 0,
    interestRate: 0,
    loanTermMonths: 0,
    firstPaymentDate: ''
  });
  
  // Dialog states
  const [showNewPendingDialog, setShowNewPendingDialog] = useState(false);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [showNewDocumentDialog, setShowNewDocumentDialog] = useState(false);
  const [showPhaseChangeDialog, setShowPhaseChangeDialog] = useState(false);
  
  const [newPendingData, setNewPendingData] = useState({
    title: '',
    description: '',
    priority: 'Média',
    dueDate: '',
    responsiblePartyType: 'Interno',
    responsiblePartyDetails: '',
    bloqueiaFase: false
  });
  
  const [newTaskData, setNewTaskData] = useState({
    titulo: '',
    description: '',
    responsibleType: 'Interno',
    internalResponsibleId: '',
    externalResponsibleName: '',
    externalResponsibleContact: '',
    dueDate: ''
  });
  
  const [newDocumentData, setNewDocumentData] = useState({
    documentName: '',
    documentType: 'Outros',
    description: '',
    documentStatus: 'Pendente',
    documentUrl: ''
  });
  
  const [phaseChangeData, setPhaseChangeData] = useState({
    newPhase: '',
    newSubPhase: '',
    reason: ''
  });

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      if (!atendimentoId) return;
      
      try {
        setLoading(true);
        
        // Load main atendimento
        const atend = await BaseCrudService.getById<ServiceRecords>('atendimentos', atendimentoId);
        setAtendimento(atend);
        
        if (atend) {
          setFormData({
            clientePrincipalRef: atend.clientePrincipalRef || '',
            corretorResponsavelRef: atend.corretorResponsavelRef || '',
            responsavelInternoId: atend.responsavelInternoId || '',
            responsavelExterno: atend.responsavelExterno || '',
            empresaResponsavelRef: atend.empresaResponsavelRef || '',
            unidadeResponsavelRef: atend.unidadeResponsavelRef || '',
            faseFinanciamento: atend.faseFinanciamento || 'novos-clientes',
            subfase: '',
            dataPrevistaConclusao: atend.dataPrevistaConclusao ? new Date(atend.dataPrevistaConclusao).toISOString().split('T')[0] : '',
            notes: atend.notes || ''
          });
        }
        
        // Load financing details
        const { items: financingDetailsList } = await BaseCrudService.getAll<DetalhesdoFinanciamento>('financiamentodetalhes');
        const details = financingDetailsList.find(d => d._id === atendimentoId);
        if (details) {
          setFinancingDetails(details);
          setFinancingFormData({
            bankName: details.bankName || '',
            bankAccountNumber: details.bankAccountNumber || '',
            financingContractNumber: details.financingContractNumber || '',
            financingAmount: details.financingAmount || 0,
            interestRate: details.interestRate || 0,
            loanTermMonths: details.loanTermMonths || 0,
            firstPaymentDate: details.firstPaymentDate ? new Date(details.firstPaymentDate).toISOString().split('T')[0] : ''
          });
        }
        
        // Load related collections
        const [clientesRes, corretoresRes, usuariosRes, empresasRes, unidadesRes] = await Promise.all([
          BaseCrudService.getAll<Clients>('clientes'),
          BaseCrudService.getAll<RealEstateBrokers>('corretores'),
          BaseCrudService.getAll<UsuriosdoSistema>('usuariossistema'),
          BaseCrudService.getAll<Companies>('empresas'),
          BaseCrudService.getAll<Units>('unidades')
        ]);
        
        setClientes(clientesRes.items);
        setCorretores(corretoresRes.items);
        setUsuarios(usuariosRes.items);
        setEmpresas(empresasRes.items);
        setUnidades(unidadesRes.items);
        
        // Load process-specific data
        const [pendenciasRes, tarefasRes, documentosRes, historicoRes] = await Promise.all([
          BaseCrudService.getAll<PendnciasdoFinanciamento>('pendenciasfinanciamento'),
          BaseCrudService.getAll<FinancingTasks>('tarefasfinanciamento'),
          BaseCrudService.getAll<DocumentosdoFinanciamento>('documentosfinanciamento'),
          BaseCrudService.getAll<HistricodeInteraes>('historicointeracoes')
        ]);
        
        setPendencias(pendenciasRes.items.filter(p => p.atendimentoRef === atendimentoId));
        setTarefas(tarefasRes.items.filter(t => t.atendimentoRef === atendimentoId));
        setDocumentos(documentosRes.items.filter(d => d.atendimentoRef === atendimentoId));
        setHistorico(historicoRes.items.filter(h => h.atendimentoRef === atendimentoId));
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [atendimentoId]);

  // Save main data
  const handleSave = async () => {
    if (!atendimentoId) return;
    
    try {
      setSaving(true);
      
      // Update atendimento
      await BaseCrudService.update<ServiceRecords>('atendimentos', {
        _id: atendimentoId,
        clientePrincipalRef: formData.clientePrincipalRef,
        corretorResponsavelRef: formData.corretorResponsavelRef,
        responsavelInternoId: formData.responsavelInternoId,
        responsavelExterno: formData.responsavelExterno,
        empresaResponsavelRef: formData.empresaResponsavelRef,
        unidadeResponsavelRef: formData.unidadeResponsavelRef,
        faseFinanciamento: formData.faseFinanciamento,
        dataPrevistaConclusao: formData.dataPrevistaConclusao,
        notes: formData.notes
      });
      
      // Update or create financing details
      if (financingDetails) {
        await BaseCrudService.update<DetalhesdoFinanciamento>('financiamentodetalhes', {
          _id: financingDetails._id,
          ...financingFormData
        });
      } else {
        await BaseCrudService.create<DetalhesdoFinanciamento>('financiamentodetalhes', {
          _id: atendimentoId,
          ...financingFormData
        });
      }
      
      // Register in history
      await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
        _id: crypto.randomUUID(),
        atendimentoRef: atendimentoId,
        tipoEvento: 'Edição',
        interactionType: 'Atualização de Dados',
        interactionDescription: 'Dados do processo atualizados',
        interactionDate: new Date().toISOString(),
        autorTipo: 'Sistema'
      });
      
      alert('Dados salvos com sucesso!');
      
    } catch (error) {
      console.error('Error saving:', error);
      alert('Erro ao salvar dados');
    } finally {
      setSaving(false);
    }
  };

  // Change phase
  const handlePhaseChange = async () => {
    if (!atendimentoId || !phaseChangeData.newPhase) return;
    
    try {
      // Check for blocking pendings
      const blockingPendings = pendencias.filter(p => 
        p.bloqueiaFase && 
        p.status !== 'Resolvida' && 
        p.status !== 'Cancelada'
      );
      
      if (blockingPendings.length > 0) {
        alert(`Não é possível mudar de fase. Existem ${blockingPendings.length} pendência(s) bloqueante(s) não resolvida(s).`);
        return;
      }
      
      const oldPhase = formData.faseFinanciamento;
      
      // Update phase
      await BaseCrudService.update<ServiceRecords>('atendimentos', {
        _id: atendimentoId,
        faseFinanciamento: phaseChangeData.newPhase
      });
      
      // Register phase change in history
      await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
        _id: crypto.randomUUID(),
        atendimentoRef: atendimentoId,
        tipoEvento: 'Mudança de Fase',
        interactionType: 'Alteração de Fase',
        interactionDescription: `Fase alterada de "${FINANCING_PHASES.find(p => p.id === oldPhase)?.name}" para "${FINANCING_PHASES.find(p => p.id === phaseChangeData.newPhase)?.name}". Motivo: ${phaseChangeData.reason}`,
        interactionDate: new Date().toISOString(),
        autorTipo: 'Sistema'
      });
      
      setFormData({ ...formData, faseFinanciamento: phaseChangeData.newPhase });
      setShowPhaseChangeDialog(false);
      setPhaseChangeData({ newPhase: '', newSubPhase: '', reason: '' });
      
      alert('Fase alterada com sucesso!');
      
    } catch (error) {
      console.error('Error changing phase:', error);
      alert('Erro ao alterar fase');
    }
  };

  // Create pending
  const handleCreatePending = async () => {
    if (!atendimentoId || !newPendingData.title) return;
    
    try {
      const newPending: PendnciasdoFinanciamento = {
        _id: crypto.randomUUID(),
        atendimentoRef: atendimentoId,
        title: newPendingData.title,
        description: newPendingData.description,
        status: 'Aberta',
        priority: newPendingData.priority,
        dueDate: newPendingData.dueDate,
        responsiblePartyType: newPendingData.responsiblePartyType,
        responsiblePartyDetails: newPendingData.responsiblePartyDetails,
        bloqueiaFase: newPendingData.bloqueiaFase,
        creationDate: new Date().toISOString()
      };
      
      await BaseCrudService.create('pendenciasfinanciamento', newPending);
      setPendencias([...pendencias, newPending]);
      
      // Register in history
      await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
        _id: crypto.randomUUID(),
        atendimentoRef: atendimentoId,
        tipoEvento: 'Criação de Pendência',
        interactionType: 'Nova Pendência',
        interactionDescription: `Pendência criada: ${newPendingData.title}`,
        interactionDate: new Date().toISOString(),
        autorTipo: 'Sistema'
      });
      
      setNewPendingData({
        title: '',
        description: '',
        priority: 'Média',
        dueDate: '',
        responsiblePartyType: 'Interno',
        responsiblePartyDetails: '',
        bloqueiaFase: false
      });
      setShowNewPendingDialog(false);
      
    } catch (error) {
      console.error('Error creating pending:', error);
    }
  };

  // Create task
  const handleCreateTask = async () => {
    if (!atendimentoId || !newTaskData.titulo) return;
    
    try {
      const newTask: FinancingTasks = {
        _id: crypto.randomUUID(),
        atendimentoRef: atendimentoId,
        titulo: newTaskData.titulo,
        description: newTaskData.description,
        responsibleType: newTaskData.responsibleType,
        internalResponsibleId: newTaskData.internalResponsibleId,
        externalResponsibleName: newTaskData.externalResponsibleName,
        externalResponsibleContact: newTaskData.externalResponsibleContact,
        dueDate: newTaskData.dueDate,
        status: 'Pendente',
        creationDate: new Date().toISOString()
      };
      
      await BaseCrudService.create('tarefasfinanciamento', newTask);
      setTarefas([...tarefas, newTask]);
      
      setNewTaskData({
        titulo: '',
        description: '',
        responsibleType: 'Interno',
        internalResponsibleId: '',
        externalResponsibleName: '',
        externalResponsibleContact: '',
        dueDate: ''
      });
      setShowNewTaskDialog(false);
      
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  // Create document
  const handleCreateDocument = async () => {
    if (!atendimentoId || !newDocumentData.documentName) return;
    
    try {
      const newDocument: DocumentosdoFinanciamento = {
        _id: crypto.randomUUID(),
        atendimentoRef: atendimentoId,
        documentName: newDocumentData.documentName,
        documentType: newDocumentData.documentType,
        description: newDocumentData.description,
        documentStatus: newDocumentData.documentStatus,
        documentUrl: newDocumentData.documentUrl,
        uploadDate: new Date().toISOString(),
        origem: 'Sistema'
      };
      
      await BaseCrudService.create('documentosfinanciamento', newDocument);
      setDocumentos([...documentos, newDocument]);
      
      setNewDocumentData({
        documentName: '',
        documentType: 'Outros',
        description: '',
        documentStatus: 'Pendente',
        documentUrl: ''
      });
      setShowNewDocumentDialog(false);
      
    } catch (error) {
      console.error('Error creating document:', error);
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
      
      setPendencias(pendencias.map(p => 
        p._id === pendingId ? { ...p, status: newStatus } : p
      ));
      
      // Register in history
      await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
        _id: crypto.randomUUID(),
        atendimentoRef: atendimentoId!,
        tipoEvento: 'Atualização de Pendência',
        interactionType: 'Status Alterado',
        interactionDescription: `Status da pendência alterado para: ${newStatus}`,
        interactionDate: new Date().toISOString(),
        autorTipo: 'Sistema'
      });
      
    } catch (error) {
      console.error('Error updating pending:', error);
    }
  };

  // Update task status
  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await BaseCrudService.update<FinancingTasks>('tarefasfinanciamento', {
        _id: taskId,
        status: newStatus
      });
      
      setTarefas(tarefas.map(t => 
        t._id === taskId ? { ...t, status: newStatus } : t
      ));
      
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Delete pending
  const handleDeletePending = async (pendingId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pendência?')) return;
    
    try {
      await BaseCrudService.delete('pendenciasfinanciamento', pendingId);
      setPendencias(pendencias.filter(p => p._id !== pendingId));
    } catch (error) {
      console.error('Error deleting pending:', error);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    
    try {
      await BaseCrudService.delete('tarefasfinanciamento', taskId);
      setTarefas(tarefas.filter(t => t._id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!atendimento) {
    return (
      <div className="min-h-screen bg-primary">
        <Header />
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-20 text-center">
          <h1 className="font-heading text-3xl text-primary-foreground mb-4">Processo não encontrado</h1>
          <Button onClick={() => navigate('/admin/financiamento-kanban')}>
            Voltar ao Kanban
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const currentPhase = FINANCING_PHASES.find(p => p.id === formData.faseFinanciamento);
  const clientePrincipal = clientes.find(c => c._id === formData.clientePrincipalRef);
  const corretor = corretores.find(c => c._id === formData.corretorResponsavelRef);
  const responsavelInterno = usuarios.find(u => u._id === formData.responsavelInternoId);
  const empresa = empresas.find(e => e._id === formData.empresaResponsavelRef);
  const unidade = unidades.find(u => u._id === formData.unidadeResponsavelRef);

  const overdueCount = pendencias.filter(p => 
    new Date(p.dueDate || '') < new Date() && 
    p.status !== 'Resolvida' && 
    p.status !== 'Cancelada'
  ).length;

  return (
    <div className="min-h-screen bg-primary">
      <Header />

      {/* Breadcrumb */}
      <section className="w-full bg-light-gray py-4 border-b border-border-gray">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <div className="flex items-center gap-2 text-sm font-paragraph text-primary-foreground/70">
            <Link to="/area-restrita" className="hover:text-secondary">Área Restrita</Link>
            <span>/</span>
            <Link to="/admin/financiamento-kanban" className="hover:text-secondary">Kanban de Financiamento</Link>
            <span>/</span>
            <span className="text-primary-foreground font-semibold">{atendimento.contactName}</span>
          </div>
        </div>
      </section>

      {/* Header */}
      <section className="w-full bg-gradient-to-br from-secondary/10 to-secondary/5 py-8">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin/financiamento-kanban')}
                className="mb-4 text-primary-foreground/70 hover:text-primary-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Kanban
              </Button>
              
              <h1 className="font-heading text-4xl text-secondary mb-2">
                Processo de Financiamento
              </h1>
              <p className="font-paragraph text-lg text-primary-foreground/80">
                Cliente: {atendimento.contactName}
              </p>
              
              <div className="flex items-center gap-3 mt-4">
                <Badge className="bg-secondary text-secondary-foreground">
                  {currentPhase?.name}
                </Badge>
                {overdueCount > 0 && (
                  <Badge className="bg-destructive text-destructiveforeground">
                    {overdueCount} Pendência(s) Atrasada(s)
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 h-12 px-6"
              >
                <Save className="w-5 h-5 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
              
              <Dialog open={showPhaseChangeDialog} onOpenChange={setShowPhaseChangeDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-brandaccent text-primary hover:bg-brandaccent/90 h-12 px-6">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Alterar Fase
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Alterar Fase do Processo</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Fase Atual</Label>
                      <Input value={currentPhase?.name} disabled className="mt-2" />
                    </div>
                    <div>
                      <Label>Nova Fase *</Label>
                      <Select value={phaseChangeData.newPhase} onValueChange={(value) => setPhaseChangeData({ ...phaseChangeData, newPhase: value })}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Selecione a nova fase" />
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
                    <div>
                      <Label>Motivo da Mudança *</Label>
                      <Textarea
                        value={phaseChangeData.reason}
                        onChange={(e) => setPhaseChangeData({ ...phaseChangeData, reason: e.target.value })}
                        placeholder="Descreva o motivo da mudança de fase"
                        rows={3}
                        className="mt-2"
                      />
                    </div>
                    <Button
                      onClick={handlePhaseChange}
                      className="w-full bg-secondary text-secondary-foreground"
                    >
                      Confirmar Mudança
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="w-full py-12">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-light-gray mb-8">
              <TabsTrigger value="dados">Dados do Processo</TabsTrigger>
              <TabsTrigger value="pendencias">
                Pendências e Tarefas
                {overdueCount > 0 && (
                  <Badge className="ml-2 bg-destructive text-destructiveforeground">{overdueCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="documentos">Documentos ({documentos.length})</TabsTrigger>
              <TabsTrigger value="historico">Histórico ({historico.length})</TabsTrigger>
            </TabsList>

            {/* Tab 1: Dados do Processo */}
            <TabsContent value="dados" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cliente e Responsáveis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Cliente e Responsáveis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Cliente Principal *</Label>
                      <Select value={formData.clientePrincipalRef} onValueChange={(value) => setFormData({ ...formData, clientePrincipalRef: value })}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientes.map(cliente => (
                            <SelectItem key={cliente._id} value={cliente._id}>
                              {cliente.clientName || cliente.nomeRazaoSocial}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Corretor Responsável</Label>
                      <Select value={formData.corretorResponsavelRef} onValueChange={(value) => setFormData({ ...formData, corretorResponsavelRef: value })}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Selecione o corretor" />
                        </SelectTrigger>
                        <SelectContent>
                          {corretores.map(corretor => (
                            <SelectItem key={corretor._id} value={corretor._id}>
                              {corretor.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Responsável Interno</Label>
                      <Select value={formData.responsavelInternoId} onValueChange={(value) => setFormData({ ...formData, responsavelInternoId: value })}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Selecione o responsável" />
                        </SelectTrigger>
                        <SelectContent>
                          {usuarios.map(usuario => (
                            <SelectItem key={usuario._id} value={usuario._id}>
                              {usuario.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Responsável Externo</Label>
                      <Input
                        value={formData.responsavelExterno}
                        onChange={(e) => setFormData({ ...formData, responsavelExterno: e.target.value })}
                        placeholder="Nome e contato do responsável externo"
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Empresa e Unidade */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      Empresa e Unidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Empresa Responsável</Label>
                      <Select value={formData.empresaResponsavelRef} onValueChange={(value) => setFormData({ ...formData, empresaResponsavelRef: value })}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Selecione a empresa" />
                        </SelectTrigger>
                        <SelectContent>
                          {empresas.map(empresa => (
                            <SelectItem key={empresa._id} value={empresa._id}>
                              {empresa.tradeName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Unidade Responsável</Label>
                      <Select value={formData.unidadeResponsavelRef} onValueChange={(value) => setFormData({ ...formData, unidadeResponsavelRef: value })}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {unidades.map(unidade => (
                            <SelectItem key={unidade._id} value={unidade._id}>
                              {unidade.unitName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Data Prevista de Conclusão</Label>
                      <Input
                        type="date"
                        value={formData.dataPrevistaConclusao}
                        onChange={(e) => setFormData({ ...formData, dataPrevistaConclusao: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Dados Bancários */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Dados Bancários do Financiamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Banco</Label>
                      <Input
                        value={financingFormData.bankName}
                        onChange={(e) => setFinancingFormData({ ...financingFormData, bankName: e.target.value })}
                        placeholder="Nome do banco"
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label>Número da Conta</Label>
                      <Input
                        value={financingFormData.bankAccountNumber}
                        onChange={(e) => setFinancingFormData({ ...financingFormData, bankAccountNumber: e.target.value })}
                        placeholder="Número da conta bancária"
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label>Número do Contrato</Label>
                      <Input
                        value={financingFormData.financingContractNumber}
                        onChange={(e) => setFinancingFormData({ ...financingFormData, financingContractNumber: e.target.value })}
                        placeholder="Número do contrato de financiamento"
                        className="mt-2"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Valor do Financiamento</Label>
                        <Input
                          type="number"
                          value={financingFormData.financingAmount}
                          onChange={(e) => setFinancingFormData({ ...financingFormData, financingAmount: parseFloat(e.target.value) })}
                          placeholder="0.00"
                          className="mt-2"
                        />
                      </div>
                      
                      <div>
                        <Label>Taxa de Juros (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={financingFormData.interestRate}
                          onChange={(e) => setFinancingFormData({ ...financingFormData, interestRate: parseFloat(e.target.value) })}
                          placeholder="0.00"
                          className="mt-2"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Prazo (meses)</Label>
                        <Input
                          type="number"
                          value={financingFormData.loanTermMonths}
                          onChange={(e) => setFinancingFormData({ ...financingFormData, loanTermMonths: parseInt(e.target.value) })}
                          placeholder="0"
                          className="mt-2"
                        />
                      </div>
                      
                      <div>
                        <Label>Data 1º Pagamento</Label>
                        <Input
                          type="date"
                          value={financingFormData.firstPaymentDate}
                          onChange={(e) => setFinancingFormData({ ...financingFormData, firstPaymentDate: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Observações */}
                <Card>
                  <CardHeader>
                    <CardTitle>Observações Gerais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Observações sobre o processo..."
                      rows={8}
                      className="resize-none"
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab 2: Pendências e Tarefas */}
            <TabsContent value="pendencias" className="space-y-6">
              <div className="flex gap-3 mb-6">
                <Dialog open={showNewPendingDialog} onOpenChange={setShowNewPendingDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-secondary text-secondary-foreground">
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Pendência
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Nova Pendência</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Título *</Label>
                        <Input
                          value={newPendingData.title}
                          onChange={(e) => setNewPendingData({ ...newPendingData, title: e.target.value })}
                          placeholder="Título da pendência"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Textarea
                          value={newPendingData.description}
                          onChange={(e) => setNewPendingData({ ...newPendingData, description: e.target.value })}
                          placeholder="Descrição detalhada"
                          rows={3}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Prioridade</Label>
                        <Select value={newPendingData.priority} onValueChange={(value) => setNewPendingData({ ...newPendingData, priority: value })}>
                          <SelectTrigger className="mt-2">
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
                        <Label>Prazo</Label>
                        <Input
                          type="datetime-local"
                          value={newPendingData.dueDate}
                          onChange={(e) => setNewPendingData({ ...newPendingData, dueDate: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Tipo de Responsável</Label>
                        <Select value={newPendingData.responsiblePartyType} onValueChange={(value) => setNewPendingData({ ...newPendingData, responsiblePartyType: value })}>
                          <SelectTrigger className="mt-2">
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
                          <Label>Detalhes do Responsável</Label>
                          <Input
                            value={newPendingData.responsiblePartyDetails}
                            onChange={(e) => setNewPendingData({ ...newPendingData, responsiblePartyDetails: e.target.value })}
                            placeholder="Nome/Entidade + Contato"
                            className="mt-2"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="bloqueiaFase"
                          checked={newPendingData.bloqueiaFase}
                          onChange={(e) => setNewPendingData({ ...newPendingData, bloqueiaFase: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="bloqueiaFase" className="cursor-pointer">
                          Bloqueia mudança de fase
                        </Label>
                      </div>
                      <Button
                        onClick={handleCreatePending}
                        className="w-full bg-secondary text-secondary-foreground"
                      >
                        Criar Pendência
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-brandaccent text-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Tarefa
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Nova Tarefa</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Título *</Label>
                        <Input
                          value={newTaskData.titulo}
                          onChange={(e) => setNewTaskData({ ...newTaskData, titulo: e.target.value })}
                          placeholder="Título da tarefa"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Textarea
                          value={newTaskData.description}
                          onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                          placeholder="Descrição detalhada"
                          rows={3}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Tipo de Responsável</Label>
                        <Select value={newTaskData.responsibleType} onValueChange={(value) => setNewTaskData({ ...newTaskData, responsibleType: value })}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RESPONSIBLE_TYPES.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {newTaskData.responsibleType === 'Interno' ? (
                        <div>
                          <Label>Responsável Interno</Label>
                          <Select value={newTaskData.internalResponsibleId} onValueChange={(value) => setNewTaskData({ ...newTaskData, internalResponsibleId: value })}>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Selecione o usuário" />
                            </SelectTrigger>
                            <SelectContent>
                              {usuarios.map(usuario => (
                                <SelectItem key={usuario._id} value={usuario._id}>
                                  {usuario.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <>
                          <div>
                            <Label>Nome do Responsável Externo</Label>
                            <Input
                              value={newTaskData.externalResponsibleName}
                              onChange={(e) => setNewTaskData({ ...newTaskData, externalResponsibleName: e.target.value })}
                              placeholder="Nome completo"
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label>Contato</Label>
                            <Input
                              value={newTaskData.externalResponsibleContact}
                              onChange={(e) => setNewTaskData({ ...newTaskData, externalResponsibleContact: e.target.value })}
                              placeholder="Telefone ou e-mail"
                              className="mt-2"
                            />
                          </div>
                        </>
                      )}
                      <div>
                        <Label>Prazo</Label>
                        <Input
                          type="datetime-local"
                          value={newTaskData.dueDate}
                          onChange={(e) => setNewTaskData({ ...newTaskData, dueDate: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                      <Button
                        onClick={handleCreateTask}
                        className="w-full bg-brandaccent text-primary"
                      >
                        Criar Tarefa
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Pendências List */}
              <div>
                <h3 className="font-heading text-xl text-secondary mb-4">Pendências</h3>
                <div className="space-y-3">
                  {pendencias.length === 0 ? (
                    <p className="text-center py-8 text-primary-foreground/60">Nenhuma pendência registrada</p>
                  ) : (
                    pendencias.map(pending => {
                      const isOverdue = new Date(pending.dueDate || '') < new Date() && pending.status !== 'Resolvida';
                      return (
                        <Card key={pending._id} className={isOverdue ? 'border-destructive border-2' : ''}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-heading text-base font-semibold">{pending.title}</h4>
                                  {isOverdue && <AlertCircle className="w-5 h-5 text-destructive" />}
                                  {pending.bloqueiaFase && <Badge className="bg-destructive text-destructiveforeground">Bloqueante</Badge>}
                                </div>
                                <p className="text-sm text-primary-foreground/70 mb-3">{pending.description}</p>
                                <div className="flex flex-wrap gap-2 text-xs mb-3">
                                  <Badge variant="outline">{pending.priority}</Badge>
                                  <Badge variant="outline">{pending.status}</Badge>
                                  <Badge variant="outline">{pending.responsiblePartyType}</Badge>
                                  {pending.dueDate && (
                                    <Badge variant="outline">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {new Date(pending.dueDate).toLocaleDateString('pt-BR')}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdatePendingStatus(pending._id, 'Resolvida')}
                                    disabled={pending.status === 'Resolvida'}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Concluir
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdatePendingStatus(pending._id, 'Aberta')}
                                    disabled={pending.status === 'Aberta'}
                                  >
                                    Reabrir
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeletePending(pending._id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Tarefas List */}
              <div>
                <h3 className="font-heading text-xl text-secondary mb-4">Tarefas</h3>
                <div className="space-y-3">
                  {tarefas.length === 0 ? (
                    <p className="text-center py-8 text-primary-foreground/60">Nenhuma tarefa registrada</p>
                  ) : (
                    tarefas.map(task => {
                      const isOverdue = new Date(task.dueDate || '') < new Date() && task.status !== 'Concluída';
                      return (
                        <Card key={task._id} className={isOverdue ? 'border-destructive border-2' : ''}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {task.status === 'Concluída' ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  ) : isOverdue ? (
                                    <AlertCircle className="w-5 h-5 text-destructive" />
                                  ) : (
                                    <Clock className="w-5 h-5 text-primary-foreground/60" />
                                  )}
                                  <h4 className="font-heading text-base font-semibold">{task.titulo}</h4>
                                </div>
                                <p className="text-sm text-primary-foreground/70 mb-3">{task.description}</p>
                                <div className="flex flex-wrap gap-2 text-xs mb-3">
                                  <Badge variant="outline">{task.status}</Badge>
                                  <Badge variant="outline">{task.responsibleType}</Badge>
                                  {task.externalResponsibleName && (
                                    <Badge variant="outline">{task.externalResponsibleName}</Badge>
                                  )}
                                  {task.dueDate && (
                                    <Badge variant="outline">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateTaskStatus(task._id, 'Concluída')}
                                    disabled={task.status === 'Concluída'}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Concluir
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateTaskStatus(task._id, 'Pendente')}
                                    disabled={task.status === 'Pendente'}
                                  >
                                    Reabrir
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteTask(task._id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab 3: Documentos */}
            <TabsContent value="documentos" className="space-y-6">
              <Dialog open={showNewDocumentDialog} onOpenChange={setShowNewDocumentDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-secondary text-secondary-foreground">
                    <Upload className="w-4 h-4 mr-2" />
                    Adicionar Documento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Novo Documento</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Nome do Documento *</Label>
                      <Input
                        value={newDocumentData.documentName}
                        onChange={(e) => setNewDocumentData({ ...newDocumentData, documentName: e.target.value })}
                        placeholder="Nome do arquivo"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Tipo de Documento</Label>
                      <Select value={newDocumentData.documentType} onValueChange={(value) => setNewDocumentData({ ...newDocumentData, documentType: value })}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>URL do Documento</Label>
                      <Input
                        value={newDocumentData.documentUrl}
                        onChange={(e) => setNewDocumentData({ ...newDocumentData, documentUrl: e.target.value })}
                        placeholder="https://..."
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select value={newDocumentData.documentStatus} onValueChange={(value) => setNewDocumentData({ ...newDocumentData, documentStatus: value })}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_STATUS.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Observação</Label>
                      <Textarea
                        value={newDocumentData.description}
                        onChange={(e) => setNewDocumentData({ ...newDocumentData, description: e.target.value })}
                        placeholder="Observações sobre o documento"
                        rows={3}
                        className="mt-2"
                      />
                    </div>
                    <Button
                      onClick={handleCreateDocument}
                      className="w-full bg-secondary text-secondary-foreground"
                    >
                      Adicionar Documento
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documentos.length === 0 ? (
                  <p className="col-span-full text-center py-8 text-primary-foreground/60">Nenhum documento anexado</p>
                ) : (
                  documentos.map(doc => (
                    <Card key={doc._id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <FileText className="w-8 h-8 text-secondary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-heading text-sm font-semibold mb-1 truncate">{doc.documentName}</h4>
                            <p className="text-xs text-primary-foreground/60 mb-2">{doc.documentType}</p>
                            <Badge variant="outline" className="text-xs">{doc.documentStatus}</Badge>
                            {doc.description && (
                              <p className="text-xs text-primary-foreground/70 mt-2">{doc.description}</p>
                            )}
                            {doc.documentUrl && (
                              <a
                                href={doc.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-secondary hover:underline mt-2 inline-block"
                              >
                                Abrir documento
                              </a>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Tab 4: Histórico */}
            <TabsContent value="historico" className="space-y-6">
              <div className="space-y-4">
                {historico.length === 0 ? (
                  <p className="text-center py-8 text-primary-foreground/60">Nenhum evento registrado</p>
                ) : (
                  historico
                    .sort((a, b) => new Date(b.interactionDate || '').getTime() - new Date(a.interactionDate || '').getTime())
                    .map(event => (
                      <Card key={event._id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                              <History className="w-5 h-5 text-secondary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-heading text-sm font-semibold">{event.tipoEvento}</h4>
                                <Badge variant="outline" className="text-xs">{event.interactionType}</Badge>
                              </div>
                              <p className="text-sm text-primary-foreground/70 mb-2">{event.interactionDescription}</p>
                              <p className="text-xs text-primary-foreground/50">
                                {new Date(event.interactionDate || '').toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
}
