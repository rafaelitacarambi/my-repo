import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Users, ArrowLeft, Mail, Phone, Plus, Trash2, Edit2, ChevronDown, ChevronUp, DollarSign, TrendingUp, Building2, Gavel, FilePlus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BaseCrudService } from '@/integrations';
import { Clients, ServiceRecords } from '@/entities';
import { ClientRegistrationModal } from '@/components/ClientRegistrationModal';

function AdminClientesContent() {
  const [clientes, setClientes] = useState<Clients[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clienteProcessos, setClienteProcessos] = useState<Record<string, ServiceRecords[]>>({});
  const [formData, setFormData] = useState({
    clientName: '',
    email: '',
    phoneNumber: '',
    cpfCnpj: '',
    status: 'Ativo',
    address: '',
    notes: '',
  });

  useEffect(() => {
    loadClientes();
  }, []);

  useEffect(() => {
    if (location.state?.openNewClient) {
      setIsCreateModalOpen(true);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const loadClientes = async () => {
    try {
      const { items } = await BaseCrudService.getAll<Clients>('clientes');

      // Sort by _updatedDate (most recent first)
      const sortedItems = [...items].sort((a, b) => {
        const dateA = new Date(a._updatedDate || 0).getTime();
        const dateB = new Date(b._updatedDate || 0).getTime();
        return dateB - dateA;
      });

      setClientes(sortedItems);

      // Load processes for each client
      const processosMap: Record<string, ServiceRecords[]> = {};
      const { items: processos } = await BaseCrudService.getAll<ServiceRecords>('atendimentos');

      items.forEach(cliente => {
        processosMap[cliente._id] = processos.filter(p => p.clientePrincipalRef === cliente._id);
      });

      setClienteProcessos(processosMap);
    } catch (error) {
      console.error('Error loading clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Duplication check (exclude current client if editing)
      const { items: allClients } = await BaseCrudService.getAll<Clients>('clientes');
      const duplicate = allClients.find(c =>
        c._id !== editingId && (
          (formData.cpfCnpj && c.cpfCnpj === formData.cpfCnpj) ||
          (formData.email && c.email === formData.email) ||
          (formData.address && c.address?.toLowerCase() === formData.address?.toLowerCase())
        )
      );

      if (duplicate) {
        const { items: allServices } = await BaseCrudService.getAll<ServiceRecords>('atendimentos');
        const clientServices = allServices.filter(s => s.clientePrincipalRef === duplicate._id && !s.isArchived);

        let message = `Este cliente/endereço já possui cadastro: ${duplicate.clientName}\n`;
        if (clientServices.length > 0) {
          message += `\nCartões ativos encontrados:\n` + clientServices.map(s => `- ${s.serviceType} (Pasta: ${s.pastaInterna})`).join('\n');
        }
        message += `\n\nNão é permitido duplicar o cadastro.`;
        alert(message);
        return;
      }

      let clientId = editingId;
      if (editingId) {
        await BaseCrudService.update('clientes', {
          _id: editingId,
          ...formData,
        });
      } else {
        clientId = crypto.randomUUID();
        await BaseCrudService.create('clientes', {
          _id: clientId,
          ...formData,
        });
      }

      await loadClientes();
      setIsDialogOpen(false);

      if (!editingId) {
        alert("Cliente cadastrado com sucesso! Use o menu 'Gerar Cartão' para criar processos nos Kanbans.");
      }

      resetForm();
    } catch (error) {
      console.error('Error saving cliente:', error);
      alert("Erro ao salvar cliente.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await BaseCrudService.delete('clientes', id);
      loadClientes();
    } catch (error) {
      console.error('Error deleting cliente:', error);
    }
  };

  const handleEdit = (cliente: Clients) => {
    setEditingId(cliente._id);
    setFormData({
      clientName: cliente.clientName || '',
      email: cliente.email || '',
      phoneNumber: cliente.phoneNumber || '',
      cpfCnpj: cliente.cpfCnpj || '',
      status: cliente.status || 'Ativo',
      address: cliente.address || '',
      notes: cliente.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleGenerateService = async (cliente: Clients, serviceType: string) => {
    try {
      // Duplication check for Financing
      const { items: existingServices } = await BaseCrudService.getAll<ServiceRecords>('atendimentos');
      const duplicate = existingServices.find(s =>
        s.clientePrincipalRef === cliente._id &&
        s.serviceType === serviceType &&
        !s.isArchived
      );

      if (duplicate) {
        toast.error(`Este cliente já possui um processo de ${serviceType} ativo (Pasta: ${duplicate.pastaInterna}). Arquive o atual antes de criar um novo.`);
        return;
      }

      const getInitialStatus = (type: string): string => {
        if (type === 'Financiamento' || type === 'Crédito') return 'novos-clientes';
        return 'Novos';
      };

      const newServiceRecord: any = {
        _id: crypto.randomUUID(),
        serviceType: serviceType,
        contactName: cliente.clientName,
        contactEmail: cliente.email,
        contactPhone: cliente.phoneNumber,
        clientePrincipalRef: cliente._id,
        status: getInitialStatus(serviceType),
        pastaInterna: `${serviceType.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
        creationDate: new Date().toISOString(),
        priority: 'Média',
        notes: `Gerado via Gestão de Clientes.`
      };

      if (serviceType === 'Financiamento') {
        newServiceRecord.faseFinanciamento = 'novos-clientes';
      }

      await BaseCrudService.create('atendimentos', newServiceRecord);

      const routeMap: Record<string, string> = {
        'Financiamento': '/admin/financiamento-kanban',
        'Venda': '/admin/negocios/kanban',
        'Locação': '/admin/locacoes/kanban',
        'Leilão': '/admin/leilao/kanban'
      };

      if (window.confirm(`${serviceType} gerada com sucesso. Ir para o Kanban agora?`)) {
        navigate(routeMap[serviceType] || '/admin/atendimentos', {
          state: {
            openCardId: newServiceRecord._id,
            newCardData: newServiceRecord
          }
        });
      } else {
        await loadClientes();
      }
    } catch (error) {
      console.error(`Erro ao gerar ${serviceType}:`, error);
      alert(`Erro ao gerar processo de ${serviceType}.`);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      clientName: '',
      email: '',
      phoneNumber: '',
      cpfCnpj: '',
      status: 'Ativo',
      address: '',
      notes: '',
    });
  };

  return (
    <div className="min-h-screen bg-primary">
      <Header />

      {/* Header */}
      <section className="w-full bg-gradient-to-br from-secondary/10 to-secondary/5 py-12">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <Link to="/area-restrita">
            <Button
              variant="ghost"
              className="text-primary-foreground hover:text-secondary hover:bg-primary-foreground/5 font-paragraph mb-6"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar para Área Restrita
            </Button>
          </Link>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-heading text-4xl lg:text-5xl text-secondary mb-4">
                Gestão de Clientes
              </h1>
              <p className="font-paragraph text-lg text-primary-foreground/80">
                Gerencie informações de clientes e histórico de contatos
              </p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-paragraph"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Cliente
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-heading">
                    {editingId ? 'Editar Cliente' : 'Novo Cliente'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Nome do Cliente"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="font-paragraph"
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="font-paragraph"
                  />
                  <Input
                    placeholder="Telefone"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="font-paragraph"
                  />
                  <Input
                    placeholder="CPF/CNPJ"
                    value={formData.cpfCnpj}
                    onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                    className="font-paragraph"
                  />
                  <Input
                    placeholder="Endereço"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="font-paragraph"
                  />
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger className="font-paragraph">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                      <SelectItem value="Suspenso">Suspenso</SelectItem>
                    </SelectContent>
                  </Select>
                  <textarea
                    placeholder="Notas"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full p-2 border border-border-gray rounded-lg font-paragraph text-sm"
                    rows={3}
                  />
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSave}
                      className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-paragraph"
                    >
                      Salvar
                    </Button>
                    <Button
                      onClick={() => setIsDialogOpen(false)}
                      variant="outline"
                      className="flex-1 font-paragraph"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Clientes List */}
      <section className="w-full py-12">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          {/* Search Bar */}
          <div className="mb-8 relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-foreground/40" />
            <Input
              placeholder="Pesquisar por nome, e-mail, telefone ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 bg-primary-foreground/5 border-primary-foreground/10 text-primary-foreground font-paragraph focus:ring-secondary focus:border-secondary rounded-xl w-full"
            />
          </div>

          <Tabs defaultValue="lista" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="lista" className="font-paragraph">Lista de Clientes</TabsTrigger>
              <TabsTrigger value="dados" className="font-paragraph">Dados e Processos</TabsTrigger>
            </TabsList>

            {/* Tab: Lista de Clientes */}
            <TabsContent value="lista">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-primary-foreground/5 rounded-xl h-32 animate-pulse"></div>
                  ))}
                </div>
              ) : clientes.length === 0 ? (
                <div className="text-center py-20">
                  <Users className="w-16 h-16 text-primary-foreground/30 mx-auto mb-4" />
                  <h3 className="font-heading text-2xl text-primary-foreground mb-2">
                    Nenhum cliente cadastrado
                  </h3>
                  <p className="font-paragraph text-base text-primary-foreground/60">
                    Comece adicionando um novo cliente
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clientes
                    .filter(c => {
                      if (!searchTerm) return true;
                      const search = searchTerm.toLowerCase();
                      return (
                        c.clientName?.toLowerCase().includes(search) ||
                        c.email?.toLowerCase().includes(search) ||
                        c.phoneNumber?.toLowerCase().includes(search) ||
                        c.cpfCnpj?.toLowerCase().includes(search)
                      );
                    })
                    .map((cliente, index) => (
                      <motion.div
                        key={cliente._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className="bg-primary-foreground/5 rounded-xl p-6 border border-primary-foreground/10 hover:border-secondary/30 transition-all"
                      >
                        <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                          <div className="flex-1 space-y-3">
                            <h3 className="font-heading text-xl text-primary-foreground font-semibold">
                              {cliente.clientName}
                            </h3>
                            <div className="space-y-2">
                              {cliente.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-secondary flex-shrink-0" />
                                  <a
                                    href={`mailto:${cliente.email}`}
                                    className="font-paragraph text-sm text-primary-foreground/70 hover:text-secondary transition-colors"
                                  >
                                    {cliente.email}
                                  </a>
                                </div>
                              )}
                              {cliente.phoneNumber && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-secondary flex-shrink-0" />
                                  <a
                                    href={`tel:${cliente.phoneNumber}`}
                                    className="font-paragraph text-sm text-primary-foreground/70 hover:text-secondary transition-colors"
                                  >
                                    {cliente.phoneNumber}
                                  </a>
                                </div>
                              )}
                            </div>
                            {cliente.address && (
                              <p className="font-paragraph text-sm text-primary-foreground/60">
                                📍 {cliente.address}
                              </p>
                            )}
                            <div className="flex items-center gap-2 pt-2">
                              <span className="text-xs font-paragraph text-primary-foreground/50">Status:</span>
                              <span className={`text-xs font-paragraph px-2 py-1 rounded-full ${cliente.status === 'Ativo' ? 'bg-green-100 text-green-800' :
                                cliente.status === 'Inativo' ? 'bg-gray-100 text-gray-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                {cliente.status}
                              </span>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button className="bg-secondary hover:bg-secondary/90 text-white font-bold" size="sm">
                                <FilePlus className="w-4 h-4 mr-2" />
                                Gerar Cartão
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 bg-primary border-primary-foreground/10 text-primary-foreground">
                              {[
                                { label: 'Financiamento', types: ['Financiamento', 'Crédito'], icon: <DollarSign className="w-4 h-4 text-blue-400" />, serviceType: 'Financiamento' },
                                { label: 'Venda / Compra', types: ['Venda', 'Compra'], icon: <TrendingUp className="w-4 h-4 text-emerald-400" />, serviceType: 'Venda' },
                                { label: 'Locação', types: ['Locação', 'Aluguel'], icon: <Building2 className="w-4 h-4 text-purple-400" />, serviceType: 'Locação' },
                                { label: 'Leilão', types: ['Leilão'], icon: <Gavel className="w-4 h-4 text-amber-400" />, serviceType: 'Leilão' },
                              ].map(({ label, types, icon, serviceType }) => {
                                const existing = (clienteProcessos[cliente._id] || []).find(
                                  p => types.includes(p.serviceType || '') && !p.isArchived
                                );
                                return (
                                  <DropdownMenuItem
                                    key={serviceType}
                                    onClick={() => handleGenerateService(cliente, serviceType)}
                                    className="gap-2 cursor-pointer hover:bg-primary-foreground/10 flex items-center justify-between"
                                  >
                                    <span className="flex items-center gap-2">
                                      {icon} {label}
                                    </span>
                                    {existing && (
                                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded px-1.5 py-0.5 flex items-center gap-1">
                                        🔒 {existing.pastaInterna}
                                      </span>
                                    )}
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button
                            onClick={() => handleEdit(cliente)}
                            variant="outline"
                            size="sm"
                            className="font-paragraph"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(cliente._id)}
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive font-paragraph"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </TabsContent>

            {/* Tab: Dados e Processos */}
            <TabsContent value="dados">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-primary-foreground/5 rounded-xl h-32 animate-pulse"></div>
                  ))}
                </div>
              ) : clientes.length === 0 ? (
                <div className="text-center py-20">
                  <Users className="w-16 h-16 text-primary-foreground/30 mx-auto mb-4" />
                  <h3 className="font-heading text-2xl text-primary-foreground mb-2">
                    Nenhum cliente cadastrado
                  </h3>
                  <p className="font-paragraph text-base text-primary-foreground/60">
                    Comece adicionando um novo cliente
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clientes.map((cliente, index) => {
                    const processos = clienteProcessos[cliente._id] || [];
                    const isExpanded = expandedClientId === cliente._id;

                    return (
                      <motion.div
                        key={cliente._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className="bg-primary-foreground/5 rounded-xl border border-primary-foreground/10 overflow-hidden"
                      >
                        {/* Cliente Header */}
                        <button
                          onClick={() => setExpandedClientId(isExpanded ? null : cliente._id)}
                          className="w-full p-6 flex justify-between items-start hover:bg-primary-foreground/10 transition-colors text-left"
                        >
                          <div className="flex-1">
                            <h3 className="font-heading text-xl text-primary-foreground font-semibold mb-2">
                              {cliente.clientName}
                            </h3>
                            <div className="flex items-center gap-4">
                              <span className="text-xs font-paragraph text-primary-foreground/50">
                                {processos.length} processo(s)
                              </span>
                              <span className={`text-xs font-paragraph px-2 py-1 rounded-full ${cliente.status === 'Ativo' ? 'bg-green-100 text-green-800' :
                                cliente.status === 'Inativo' ? 'bg-gray-100 text-gray-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                {cliente.status}
                              </span>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-secondary flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-secondary flex-shrink-0" />
                          )}
                        </button>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-primary-foreground/10 p-6 space-y-6 bg-primary-foreground/2"
                          >
                            {/* Cliente Info */}
                            <div>
                              <h4 className="font-heading text-lg text-primary-foreground mb-4">Informações do Cliente</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {cliente.email && (
                                  <div>
                                    <p className="text-xs font-paragraph text-primary-foreground/50 mb-1">Email</p>
                                    <p className="font-paragraph text-sm text-primary-foreground">{cliente.email}</p>
                                  </div>
                                )}
                                {cliente.phoneNumber && (
                                  <div>
                                    <p className="text-xs font-paragraph text-primary-foreground/50 mb-1">Telefone</p>
                                    <p className="font-paragraph text-sm text-primary-foreground">{cliente.phoneNumber}</p>
                                  </div>
                                )}
                                {cliente.cpfCnpj && (
                                  <div>
                                    <p className="text-xs font-paragraph text-primary-foreground/50 mb-1">CPF/CNPJ</p>
                                    <p className="font-paragraph text-sm text-primary-foreground">{cliente.cpfCnpj}</p>
                                  </div>
                                )}
                                {cliente.address && (
                                  <div>
                                    <p className="text-xs font-paragraph text-primary-foreground/50 mb-1">Endereço</p>
                                    <p className="font-paragraph text-sm text-primary-foreground">{cliente.address}</p>
                                  </div>
                                )}
                                {cliente.notes && (
                                  <div>
                                    <p className="text-xs font-paragraph text-primary-foreground/50 mb-1">Notas</p>
                                    <p className="font-paragraph text-sm text-primary-foreground">{cliente.notes}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Processos */}
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-heading text-lg text-primary-foreground">Processos Vinculados</h4>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button className="bg-secondary hover:bg-secondary/90 text-white text-xs" size="sm">
                                    <Plus className="w-4 h-4 mr-1" />
                                    Novo Processo
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-primary border-primary-foreground/10 text-primary-foreground">
                                  <DropdownMenuItem onClick={() => handleGenerateService(cliente, 'Financiamento')} className="gap-2 cursor-pointer hover:bg-primary-foreground/10 text-xs">
                                    <DollarSign className="w-4 h-4" /> Financiamento
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleGenerateService(cliente, 'Venda')} className="gap-2 cursor-pointer hover:bg-primary-foreground/10 text-xs">
                                    <TrendingUp className="w-4 h-4" /> Venda / Compra
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleGenerateService(cliente, 'Locação')} className="gap-2 cursor-pointer hover:bg-primary-foreground/10 text-xs">
                                    <Building2 className="w-4 h-4" /> Locação
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleGenerateService(cliente, 'Leilão')} className="gap-2 cursor-pointer hover:bg-primary-foreground/10 text-xs">
                                    <Gavel className="w-4 h-4" /> Leilão
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            {processos.length === 0 ? (
                              <p className="font-paragraph text-sm text-primary-foreground/60">Nenhum processo vinculado</p>
                            ) : (
                              <div className="space-y-3">
                                {processos.map(processo => (
                                  <div
                                    key={processo._id}
                                    className="bg-primary rounded-lg p-4 border border-primary-foreground/10"
                                  >
                                    <div className="flex justify-between items-start gap-4 mb-3">
                                      <div className="flex-1">
                                        <p className="font-paragraph text-sm font-semibold text-primary-foreground">
                                          Pasta: {processo.pastaInterna || '—'}
                                        </p>
                                        <p className="font-paragraph text-xs text-primary-foreground/60 mt-1">
                                          Tipo: {processo.serviceType || '—'}
                                        </p>
                                      </div>
                                      <Link to={`/admin/financiamento/${processo._id}`}>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="font-paragraph"
                                        >
                                          Ver Detalhes
                                        </Button>
                                      </Link>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                      <div>
                                        <p className="text-xs font-paragraph text-primary-foreground/50 mb-1">Fase</p>
                                        <p className="font-paragraph text-xs text-primary-foreground">
                                          {processo.faseFinanciamento || '—'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-paragraph text-primary-foreground/50 mb-1">Subetapa</p>
                                        <p className="font-paragraph text-xs text-primary-foreground">
                                          {processo.status || '—'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-paragraph text-primary-foreground/50 mb-1">Status Resultado</p>
                                        <Badge className={`text-xs ${processo.statusResultadoFinanciamento === 'Aprovado' ? 'bg-green-100 text-green-800' :
                                          processo.statusResultadoFinanciamento === 'Condicionado' ? 'bg-yellow-100 text-yellow-800' :
                                            processo.statusResultadoFinanciamento === 'Reprovado' ? 'bg-red-100 text-red-800' :
                                              processo.statusResultadoFinanciamento === 'Em andamento' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                          }`}>
                                          {processo.statusResultadoFinanciamento || 'Não definido'}
                                        </Badge>
                                      </div>
                                      <div>
                                        <p className="text-xs font-paragraph text-primary-foreground/50 mb-1">Prioridade</p>
                                        <p className="font-paragraph text-xs text-primary-foreground">
                                          {processo.priority || '—'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />

      <ClientRegistrationModal
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={() => loadClientes()}
      />
    </div>
  );
}

export default function AdminClientesPage() {
  return (
    <MemberProtectedRoute messageToSignIn="Faça login para gerenciar clientes">
      <AdminClientesContent />
    </MemberProtectedRoute>
  );
}
