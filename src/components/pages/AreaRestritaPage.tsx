import { useMember } from '@/integrations';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, FileText, Key, DollarSign, UserCheck, Headphones, Calendar, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function AreaRestritaContent() {
  const { member } = useMember();

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
                Bem-vindo, {member?.profile?.nickname || member?.contact?.firstName || 'Corretor'}!
              </p>
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

            {/* Gestão de Leads */}
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
                    Gestão de Leads
                  </h3>
                  <p className="font-paragraph text-base text-primary-foreground/70 leading-relaxed">
                    Visualize e gerencie leads de contato e distribua automaticamente
                  </p>
                </div>
              </Link>
            </motion.div>

            {/* Gestão de Processos */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Link to="/admin/processos">
                <div className="bg-primary-foreground/5 rounded-2xl p-8 border border-primary-foreground/10 hover:border-secondary/30 transition-all group h-full">
                  <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-7 h-7 text-secondary-foreground" />
                  </div>
                  <h3 className="font-heading text-2xl text-primary-foreground mb-3 font-semibold">
                    Gestão de Processos
                  </h3>
                  <p className="font-paragraph text-base text-primary-foreground/70 leading-relaxed">
                    Acompanhe processos de venda e locação em andamento
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

            {/* Gestão de Atendimentos */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Link to="/admin/atendimentos">
                <div className="bg-primary-foreground/5 rounded-2xl p-8 border border-primary-foreground/10 hover:border-secondary/30 transition-all group h-full">
                  <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Headphones className="w-7 h-7 text-secondary-foreground" />
                  </div>
                  <h3 className="font-heading text-2xl text-primary-foreground mb-3 font-semibold">
                    Gestão de Atendimentos
                  </h3>
                  <p className="font-paragraph text-base text-primary-foreground/70 leading-relaxed">
                    Registre e acompanhe solicitações de serviço
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
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function AreaRestritaPage() {
  return (
    <MemberProtectedRoute messageToSignIn="Faça login para acessar a área restrita">
      <AreaRestritaContent />
    </MemberProtectedRoute>
  );
}
