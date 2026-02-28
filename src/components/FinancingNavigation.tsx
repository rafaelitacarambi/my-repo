import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, AlertCircle, CheckSquare, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { BaseCrudService } from '@/integrations';
import { PendnciasdoFinanciamento, FinancingTasks } from '@/entities';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

export default function FinancingNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [overdueTasksCount, setOverdueTasksCount] = useState<number>(0);

  useEffect(() => {
    loadCounts();
  }, []);

  const loadCounts = async () => {
    try {
      // Contar pendências em aberto
      const pendenciasResult = await BaseCrudService.getAll<PendnciasdoFinanciamento>('pendenciasfinanciamento');
      const pendenciasAbertas = pendenciasResult.items.filter(p =>
        p.status === 'Pendente' || p.status === 'Em Andamento'
      );
      setPendingCount(pendenciasAbertas.length);

      // Contar tarefas em atraso
      const tarefasResult = await BaseCrudService.getAll<FinancingTasks>('tarefasfinanciamento');
      const now = new Date();
      const tarefasAtrasadas = tarefasResult.items.filter(t => {
        if (t.status === 'Concluída' || !t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate < now;
      });
      setOverdueTasksCount(tarefasAtrasadas.length);
    } catch (error) {
      console.error('Erro ao carregar contadores:', error);
    }
  };

  const navItems: NavItem[] = [
    {
      path: '/admin/financiamento-kanban',
      label: 'Kanban',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      path: '/admin/financiamento-pendencias',
      label: 'Pendências',
      icon: <AlertCircle className="w-5 h-5" />,
    },
    {
      path: '/admin/financiamento-tarefas',
      label: 'Tarefas',
      icon: <CheckSquare className="w-5 h-5" />,
    },
    {
      path: '/admin/financiamento-andamento',
      label: 'Em Andamento',
      icon: <Play className="w-5 h-5" />,
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => location.pathname === path;

  const getCounter = (path: string) => {
    if (path === '/admin/financiamento-pendencias' && pendingCount > 0) {
      return pendingCount;
    }
    if (path === '/admin/financiamento-tarefas' && overdueTasksCount > 0) {
      return overdueTasksCount;
    }
    return null;
  };

  return (
    <div className="bg-white border-b border-border-gray shadow-md">
      <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-1 sm:gap-2 py-3 overflow-x-auto">
          {navItems.map((item) => {
            const counter = getCounter(item.path);
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap',
                  'hover:bg-light-gray focus:outline-none focus:ring-2 focus:ring-buttonbackground focus:ring-offset-2',
                  active
                    ? 'bg-buttonbackground text-white shadow-md'
                    : 'text-foreground bg-transparent'
                )}
              >
                <span className={cn(active && 'text-white')}>{item.icon}</span>
                <span className="text-sm sm:text-base">{item.label}</span>
                {counter !== null && (
                  <span
                    className={cn(
                      'flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold',
                      active
                        ? 'bg-white text-buttonbackground'
                        : 'bg-destructive text-destructiveforeground'
                    )}
                  >
                    {counter}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
