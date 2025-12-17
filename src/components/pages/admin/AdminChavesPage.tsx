import { useEffect, useState } from 'react';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Key, ArrowLeft, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BaseCrudService } from '@/integrations';
import { Imveis } from '@/entities';

function AdminChavesContent() {
  const [properties, setProperties] = useState<Imveis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const { items } = await BaseCrudService.getAll<Imveis>('imoveis');
      setProperties(items);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

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
              Gestão de Chaves via QR Code
            </h1>
            <p className="font-paragraph text-lg text-primary-foreground/80">
              Visualize e gerencie QR Codes das chaves dos imóveis
            </p>
          </div>
        </div>
      </section>

      {/* Keys List */}
      <section className="w-full py-12">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-primary-foreground/5 rounded-xl h-64 animate-pulse"></div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-20">
              <Key className="w-16 h-16 text-primary-foreground/30 mx-auto mb-4" />
              <h3 className="font-heading text-2xl text-primary-foreground mb-2">
                Nenhum imóvel cadastrado
              </h3>
              <p className="font-paragraph text-base text-primary-foreground/60">
                Cadastre imóveis para gerenciar suas chaves
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property, index) => (
                <motion.div
                  key={property._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="bg-primary-foreground/5 rounded-xl p-6 border border-primary-foreground/10 hover:border-secondary/30 transition-all"
                >
                  <h3 className="font-heading text-lg text-primary-foreground font-semibold mb-2">
                    {property.propertyName}
                  </h3>
                  <p className="font-paragraph text-sm text-primary-foreground/60 mb-4">
                    {property.address}
                  </p>

                  {property.keyQrCodeUrl ? (
                    <div className="bg-foreground p-4 rounded-lg mb-4">
                      <Image
                        src={property.keyQrCodeUrl}
                        alt={`QR Code - ${property.propertyName}`}
                        className="w-full h-auto"
                        width={200}
                      />
                    </div>
                  ) : (
                    <div className="bg-primary-foreground/10 rounded-lg p-8 mb-4 flex flex-col items-center justify-center">
                      <QrCode className="w-12 h-12 text-primary-foreground/30 mb-2" />
                      <p className="font-paragraph text-sm text-primary-foreground/60 text-center">
                        QR Code não cadastrado
                      </p>
                    </div>
                  )}

                  <Link to="/admin/imoveis">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                    >
                      Editar Imóvel
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Info Section */}
      <section className="w-full bg-primary-foreground/5 py-12 border-t border-primary-foreground/10">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-brandaccent/20 to-secondary/10 rounded-2xl p-8 border border-secondary/20">
            <h2 className="font-heading text-2xl text-secondary mb-4 font-semibold">
              Como Funciona o Sistema de Chaves
            </h2>
            <p className="font-paragraph text-base text-primary-foreground/80 leading-relaxed mb-4">
              O sistema de QR Code permite o controle digital das chaves dos imóveis. Cada imóvel pode ter um QR Code único associado, facilitando o rastreamento e a gestão de retiradas e devoluções.
            </p>
            <p className="font-paragraph text-base text-primary-foreground/80 leading-relaxed">
              Para adicionar ou atualizar o QR Code de um imóvel, acesse a página de Gestão de Imóveis e edite o campo "URL do QR Code da Chave".
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function AdminChavesPage() {
  return (
    <MemberProtectedRoute messageToSignIn="Faça login para gerenciar chaves">
      <AdminChavesContent />
    </MemberProtectedRoute>
  );
}
