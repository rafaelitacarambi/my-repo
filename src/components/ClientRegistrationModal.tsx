import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { AlertCircle, Check, TrendingUp, Building2, Gavel, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BaseCrudService } from '@/integrations';
import { Clients, ServiceRecords, Imveis, UsuriosdoSistema } from '@/entities';
// LeadRegistrationModal import removed
import { formatCPF, handleCPFInput, validateCPF } from '@/lib/input-masks';

interface ClientRegistrationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (clientId: string) => void;
}

const ROLES = [
  { id: 'Comprador', label: 'Comprador' },
  { id: 'Vendedor', label: 'Vendedor' },
  { id: 'Locatário', label: 'Locatário' },
  { id: 'Locador', label: 'Locador' },
  { id: 'Investidor', label: 'Investidor' },
  { id: 'Parceiro', label: 'Parceiro' },
  { id: 'Construtora / Incorporadora', label: 'Construtora / Incorporadora' },
  { id: 'Prestador', label: 'Prestador' },
];

export function ClientRegistrationModal({
  isOpen,
  onOpenChange,
  onSuccess,
}: ClientRegistrationModalProps) {
  const [step, setStep] = useState<'form' | 'roles' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<{ client: Clients; services: ServiceRecords[] } | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  // createLead removed
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);
  // showLeadModal removed
  const [properties, setProperties] = useState<Imveis[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [brokers, setBrokers] = useState<UsuriosdoSistema[]>([]);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    clientName: '',
    email: '',
    phoneNumber: '',
    cpfCnpj: '',
    address: '',
    notes: '',
    gender: 'Masculino' as 'Masculino' | 'Feminino' | 'Outro',
    origemCliente: '',        // new: origin source
    corretorOrigemId: '',     // new: broker id if origin is a broker
  });

  const isCPFInvalid = formData.cpfCnpj.length === 14 && !validateCPF(formData.cpfCnpj);

  const resetForm = () => {
    setFormData({
      clientName: '',
      email: '',
      phoneNumber: '',
      cpfCnpj: '',
      address: '',
      notes: '',
      gender: 'Masculino',
      origemCliente: '',
      corretorOrigemId: '',
    });
    setSelectedRoles([]);
    // setCreateLead and setShowLeadModal calls removed
    setError(null);
    setDuplicateWarning(null);
    setStep('form');
    setCreatedClientId(null);
    // setShowLeadModal removed
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const checkDuplicateClient = async (): Promise<{ client: Clients; services: ServiceRecords[] } | null> => {
    try {
      let duplicateClient: Clients | null = null;

      // 1. Search by CPF/CNPJ with formatting fallbacks
      if (formData.cpfCnpj) {
        const rawDoc = formData.cpfCnpj.trim();
        const sanitizedDoc = rawDoc.replace(/\D/g, '');
        
        // Exact input search
        let { items } = await BaseCrudService.getAll<Clients>('clientes', undefined, { 
          filterField: 'document', 
          filterValue: rawDoc 
        });
        
        if (items.length > 0) {
          duplicateClient = items[0];
        }

        // Sanitized search
        if (!duplicateClient && sanitizedDoc && sanitizedDoc !== rawDoc) {
          const res = await BaseCrudService.getAll<Clients>('clientes', undefined, { 
            filterField: 'document', 
            filterValue: sanitizedDoc 
          });
          if (res.items.length > 0) duplicateClient = res.items[0];
        }

        // Formatted CPF search
        if (!duplicateClient && sanitizedDoc.length === 11) {
          const formattedCpf = sanitizedDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
          const res = await BaseCrudService.getAll<Clients>('clientes', undefined, { 
            filterField: 'document', 
            filterValue: formattedCpf 
          });
          if (res.items.length > 0) duplicateClient = res.items[0];
        }

        // Formatted CNPJ search
        if (!duplicateClient && sanitizedDoc.length === 14) {
          const formattedCnpj = sanitizedDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
          const res = await BaseCrudService.getAll<Clients>('clientes', undefined, { 
            filterField: 'document', 
            filterValue: formattedCnpj 
          });
          if (res.items.length > 0) duplicateClient = res.items[0];
        }
      }

      // 2. Search by Email with lowercase fallback
      if (!duplicateClient && formData.email) {
        const cleanEmail = formData.email.trim().toLowerCase();
        let { items } = await BaseCrudService.getAll<Clients>('clientes', undefined, { 
          filterField: 'email', 
          filterValue: cleanEmail 
        });
        if (items.length > 0) {
          duplicateClient = items[0];
        } else if (cleanEmail !== formData.email.trim()) {
          const res = await BaseCrudService.getAll<Clients>('clientes', undefined, { 
            filterField: 'email', 
            filterValue: formData.email.trim() 
          });
          if (res.items.length > 0) duplicateClient = res.items[0];
        }
      }

      // 3. Search by Phone Number via database query
      if (!duplicateClient && formData.phoneNumber) {
        const rawPhone = formData.phoneNumber.trim();
        const sanitizedPhone = rawPhone.replace(/\D/g, '');

        let { items } = await BaseCrudService.getAll<Clients>('clientes', undefined, { 
          filterField: 'phone', 
          filterValue: rawPhone 
        });

        if (items.length > 0) {
          duplicateClient = items[0];
        } else if (sanitizedPhone && sanitizedPhone !== rawPhone) {
          const res = await BaseCrudService.getAll<Clients>('clientes', undefined, { 
            filterField: 'phone', 
            filterValue: sanitizedPhone 
          });
          if (res.items.length > 0) duplicateClient = res.items[0];
        }
      }

      // 4. Local fallback for address matching
      if (!duplicateClient && formData.address) {
        const { items: allClients } = await BaseCrudService.getAll<Clients>('clientes');
        const match = allClients.find(
          (c) => formData.address && c.address?.toLowerCase().trim() === formData.address?.toLowerCase().trim()
        );
        if (match) duplicateClient = match;
      }

      if (duplicateClient) {
        const { items: allServices } = await BaseCrudService.getAll<ServiceRecords>('atendimentos');
        const clientServices = allServices.filter(s => s.clientePrincipalRef === duplicateClient!._id && !s.isArchived);
        return { client: duplicateClient, services: clientServices };
      }

      return null;
    } catch (e) {
      console.error('Error in checkDuplicateClient:', e);
      return null;
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDuplicateWarning(null);

    if (!formData.clientName.trim()) {
      setError('Nome do cliente é obrigatório');
      return;
    }

    if (!formData.email && !formData.phoneNumber) {
      setError('Email ou telefone é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const duplicate = await checkDuplicateClient();
      if (duplicate) {
        setDuplicateWarning(duplicate);
        setLoading(false);
        return;
      }

      // Move to roles step (now optional)
      setStep('roles');
    } catch (err) {
      setError('Erro ao verificar cliente duplicado');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
  };

  const handleCreateClient = async () => {
    // Roles are now optional - no validation needed
    setLoading(true);
    setError(null);

    try {
      const clientId = crypto.randomUUID();

      // Create client with optional roles saved in papeis field
      await BaseCrudService.create('clientes', {
        _id: clientId,
        clientName: formData.clientName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        cpfCnpj: formData.cpfCnpj,
        address: formData.address,
        notes: formData.notes,
        status: 'Ativo',
        papeis: selectedRoles.length > 0 ? selectedRoles.join(', ') : undefined,
        canalOrigem: formData.origemCliente || undefined,
        responsavelInternoId: formData.corretorOrigemId || undefined,
      });

      setCreatedClientId(clientId);

      setStep('success');
    } catch (err: any) {
      console.error('Erro ao criar cliente:', err);
      const isUniqueViolation = err.message?.includes('P2002') || err.message?.includes('unique') || err.message?.includes('violates') || err.message?.includes('conflict') || err.message?.includes('Duplicado') || err.message?.includes('já existe');
      
      if (isUniqueViolation) {
        try {
          toast.info("Este cliente já está cadastrado. Carregando dados para vinculação...");
          let existingClient: Clients | null = null;
          
          if (formData.cpfCnpj) {
            const rawDoc = formData.cpfCnpj.trim();
            const sanitizedDoc = rawDoc.replace(/\D/g, '');
            const { items } = await BaseCrudService.getAll<Clients>('clientes', undefined, { 
              filterField: 'document', 
              filterValue: rawDoc 
            });
            if (items.length > 0) {
              existingClient = items[0];
            } else if (sanitizedDoc) {
              const res = await BaseCrudService.getAll<Clients>('clientes', undefined, { 
                filterField: 'document', 
                filterValue: sanitizedDoc 
              });
              if (res.items.length > 0) existingClient = res.items[0];
            }
          }
          
          if (!existingClient && formData.email) {
            const { items } = await BaseCrudService.getAll<Clients>('clientes', undefined, { 
              filterField: 'email', 
              filterValue: formData.email.trim().toLowerCase() 
            });
            if (items.length > 0) existingClient = items[0];
          }

          if (existingClient) {
            const { items: allServices } = await BaseCrudService.getAll<ServiceRecords>('atendimentos');
            const clientServices = allServices.filter(s => s.clientePrincipalRef === existingClient!._id && !s.isArchived);
            
            setDuplicateWarning({ client: existingClient, services: clientServices });
            setStep('form');
            return;
          }
        } catch (searchErr) {
          console.error("Erro ao buscar duplicado após detecção de erro P2002:", searchErr);
        }
      }

      let msg = 'Erro ao criar cliente';
      if (err.message?.includes('P2002')) {
        msg = 'Já existe um cliente com este CPF/CNPJ ou e-mail cadastrado no sistema.';
      } else if (err.message) {
        msg = `Erro: ${err.message}`;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadProperties = async () => {
    try {
      const { items } = await BaseCrudService.getAll<Imveis>('imoveis');
      setProperties(items.sort((a, b) => (a.codImovel || '').localeCompare(b.codImovel || '')));
    } catch (err) {
      console.error('Error loading properties:', err);
    }
  };

  const loadBrokers = async () => {
    try {
      const { items } = await BaseCrudService.getAll<UsuriosdoSistema>('usuariossistema');
      // Only show active brokers (corretores)
      setBrokers(items.filter(u => u.ativo !== false));
    } catch (err) {
      console.error('Error loading brokers:', err);
    }
  };

  useEffect(() => {
    if (step === 'success') {
      loadProperties();
    }
  }, [step]);

  useEffect(() => {
    // Load brokers when modal opens
    if (true) { loadBrokers(); }
  }, []);

  const handleSuccessClose = () => {
    if (createdClientId) {
      onSuccess?.(createdClientId);
    }
    handleClose();
  };

  // handleLeadSuccess removed

  const handleGenerateService = async (serviceType: string) => {
    setLoading(true);
    try {
      // Duplication check removed as per user request to allow multiple cards of the same sector

      const getInitialStatus = (type: string): string => {
        if (type === 'Financiamento' || type === 'Crédito') return 'novos-clientes';
        if (type === 'Leilão') return 'Novos clientes';
        return 'Novos';
      };

      const newServiceRecord: any = {
        _id: crypto.randomUUID(),
        serviceType: serviceType,
        contactName: formData.clientName,
        contactEmail: formData.email,
        contactPhone: formData.phoneNumber,
        clientePrincipalRef: createdClientId,
        status: getInitialStatus(serviceType),
        pastaInterna: `${serviceType.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
        creationDate: new Date().toISOString(),
        priority: 'Média',
        notes: `Gerado via cadastro de cliente.`
      };

      // Sector specific defaults
      if (serviceType === 'Financiamento') {
        newServiceRecord.faseFinanciamento = 'novos-clientes';
      }

      const createdService = await BaseCrudService.create('atendimentos', newServiceRecord);

      // Create property link if selected
      if (selectedPropertyId) {
        await BaseCrudService.create('atendimentoimoveis', {
          _id: crypto.randomUUID(),
          atendimentoRef: newServiceRecord._id,
          imovelRef: selectedPropertyId,
          role: 'Imóvel Principal',
          dateAdded: new Date().toISOString()
        });
      }

      if (onSuccess && createdClientId) {
        onSuccess(createdClientId);
      }

      // Wait for persistence
      await new Promise(resolve => setTimeout(resolve, 800));

      // Redirection mapping
      const routeMap: Record<string, string> = {
        'Financiamento': '/admin/financiamento-kanban',
        'Venda': '/admin/negocios/kanban',
        'Locação': '/admin/locacoes/kanban',
        'Leilão': '/admin/leilao/kanban'
      };

      onOpenChange(false);
      navigate(routeMap[serviceType] || '/admin/atendimentos', {
        state: {
          openCardId: newServiceRecord._id,
          newCardData: newServiceRecord
        }
      });
    } catch (err) {
      console.error(`Erro ao gerar ${serviceType}:`, err);
      alert(`Erro ao gerar processo de ${serviceType}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose} >
      <DialogContent className="max-w-2xl bg-primary border-primary-foreground/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-secondary">
            <span style={{ display: step === 'form' ? 'inline' : 'none' }}>Cadastrar Novo Cliente</span>
            <span style={{ display: step === 'roles' ? 'inline' : 'none' }}>Selecionar Papéis/Funções</span>
            <span style={{ display: step === 'success' ? 'inline' : 'none' }}>Cliente Criado com Sucesso!</span>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {/* Form Step */}
          <div style={{ display: step === 'form' ? 'block' : 'none' }}>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div 
                style={{ display: error ? 'flex' : 'none' }}
                className="bg-destructive/10 border border-destructive/30 p-3 rounded-md items-start gap-2"
              >
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <p className="text-destructive text-sm">
                  {error || ''}
                </p>
              </div>

              <div 
                style={{ display: duplicateWarning ? 'flex' : 'none' }}
                className="bg-brandaccent/10 border border-brandaccent/30 p-4 rounded-md items-start gap-2"
              >
                <AlertCircle className="h-4 w-4 text-brandaccent mt-0.5" />
                <div className="text-foreground text-sm">
                  <p className="font-semibold mb-2 text-brandaccent">Atenção: Este cliente já possui cadastro!</p>
                  <p className="font-medium">{duplicateWarning?.client.clientName || ''}</p>
                  <p style={{ display: duplicateWarning?.client.cpfCnpj ? 'block' : 'none' }} className="text-xs">
                    CPF/CNPJ: {duplicateWarning?.client.cpfCnpj || ''}
                  </p>

                  <div style={{ display: (duplicateWarning?.services.length || 0) > 0 ? 'block' : 'none' }}>
                    <div className="mt-3 p-3 bg-white/50 rounded-lg border border-brandaccent/20">
                      <p className="font-semibold text-xs mb-2">Cartões já existentes para este cliente:</p>
                      <ul className="space-y-1">
                        {duplicateWarning?.services.map(s => (
                          <li key={s._id} className="text-[10px] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                            <strong>{s.serviceType}</strong> - Pasta: {s.pastaInterna} ({s.status})
                          </li>
                        )) || []}
                      </ul>
                      <p className="mt-3 text-[10px] text-brandaccent italic">Você pode ver os detalhes acima ou clicar em "Vincular Novo Cartão" para prosseguir.</p>
                    </div>
                  </div>
                  <div style={{ display: (duplicateWarning?.services.length || 0) === 0 ? 'block' : 'none' }}>
                    <p className="mt-2 text-xs italic">O cliente existe mas não possui cartões ativos no momento.</p>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (duplicateWarning) {
                          navigate('/admin/clientes', { state: { highlightId: duplicateWarning.client._id } });
                          handleClose();
                        }
                      }}
                      className="text-[10px] px-2 py-1 rounded border border-brandaccent/30 text-brandaccent hover:bg-brandaccent/10 transition-colors"
                    >
                      Ver Cadastro Completo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (duplicateWarning) {
                          setCreatedClientId(duplicateWarning.client._id);
                          setStep('success');
                        }
                      }}
                      className="text-[10px] font-bold px-3 py-1 bg-secondary text-secondary-foreground rounded shadow-sm hover:shadow-md transition-all uppercase tracking-tighter"
                    >
                      Avançar e Vincular Novo Cartão
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuplicateWarning(null)}
                      className="text-[10px] px-2 py-1 text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      Corrigir Dados
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="clientName" className="font-paragraph text-xs text-primary-foreground mb-2 block font-medium uppercase tracking-tight">
                  Nome do Cliente *
                </label>
                <input
                  id="clientName"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full h-10 px-4 rounded-md bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground focus:outline-none focus:ring-1 focus:ring-secondary/50 transition-colors text-sm placeholder:text-primary-foreground/40"
                  placeholder="Nome completo ou razão social"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cpfCnpj" className="font-paragraph text-xs text-primary-foreground mb-2 block font-medium uppercase tracking-tight">
                    CPF/CNPJ
                  </label>
                  <input
                    id="cpfCnpj"
                    value={formData.cpfCnpj}
                    onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                    className="w-full h-10 px-4 rounded-md bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground focus:outline-none focus:ring-1 focus:ring-secondary/50 transition-colors text-sm placeholder:text-primary-foreground/40"
                    placeholder="000.000.000-00"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="font-paragraph text-xs text-primary-foreground mb-2 block font-medium uppercase tracking-tight">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-10 px-4 rounded-md bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground focus:outline-none focus:ring-1 focus:ring-secondary/50 transition-colors text-sm placeholder:text-primary-foreground/40"
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phoneNumber" className="font-paragraph text-xs text-primary-foreground mb-2 block font-medium uppercase tracking-tight">
                    Telefone
                  </label>
                  <input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full h-10 px-4 rounded-md bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground focus:outline-none focus:ring-1 focus:ring-secondary/50 transition-colors text-sm placeholder:text-primary-foreground/40"
                    placeholder="(11) 99999-9999"
                  />
                </div>

              <div>
                <label className="font-paragraph text-xs text-primary-foreground mb-2 block font-medium uppercase tracking-tight">
                  Gênero (Para Contratos)
                </label>
                <div className="flex gap-4 h-12 items-center bg-primary-foreground/5 px-3 rounded-md border border-primary-foreground/20">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-primary-foreground">
                    <input
                      type="radio"
                      name="gender"
                      value="Masculino"
                      checked={formData.gender === 'Masculino'}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                      className="w-4 h-4 accent-secondary"
                    />
                    Masc
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-primary-foreground">
                    <input
                      type="radio"
                      name="gender"
                      value="Feminino"
                      checked={formData.gender === 'Feminino'}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                      className="w-4 h-4 accent-secondary"
                    />
                    Fem
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-primary-foreground">
                    <input
                      type="radio"
                      name="gender"
                      value="Outro"
                      checked={formData.gender === 'Outro'}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                      className="w-4 h-4 accent-secondary"
                    />
                    Outro
                  </label>
                </div>
              </div>
            </div>

              <div>
                <label htmlFor="address" className="font-paragraph text-xs text-primary-foreground mb-2 block font-medium uppercase tracking-tight">
                  Endereço
                </label>
                <input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full h-10 px-4 rounded-md bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground focus:outline-none focus:ring-1 focus:ring-secondary/50 transition-colors text-sm placeholder:text-primary-foreground/40"
                  placeholder="Rua, número, bairro, cidade"
                />
              </div>

              {/* Origem do Cliente */}
              <div>
                <label className="font-paragraph text-xs text-primary-foreground mb-2 block font-medium uppercase tracking-tight">
                  Origem do Cliente
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {['Instagram', 'WhatsApp', 'Imobiliária', 'Corretor', 'Corretor R.Sales'].map((origem) => (
                    <button
                      key={origem}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        origemCliente: formData.origemCliente === origem ? '' : origem,
                        corretorOrigemId: '',
                      })}
                      className={`text-xs py-1.5 px-2 rounded-md border transition-all font-medium ${
                        formData.origemCliente === origem
                          ? 'bg-secondary text-secondary-foreground border-secondary'
                          : 'bg-primary-foreground/5 text-primary-foreground/70 border-primary-foreground/20 hover:border-secondary/40'
                      }`}
                    >
                      {origem}
                    </button>
                  ))}
                </div>
                {/* Sub-selector: specific broker when "Corretor R.Sales" is selected */}
                {formData.origemCliente === 'Corretor R.Sales' && brokers.length > 0 && (
                  <select
                    value={formData.corretorOrigemId}
                    onChange={(e) => setFormData({ ...formData, corretorOrigemId: e.target.value })}
                    className="w-full h-10 px-3 rounded-md bg-primary-foreground/10 border border-secondary/40 text-primary-foreground text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-secondary/50"
                  >
                    <option value="">— Selecione o Corretor R.Sales —</option>
                    {brokers.map(b => (
                      <option key={b._id} value={b._id}>
                        {b.name || b.emailLogin || b._id}
                      </option>
                    ))}
                  </select>
                )}
              </div>

            <div>
              <label htmlFor="notes" className="font-paragraph text-xs text-primary-foreground mb-2 block font-medium uppercase tracking-tight">
                Notas
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-2 border border-primary-foreground/20 rounded-lg bg-primary-foreground/10 text-primary-foreground font-paragraph text-sm resize-none"
                rows={3}
                placeholder="Informações adicionais..."
              />
            </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90 disabled:opacity-50 font-paragraph font-semibold h-12 rounded-lg transition-colors"
                >
                  <span style={{ display: loading ? 'none' : 'inline' }}>Próximo</span>
                  <span style={{ display: loading ? 'inline' : 'none' }}>Verificando...</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 h-12 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>

          {/* Roles Step */}
          <div style={{ display: step === 'roles' ? 'block' : 'none' }}>
            <div className="space-y-4">
              <p className="font-paragraph text-xs text-primary-foreground/70">
                Selecione os papéis/funções deste cliente (opcional). Os papéis servem apenas para classificação no CRM e não afetam nenhum fluxo.
              </p>

              <div className="space-y-3">
                {ROLES.map((role) => (
                  <div
                    key={role.id}
                    className="bg-primary-foreground/5 rounded-lg p-4 border border-primary-foreground/10 hover:border-secondary/30 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={role.id}
                        checked={selectedRoles.includes(role.id)}
                        onChange={() => handleRoleToggle(role.id)}
                        className="w-5 h-5 accent-secondary rounded border-primary-foreground/30 mt-1 cursor-pointer"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={role.id}
                          className="font-paragraph font-bold text-sm text-primary-foreground cursor-pointer"
                        >
                          {role.label}
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lead registration option removed */}

              <div 
                style={{ display: error ? 'flex' : 'none' }}
                className="bg-destructive/10 border border-destructive/30 p-3 rounded-md items-start gap-2"
              >
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <p className="text-destructive text-sm">
                  {error || ''}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCreateClient}
                  disabled={loading}
                  className="flex-1 bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90 disabled:opacity-50 font-paragraph font-semibold h-12 rounded-lg transition-colors"
                >
                  <span style={{ display: loading ? 'inline' : 'none' }}>Criando...</span>
                  <span style={{ display: !loading ? 'inline' : 'none' }}>
                    {selectedRoles.length > 0 ? `Criar Cliente (${selectedRoles.length} papel${selectedRoles.length !== 1 ? 'éis' : ''})` : 'Criar Cliente'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="flex-1 border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 h-12 rounded-lg transition-colors"
                >
                  Voltar
                </button>
              </div>
            </div>
          </div>

          {/* Success Step */}
          <div style={{ display: step === 'success' ? 'block' : 'none' }}>
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-600" />
              </div>

              <div>
                <h3 className="font-heading text-xl text-primary-foreground font-semibold mb-2">
                  Cliente criado com sucesso!
                </h3>
                <p className="font-paragraph text-sm text-primary-foreground/70">
                  {formData.clientName}
                </p>
              </div>

              {selectedRoles.length > 0 && (
                <div className="bg-primary-foreground/5 rounded-lg p-4 border border-primary-foreground/10">
                  <p className="font-paragraph text-xs text-primary-foreground/60 mb-2">
                    Papéis selecionados:
                  </p>
                  <ul className="space-y-1">
                    {selectedRoles.map((roleId) => {
                      const role = ROLES.find((r) => r.id === roleId);
                      return (
                        <li key={roleId} className="font-paragraph text-sm text-primary-foreground">
                          ✓ {role?.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* createLead === 'sim' notice removed */}

              <div className="pt-4 space-y-4">
                <p className="font-paragraph text-[10px] text-primary-foreground/70 mb-4 uppercase tracking-widest font-bold">
                  Deseja vincular a um imóvel específico? (Opcional)
                </p>

                <div className="mb-6">
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="w-full h-10 px-3 bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-secondary/50 text-xs"
                  >
                    <option value="" className="bg-primary text-primary-foreground">Não vincular imóvel agora</option>
                    {properties.map(p => (
                      <option key={p._id} value={p._id} className="bg-primary text-primary-foreground">
                        {p.codImovel} - {p.tipoImovel} - {p.bairro}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="font-paragraph text-[10px] text-primary-foreground/70 mb-4 uppercase tracking-widest font-bold">
                  Deseja gerar um cartão/processo agora?
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleGenerateService('Financiamento')}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-paragraph font-bold h-14 rounded-xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-blue-900/20 transition-all"
                  >
                    <DollarSign className="w-5 h-5" />
                    <span className="text-[10px] uppercase font-bold tracking-tight">Financiamento</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenerateService('Venda')}
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-paragraph font-bold h-14 rounded-xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-900/20 transition-all"
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-[10px] uppercase font-bold tracking-tight">Venda / Compra</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenerateService('Locação')}
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-paragraph font-bold h-14 rounded-xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-purple-900/20 transition-all"
                  >
                    <Building2 className="w-5 h-5" />
                    <span className="text-[10px] uppercase font-bold tracking-tight">Locação</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenerateService('Leilão')}
                    disabled={loading}
                    className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-paragraph font-bold h-14 rounded-xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-amber-900/20 transition-all"
                  >
                    <Gavel className="w-5 h-5" />
                    <span className="text-[10px] uppercase font-bold tracking-tight">Leilão</span>
                  </button>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/admin/clientes');
                      if (onSuccess && createdClientId) onSuccess(createdClientId);
                      handleClose();
                    }}
                    className="flex-1 border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 h-10 rounded-lg text-xs font-medium transition-colors"
                  >
                    Ver Cliente
                  </button>
                  <button
                    type="button"
                    onClick={handleSuccessClose}
                    className="flex-1 text-primary-foreground hover:bg-primary-foreground/10 h-10 rounded-lg text-xs font-medium transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog >
    
    {/* LeadRegistrationModal removed */}
  </>
);
}
