// src/components/pages/admin/AdminSalesPendenciasPage.tsx
import SalesNavigation from '@/components/SalesNavigation';
import { GeneralPendenciasPanel } from '@/components/admin/tasks/GeneralPendenciasPanel';

export default function AdminSalesPendenciasPage() {
  return (
    <GeneralPendenciasPanel
      serviceType="vendas"
      title="Pendências de Vendas"
      kanbanRoute="/admin/negocios/kanban"
      collection="pendenciasvendas"
      serviceFilter={(a) => (a.serviceType?.toLowerCase().includes('venda')) === true}
      navigationComponent={<SalesNavigation />}
    />
  );
}
