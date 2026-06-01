// src/components/pages/admin/AdminRentalPendenciasPage.tsx
import RentalNavigation from '@/components/RentalNavigation';
import { GeneralPendenciasPanel } from '@/components/admin/tasks/GeneralPendenciasPanel';

export default function AdminRentalPendenciasPage() {
  return (
    <GeneralPendenciasPanel
      serviceType="locacoes"
      title="Pendências de Locações"
      kanbanRoute="/admin/locacoes/kanban"
      collection="pendenciaslocacoes"
      serviceFilter={(a) =>
        (a.serviceType?.toLowerCase().includes('loca') || a.serviceType?.toLowerCase().includes('aluguel')) === true
      }
      navigationComponent={<RentalNavigation />}
    />
  );
}
