// src/components/pages/admin/AdminRentalTarefasPage.tsx
import RentalNavigation from '@/components/RentalNavigation';
import { GeneralTarefasPanel } from '@/components/admin/tasks/GeneralTarefasPanel';

export default function AdminRentalTarefasPage() {
  return (
    <GeneralTarefasPanel
      serviceType="locacoes"
      title="Tarefas de Locações"
      kanbanRoute="/admin/locacoes/kanban"
      collection="tarefaslocacoes"
      serviceFilter={(a) =>
        (a.serviceType?.toLowerCase().includes('loca') || a.serviceType?.toLowerCase().includes('aluguel')) === true
      }
      navigationComponent={<RentalNavigation />}
    />
  );
}
