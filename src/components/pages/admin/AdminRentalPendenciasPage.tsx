import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Search, Eye } from 'lucide-react';
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
import { ServiceRecords } from '@/entities';
import { format } from 'date-fns';

export default function AdminRentalPendenciasPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pendencias, setPendencias] = useState<any[]>([]);
  const [atendimentos, setAtendimentos] = useState<ServiceRecords[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPendencia, setEditingPendencia] = useState<any | null>(null);

  const [formData, setFormData] = useState({ title: '', status: 'Pendente', atendimentoRef: '', dueDate: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pendRes, atendRes] = await Promise.all([
        BaseCrudService.getAll<any>('pendenciaslocacoes'),
        BaseCrudService.getAll<ServiceRecords>('atendimentos')
      ]);
      setAtendimentos(atendRes.items.filter(a => a.serviceType?.toLowerCase().includes('loca') || a.serviceType?.toLowerCase().includes('aluguel')));
      setPendencias(pendRes.items.filter(p => p.status !== 'Concluída'));
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.atendimentoRef) return;
    const data = { ...formData, dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined };
    if (editingPendencia) await BaseCrudService.update('pendenciaslocacoes', { _id: editingPendencia._id, ...data });
    else await BaseCrudService.create('pendenciaslocacoes', { _id: crypto.randomUUID(), ...data, creationDate: new Date().toISOString() });
    setIsDialogOpen(false); loadData(); toast({ title: "Sucesso" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header /><RentalNavigation />
      <main className="flex-1 p-6 lg:p-12 max-w-[100rem] mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Pendências de Locações</h1>
          <Button onClick={() => { setEditingPendencia(null); setFormData({title:'', status:'Pendente', atendimentoRef:'', dueDate:''}); setIsDialogOpen(true); }}><Plus className="mr-2" /> Nova Pendência</Button>
        </div>
        <Card className="rounded-2xl border-none shadow-xl overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow><TableHead>Pendência</TableHead><TableHead>Processo</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={4} className="text-center py-12">Carregando...</TableCell></TableRow> :
               pendencias.map(p => (
                <TableRow key={p._id}>
                  <TableCell className="py-4 font-semibold">{p.title}</TableCell>
                  <TableCell>{atendimentos.find(a => a._id === p.atendimentoRef)?.contactName || '—'}</TableCell>
                  <TableCell><Badge variant="outline">{p.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingPendencia(p); setFormData({title:p.title, status:p.status, atendimentoRef:p.atendimentoRef, dueDate:p.dueDate?format(new Date(p.dueDate),'yyyy-MM-dd'):''}); setIsDialogOpen(true); }}><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/locacoes/kanban?openCard=${p.atendimentoRef}`)}><Eye className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogContent><DialogHeader><DialogTitle>Pendência</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <Label>Processo</Label>
          <Select value={formData.atendimentoRef} onValueChange={v => setFormData({...formData, atendimentoRef:v})}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{atendimentos.map(a => <SelectItem key={a._id} value={a._id}>{a.contactName}</SelectItem>)}</SelectContent>
          </Select>
          <Label>Título</Label><Input value={formData.title} onChange={e => setFormData({...formData, title:e.target.value})} />
          <Button onClick={handleSave} className="w-full bg-buttonbackground text-white">Salvar</Button>
        </div>
      </DialogContent></Dialog><Footer />
    </div>
  );
}
