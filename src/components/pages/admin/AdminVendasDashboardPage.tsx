import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight, Users, TrendingUp, Key, Home, ClipboardList, UserCheck, CheckCircle2 } from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { BaseCrudService, useMember } from '@/integrations';
import { Imveis, LeadsdeContato, ServiceRecords, HistricodeInteraes, UsuriosdoSistema } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface MemberProfile {
    _id: string;
    profile?: {
        nickname?: string;
        photo?: { url: string };
    };
    contact?: {
        firstName?: string;
        lastName?: string;
    };
}

export default function AdminVendasDashboardPage() {
    const { member } = useMember();
    const [stats, setStats] = useState({
        ativos: 0,
        meusAtivos: 0,
        novos: 0,
        suspenso: 0,
        desatualizados: 0,
        semFoto: 0,
        vendidos: 0,
        exclusivos: 0,
        comPlaca: 0,
        foraDoSite: 0
    });

    const [currentUserProfile, setCurrentUserProfile] = useState<UsuriosdoSistema | null>(null);

    // Performance Metrics
    const [myPerformance, setMyPerformance] = useState({
        venda: { captacoes: 0, clientes: 0, visitas: 0, propostas: 0, concluidas: 0 },
        locacao: { captacoes: 0, clientes: 0, visitas: 0, propostas: 0, concluidas: 0 }
    });

    const [teamPerformance, setTeamPerformance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, [member]);

    const loadDashboardData = async () => {
        try {
            const [
                imoveisRes,
                usersRes,
                leadsRes,
                servicesRes,
                interactionsRes
            ] = await Promise.all([
                BaseCrudService.getAll<Imveis>('imoveis', undefined, { limit: 2000 }),
                BaseCrudService.getAll<UsuriosdoSistema>('usuariossistema', undefined, { limit: 100 }),
                BaseCrudService.getAll<LeadsdeContato>('leadsdecontato', undefined, { limit: 2000 }),
                BaseCrudService.getAll<ServiceRecords>('atendimentos', undefined, { limit: 2000 }),
                BaseCrudService.getAll<HistricodeInteraes>('historicointeracoes', undefined, { limit: 2000 })
            ]);

            const imoveis = imoveisRes.items || [];
            const systemUsers = usersRes.items || [];
            const leads = leadsRes.items || [];
            const services = servicesRes.items || [];
            const interactions = interactionsRes.items || [];

            // Identificar o perfil do usuário logado
            const loggedSystemUser = systemUsers.find(u =>
                u.emailLogin?.toLowerCase() === member?.loginEmail?.toLowerCase()
            );
            setCurrentUserProfile(loggedSystemUser || null);

            const now = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);

            const threeMonthsAgo = new Date();
            threeMonthsAgo.setDate(now.getDate() - 90);

            const newStats = {
                ativos: 0,
                meusAtivos: 0,
                novos: 0,
                suspenso: 0,
                desatualizados: 0,
                vendidos: 0,
                exclusivos: 0,
                comPlaca: 0,
                foraDoSite: 0
            };

            // Calculate General Stats
            imoveis.forEach(property => {
                const status = (property.statusImovel || property.status || '').toLowerCase();
                const createdDate = property._createdDate ? new Date(property._createdDate) : null;
                const updatedDate = property._updatedDate ? new Date(property._updatedDate) : (createdDate || new Date());
                const brokerId = property.corretorResponsavelId;

                const isAtivo = status === 'ativo' || status === 'disponível';
                const brokerName = (property as any).corretorResponsavel;

                // Robust Matching for Broker Portfolio
                const isMyAsset = (loggedSystemUser && brokerId === loggedSystemUser._id) ||
                    (loggedSystemUser?.name && brokerName && (
                        brokerName.toLowerCase().trim() === loggedSystemUser.name.toLowerCase().trim() ||
                        (loggedSystemUser.name.toLowerCase().includes(brokerName.toLowerCase().trim()) && brokerName.length > 5) ||
                        (brokerName.toLowerCase().includes(loggedSystemUser.name.toLowerCase().trim()) && loggedSystemUser.name.length > 5)
                    ));

                const isAdminOrOps = loggedSystemUser?.profile === 'Admin' || loggedSystemUser?.profile === 'Operacional';

                if (isAtivo) {
                    newStats.ativos++;
                    if (isMyAsset) {
                        newStats.meusAtivos++;
                    }
                }

                // Filter secondary stats for brokers
                if (isAdminOrOps || isMyAsset) {
                    if (status === 'suspenso') newStats.suspenso++;
                    if (status === 'vendido') newStats.vendidos++;

                    // Desatualizados: Ativos que não foram atualizados há mais de 3 meses
                    if (isAtivo && updatedDate < threeMonthsAgo) {
                        newStats.desatualizados++;
                    }

                    if (createdDate && createdDate >= sevenDaysAgo) newStats.novos++;
                    if (status === 'suspenso') newStats.foraDoSite++;
                }
            });

            setStats(newStats as any);

            // Calculate Performance Per Member (using systemUsers)
            const memberStatsMap = new Map();

            // Initialize map with all system users
            systemUsers.forEach(u => {
                memberStatsMap.set(u._id, {
                    member: u,
                    venda: { captacoes: 0, clientes: 0, visitas: 0, propostas: 0, concluidas: 0 },
                    locacao: { captacoes: 0, clientes: 0, visitas: 0, propostas: 0, concluidas: 0 }
                });
            });

            // 1. Captações & Concluídas (Source: Imóveis)
            imoveis.forEach(property => {
                let brokerId = property.corretorResponsavelId;
                const brokerName = (property as any).corretorResponsavel;
                const pretensao = (property.pretensao || '').toLowerCase();
                const status = (property.statusImovel || property.status || '').toLowerCase();

                // Fallback: Find ID by name if missing (using fuzzy match)
                if (!brokerId && brokerName) {
                    const matchedUser = systemUsers.find(u => {
                        if (!u.name) return false;
                        const uName = u.name.toLowerCase().trim();
                        const bName = brokerName.toLowerCase().trim();
                        return uName === bName ||
                            (uName.includes(bName) && bName.length > 5) ||
                            (bName.includes(uName) && uName.length > 5);
                    });
                    if (matchedUser) brokerId = matchedUser._id;
                }

                if (brokerId && memberStatsMap.has(brokerId)) {
                    const stats = memberStatsMap.get(brokerId);

                    if (pretensao.includes('venda')) {
                        stats.venda.captacoes++;
                        if (status === 'vendido') stats.venda.concluidas++;
                    }
                    if (pretensao.includes('locação') || pretensao.includes('aluguel')) {
                        stats.locacao.captacoes++;
                        if (status === 'locado' || status === 'alugado') stats.locacao.concluidas++;
                    }
                }
            });

            // 2. Clientes em Andamento (Source: Leads)
            leads.forEach(lead => {
                const brokerId = lead.responsavelRef;
                const interest = (lead.interessePrincipal || lead.leadSource || '').toLowerCase();
                const status = (lead.statusFunil || lead.leadStatus || '').toLowerCase();

                if (brokerId && memberStatsMap.has(brokerId)) {
                    const stats = memberStatsMap.get(brokerId);

                    // Filter for active leads
                    if (!status.includes('concluido') && !status.includes('perdido') && !status.includes('arquivado')) {
                        if (interest.includes('locação') || interest.includes('aluguel')) {
                            stats.locacao.clientes++;
                        } else {
                            // Default to sales if not explicitly rental
                            stats.venda.clientes++;
                        }
                    }
                }
            });

            // 3. Propostas em Andamento (Source: Services/Atendimentos)
            services.forEach(service => {
                const brokerId = service.corretorResponsavelRef;
                const status = (service.status || '').toLowerCase();
                const type = (service.serviceType || '').toLowerCase();

                if (brokerId && memberStatsMap.has(brokerId)) {
                    const stats = memberStatsMap.get(brokerId);

                    // Logic: Status contains 'proposta' or 'negociação'
                    if (status.includes('proposta') || status.includes('negocia')) {
                        if (type.includes('locação') || type.includes('aluguel')) {
                            stats.locacao.propostas++;
                        } else {
                            stats.venda.propostas++;
                        }
                    }
                }
            });

            // 4. Visitas (Source: Interactions/Historico)
            interactions.forEach(interaction => {
                const brokerId = interaction.autorRef; // Or responsible person
                const type = (interaction.interactionType || interaction.tipoEvento || '').toLowerCase();
                const description = (interaction.interactionDescription || '').toLowerCase();

                if (brokerId && memberStatsMap.has(brokerId)) {
                    const stats = memberStatsMap.get(brokerId);

                    if (type.includes('visita')) {
                        if (description.includes('locação') || description.includes('aluguel')) {
                            stats.locacao.visitas++;
                        } else {
                            // Default to sales
                            stats.venda.visitas++;
                        }
                    }
                }
            });


            // Set My Performance
            if (loggedSystemUser?._id && memberStatsMap.has(loggedSystemUser._id)) {
                const myStats = memberStatsMap.get(loggedSystemUser._id);
                setMyPerformance(myStats);
            }

            // Set Team Performance (Convert Map to Array)
            const teamStatsArray = Array.from(memberStatsMap.values());
            setTeamPerformance(teamStatsArray);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                    <LoadingSpinner />
                </div>
            </AdminLayout>
        );
    }

    const userName = member?.contact?.firstName || 'Admin';

    return (
        <AdminLayout>
            <div className="space-y-12 bg-[#f8f9fa] min-h-screen p-2 -m-6 sm:m-0 sm:p-0 sm:bg-transparent">

                {/* Header (Cleaned up) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h1 className="text-3xl font-bold text-slate-900 font-heading">
                        Boa tarde, {userName}!
                    </h1>
                </div>

                {/* Imóveis Section */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Imóveis</h2>

                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4"
                    >
                        {/* Ativos (Personalizado ou Geral) */}
                        <motion.div variants={item} className="bg-[#e6f4ea] rounded-xl p-4 min-h-[100px] flex flex-col justify-between hover:scale-105 transition-transform cursor-pointer relative">
                            <Link to="/admin/imoveis?status=Ativo" className="absolute inset-0 z-10" />
                            <span className="text-green-700 text-xs font-semibold">
                                {currentUserProfile?.profile === 'Corretor' ? 'Meus Ativos' : 'Ativos'}
                            </span>
                            <span className="text-3xl font-bold text-green-800">
                                {currentUserProfile?.profile === 'Corretor' ? stats.meusAtivos : stats.ativos}
                            </span>
                        </motion.div>

                        {/* Todos os Ativos (Aparece se for Corretor) */}
                        {currentUserProfile?.profile === 'Corretor' && (
                            <motion.div variants={item} className="bg-[#e8f0fe] rounded-xl p-4 min-h-[100px] flex flex-col justify-between hover:scale-105 transition-transform cursor-pointer relative border border-blue-100">
                                <Link to="/admin/imoveis?status=Ativo" className="absolute inset-0 z-10" />
                                <div className="flex items-center gap-2">
                                    <Home className="w-3 h-3 text-[#1a73e8]" />
                                    <span className="text-[#1a73e8] text-xs font-semibold">Todos Ativos</span>
                                </div>
                                <span className="text-3xl font-bold text-[#1a73e8]">{stats.ativos}</span>
                            </motion.div>
                        )}

                        {/* Novos */}
                        <motion.div variants={item} className="bg-[#f1f3f4] rounded-xl p-4 min-h-[100px] flex flex-col justify-between hover:scale-105 transition-transform cursor-pointer relative">
                            <Link to="/admin/imoveis?filter=novos" className="absolute inset-0 z-10" />
                            <span className="text-slate-600 text-xs font-semibold">Novos</span>
                            <span className="text-3xl font-bold text-slate-800">+{stats.novos}</span>
                        </motion.div>

                        {/* Suspenso / Fora do Site */}
                        <motion.div variants={item} className="bg-[#fff8e1] rounded-xl p-4 min-h-[100px] flex flex-col justify-between hover:scale-105 transition-transform cursor-pointer relative">
                            <Link to="/admin/imoveis?status=Suspenso" className="absolute inset-0 z-10" />
                            <span className="text-orange-700 text-xs font-semibold">Suspenso</span>
                            <span className="text-3xl font-bold text-orange-800">{stats.suspenso}</span>
                        </motion.div>

                        {/* Desatualizados */}
                        <motion.div variants={item} className="bg-[#fce8e6] rounded-xl p-4 min-h-[100px] flex flex-col justify-between hover:scale-105 transition-transform cursor-pointer relative">
                            <Link to="/admin/imoveis?filter=desatualizados" className="absolute inset-0 z-10" />
                            <span className="text-red-700 text-xs font-semibold">Desatualizados</span>
                            <span className="text-3xl font-bold text-red-800">{stats.desatualizados}</span>
                        </motion.div>




                        {/* Vendidos */}
                        <motion.div variants={item} className="bg-[#f8f9fa] rounded-xl p-4 min-h-[100px] flex flex-col justify-between border border-slate-100 hover:scale-105 transition-transform cursor-pointer relative">
                            <Link to="/admin/imoveis?status=Vendido" className="absolute inset-0 z-10" />
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500 text-xs font-medium">Vendidos</span>
                            </div>
                            <span className="text-3xl font-bold text-slate-700">{stats.vendidos}</span>
                        </motion.div>

                        {/* Placeholder */}
                        <motion.div variants={item} className="bg-white rounded-xl p-4 min-h-[100px] flex flex-col justify-between border border-dashed border-slate-200 opacity-50">
                            <span className="text-slate-400 text-xs font-medium">--</span>
                        </motion.div>

                    </motion.div>
                </div>

                {/* Metas de Vendas (Horizontal Cards) */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Metas de vendas</h2>
                    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <motion.div variants={item} className="bg-[#f8f9fa] rounded-xl p-4 min-h-[100px] flex flex-col justify-center items-center text-center gap-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Minhas Captações</h3>
                            <span className="text-3xl font-bold text-slate-800">{myPerformance.venda.captacoes}</span>
                        </motion.div>

                        <motion.div variants={item} className="bg-[#f8f9fa] rounded-xl p-4 min-h-[100px] flex flex-col justify-center items-center text-center gap-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clientes em Andamento</h3>
                            <span className="text-3xl font-bold text-slate-800">{myPerformance.venda.clientes}</span>
                        </motion.div>

                        <motion.div variants={item} className="bg-[#f8f9fa] rounded-xl p-4 min-h-[100px] flex flex-col justify-center items-center text-center gap-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visitas</h3>
                            <span className="text-3xl font-bold text-slate-800">{myPerformance.venda.visitas}</span>
                        </motion.div>

                        <motion.div variants={item} className="bg-[#f8f9fa] rounded-xl p-4 min-h-[100px] flex flex-col justify-center items-center text-center gap-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Propostas em Andamento</h3>
                            <span className="text-3xl font-bold text-slate-800">{myPerformance.venda.propostas}</span>
                        </motion.div>

                        <motion.div variants={item} className="bg-[#e6f4ea] rounded-xl p-4 min-h-[100px] flex flex-col justify-center items-center text-center gap-2">
                            <h3 className="text-xs font-bold text-green-700 uppercase tracking-wider">Propostas Concluídas</h3>
                            <span className="text-3xl font-bold text-green-800">{myPerformance.venda.concluidas}</span>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Metas de Locação (Horizontal Cards) */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Metas de Locação</h2>
                    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <motion.div variants={item} className="bg-[#f8f9fa] rounded-xl p-4 min-h-[100px] flex flex-col justify-center items-center text-center gap-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Minhas Captações</h3>
                            <span className="text-3xl font-bold text-slate-800">{myPerformance.locacao.captacoes}</span>
                        </motion.div>

                        <motion.div variants={item} className="bg-[#f8f9fa] rounded-xl p-4 min-h-[100px] flex flex-col justify-center items-center text-center gap-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clientes em Andamento</h3>
                            <span className="text-3xl font-bold text-slate-800">{myPerformance.locacao.clientes}</span>
                        </motion.div>

                        <motion.div variants={item} className="bg-[#f8f9fa] rounded-xl p-4 min-h-[100px] flex flex-col justify-center items-center text-center gap-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visitas</h3>
                            <span className="text-3xl font-bold text-slate-800">{myPerformance.locacao.visitas}</span>
                        </motion.div>

                        <motion.div variants={item} className="bg-[#f8f9fa] rounded-xl p-4 min-h-[100px] flex flex-col justify-center items-center text-center gap-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Propostas em Andamento</h3>
                            <span className="text-3xl font-bold text-slate-800">{myPerformance.locacao.propostas}</span>
                        </motion.div>

                        <motion.div variants={item} className="bg-[#e6f4ea] rounded-xl p-4 min-h-[100px] flex flex-col justify-center items-center text-center gap-2">
                            <h3 className="text-xs font-bold text-green-700 uppercase tracking-wider">Propostas Concluídas</h3>
                            <span className="text-3xl font-bold text-green-800">{myPerformance.locacao.concluidas}</span>
                        </motion.div>
                    </motion.div>
                </div>


                {/* Team Monitoring Section - Hidden for Brokers */}
                {currentUserProfile?.profile !== 'Corretor' && (
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center mb-6">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mr-4">
                                <Users className="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Acompanhamento da Equipe</h2>
                                <p className="text-sm text-slate-500">Visão geral de desempenho por corretor</p>
                            </div>
                        </div>

                        <ScrollArea className="w-full">
                            <div className="min-w-[1400px]">
                                {/* Header */}
                                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-50 rounded-xl mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    <div className="col-span-2">Corretor</div>

                                    {/* Vendas Group */}
                                    <div className="col-span-1 text-center text-blue-600 border-l border-slate-200">Captações (V)</div>
                                    <div className="col-span-1 text-center text-blue-600">Clientes (V)</div>
                                    <div className="col-span-1 text-center text-blue-600">Visitas (V)</div>
                                    <div className="col-span-1 text-center text-blue-600">Propostas (V)</div>
                                    <div className="col-span-1 text-center text-green-600 font-extrabold bg-green-50/50 rounded">Concluídas (V)</div>

                                    {/* Locação Group */}
                                    <div className="col-span-1 text-center text-purple-600 border-l border-slate-200">Captações (L)</div>
                                    <div className="col-span-1 text-center text-purple-600">Clientes (L)</div>
                                    <div className="col-span-1 text-center text-purple-600">Visitas (L)</div>
                                    <div className="col-span-1 text-center text-purple-600">Propostas (L)</div>
                                    <div className="col-span-1 text-center text-green-600 font-extrabold bg-green-50/50 rounded">Concluídas (L)</div>
                                </div>

                                {/* Body */}
                                <div className="space-y-2">
                                    {teamPerformance.map((stats, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 px-4 py-4 hover:bg-slate-50 rounded-xl items-center transition-colors border border-transparent hover:border-slate-100 text-sm">

                                            {/* Member Info */}
                                            <div className="col-span-2 flex items-center gap-3 overflow-hidden">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-[10px] font-bold text-slate-500">
                                                        {(stats.member.name || 'U').substring(0, 2).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-700 truncate">
                                                        {stats.member.name}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 truncate">
                                                        {stats.member.profile || 'Corretor'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Vendas Metrics */}
                                            <div className="col-span-1 text-center font-medium text-slate-600 border-l border-slate-100">{stats.venda.captacoes}</div>
                                            <div className="col-span-1 text-center font-medium text-slate-600">{stats.venda.clientes}</div>
                                            <div className="col-span-1 text-center font-medium text-slate-600">{stats.venda.visitas}</div>
                                            <div className="col-span-1 text-center font-medium text-slate-600">{stats.venda.propostas}</div>
                                            <div className="col-span-1 text-center font-bold text-green-700 bg-green-50 py-1 rounded-lg mx-2">{stats.venda.concluidas}</div>

                                            {/* Locação Metrics */}
                                            <div className="col-span-1 text-center font-medium text-slate-600 border-l border-slate-100">{stats.locacao.captacoes}</div>
                                            <div className="col-span-1 text-center font-medium text-slate-600">{stats.locacao.clientes}</div>
                                            <div className="col-span-1 text-center font-medium text-slate-600">{stats.locacao.visitas}</div>
                                            <div className="col-span-1 text-center font-medium text-slate-600">{stats.locacao.propostas}</div>
                                            <div className="col-span-1 text-center font-bold text-green-700 bg-green-50 py-1 rounded-lg mx-2">{stats.locacao.concluidas}</div>
                                        </div>
                                    ))}
                                    {teamPerformance.length === 0 && (
                                        <div className="text-center py-8 text-slate-400 font-medium">Nenhum dado de equipe encontrado.</div>
                                    )}
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                )}

            </div>
        </AdminLayout>
    );
}
