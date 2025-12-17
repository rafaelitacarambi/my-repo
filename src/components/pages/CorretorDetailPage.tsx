import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Phone, ArrowLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BaseCrudService } from '@/integrations';
import { RealEstateBrokers } from '@/entities';

export default function CorretorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [broker, setBroker] = useState<RealEstateBrokers | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBroker = async () => {
      if (!id) return;

      try {
        const item = await BaseCrudService.getById<RealEstateBrokers>('corretores', id);
        setBroker(item);
      } catch (error) {
        console.error('Error loading broker:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBroker();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-[100rem] mx-auto px-6 lg:px-12 py-20">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-ice-gray rounded-none"></div>
            <div className="h-64 bg-ice-gray rounded-none"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-[100rem] mx-auto px-6 lg:px-12 py-20 text-center">
          <User className="w-16 h-16 text-medium-gray mx-auto mb-4" />
          <h2 className="font-heading text-3xl text-secondary mb-4 font-bold">
            Corretor não encontrado
          </h2>
          <Link to="/corretores">
            <Button className="bg-secondary text-foreground hover:bg-black font-paragraph font-semibold h-12 px-6 rounded-none">
              Voltar para Corretores
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Back Button */}
      <section className="w-full py-6 border-b border-matte-silver">
        <div className="max-w-[100rem] mx-auto px-6 lg:px-12">
          <Link to="/corretores">
            <Button
              variant="ghost"
              className="text-dark-gray hover:text-secondary hover:bg-ice-gray font-paragraph rounded-none"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar para Corretores
            </Button>
          </Link>
        </div>
      </section>

      {/* Broker Details */}
      <section className="w-full py-16">
        <div className="max-w-[100rem] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Profile Image */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-1"
            >
              <div className="sticky top-24">
                <div className="relative h-96 lg:h-[500px] bg-ice-gray rounded-none overflow-hidden mb-6 border border-matte-silver">
                  {broker.profilePicture ? (
                    <Image
                      src={broker.profilePicture}
                      alt={broker.fullName || 'Corretor'}
                      className="w-full h-full object-cover"
                      width={400}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-24 h-24 text-medium-gray" />
                    </div>
                  )}
                </div>

                {/* Contact Card */}
                <div className="bg-ice-gray rounded-none p-6 border border-matte-silver space-y-4">
                  <h3 className="font-heading text-lg text-secondary mb-4 font-semibold">
                    Informações de Contato
                  </h3>

                  {broker.phoneNumber && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-paragraph text-sm text-dark-gray mb-1">
                          Telefone
                        </p>
                        <a
                          href={`tel:${broker.phoneNumber}`}
                          className="font-paragraph text-base text-secondary hover:text-black transition-colors"
                        >
                          {broker.phoneNumber}
                        </a>
                      </div>
                    </div>
                  )}

                  {broker.emailAddress && (
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-paragraph text-sm text-dark-gray mb-1">
                          E-mail
                        </p>
                        <a
                          href={`mailto:${broker.emailAddress}`}
                          className="font-paragraph text-base text-secondary hover:text-black transition-colors break-all"
                        >
                          {broker.emailAddress}
                        </a>
                      </div>
                    </div>
                  )}

                  {broker.whatsAppUrl && (
                    <a href={broker.whatsAppUrl} target="_blank" rel="noopener noreferrer" className="block mt-6">
                      <Button className="w-full bg-secondary text-foreground hover:bg-black font-paragraph font-semibold h-12 rounded-none">
                        <MessageCircle className="w-5 h-5 mr-2" />
                        WhatsApp
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-2 space-y-8"
            >
              <div>
                <h1 className="font-heading text-4xl lg:text-5xl text-secondary mb-4 font-bold">
                  {broker.fullName}
                </h1>
                {broker.creciNumber && (
                  <p className="font-paragraph text-lg text-dark-gray mb-6">
                    CRECI: {broker.creciNumber}
                  </p>
                )}
              </div>

              {broker.biography && (
                <div className="bg-ice-gray rounded-none p-8 border border-matte-silver">
                  <h2 className="font-heading text-2xl text-secondary mb-6 font-semibold">
                    Sobre o Corretor
                  </h2>
                  <p className="font-paragraph text-base text-dark-gray leading-relaxed whitespace-pre-line">
                    {broker.biography}
                  </p>
                </div>
              )}

              <div className="bg-ice-gray rounded-none p-8 border border-matte-silver">
                <h2 className="font-heading text-2xl text-secondary mb-4 font-semibold">
                  Precisa de Ajuda?
                </h2>
                <p className="font-paragraph text-base text-dark-gray mb-6 leading-relaxed">
                  Entre em contato para agendar uma visita, tirar dúvidas sobre imóveis ou obter informações sobre financiamento.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  {broker.whatsAppUrl && (
                    <a href={broker.whatsAppUrl} target="_blank" rel="noopener noreferrer">
                      <Button className="bg-secondary text-foreground hover:bg-black font-paragraph font-semibold h-12 px-6 rounded-none w-full sm:w-auto">
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Conversar no WhatsApp
                      </Button>
                    </a>
                  )}
                  {broker.emailAddress && (
                    <a href={`mailto:${broker.emailAddress}`}>
                      <Button className="bg-white text-secondary hover:bg-ice-gray font-paragraph font-semibold h-12 px-6 rounded-none border border-matte-silver w-full sm:w-auto">
                        <Mail className="w-5 h-5 mr-2" />
                        Enviar E-mail
                      </Button>
                    </a>
                  )}
                </div>
              </div>

              <div className="bg-ice-gray rounded-none p-8 border border-matte-silver">
                <h2 className="font-heading text-2xl text-secondary mb-6 font-semibold">
                  Explore Nossos Imóveis
                </h2>
                <p className="font-paragraph text-base text-dark-gray mb-6 leading-relaxed">
                  Confira nossa seleção completa de imóveis disponíveis para venda e locação
                </p>
                <Link to="/imoveis">
                  <Button className="bg-secondary text-foreground hover:bg-black font-paragraph font-semibold h-12 px-6 rounded-none">
                    Ver Todos os Imóveis
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
