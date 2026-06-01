// src/components/pages/admin/AdminAuctionPendenciasPage.tsx
import AuctionNavigation from '../../AuctionNavigation';
import { GeneralPendenciasPanel } from '@/components/admin/tasks/GeneralPendenciasPanel';

export default function AdminAuctionPendenciasPage() {
  return (
    <GeneralPendenciasPanel
      serviceType="leilao"
      title="Pendências do Leilão"
      kanbanRoute="/admin/leilao/kanban"
      collection="pendenciasleilao"
      serviceFilter={(a) =>
        (a.serviceType?.toLowerCase().includes('leilao') || a.serviceType?.toLowerCase().includes('leilão')) === true
      }
      navigationComponent={<AuctionNavigation />}
    />
  );
}
