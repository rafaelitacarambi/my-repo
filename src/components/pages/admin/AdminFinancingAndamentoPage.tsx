import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    FileText,
    User,
    ArrowRight,
    Filter,
    Columns,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

    const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>({
        cliente: true,
        cpf: true,
        contrato: true,
        fase: true,
        dataEntrada: true
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [casesResult, usuariosResult, clientsResult] = await Promise.all([
                BaseCrudService.getAll<ServiceRecords>('atendimentos', undefined, { limit: 1000 }),
                BaseCrudService.getAll<UsuriosdoSistema>('usuariossistema', undefined, { limit: 1000 }),
                BaseCrudService.getAll<Clients>('clientes', undefined, { limit: 1000 })
            ]);

            console.log('[DEBUG-LIST] Total fetched:', casesResult.items.length);

            // Filter for Financing cases with verbose logging
            const activeCases = casesResult.items
                .filter(c => {
                    const type = String(c.serviceType || '');
                    const status = String(c.status || '');

                    const isFinancing = type.toLowerCase().includes('financ');
                    const isCompleted = status.toLowerCase().includes('conclui') ||
                        status.toLowerCase().includes('cancela');

                    if (isFinancing) {
                        console.log(`[DEBUG-LIST] Match: ID=${c._id}, Type="${type}", Status="${status}", Completed=${isCompleted}`);
                    }

                    return isFinancing && !isCompleted;
                })
                .map(a => {
                    const client = clientsResult.items.find(c => c._id === a.clientePrincipalRef);

                    return {
                        ...a,
                        // Ensure the table shows the name even if field names vary
                        contactName: a.contactName || client?.clientName || (a as any).proponentePrincipal || 'Sem nome',
                        creationDate: a.creationDate || a._createdDate,
                        cpf: (a as any).cpf || (a as any).cpfProponentePrincipal || client?.cpfCnpj || (a as any).proponenteCpf || (a as any).clienteCpf || (a as any).documento || '-',
                        numeroContratoSiopi: (a as any).numeroContratoSiopi || (a as any).financingContractNumber || (a as any).numeroContrato || (a as any).contrato || (a as any).siopi || '-'
                    };
                });

            console.log('[DEBUG-LIST] Final list count:', activeCases.length);
            setCases(activeCases);
            setUsuarios(usuariosResult.items.filter(u => u.ativo));
            setClients(clientsResult.items); // Set clients state
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getFilteredCases = () => {
        let filtered = cases;

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(c =>
                c.contactName?.toLowerCase().includes(lowerTerm) ||
                c.imovelRef?.toLowerCase().includes(lowerTerm) ||
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
                                </DropdownMenuContent>
                            </DropdownMenu>
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
                                            {visibleColumns.fase && <th className="px-6 py-4 font-semibold">Fase / Status</th>}
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
                                                                <div className="font-semibold text-gray-900">{processo.contactName}</div>
                                                                <div className="text-xs text-gray-500">{processo.imovelRef || 'Imóvel não informado'}</div>
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
        </div>
    );
}
