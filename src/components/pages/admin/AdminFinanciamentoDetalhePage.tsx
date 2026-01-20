import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  History,
  RotateCcw,
  Check,
  X,
  CreditCard,
  Building2,
  ChevronDown,
  ChevronUp
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
import { Checkbox } from '@/components/ui/checkbox';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BaseCrudService } from '@/integrations';
import { 
  ServiceRecords, 
  Clients, 
  UsuriosdoSistema,
  PendnciasdoFinanciamento,
  FinancingTasks,
  DocumentosdoFinanciamento,
  HistricodeInteraes,
  ServiceParties,
  Imveis,
  ChecklistdosProponentes
} from '@/entities';
import { formatCurrency, parseCurrency, formatCPF, parseCPF, validateCPF, handleCurrencyInput, handleCPFInput } from '@/lib/input-masks';

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
const DOCUMENT_STATUS_OPTIONS = ['Pendente', 'Recebido', 'Aprovado', 'Rejeitado'];
const MARITAL_STATUS = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'];

interface Proponente {
  _id: string;
  nome: string;
  cpf: string;
  telefone: string;
  renda: number;
  estadoCivil: string;
  possuiFgts: boolean;
  isPrincipal?: boolean;
  checklist?: {
    hasFgtsContribution: boolean;
    hasDependent: boolean;
    declaresIncomeTax: boolean;
    ownsProperty: boolean;
    hasActiveFinancing: boolean;
    isFirstAcquisition: boolean;
  };
  documentos?: {
    tipo: string;
    status: 'Pendente' | 'Recebido';
    arquivo?: string;
    dataRecebimento?: string;
    removed?: boolean;
  }[];
}

interface Vendedor {
  _id: string;
  nome: string;
  cpfCnpj: string;
  tipoPessoa: 'PF' | 'PJ';
  banco: string;
  agencia: string;
  conta: string;
  tipoConta: 'Corrente' | 'Poupança';
  titularConta: string;
  cpfCnpjTitular: string;
  estadoCivil?: string;
  conjugeVendedorId?: string;
  vinculoVendedores?: string[];
  documentos: {
    tipo: string;
    status: 'Pendente' | 'Recebido';
    arquivo?: string;
    dataRecebimento?: string;
    removed?: boolean;
  }[];
}

