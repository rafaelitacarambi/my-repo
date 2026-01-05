import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, AlertCircle, DollarSign, Shield, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function LeilaoPage() {
  return (
    <div className="min-h-screen bg-primary">
      <Header />

      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-secondary to-secondary/80 py-20">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="text-6xl mb-6">🏛️</div>
            <h1 className="font-heading text-5xl lg:text-6xl text-white mb-6">
              Leilão Caixa
            </h1>
            <p className="font-paragraph text-lg text-white/90 max-w-2xl mx-auto">
              Oportunidades exclusivas de imóveis leiloados pela Caixa Econômica Federal
            </p>
          </motion.div>
        </div>
      </section>

      {/* Credenciamento Section */}
      <section className="w-full py-16 bg-light-gray/50">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-secondary/10 border-l-4 border-secondary rounded-lg p-8"
          >
            <div className="flex items-start gap-4">
              <Shield className="w-8 h-8 text-secondary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-heading text-2xl text-secondary mb-2">
                  Credenciados pela Caixa Econômica Federal
                </h3>
                <p className="font-paragraph text-dark-gray">
                  Somos corretores credenciados para intermediar operações de leilão de imóveis da Caixa. 
                  Isso garante transparência, segurança e conformidade com todas as regulamentações do processo.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section className="w-full py-16">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="font-heading text-4xl text-secondary mb-12 text-center">
              Como Funciona o Leilão Caixa
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  number: '1',
                  title: 'Busca de Imóveis',
                  description: 'Acesse o portal oficial da Caixa para consultar imóveis disponíveis em leilão'
                },
                {
                  number: '2',
                  title: 'Análise e Vistoria',
                  description: 'Realize a vistoria do imóvel e analise as condições e documentação'
                },
                {
                  number: '3',
                  title: 'Participação no Leilão',
                  description: 'Participe do leilão presencialmente ou online conforme as regras da Caixa'
                },
                {
                  number: '4',
                  title: 'Fechamento da Operação',
                  description: 'Após vencer o leilão, finalize a documentação e transferência do imóvel'
                }
              ].map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
                  className="bg-light-gray rounded-2xl p-6 border border-border-gray"
                >
                  <div className="bg-secondary text-white rounded-full w-12 h-12 flex items-center justify-center font-heading text-xl mb-4">
                    {step.number}
                  </div>
                  <h3 className="font-heading text-xl text-primary-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="font-paragraph text-dark-gray text-sm">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Vantagens Section */}
      <section className="w-full py-16 bg-light-gray/50">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="font-heading text-4xl text-secondary mb-12 text-center">
              Vantagens do Leilão Caixa
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  icon: DollarSign,
                  title: 'Preços Competitivos',
                  description: 'Imóveis leiloados geralmente apresentam preços abaixo do valor de mercado'
                },
                {
                  icon: CheckCircle,
                  title: 'Transparência Total',
                  description: 'Processo regulado pela Caixa com total transparência e conformidade legal'
                },
                {
                  icon: Shield,
                  title: 'Segurança Jurídica',
                  description: 'Documentação completa e verificada pela instituição financeira'
                },
                {
                  icon: ArrowRight,
                  title: 'Processo Ágil',
                  description: 'Procedimentos padronizados que agilizam a conclusão da operação'
                }
              ].map((vantagem, index) => {
                const Icon = vantagem.icon;
                return (
                  <motion.div
                    key={vantagem.title}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 + index * 0.05 }}
                    className="flex gap-4"
                  >
                    <Icon className="w-8 h-8 text-secondary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-heading text-xl text-primary-foreground mb-2">
                        {vantagem.title}
                      </h3>
                      <p className="font-paragraph text-dark-gray">
                        {vantagem.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Riscos Section */}
      <section className="w-full py-16">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h2 className="font-heading text-4xl text-secondary mb-12 text-center">
              Pontos de Atenção
            </h2>

            <div className="space-y-4">
              {[
                {
                  title: 'Condição do Imóvel',
                  description: 'Imóveis leiloados podem estar em condições que requerem reformas. Sempre realize vistoria completa antes de participar do leilão.'
                },
                {
                  title: 'Prazos Rigorosos',
                  description: 'O processo de leilão segue cronogramas rígidos. Atrasos podem resultar em perda da oportunidade ou multas.'
                },
                {
                  title: 'Documentação Complexa',
                  description: 'A documentação pode envolver questões legais complexas. Recomendamos consultar um advogado especializado.'
                },
                {
                  title: 'Financiamento Limitado',
                  description: 'Nem todos os bancos financiam imóveis leiloados. Verifique as possibilidades antes de participar.'
                }
              ].map((risco, index) => (
                <motion.div
                  key={risco.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 + index * 0.05 }}
                  className="bg-light-gray rounded-lg p-6 border-l-4 border-brandaccent"
                >
                  <div className="flex gap-4">
                    <AlertCircle className="w-6 h-6 text-brandaccent flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-heading text-lg text-primary-foreground mb-1">
                        {risco.title}
                      </h3>
                      <p className="font-paragraph text-dark-gray text-sm">
                        {risco.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Financiamento Section */}
      <section className="w-full py-16 bg-light-gray/50">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="bg-white rounded-2xl p-8 border border-border-gray"
          >
            <h2 className="font-heading text-3xl text-secondary mb-4">
              Possibilidade de Financiamento
            </h2>
            <p className="font-paragraph text-dark-gray mb-6">
              Alguns imóveis leiloados pela Caixa podem ser financiados através de programas específicos. 
              A Caixa oferece linhas de crédito para aquisição de imóveis em leilão, com condições especiais 
              para clientes que atendem aos critérios de elegibilidade.
            </p>
            <div className="bg-secondary/10 rounded-lg p-4 mb-6">
              <p className="font-paragraph text-sm text-dark-gray">
                <strong>Importante:</strong> As condições de financiamento variam conforme o imóvel e sua situação. 
                Consulte a Caixa ou nossos corretores para conhecer as opções disponíveis para cada leilão.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 bg-gradient-to-br from-secondary/10 to-brandaccent/5">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="text-center"
          >
            <h2 className="font-heading text-4xl text-secondary mb-6">
              Pronto para Explorar Oportunidades?
            </h2>
            <p className="font-paragraph text-lg text-dark-gray max-w-2xl mx-auto mb-8">
              Acesse o portal oficial da Caixa Econômica Federal para consultar todos os imóveis disponíveis em leilão.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://venda-imoveis.caixa.gov.br/sistema/busca-imovel.asp?sltTipoBusca=imoveis"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-paragraph font-semibold h-12 px-8 rounded-lg inline-flex items-center gap-2">
                  Acessar Portal da Caixa
                  <ExternalLink className="w-5 h-5" />
                </Button>
              </a>
              <Link to="/imoveis?segmento=leilao-caixa">
                <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary/10 font-paragraph font-semibold h-12 px-8 rounded-lg">
                  Ver Imóveis em Leilão
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="w-full py-16">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="text-center"
          >
            <h2 className="font-heading text-3xl text-secondary mb-4">
              Precisa de Orientação?
            </h2>
            <p className="font-paragraph text-dark-gray max-w-2xl mx-auto mb-8">
              Nossos corretores credenciados estão prontos para ajudar você a navegar pelo processo de leilão Caixa.
            </p>
            <Link to="/contato">
              <Button className="bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90 font-paragraph font-semibold h-12 px-8 rounded-lg">
                Fale Conosco
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
