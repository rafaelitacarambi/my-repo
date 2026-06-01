// src/components/pages/admin/AdminSalesTarefasPage.tsx
import SalesNavigation from '@/components/SalesNavigation';
import { GeneralTarefasPanel } from '@/components/admin/tasks/GeneralTarefasPanel';

export default function AdminSalesTarefasPage() {
  return (
    <GeneralTarefasPanel
      serviceType="vendas"
      title="Tarefas de Vendas"
      kanbanRoute="/admin/negocios/kanban"
      collection="tarefasvendas"
      serviceFilter={(a) => (a.serviceType?.toLowerCase().includes('venda')) === true}
      navigationComponent={<SalesNavigation />}
    />
  );
}
