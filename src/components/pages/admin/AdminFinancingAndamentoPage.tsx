import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    FileText,
    User,
    ArrowRight,
    Filter,
    Columns,
    Check,
    AlertCircle,
    CheckCircle,
    Building2,
    Hash,
    Save,
    Download
} from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FinancingNavigation from '@/components/FinancingNavigation';
import { BaseCrudService } from '@/integrations';
import { ServiceRecords, UsuriosdoSistema, Clients } from '@/entities';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VisibleColumns {
    cliente: boolean;
    cpf: boolean;
    contrato: boolean;
    fase: boolean;
    dataEntrada: boolean;
    pasta: boolean;
    agencia: boolean;
    pendencias: boolean;
    tarefas: boolean;
}

export default function AdminFinancingAndamentoPage() {
    const navigate = useNavigate();
    // Using ServiceRecords as the base type, assuming it has custom fields like cpf, numeroContratoSiopi
    const [cases, setCases] = useState<any[]>([]);
    const [usuarios, setUsuarios] = useState<UsuriosdoSistema[]>([]);
    const [clients, setClients] = useState<Clients[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null);

    const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>({
        cliente: true,
        cpf: true,
        contrato: true,
        fase: true,
        dataEntrada: true,
        pasta: true,
        agencia: true,
        pendencias: true,
        tarefas: true
    });

    // Quick action modals
    const [showQuickTaskModal, setShowQuickTaskModal] = useState(false);
    const [showQuickPendingModal, setShowQuickPendingModal] = useState(false);
    const [quickActionCaseId, setQuickActionCaseId] = useState<string | null>(null);

    const [newTaskData, setNewTaskData] = useState({
        description: '',
        internalResponsibleId: '',
        dueDate: '',
        externalResponsibleName: '',
        responsibleType: 'Interno' as 'Interno' | 'Externo'
    });

    const [newPendingData, setNewPendingData] = useState({
        description: '',
        responsiblePartyType: 'Interno' as 'Interno' | 'Cliente',
        averageDaysToComplete: 7
    });

    const [users, setUsers] = useState<UsuriosdoSistema[]>([]);
    const financingTeam = users.filter(u => (u.setores?.includes('Financiamento') || u.setores?.includes('Financiamentos')) && u.ativo !== false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [casesResult, usuariosResult, clientsResult, pendingsResult, tasksResult] = await Promise.all([
                BaseCrudService.getAll<ServiceRecords>('atendimentos', undefined, { limit: 1000 }),
                BaseCrudService.getAll<UsuriosdoSistema>('usuariossistema', undefined, { limit: 1000 }),
                BaseCrudService.getAll<Clients>('clientes', undefined, { limit: 1000 }),
                BaseCrudService.getAll<any>('pendenciasfinanciamento', undefined, { limit: 1000 }),
                BaseCrudService.getAll<any>('tarefasfinanciamento', undefined, { limit: 1000 })
            ]);

            console.log('[DEBUG-LIST] Total fetched:', casesResult.items.length);

            // Filter for Financing cases
            const activeCases = casesResult.items
                .filter(c => {
                    const type = String(c.serviceType || '');
                    const status = String(c.status || '');

                    const isFinancing = type.toLowerCase().includes('financ');
                    const isCompleted = status.toLowerCase().includes('conclui') ||
                        status.toLowerCase().includes('cancela');

                    return isFinancing && !isCompleted;
                })
                .map(a => {
                    const client = clientsResult.items.find(c => c._id === a.clientePrincipalRef);
                    const casePendings = pendingsResult.items.filter((p: any) => p.atendimentoRef === a._id && p.status !== 'Resolvida' && p.status !== 'Concluído');
                    const caseTasks = tasksResult.items.filter((t: any) => t.atendimentoRef === a._id && t.status !== 'Concluída' && t.status !== 'Concluido');

                    return {
                        ...a,
                        contactName: a.contactName || client?.clientName || (a as any).proponentePrincipal || 'Sem nome',
                        creationDate: a.creationDate || a._createdDate,
                        cpf: (a as any).cpf || (a as any).cpfProponentePrincipal || client?.cpfCnpj || (a as any).proponenteCpf || (a as any).clienteCpf || (a as any).documento || '-',
                        numeroContratoSiopi: (a as any).numeroContratoSiopi || (a as any).financingContractNumber || (a as any).numeroContrato || (a as any).contrato || (a as any).siopi || '-',
                        agencia: a.unidadeResponsavelRef || 'N/I',
                        pastaInterna: (a as any).pastaInterna || a._id.substring(0, 8).toUpperCase(),
                        pendenciasAbertas: casePendings.length,
                        tarefasAbertas: caseTasks.length,
                        pendenciasResumo: casePendings.map((p: any) => p.title || p.description),
                        tarefasResumo: caseTasks.map((t: any) => t.titulo || t.description)
                    };
                });

            console.log('[DEBUG-LIST] Final list count:', activeCases.length);
            setCases(activeCases);
            setUsuarios(usuariosResult.items.filter(u => u.ativo));
            setUsers(usuariosResult.items.filter(u => u.ativo));
            setClients(clientsResult.items); // Set clients state
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateQuickTask = async () => {
        if (!quickActionCaseId || !newTaskData.description) return;

        try {
            const now = new Date().toISOString();
            const dueDate = newTaskData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

            const newTask: any = {
                _id: crypto.randomUUID(),
                atendimentoRef: quickActionCaseId,
                titulo: newTaskData.description.substring(0, 100),
                description: newTaskData.description,
                status: 'A Fazer',
                responsibleType: 'Equipe Financiamento',
                responsavelExternoRef: newTaskData.internalResponsibleId,
                dueDate,
                creationDate: now
            };

            await BaseCrudService.create('tarefasfinanciamento', newTask);

            // Create history entry
            await BaseCrudService.create<any>('historicointeracoes', {
                _id: crypto.randomUUID(),
                atendimentoRef: quickActionCaseId,
                tipoEvento: 'Tarefa_Criada',
                interactionType: 'Criação de tarefa',
                interactionDescription: `Nova tarefa criada: "${newTask.titulo}"`,
                interactionDate: now,
                autorTipo: 'Sistema'
            });

            setNewTaskData({
                description: '',
                internalResponsibleId: '',
                dueDate: '',
                externalResponsibleName: '',
                responsibleType: 'Interno'
            });
            setShowQuickTaskModal(false);
            setQuickActionCaseId(null);

            // Use alert for now or internal toast if available, but I'll add a simple toast state
            alert('Tarefa criada com sucesso!');
            loadData();
        } catch (error) {
            console.error('Error creating quick task:', error);
            alert('Erro ao criar tarefa');
        }
    };

    const handleCreateQuickPending = async () => {
        if (!quickActionCaseId || !newPendingData.description) return;

        try {
            const now = new Date().toISOString();
            const dueDate = new Date(Date.now() + (newPendingData.averageDaysToComplete || 7) * 24 * 60 * 60 * 1000).toISOString();

            const newPending: any = {
                _id: crypto.randomUUID(),
                atendimentoRef: quickActionCaseId,
                title: newPendingData.description.substring(0, 100),
                description: newPendingData.description,
                status: 'Pendente',
                priority: 'Média',
                dueDate,
                responsiblePartyType: newPendingData.responsiblePartyType,
                responsiblePartyDetails: '',
                taskAutomaticallyCreated: false,
                creationDate: now,
                bloqueiaFase: false,
                categoria: ''
            };

            await BaseCrudService.create('pendenciasfinanciamento', newPending);

            // Create history entry
            await BaseCrudService.create<any>('historicointeracoes', {
                _id: crypto.randomUUID(),
                atendimentoRef: quickActionCaseId,
                tipoEvento: 'Pendencia_Criada',
                interactionType: 'Criação de pendência',
                interactionDescription: `Nova pendência criada: "${newPending.title}"`,
                interactionDate: now,
                autorTipo: 'Sistema'
            });

            setNewPendingData({
                description: '',
                responsiblePartyType: 'Interno',
                averageDaysToComplete: 7
            });
            setShowQuickPendingModal(false);
            setQuickActionCaseId(null);

            alert('Pendência criada com sucesso!');
            loadData();
        } catch (error) {
            console.error('Error creating quick pending:', error);
            alert('Erro ao criar pendência');
        }
    };

    const handleExportToExcel = () => {
        try {
            const exportData = filteredCases.map(c => ({
                'Cliente': c.contactName,
                'CPF': c.cpf,
                'Contrato SIOPI': c.numeroContratoSiopi,
                'Pasta': c.pastaInterna,
                'Agência': c.agencia,
                'Fase': getStageName(c.faseFinanciamento),
                'Status': c.status || 'Pendente',
                'Pendências': (c.pendenciasResumo || []).join('; '),
                'Tarefas': (c.tarefasResumo || []).join('; '),
                'Início na Fase': c.dataPrevistaConclusao ? format(new Date(c.dataPrevistaConclusao), 'dd/MM/yyyy') : '-'
            }));

            const ws = utils.json_to_sheet(exportData);
            const wb = utils.book_new();
            utils.book_append_sheet(wb, ws, 'Financiamentos');
            
            writeFile(wb, `Financiamentos_Em_Andamento_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
            alert('Exportação concluída com sucesso!');
        } catch (error) {
            console.error('Error exporting to excel:', error);
            alert('Erro ao exportar para Excel');
        }
    };

    const getFilteredCases = () => {
        let filtered = cases;

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(c =>
                c.contactName?.toLowerCase().includes(lowerTerm) ||
                c.agencia?.toLowerCase().includes(lowerTerm) ||
                c.pastaInterna?.toLowerCase().includes(lowerTerm) ||
                c.cpf?.includes(lowerTerm) ||
                c.numeroContratoSiopi?.includes(lowerTerm)
            );
        }

        if (statusFilter !== 'all') {
            // Logic for status filter if needed, currently filtering by column/stage
            filtered = filtered.filter(c => c.faseFinanciamento === statusFilter);
        }

        return filtered;
    };

    const getResponsibleName = (responsibleId?: string) => {
        if (!responsibleId) return 'Não atribuído';
        const user = usuarios.find(u => u._id === responsibleId);
        return user?.name || 'Usuário não encontrado';
    };

    // Map faseFinanciamento to readable name
    const getStageName = (stageId?: string) => {
        if (!stageId) return 'Desconhecido';
        const stages: Record<string, string> = {
            'novos-clientes': 'Novos Clientes',
            'engenharia': 'Engenharia',
            'fgts': 'FGTS',
            'sistemas-caixa': 'Sistemas Caixa',
            'conformidade': 'Conformidade',
            'agencia': 'Agência',
            'registro': 'Registro',
            'conclusao': 'Conclusão',
            'acompanhamento-obra': 'Acompanhamento de Obra'
        };
        return stages[stageId] || stageId;
    };

    const filteredCases = getFilteredCases();

    const toggleColumn = (column: keyof VisibleColumns) => {
        setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-light-gray">
                <Header />
                <FinancingNavigation />
                <div className="flex items-center justify-center py-24">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-light-gray">
            <Header />
            <FinancingNavigation />

            <section className="w-full bg-gradient-to-br from-secondary via-secondary/90 to-buttonbackground py-8">
                <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="font-heading text-3xl text-white mb-2">Processos em Andamento</h1>
                            <p className="text-white/80">
                                Visão geral de todos os financiamentos ativos
                            </p>
                        </div>

                        <div className="flex gap-3 items-center">
                            <div className="relative min-w-[300px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar por cliente, CPF, contrato..."
                                    className="pl-10 h-11 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                                />
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-11 bg-white/10 border-white/20 text-white hover:bg-white/20">
                                        <Columns className="w-4 h-4 mr-2" />
                                        Colunas
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>Visualizar Colunas</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.cliente}
                                        onCheckedChange={() => toggleColumn('cliente')}
                                    >
                                        Cliente
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.cpf}
                                        onCheckedChange={() => toggleColumn('cpf')}
                                    >
                                        CPF
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.contrato}
                                        onCheckedChange={() => toggleColumn('contrato')}
                                    >
                                        Contrato SIOPI
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.fase}
                                        onCheckedChange={() => toggleColumn('fase')}
                                    >
                                        Fase / Status
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.dataEntrada}
                                        onCheckedChange={() => toggleColumn('dataEntrada')}
                                    >
                                        Início na Fase
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.pasta}
                                        onCheckedChange={() => toggleColumn('pasta')}
                                    >
                                        Pasta
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.agencia}
                                        onCheckedChange={() => toggleColumn('agencia')}
                                    >
                                        Agência
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.pendencias}
                                        onCheckedChange={() => toggleColumn('pendencias')}
                                    >
                                        Pendências
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.tarefas}
                                        onCheckedChange={() => toggleColumn('tarefas')}
                                    >
                                        Tarefas
                                    </DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button 
                                onClick={handleExportToExcel}
                                className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Exportar Excel
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="w-full py-8">
                <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-gray-50 text-gray-700 border-b">
                                        <tr>
                                            {visibleColumns.cliente && <th className="px-6 py-4 font-semibold">Cliente</th>}
                                            {visibleColumns.cpf && <th className="px-6 py-4 font-semibold">CPF</th>}
                                            {visibleColumns.contrato && <th className="px-6 py-4 font-semibold">Contrato</th>}
                                            {visibleColumns.pasta && <th className="px-6 py-4 font-semibold">Pasta</th>}
                                            {visibleColumns.agencia && <th className="px-6 py-4 font-semibold">Agência</th>}
                                            {visibleColumns.fase && <th className="px-6 py-4 font-semibold">Fase / Status</th>}
                                            {visibleColumns.pendencias && <th className="px-6 py-4 font-semibold text-center">Pendências</th>}
                                            {visibleColumns.tarefas && <th className="px-6 py-4 font-semibold text-center">Tarefas</th>}
                                            {visibleColumns.dataEntrada && <th className="px-6 py-4 font-semibold text-center">Início na Fase</th>}
                                            <th className="px-6 py-4 font-semibold text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredCases.map((processo) => (
                                            <tr key={processo._id} className="bg-white hover:bg-gray-50 transition-colors">
                                                {visibleColumns.cliente && (
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                                {processo.contactName?.charAt(0) || '?'}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-gray-900 group-hover:text-secondary transition-colors">{processo.contactName}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                )}
                                                {visibleColumns.cpf && (
                                                    <td className="px-6 py-4 text-gray-600">
                                                        {processo.cpf || '-'}
                                                    </td>
                                                )}
                                                {visibleColumns.contrato && (
                                                    <td className="px-6 py-4 text-gray-600">
                                                        {processo.numeroContratoSiopi || '-'}
                                                    </td>
                                                )}
                                                {visibleColumns.pasta && (
                                                    <td className="px-6 py-4 text-gray-600">
                                                        <span className="font-bold text-slate-800 uppercase">{processo.pastaInterna}</span>
                                                    </td>
                                                )}
                                                {visibleColumns.agencia && (
                                                    <td className="px-6 py-4 text-gray-600">
                                                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                                                            {processo.agencia}
                                                        </Badge>
                                                    </td>
                                                )}
                                                {visibleColumns.fase && (
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-secondary font-bold text-sm">
                                                                {getStageName(processo.faseFinanciamento)?.toUpperCase()}
                                                            </span>
                                                            <span className="text-foreground/60 text-xs">
                                                                {processo.status || 'Pendente'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                )}
                                                {visibleColumns.pendencias && (
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => {
                                                                setQuickActionCaseId(processo._id);
                                                                setShowQuickPendingModal(true);
                                                            }}
                                                            className={`flex items-center gap-1 mx-auto px-2 py-1 rounded-lg text-xs font-bold transition-all ${processo.pendenciasAbertas > 0 ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100' : 'bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                                                        >
                                                            <AlertCircle className="w-3.5 h-3.5" />
                                                            {processo.pendenciasAbertas}
                                                        </button>
                                                        {processo.pendenciasAbertas > 0 && (
                                                            <div className="mt-2 space-y-1 text-left max-w-[200px] mx-auto">
                                                                {processo.pendenciasResumo?.map((p: string, i: number) => (
                                                                    <p key={i} className="text-[10px] text-red-500 font-medium truncate">• {p}</p>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                )}
                                                {visibleColumns.tarefas && (
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => {
                                                                setQuickActionCaseId(processo._id);
                                                                setShowQuickTaskModal(true);
                                                            }}
                                                            className={`flex items-center gap-1 mx-auto px-2 py-1 rounded-lg text-xs font-bold transition-all ${processo.tarefasAbertas > 0 ? 'bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100' : 'bg-gray-50 text-gray-400 hover:text-amber-500 hover:bg-amber-50'}`}
                                                        >
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                            {processo.tarefasAbertas}
                                                        </button>
                                                        {processo.tarefasAbertas > 0 && (
                                                            <div className="mt-2 space-y-1 text-left max-w-[200px] mx-auto">
                                                                {processo.tarefasResumo?.map((t: string, i: number) => (
                                                                    <p key={i} className="text-[10px] text-amber-500 font-medium truncate">• {t}</p>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                )}
                                                {visibleColumns.dataEntrada && (
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-sm font-medium">
                                                                {processo.dataPrevistaConclusao ? format(new Date(processo.dataPrevistaConclusao), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                                                            </span>
                                                            <Badge variant="outline" className="mt-1 text-[10px] h-5 bg-secondary/5 text-secondary border-secondary/20">
                                                                {(() => {
                                                                    const entryDate = processo.dataPrevistaConclusao ? new Date(processo.dataPrevistaConclusao) : new Date(processo._createdDate || new Date());
                                                                    const diff = Math.floor((new Date().getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
                                                                    return `${diff} ${diff === 1 ? 'dia' : 'dias'}`;
                                                                })()}
                                                            </Badge>
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigate(`/admin/financiamento-kanban?openCard=${processo._id}&origin=andamento`)}
                                                        className="text-secondary hover:text-secondary/80 hover:bg-secondary/10"
                                                    >
                                                        Ver Detalhes
                                                        <ArrowRight className="w-4 h-4 ml-1" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}

                                        {filteredCases.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                                    <p>Nenhum processo encontrado</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

             <Footer />

            {/* Quick Task Modal */}
            <Dialog open={showQuickTaskModal} onOpenChange={setShowQuickTaskModal}>
                <DialogContent className="max-w-md p-6 rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-amber-600">
                            <CheckCircle className="w-6 h-6" />
                            Nova Tarefa Rápida
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700">O que precisa ser feito?</Label>
                            <Input 
                                placeholder="Descreva a tarefa..."
                                value={newTaskData.description}
                                onChange={(e) => setNewTaskData({...newTaskData, description: e.target.value})}
                                className="h-12 rounded-xl focus:ring-amber-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700">Responsável</Label>
                            <Select 
                                value={newTaskData.internalResponsibleId} 
                                onValueChange={(val) => setNewTaskData({...newTaskData, internalResponsibleId: val})}
                            >
                                <SelectTrigger className="h-12 rounded-xl">
                                    <SelectValue placeholder="Selecione o responsável" />
                                </SelectTrigger>
                                <SelectContent>
                                    {financingTeam.map(u => (
                                        <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700">Prazo (opcional)</Label>
                            <Input 
                                type="date"
                                value={newTaskData.dueDate}
                                onChange={(e) => setNewTaskData({...newTaskData, dueDate: e.target.value})}
                                className="h-12 rounded-xl"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button 
                                onClick={handleCreateQuickTask}
                                disabled={!newTaskData.description}
                                className="h-11 flex-1 bg-amber-600 text-white hover:bg-amber-700 rounded-xl"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Criar Tarefa
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setShowQuickTaskModal(false);
                                    setQuickActionCaseId(null);
                                }}
                                className="h-11 px-6 rounded-xl"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Quick Pending Modal */}
            <Dialog open={showQuickPendingModal} onOpenChange={setShowQuickPendingModal}>
                <DialogContent className="max-w-md p-6 rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-600">
                            <AlertCircle className="w-6 h-6" />
                            Nova Pendência Rápida
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700">Qual a pendência?</Label>
                            <Input 
                                placeholder="Descreva a pendência..."
                                value={newPendingData.description}
                                onChange={(e) => setNewPendingData({...newPendingData, description: e.target.value})}
                                className="h-12 rounded-xl focus:ring-red-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700">Responsável pela solução</Label>
                            <Select 
                                value={newPendingData.responsiblePartyType} 
                                onValueChange={(val: any) => setNewPendingData({...newPendingData, responsiblePartyType: val})}
                            >
                                <SelectTrigger className="h-12 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Interno">Equipe R.Sales</SelectItem>
                                    <SelectItem value="Cliente">Cliente / Proponente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700">Prazo estimado (dias)</Label>
                            <Input 
                                type="number"
                                value={newPendingData.averageDaysToComplete}
                                onChange={(e) => setNewPendingData({...newPendingData, averageDaysToComplete: parseInt(e.target.value) || 7})}
                                className="h-12 rounded-xl"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button 
                                onClick={handleCreateQuickPending}
                                disabled={!newPendingData.description}
                                className="h-11 flex-1 bg-red-600 text-white hover:bg-red-700 rounded-xl"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Criar Pendência
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setShowQuickPendingModal(false);
                                    setQuickActionCaseId(null);
                                }}
                                className="h-11 px-6 rounded-xl"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
