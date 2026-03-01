import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Clock,
    CheckCircle2,
    Calendar,
    MessageSquare,
    ExternalLink,
    Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BaseCrudService } from '@/integrations';
import { useUser } from '@clerk/clerk-react';
import { ServiceRecords, FinancingTasks, Clients } from '@/entities';
import AdminLayout from '@/components/layouts/AdminLayout';

export default function AdminFinanciamentoDashboardPage() {
    const { user } = useUser();
    const [tasks, setTasks] = useState<FinancingTasks[]>([]);
    const [processes, setProcesses] = useState<ServiceRecords[]>([]);
    const [loading, setLoading] = useState(true);
    const [sectorFilter, setSectorFilter] = useState<'all' | 'overdue' | 'open' | 'completed'>('all');

    // Modals state
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [selectedProcess, setSelectedProcess] = useState<ServiceRecords | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [tasksRes, processesRes] = await Promise.all([
                BaseCrudService.getAll<FinancingTasks>('tarefasfinanciamento'),
                BaseCrudService.getAll<ServiceRecords>('atendimentos')
            ]);

            setTasks(tasksRes.items || []);
            // Filter only financing processes and map with fallbacks for modal display
            const clientsRes = await BaseCrudService.getAll<Clients>('clientes');
            const clients = clientsRes.items || [];

            const financingProcesses = (processesRes.items || [])
                .filter(p => p.serviceType === 'Financiamento')
                .map(p => {
                    const client = clients.find(c => c._id === p.clientePrincipalRef);
                    return {
                        ...p,
                        cpf: (p as any).cpf || (p as any).cpfProponentePrincipal || client?.cpfCnpj || (p as any).proponenteCpf || (p as any).clienteCpf || (p as any).documento || '-',
                        numeroContratoSiopi: (p as any).numeroContratoSiopi || (p as any).financingContractNumber || (p as any).numeroContrato || (p as any).contrato || (p as any).siopi || '-'
                    };
                });

            setProcesses(financingProcesses);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // KPI Calculations
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const processesInProgress = processes.filter(p => p.status !== 'Concluído' && p.status !== 'Cancelado').length;

    const completedProcesses = processes.filter(p => p.status === 'Concluído');

    // Calculate Completed based on dates if available, otherwise fallback (for mock data consistency)
    const completedThisMonth = completedProcesses.filter(p => {
        if (!p._updatedDate) return true; // Fallback if no date
        const date = new Date(p._updatedDate);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    const completedThisYear = completedProcesses.filter(p => {
        if (!p._updatedDate) return true; // Fallback if no date
        const date = new Date(p._updatedDate);
        return date.getFullYear() === currentYear;
    }).length;


    // Filters logic
    const myTasks = tasks.filter(t => t.internalResponsibleId === user?.id && t.status !== 'Concluída');
    const sectorTasks = tasks.filter(t => {
        if (sectorFilter === 'all') return t.status !== 'Concluída' && t.status !== 'Cancelado';
        if (sectorFilter === 'overdue') return t.status === 'Atrasada';
        if (sectorFilter === 'open') return t.status !== 'Concluída' && t.status !== 'Cancelado';
        return true;
    });

    return (
        <AdminLayout>
            {/* Dashboard Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                            <LayoutDashboard className="w-6 h-6 text-secondary" />
                        </div>
                        <h1 className="font-heading text-4xl font-bold text-slate-900">
                            Dashboard Financiamento
                        </h1>
                    </div>
                    <p className="text-lg text-slate-500 font-paragraph">
                        Controle operacional e produtividade do setor
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                    <CardHeader className="pb-6">
                        <CardDescription className="text-slate-500 font-medium">Processos em Andamento</CardDescription>
                        <CardTitle className="text-4xl font-bold text-slate-900">{processesInProgress}</CardTitle>
                    </CardHeader>
                </Card>

                <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                    <CardHeader className="pb-6">
                        <CardDescription className="text-slate-500 font-medium">Concluídos no Mês</CardDescription>
                        <CardTitle className="text-4xl font-bold text-slate-900">{completedThisMonth}</CardTitle>
                    </CardHeader>
                </Card>

                <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                    <CardHeader className="pb-6">
                        <CardDescription className="text-slate-500 font-medium">Concluídos no Ano</CardDescription>
                        <CardTitle className="text-4xl font-bold text-slate-900">{completedThisYear}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* My Tasks Column */}
                <div className="lg:col-span-1">
                    <Card className="border-none shadow-sm rounded-3xl h-full flex flex-col bg-slate-50/50">
                        <CardHeader className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <CardTitle className="text-xl font-heading text-slate-900">Minhas Tarefas</CardTitle>
                                <Badge className="bg-secondary text-white border-none">{myTasks.length}</Badge>
                            </div>
                            <CardDescription>Pendências sob sua responsabilidade</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 flex-1">
                            <ScrollArea className="h-[500px] px-6 pb-6">
                                <div className="space-y-4">
                                    {myTasks.length === 0 ? (
                                        <div className="text-center py-10 text-slate-400 font-paragraph">Nenhuma tarefa pendente</div>
                                    ) : myTasks.map((task) => (
                                        <div key={task._id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                            <div className="flex justify-between items-start mb-3">
                                                <Badge variant="outline" className={`${task.status === 'Concluída' ? 'border-green-200 text-green-600 bg-green-50' :
                                                    'border-red-200 text-red-600 bg-red-50'
                                                    }`}>
                                                    {task.status}
                                                </Badge>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                    Prazo: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : '-'}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-700 mb-4 line-clamp-2">{task.description}</p>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" className="flex-1 text-[11px] h-8 rounded-lg border-slate-200 text-slate-600 hover:text-secondary hover:border-secondary/30">Iniciar</Button>
                                                <Button size="sm" variant="outline" className="flex-1 text-[11px] h-8 rounded-lg border-slate-200 text-slate-600 hover:text-green-600 hover:border-green-200">Concluir</Button>
                                                <Button
                                                    size="sm"
                                                    className="flex-1 text-[11px] h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-white"
                                                    onClick={() => {
                                                        const p = processes.find(p => p._id === task.atendimentoRef);
                                                        if (p) {
                                                            setSelectedProcess(p);
                                                            setShowProcessModal(true);
                                                        }
                                                    }}
                                                >
                                                    Abrir
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                {/* Sector Tasks Column */}
                <div className="lg:col-span-2">
                    <Card className="border-none shadow-sm rounded-3xl h-full bg-white">
                        <CardHeader className="p-8 border-b border-slate-50">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <CardTitle className="text-2xl font-heading text-slate-900">Tarefas do Setor</CardTitle>
                                    <CardDescription>Visão geral de todas as atividades do financiamento</CardDescription>
                                </div>
                                <Tabs value={sectorFilter} onValueChange={(v: any) => setSectorFilter(v)} className="bg-slate-50 p-1 rounded-xl border border-slate-100">
                                    <TabsList className="bg-transparent border-none gap-1">
                                        <TabsTrigger value="all" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Tudo</TabsTrigger>
                                        <TabsTrigger value="overdue" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm text-red-500">Atrasadas</TabsTrigger>
                                        <TabsTrigger value="open" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm text-blue-500">Em Aberto</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[520px] px-8 py-6">
                                <div className="space-y-3">
                                    {sectorTasks.map((task) => {
                                        const process = processes.find(p => p._id === task.atendimentoRef);
                                        return (
                                            <div key={task._id} className="p-4 rounded-2xl border border-slate-50 hover:bg-slate-50/80 transition-all flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${task.status === 'Concluída' ? 'bg-green-100 text-green-600' :
                                                        task.status === 'Atrasada' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {task.status === 'Concluída' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-sm font-bold text-slate-900">{process?.contactName || 'Processo não identificado'}</span>
                                                            {process?.pastaInterna && <Badge variant="outline" className="text-[9px] font-mono h-4 border-slate-200">{process.pastaInterna}</Badge>}
                                                        </div>
                                                        <p className="text-xs text-slate-500 font-paragraph">{task.description}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="hidden md:flex flex-col items-end gap-1">
                                                        <Badge variant="outline" className="text-[10px] font-bold p-0 text-slate-400 border-none">
                                                            {task.status}
                                                        </Badge>
                                                        <span className="text-[11px] text-slate-400">Resp: {task.externalResponsibleName || task.internalResponsibleId || 'N/A'}</span>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 rounded-lg border-slate-200 text-slate-600 hover:text-secondary hover:border-secondary/30"
                                                        onClick={() => {
                                                            const p = processes.find(p => p._id === task.atendimentoRef);
                                                            if (p) {
                                                                setSelectedProcess(p);
                                                                setShowProcessModal(true);
                                                            }
                                                        }}
                                                    >
                                                        Detalhes
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* PROCESS POPUP */}
            <Dialog open={showProcessModal} onOpenChange={setShowProcessModal}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-none rounded-3xl p-8 shadow-2xl">
                    {selectedProcess && (
                        <div className="space-y-8">
                            <DialogHeader>
                                <div className="flex justify-between items-start pr-8">
                                    <div>
                                        <Badge className="bg-blue-100 text-blue-700 border-none mb-3">CONTRATO: {selectedProcess.pastaInterna || 'S/N'}</Badge>
                                        <DialogTitle className="text-3xl font-heading text-slate-900 mb-2">{selectedProcess.contactName}</DialogTitle>
                                        <div className="flex items-center gap-4 text-slate-500">
                                            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Criado em {selectedProcess.creationDate ? new Date(selectedProcess.creationDate).toLocaleDateString('pt-BR') : '-'}</span>
                                            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Fase: {selectedProcess.faseFinanciamento || 'Não definida'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Status</div>
                                        <Badge className={`px-4 py-1.5 rounded-full text-xs font-bold border-none ${selectedProcess.status === 'Concluído' ? 'bg-green-100 text-green-700' :
                                            selectedProcess.status === 'Cancelado' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {selectedProcess.status || 'Ativo'}
                                        </Badge>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="bg-slate-50 p-6 rounded-2xl">
                                        <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <Users className="w-3 h-3" /> Informações de Contato
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                <span className="text-xs text-slate-500">Email</span>
                                                <span className="text-xs font-medium text-slate-700">{selectedProcess.contactEmail || '-'}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                <span className="text-xs text-slate-500">Telefone</span>
                                                <span className="text-xs font-medium text-slate-700">{selectedProcess.contactPhone || '-'}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                <span className="text-xs text-slate-500">CPF</span>
                                                <span className="text-xs font-medium text-slate-700">{(selectedProcess as any).cpf || '-'}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                <span className="text-xs text-slate-500">Contrato SIOPI</span>
                                                <span className="text-xs font-medium text-slate-700">{(selectedProcess as any).numeroContratoSiopi || '-'}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                <span className="text-xs text-slate-500">Origem</span>
                                                <span className="text-xs font-medium text-slate-700">{selectedProcess.canalOrigem || 'Direto'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid gap-4 bg-slate-50 p-6 rounded-2xl">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Fase Atual</span>
                                            <Badge variant="outline" className="w-fit mt-1 border-blue-200 text-blue-700 bg-blue-50">{selectedProcess.faseFinanciamento}</Badge>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Prioridade</span>
                                            <span className="text-slate-700 font-medium">{selectedProcess.priority || 'Normal'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pasta Interna</span>
                                            <span className="text-slate-700 font-mono font-bold tracking-widest">{selectedProcess.pastaInterna || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {selectedProcess.notes && (
                                <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100">
                                    <h4 className="font-heading text-sm font-bold text-orange-700 mb-2 flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" /> Observações Internas
                                    </h4>
                                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{selectedProcess.notes}</p>
                                </div>
                            )}

                            <div className="flex gap-4 pt-10">
                                <Button
                                    className="flex-1 bg-secondary hover:bg-secondary/90 text-white font-bold h-14 rounded-2xl shadow-lg"
                                    onClick={() => {
                                        window.location.href = `/admin/financiamento/${selectedProcess._id}`;
                                    }}
                                >
                                    Ir para Gestão Completa
                                    <ExternalLink className="w-4 h-4 ml-2" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 border-slate-200 h-14 rounded-2xl font-bold text-slate-600"
                                    onClick={() => setShowProcessModal(false)}
                                >
                                    Fechar Resumo
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