export default function AdminFinanciamentoDetalhePage() {
  const { atendimentoId } = useParams<{ atendimentoId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('dados');
  
  // Main data
  const [atendimento, setAtendimento] = useState<ServiceRecords | null>(null);
  const [phaseEntryDate, setPhaseEntryDate] = useState<string>('');
  const [daysInPhase, setDaysInPhase] = useState(0);
  
  // Related data
  const [clientes, setClientes] = useState<Clients[]>([]);
  const [usuarios, setUsuarios] = useState<UsuriosdoSistema[]>([]);
  const [pendencias, setPendencias] = useState<PendnciasdoFinanciamento[]>([]);
  const [tarefas, setTarefas] = useState<FinancingTasks[]>([]);
  const [documentos, setDocumentos] = useState<DocumentosdoFinanciamento[]>([]);
  const [historico, setHistorico] = useState<HistricodeInteraes[]>([]);
  const [proponentes, setProponentes] = useState<Proponente[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  
  // Form states
  const [formData, setFormData] = useState({
    contactName: '',
    cpf: '',
    contactPhone: '',
    enderecoImovel: '',
    matriculaImovel: '',
    numeroContratoSiopi: '',
    numeroRegistroCartorio: '',
    valorImovel: 0,
    valorFinanciamentoDesejado: 0,
    valorFinanciamentoPossivelAprovado: 0,
    valorTaxaVista: 0,
    valorProdutoNegociado: 0,
    valorItbi: 0,
    valorPrenotacaoCartorio: 0,
    valorRegistro: 0,
    pagoTaxaVista: false,
    pagoItbi: false,
    pagoPrenotacao: false,
    pagoRegistro: false,
    possuiPropostaComercial: '',
    faseFinanciamento: 'novos-clientes',
    status: 'Cadastro de cliente',
    creationDate: new Date().toISOString()
  });

  // Track if we've already attempted to create the principal proponent
  const [principalProponentCreated, setPrincipalProponentCreated] = useState(false);

  // Dialog states
  const [showAddProponenteDialog, setShowAddProponenteDialog] = useState(false);
  const [showAddVendedorDialog, setShowAddVendedorDialog] = useState(false);
  const [showAddPendenciaDialog, setShowAddPendenciaDialog] = useState(false);
  const [showAddTarefaDialog, setShowAddTarefaDialog] = useState(false);
  const [showAddDocumentoDialog, setShowAddDocumentoDialog] = useState(false);
  const [selectedVendedor, setSelectedVendedor] = useState<string | null>(null);
  const [showHistoricoPendencias, setShowHistoricoPendencias] = useState(false);

  // New item forms
  const [newProponente, setNewProponente] = useState<Proponente>({
    _id: '',
    nome: '',
    cpf: '',
    telefone: '',
    renda: 0,
    estadoCivil: 'Solteiro(a)',
    possuiFgts: false,
    isPrincipal: false,
    checklist: {
      hasFgtsContribution: false,
      hasDependent: false,
      declaresIncomeTax: false,
      ownsProperty: false,
      hasActiveFinancing: false,
      isFirstAcquisition: false
    },
    documentos: [
      { tipo: 'RG, CPF ou CNH', status: 'Pendente' },
      { tipo: 'Comprovante de residência', status: 'Pendente' },
      { tipo: 'Certidão de nascimento ou casamento', status: 'Pendente' },
      { tipo: 'Holerite dos últimos 2 meses', status: 'Pendente' },
      { tipo: 'Pró-labore dos últimos 3 meses', status: 'Pendente' },
      { tipo: 'Extrato do FGTS', status: 'Pendente' },
      { tipo: 'Declaração de Imposto de Renda', status: 'Pendente' }
    ]
  });

  const [newVendedor, setNewVendedor] = useState<Vendedor>({
    _id: '',
    nome: '',
    cpfCnpj: '',
    tipoPessoa: 'PF',
    banco: '',
    agencia: '',
    conta: '',
    tipoConta: 'Corrente',
    titularConta: '',
    cpfCnpjTitular: '',
    estadoCivil: '',
    conjugeVendedorId: undefined,
    vinculoVendedores: [],
    documentos: [
      { tipo: 'Documento de identificação', status: 'Pendente' },
      { tipo: 'Certidão de nascimento/casamento', status: 'Pendente' },
      { tipo: 'Comprovante de endereço', status: 'Pendente' }
    ]
  });

  const [showConjugeQuestion, setShowConjugeQuestion] = useState(false);
  const [isConjuge, setIsConjuge] = useState<boolean | null>(null);

  const [newPendencia, setNewPendencia] = useState({
    title: '',
    description: '',
    priority: 'Média',
    dueDate: '',
    responsiblePartyType: 'Interno',
    responsiblePartyDetails: '',
    bloqueiaFase: false
  });

  const [newTarefa, setNewTarefa] = useState({
    description: '',
    responsibleType: 'Interno',
    internalResponsibleId: '',
    externalResponsibleName: '',
    dueDate: ''
  });

  const [newDocumento, setNewDocumento] = useState({
    documentName: '',
    documentType: 'RG',
    documentStatus: 'Pendente',
    description: ''
  });

  // Function to auto-create or update principal proponent
  const ensurePrincipalProponent = async (atend: ServiceRecords, cpfValue: string) => {
    if (!atend.contactName || !cpfValue) {
      return;
    }

    try {
      // Check if principal proponent already exists
      const existingProponentePrincipal = proponentes.find(p => p.isPrincipal);
      
      if (!existingProponentePrincipal) {
        // Create new principal proponent
        const proponentePrincipal: Proponente = {
          _id: crypto.randomUUID(),
          nome: atend.contactName,
          cpf: cpfValue,
          telefone: atend.contactPhone || '',
          renda: 0,
          estadoCivil: 'Solteiro(a)',
          possuiFgts: false,
          isPrincipal: true,
          checklist: {
            hasFgtsContribution: false,
            hasDependent: false,
            declaresIncomeTax: false,
            ownsProperty: false,
            hasActiveFinancing: false,
            isFirstAcquisition: false
          },
          documentos: [
            { tipo: 'RG, CPF ou CNH', status: 'Pendente' },
            { tipo: 'Comprovante de residência', status: 'Pendente' },
            { tipo: 'Certidão de nascimento ou casamento', status: 'Pendente' },
            { tipo: 'Holerite dos últimos 2 meses', status: 'Pendente' },
            { tipo: 'Pró-labore dos últimos 3 meses', status: 'Pendente' },
            { tipo: 'Extrato do FGTS', status: 'Pendente' },
            { tipo: 'Declaração de Imposto de Renda', status: 'Pendente' }
          ]
        };
        
        setProponentes([proponentePrincipal, ...proponentes]);
        
        // Create checklist in database
        const checklistData: ChecklistdosProponentes = {
          _id: crypto.randomUUID(),
          atendimentoRef: atend._id,
          clientRef: proponentePrincipal._id,
          hasFgtsContribution: false,
          hasDependent: false,
          declaresIncomeTax: false,
          ownsProperty: false,
          hasActiveFinancing: false,
          isFirstAcquisition: false
        };
        await BaseCrudService.create('checklistproponentes', checklistData);
        
        await createHistoryEntry(`Proponente principal criado automaticamente: ${proponentePrincipal.nome}`);
        setPrincipalProponentCreated(true);
      } else {
        // Update existing principal proponent if data changed
        const hasChanges = 
          existingProponentePrincipal.nome !== atend.contactName ||
          existingProponentePrincipal.cpf !== cpfValue ||
          existingProponentePrincipal.telefone !== (atend.contactPhone || '');
        
        if (hasChanges) {
          const updatedProponentes = proponentes.map(p => {
            if (p.isPrincipal) {
              return {
                ...p,
                nome: atend.contactName || p.nome,
                cpf: cpfValue,
                telefone: atend.contactPhone || ''
              };
            }
            return p;
          });
          setProponentes(updatedProponentes);
          await createHistoryEntry(`Proponente principal atualizado automaticamente`);
        }
      }
    } catch (error) {
      console.error('Error ensuring principal proponent:', error);
    }
  };

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!atendimentoId) return;
      
      try {
        // Load main atendimento
        const atend = await BaseCrudService.getById<ServiceRecords>('atendimentos', atendimentoId);
        if (!atend) {
          navigate('/admin/financiamento-kanban');
          return;
        }
        setAtendimento(atend);
        
        // Calculate days in phase
        const entryDate = atend.dataPrevistaConclusao ? new Date(atend.dataPrevistaConclusao).toISOString() : new Date(atend._createdDate || new Date()).toISOString();
        setPhaseEntryDate(entryDate);
        const days = Math.floor((new Date().getTime() - new Date(entryDate).getTime()) / (1000 * 60 * 60 * 24));
        setDaysInPhase(days);
        
        setFormData({
          contactName: atend.contactName || '',
          cpf: '',
          contactPhone: atend.contactPhone || '',
          enderecoImovel: '',
          matriculaImovel: '',
          numeroContratoSiopi: '',
          numeroRegistroCartorio: '',
          valorImovel: 0,
          valorFinanciamentoDesejado: 0,
          valorFinanciamentoPossivelAprovado: 0,
          valorTaxaVista: 0,
          valorProdutoNegociado: 0,
          valorItbi: 0,
          valorPrenotacaoCartorio: 0,
          valorRegistro: 0,
          pagoTaxaVista: false,
          pagoItbi: false,
          pagoPrenotacao: false,
          pagoRegistro: false,
          possuiPropostaComercial: '',
          faseFinanciamento: atend.faseFinanciamento || 'novos-clientes',
          status: atend.status || 'Cadastro de cliente',
          creationDate: atend.creationDate?.toString() || new Date().toISOString()
        });

        // Load related data
        const [clientesRes, usuariosRes, pendenciasRes, tarefasRes, documentosRes, historicoRes, checklistRes] = await Promise.all([
          BaseCrudService.getAll<Clients>('clientes'),
          BaseCrudService.getAll<UsuriosdoSistema>('usuariossistema'),
          BaseCrudService.getAll<PendnciasdoFinanciamento>('pendenciasfinanciamento'),
          BaseCrudService.getAll<FinancingTasks>('tarefasfinanciamento'),
          BaseCrudService.getAll<DocumentosdoFinanciamento>('documentosfinanciamento'),
          BaseCrudService.getAll<HistricodeInteraes>('historicointeracoes'),
          BaseCrudService.getAll<ChecklistdosProponentes>('checklistproponentes')
        ]);

        setClientes(clientesRes.items);
        setUsuarios(usuariosRes.items);
        setPendencias(pendenciasRes.items.filter(p => p.atendimentoRef === atendimentoId));
        setTarefas(tarefasRes.items.filter(t => t.atendimentoRef === atendimentoId));
        setDocumentos(documentosRes.items.filter(d => d.atendimentoRef === atendimentoId));
        setHistorico(historicoRes.items.filter(h => h.atendimentoRef === atendimentoId).sort((a, b) => 
          new Date(b.interactionDate || '').getTime() - new Date(a.interactionDate || '').getTime()
        ));

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [atendimentoId, navigate]);

  // Auto-save function
  const handleAutoSave = async (field: string, value: any) => {
    if (!atendimento) return;
    
    try {
      const updates: Partial<ServiceRecords> = {
        _id: atendimento._id,
        [field]: value
      };
      
      await BaseCrudService.update('atendimentos', updates);
      
      // Create history entry
      await createHistoryEntry(`Campo "${field}" atualizado`);
      
      setAtendimento({ ...atendimento, ...updates });
      
      // Auto-create or update proponente principal when contactName or CPF changes
      if (field === 'contactName' || field === 'cpf') {
        const updatedAtendimento = { ...atendimento, ...updates };
        const cpfValue = field === 'cpf' ? value : formData.cpf;
        
        if (updatedAtendimento.contactName && cpfValue) {
          await ensurePrincipalProponent(updatedAtendimento, cpfValue);
        }
      }
    } catch (error) {
      console.error('Error auto-saving:', error);
    }
  };

  // Auto-create principal proponent when both contactName and CPF are filled
  useEffect(() => {
    if (atendimento && formData.contactName && formData.cpf && !principalProponentCreated && !loading) {
      ensurePrincipalProponent(atendimento, formData.cpf);
    }
  }, [atendimento, formData.contactName, formData.cpf, principalProponentCreated, loading]);

  // Create history entry
  const createHistoryEntry = async (description: string) => {
    if (!atendimento) return;
    
    try {
      const historyEntry: HistricodeInteraes = {
        _id: crypto.randomUUID(),
        atendimentoRef: atendimento._id,
        interactionDate: new Date().toISOString(),
        interactionType: 'Alteração',
        interactionDescription: description,
        autorTipo: 'Sistema',
        tipoEvento: 'Atualização'
      };
      
      await BaseCrudService.create('historicointeracoes', historyEntry);
      setHistorico([historyEntry, ...historico]);
    } catch (error) {
      console.error('Error creating history entry:', error);
    }
  };

  // Handle phase change
  const handlePhaseChange = async (newPhase: string, newSubPhase: string) => {
    if (!atendimento) return;
    
    try {
      const now = new Date().toISOString();
      
      await BaseCrudService.update('atendimentos', {
        _id: atendimento._id,
        faseFinanciamento: newPhase,
        status: newSubPhase,
        dataPrevistaConclusao: now
      });
      
      setPhaseEntryDate(now);
      setDaysInPhase(0);
      
      await createHistoryEntry(`Fase alterada para: ${newPhase} - ${newSubPhase}`);
      
      setAtendimento({
        ...atendimento,
        faseFinanciamento: newPhase,
        status: newSubPhase,
        dataPrevistaConclusao: now
      });
      
      setFormData({
        ...formData,
        faseFinanciamento: newPhase,
        status: newSubPhase
      });
    } catch (error) {
      console.error('Error changing phase:', error);
    }
  };

  // Add proponente
  const handleAddProponente = async () => {
    const proponente = { ...newProponente, _id: crypto.randomUUID() };
    setProponentes([...proponentes, proponente]);
    
    // Create checklist in database
    if (atendimento) {
      const checklistData: ChecklistdosProponentes = {
        _id: crypto.randomUUID(),
        atendimentoRef: atendimento._id,
        clientRef: proponente._id,
        hasFgtsContribution: proponente.checklist?.hasFgtsContribution || false,
        hasDependent: proponente.checklist?.hasDependent || false,
        declaresIncomeTax: proponente.checklist?.declaresIncomeTax || false,
        ownsProperty: proponente.checklist?.ownsProperty || false,
        hasActiveFinancing: proponente.checklist?.hasActiveFinancing || false,
        isFirstAcquisition: proponente.checklist?.isFirstAcquisition || false
      };
      await BaseCrudService.create('checklistproponentes', checklistData);
    }
    
    createHistoryEntry(`Proponente adicionado: ${proponente.nome}`);
    setNewProponente({
      _id: '',
      nome: '',
      cpf: '',
      telefone: '',
      renda: 0,
      estadoCivil: 'Solteiro(a)',
      possuiFgts: false,
      isPrincipal: false,
      checklist: {
        hasFgtsContribution: false,
        hasDependent: false,
        declaresIncomeTax: false,
        ownsProperty: false,
        hasActiveFinancing: false,
        isFirstAcquisition: false
      },
      documentos: [
        { tipo: 'RG, CPF ou CNH', status: 'Pendente' },
        { tipo: 'Comprovante de residência', status: 'Pendente' },
        { tipo: 'Certidão de nascimento ou casamento', status: 'Pendente' },
        { tipo: 'Holerite dos últimos 2 meses', status: 'Pendente' },
        { tipo: 'Pró-labore dos últimos 3 meses', status: 'Pendente' },
        { tipo: 'Extrato do FGTS', status: 'Pendente' },
        { tipo: 'Declaração de Imposto de Renda', status: 'Pendente' }
      ]
    });
    setShowAddProponenteDialog(false);
  };

  // Remove proponente
  const handleRemoveProponente = (id: string) => {
    const proponente = proponentes.find(p => p._id === id);
    if (proponente?.isPrincipal) {
      alert('Não é possível remover o proponente principal. Altere os dados do processo primeiro.');
      return;
    }
    setProponentes(proponentes.filter(p => p._id !== id));
    if (proponente) {
      createHistoryEntry(`Proponente removido: ${proponente.nome}`);
    }
  };

  // Update proponente checklist
  const handleUpdateProponenteChecklist = async (proponenteId: string, field: keyof Proponente['checklist'], value: boolean) => {
    const updatedProponentes = proponentes.map(p => {
      if (p._id === proponenteId && p.checklist) {
        return {
          ...p,
          checklist: {
            ...p.checklist,
            [field]: value
          }
        };
      }
      return p;
    });
    setProponentes(updatedProponentes);
    
    // Update in database
    if (atendimento) {
      const checklistRes = await BaseCrudService.getAll<ChecklistdosProponentes>('checklistproponentes');
      const existingChecklist = checklistRes.items.find(c => c.clientRef === proponenteId && c.atendimentoRef === atendimento._id);
      
      if (existingChecklist) {
        await BaseCrudService.update('checklistproponentes', {
          _id: existingChecklist._id,
          [field]: value
        });
      }
    }
    
    const proponente = proponentes.find(p => p._id === proponenteId);
    if (proponente) {
      await createHistoryEntry(`Checklist do proponente ${proponente.nome} atualizado: ${field} = ${value ? 'Sim' : 'Não'}`);
    }
  };

  // Toggle proponente documento
  const handleToggleProponenteDocumento = async (proponenteId: string, documentoTipo: string) => {
    const proponente = proponentes.find(p => p._id === proponenteId);
    if (!proponente) return;

    const updatedProponentes = proponentes.map(p => {
      if (p._id === proponenteId && p.documentos) {
        const updatedDocumentos = p.documentos.map(doc => {
          if (doc.tipo === documentoTipo) {
            const newStatus = doc.status === 'Pendente' ? 'Recebido' : 'Pendente';
            return {
              ...doc,
              status: newStatus as 'Pendente' | 'Recebido',
              dataRecebimento: newStatus === 'Recebido' ? new Date().toISOString() : undefined
            };
          }
          return doc;
        });
        return { ...p, documentos: updatedDocumentos };
      }
      return p;
    });

    setProponentes(updatedProponentes);

    const documento = proponente.documentos?.find(d => d.tipo === documentoTipo);
    if (documento) {
      const newStatus = documento.status === 'Pendente' ? 'Recebido' : 'Pendente';
      await createHistoryEntry(`Documento "${documentoTipo}" do proponente ${proponente.nome} marcado como ${newStatus}`);
    }
  };

  // Upload documento for proponente
  const handleUploadProponenteDocumento = (proponenteId: string, documentoTipo: string) => {
    const proponente = proponentes.find(p => p._id === proponenteId);
    if (proponente) {
      createHistoryEntry(`Upload de documento "${documentoTipo}" para proponente ${proponente.nome}`);
    }
  };

  // Remove documento from proponente (soft delete - mark as removed)
  const handleRemoveProponenteDocumento = async (proponenteId: string, documentoTipo: string) => {
    const proponente = proponentes.find(p => p._id === proponenteId);
    if (!proponente) return;

    // Check if it's a mandatory document (case-insensitive check)
    const mandatoryDocs = ['RG, CPF ou CNH', 'rg, cpf ou cnh'];
    const isMandatory = mandatoryDocs.some(doc => doc.toLowerCase() === documentoTipo.toLowerCase());
    
    if (isMandatory) {
      alert('Este documento é obrigatório e não pode ser removido. Apenas o status pode ser alterado.');
      return;
    }

    const updatedProponentes = proponentes.map(p => {
      if (p._id === proponenteId && p.documentos) {
        const updatedDocumentos = p.documentos.map(doc => {
          if (doc.tipo === documentoTipo) {
            return { ...doc, removed: true };
          }
          return doc;
        });
        return { ...p, documentos: updatedDocumentos };
      }
      return p;
    });

    setProponentes(updatedProponentes);
    await createHistoryEntry(`Documento "${documentoTipo}" do proponente ${proponente.nome} removido`);
  };

  // Restore removed documento for proponente
  const handleRestoreProponenteDocumento = async (proponenteId: string, documentoTipo: string) => {
    const proponente = proponentes.find(p => p._id === proponenteId);
    if (!proponente) return;

    const updatedProponentes = proponentes.map(p => {
      if (p._id === proponenteId && p.documentos) {
        const updatedDocumentos = p.documentos.map(doc => {
          if (doc.tipo === documentoTipo) {
            return { ...doc, removed: false };
          }
          return doc;
        });
        return { ...p, documentos: updatedDocumentos };
      }
      return p;
    });

    setProponentes(updatedProponentes);
    await createHistoryEntry(`Documento "${documentoTipo}" do proponente ${proponente.nome} restaurado`);
  };

  // Create pendencia from proponente documento
  const handleCreatePendenciaFromProponenteDoc = async (proponenteId: string, documentoTipo: string) => {
    if (!atendimento) return;

    const proponente = proponentes.find(p => p._id === proponenteId);
    if (!proponente) return;

    try {
      const now = new Date().toISOString();
      const pendencia: PendnciasdoFinanciamento = {
        _id: crypto.randomUUID(),
        atendimentoRef: atendimento._id,
        title: `Documento pendente: ${documentoTipo} - Proponente ${proponente.nome}`,
        description: `Documento "${documentoTipo}" do proponente ${proponente.nome} está pendente de recebimento.`,
        status: 'PENDENTE',
        priority: 'Alta',
        responsiblePartyType: 'Cliente',
        responsiblePartyDetails: proponente.nome,
        bloqueiaFase: false,
        creationDate: now,
        tipo: 'Documento',
        categoria: 'Proponente',
        dataUltimaAtualizacao: now
      };

      await BaseCrudService.create('pendenciasfinanciamento', pendencia);
      setPendencias([...pendencias, pendencia]);
      await createHistoryEntry(`Pendência criada automaticamente: ${pendencia.title}`);
    } catch (error) {
      console.error('Error creating pendencia:', error);
    }
  };

  // Add vendedor
  const handleAddVendedor = () => {
    const vendedorId = crypto.randomUUID();
    
    // Get all existing vendedores IDs to create vinculoVendedores
    const allVendedoresIds = vendedores.map(v => v._id);
    
    // Create new vendedor with automatic linking
    const vendedor: Vendedor = { 
      ...newVendedor, 
      _id: vendedorId,
      vinculoVendedores: allVendedoresIds // Link to all existing vendedores
    };
    
    // Update all existing vendedores to include the new vendedor in their vinculoVendedores
    const updatedVendedores = vendedores.map(v => ({
      ...v,
      vinculoVendedores: [...(v.vinculoVendedores || []), vendedorId]
    }));
    
    // Add new vendedor to the list
    setVendedores([...updatedVendedores, vendedor]);
    
    createHistoryEntry(`Vendedor adicionado: ${vendedor.nome}${vendedor.conjugeVendedorId ? ' (vinculado como cônjuge)' : ''}`);
    
    // Reset form
    setNewVendedor({
      _id: '',
      nome: '',
      cpfCnpj: '',
      tipoPessoa: 'PF',
      banco: '',
      agencia: '',
      conta: '',
      tipoConta: 'Corrente',
      titularConta: '',
      cpfCnpjTitular: '',
      estadoCivil: '',
      conjugeVendedorId: undefined,
      vinculoVendedores: [],
      documentos: [
        { tipo: 'Documento de identificação', status: 'Pendente' },
        { tipo: 'Certidão de nascimento/casamento', status: 'Pendente' },
        { tipo: 'Comprovante de endereço', status: 'Pendente' }
      ]
    });
    setShowConjugeQuestion(false);
    setIsConjuge(null);
    setShowAddVendedorDialog(false);
  };

  // Remove vendedor
  const handleRemoveVendedor = (id: string) => {
    const vendedor = vendedores.find(v => v._id === id);
    setVendedores(vendedores.filter(v => v._id !== id));
    if (vendedor) {
      createHistoryEntry(`Vendedor removido: ${vendedor.nome}`);
    }
  };

  // Toggle documento status for vendedor
  const handleToggleVendedorDocumento = async (vendedorId: string, documentoTipo: string) => {
    const vendedor = vendedores.find(v => v._id === vendedorId);
    if (!vendedor) return;

    const updatedVendedores = vendedores.map(v => {
      if (v._id === vendedorId) {
        const updatedDocumentos = v.documentos.map(doc => {
          if (doc.tipo === documentoTipo) {
            const newStatus = doc.status === 'Pendente' ? 'Recebido' : 'Pendente';
            return {
              ...doc,
              status: newStatus as 'Pendente' | 'Recebido',
              dataRecebimento: newStatus === 'Recebido' ? new Date().toISOString() : undefined
            };
          }
          return doc;
        });
        return { ...v, documentos: updatedDocumentos };
      }
      return v;
    });

    setVendedores(updatedVendedores);

    const documento = vendedor.documentos.find(d => d.tipo === documentoTipo);
    if (documento) {
      const newStatus = documento.status === 'Pendente' ? 'Recebido' : 'Pendente';
      await createHistoryEntry(`Documento "${documentoTipo}" do vendedor ${vendedor.nome} marcado como ${newStatus}`);
    }
  };

  // Upload documento for vendedor
  const handleUploadVendedorDocumento = (vendedorId: string, documentoTipo: string) => {
    // Placeholder for file upload functionality
    const vendedor = vendedores.find(v => v._id === vendedorId);
    if (vendedor) {
      createHistoryEntry(`Upload de documento "${documentoTipo}" para vendedor ${vendedor.nome}`);
    }
  };

  // Remove documento file for vendedor
  const handleRemoveVendedorDocumento = async (vendedorId: string, documentoTipo: string) => {
    const vendedor = vendedores.find(v => v._id === vendedorId);
    if (!vendedor) return;

    // Check if it's a mandatory document
    const mandatoryDocs = ['Documento de identificação', 'Certidão de nascimento/casamento'];
    if (mandatoryDocs.includes(documentoTipo)) {
      alert('Este documento é obrigatório e não pode ser removido. Apenas o status pode ser alterado.');
      return;
    }

    const updatedVendedores = vendedores.map(v => {
      if (v._id === vendedorId) {
        const updatedDocumentos = v.documentos.map(doc => {
          if (doc.tipo === documentoTipo) {
            return { ...doc, removed: true };
          }
          return doc;
        });
        return { ...v, documentos: updatedDocumentos };
      }
      return v;
    });

    setVendedores(updatedVendedores);
    await createHistoryEntry(`Documento "${documentoTipo}" do vendedor ${vendedor.nome} removido`);
  };

  // Restore removed documento for vendedor
  const handleRestoreVendedorDocumento = async (vendedorId: string, documentoTipo: string) => {
    const vendedor = vendedores.find(v => v._id === vendedorId);
    if (!vendedor) return;

    const updatedVendedores = vendedores.map(v => {
      if (v._id === vendedorId) {
        const updatedDocumentos = v.documentos.map(doc => {
          if (doc.tipo === documentoTipo) {
            return { ...doc, removed: false };
          }
          return doc;
        });
        return { ...v, documentos: updatedDocumentos };
      }
      return v;
    });

    setVendedores(updatedVendedores);
    await createHistoryEntry(`Documento "${documentoTipo}" do vendedor ${vendedor.nome} restaurado`);
  };

  // Create pendencia from vendedor documento
  const handleCreatePendenciaFromVendedorDoc = async (vendedorId: string, documentoTipo: string) => {
    if (!atendimento) return;

    const vendedor = vendedores.find(v => v._id === vendedorId);
    if (!vendedor) return;

    try {
      const now = new Date().toISOString();
      const pendencia: PendnciasdoFinanciamento = {
        _id: crypto.randomUUID(),
        atendimentoRef: atendimento._id,
        title: `Documento pendente: ${documentoTipo} - Vendedor ${vendedor.nome}`,
        description: `Documento "${documentoTipo}" do vendedor ${vendedor.nome} está pendente de recebimento.`,
        status: 'PENDENTE',
        priority: 'Alta',
        responsiblePartyType: 'Cliente',
        responsiblePartyDetails: vendedor.nome,
        bloqueiaFase: false,
        creationDate: now,
        tipo: 'Documento',
        categoria: 'Vendedor',
        dataUltimaAtualizacao: now
      };

      await BaseCrudService.create('pendenciasfinanciamento', pendencia);
      setPendencias([...pendencias, pendencia]);
      await createHistoryEntry(`Pendência criada automaticamente: ${pendencia.title}`);
    } catch (error) {
      console.error('Error creating pendencia:', error);
    }
  };

  // Add pendencia
  const handleAddPendencia = async () => {
    if (!atendimento || !newPendencia.title) return;
    
    try {
      const now = new Date().toISOString();
      const pendencia: PendnciasdoFinanciamento = {
        _id: crypto.randomUUID(),
        atendimentoRef: atendimento._id,
        title: newPendencia.title,
        description: newPendencia.description,
        status: 'PENDENTE',
        priority: newPendencia.priority,
        dueDate: newPendencia.dueDate,
        responsiblePartyType: newPendencia.responsiblePartyType,
        responsiblePartyDetails: newPendencia.responsiblePartyDetails,
        bloqueiaFase: newPendencia.bloqueiaFase,
        creationDate: now,
        dataUltimaAtualizacao: now
      };
      
      await BaseCrudService.create('pendenciasfinanciamento', pendencia);
      setPendencias([...pendencias, pendencia]);
      await createHistoryEntry(`Pendência criada: ${pendencia.title}`);
      
      setNewPendencia({
        title: '',
        description: '',
        priority: 'Média',
        dueDate: '',
        responsiblePartyType: 'Interno',
        responsiblePartyDetails: '',
        bloqueiaFase: false
      });
      setShowAddPendenciaDialog(false);
    } catch (error) {
      console.error('Error adding pendencia:', error);
    }
  };

  // Mark pendencia as resolved
  const handleResolvePendencia = async (id: string) => {
    const pendencia = pendencias.find(p => p._id === id);
    if (!pendencia) return;

    try {
      const now = new Date().toISOString();
      
      // Optimistic update - remove from active list immediately
      setPendencias(pendencias.filter(p => p._id !== id));
      
      // Update pendencia status in database
      await BaseCrudService.update('pendenciasfinanciamento', {
        _id: id,
        status: 'CONCLUÍDA',
        resolvedDate: now,
        dataHoraConclusao: now,
        concluidoPorRef: 'current-user-id', // TODO: Replace with actual user ID from auth context
        dataUltimaAtualizacao: now
      });
      
      // Create detailed history entry with type 'Pendencia_Concluida'
      const clientName = atendimento?.contactName || 'Cliente não identificado';
      const responsibleName = pendencia.responsiblePartyDetails || pendencia.responsiblePartyType || 'Não informado';
      
      const historyEntry: HistricodeInteraes = {
        _id: crypto.randomUUID(),
        atendimentoRef: atendimento?._id || '',
        interactionDate: now,
        interactionType: 'Pendencia_Concluida',
        interactionDescription: `Pendência concluída: ${pendencia.title} | Cliente: ${clientName} | Responsável: ${responsibleName} | Descrição: ${pendencia.description || 'Sem descrição'} | Criada em: ${pendencia.creationDate ? new Date(pendencia.creationDate).toLocaleDateString('pt-BR') : 'N/A'}`,
        autorTipo: 'Sistema',
        tipoEvento: 'Pendencia_Concluida'
      };
      
      await BaseCrudService.create('historicointeracoes', historyEntry);
      setHistorico([historyEntry, ...historico]);
      
      await createHistoryEntry(`Pendência "${pendencia.title}" marcada como concluída`);
    } catch (error) {
      console.error('Error resolving pendencia:', error);
      // Revert optimistic update on error
      const loadPendencias = async () => {
        const pendenciasRes = await BaseCrudService.getAll<PendnciasdoFinanciamento>('pendenciasfinanciamento');
        setPendencias(pendenciasRes.items.filter(p => p.atendimentoRef === atendimentoId));
      };
      loadPendencias();
    }
  };

  // Reopen pendencia
  const handleReopenPendencia = async (id: string) => {
    const pendencia = pendencias.find(p => p._id === id);
    if (!pendencia) return;

    try {
      const now = new Date().toISOString();
      
      // Optimistic update - add back to active list immediately
      const reopenedPendencia = { 
        ...pendencia, 
        status: 'PENDENTE', 
        dataUltimaAtualizacao: now,
        resolvedDate: undefined,
        dataHoraConclusao: undefined,
        concluidoPorRef: undefined
      };
      setPendencias([...pendencias.filter(p => p._id !== id), reopenedPendencia]);
      
      await BaseCrudService.update('pendenciasfinanciamento', {
        _id: id,
        status: 'PENDENTE',
        dataUltimaAtualizacao: now
      });
      
      await createHistoryEntry(`Pendência reaberta: ${pendencia.title}`);
    } catch (error) {
      console.error('Error reopening pendencia:', error);
    }
  };

  // Add tarefa
  const handleAddTarefa = async () => {
    if (!atendimento || !newTarefa.description) return;
    
    try {
      const tarefa: FinancingTasks = {
        _id: crypto.randomUUID(),
        atendimentoRef: atendimento._id,
        description: newTarefa.description,
        responsibleType: newTarefa.responsibleType,
        internalResponsibleId: newTarefa.internalResponsibleId,
        externalResponsibleName: newTarefa.externalResponsibleName,
        dueDate: newTarefa.dueDate,
        status: 'Pendente',
        creationDate: new Date().toISOString()
      };
      
      await BaseCrudService.create('tarefasfinanciamento', tarefa);
      setTarefas([...tarefas, tarefa]);
      await createHistoryEntry(`Tarefa criada: ${tarefa.description}`);
      
      setNewTarefa({
        description: '',
        responsibleType: 'Interno',
        internalResponsibleId: '',
        externalResponsibleName: '',
        dueDate: ''
      });
      setShowAddTarefaDialog(false);
    } catch (error) {
      console.error('Error adding tarefa:', error);
    }
  };

  // Complete tarefa
  const handleCompleteTarefa = async (id: string) => {
    try {
      await BaseCrudService.update('tarefasfinanciamento', {
        _id: id,
        status: 'Concluída'
      });
      
      const updatedTarefas = tarefas.map(t => 
        t._id === id ? { ...t, status: 'Concluída' } : t
      );
      setTarefas(updatedTarefas);
      
      const tarefa = tarefas.find(t => t._id === id);
      if (tarefa) {
        await createHistoryEntry(`Tarefa concluída: ${tarefa.description}`);
      }
    } catch (error) {
      console.error('Error completing tarefa:', error);
    }
  };

  // Reopen tarefa
  const handleReopenTarefa = async (id: string) => {
    try {
      await BaseCrudService.update('tarefasfinanciamento', {
        _id: id,
        status: 'Pendente'
      });
      
      const updatedTarefas = tarefas.map(t => 
        t._id === id ? { ...t, status: 'Pendente' } : t
      );
      setTarefas(updatedTarefas);
      
      const tarefa = tarefas.find(t => t._id === id);
      if (tarefa) {
        await createHistoryEntry(`Tarefa reaberta: ${tarefa.description}`);
      }
    } catch (error) {
      console.error('Error reopening tarefa:', error);
    }
  };

  // Add documento
  const handleAddDocumento = async () => {
    if (!atendimento || !newDocumento.documentName) return;
    
    try {
      const documento: DocumentosdoFinanciamento = {
        _id: crypto.randomUUID(),
        atendimentoRef: atendimento._id,
        documentName: newDocumento.documentName,
        documentType: newDocumento.documentType,
        documentStatus: newDocumento.documentStatus,
        description: newDocumento.description,
        uploadDate: new Date().toISOString(),
        origem: 'Sistema'
      };
      
      await BaseCrudService.create('documentosfinanciamento', documento);
      setDocumentos([...documentos, documento]);
      await createHistoryEntry(`Documento adicionado: ${documento.documentName}`);
      
      setNewDocumento({
        documentName: '',
        documentType: 'RG',
        documentStatus: 'Pendente',
        description: ''
      });
      setShowAddDocumentoDialog(false);
    } catch (error) {
      console.error('Error adding documento:', error);
    }
  };

  // Update documento status
  const handleUpdateDocumentoStatus = async (id: string, status: string) => {
    try {
      await BaseCrudService.update('documentosfinanciamento', {
        _id: id,
        documentStatus: status
      });
      
      const updatedDocumentos = documentos.map(d => 
        d._id === id ? { ...d, documentStatus: status } : d
      );
      setDocumentos(updatedDocumentos);
      
      const documento = documentos.find(d => d._id === id);
      if (documento) {
        await createHistoryEntry(`Status do documento "${documento.documentName}" alterado para: ${status}`);
      }
    } catch (error) {
      console.error('Error updating documento status:', error);
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
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-20">
          <p className="font-paragraph text-primary-foreground text-center">Atendimento não encontrado</p>
        </div>
        <Footer />
      </div>
    );
  }

  const daysBadgeColor = daysInPhase <= 3 ? 'bg-green-500' : daysInPhase <= 7 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="min-h-screen bg-primary">
      <Header />

      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-secondary/10 to-secondary/5 py-8">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/financiamento-kanban')}
                className="hover:bg-primary-foreground/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-heading text-3xl lg:text-4xl text-secondary">
                  {formData.contactName || 'Processo de Financiamento'}
                </h1>
                <p className="font-paragraph text-sm text-primary-foreground/70 mt-1">
                  ID: {atendimento._id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`${daysBadgeColor} text-white px-3 py-1`}>
                {daysInPhase} {daysInPhase === 1 ? 'dia' : 'dias'} nesta fase
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="w-full py-8">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-primary-foreground/10 mb-8">
              <TabsTrigger value="dados" className="font-paragraph">Dados do Processo</TabsTrigger>
              <TabsTrigger value="proponentes" className="font-paragraph">Proponente(s)</TabsTrigger>
              <TabsTrigger value="vendedores" className="font-paragraph">Vendedor(es)</TabsTrigger>
              <TabsTrigger value="pendencias" className="font-paragraph">Pendências e Tarefas</TabsTrigger>
              <TabsTrigger value="documentos" className="font-paragraph">Documentos</TabsTrigger>
              <TabsTrigger value="historico" className="font-paragraph">Histórico</TabsTrigger>
            </TabsList>

            {/* Tab: Dados do Processo */}
            <TabsContent value="dados" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-xl">Informações do Processo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-paragraph text-sm mb-2 block">Nome do Cliente Principal</Label>
                      <Input
                        value={formData.contactName}
                        onChange={(e) => {
                          setFormData({ ...formData, contactName: e.target.value });
                          handleAutoSave('contactName', e.target.value);
                        }}
                        className="h-10 bg-primary border-border-gray"
                      />
                    </div>
                    <div>
                      <Label className="font-paragraph text-sm mb-2 block">CPF</Label>
                      <Input
                        value={formData.cpf}
                        onChange={(e) => {
                          const { displayValue, isValid } = handleCPFInput(e.target.value);
                          setFormData({ ...formData, cpf: displayValue });
                          handleAutoSave('cpf', displayValue);
                        }}
                        placeholder="000.000.000-00"
                        className={`h-10 bg-primary border-border-gray ${
                          formData.cpf && 
                          formData.cpf.length === 14 && 
                          !validateCPF(formData.cpf)
                            ? 'border-red-500 border-2'
                            : ''
                        }`}
                      />
                      {formData.cpf && 
                       formData.cpf.length === 14 && 
                       !validateCPF(formData.cpf) && (
                        <p className="text-xs text-red-600 font-semibold mt-1">CPF inválido</p>
                      )}
                    </div>
                    <div>
                      <Label className="font-paragraph text-sm mb-2 block">Contato WhatsApp</Label>
                      <Input
                        value={formData.contactPhone}
                        onChange={(e) => {
                          setFormData({ ...formData, contactPhone: e.target.value });
                          handleAutoSave('contactPhone', e.target.value);
                        }}
                        placeholder="(11) 98765-4321"
                        className="h-10 bg-primary border-border-gray"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="font-paragraph text-sm mb-2 block">Endereço do Imóvel</Label>
                      <Input
                        value={formData.enderecoImovel}
                        onChange={(e) => {
                          setFormData({ ...formData, enderecoImovel: e.target.value });
                          handleAutoSave('enderecoImovel', e.target.value);
                        }}
                        placeholder="Rua, número, bairro, cidade - UF"
                        className="h-10 bg-primary border-border-gray"
                      />
                    </div>
                    <div>
                      <Label className="font-paragraph text-sm mb-2 block">Matrícula do Imóvel</Label>
                      <Input
                        value={formData.matriculaImovel}
                        onChange={(e) => {
                          setFormData({ ...formData, matriculaImovel: e.target.value });
                          handleAutoSave('matriculaImovel', e.target.value);
                        }}
                        className="h-10 bg-primary border-border-gray"
                      />
                    </div>
                    <div>
                      <Label className="font-paragraph text-sm mb-2 block">Nº Contrato SIOPI</Label>
                      <Input
                        value={formData.numeroContratoSiopi}
                        onChange={(e) => {
                          setFormData({ ...formData, numeroContratoSiopi: e.target.value });
                          handleAutoSave('numeroContratoSiopi', e.target.value);
                        }}
                        className="h-10 bg-primary border-border-gray"
                      />
                    </div>
                    <div>
                      <Label className="font-paragraph text-sm mb-2 block">Nº Protocolo do Cartório</Label>
                      <Input
                        value={formData.numeroRegistroCartorio}
                        onChange={(e) => {
                          setFormData({ ...formData, numeroRegistroCartorio: e.target.value });
                          handleAutoSave('numeroRegistroCartorio', e.target.value);
                        }}
                        className="h-10 bg-primary border-border-gray"
                      />
                    </div>
                    <div>
                      <Label className="font-paragraph text-sm mb-2 block">Fase Atual do Financiamento</Label>
                      <Select 
                        value={formData.faseFinanciamento} 
                        onValueChange={(value) => {
                          const phase = FINANCING_PHASES.find(p => p.id === value);
                          if (phase) {
                            handlePhaseChange(value, phase.subPhases[0]);
                          }
                        }}
                      >
                        <SelectTrigger className="h-10 bg-primary border-border-gray">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FINANCING_PHASES.map(phase => (
                            <SelectItem key={phase.id} value={phase.id}>{phase.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="font-paragraph text-sm mb-2 block">Subetapa Atual</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value) => handlePhaseChange(formData.faseFinanciamento, value)}
                      >
                        <SelectTrigger className="h-10 bg-primary border-border-gray">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FINANCING_PHASES.find(p => p.id === formData.faseFinanciamento)?.subPhases.map(subPhase => (
                            <SelectItem key={subPhase} value={subPhase}>{subPhase}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="font-paragraph text-sm mb-2 block">Data de Início do Processo</Label>
                      <Input
                        type="date"
                        value={formData.creationDate ? new Date(formData.creationDate).toISOString().split('T')[0] : ''}
                        disabled
                        className="h-10 bg-light-gray border-border-gray"
                      />
                    </div>
                    <div>
                      <Label className="font-paragraph text-sm mb-2 block">Data de Entrada na Fase Atual</Label>
                      <Input
                        type="date"
                        value={phaseEntryDate ? new Date(phaseEntryDate).toISOString().split('T')[0] : ''}
                        disabled
                        className="h-10 bg-light-gray border-border-gray"
                      />
                    </div>
                    <div>
                      <Label className="font-paragraph text-sm mb-2 block">Dias Nesta Fase</Label>
                      <div className="flex items-center gap-2">
                        <Badge className={`${daysBadgeColor} text-white px-4 py-2 text-base`}>
                          {daysInPhase} {daysInPhase === 1 ? 'dia' : 'dias'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Área Financeira */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-xl flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Área Financeira
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-paragraph text-sm mb-2 block">Valor do Imóvel</Label>
                      <Input
                        type="number"
                        value={formData.valorImovel}
                        onChange={(e) => {
                          setFormData({ ...formData, valorImovel: parseFloat(e.target.value) || 0 });
                          handleAutoSave('valorImovel', parseFloat(e.target.value) || 0);
                        }}
                        placeholder="0.00"
                        className="h-10 bg-primary border-border-gray"
                      />
                    </div>
                    <div>
                      <Label className="font-paragraph text-sm mb-2 block">Valor do Financiamento Desejado</Label>
                      <Input
                        type="number"
                        value={formData.valorFinanciamentoDesejado}
                        onChange={(e) => {
                          setFormData({ ...formData, valorFinanciamentoDesejado: parseFloat(e.target.value) || 0 });
                          handleAutoSave('valorFinanciamentoDesejado', parseFloat(e.target.value) || 0);
                        }}
                        placeholder="0.00"
                        className="h-10 bg-primary border-border-gray"
                      />
                    </div>
                    <div>
                      <Label className="font-paragraph text-sm mb-2 block">Valor do Financiamento Possível Aprovado</Label>
                      <Input
                        type="number"
                        value={formData.valorFinanciamentoPossivelAprovado}
                        onChange={(e) => {
                          setFormData({ ...formData, valorFinanciamentoPossivelAprovado: parseFloat(e.target.value) || 0 });
                          handleAutoSave('valorFinanciamentoPossivelAprovado', parseFloat(e.target.value) || 0);
                        }}
                        placeholder="0.00"
                        className="h-10 bg-primary border-border-gray"
                      />
                    </div>
                    <div>
                      <Label className="font-paragraph text-sm mb-2 block">Valor da Taxa à Vista</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={formData.valorTaxaVista}
                          onChange={(e) => {
                            setFormData({ ...formData, valorTaxaVista: parseFloat(e.target.value) || 0 });
                            handleAutoSave('valorTaxaVista', parseFloat(e.target.value) || 0);
                          }}
                          placeholder="0.00"
                          className="h-10 bg-primary border-border-gray flex-1"
                        />
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={formData.pagoTaxaVista}
                            onCheckedChange={(checked) => {
                              setFormData({ ...formData, pagoTaxaVista: checked as boolean });
                              handleAutoSave('pagoTaxaVista', checked);
                            }}
                          />
                          <Label className="font-paragraph text-xs whitespace-nowrap">Pago?</Label>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="font-paragraph text-sm mb-2 block">Valor do Produto Negociado</Label>
                      <Input
                        value={formatCurrency(formData.valorProdutoNegociado)}
                        onChange={(e) => {
                          const { displayValue, numericValue } = handleCurrencyInput(e.target.value);
                          setFormData({ ...formData, valorProdutoNegociado: numericValue });
                          handleAutoSave('valorProdutoNegociado', numericValue);
                        }}
                        placeholder="R$ 0,00"
                        className="h-10 bg-primary border-border-gray"
                      />
                    </div>
                    <div>
                      <Label className="font-paragraph text-sm mb-2 block">Valor do ITBI</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formatCurrency(formData.valorItbi)}
                          onChange={(e) => {
                            const { displayValue, numericValue } = handleCurrencyInput(e.target.value);
                            setFormData({ ...formData, valorItbi: numericValue });
                            handleAutoSave('valorItbi', numericValue);
                          }}
                          placeholder="R$ 0,00"
                          className="h-10 bg-primary border-border-gray flex-1"
                        />
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={formData.pagoItbi}
                            onCheckedChange={(checked) => {
                              setFormData({ ...formData, pagoItbi: checked as boolean });
                              handleAutoSave('pagoItbi', checked);
                            }}
                          />
                          <Label className="font-paragraph text-xs whitespace-nowrap">Pago?</Label>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="font-paragraph text-sm mb-2 block">Valor da Prenotação do Cartório</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formatCurrency(formData.valorPrenotacaoCartorio)}
                          onChange={(e) => {
                            const { displayValue, numericValue } = handleCurrencyInput(e.target.value);
                            setFormData({ ...formData, valorPrenotacaoCartorio: numericValue });
                            handleAutoSave('valorPrenotacaoCartorio', numericValue);
                          }}
                          placeholder="R$ 0,00"
                          className="h-10 bg-primary border-border-gray flex-1"
                        />
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={formData.pagoPrenotacao}
                            onCheckedChange={(checked) => {
                              setFormData({ ...formData, pagoPrenotacao: checked as boolean });
                              handleAutoSave('pagoPrenotacao', checked);
                            }}
                          />
                          <Label className="font-paragraph text-xs whitespace-nowrap">Pago?</Label>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="font-paragraph text-sm mb-2 block">Valor do Registro</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formatCurrency(formData.valorRegistro)}
                          onChange={(e) => {
                            const { displayValue, numericValue } = handleCurrencyInput(e.target.value);
                            setFormData({ ...formData, valorRegistro: numericValue });
                            handleAutoSave('valorRegistro', numericValue);
                          }}
                          placeholder="R$ 0,00"
                          className="h-10 bg-primary border-border-gray flex-1"
                        />
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={formData.pagoRegistro}
                            onCheckedChange={(checked) => {
                              setFormData({ ...formData, pagoRegistro: checked as boolean });
                              handleAutoSave('pagoRegistro', checked);
                            }}
                          />
                          <Label className="font-paragraph text-xs whitespace-nowrap">Pago?</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Proposta Comercial */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-xl">Proposta Comercial</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label className="font-paragraph text-sm mb-3 block">Possui proposta comercial? *</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="possuiPropostaComercial"
                          value="Sim"
                          checked={formData.possuiPropostaComercial === 'Sim'}
                          onChange={(e) => {
                            setFormData({ ...formData, possuiPropostaComercial: e.target.value });
                            handleAutoSave('possuiPropostaComercial', e.target.value);
                          }}
                          className="w-4 h-4"
                        />
                        <span className="font-paragraph text-sm">Sim</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="possuiPropostaComercial"
                          value="Não"
                          checked={formData.possuiPropostaComercial === 'Não'}
                          onChange={(e) => {
                            setFormData({ ...formData, possuiPropostaComercial: e.target.value });
                            handleAutoSave('possuiPropostaComercial', e.target.value);
                          }}
                          className="w-4 h-4"
                        />
                        <span className="font-paragraph text-sm">Não</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Proponentes */}
            <TabsContent value="proponentes" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="font-heading text-2xl text-primary-foreground">Lista de Proponentes</h2>
                <Dialog open={showAddProponenteDialog} onOpenChange={setShowAddProponenteDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Proponente
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Novo Proponente</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="font-paragraph text-sm mb-2 block">Nome Completo</Label>
                        <Input
                          value={newProponente.nome}
                          onChange={(e) => setNewProponente({ ...newProponente, nome: e.target.value })}
                          className="h-10 bg-primary border-border-gray"
                        />
                      </div>
                      <div>
                        <Label className="font-paragraph text-sm mb-2 block">CPF</Label>
                        <Input
                          value={newProponente.cpf}
                          onChange={(e) => {
                            const { displayValue, isValid } = handleCPFInput(e.target.value);
                            setNewProponente({ ...newProponente, cpf: displayValue });
                          }}
                          placeholder="000.000.000-00"
                          className={`h-10 bg-primary border-border-gray ${
                            newProponente.cpf && 
                            newProponente.cpf.length === 14 && 
                            !validateCPF(newProponente.cpf)
                              ? 'border-red-500 border-2'
                              : ''
                          }`}
                        />
                        {newProponente.cpf && 
                         newProponente.cpf.length === 14 && 
                         !validateCPF(newProponente.cpf) && (
                          <p className="text-xs text-red-600 font-semibold mt-1">CPF inválido</p>
                        )}
                      </div>
                      <div>
                        <Label className="font-paragraph text-sm mb-2 block">Telefone/WhatsApp</Label>
                        <Input
                          value={newProponente.telefone}
                          onChange={(e) => setNewProponente({ ...newProponente, telefone: e.target.value })}
                          placeholder="(11) 98765-4321"
                          className="h-10 bg-primary border-border-gray"
                        />
                      </div>
                      <div>
                        <Label className="font-paragraph text-sm mb-2 block">Renda Mensal</Label>
                        <Input
                          type="number"
                          value={newProponente.renda}
                          onChange={(e) => setNewProponente({ ...newProponente, renda: parseFloat(e.target.value) })}
                          placeholder="0.00"
                          className="h-10 bg-primary border-border-gray"
                        />
                      </div>
                      <div>
                        <Label className="font-paragraph text-sm mb-2 block">Estado Civil</Label>
                        <Select value={newProponente.estadoCivil} onValueChange={(value) => setNewProponente({ ...newProponente, estadoCivil: value })}>
                          <SelectTrigger className="h-10 bg-primary border-border-gray">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MARITAL_STATUS.map(status => (
                              <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={newProponente.possuiFgts}
                          onCheckedChange={(checked) => setNewProponente({ ...newProponente, possuiFgts: checked as boolean })}
                        />
                        <Label className="font-paragraph text-sm">Possui FGTS</Label>
                      </div>
                      <Button onClick={handleAddProponente} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                        Adicionar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {proponentes.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <User className="w-12 h-12 text-primary-foreground/30 mx-auto mb-3" />
                      <p className="font-paragraph text-primary-foreground/60">Nenhum proponente cadastrado</p>
                      <p className="font-paragraph text-sm text-primary-foreground/40 mt-1">
                        {formData.contactName && formData.cpf 
                          ? 'O proponente principal será criado automaticamente ao salvar os dados do processo'
                          : 'Preencha o Nome do Cliente Principal e CPF em "Dados do Processo" para habilitar esta aba'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  proponentes.map((proponente) => {
                    const totalDocs = proponente.documentos?.length || 0;
                    const recebidos = proponente.documentos?.filter(d => d.status === 'Recebido').length || 0;
                    const isComplete = totalDocs > 0 && recebidos === totalDocs;
                    const hasPending = totalDocs > 0 && recebidos < totalDocs;
                    const isExpanded = selectedVendedor === proponente._id;

                    return (
                      <motion.div
                        key={proponente._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative"
                      >
                        <Card 
                          className={`cursor-pointer transition-all border-2 ${
                            isExpanded 
                              ? 'border-secondary shadow-lg' 
                              : isComplete 
                                ? 'border-green-300 bg-green-50/50' 
                                : hasPending 
                                  ? 'border-yellow-300 bg-yellow-50/50' 
                                  : 'border-border-gray'
                          }`}
                          onClick={() => setSelectedVendedor(isExpanded ? null : proponente._id)}
                        >
                          <CardContent className="py-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    proponente.isPrincipal ? 'bg-secondary' : isComplete ? 'bg-green-500' : hasPending ? 'bg-yellow-500' : 'bg-gray-400'
                                  }`}>
                                    <User className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-heading text-lg font-semibold text-primary-foreground">{proponente.nome}</h3>
                                      {proponente.isPrincipal && (
                                        <Badge className="text-xs bg-secondary">Principal</Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <p className="font-paragraph text-xs text-primary-foreground/60">{proponente.cpf}</p>
                                      {totalDocs > 0 && (
                                        <Badge className={`text-xs ${isComplete ? 'bg-green-500' : 'bg-yellow-500'}`}>
                                          {recebidos}/{totalDocs} documentos
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {isExpanded && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-6 mt-4 pt-4 border-t"
                                  >
                                    {/* Dados Principais */}
                                    <div>
                                      <h4 className="font-heading text-sm font-semibold text-secondary mb-3 flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Dados Principais
                                      </h4>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-light-gray p-3 rounded">
                                        <div>
                                          <p className="font-paragraph text-xs text-primary-foreground/60 mb-1">Nome</p>
                                          <p className="font-paragraph text-sm font-semibold">{proponente.nome}</p>
                                        </div>
                                        <div>
                                          <p className="font-paragraph text-xs text-primary-foreground/60 mb-1">CPF</p>
                                          <p className="font-paragraph text-sm">{proponente.cpf}</p>
                                        </div>
                                        <div>
                                          <p className="font-paragraph text-xs text-primary-foreground/60 mb-1">Telefone</p>
                                          <p className="font-paragraph text-sm">{proponente.telefone}</p>
                                        </div>
                                        <div>
                                          <p className="font-paragraph text-xs text-primary-foreground/60 mb-1">Renda</p>
                                          <p className="font-paragraph text-sm">R$ {proponente.renda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        <div>
                                          <p className="font-paragraph text-xs text-primary-foreground/60 mb-1">Estado Civil</p>
                                          <p className="font-paragraph text-sm">{proponente.estadoCivil}</p>
                                        </div>
                                        <div>
                                          <p className="font-paragraph text-xs text-primary-foreground/60 mb-1">FGTS</p>
                                          <Badge className={proponente.possuiFgts ? 'bg-green-500' : 'bg-gray-400'}>
                                            {proponente.possuiFgts ? 'Sim' : 'Não'}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Checklist de Perguntas */}
                                    {proponente.checklist && (
                                      <div>
                                        <h4 className="font-heading text-sm font-semibold text-secondary mb-3 flex items-center gap-2">
                                          <CheckCircle className="w-4 h-4" />
                                          Checklist de Perguntas
                                        </h4>
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-3 p-2 bg-light-gray rounded">
                                            <Checkbox
                                              checked={proponente.checklist.hasFgtsContribution}
                                              onCheckedChange={(checked) => handleUpdateProponenteChecklist(proponente._id, 'hasFgtsContribution', checked as boolean)}
                                            />
                                            <Label className="font-paragraph text-sm flex-1">Possui 3 anos de contribuição FGTS?</Label>
                                          </div>
                                          <div className="flex items-center gap-3 p-2 bg-light-gray rounded">
                                            <Checkbox
                                              checked={proponente.checklist.hasDependent}
                                              onCheckedChange={(checked) => handleUpdateProponenteChecklist(proponente._id, 'hasDependent', checked as boolean)}
                                            />
                                            <Label className="font-paragraph text-sm flex-1">Possui dependente ou participante?</Label>
                                          </div>
                                          <div className="flex items-center gap-3 p-2 bg-light-gray rounded">
                                            <Checkbox
                                              checked={proponente.checklist.declaresIncomeTax}
                                              onCheckedChange={(checked) => handleUpdateProponenteChecklist(proponente._id, 'declaresIncomeTax', checked as boolean)}
                                            />
                                            <Label className="font-paragraph text-sm flex-1">Declara imposto de renda?</Label>
                                          </div>
                                          <div className="flex items-center gap-3 p-2 bg-light-gray rounded">
                                            <Checkbox
                                              checked={proponente.checklist.ownsProperty}
                                              onCheckedChange={(checked) => handleUpdateProponenteChecklist(proponente._id, 'ownsProperty', checked as boolean)}
                                            />
                                            <Label className="font-paragraph text-sm flex-1">Possui imóvel?</Label>
                                          </div>
                                          <div className="flex items-center gap-3 p-2 bg-light-gray rounded">
                                            <Checkbox
                                              checked={proponente.checklist.hasActiveFinancing}
                                              onCheckedChange={(checked) => handleUpdateProponenteChecklist(proponente._id, 'hasActiveFinancing', checked as boolean)}
                                            />
                                            <Label className="font-paragraph text-sm flex-1">Possui financiamento ativo?</Label>
                                          </div>
                                          <div className="flex items-center gap-3 p-2 bg-light-gray rounded">
                                            <Checkbox
                                              checked={proponente.checklist.isFirstAcquisition}
                                              onCheckedChange={(checked) => handleUpdateProponenteChecklist(proponente._id, 'isFirstAcquisition', checked as boolean)}
                                            />
                                            <Label className="font-paragraph text-sm flex-1">Primeira aquisição no âmbito SFH?</Label>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Checklist de Documentos */}
                                    {proponente.documentos && proponente.documentos.length > 0 && (
                                      <div>
                                        <h4 className="font-heading text-sm font-semibold text-secondary mb-3 flex items-center gap-2">
                                          <FileText className="w-4 h-4" />
                                          Checklist de Documentos
                                        </h4>
                                        <div className="space-y-2">
                                          {proponente.documentos.filter(doc => !doc.removed).map((doc) => {
                                            const isMandatory = doc.tipo === 'RG, CPF ou CNH';
                                            return (
                                              <div 
                                                key={doc.tipo} 
                                                className={`p-3 rounded border-2 transition-all ${
                                                  doc.status === 'Recebido' 
                                                    ? 'bg-green-50 border-green-300' 
                                                    : 'bg-yellow-50 border-yellow-300'
                                                }`}
                                              >
                                                <div className="flex items-start gap-3">
                                                  <Checkbox
                                                    checked={doc.status === 'Recebido'}
                                                    onCheckedChange={() => handleToggleProponenteDocumento(proponente._id, doc.tipo)}
                                                    className="mt-1"
                                                  />
                                                  <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                      <FileText className={`w-4 h-4 ${doc.status === 'Recebido' ? 'text-green-600' : 'text-yellow-600'}`} />
                                                      <span className="font-paragraph text-sm font-semibold">{doc.tipo}</span>
                                                      {isMandatory && (
                                                        <Badge className="text-xs bg-red-500">Obrigatório</Badge>
                                                      )}
                                                      <Badge className={`text-xs ml-auto ${doc.status === 'Recebido' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                                                        {doc.status}
                                                      </Badge>
                                                    </div>
                                                    {doc.dataRecebimento && (
                                                      <p className="font-paragraph text-xs text-primary-foreground/60 mb-2">
                                                        Recebido em: {new Date(doc.dataRecebimento).toLocaleDateString('pt-BR')}
                                                      </p>
                                                    )}
                                                    <div className="flex gap-2">
                                                      <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleUploadProponenteDocumento(proponente._id, doc.tipo)}
                                                        className="h-8 text-xs"
                                                      >
                                                        <Upload className="w-3 h-3 mr-1" />
                                                        Upload
                                                      </Button>
                                                      {!isMandatory && (
                                                        <Button
                                                          size="sm"
                                                          variant="outline"
                                                          onClick={() => handleRemoveProponenteDocumento(proponente._id, doc.tipo)}
                                                          className="h-8 text-xs text-destructive"
                                                        >
                                                          <Trash2 className="w-3 h-3 mr-1" />
                                                          Excluir
                                                        </Button>
                                                      )}
                                                      {doc.status === 'Pendente' && (
                                                        <Button
                                                          size="sm"
                                                          variant="outline"
                                                          onClick={() => handleCreatePendenciaFromProponenteDoc(proponente._id, doc.tipo)}
                                                          className="h-8 text-xs"
                                                        >
                                                          <AlertCircle className="w-3 h-3 mr-1" />
                                                          Criar Pendência
                                                        </Button>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                          {proponente.documentos.filter(doc => doc.removed).length > 0 && (
                                            <div className="mt-4 pt-4 border-t">
                                              <h5 className="font-heading text-xs font-semibold text-primary-foreground/60 mb-2">Documentos Removidos</h5>
                                              <div className="space-y-2">
                                                {proponente.documentos.filter(doc => doc.removed).map((doc) => (
                                                  <div key={doc.tipo} className="p-2 rounded bg-gray-100 border border-gray-300 flex items-center justify-between">
                                                    <span className="font-paragraph text-xs text-primary-foreground/60">{doc.tipo}</span>
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => handleRestoreProponenteDocumento(proponente._id, doc.tipo)}
                                                      className="h-7 text-xs"
                                                    >
                                                      <RotateCcw className="w-3 h-3 mr-1" />
                                                      Restaurar
                                                    </Button>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </div>

                              <div className="flex flex-col gap-2">
                                {!proponente.isPrincipal && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveProponente(proponente._id);
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </TabsContent>

            {/* Tab: Vendedores */}
            <TabsContent value="vendedores" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="font-heading text-2xl text-primary-foreground">Vendedores do Processo</h2>
                <Dialog open={showAddVendedorDialog} onOpenChange={setShowAddVendedorDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Vendedor
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="font-heading text-xl">Novo Vendedor</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* Dados Principais */}
                      <div className="space-y-4">
                        <h3 className="font-heading text-base font-semibold text-secondary flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Dados Principais
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="font-paragraph text-sm mb-2 block">Nome Completo *</Label>
                            <Input
                              value={newVendedor.nome}
                              onChange={(e) => setNewVendedor({ ...newVendedor, nome: e.target.value })}
                              placeholder="Nome do vendedor"
                              className="h-10 bg-primary border-border-gray"
                            />
                          </div>
                          <div>
                            <Label className="font-paragraph text-sm mb-2 block">Tipo de Pessoa *</Label>
                            <Select value={newVendedor.tipoPessoa} onValueChange={(value: 'PF' | 'PJ') => setNewVendedor({ ...newVendedor, tipoPessoa: value })}>
                              <SelectTrigger className="h-10 bg-primary border-border-gray">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PF">Pessoa Física</SelectItem>
                                <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-2">
                            <Label className="font-paragraph text-sm mb-2 block">
                              {newVendedor.tipoPessoa === 'PF' ? 'CPF *' : 'CNPJ *'}
                            </Label>
                            <Input
                              value={newVendedor.cpfCnpj}
                              onChange={(e) => {
                                if (newVendedor.tipoPessoa === 'PF') {
                                  const { displayValue, isValid } = handleCPFInput(e.target.value);
                                  setNewVendedor({ ...newVendedor, cpfCnpj: displayValue });
                                } else {
                                  setNewVendedor({ ...newVendedor, cpfCnpj: e.target.value });
                                }
                              }}
                              placeholder={newVendedor.tipoPessoa === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                              className={`h-10 bg-primary border-border-gray ${
                                newVendedor.tipoPessoa === 'PF' && 
                                newVendedor.cpfCnpj && 
                                newVendedor.cpfCnpj.length === 14 && 
                                !validateCPF(newVendedor.cpfCnpj)
                                  ? 'border-red-500 border-2'
                                  : ''
                              }`}
                            />
                            {newVendedor.tipoPessoa === 'PF' && 
                             newVendedor.cpfCnpj && 
                             newVendedor.cpfCnpj.length === 14 && 
                             !validateCPF(newVendedor.cpfCnpj) && (
                              <p className="text-xs text-red-600 font-semibold mt-1">CPF inválido</p>
                            )}
                          </div>
                          {newVendedor.tipoPessoa === 'PF' && (
                            <div className="md:col-span-2">
                              <Label className="font-paragraph text-sm mb-2 block">Estado Civil</Label>
                              <Select 
                                value={newVendedor.estadoCivil} 
                                onValueChange={(value) => {
                                  setNewVendedor({ ...newVendedor, estadoCivil: value });
                                  // Show conjugal question if married or in stable union
                                  if (value === 'Casado(a)' || value === 'União Estável') {
                                    setShowConjugeQuestion(true);
                                  } else {
                                    setShowConjugeQuestion(false);
                                    setIsConjuge(null);
                                    setNewVendedor({ ...newVendedor, estadoCivil: value, conjugeVendedorId: undefined });
                                  }
                                }}
                              >
                                <SelectTrigger className="h-10 bg-primary border-border-gray">
                                  <SelectValue placeholder="Selecione o estado civil" />
                                </SelectTrigger>
                                <SelectContent>
                                  {MARITAL_STATUS.map(status => (
                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          {showConjugeQuestion && vendedores.length > 0 && (
                            <div className="md:col-span-2 p-4 bg-yellow-50 border-2 border-yellow-300 rounded">
                              <Label className="font-paragraph text-sm mb-3 block font-semibold">
                                Este vendedor é cônjuge de outro vendedor deste processo?
                              </Label>
                              <div className="flex gap-4 mb-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="isConjuge"
                                    checked={isConjuge === true}
                                    onChange={() => setIsConjuge(true)}
                                    className="w-4 h-4"
                                  />
                                  <span className="font-paragraph text-sm">Sim</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="isConjuge"
                                    checked={isConjuge === false}
                                    onChange={() => {
                                      setIsConjuge(false);
                                      setNewVendedor({ ...newVendedor, conjugeVendedorId: undefined });
                                    }}
                                    className="w-4 h-4"
                                  />
                                  <span className="font-paragraph text-sm">Não</span>
                                </label>
                              </div>
                              {isConjuge === true && (
                                <div>
                                  <Label className="font-paragraph text-sm mb-2 block">Selecione o cônjuge</Label>
                                  <Select 
                                    value={newVendedor.conjugeVendedorId} 
                                    onValueChange={(value) => setNewVendedor({ ...newVendedor, conjugeVendedorId: value })}
                                  >
                                    <SelectTrigger className="h-10 bg-primary border-border-gray">
                                      <SelectValue placeholder="Selecione o vendedor cônjuge" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {vendedores.map(v => (
                                        <SelectItem key={v._id} value={v._id}>
                                          {v.nome} - {v.cpfCnpj}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Dados Bancários */}
                      <div className="space-y-4 border-t pt-4">
                        <h3 className="font-heading text-base font-semibold text-secondary flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Dados Bancários
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="font-paragraph text-sm mb-2 block">Banco *</Label>
                            <Input
                              value={newVendedor.banco}
                              onChange={(e) => setNewVendedor({ ...newVendedor, banco: e.target.value })}
                              placeholder="Ex: Banco do Brasil"
                              className="h-10 bg-primary border-border-gray"
                            />
                          </div>
                          <div>
                            <Label className="font-paragraph text-sm mb-2 block">Agência *</Label>
                            <Input
                              value={newVendedor.agencia}
                              onChange={(e) => setNewVendedor({ ...newVendedor, agencia: e.target.value })}
                              placeholder="0000"
                              className="h-10 bg-primary border-border-gray"
                            />
                          </div>
                          <div>
                            <Label className="font-paragraph text-sm mb-2 block">Conta *</Label>
                            <Input
                              value={newVendedor.conta}
                              onChange={(e) => setNewVendedor({ ...newVendedor, conta: e.target.value })}
                              placeholder="00000-0"
                              className="h-10 bg-primary border-border-gray"
                            />
                          </div>
                          <div>
                            <Label className="font-paragraph text-sm mb-2 block">Tipo de Conta *</Label>
                            <Select value={newVendedor.tipoConta} onValueChange={(value: 'Corrente' | 'Poupança') => setNewVendedor({ ...newVendedor, tipoConta: value })}>
                              <SelectTrigger className="h-10 bg-primary border-border-gray">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Corrente">Conta Corrente</SelectItem>
                                <SelectItem value="Poupança">Conta Poupança</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="font-paragraph text-sm mb-2 block">Titular da Conta *</Label>
                            <Input
                              value={newVendedor.titularConta}
                              onChange={(e) => setNewVendedor({ ...newVendedor, titularConta: e.target.value })}
                              placeholder="Nome do titular"
                              className="h-10 bg-primary border-border-gray"
                            />
                          </div>
                          <div>
                            <Label className="font-paragraph text-sm mb-2 block">CPF/CNPJ do Titular *</Label>
                            <Input
                              value={newVendedor.cpfCnpjTitular}
                              onChange={(e) => {
                                // Apply CPF mask for PF, no mask for PJ
                                if (newVendedor.tipoPessoa === 'PF') {
                                  const { displayValue, isValid } = handleCPFInput(e.target.value);
                                  setNewVendedor({ ...newVendedor, cpfCnpjTitular: displayValue });
                                } else {
                                  setNewVendedor({ ...newVendedor, cpfCnpjTitular: e.target.value });
                                }
                              }}
                              placeholder="000.000.000-00"
                              className={`h-10 bg-primary border-border-gray ${
                                newVendedor.tipoPessoa === 'PF' && 
                                newVendedor.cpfCnpjTitular && 
                                newVendedor.cpfCnpjTitular.length === 14 && 
                                !validateCPF(newVendedor.cpfCnpjTitular)
                                  ? 'border-red-500 border-2'
                                  : ''
                              }`}
                            />
                            {newVendedor.tipoPessoa === 'PF' && 
                             newVendedor.cpfCnpjTitular && 
                             newVendedor.cpfCnpjTitular.length === 14 && 
                             !validateCPF(newVendedor.cpfCnpjTitular) && (
                              <p className="text-xs text-red-600 font-semibold mt-1">CPF inválido</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button 
                        onClick={handleAddVendedor} 
                        className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        disabled={!newVendedor.nome || !newVendedor.cpfCnpj || !newVendedor.banco || !newVendedor.agencia || !newVendedor.conta || !newVendedor.titularConta || !newVendedor.cpfCnpjTitular}
                      >
                        Adicionar Vendedor
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {vendedores.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Building2 className="w-12 h-12 text-primary-foreground/30 mx-auto mb-3" />
                    <p className="font-paragraph text-primary-foreground/60">Nenhum vendedor cadastrado</p>
                    <p className="font-paragraph text-sm text-primary-foreground/40 mt-1">Adicione vendedores para gerenciar a documentação</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {/* Show linked vendedores info if there are multiple */}
                  {vendedores.length > 1 && (
                    <Card className="border-2 border-secondary bg-secondary/5">
                      <CardContent className="py-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-heading text-base font-semibold text-secondary">
                              Vendedores Vinculados ao Processo
                            </h3>
                            <p className="font-paragraph text-xs text-primary-foreground/60">
                              Todos os vendedores deste processo estão automaticamente vinculados entre si
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {vendedores.map((v) => (
                            <Badge key={v._id} className="bg-secondary text-white">
                              {v.nome}
                              {v.conjugeVendedorId && (
                                <span className="ml-1 text-xs">(cônjuge)</span>
                              )}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {vendedores.map((vendedor) => {
                    const isSelected = selectedVendedor === vendedor._id;
                    const totalDocs = vendedor.documentos.length;
                    const recebidos = vendedor.documentos.filter(d => d.status === 'Recebido').length;
                    const isComplete = recebidos === totalDocs;
                    const hasPending = recebidos < totalDocs;

                    return (
                      <motion.div
                        key={vendedor._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative"
                      >
                        <Card 
                          className={`cursor-pointer transition-all border-2 ${
                            isSelected 
                              ? 'border-secondary shadow-lg' 
                              : isComplete 
                                ? 'border-green-300 bg-green-50/50' 
                                : hasPending 
                                  ? 'border-red-300 bg-red-50/50' 
                                  : 'border-border-gray'
                          }`}
                          onClick={() => setSelectedVendedor(isSelected ? null : vendedor._id)}
                        >
                          <CardContent className="py-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    isComplete ? 'bg-green-500' : hasPending ? 'bg-red-500' : 'bg-gray-400'
                                  }`}>
                                    <User className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="font-heading text-lg font-semibold text-primary-foreground">{vendedor.nome}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge className="text-xs">{vendedor.tipoPessoa}</Badge>
                                      <Badge className={`text-xs ${isComplete ? 'bg-green-500' : 'bg-red-500'}`}>
                                        {recebidos}/{totalDocs} documentos
                                      </Badge>
                                      {vendedor.conjugeVendedorId && (
                                        <Badge className="text-xs bg-pink-500">
                                          Cônjuge vinculado
                                        </Badge>
                                      )}
                                      {vendedor.vinculoVendedores && vendedor.vinculoVendedores.length > 0 && (
                                        <Badge className="text-xs bg-secondary">
                                          Vinculado a {vendedor.vinculoVendedores.length} vendedor(es)
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {isSelected && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-6 mt-4 pt-4 border-t"
                                  >
                                    {/* Dados Principais */}
                                    <div>
                                      <h4 className="font-heading text-sm font-semibold text-secondary mb-3 flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Dados Principais
                                      </h4>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-light-gray p-3 rounded">
                                        <div>
                                          <p className="font-paragraph text-xs text-primary-foreground/60 mb-1">Nome</p>
                                          <p className="font-paragraph text-sm font-semibold">{vendedor.nome}</p>
                                        </div>
                                        <div>
                                          <p className="font-paragraph text-xs text-primary-foreground/60 mb-1">Tipo</p>
                                          <p className="font-paragraph text-sm">{vendedor.tipoPessoa === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</p>
                                        </div>
                                        <div>
                                          <p className="font-paragraph text-xs text-primary-foreground/60 mb-1">{vendedor.tipoPessoa === 'PF' ? 'CPF' : 'CNPJ'}</p>
                                          <p className="font-paragraph text-sm">{vendedor.cpfCnpj}</p>
                                        </div>
                                        {vendedor.estadoCivil && (
                                          <div>
                                            <p className="font-paragraph text-xs text-primary-foreground/60 mb-1">Estado Civil</p>
                                            <p className="font-paragraph text-sm">{vendedor.estadoCivil}</p>
                                          </div>
                                        )}
                                        {vendedor.conjugeVendedorId && (
                                          <div className="md:col-span-2">
                                            <p className="font-paragraph text-xs text-primary-foreground/60 mb-1">Cônjuge</p>
                                            <div className="flex items-center gap-2">
                                              <Badge className="bg-pink-500 text-white">
                                                {vendedores.find(v => v._id === vendedor.conjugeVendedorId)?.nome || 'Vendedor não encontrado'}
                                              </Badge>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Vendedores Vinculados */}
                                      {vendedor.vinculoVendedores && vendedor.vinculoVendedores.length > 0 && (
                                        <div className="mt-3 p-3 bg-secondary/5 border border-secondary/20 rounded">
                                          <p className="font-paragraph text-xs text-primary-foreground/60 mb-2 font-semibold">
                                            Vendedores vinculados ao mesmo processo:
                                          </p>
                                          <div className="flex flex-wrap gap-2">
                                            {vendedor.vinculoVendedores.map((vinculoId) => {
                                              const vinculado = vendedores.find(v => v._id === vinculoId);
                                              if (!vinculado) return null;
                                              return (
                                                <Badge key={vinculoId} className="bg-secondary text-white text-xs">
                                                  {vinculado.nome}
                                                </Badge>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Dados Bancários */}
                                    <div>
                                      <h4 className="font-heading text-sm font-semibold text-secondary mb-3 flex items-center gap-2">
                                        <CreditCard className="w-4 h-4" />
                                        Dados Bancários
                                      </h4>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-light-gray p-3 rounded">
                                        <div>
                                          <p className="font-paragraph text-xs text-primary-foreground/60 mb-1">Banco</p>
                                          <p className="font-paragraph text-sm font-semibold">{vendedor.banco}</p>
                                        </div>
                                        <div>
                                          <p className="font-paragraph text-xs text-primary-foreground/60 mb-1">Agência</p>
                                          <p className="font-paragraph text-sm">{vendedor.agencia}</p>
                                        </div>
                                        <div>
                                          <p className="font-paragraph text-xs text-primary-foreground/60 mb-1">Conta</p>
                                          <p className="font-paragraph text-sm">{vendedor.conta}</p>
                                        </div>
                                        <div>
                                          <p className="font-paragraph text-xs text-primary-foreground/60 mb-1">Tipo de Conta</p>
                                          <p className="font-paragraph text-sm">{vendedor.tipoConta}</p>
                                        </div>
                                        <div>
                                          <p className="font-paragraph text-xs text-primary-foreground/60 mb-1">Titular</p>
                                          <p className="font-paragraph text-sm">{vendedor.titularConta}</p>
                                        </div>
                                        <div>
                                          <p className="font-paragraph text-xs text-primary-foreground/60 mb-1">CPF/CNPJ Titular</p>
                                          <p className="font-paragraph text-sm">{vendedor.cpfCnpjTitular}</p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Checklist de Documentos */}
                                    <div>
                                      <h4 className="font-heading text-sm font-semibold text-secondary mb-3 flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Checklist de Documentos
                                      </h4>
                                      <div className="space-y-2">
                                        {vendedor.documentos.filter(doc => !doc.removed).map((doc) => {
                                          const isMandatory = ['Documento de identificação', 'Certidão de nascimento/casamento'].includes(doc.tipo);
                                          return (
                                            <div 
                                              key={doc.tipo} 
                                              className={`p-3 rounded border-2 transition-all ${
                                                doc.status === 'Recebido' 
                                                  ? 'bg-green-50 border-green-300' 
                                                  : 'bg-red-50 border-red-300'
                                              }`}
                                            >
                                              <div className="flex items-start gap-3">
                                                <Checkbox
                                                  checked={doc.status === 'Recebido'}
                                                  onCheckedChange={() => handleToggleVendedorDocumento(vendedor._id, doc.tipo)}
                                                  className="mt-1"
                                                />
                                                <div className="flex-1">
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <FileText className={`w-4 h-4 ${doc.status === 'Recebido' ? 'text-green-600' : 'text-red-600'}`} />
                                                    <span className="font-paragraph text-sm font-semibold">{doc.tipo}</span>
                                                    {isMandatory && (
                                                      <Badge className="text-xs bg-red-500">Obrigatório</Badge>
                                                    )}
                                                    <Badge className={`text-xs ml-auto ${doc.status === 'Recebido' ? 'bg-green-500' : 'bg-red-500'}`}>
                                                      {doc.status}
                                                    </Badge>
                                                  </div>
                                                  {doc.dataRecebimento && (
                                                    <p className="font-paragraph text-xs text-primary-foreground/60 mb-2">
                                                      Recebido em: {new Date(doc.dataRecebimento).toLocaleDateString('pt-BR')}
                                                    </p>
                                                  )}
                                                  <div className="flex gap-2">
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => handleUploadVendedorDocumento(vendedor._id, doc.tipo)}
                                                      className="h-8 text-xs"
                                                    >
                                                      <Upload className="w-3 h-3 mr-1" />
                                                      Upload
                                                    </Button>
                                                    {!isMandatory && (
                                                      <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleRemoveVendedorDocumento(vendedor._id, doc.tipo)}
                                                        className="h-8 text-xs text-destructive"
                                                      >
                                                        <Trash2 className="w-3 h-3 mr-1" />
                                                        Excluir
                                                      </Button>
                                                    )}
                                                    {doc.status === 'Pendente' && (
                                                      <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleCreatePendenciaFromVendedorDoc(vendedor._id, doc.tipo)}
                                                        className="h-8 text-xs"
                                                      >
                                                        <AlertCircle className="w-3 h-3 mr-1" />
                                                        Criar Pendência
                                                      </Button>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                        {vendedor.documentos.filter(doc => doc.removed).length > 0 && (
                                          <div className="mt-4 pt-4 border-t">
                                            <h5 className="font-heading text-xs font-semibold text-primary-foreground/60 mb-2">Documentos Removidos</h5>
                                            <div className="space-y-2">
                                              {vendedor.documentos.filter(doc => doc.removed).map((doc) => (
                                                <div key={doc.tipo} className="p-2 rounded bg-gray-100 border border-gray-300 flex items-center justify-between">
                                                  <span className="font-paragraph text-xs text-primary-foreground/60">{doc.tipo}</span>
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleRestoreVendedorDocumento(vendedor._id, doc.tipo)}
                                                    className="h-7 text-xs"
                                                  >
                                                    <RotateCcw className="w-3 h-3 mr-1" />
                                                    Restaurar
                                                  </Button>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </div>

                              <div className="flex flex-col gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveVendedor(vendedor._id);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Tab: Pendências e Tarefas */}
            <TabsContent value="pendencias" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pendências Column */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-heading text-xl text-secondary font-semibold">Pendências Ativas</h3>
                    <Dialog open={showAddPendenciaDialog} onOpenChange={setShowAddPendenciaDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                          <Plus className="w-4 h-4 mr-2" />
                          Nova Pendência
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Nova Pendência</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label className="font-paragraph text-sm mb-2 block">Título</Label>
                            <Input
                              value={newPendencia.title}
                              onChange={(e) => setNewPendencia({ ...newPendencia, title: e.target.value })}
                              className="h-10 bg-primary border-border-gray"
                            />
                          </div>
                          <div>
                            <Label className="font-paragraph text-sm mb-2 block">Descrição</Label>
                            <Textarea
                              value={newPendencia.description}
                              onChange={(e) => setNewPendencia({ ...newPendencia, description: e.target.value })}
                              rows={3}
                              className="bg-primary border-border-gray resize-none"
                            />
                          </div>
                          <div>
                            <Label className="font-paragraph text-sm mb-2 block">Prioridade</Label>
                            <Select value={newPendencia.priority} onValueChange={(value) => setNewPendencia({ ...newPendencia, priority: value })}>
                              <SelectTrigger className="h-10 bg-primary border-border-gray">
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
                            <Label className="font-paragraph text-sm mb-2 block">Prazo</Label>
                            <Input
                              type="datetime-local"
                              value={newPendencia.dueDate}
                              onChange={(e) => setNewPendencia({ ...newPendencia, dueDate: e.target.value })}
                              className="h-10 bg-primary border-border-gray"
                            />
                          </div>
                          <div>
                            <Label className="font-paragraph text-sm mb-2 block">Responsável</Label>
                            <Select value={newPendencia.responsiblePartyType} onValueChange={(value) => setNewPendencia({ ...newPendencia, responsiblePartyType: value })}>
                              <SelectTrigger className="h-10 bg-primary border-border-gray">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {RESPONSIBLE_TYPES.map(type => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={newPendencia.bloqueiaFase}
                              onCheckedChange={(checked) => setNewPendencia({ ...newPendencia, bloqueiaFase: checked as boolean })}
                            />
                            <Label className="font-paragraph text-sm">Bloqueia mudança de fase</Label>
                          </div>
                          <Button onClick={handleAddPendencia} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                            Criar Pendência
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-3">
                    {pendencias.filter(p => p.status !== 'CONCLUÍDA').length === 0 ? (
                      <Card>
                        <CardContent className="py-8 text-center">
                          <p className="font-paragraph text-primary-foreground/60 text-sm">Nenhuma pendência ativa</p>
                        </CardContent>
                      </Card>
                    ) : (
                      pendencias
                        .filter(p => p.status !== 'CONCLUÍDA')
                        .sort((a, b) => {
                          // Sort by priority first (Alta > Média > Baixa)
                          const priorityOrder = { 'Alta': 0, 'Média': 1, 'Baixa': 2 };
                          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
                          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;
                          
                          if (aPriority !== bPriority) {
                            return aPriority - bPriority;
                          }
                          
                          // Then sort by overdue status
                          const aOverdue = new Date(a.dueDate || '') < new Date();
                          const bOverdue = new Date(b.dueDate || '') < new Date();
                          if (aOverdue && !bOverdue) return -1;
                          if (!aOverdue && bOverdue) return 1;
                          
                          // Finally sort by due date
                          return new Date(a.dueDate || '').getTime() - new Date(b.dueDate || '').getTime();
                        })
                        .map((pendencia) => {
                          const isOverdue = new Date(pendencia.dueDate || '') < new Date();
                          const bgColor = isOverdue ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-300';
                          
                          return (
                            <Card key={pendencia._id} className={`border-2 ${bgColor}`}>
                              <CardContent className="py-3">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <h4 className="font-heading text-sm font-semibold flex-1">{pendencia.title}</h4>
                                  {isOverdue && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                                </div>
                                <p className="font-paragraph text-xs text-primary-foreground/70 mb-2">{pendencia.description}</p>
                                <div className="flex flex-wrap gap-2 mb-3">
                                  <Badge className={`text-xs ${
                                    pendencia.priority === 'Alta' ? 'bg-red-500' :
                                    pendencia.priority === 'Média' ? 'bg-yellow-500' :
                                    'bg-blue-500'
                                  }`}>{pendencia.priority}</Badge>
                                  <Badge className="text-xs">{pendencia.status || 'PENDENTE'}</Badge>
                                  <Badge className="text-xs">{pendencia.responsiblePartyType}</Badge>
                                </div>
                                {pendencia.dueDate && (
                                  <p className="font-paragraph text-xs text-primary-foreground/60 mb-3">
                                    Prazo: {new Date(pendencia.dueDate).toLocaleDateString('pt-BR')}
                                  </p>
                                )}
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => handleResolvePendencia(pendencia._id)} className="flex-1 h-8 text-xs">
                                    <Check className="w-3 h-3 mr-1" />
                                    Marcar como concluída
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                    )}
                  </div>

                  {/* Histórico de Pendências Concluídas */}
                  <div className="mt-6">
                    <button
                      onClick={() => setShowHistoricoPendencias(!showHistoricoPendencias)}
                      className="w-full flex items-center justify-between p-3 bg-light-gray rounded hover:bg-primary-foreground/10 transition-colors"
                    >
                      <h4 className="font-heading text-sm font-semibold text-primary-foreground">
                        Histórico de Pendências (Concluídas)
                      </h4>
                      {showHistoricoPendencias ? (
                        <ChevronUp className="w-4 h-4 text-primary-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-primary-foreground" />
                      )}
                    </button>

                    {showHistoricoPendencias && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 mt-3"
                      >
                        {pendencias.filter(p => p.status === 'CONCLUÍDA').length === 0 ? (
                          <Card>
                            <CardContent className="py-8 text-center">
                              <p className="font-paragraph text-primary-foreground/60 text-sm">Nenhuma pendência concluída</p>
                            </CardContent>
                          </Card>
                        ) : (
                          pendencias
                            .filter(p => p.status === 'CONCLUÍDA')
                            .sort((a, b) => new Date(b.dataHoraConclusao || b.resolvedDate || '').getTime() - new Date(a.dataHoraConclusao || a.resolvedDate || '').getTime())
                            .map((pendencia) => (
                              <Card key={pendencia._id} className="border-2 bg-green-50 border-green-300">
                                <CardContent className="py-3">
                                  <div className="flex items-start justify-between gap-3 mb-2">
                                    <h4 className="font-heading text-sm font-semibold flex-1">{pendencia.title}</h4>
                                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                  </div>
                                  <p className="font-paragraph text-xs text-primary-foreground/70 mb-2">{pendencia.description}</p>
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    <Badge className="text-xs bg-green-500">{pendencia.status}</Badge>
                                    <Badge className="text-xs">{pendencia.priority}</Badge>
                                    <Badge className="text-xs">{pendencia.responsiblePartyType}</Badge>
                                  </div>
                                  {(pendencia.dataHoraConclusao || pendencia.resolvedDate) && (
                                    <p className="font-paragraph text-xs text-primary-foreground/60 mb-3">
                                      Concluída em: {new Date(pendencia.dataHoraConclusao || pendencia.resolvedDate || '').toLocaleDateString('pt-BR')} às {new Date(pendencia.dataHoraConclusao || pendencia.resolvedDate || '').toLocaleTimeString('pt-BR')}
                                    </p>
                                  )}
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleReopenPendencia(pendencia._id)} className="flex-1 h-8 text-xs">
                                      <RotateCcw className="w-3 h-3 mr-1" />
                                      Reabrir
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Tarefas Column */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-heading text-xl text-secondary font-semibold">Tarefas</h3>
                    <Dialog open={showAddTarefaDialog} onOpenChange={setShowAddTarefaDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                          <Plus className="w-4 h-4 mr-2" />
                          Nova Tarefa
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Nova Tarefa</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label className="font-paragraph text-sm mb-2 block">Descrição</Label>
                            <Textarea
                              value={newTarefa.description}
                              onChange={(e) => setNewTarefa({ ...newTarefa, description: e.target.value })}
                              rows={3}
                              className="bg-primary border-border-gray resize-none"
                            />
                          </div>
                          <div>
                            <Label className="font-paragraph text-sm mb-2 block">Tipo de Responsável</Label>
                            <Select value={newTarefa.responsibleType} onValueChange={(value) => setNewTarefa({ ...newTarefa, responsibleType: value })}>
                              <SelectTrigger className="h-10 bg-primary border-border-gray">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {RESPONSIBLE_TYPES.map(type => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {newTarefa.responsibleType === 'Interno' && (
                            <div>
                              <Label className="font-paragraph text-sm mb-2 block">Usuário Responsável</Label>
                              <Select value={newTarefa.internalResponsibleId} onValueChange={(value) => setNewTarefa({ ...newTarefa, internalResponsibleId: value })}>
                                <SelectTrigger className="h-10 bg-primary border-border-gray">
                                  <SelectValue placeholder="Selecione um usuário" />
                                </SelectTrigger>
                                <SelectContent>
                                  {usuarios.map(user => (
                                    <SelectItem key={user._id} value={user._id}>{user.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          {newTarefa.responsibleType !== 'Interno' && (
                            <div>
                              <Label className="font-paragraph text-sm mb-2 block">Nome do Responsável Externo</Label>
                              <Input
                                value={newTarefa.externalResponsibleName}
                                onChange={(e) => setNewTarefa({ ...newTarefa, externalResponsibleName: e.target.value })}
                                className="h-10 bg-primary border-border-gray"
                              />
                            </div>
                          )}
                          <div>
                            <Label className="font-paragraph text-sm mb-2 block">Prazo</Label>
                            <Input
                              type="datetime-local"
                              value={newTarefa.dueDate}
                              onChange={(e) => setNewTarefa({ ...newTarefa, dueDate: e.target.value })}
                              className="h-10 bg-primary border-border-gray"
                            />
                          </div>
                          <Button onClick={handleAddTarefa} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                            Criar Tarefa
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-3">
                    {tarefas.filter(t => t.status !== 'Concluída').length === 0 ? (
                      <Card>
                        <CardContent className="py-8 text-center">
                          <p className="font-paragraph text-primary-foreground/60 text-sm">Nenhuma tarefa ativa</p>
                        </CardContent>
                      </Card>
                    ) : (
                      tarefas
                        .filter(t => t.status !== 'Concluída')
                        .sort((a, b) => {
                          // Sort by overdue first, then by due date
                          const aOverdue = new Date(a.dueDate || '') < new Date();
                          const bOverdue = new Date(b.dueDate || '') < new Date();
                          if (aOverdue && !bOverdue) return -1;
                          if (!aOverdue && bOverdue) return 1;
                          return new Date(a.dueDate || '').getTime() - new Date(b.dueDate || '').getTime();
                        })
                        .map((tarefa) => {
                          const isOverdue = new Date(tarefa.dueDate || '') < new Date();
                          const bgColor = isOverdue ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-300';
                          
                          return (
                            <Card key={tarefa._id} className={`border-2 ${bgColor}`}>
                              <CardContent className="py-3">
                                <div className="flex items-start gap-2 mb-2">
                                  {isOverdue ? (
                                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                  ) : (
                                    <Clock className="w-4 h-4 text-primary-foreground/60 flex-shrink-0 mt-0.5" />
                                  )}
                                  <p className="font-paragraph text-sm flex-1">{tarefa.description}</p>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-3">
                                  <Badge className="text-xs">{tarefa.status}</Badge>
                                  <Badge className="text-xs">{tarefa.responsibleType}</Badge>
                                </div>
                                {tarefa.dueDate && (
                                  <p className="font-paragraph text-xs text-primary-foreground/60 mb-3">
                                    Prazo: {new Date(tarefa.dueDate).toLocaleDateString('pt-BR')}
                                  </p>
                                )}
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => handleCompleteTarefa(tarefa._id)} className="flex-1 h-8 text-xs">
                                    <Check className="w-3 h-3 mr-1" />
                                    Concluir
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                    )}
                  </div>

                  {/* Histórico de Tarefas Concluídas */}
                  {tarefas.filter(t => t.status === 'Concluída').length > 0 && (
                    <div className="mt-6">
                      <button
                        onClick={() => setShowHistoricoPendencias(!showHistoricoPendencias)}
                        className="w-full flex items-center justify-between p-3 bg-light-gray rounded hover:bg-primary-foreground/10 transition-colors"
                      >
                        <h4 className="font-heading text-sm font-semibold text-primary-foreground">
                          Histórico de Tarefas (Concluídas)
                        </h4>
                        {showHistoricoPendencias ? (
                          <ChevronUp className="w-4 h-4 text-primary-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-primary-foreground" />
                        )}
                      </button>

                      {showHistoricoPendencias && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3 mt-3"
                        >
                          {tarefas
                            .filter(t => t.status === 'Concluída')
                            .sort((a, b) => new Date(b._updatedDate || '').getTime() - new Date(a._updatedDate || '').getTime())
                            .map((tarefa) => (
                              <Card key={tarefa._id} className="border-2 bg-green-50 border-green-300">
                                <CardContent className="py-3">
                                  <div className="flex items-start gap-2 mb-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                    <p className="font-paragraph text-sm flex-1">{tarefa.description}</p>
                                  </div>
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    <Badge className="text-xs bg-green-500">{tarefa.status}</Badge>
                                    <Badge className="text-xs">{tarefa.responsibleType}</Badge>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleReopenTarefa(tarefa._id)} className="flex-1 h-8 text-xs">
                                      <RotateCcw className="w-3 h-3 mr-1" />
                                      Reabrir
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab: Documentos */}
            <TabsContent value="documentos" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="font-heading text-2xl text-primary-foreground">Documentos do Processo</h2>
                <Dialog open={showAddDocumentoDialog} onOpenChange={setShowAddDocumentoDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Documento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Novo Documento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="font-paragraph text-sm mb-2 block">Nome do Documento</Label>
                        <Input
                          value={newDocumento.documentName}
                          onChange={(e) => setNewDocumento({ ...newDocumento, documentName: e.target.value })}
                          className="h-10 bg-primary border-border-gray"
                        />
                      </div>
                      <div>
                        <Label className="font-paragraph text-sm mb-2 block">Tipo</Label>
                        <Select value={newDocumento.documentType} onValueChange={(value) => setNewDocumento({ ...newDocumento, documentType: value })}>
                          <SelectTrigger className="h-10 bg-primary border-border-gray">
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
                        <Label className="font-paragraph text-sm mb-2 block">Status</Label>
                        <Select value={newDocumento.documentStatus} onValueChange={(value) => setNewDocumento({ ...newDocumento, documentStatus: value })}>
                          <SelectTrigger className="h-10 bg-primary border-border-gray">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_STATUS_OPTIONS.map(status => (
                              <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="font-paragraph text-sm mb-2 block">Descrição</Label>
                        <Textarea
                          value={newDocumento.description}
                          onChange={(e) => setNewDocumento({ ...newDocumento, description: e.target.value })}
                          rows={3}
                          className="bg-primary border-border-gray resize-none"
                        />
                      </div>
                      <Button onClick={handleAddDocumento} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                        Adicionar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                {documentos.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="font-paragraph text-primary-foreground/60">Nenhum documento cadastrado</p>
                    </CardContent>
                  </Card>
                ) : (
                  documentos.map((documento) => (
                    <Card key={documento._id}>
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <FileText className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="font-heading text-sm font-semibold mb-1">{documento.documentName}</h4>
                              <p className="font-paragraph text-xs text-primary-foreground/70 mb-2">{documento.description}</p>
                              <div className="flex flex-wrap gap-2 mb-2">
                                <Badge className="text-xs">{documento.documentType}</Badge>
                                <Badge className={`text-xs ${
                                  documento.documentStatus === 'Aprovado' ? 'bg-green-500' :
                                  documento.documentStatus === 'Rejeitado' ? 'bg-red-500' :
                                  documento.documentStatus === 'Recebido' ? 'bg-blue-500' :
                                  'bg-yellow-500'
                                }`}>
                                  {documento.documentStatus}
                                </Badge>
                              </div>
                              {documento.uploadDate && (
                                <p className="font-paragraph text-xs text-primary-foreground/60">
                                  Enviado em: {new Date(documento.uploadDate).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Select value={documento.documentStatus} onValueChange={(value) => handleUpdateDocumentoStatus(documento._id, value)}>
                              <SelectTrigger className="h-8 text-xs w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DOCUMENT_STATUS_OPTIONS.map(status => (
                                  <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Tab: Histórico */}
            <TabsContent value="historico" className="space-y-6">
              <h2 className="font-heading text-2xl text-primary-foreground">Linha do Tempo do Processo</h2>
              
              <div className="space-y-4">
                {historico.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="font-paragraph text-primary-foreground/60">Nenhum histórico registrado</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border-gray"></div>
                    {historico.map((entry, index) => {
                      const isPendenciaConcluida = entry.interactionType === 'Pendencia_Concluida';
                      
                      return (
                        <motion.div
                          key={entry._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="relative pl-12 pb-8"
                        >
                          <div className={`absolute left-2 top-1 w-4 h-4 rounded-full border-2 border-primary ${
                            isPendenciaConcluida ? 'bg-green-500' : 'bg-secondary'
                          }`}></div>
                          <Card className={isPendenciaConcluida ? 'border-2 border-green-300 bg-green-50/30' : ''}>
                            <CardContent className="py-3">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-heading text-sm font-semibold">
                                      {isPendenciaConcluida ? 'Pendência Concluída' : entry.interactionDescription}
                                    </h4>
                                    {isPendenciaConcluida && (
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    )}
                                  </div>
                                  {isPendenciaConcluida && (
                                    <div className="mt-2 space-y-1 text-xs text-primary-foreground/70">
                                      {entry.interactionDescription?.split(' | ').map((part, i) => (
                                        <p key={i} className="font-paragraph">{part}</p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <Badge className={`text-xs ${isPendenciaConcluida ? 'bg-green-500' : ''}`}>
                                  {entry.interactionType}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-primary-foreground/60">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{new Date(entry.interactionDate || '').toLocaleDateString('pt-BR')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{new Date(entry.interactionDate || '').toLocaleTimeString('pt-BR')}</span>
                                </div>
                                {entry.autorTipo && (
                                  <div className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    <span>{entry.autorTipo}</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
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
