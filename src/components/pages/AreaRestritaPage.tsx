import { useClerk, useUser } from '@clerk/clerk-react';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Users, TrendingUp, FileText, Key, DollarSign, UserCheck, Headphones, Calendar, History, UserCog, LogOut, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CreateNewModal } from '@/components/CreateNewModal';
import { ClientRegistrationModal } from '@/components/ClientRegistrationModal';
import { useState, useEffect } from 'react';
import { useAuthValidation } from '@/hooks/use-auth-validation';

function AreaRestritaContent() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const { isValidating, isAuthorized, userProfile, error } = useAuthValidation();
  const navigate = useNavigate();
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [showPropertyForm, setShowPropertyForm] = useState(false);

  const handleLogout = () => {
    signOut();
  };

  const handleCreateProperty = () => {
    // Navigate to property creation
    window.location.href = '/admin/imoveis';
  };

  const handleCreateClient = () => {
    navigate('/admin/clientes', { state: { openNewClient: true } });
  };

  useEffect(() => {
    if (isAuthorized && userProfile) {
      const sectors = userProfile.setores || [];

      // Priority redirect to Sales Dashboard as requested
      if (sectors.includes('Venda, Compra e Locação') || userProfile.profile === 'Admin') {
        navigate('/admin/vendas/dashboard');
      }
      // Fallback for other sectors
      else if (sectors.length === 1 && sectors.includes('Financiamento')) {
        navigate('/admin/financiamento/dashboard');
      }
    }
  }, [isAuthorized, userProfile, navigate]);

  // Show loading state while validating
  if (isValidating) {
    return (
      <div className="min-h-screen bg-primary">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  // Show error if not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-primary">
        <Header />
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-16">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertDescription className="font-paragraph text-base">
              {error || 'Acesso não autorizado'}
            </AlertDescription>
          </Alert>
          <div className="text-center mt-8">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="font-paragraph"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      <Header />

      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-brandaccent/10 to-secondary/5 py-16">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center text-center gap-6"
          >
            <Image
              src="https://static.wixstatic.com/media/9b23b4_901f6032bce24b56a3af78024a71a840~mv2.png"
              alt="R. Sales Imóveis Logo"
              width={100}
              className="h-auto"
            />
            <div>
              <h1 className="font-heading text-5xl lg:text-6xl text-secondary mb-6">
                Área Restrita
              </h1>
              <p className="font-paragraph text-lg text-primary-foreground/80 max-w-2xl mx-auto">
                Bem-vindo, {userProfile?.nome || user?.firstName || 'Usuário'}!
              </p>
              <p className="font-paragraph text-sm text-primary-foreground/60 mt-2">
                Perfil: {userProfile?.profile || 'Não definido'}
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <CreateNewModal
                onSelectProperty={handleCreateProperty}
                onSelectClient={handleCreateClient}
              />
              <Button
                onClick={handleLogout}
                variant="outline"
                className="font-paragraph"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Grid */}
      <section className="w-full py-16">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Cadastro de Imóveis */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Link to="/admin/imoveis">
                <div className="bg-primary-foreground/5 rounded-2xl p-8 border border-primary-foreground/10 hover:border-secondary/30 transition-all group h-full">
                  <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Image
                      src="https://static.wixstatic.com/media/9b23b4_901f6032bce24b56a3af78024a71a840~mv2.png"
                      alt="Logo"
                      width={28}
                      className="h-auto"
                    />
                  </div>
                  <h3 className="font-heading text-2xl text-primary-foreground mb-3 font-semibold">
                    Cadastro de Imóveis
                  </h3>
                  <p className="font-paragraph text-base text-primary-foreground/70 leading-relaxed">
                    Adicione, edite e gerencie imóveis disponíveis para venda e locação
                  </p>
                </div>
              </Link>
            </motion.div>

            {/* Leads */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link to="/admin/leads">
                <div className="bg-primary-foreground/5 rounded-2xl p-8 border border-primary-foreground/10 hover:border-secondary/30 transition-all group h-full">
                  <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Users className="w-7 h-7 text-secondary-foreground" />
                  </div>
                  <h3 className="font-heading text-2xl text-primary-foreground mb-3 font-semibold">
                    Leads
                  </h3>
                  <p className="font-paragraph text-base text-primary-foreground/70 leading-relaxed">
                    Visualize e gerencie leads de contato e distribua automaticamente
                  </p>
                </div>
              </Link>
            </motion.div>





            {/* Gestão de Chaves */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link to="/admin/chaves">
                <div className="bg-primary-foreground/5 rounded-2xl p-8 border border-primary-foreground/10 hover:border-secondary/30 transition-all group h-full">
                  <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Key className="w-7 h-7 text-secondary-foreground" />
                  </div>
                  <h3 className="font-heading text-2xl text-primary-foreground mb-3 font-semibold">
                    Gestão de Chaves
                  </h3>
                  <p className="font-paragraph text-base text-primary-foreground/70 leading-relaxed">
                    Gerencie chaves de imóveis via QR Code
                  </p>
                </div>
              </Link>
            </motion.div>

            {/* Gestão Financeira */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Link to="/admin/financeiro">
                <div className="bg-primary-foreground/5 rounded-2xl p-8 border border-primary-foreground/10 hover:border-secondary/30 transition-all group h-full">
                  <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <DollarSign className="w-7 h-7 text-secondary-foreground" />
                  </div>
                  <h3 className="font-heading text-2xl text-primary-foreground mb-3 font-semibold">
                    Gestão Financeira
                  </h3>
                  <p className="font-paragraph text-base text-primary-foreground/70 leading-relaxed">
                    Controle financeiro das operações imobiliárias
                  </p>
                </div>
              </Link>
            </motion.div>

            {/* Perfil */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Link to="/perfil">
                <div className="bg-primary-foreground/5 rounded-2xl p-8 border border-primary-foreground/10 hover:border-secondary/30 transition-all group h-full">
                  <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <FileText className="w-7 h-7 text-secondary-foreground" />
                  </div>
                  <h3 className="font-heading text-2xl text-primary-foreground mb-3 font-semibold">
                    Meu Perfil
                  </h3>
                  <p className="font-paragraph text-base text-primary-foreground/70 leading-relaxed">
                    Visualize e edite suas informações pessoais
                  </p>
                </div>
              </Link>
            </motion.div>

            {/* Gestão de Clientes */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Link to="/admin/clientes">
                <div className="bg-primary-foreground/5 rounded-2xl p-8 border border-primary-foreground/10 hover:border-secondary/30 transition-all group h-full">
                  <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <UserCheck className="w-7 h-7 text-secondary-foreground" />
                  </div>
                  <h3 className="font-heading text-2xl text-primary-foreground mb-3 font-semibold">
                    Gestão de Clientes
                  </h3>
                  <p className="font-paragraph text-base text-primary-foreground/70 leading-relaxed">
                    Gerencie dados de clientes e histórico de contatos
                  </p>
                </div>
              </Link>
            </motion.div>



            {/* Gestão de Agendamentos */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <Link to="/admin/agendamentos">
                <div className="bg-primary-foreground/5 rounded-2xl p-8 border border-primary-foreground/10 hover:border-secondary/30 transition-all group h-full">
                  <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Calendar className="w-7 h-7 text-secondary-foreground" />
                  </div>
                  <h3 className="font-heading text-2xl text-primary-foreground mb-3 font-semibold">
                    Gestão de Agendamentos
                  </h3>
                  <p className="font-paragraph text-base text-primary-foreground/70 leading-relaxed">
                    Gerencie compromissos e agendamentos de serviços
                  </p>
                </div>
              </Link>
            </motion.div>

            {/* Histórico de Interações */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              <Link to="/admin/historico">
                <div className="bg-primary-foreground/5 rounded-2xl p-8 border border-primary-foreground/10 hover:border-secondary/30 transition-all group h-full">
                  <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <History className="w-7 h-7 text-secondary-foreground" />
                  </div>
                  <h3 className="font-heading text-2xl text-primary-foreground mb-3 font-semibold">
                    Histórico de Interações
                  </h3>
                  <p className="font-paragraph text-base text-primary-foreground/70 leading-relaxed">
                    Registre e acompanhe todas as interações com clientes
                  </p>
                </div>
              </Link>
            </motion.div>

            {/* Dashboard Financiamento */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
            >
              <Link to="/admin/financiamento/dashboard">
                <div className="bg-primary-foreground/5 rounded-2xl p-8 border border-primary-foreground/10 hover:border-secondary/30 transition-all group h-full">
                  <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-7 h-7 text-secondary-foreground" />
                  </div>
                  <h3 className="font-heading text-2xl text-primary-foreground mb-3 font-semibold">
                    Dashboard Financiamento
                  </h3>
                  <p className="font-paragraph text-base text-primary-foreground/70 leading-relaxed">
                    Painel operacional focado em produtividade e controle de financiamentos
                  </p>
                </div>
              </Link>
            </motion.div>

            {/* Kanban de Financiamento */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
            >
              <Link to="/admin/financiamento-kanban">
                <div className="bg-primary-foreground/5 rounded-2xl p-8 border border-primary-foreground/10 hover:border-secondary/30 transition-all group h-full">
                  <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <DollarSign className="w-7 h-7 text-secondary-foreground" />
                  </div>
                  <h3 className="font-heading text-2xl text-primary-foreground mb-3 font-semibold">
                    Kanban de Financiamento
                  </h3>
                  <p className="font-paragraph text-base text-primary-foreground/70 leading-relaxed">
                    Gerencie o fluxo de financiamentos através das 9 fases do processo
                  </p>
                </div>
              </Link>
            </motion.div>

            {/* Gestão de Usuários */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <Link to="/admin/usuarios">
                <div className="bg-primary-foreground/5 rounded-2xl p-8 border border-primary-foreground/10 hover:border-secondary/30 transition-all group h-full">
                  <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <UserCog className="w-7 h-7 text-secondary-foreground" />
                  </div>
                  <h3 className="font-heading text-2xl text-primary-foreground mb-3 font-semibold">
                    Gestão de Usuários
                  </h3>
                  <p className="font-paragraph text-base text-primary-foreground/70 leading-relaxed">
                    Cadastre e gerencie usuários do sistema com integração Wix Members
                  </p>
                </div>
              </Link>
            </motion.div>

            {/* Módulo de Emails Transacionais */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Link to="/admin/emails">
                <div className="bg-primary-foreground/5 rounded-2xl p-8 border border-primary-foreground/10 hover:border-blue-500/50 transition-all group h-full">
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Mail className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="font-heading text-2xl text-primary-foreground mb-3 font-semibold">
                    Caixa de Saída (E-mails)
                  </h3>
                  <p className="font-paragraph text-base text-primary-foreground/70 leading-relaxed">
                    Dispare e-mails para clientes, audite entregas e falhas (API Gateway)
                  </p>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />

      <ClientRegistrationModal
        isOpen={isClientModalOpen}
        onOpenChange={setIsClientModalOpen}
      />
    </div>
  );
}

export default function AreaRestritaPage() {
  return (
    <MemberProtectedRoute>
      <AreaRestritaContent />
    </MemberProtectedRoute>
  );
}
