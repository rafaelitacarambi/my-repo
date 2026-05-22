import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Search,
  Filter,
  ArrowLeft,
  Calendar,
  User,
  FileText,
  RotateCcw,
  CheckSquare,
  ExternalLink,
  Eye,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuctionNavigation from '@/components/AuctionNavigation';
import { BaseCrudService } from '@/integrations';
import { ServiceRecords, UsuriosdoSistema, Clients, ServiceParties, HistricodeInteraes } from '@/entities';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminAuctionPendenciasPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pendencias, setPendencias] = useState<any[]>([]);
  const [filteredPendencias, setFilteredPendencias] = useState<any[]>([]);
  const [atendimentos, setAtendimentos] = useState<ServiceRecords[]>([]);
  const [clientes, setClientes] = useState<Clients[]>([]);
  const [serviceParties, setServiceParties] = useState<ServiceParties[]>([]);
  const [usuarios, setUsuarios] = useState<UsuriosdoSistema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPendencia, setEditingPendencia] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Pendente',
    priority: 'Média',
    atendimentoRef: '',
    responsiblePartyType: 'Cliente',
    responsiblePartyDetails: '',
    dueDate: '',
    bloqueiaFase: false
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterPendencias();
  }, [pendencias, searchTerm, statusFilter, priorityFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pendenciasResult, atendimentosResult, clientesResult, partiesResult, usuariosResult] = await Promise.all([
        BaseCrudService.getAll<any>('pendenciasleilao'),
        BaseCrudService.getAll<ServiceRecords>('atendimentos'),
        BaseCrudService.getAll<Clients>('clientes'),
        BaseCrudService.getAll<ServiceParties>('atendimentopartes'),
        BaseCrudService.getAll<UsuriosdoSistema>('usuariossistema')
      ]);

      setPendencias(pendenciasResult.items);
      setAtendimentos(atendimentosResult.items.filter(a => a.serviceType?.toLowerCase().includes('leilao') || a.serviceType?.toLowerCase().includes('leilão')));
      setClientes(clientesResult.items);
      setServiceParties(partiesResult.items);
      setUsuarios(usuariosResult.items);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterPendencias = () => {
    let filtered = [...pendencias];
    filtered = filtered.filter(p => p.status !== 'Concluída');

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') filtered = filtered.filter(p => p.status === statusFilter);
    if (priorityFilter !== 'all') filtered = filtered.filter(p => p.priority === priorityFilter);

    setFilteredPendencias(filtered);
  };

  const handleCreate = () => {
    setEditingPendencia(null);
    setFormData({
      title: '',
      description: '',
      status: 'Pendente',
      priority: 'Média',
      atendimentoRef: '',
      responsiblePartyType: 'Cliente',
      responsiblePartyDetails: '',
      dueDate: '',
      bloqueiaFase: false
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (pendencia: any) => {
    setEditingPendencia(pendencia);
    setFormData({
      title: pendencia.title || '',
      description: pendencia.description || '',
      status: pendencia.status || 'Pendente',
      priority: pendencia.priority || 'Média',
      atendimentoRef: pendencia.atendimentoRef || '',
      responsiblePartyType: pendencia.responsiblePartyType || 'Cliente',
      responsiblePartyDetails: pendencia.responsiblePartyDetails || '',
      dueDate: pendencia.dueDate ? format(new Date(pendencia.dueDate), 'yyyy-MM-dd') : '',
      bloqueiaFase: pendencia.bloqueiaFase || false
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pendência?')) return;
    setPendencias(prev => prev.filter(p => p._id !== id));
    await BaseCrudService.delete('pendenciasleilao', id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.atendimentoRef) {
      toast({ title: "Campos obrigatórios", variant: "destructive" });
      return;
    }

    const pendenciaData = {
      ...formData,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      creationDate: editingPendencia ? undefined : new Date().toISOString()
    };

    if (editingPendencia) {
      await BaseCrudService.update('pendenciasleilao', { _id: editingPendencia._id, ...pendenciaData });
      toast({ title: "Pendência atualizada" });
    } else {
      const newPendencia = { _id: crypto.randomUUID(), ...pendenciaData };
      await BaseCrudService.create('pendenciasleilao', newPendencia);
      
      await BaseCrudService.create<HistricodeInteraes>('historicointeracoes', {
        _id: crypto.randomUUID(),
        atendimentoRef: formData.atendimentoRef,
        tipoEvento: 'Pendencia_Criada',
        interactionType: 'Criação de pendência',
        interactionDescription: `Nova pendência de leilão: "${formData.title}"`,
        interactionDate: new Date().toISOString(),
        autorTipo: 'Sistema'
      });
      toast({ title: "Pendência criada" });
    }

    setIsDialogOpen(false);
    loadData();
  };

  const getStatusBadge = (status?: string) => {
    const variants: any = {
      'Pendente': { variant: 'destructive', label: 'Pendente' },
      'Em Andamento': { variant: 'secondary', label: 'Em Andamento' },
      'Concluída': { variant: 'default', label: 'Concluída' }
    };
    const config = variants[status || 'Pendente'] || variants['Pendente'];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getAtendimentoInfo = (atendimentoRef?: string) => {
    const atendimento = atendimentos.find(a => a._id === atendimentoRef);
    if (!atendimento) return { name: '—', pasta: '—' };
    return { 
      name: atendimento.contactName || 'Sem nome', 
      pasta: atendimento.pastaInterna || '-' 
    };
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <AuctionNavigation />

      <main className="flex-1 w-full p-6 lg:p-12">
        <div className="max-w-[100rem] mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-foreground">Pendências do Leilão</h1>
              <p className="text-dark-gray">Gerencie as pendências dos processos de leilão</p>
            </div>
            <Button onClick={handleCreate} className="bg-buttonbackground text-white hover:bg-buttonbackground/90 text-lg py-6 px-8 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95">
              <Plus className="w-6 h-6 mr-2" />
              Nova Pendência
            </Button>
          </div>

          <Card className="rounded-2xl border-none shadow-xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-bold text-slate-700 py-6">Pendência</TableHead>
                    <TableHead className="font-bold text-slate-700">Processo</TableHead>
                    <TableHead className="font-bold text-slate-700">Status</TableHead>
                    <TableHead className="font-bold text-slate-700">Prazo</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-400">Carregando...</TableCell></TableRow>
                  ) : filteredPendencias.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-400">Nenhuma pendência ativa encontrada</TableCell></TableRow>
                  ) : (
                    filteredPendencias.map((p) => {
                      const { name, pasta } = getAtendimentoInfo(p.atendimentoRef);
                      return (
                        <TableRow key={p._id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                          <TableCell className="py-4">
                            <div className="font-semibold text-slate-900">{p.title}</div>
                            <div className="text-sm text-slate-500 line-clamp-1">{p.description}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-slate-700">{name}</div>
                            <div className="text-xs text-slate-400">Pasta: {pasta}</div>
                          </TableCell>
                          <TableCell>{getStatusBadge(p.status)}</TableCell>
                          <TableCell className="text-slate-600">
                            {p.dueDate ? format(new Date(p.dueDate), 'dd/MM/yyyy') : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} className="text-slate-400 hover:text-secondary hover:bg-secondary/10"><Edit2 className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(p._id)} className="text-slate-400 hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-4">{editingPendencia ? 'Editar Pendência' : 'Nova Pendência de Leilão'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label className="font-semibold text-slate-700">Processo de Leilão</Label>
              <Select value={formData.atendimentoRef} onValueChange={(val) => setFormData({...formData, atendimentoRef: val})}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Selecione o processo" /></SelectTrigger>
                <SelectContent>
                  {atendimentos.map(a => (
                    <SelectItem key={a._id} value={a._id}>{a.contactName} ({a.pastaInterna || 'S/P'})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="font-semibold text-slate-700">Título</Label>
              <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="h-12 rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label className="font-semibold text-slate-700">Descrição</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="rounded-xl min-h-[100px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="font-semibold text-slate-700">Prazo</Label>
                <Input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} className="h-12 rounded-xl" />
              </div>
              <div className="grid gap-2">
                <Label className="font-semibold text-slate-700">Prioridade</Label>
                <Select value={formData.priority} onValueChange={(val) => setFormData({...formData, priority: val})}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <Button onClick={handleSubmit} className="flex-1 h-14 bg-buttonbackground text-white rounded-2xl text-lg font-bold shadow-lg shadow-buttonbackground/20">{editingPendencia ? 'Salvar Alterações' : 'Criar Pendência'}</Button>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-14 px-8 rounded-2xl text-lg font-semibold">Cancelar</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}
