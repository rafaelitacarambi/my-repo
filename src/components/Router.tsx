import { MemberProvider } from '@/integrations';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import { ProtectedAdminRoute } from '@/components/ui/protected-admin-route';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';

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
import AdminLeadsPage from '@/components/pages/admin/AdminLeadsPage';
import AdminProcessosPage from '@/components/pages/admin/AdminProcessosPage';
import AdminChavesPage from '@/components/pages/admin/AdminChavesPage';
import AdminFinanceiroPage from '@/components/pages/admin/AdminFinanceiroPage';
import AdminClientesPage from '@/components/pages/admin/AdminClientesPage';
import AdminAtendimentosPage from '@/components/pages/admin/AdminAtendimentosPage';
import AdminAgendamentosPage from '@/components/pages/admin/AdminAgendamentosPage';
import AdminHistoricoPage from '@/components/pages/admin/AdminHistoricoPage';
import AdminFinancingKanbanPage from '@/components/pages/admin/AdminFinancingKanbanPage';
import AdminFinanciamentoDetalhePage from '@/components/pages/admin/AdminFinanciamentoDetalhePage';
import AdminUsuariosPage from '@/components/pages/admin/AdminUsuariosPage';
import DiagnosticoUsuarioPage from '@/components/pages/DiagnosticoUsuarioPage';
import AdminFinanciamentoHubPage from '@/components/pages/admin/AdminFinanciamentoHubPage';
import AdminFinancingPendenciasPage from '@/components/pages/admin/AdminFinancingPendenciasPage';
import AdminFinancingTarefasPage from '@/components/pages/admin/AdminFinancingTarefasPage';

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
        path: "admin/imoveis",
        element: (
          <ProtectedAdminRoute>
            <AdminImoveisPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/leads",
        element: (
          <ProtectedAdminRoute>
            <AdminLeadsPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/processos",
        element: (
          <ProtectedAdminRoute>
            <AdminProcessosPage />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "admin/chaves",
        element: (
          <ProtectedAdminRoute>
            <AdminChavesPage />
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
        path: "admin/atendimentos",
        element: (
          <ProtectedAdminRoute>
            <AdminAtendimentosPage />
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
        path: "admin/historico",
        element: (
          <ProtectedAdminRoute>
            <AdminHistoricoPage />
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
        path: "admin/usuarios",
        element: (
          <ProtectedAdminRoute allowedProfiles={['Admin']}>
            <AdminUsuariosPage />
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

export default function AppRouter() {
  return (
    <MemberProvider>
      <RouterProvider router={router} />
    </MemberProvider>
  );
}
