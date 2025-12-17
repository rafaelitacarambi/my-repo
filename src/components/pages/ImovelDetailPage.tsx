import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, MapPin, Bed, Bath, Maximize, ArrowLeft, Calculator, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BaseCrudService } from '@/integrations';
import { Imveis } from '@/entities';

export default function ImovelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Imveis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProperty = async () => {
      if (!id) return;
      
      try {
        const item = await BaseCrudService.getById<Imveis>('imoveis', id);
        setProperty(item);
      } catch (error) {
        console.error('Error loading property:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProperty();
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

  if (!property) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-[100rem] mx-auto px-6 lg:px-12 py-20 text-center">
          <Home className="w-16 h-16 text-medium-gray mx-auto mb-4" />
          <h2 className="font-heading text-3xl text-secondary mb-4 font-bold">
            Imóvel não encontrado
          </h2>
          <Link to="/imoveis">
            <Button className="bg-secondary text-foreground hover:bg-black font-paragraph font-semibold h-12 px-6 rounded-none">
              Voltar para Imóveis
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
          <Link to="/imoveis">
            <Button
              variant="ghost"
              className="text-dark-gray hover:text-secondary hover:bg-ice-gray font-paragraph rounded-none"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar para Imóveis
            </Button>
          </Link>
        </div>
      </section>

      {/* Property Details */}
      <section className="w-full py-12">
        <div className="max-w-[100rem] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Image */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative h-96 lg:h-[500px] bg-ice-gray rounded-none overflow-hidden border border-matte-silver"
              >
                {property.propertyImages ? (
                  <Image
                    src={property.propertyImages}
                    alt={property.propertyName || 'Imóvel'}
                    className="w-full h-full object-cover"
                    width={800}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="w-24 h-24 text-medium-gray" />
                  </div>
                )}
                {property.status && (
                  <div className="absolute top-6 right-6">
                    <span className={`font-paragraph text-sm px-4 py-2 rounded-none font-semibold ${
                      property.status === 'Disponível'
                        ? 'bg-secondary text-foreground'
                        : property.status === 'Reservado'
                        ? 'bg-medium-gray text-foreground'
                        : 'bg-matte-silver text-secondary'
                    }`}>
                      {property.status}
                    </span>
                  </div>
                )}
              </motion.div>

              {/* Property Info */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-paragraph text-sm text-dark-gray bg-ice-gray px-3 py-1 rounded-none">
                      {property.propertyType}
                    </span>
                    <span className="font-paragraph text-sm text-dark-gray bg-ice-gray px-3 py-1 rounded-none">
                      {property.transactionType}
                    </span>
                  </div>
                  <h1 className="font-heading text-4xl lg:text-5xl text-secondary mb-4 font-bold">
                    {property.propertyName}
                  </h1>
                  <div className="flex items-start gap-2 text-dark-gray">
                    <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                    <span className="font-paragraph text-lg">{property.address}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-3 gap-6 py-8 border-y border-matte-silver">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-ice-gray rounded-none flex items-center justify-center">
                      <Bed className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="font-paragraph text-sm text-dark-gray">Quartos</p>
                      <p className="font-heading text-xl text-secondary font-semibold">
                        {property.bedrooms}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-ice-gray rounded-none flex items-center justify-center">
                      <Bath className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="font-paragraph text-sm text-dark-gray">Banheiros</p>
                      <p className="font-heading text-xl text-secondary font-semibold">
                        {property.bathrooms}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-ice-gray rounded-none flex items-center justify-center">
                      <Maximize className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="font-paragraph text-sm text-dark-gray">Área</p>
                      <p className="font-heading text-xl text-secondary font-semibold">
                        {property.area}m²
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h2 className="font-heading text-2xl text-secondary mb-4 font-semibold">
                    Sobre o Imóvel
                  </h2>
                  <p className="font-paragraph text-base text-dark-gray leading-relaxed whitespace-pre-line">
                    {property.description || 'Descrição não disponível.'}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="sticky top-24 space-y-6"
              >
                {/* Price Card */}
                <div className="bg-ice-gray rounded-none p-8 border border-matte-silver">
                  <p className="font-paragraph text-sm text-dark-gray mb-2">
                    Valor do Imóvel
                  </p>
                  <p className="font-heading text-4xl text-secondary font-bold mb-6">
                    {property.price
                      ? `R$ ${property.price.toLocaleString('pt-BR')}`
                      : 'Consulte'}
                  </p>

                  <div className="space-y-3">
                    <Link to="/simulador" className="block">
                      <Button className="w-full bg-secondary text-foreground hover:bg-black font-paragraph font-semibold h-12 rounded-none">
                        <Calculator className="w-5 h-5 mr-2" />
                        Simular Financiamento
                      </Button>
                    </Link>
                    <Link to="/contato" className="block">
                      <Button className="w-full bg-white text-secondary hover:bg-ice-gray font-paragraph font-semibold h-12 rounded-none border border-matte-silver">
                        <Phone className="w-5 h-5 mr-2" />
                        Entrar em Contato
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* QR Code */}
                {property.keyQrCodeUrl && (
                  <div className="bg-ice-gray rounded-none p-8 border border-matte-silver">
                    <h3 className="font-heading text-lg text-secondary mb-4 font-semibold">
                      QR Code da Chave
                    </h3>
                    <div className="bg-foreground p-4 rounded-none">
                      <Image
                        src={property.keyQrCodeUrl}
                        alt="QR Code"
                        className="w-full h-auto"
                        width={200}
                      />
                    </div>
                    <p className="font-paragraph text-sm text-dark-gray mt-4">
                      Use este QR Code para acessar informações sobre a chave do imóvel
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
