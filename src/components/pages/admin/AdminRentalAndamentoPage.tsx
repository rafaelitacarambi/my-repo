import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RentalNavigation from '@/components/RentalNavigation';
import { BaseCrudService } from '@/integrations';
import { ServiceRecords, Clients } from '@/entities';

export default function AdminRentalAndamentoPage() {
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
        BaseCrudService.getAll<any>('pendenciaslocacoes'),
        BaseCrudService.getAll<any>('tarefaslocacoes')
      ]);

      const activeCases = casesRes.items
        .filter(c => {
          const type = String(c.serviceType || '').toLowerCase();
          const status = String(c.status || '').toLowerCase();
          return (type.includes('loca') || type.includes('aluguel')) && !status.includes('conclui') && !status.includes('cancela');
        })
        .map(a => {
          const client = clientsRes.items.find(cl => cl._id === a.clientePrincipalRef);
          return {
            ...a,
            contactName: a.contactName || client?.clientName || 'Sem nome',
            cpf: client?.cpfCnpj || '-',
            pendenciasAbertas: pendingsRes.items.filter((p: any) => p.atendimentoRef === a._id && p.status !== 'Concluída').length,
            tarefasAbertas: tasksRes.items.filter((t: any) => t.atendimentoRef === a._id && t.status !== 'Concluída').length,
          };
        });
      setCases(activeCases);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const filteredLines = cases.filter(c => 
    c.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cpf?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-light-gray">
      <Header />
      <RentalNavigation />
      
      <section className="w-full bg-gradient-to-br from-purple-600 via-purple-700 to-fuchsia-800 py-8">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl text-white font-heading">Locações em Andamento</h1>
            <p className="text-white/80">Acompanhamento completo de todos os aluguéis ativos</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="relative min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
              <Input 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                placeholder="Buscar por cliente, CPF..." 
                className="pl-10 h-11 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 transition-all" 
              />
            </div>
            <Button className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg">
              <Download className="w-4 h-4 mr-2" /> Exportar
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-8">
        <Card className="rounded-2xl border-none shadow-xl overflow-hidden bg-white">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-slate-50 text-slate-700 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Inquilino</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">CPF</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Fase / Status</th>
                <th className="px-6 py-4 font-semibold text-center uppercase tracking-wider">Pendências</th>
                <th className="px-6 py-4 font-semibold text-center uppercase tracking-wider">Tarefas</th>
                <th className="px-6 py-4 font-semibold text-right uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLines.map(c => (
                <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                        {c.contactName?.charAt(0)}
                      </div>
                      <div className="font-semibold text-slate-900">{c.contactName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{c.cpf}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-purple-600 font-bold text-xs uppercase tracking-tight">{c.faseLocacao || 'Novos'}</span>
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{c.status || 'Pendente'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={c.pendenciasAbertas > 0 ? 'destructive' : 'secondary'} className="rounded-full h-7 w-7 flex items-center justify-center p-0 font-bold text-xs">
                      {c.pendenciasAbertas}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge className="rounded-full h-7 w-7 flex items-center justify-center p-0 bg-amber-50 text-amber-600 border-amber-200 font-bold text-xs">
                      {c.tarefasAbertas}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate(`/admin/locacoes/kanban?openCard=${c._id}`)} 
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 font-bold rounded-lg transition-all"
                    >
                      Ver no Kanban <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLines.length === 0 && (
            <div className="p-16 text-center text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Nenhuma locação encontrada</p>
            </div>
          )}
        </Card>
      </div>
      <Footer />
    </div>
  );
}
