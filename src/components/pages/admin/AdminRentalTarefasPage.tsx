import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RentalNavigation from '@/components/RentalNavigation';
import { BaseCrudService } from '@/integrations';
import { ServiceRecords, UsuriosdoSistema } from '@/entities';
import { format } from 'date-fns';

export default function AdminRentalTarefasPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [atendimentos, setAtendimentos] = useState<ServiceRecords[]>([]);
  const [usuarios, setUsuarios] = useState<UsuriosdoSistema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTarefa, setEditingTarefa] = useState<any | null>(null);

  const [formData, setFormData] = useState({ titulo: '', status: 'A Fazer', atendimentoRef: '', internalResponsibleId: '', dueDate: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tarRes, ateRes, usuRes] = await Promise.all([
        BaseCrudService.getAll<any>('tarefaslocacoes'),
        BaseCrudService.getAll<ServiceRecords>('atendimentos'),
        BaseCrudService.getAll<UsuriosdoSistema>('usuariossistema')
      ]);
      setTarefas(tarRes.items);
      setAtendimentos(ateRes.items.filter(a => a.serviceType?.toLowerCase().includes('loca') || a.serviceType?.toLowerCase().includes('aluguel')));
      setUsuarios(usuRes.items.filter(u => u.ativo !== false));
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleSave = async () => {
    if (!formData.titulo || !formData.atendimentoRef) return;
    const data = { ...formData, dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined };
    if (editingTarefa) await BaseCrudService.update('tarefaslocacoes', { _id: editingTarefa._id, ...data });
    else await BaseCrudService.create('tarefaslocacoes', { _id: crypto.randomUUID(), ...data, creationDate: new Date().toISOString() });
    setIsDialogOpen(false); loadData(); toast({ title: "Sucesso" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header /><RentalNavigation />
      <main className="flex-1 p-6 lg:p-12 max-w-[100rem] mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Tarefas de Locações</h1>
          <Button onClick={() => { setEditingTarefa(null); setFormData({titulo:'', status:'A Fazer', atendimentoRef:'', internalResponsibleId:'', dueDate:''}); setIsDialogOpen(true); }}><Plus className="mr-2" /> Nova Tarefa</Button>
        </div>
        <Card className="rounded-2xl border-none shadow-xl overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow><TableHead>Tarefa</TableHead><TableHead>Processo</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={4} className="text-center py-12">Carregando...</TableCell></TableRow> :
               tarefas.map(t => (
                <TableRow key={t._id}>
                  <TableCell className="py-4 font-semibold">{t.titulo}</TableCell>
                  <TableCell>{atendimentos.find(a => a._id === t.atendimentoRef)?.contactName || '—'}</TableCell>
                  <TableCell><Badge>{t.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingTarefa(t); setFormData({titulo:t.titulo, status:t.status, atendimentoRef:t.atendimentoRef, internalResponsibleId:t.internalResponsibleId||'', dueDate:t.dueDate?format(new Date(t.dueDate),'yyyy-MM-dd'):''}); setIsDialogOpen(true); }}><Edit2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogContent><DialogHeader><DialogTitle>Tarefa</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <Label>Processo</Label>
          <Select value={formData.atendimentoRef} onValueChange={v => setFormData({...formData, atendimentoRef:v})}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{atendimentos.map(a => <SelectItem key={a._id} value={a._id}>{a.contactName}</SelectItem>)}</SelectContent>
          </Select>
          <Label>Título</Label><Input value={formData.titulo} onChange={e => setFormData({...formData, titulo:e.target.value})} />
          <Button onClick={handleSave} className="w-full bg-buttonbackground text-white">Salvar</Button>
        </div>
      </DialogContent></Dialog><Footer />
    </div>
  );
}
