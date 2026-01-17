import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Columns3, AlertTriangle, CheckSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BaseCrudService } from '@/integrations';
import { PendnciasdoFinanciamento, FinancingTasks } from '@/entities';

export default function AdminFinanciamentoHubPage() {
  console.log('[AdminFinanciamentoHubPage] Component mounted');
  
  const navigate = useNavigate();
  const [pendenciasAtrasadas, setPendenciasAtrasadas] = useState(0);
  const [tarefasAtrasadas, setTarefasAtrasadas] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('[AdminFinanciamentoHubPage] useEffect triggered - loading counts');
    loadCounts();
  }, []);

  const loadCounts = async () => {
    console.log('[AdminFinanciamentoHubPage] loadCounts() called');
    setIsLoading(true);
    const now = new Date();

    const [pendenciasResult, tarefasResult] = await Promise.all([
      BaseCrudService.getAll<PendnciasdoFinanciamento>('pendenciasfinanciamento'),
      BaseCrudService.getAll<FinancingTasks>('tarefasfinanciamento')
    ]);

    const pendenciasCount = pendenciasResult.items.filter(p => {
      if (p.status === 'Resolvida' || !p.dueDate) return false;
      const dueDate = new Date(p.dueDate);
      return dueDate < now;
    }).length;

    const tarefasCount = tarefasResult.items.filter(t => {
      if (t.status === 'Concluída' || !t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate < now;
    }).length;

    setPendenciasAtrasadas(pendenciasCount);
    setTarefasAtrasadas(tarefasCount);
    setIsLoading(false);
    
    console.log('[AdminFinanciamentoHubPage] Counts loaded:', {
      pendenciasAtrasadas: pendenciasCount,
      tarefasAtrasadas: tarefasCount
    });
  };

  const cards = [
    {
      title: 'Kanban de Financiamento',
      description: 'Acompanhe todos os processos por etapa',
      icon: Columns3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      buttonText: 'Acessar Kanban',
      route: '/admin/financiamento-kanban',
      badge: null
    },
    {
      title: 'Pendências do Financiamento',
      description: 'Pendências abertas dos processos',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      buttonText: 'Ver Pendências',
      route: '/admin/financiamento-pendencias',
      badge: pendenciasAtrasadas > 0 ? pendenciasAtrasadas : null
    },
    {
      title: 'Tarefas do Financiamento',
      description: 'Tarefas pendentes da equipe',
      icon: CheckSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      buttonText: 'Ver Tarefas',
      route: '/admin/financiamento-tarefas',
      badge: tarefasAtrasadas > 0 ? tarefasAtrasadas : null
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 w-full">
        <div className="max-w-[100rem] mx-auto px-6 py-12">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="font-heading text-4xl font-bold text-foreground mb-3">
              Hub de Financiamento
            </h1>
            <p className="font-paragraph text-lg text-dark-gray">
              Gerencie todos os aspectos dos processos de financiamento
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card 
                    className="h-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-border-gray"
                    onClick={() => {
                      console.log('[AdminFinanciamentoHubPage] Card clicked - navigating to:', card.route);
                      navigate(card.route);
                    }}
                  >
                    <CardHeader className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className={`${card.bgColor} ${card.color} p-4 rounded-xl`}>
                          <Icon className="w-8 h-8" />
                        </div>
                        {card.badge !== null && !isLoading && (
                          <Badge variant="destructive" className="text-sm px-3 py-1">
                            {card.badge} {card.badge === 1 ? 'atrasada' : 'atrasadas'}
                          </Badge>
                        )}
                      </div>
                      <div>
                        <CardTitle className="font-heading text-2xl font-bold text-foreground mb-2">
                          {card.title}
                        </CardTitle>
                        <CardDescription className="font-paragraph text-base text-dark-gray">
                          {card.description}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        className="w-full bg-buttonbackground hover:bg-buttonbackground/90 text-white font-paragraph"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('[AdminFinanciamentoHubPage] Button clicked - navigating to:', card.route);
                          navigate(card.route);
                        }}
                      >
                        {card.buttonText}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
