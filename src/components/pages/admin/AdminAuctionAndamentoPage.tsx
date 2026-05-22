import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Columns, Download, ArrowRight, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuctionNavigation from '@/components/AuctionNavigation';
import { BaseCrudService } from '@/integrations';
import { ServiceRecords, Clients } from '@/entities';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminAuctionAndamentoPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [casesRes, clientsRes, pendingsRes, tasksRes] = await Promise.all([
        BaseCrudService.getAll<ServiceRecords>('atendimentos'),
        BaseCrudService.getAll<Clients>('clientes'),
        BaseCrudService.getAll<any>('pendenciasleilao'),
        BaseCrudService.getAll<any>('tarefasleilao')
      ]);

      const activeCases = casesRes.items
        .filter(c => {
          const type = String(c.serviceType || '').toLowerCase();
          const status = String(c.status || '').toLowerCase();
          return (type.includes('leilao') || type.includes('leilão')) && 
                 !status.includes('conclui') && !status.includes('cancela');
        })
        .map(a => {
          const client = clientsRes.items.find(c => c._id === a.clientePrincipalRef);
          const casePendings = pendingsRes.items.filter((p: any) => p.atendimentoRef === a._id && p.status !== 'Concluída');
          const caseTasks = tasksRes.items.filter((t: any) => t.atendimentoRef === a._id && t.status !== 'Concluída');

          return {
            ...a,
            contactName: a.contactName || client?.clientName || 'Sem nome',
            cpf: client?.cpfCnpj || '-',
            pendenciasAbertas: casePendings.length,
            tarefasAbertas: caseTasks.length,
          };
        });

      setCases(activeCases);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const filteredCases = cases.filter(c => 
    c.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cpf?.includes(searchTerm)
  );

  if (isLoading) return <div className="min-h-screen bg-light-gray"><Header /><AuctionNavigation /><div className="flex justify-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div></div><Footer /></div>;

  return (
    <div className="min-h-screen bg-light-gray">
      <Header />
      <AuctionNavigation />

      <section className="w-full bg-gradient-to-br from-secondary via-secondary/90 to-buttonbackground py-8">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl text-white font-heading">Processos de Leilão em Andamento</h1>
            <p className="text-white/80">Visão geral de todos os leilões ativos</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="relative min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por cliente, CPF..." className="pl-10 h-11 bg-white/10 border-white/20 text-white placeholder:text-white/60" />
            </div>
            <Button className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20"><Download className="w-4 h-4 mr-2" /> Exportar</Button>
          </div>
        </div>
      </section>

      <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-8">
        <Card className="rounded-2xl border-none shadow-xl overflow-hidden bg-white">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-slate-50 text-slate-700 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold">Cliente</th>
                <th className="px-6 py-4 font-semibold">CPF</th>
                <th className="px-6 py-4 font-semibold">Fase / Status</th>
                <th className="px-6 py-4 font-semibold text-center">Pendências</th>
                <th className="px-6 py-4 font-semibold text-center">Tarefas</th>
                <th className="px-6 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.map((c) => (
                <tr key={c._id} className="bg-white hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">{c.contactName?.charAt(0)}</div>
                      <div className="font-semibold text-slate-900">{c.contactName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{c.cpf}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-secondary font-bold text-xs uppercase">{c.faseLeilao || 'Novos'}</span>
                      <span className="text-slate-400 text-xs">{c.status || 'Pendente'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={c.pendenciasAbertas > 0 ? 'destructive' : 'secondary'} className="rounded-full h-7 w-7 flex items-center justify-center p-0">{c.pendenciasAbertas}</Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={c.tarefasAbertas > 0 ? 'secondary' : 'outline'} className="rounded-full h-7 w-7 flex items-center justify-center p-0 bg-amber-50 text-amber-600 border-amber-200">{c.tarefasAbertas}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/leilao/kanban?openCard=${c._id}`)} className="text-secondary hover:text-secondary/80 hover:bg-secondary/10">Ver no Kanban <ArrowRight className="w-4 h-4 ml-1" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCases.length === 0 && <div className="p-12 text-center text-slate-400"><FileText className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>Nenhum processo encontrado</p></div>}
        </Card>
      </div>
      <Footer />
    </div>
  );
}
