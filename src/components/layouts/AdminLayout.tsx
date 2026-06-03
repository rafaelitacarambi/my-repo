import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    TrendingUp,
    Headphones,
    UserCheck,
    DollarSign,
    Key,
    FileText,
    Calendar,
    History,
    UserCog,
    LogOut,
    Menu,
    X,
    Plus,
    MessageSquare,
    ChevronDown,
    ChevronUp,
    Gavel,
    Mail
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// LeadRegistrationModal removed
import { ClientRegistrationModal } from '@/components/ClientRegistrationModal';
import { useAuthValidation } from '@/hooks/use-auth-validation';
import { useClerk } from '@clerk/clerk-react';
import { UsuriosdoSistema } from '@/entities';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const { userProfile } = useAuthValidation();
    const { signOut } = useClerk();

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showCreateMainDialog, setShowCreateMainDialog] = useState(false);
// showLeadModal removed
    const [showClientModal, setShowClientModal] = useState(false);

    useEffect(() => {
        const isKanban = location.pathname.toLowerCase().includes('kanban');
        if (isKanban) {
            setSidebarOpen(false);
        }
    }, [location.pathname]);

    const userSectors = userProfile?.setores || [];
    const isAdmin = userProfile?.profile === 'Admin';

    const groupedNavItems = [
        {
            group: 'Clientes',
            items: [
                { label: 'Gestão de Clientes', icon: UserCheck, path: '/admin/clientes', visible: true },
            ]
        },
        {
            group: 'Vendas',
            items: [
                { label: 'Dashboard Vendas e Locações', icon: LayoutDashboard, path: '/admin/vendas/dashboard', visible: isAdmin || userSectors.includes('Venda, Compra e Locação') },
                { label: 'Kanban Vendas', icon: DollarSign, path: '/admin/negocios/kanban', visible: isAdmin || userSectors.includes('Venda, Compra e Locação') },
            ]
        },
        {
            group: 'Locações',
            items: [
                { label: 'Dashboard Vendas e Locações', icon: LayoutDashboard, path: '/admin/vendas/dashboard', visible: isAdmin || userSectors.includes('Venda, Compra e Locação') },
                { label: 'Kanban Locações', icon: Key, path: '/admin/locacoes/kanban', visible: isAdmin || userSectors.includes('Venda, Compra e Locação') },
            ]
        },
        {
            group: 'Financiamento',
            items: [
                { label: 'Dashboard Financiamento', icon: LayoutDashboard, path: '/admin/financiamento/dashboard', visible: isAdmin || userSectors.includes('Financiamento') },
                { label: 'Kanban Financiamento', icon: DollarSign, path: '/admin/financiamento-kanban', visible: isAdmin || userSectors.includes('Financiamento') },
            ]
        },
        {
            group: 'Leilão',
            items: [
                { label: 'Kanban Leilão', icon: Gavel, path: '/admin/leilao/kanban', visible: isAdmin || userSectors.includes('Venda, Compra e Locação') },
            ]
        },
        {
            group: 'Imóveis',
            items: [
                { label: 'Gestão de Imóveis', icon: FileText, path: '/admin/imoveis', visible: true },
                { label: 'Gestão de Chaves', icon: Key, path: '/admin/chaves', visible: isAdmin || userSectors.includes('Administrativo') },
            ]
        },
        {
            group: 'Outros',
            items: [
                { label: 'Agendamentos', icon: Calendar, path: '/admin/agendamentos', visible: true },
            ]
        },
        {
            group: 'Configurações',
            items: [
                { label: 'Histórico de Interações', icon: History, path: '/admin/historico', visible: true },
                { label: 'Gestão Financeira', icon: DollarSign, path: '/admin/financeiro', visible: true },
                { label: 'Caixa Saída (E-mails)', icon: Mail, path: '/admin/emails', visible: true },
                { label: 'Usuários', icon: UserCog, path: '/admin/usuarios', visible: isAdmin },
                { label: 'Perfil', icon: FileText, path: '/perfil', visible: true },
            ]
        }
    ];

    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev =>
            prev.includes(groupName) ? prev.filter(g => g !== groupName) : [...prev, groupName]
        );
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Header />

            <div className="flex flex-1 overflow-hidden relative">
                {/* Mobile Sidebar Overlay */}
                {!sidebarOpen && (
                    <div
                        className="lg:hidden fixed inset-0 bg-black/20 z-40"
                        onClick={() => setSidebarOpen(true)}
                    />
                )}

                {/* Sidebar */}
                <motion.aside
                    initial={false}
                    animate={{ width: sidebarOpen ? 280 : 80 }}
                    className={`fixed lg:static inset-y-0 left-0 z-50 bg-[#f8f9fa] border-r border-transparent flex flex-col transition-all duration-300 ease-in-out ${!sidebarOpen && 'lg:w-20'}`}
                >
                    <div className="p-4 flex items-center justify-between mb-2 mt-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="text-slate-500 hover:bg-slate-200 rounded-full h-12 w-12"
                        >
                            <Menu className="w-6 h-6" />
                        </Button>
                    </div>

                    <div className="px-3 flex flex-col gap-2">
                        <Button
                            onClick={() => navigate('/admin/clientes', { state: { openNewClient: true } })}
                            className={`bg-white hover:bg-blue-50 text-slate-700 font-bold h-14 rounded-2xl shadow-md transition-all flex items-center justify-center gap-3 border border-slate-100 ${sidebarOpen ? 'w-fit px-6 ml-2' : 'w-12 h-12 p-0 mx-auto'}`}
                        >
                            <Plus className="w-6 h-6 text-[#1a73e8]" />
                            {sidebarOpen && <span className="text-base">Novo Cliente</span>}
                        </Button>

                    </div>

                    <div className="px-2 py-4 flex-1 overflow-y-auto no-scrollbar mt-4 space-y-4">
                        {groupedNavItems.map((group, groupIdx) => {
                            const visibleItems = group.items.filter(i => i.visible);
                            if (visibleItems.length === 0) return null;

                            const isExpanded = expandedGroups.includes(group.group);

                            return (
                                <div key={groupIdx} className="space-y-1">
                                    {sidebarOpen && group.group !== 'Outros' && (
                                        <button
                                            onClick={() => toggleGroup(group.group)}
                                            className="w-full flex items-center justify-between px-4 py-4 text-base font-bold text-[#1a73e8] uppercase tracking-widest hover:text-[#1557b0] transition-colors"
                                        >
                                            <span>{group.group}</span>
                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>
                                    )}

                                    {(isExpanded || !sidebarOpen || group.group === 'Outros') && (
                                        <div className="space-y-0.5">
                                            {visibleItems.map((item, idx) => {
                                                const active = location.pathname === item.path;
                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => navigate(item.path)}
                                                        className={`w-full flex items-center gap-4 py-2.5 px-4 transition-all group rounded-r-full ${active ? 'bg-[#e8f0fe] text-[#1a73e8] font-bold' : 'text-slate-700 hover:bg-slate-200/60'}`}
                                                    >
                                                        <item.icon className={`w-5 h-5 shrink-0 ${active ? 'text-[#1a73e8]' : 'text-slate-500 group-hover:text-slate-700'}`} />
                                                        {sidebarOpen && <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="p-4 border-t border-slate-100">
                        <Button
                            variant="ghost"
                            className="w-full flex items-center justify-start gap-4 p-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
                            onClick={() => {
                                signOut();
                                navigate('/');
                            }}
                        >
                            <LogOut className="w-5 h-5 shrink-0" />
                            {sidebarOpen && <span className="font-medium text-sm">Sair</span>}
                        </Button>
                    </div>
                </motion.aside>

                <main className="flex-1 overflow-y-auto w-full bg-[#f8f9fa] p-4 lg:p-6">
                    <div className="bg-white h-full rounded-3xl shadow-sm overflow-y-auto no-scrollbar border border-slate-100 p-6 lg:p-10">
                        {children}
                    </div>
                </main>
            </div>

            <Footer />

{/* LeadRegistrationModal removed */}
            <ClientRegistrationModal isOpen={showClientModal} onOpenChange={setShowClientModal} />
        </div>
    );
}

// Helper to fix Landmark icon import
import { Landmark } from 'lucide-react';
