// src/components/pages/admin/AdminAuctionTarefasPage.tsx
import AuctionNavigation from '../../AuctionNavigation';
import { GeneralTarefasPanel } from '@/components/admin/tasks/GeneralTarefasPanel';

export default function AdminAuctionTarefasPage() {
  return (
    <GeneralTarefasPanel
      serviceType="leilao"
      title="Tarefas do Leilão"
      kanbanRoute="/admin/leilao/kanban"
      collection="tarefasleilao"
      serviceFilter={(a) =>
        (a.serviceType?.toLowerCase().includes('leilao') || a.serviceType?.toLowerCase().includes('leilão')) === true
      }
      navigationComponent={<AuctionNavigation />}
    />
  );
}
