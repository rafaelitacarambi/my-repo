import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { DollarSign, ArrowLeft, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function AdminFinanceiroContent() {
  return (
    <div className="min-h-screen bg-primary">
      <Header />

      {/* Header */}
      <section className="w-full bg-gradient-to-br from-brandaccent/10 to-secondary/5 py-12">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <Link to="/area-restrita">
            <Button
              variant="ghost"
              className="text-primary-foreground hover:text-secondary hover:bg-primary-foreground/5 font-paragraph mb-6"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar para Área Restrita
            </Button>
          </Link>

          <div>
            <h1 className="font-heading text-4xl lg:text-5xl text-secondary mb-4">
              Gestão Financeira
            </h1>
            <p className="font-paragraph text-lg text-primary-foreground/80">
              Controle financeiro das operações imobiliárias
            </p>
          </div>
        </div>
      </section>

      {/* Dashboard Cards */}
      <section className="w-full py-12">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-gradient-to-br from-secondary/20 to-brandaccent/10 rounded-2xl p-8 border border-secondary/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-secondary-foreground" />
                </div>
                <h3 className="font-heading text-lg text-primary-foreground font-semibold">
                  Receitas
                </h3>
              </div>
              <p className="font-heading text-4xl text-secondary font-bold mb-2">
                R$ 0,00
              </p>
              <p className="font-paragraph text-sm text-primary-foreground/60">
                Total de receitas no período
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-primary-foreground/5 rounded-2xl p-8 border border-primary-foreground/10"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-destructive/20 rounded-xl flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="font-heading text-lg text-primary-foreground font-semibold">
                  Despesas
                </h3>
              </div>
              <p className="font-heading text-4xl text-primary-foreground font-bold mb-2">
                R$ 0,00
              </p>
              <p className="font-paragraph text-sm text-primary-foreground/60">
                Total de despesas no período
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-primary-foreground/5 rounded-2xl p-8 border border-primary-foreground/10"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-brandaccent/20 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-brandaccent" />
                </div>
                <h3 className="font-heading text-lg text-primary-foreground font-semibold">
                  Saldo
                </h3>
              </div>
              <p className="font-heading text-4xl text-primary-foreground font-bold mb-2">
                R$ 0,00
              </p>
              <p className="font-paragraph text-sm text-primary-foreground/60">
                Saldo atual
              </p>
            </motion.div>
          </div>

          {/* Coming Soon Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-gradient-to-br from-brandaccent/20 to-secondary/10 rounded-2xl p-12 border border-secondary/20 text-center"
          >
            <DollarSign className="w-16 h-16 text-secondary mx-auto mb-6" />
            <h2 className="font-heading text-3xl text-secondary mb-4 font-semibold">
              Sistema Financeiro em Desenvolvimento
            </h2>
            <p className="font-paragraph text-lg text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed mb-8">
              O módulo completo de gestão financeira está sendo desenvolvido e incluirá funcionalidades como:
            </p>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
              <div className="bg-primary-foreground/10 rounded-xl p-6">
                <h3 className="font-heading text-lg text-primary-foreground mb-2 font-semibold">
                  Controle de Comissões
                </h3>
                <p className="font-paragraph text-sm text-primary-foreground/70 leading-relaxed">
                  Gestão automática de comissões de corretores e repasses
                </p>
              </div>
              <div className="bg-primary-foreground/10 rounded-xl p-6">
                <h3 className="font-heading text-lg text-primary-foreground mb-2 font-semibold">
                  Relatórios Financeiros
                </h3>
                <p className="font-paragraph text-sm text-primary-foreground/70 leading-relaxed">
                  Relatórios detalhados de receitas, despesas e lucros
                </p>
              </div>
              <div className="bg-primary-foreground/10 rounded-xl p-6">
                <h3 className="font-heading text-lg text-primary-foreground mb-2 font-semibold">
                  Controle de Contratos
                </h3>
                <p className="font-paragraph text-sm text-primary-foreground/70 leading-relaxed">
                  Gestão de contratos de venda e locação
                </p>
              </div>
              <div className="bg-primary-foreground/10 rounded-xl p-6">
                <h3 className="font-heading text-lg text-primary-foreground mb-2 font-semibold">
                  Fluxo de Caixa
                </h3>
                <p className="font-paragraph text-sm text-primary-foreground/70 leading-relaxed">
                  Acompanhamento detalhado do fluxo de caixa da imobiliária
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function AdminFinanceiroPage() {
  return (
    <MemberProtectedRoute messageToSignIn="Faça login para acessar o financeiro">
      <AdminFinanceiroContent />
    </MemberProtectedRoute>
  );
}
