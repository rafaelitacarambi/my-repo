import { MemberProvider } from '@/integrations';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import { ProtectedAdminRoute } from '@/components/ui/protected-admin-route';
import { ClerkProvider } from '@clerk/clerk-react';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import { Toaster } from 'sonner';

// Pages
import HomePage from '@/components/pages/HomePage';
import ImoveisPage from '@/components/pages/ImoveisPage';
import ImovelDetailPage from '@/components/pages/ImovelDetailPage';
import SimuladorPage from '@/components/pages/SimuladorPage';
import CorretoresPage from '@/components/pages/CorretoresPage';
import CorretorDetailPage from '@/components/pages/CorretorDetailPage';
import ContatoPage from '@/components/pages/ContatoPage';
import AreaRestritaPage from '@/components/pages/AreaRestritaPage';
import PerfilPage from '@/components/pages/PerfilPage';
import LeilaoPage from '@/components/pages/LeilaoPage';
import AdminImoveisPage from '@/components/pages/admin/AdminImoveisPage';
// AdminLeadsPage import removed
import AdminProcessosPage from '@/components/pages/admin/AdminProcessosPage';
import AdminChavesPage from '@/components/pages/admin/AdminChavesPage';
import AdminFinanceiroPage from '@/components/pages/admin/AdminFinanceiroPage';
import AdminClientesPage from '@/components/pages/admin/AdminClientesPage';
import AdminAgendamentosPage from '@/components/pages/admin/AdminAgendamentosPage';
import AdminAssinaturasPage from '@/components/pages/admin/AdminAssinaturasPage';
import AdminHistoricoPage from '@/components/pages/admin/AdminHistoricoPage';
import AdminFinancingKanbanPage from '@/components/pages/admin/AdminFinancingKanbanPage';
import AdminFinanciamentoDetalhePage from '@/components/pages/admin/AdminFinanciamentoDetalhePage';
import AdminUsuariosPage from '@/components/pages/admin/AdminUsuariosPage';
import DiagnosticoUsuarioPage from '@/components/pages/DiagnosticoUsuarioPage';
import AdminFinanciamentoHubPage from '@/components/pages/admin/AdminFinanciamentoHubPage';
import AdminFinancingPendenciasPage from '@/components/pages/admin/AdminFinancingPendenciasPage';
import AdminFinancingTarefasPage from '@/components/pages/admin/AdminFinancingTarefasPage';
import AdminFinancingAndamentoPage from '@/components/pages/admin/AdminFinancingAndamentoPage';
import AdminFinanciamentoDashboardPage from '@/components/pages/admin/AdminFinanciamentoDashboardPage';
import AdminVendasKanbanPage from '@/components/pages/admin/AdminVendasKanbanPage';
import AdminVendasDashboardPage from '@/components/pages/admin/AdminVendasDashboardPage';
import AdminLocacoesKanbanPage from '@/components/pages/admin/AdminLocacoesKanbanPage';
import AdminLeilaoKanbanPage from '@/components/pages/admin/AdminLeilaoKanbanPage';
import AdminAuctionPendenciasPage from '@/components/pages/admin/AdminAuctionPendenciasPage';
import AdminAuctionTarefasPage from '@/components/pages/admin/AdminAuctionTarefasPage';
import AdminAuctionAndamentoPage from '@/components/pages/admin/AdminAuctionAndamentoPage';
import AdminSalesPendenciasPage from '@/components/pages/admin/AdminSalesPendenciasPage';
import AdminSalesTarefasPage from '@/components/pages/admin/AdminSalesTarefasPage';
import AdminSalesAndamentoPage from '@/components/pages/admin/AdminSalesAndamentoPage';
import AdminRentalPendenciasPage from '@/components/pages/admin/AdminRentalPendenciasPage';
import AdminRentalTarefasPage from '@/components/pages/admin/AdminRentalTarefasPage';
import AdminRentalAndamentoPage from '@/components/pages/admin/AdminRentalAndamentoPage';
import ContractTemplatesPage from '@/components/pages/admin/ContractTemplatesPage';


import AdminWhatsAppInboxPage from '@/components/pages/admin/AdminWhatsAppInboxPage';
import AdminPropertyImportPage from '@/components/pages/admin/AdminPropertyImportPage';
import AdminEmailsPage from '@/components/pages/admin/AdminEmailsPage';

