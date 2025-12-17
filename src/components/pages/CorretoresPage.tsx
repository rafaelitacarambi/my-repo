import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Mail, Phone, MessageCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BaseCrudService } from '@/integrations';
import { RealEstateBrokers } from '@/entities';

export default function CorretoresPage() {
  const [brokers, setBrokers] = useState<RealEstateBrokers[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBrokers = async () => {
      try {
        const { items } = await BaseCrudService.getAll<RealEstateBrokers>('corretores');
        const activeBrokers = items.filter((broker) => broker.isActive);
        setBrokers(activeBrokers);
      } catch (error) {
        console.error('Error loading brokers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBrokers();
  }, []);

  return (
    <div className="min-h-screen bg-primary">
      <Header />

      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-secondary/10 to-brandaccent/5 py-16">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-secondary-foreground" />
            </div>
            <h1 className="font-heading text-5xl lg:text-6xl text-secondary mb-6">
              Nossos Corretores
            </h1>
            <p className="font-paragraph text-lg text-dark-gray max-w-2xl mx-auto">
              Profissionais experientes e qualificados prontos para ajudar você a encontrar o imóvel ideal
            </p>
          </motion.div>
        </div>
      </section>

      {/* Brokers Grid */}
      <section className="w-full py-16">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-light-gray rounded-2xl h-96 animate-pulse border border-border-gray"></div>
              ))}
            </div>
          ) : brokers.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-16 h-16 text-primary-foreground/30 mx-auto mb-4" />
              <h3 className="font-heading text-2xl text-primary-foreground mb-2">
                Nenhum corretor disponível
              </h3>
              <p className="font-paragraph text-base text-dark-gray">
                Em breve teremos corretores cadastrados
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {brokers.map((broker, index) => (
                <motion.div
                  key={broker._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Link to={`/corretores/${broker._id}`}>
                    <div className="bg-light-gray rounded-2xl overflow-hidden border border-border-gray hover:border-secondary/30 transition-all group h-full">
                      <div className="relative h-80 bg-light-gray overflow-hidden">
                        {broker.profilePicture ? (
                          <Image
                            src={broker.profilePicture}
                            alt={broker.fullName || 'Corretor'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            width={400}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-24 h-24 text-primary-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="font-heading text-2xl text-primary-foreground mb-2 font-semibold">
                          {broker.fullName}
                        </h3>
                        {broker.creciNumber && (
                          <p className="font-paragraph text-sm text-dark-gray mb-4">
                            CRECI: {broker.creciNumber}
                          </p>
                        )}
                        {broker.biography && (
                          <p className="font-paragraph text-base text-dark-gray mb-6 line-clamp-3 leading-relaxed">
                            {broker.biography}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          {broker.phoneNumber && (
                            <div className="flex items-center gap-2 text-dark-gray">
                              <Phone className="w-4 h-4" />
                              <span className="font-paragraph text-sm">{broker.phoneNumber}</span>
                            </div>
                          )}
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
      <section className="w-full bg-gradient-to-br from-secondary/10 to-brandaccent/5 py-16 border-t border-border-gray">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="font-heading text-4xl lg:text-5xl text-secondary mb-6">
              Precisa de Ajuda Especializada?
            </h2>
            <p className="font-paragraph text-lg text-dark-gray mb-8 leading-relaxed">
              Nossa equipe de corretores está pronta para atender você e encontrar o imóvel perfeito para suas necessidades
            </p>
            <Link to="/contato">
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-paragraph font-semibold h-14 px-8 rounded-lg text-base">
                <MessageCircle className="w-5 h-5 mr-2" />
                Entre em Contato
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
