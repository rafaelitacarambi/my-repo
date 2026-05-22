import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, Plus, Edit2, Trash2, Clock, Search, Filter, Play, CheckSquare, Save, User, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuctionNavigation from '@/components/AuctionNavigation';
import { BaseCrudService } from '@/integrations';
import { ServiceRecords, UsuriosdoSistema, HistricodeInteraes } from '@/entities';
import { format } from 'date-fns';

export default function AdminAuctionTarefasPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [atendimentos, setAtendimentos] = useState<ServiceRecords[]>([]);
  const [usuarios, setUsuarios] = useState<UsuriosdoSistema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTarefa, setEditingTarefa] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    titulo: '',
    description: '',
    status: 'A Fazer',
    atendimentoRef: '',
    internalResponsibleId: '',
    dueDate: '',
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tarefasRes, atendimentosRes, usuariosRes] = await Promise.all([
        BaseCrudService.getAll<any>('tarefasleilao'),
        BaseCrudService.getAll<ServiceRecords>('atendimentos'),
        BaseCrudService.getAll<UsuriosdoSistema>('usuariossistema')
      ]);
      setTarefas(tarefasRes.items);
      setAtendimentos(atendimentosRes.items.filter(a => a.serviceType?.toLowerCase().includes('leilao') || a.serviceType?.toLowerCase().includes('leilão')));
      setUsuarios(usuariosRes.items.filter(u => u.ativo));
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const handleSave = async () => {
    if (!formData.titulo || !formData.atendimentoRef) return;
    const data = { ...formData, dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined };

    if (editingTarefa) {
      await BaseCrudService.update('tarefasleilao', { _id: editingTarefa._id, ...data });
    } else {
      await BaseCrudService.create('tarefasleilao', { _id: crypto.randomUUID(), ...data, creationDate: new Date().toISOString() });
    }
    setIsDialogOpen(false);
    loadData();
    toast({ title: "Tarefa salva com sucesso" });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir esta tarefa?')) {
      await BaseCrudService.delete('tarefasleilao', id);
      loadData();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <AuctionNavigation />
      <main className="flex-1 p-6 lg:p-12 max-w-[100rem] mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Tarefas do Leilão</h1>
          <Button onClick={() => { setEditingTarefa(null); setFormData({titulo:'', description:'', status:'A Fazer', atendimentoRef:'', internalResponsibleId:'', dueDate:''}); setIsDialogOpen(true); }}>
            <Plus className="w-5 h-5 mr-2" /> Nova Tarefa
          </Button>
        </div>

        <Card className="rounded-2xl border-none shadow-xl overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Tarefa</TableHead>
                <TableHead>Processo</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-12">Carregando...</TableCell></TableRow> :
               tarefas.map(t => (
                <TableRow key={t._id}>
                  <TableCell className="py-4">
                    <div className="font-semibold">{t.titulo}</div>
                    <div className="text-sm text-slate-500 line-clamp-1">{t.description}</div>
                  </TableCell>
                  <TableCell>{atendimentos.find(a => a._id === t.atendimentoRef)?.contactName || '—'}</TableCell>
                  <TableCell>{usuarios.find(u => u._id === t.internalResponsibleId)?.name || '—'}</TableCell>
                  <TableCell><Badge variant={t.status === 'Concluída' ? 'default' : 'secondary'}>{t.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingTarefa(t); setFormData({titulo:t.titulo, description:t.description||'', status:t.status, atendimentoRef:t.atendimentoRef, internalResponsibleId:t.internalResponsibleId||'', dueDate:t.dueDate?format(new Date(t.dueDate),'yyyy-MM-dd'):''}); setIsDialogOpen(true); }}><Edit2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t._id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle>{editingTarefa ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Processo</Label>
              <Select value={formData.atendimentoRef} onValueChange={v => setFormData({...formData, atendimentoRef:v})}>
                <SelectTrigger><SelectValue placeholder="Selecione o processo" /></SelectTrigger>
                <SelectContent>{atendimentos.map(a => <SelectItem key={a._id} value={a._id}>{a.contactName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Título</Label>
              <Input value={formData.titulo} onChange={e => setFormData({...formData, titulo:e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Responsável</Label>
              <Select value={formData.internalResponsibleId} onValueChange={v => setFormData({...formData, internalResponsibleId:v})}>
                <SelectTrigger><SelectValue placeholder="Selecione o responsável" /></SelectTrigger>
                <SelectContent>{usuarios.map(u => <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Prazo</Label><Input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate:e.target.value})} /></div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData({...formData, status:v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A Fazer">A Fazer</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Concluída">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSave} className="w-full h-12 mt-4 bg-buttonbackground text-white rounded-xl">Salvar Tarefa</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}