// Layout component that includes ScrollToTop
function Layout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "imoveis",
        element: <ImoveisPage />,
      },
      {
        path: "imoveis/:id",
        element: <ImovelDetailPage />,
      },
      {
        path: "leilao-caixa",
        element: <LeilaoPage />,
      },
      {
        path: "simulador",
        element: <SimuladorPage />,
      },
      {
        path: "corretores",
        element: <CorretoresPage />,
      },
      {
        path: "corretores/:id",
        element: <CorretorDetailPage />,
      },
      {
        path: "contato",
        element: <ContatoPage />,
      },
      {
        path: "area-restrita",
        element: <AreaRestritaPage />,
      },
      {
        path: "perfil",
        element: <PerfilPage />,
      },
      {
        path: "diagnostico-usuario",
        element: <DiagnosticoUsuarioPage />,
      },
      {
        path: "admin/imoveis/importar",
        element: (
          <ProtectedAdminRoute>
            <AdminPropertyImportPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/imoveis",
        element: (
          <ProtectedAdminRoute>
            <AdminImoveisPage />
          </ProtectedAdminRoute>
        ),
      },
      // admin/leads route removed


      {
        path: "admin/chaves",
        element: (
          <ProtectedAdminRoute>
            <AdminChavesPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/emails",
        element: (
          <ProtectedAdminRoute>
            <AdminEmailsPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/financeiro",
        element: (
          <ProtectedAdminRoute allowedProfiles={['Admin', 'Financeiro']}>
            <AdminFinanceiroPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/clientes",
        element: (
          <ProtectedAdminRoute>
            <AdminClientesPage />
          </ProtectedAdminRoute>
        ),
      },

      {
        path: "admin/agendamentos",
        element: (
          <ProtectedAdminRoute>
            <AdminAgendamentosPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/assinaturas/documentos",
        element: (
          <ProtectedAdminRoute>
            <AdminAssinaturasPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/historico",
        element: (
          <ProtectedAdminRoute>
            <AdminHistoricoPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/financiamento/dashboard",
        element: (
          <ProtectedAdminRoute allowedProfiles={['Admin', 'Operacional', 'Financeiro']}>
            <AdminFinanciamentoDashboardPage />
          </ProtectedAdminRoute>
        ),
      },

      {
        path: "admin/vendas/dashboard",
        element: (
          <ProtectedAdminRoute>
            <AdminVendasDashboardPage />
          </ProtectedAdminRoute>
        ),
      },

      {
        path: "admin/financiamento",
        element: (
          <ProtectedAdminRoute allowedProfiles={['Admin', 'Operacional', 'Financeiro']}>
            <AdminFinanciamentoHubPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/financiamento-kanban",
        element: (
          <ProtectedAdminRoute>
            <AdminFinancingKanbanPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/negocios/kanban",
        element: (
          <ProtectedAdminRoute>
            <AdminVendasKanbanPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/vendas-pendencias",
        element: (
          <ProtectedAdminRoute>
            <AdminSalesPendenciasPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/vendas-tarefas",
        element: (
          <ProtectedAdminRoute>
            <AdminSalesTarefasPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/vendas-andamento",
        element: (
          <ProtectedAdminRoute>
            <AdminSalesAndamentoPage />
          </ProtectedAdminRoute>
        ),
      },

      {
        path: "admin/locacoes/kanban",
        element: (
          <ProtectedAdminRoute>
            <AdminLocacoesKanbanPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/locacoes-pendencias",
        element: (
          <ProtectedAdminRoute>
            <AdminRentalPendenciasPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/locacoes-tarefas",
        element: (
          <ProtectedAdminRoute>
            <AdminRentalTarefasPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/locacoes-andamento",
        element: (
          <ProtectedAdminRoute>
            <AdminRentalAndamentoPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/contract-templates",
        element: (
          <ProtectedAdminRoute>
            <ContractTemplatesPage />
          </ProtectedAdminRoute>
        ),
      },

      {
        path: "admin/leilao/kanban",
        element: (
          <ProtectedAdminRoute>
            <AdminLeilaoKanbanPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/leilao-pendencias",
        element: (
          <ProtectedAdminRoute>
            <AdminAuctionPendenciasPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/leilao-tarefas",
        element: (
          <ProtectedAdminRoute>
            <AdminAuctionTarefasPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/leilao-andamento",
        element: (
          <ProtectedAdminRoute>
            <AdminAuctionAndamentoPage />
          </ProtectedAdminRoute>
        ),
      },


      {
        path: "admin/financiamento/:atendimentoId",
        element: (
          <ProtectedAdminRoute>
            <AdminFinanciamentoDetalhePage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/financiamento-pendencias",
        element: (
          <ProtectedAdminRoute allowedProfiles={['Admin', 'Operacional', 'Financeiro']}>
            <AdminFinancingPendenciasPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/financiamento-tarefas",
        element: (
          <ProtectedAdminRoute allowedProfiles={['Admin', 'Operacional', 'Financeiro']}>
            <AdminFinancingTarefasPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/financiamento-andamento",
        element: (
          <ProtectedAdminRoute allowedProfiles={['Admin', 'Operacional', 'Financeiro']}>
            <AdminFinancingAndamentoPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/usuarios",
        element: (
          <ProtectedAdminRoute allowedProfiles={['Admin']}>
            <AdminUsuariosPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/whatsapp",
        element: (
          <ProtectedAdminRoute allowedProfiles={['Admin', 'Corretor', 'Operacional', 'Financeiro']}>
            <AdminWhatsAppInboxPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
], {
  basename: import.meta.env.BASE_NAME,
});

const clerkPk = import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function AppRouter() {
  if (!clerkPk) {
    return <div>Erro: PUBLIC_CLERK_PUBLISHABLE_KEY ausente ou não instalada.</div>;
  }

  return (
    <ClerkProvider publishableKey={clerkPk}>
      <MemberProvider>
        <Toaster position="top-right" richColors />
        <RouterProvider router={router} />
      </MemberProvider>
    </ClerkProvider>
  );
}
