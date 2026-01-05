import { MemberProvider } from '@/integrations';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
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
        path: "admin/imoveis",
        element: <AdminImoveisPage />,
      },
      {
        path: "admin/leads",
        element: <AdminLeadsPage />,
      },
      {
        path: "admin/processos",
        element: <AdminProcessosPage />,
      },
      {
        path: "admin/chaves",
        element: <AdminChavesPage />,
      },
      {
        path: "admin/financeiro",
        element: <AdminFinanceiroPage />,
      },
      {
        path: "admin/clientes",
        element: <AdminClientesPage />,
      },
      {
        path: "admin/atendimentos",
        element: <AdminAtendimentosPage />,
      },
      {
        path: "admin/agendamentos",
        element: <AdminAgendamentosPage />,
      },
      {
        path: "admin/historico",
        element: <AdminHistoricoPage />,
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
