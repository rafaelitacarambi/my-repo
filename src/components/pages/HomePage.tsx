import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Calculator, Users, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BaseCrudService } from '@/integrations';
import { Imveis } from '@/entities';

export default function HomePage() {
  const [featuredProperties, setFeaturedProperties] = useState<Imveis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedProperties = async () => {
      try {
        const { items } = await BaseCrudService.getAll<Imveis>('imoveis');
        setFeaturedProperties(items.slice(0, 3));
      } catch (error) {
        console.error('Error loading properties:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedProperties();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="w-full max-w-[100rem] mx-auto min-h-[600px] lg:min-h-[700px] relative overflow-hidden">
        <div className="px-6 lg:px-12 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <h1 className="font-heading text-5xl lg:text-7xl text-secondary leading-tight font-bold">
                Encontre o Imóvel Perfeito
              </h1>
              <p className="font-paragraph text-lg lg:text-xl text-dark-gray max-w-xl leading-relaxed">
                Especialistas em financiamento imobiliário pela Caixa Econômica Federal. Encontre o imóvel ideal com as melhores condições do mercado.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/imoveis">
                  <Button className="bg-secondary text-foreground hover:bg-black font-paragraph font-semibold h-14 px-8 rounded-none text-base w-full sm:w-auto">
                    Ver Imóveis
                  </Button>
                </Link>
                <Link to="/simulador">
                  <Button className="bg-ice-gray text-secondary hover:bg-matte-silver font-paragraph font-semibold h-14 px-8 rounded-none text-base border border-matte-silver w-full sm:w-auto">
                    Simular Financiamento
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right Visual Element */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:flex items-center justify-center"
            >
              <div className="relative w-full h-[500px] flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-80 h-80 bg-ice-gray rounded-full blur-3xl"></div>
                </div>
                <div className="relative z-10 w-72 h-72 bg-gradient-to-br from-white to-ice-gray rounded-full flex items-center justify-center border border-matte-silver">
                  <div className="w-48 h-48 bg-ice-gray rounded-full flex items-center justify-center">
                    <Home className="w-24 h-24 text-medium-gray" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full bg-ice-gray py-20">
        <div className="max-w-[100rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-4xl lg:text-5xl text-secondary mb-6 font-bold">
              Por Que Escolher a R. Sales?
            </h2>
            <p className="font-paragraph text-lg text-dark-gray max-w-3xl mx-auto">
              Oferecemos soluções completas para sua jornada imobiliária
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Home,
                title: 'Amplo Portfólio',
                description: 'Centenas de imóveis selecionados para você escolher',
              },
              {
                icon: Calculator,
                title: 'Simulador Caixa',
                description: 'Calcule seu financiamento com taxas reais e atualizadas',
              },
              {
                icon: Users,
                title: 'Corretores Especializados',
                description: 'Equipe experiente pronta para te atender',
              },
              {
                icon: TrendingUp,
                title: 'Melhores Condições',
                description: 'Negociamos as melhores taxas e prazos para você',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white p-8 rounded-none border border-matte-silver hover:shadow-lg transition-all"
              >
                <div className="w-14 h-14 bg-ice-gray rounded-none flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-secondary" />
                </div>
                <h3 className="font-heading text-xl text-secondary mb-3 font-semibold">
                  {feature.title}
                </h3>
                <p className="font-paragraph text-base text-dark-gray leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="w-full py-20">
        <div className="max-w-[100rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-6"
          >
            <div>
              <h2 className="font-heading text-4xl lg:text-5xl text-secondary mb-4 font-bold">
                Imóveis em Destaque
              </h2>
              <p className="font-paragraph text-lg text-dark-gray">
                Confira nossa seleção especial de propriedades
              </p>
            </div>
            <Link to="/imoveis">
              <Button className="bg-white text-secondary hover:bg-ice-gray font-paragraph font-semibold h-12 px-6 rounded-none border border-matte-silver">
                Ver Todos os Imóveis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-ice-gray rounded-none h-96 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProperties.map((property, index) => (
                <motion.div
                  key={property._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Link to={`/imoveis/${property._id}`}>
                    <div className="bg-white rounded-none overflow-hidden border border-matte-silver hover:shadow-lg transition-all group">
                      <div className="relative h-64 bg-ice-gray overflow-hidden">
                        {property.propertyImages ? (
                          <Image
                            src={property.propertyImages}
                            alt={property.propertyName || 'Imóvel'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            width={400}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Home className="w-16 h-16 text-medium-gray" />
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="font-heading text-xl text-secondary mb-2 font-semibold">
                          {property.propertyName}
                        </h3>
                        <p className="font-paragraph text-sm text-dark-gray mb-4">
                          {property.address}
                        </p>
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-paragraph text-sm text-dark-gray">
                            {property.bedrooms} quartos • {property.bathrooms} banheiros
                          </span>
                          <span className="font-paragraph text-sm text-dark-gray">
                            {property.area}m²
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-heading text-2xl text-secondary font-bold">
                            {property.price
                              ? `R$ ${property.price.toLocaleString('pt-BR')}`
                              : 'Consulte'}
                          </span>
                          <span className="font-paragraph text-sm text-dark-gray bg-ice-gray px-3 py-1 rounded-none">
                            {property.transactionType}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full bg-ice-gray py-20">
        <div className="max-w-[100rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h2 className="font-heading text-4xl lg:text-5xl text-secondary mb-6 font-bold">
              Pronto Para Encontrar Seu Novo Lar?
            </h2>
            <p className="font-paragraph text-lg text-dark-gray mb-8 leading-relaxed">
              Nossa equipe está pronta para ajudar você a realizar o sonho da casa própria. Entre em contato e descubra as melhores oportunidades do mercado.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contato">
                <Button className="bg-secondary text-foreground hover:bg-black font-paragraph font-semibold h-14 px-8 rounded-none text-base w-full sm:w-auto">
                  Fale Conosco
                </Button>
              </Link>
              <Link to="/corretores">
                <Button className="bg-white text-secondary hover:bg-ice-gray font-paragraph font-semibold h-14 px-8 rounded-none border border-matte-silver w-full sm:w-auto">
                  Conheça Nossos Corretores
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
