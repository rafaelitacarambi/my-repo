import { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { FinancingTasks, ServiceRecords, Clients } from '@/entities';
import { useMember } from '@/integrations';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import KPICards from '@/components/FinancingDashboard/KPICards';
import MyTasks from '@/components/FinancingDashboard/MyTasks';
import SectorTasks from '@/components/FinancingDashboard/SectorTasks';
import QuickActions from '@/components/FinancingDashboard/QuickActions';
import ProcessDetailsModal from '@/components/FinancingDashboard/ProcessDetailsModal';

export default function AdminFinancingDashboardPage() {
  const { member } = useMember();
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<FinancingTasks[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecords[]>([]);
  const [clients, setClients] = useState<Clients[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<ServiceRecords | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [member]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load all tasks
      const tasksResult = await BaseCrudService.getAll<FinancingTasks>('tarefasfinanciamento', {}, { limit: 500 });
      setTasks(tasksResult.items || []);

      // Load all service records (financing)
      const servicesResult = await BaseCrudService.getAll<ServiceRecords>('atendimentos', {}, { limit: 500 });
      const financingServices = servicesResult.items?.filter(s => s.serviceType === 'Financiamento') || [];
      setServiceRecords(financingServices);

      // Load all clients
      const clientsResult = await BaseCrudService.getAll<Clients>('clientes', {}, { limit: 500 });
      setClients(clientsResult.items || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenProcess = (process: ServiceRecords) => {
    setSelectedProcess(process);
    setShowModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-gray flex flex-col">
      <Header />
      
      <main className="flex-1 w-full max-w-[100rem] mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard de Financiamento</h1>
          <p className="text-dark-gray">Bem-vindo, {member?.profile?.nickname || 'Usuário'}. Aqui está sua visão geral do setor.</p>
        </div>

        {/* KPI Cards */}
        <KPICards serviceRecords={serviceRecords} />

        {/* Quick Actions */}
        <QuickActions />

        {/* My Tasks and Sector Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <MyTasks 
            tasks={tasks} 
            currentUserId={member?._id} 
            serviceRecords={serviceRecords}
            clients={clients}
            onOpenProcess={handleOpenProcess}
            onTasksUpdated={loadData}
          />
          <SectorTasks 
            tasks={tasks} 
            serviceRecords={serviceRecords}
            clients={clients}
            onOpenProcess={handleOpenProcess}
            onTasksUpdated={loadData}
          />
        </div>
      </main>

      <Footer />

      {/* Process Details Modal */}
      {showModal && selectedProcess && (
        <ProcessDetailsModal 
          process={selectedProcess} 
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedProcess(null);
          }}
        />
      )}
    </div>
  );
}
