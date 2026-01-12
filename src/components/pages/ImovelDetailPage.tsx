import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, MapPin, Bed, Bath, Maximize, ArrowLeft, Calculator, Phone, CheckCircle, Zap, Shield, Sofa } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
      <div className="min-h-screen bg-primary">
        <Header />
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-20">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-primary-foreground/5 rounded-2xl"></div>
            <div className="h-64 bg-primary-foreground/5 rounded-2xl"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-primary">
        <Header />
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-20 text-center">
          <Home className="w-16 h-16 text-primary-foreground/30 mx-auto mb-4" />
          <h2 className="font-heading text-3xl text-primary-foreground mb-4">
            Imóvel não encontrado
          </h2>
          <Link to="/imoveis">
            <Button className="bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90 font-paragraph font-semibold h-12 px-6 rounded-lg">
              Voltar para Imóveis
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      <Header />

      {/* Back Button */}
      <section className="w-full py-6 border-b border-primary-foreground/10">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <Link to="/imoveis">
            <Button
              variant="ghost"
              className="text-primary-foreground hover:text-secondary hover:bg-primary-foreground/5 font-paragraph"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar para Imóveis
            </Button>
          </Link>
        </div>
      </section>

      {/* Property Details */}
      <section className="w-full py-12">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Image */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative h-96 lg:h-[500px] bg-primary-foreground/10 rounded-2xl overflow-hidden"
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
                    <Home className="w-24 h-24 text-primary-foreground/30" />
                  </div>
                )}
                {property.status && (
                  <div className="absolute top-6 right-6">
                    <span className={`font-paragraph text-sm px-4 py-2 rounded-lg font-semibold ${
                      property.status === 'Disponível'
                        ? 'bg-secondary text-secondary-foreground'
                        : property.status === 'Reservado'
                        ? 'bg-dark-gray text-white'
                        : 'bg-destructive text-destructiveforeground'
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
                    <span className="font-paragraph text-sm text-primary-foreground/60 bg-primary-foreground/10 px-3 py-1 rounded-lg">
                      {property.propertyType}
                    </span>
                    <span className="font-paragraph text-sm text-primary-foreground/60 bg-primary-foreground/10 px-3 py-1 rounded-lg">
                      {property.transactionType}
                    </span>
                  </div>
                  <h1 className="font-heading text-4xl lg:text-5xl text-secondary mb-4">
                    {property.propertyName}
                  </h1>
                  <div className="flex items-start gap-2 text-primary-foreground/70">
                    <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                    <span className="font-paragraph text-lg">{property.address}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-3 gap-6 py-8 border-y border-primary-foreground/10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center">
                      <Bed className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="font-paragraph text-sm text-primary-foreground/60">Quartos</p>
                      <p className="font-heading text-xl text-primary-foreground font-semibold">
                        {property.bedrooms}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center">
                      <Bath className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="font-paragraph text-sm text-primary-foreground/60">Banheiros</p>
                      <p className="font-heading text-xl text-primary-foreground font-semibold">
                        {property.bathrooms}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center">
                      <Maximize className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="font-paragraph text-sm text-primary-foreground/60">Área</p>
                      <p className="font-heading text-xl text-primary-foreground font-semibold">
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
                  <p className="font-paragraph text-base text-primary-foreground/80 leading-relaxed whitespace-pre-line">
                    {property.description || 'Descrição não disponível.'}
                  </p>
                </div>

                {/* Tabs for Additional Info */}
                <Tabs defaultValue="detalhes" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-primary-foreground/10">
                    <TabsTrigger value="detalhes" className="font-paragraph">Detalhes</TabsTrigger>
                    <TabsTrigger value="amenidades" className="font-paragraph">Amenidades</TabsTrigger>
                    <TabsTrigger value="financeiro" className="font-paragraph">Financeiro</TabsTrigger>
                  </TabsList>

                  {/* Detalhes Tab */}
                  <TabsContent value="detalhes" className="space-y-6 mt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {property.areaUtil && (
                        <div className="bg-primary-foreground/5 rounded-lg p-4 border border-primary-foreground/10">
                          <p className="font-paragraph text-sm text-primary-foreground/60 mb-1">Área Útil</p>
                          <p className="font-heading text-xl text-primary-foreground font-semibold">{property.areaUtil}m²</p>
                        </div>
                      )}
                      {property.suites && (
                        <div className="bg-primary-foreground/5 rounded-lg p-4 border border-primary-foreground/10">
                          <p className="font-paragraph text-sm text-primary-foreground/60 mb-1">Suítes</p>
                          <p className="font-heading text-xl text-primary-foreground font-semibold">{property.suites}</p>
                        </div>
                      )}
                      {property.andar && (
                        <div className="bg-primary-foreground/5 rounded-lg p-4 border border-primary-foreground/10">
                          <p className="font-paragraph text-sm text-primary-foreground/60 mb-1">Andar</p>
                          <p className="font-heading text-xl text-primary-foreground font-semibold">{property.andar}</p>
                        </div>
                      )}
                      {property.numeroPavimentos && (
                        <div className="bg-primary-foreground/5 rounded-lg p-4 border border-primary-foreground/10">
                          <p className="font-paragraph text-sm text-primary-foreground/60 mb-1">Pavimentos</p>
                          <p className="font-heading text-xl text-primary-foreground font-semibold">{property.numeroPavimentos}</p>
                        </div>
                      )}
                      {property.posicaoSol && (
                        <div className="bg-primary-foreground/5 rounded-lg p-4 border border-primary-foreground/10">
                          <p className="font-paragraph text-sm text-primary-foreground/60 mb-1">Posição do Sol</p>
                          <p className="font-heading text-xl text-primary-foreground font-semibold">{property.posicaoSol}</p>
                        </div>
                      )}
                    </div>

                    {property.resumoImovel && (
                      <div className="bg-primary-foreground/5 rounded-lg p-4 border border-primary-foreground/10">
                        <p className="font-paragraph text-sm text-primary-foreground/60 mb-2">Resumo</p>
                        <p className="font-paragraph text-base text-primary-foreground/80">{property.resumoImovel}</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Amenidades Tab */}
                  <TabsContent value="amenidades" className="space-y-6 mt-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      {property.piscina && (
                        <div className="flex items-center gap-3 bg-secondary/10 rounded-lg p-4 border border-secondary/20">
                          <Sofa className="w-5 h-5 text-secondary flex-shrink-0" />
                          <span className="font-paragraph text-primary-foreground">Piscina</span>
                        </div>
                      )}
                      {property.academia && (
                        <div className="flex items-center gap-3 bg-secondary/10 rounded-lg p-4 border border-secondary/20">
                          <Zap className="w-5 h-5 text-secondary flex-shrink-0" />
                          <span className="font-paragraph text-primary-foreground">Academia</span>
                        </div>
                      )}
                      {property.elevador && (
                        <div className="flex items-center gap-3 bg-secondary/10 rounded-lg p-4 border border-secondary/20">
                          <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0" />
                          <span className="font-paragraph text-primary-foreground">Elevador</span>
                        </div>
                      )}
                      {property.seguranca24h && (
                        <div className="flex items-center gap-3 bg-secondary/10 rounded-lg p-4 border border-secondary/20">
                          <Shield className="w-5 h-5 text-secondary flex-shrink-0" />
                          <span className="font-paragraph text-primary-foreground">Segurança 24h</span>
                        </div>
                      )}
                      {property.acessibilidade && (
                        <div className="flex items-center gap-3 bg-secondary/10 rounded-lg p-4 border border-secondary/20">
                          <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0" />
                          <span className="font-paragraph text-primary-foreground">Acessibilidade (PCD)</span>
                        </div>
                      )}
                      {property.churrasqueira && (
                        <div className="flex items-center gap-3 bg-secondary/10 rounded-lg p-4 border border-secondary/20">
                          <Sofa className="w-5 h-5 text-secondary flex-shrink-0" />
                          <span className="font-paragraph text-primary-foreground">Churrasqueira</span>
                        </div>
                      )}
                      {property.playground && (
                        <div className="flex items-center gap-3 bg-secondary/10 rounded-lg p-4 border border-secondary/20">
                          <Sofa className="w-5 h-5 text-secondary flex-shrink-0" />
                          <span className="font-paragraph text-primary-foreground">Playground</span>
                        </div>
                      )}
                      {property.sacadaVaranda && (
                        <div className="flex items-center gap-3 bg-secondary/10 rounded-lg p-4 border border-secondary/20">
                          <Sofa className="w-5 h-5 text-secondary flex-shrink-0" />
                          <span className="font-paragraph text-primary-foreground">Sacada/Varanda</span>
                        </div>
                      )}
                      {property.armariosPlanejados && (
                        <div className="flex items-center gap-3 bg-secondary/10 rounded-lg p-4 border border-secondary/20">
                          <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0" />
                          <span className="font-paragraph text-primary-foreground">Armários Planejados</span>
                        </div>
                      )}
                    </div>

                    {property.diferenciais && (
                      <div className="bg-primary-foreground/5 rounded-lg p-4 border border-primary-foreground/10">
                        <p className="font-paragraph text-sm text-primary-foreground/60 mb-2">Diferenciais</p>
                        <p className="font-paragraph text-base text-primary-foreground/80">{property.diferenciais}</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Financeiro Tab */}
                  <TabsContent value="financeiro" className="space-y-6 mt-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      {property.precoVenda && (
                        <div className="bg-primary-foreground/5 rounded-lg p-4 border border-primary-foreground/10">
                          <p className="font-paragraph text-sm text-primary-foreground/60 mb-1">Preço de Venda</p>
                          <p className="font-heading text-xl text-secondary font-semibold">R$ {property.precoVenda.toLocaleString('pt-BR')}</p>
                        </div>
                      )}
                      {property.precoLocacao && (
                        <div className="bg-primary-foreground/5 rounded-lg p-4 border border-primary-foreground/10">
                          <p className="font-paragraph text-sm text-primary-foreground/60 mb-1">Preço de Locação</p>
                          <p className="font-heading text-xl text-secondary font-semibold">R$ {property.precoLocacao.toLocaleString('pt-BR')}</p>
                        </div>
                      )}
                      {property.valorCondominio && (
                        <div className="bg-primary-foreground/5 rounded-lg p-4 border border-primary-foreground/10">
                          <p className="font-paragraph text-sm text-primary-foreground/60 mb-1">Condomínio</p>
                          <p className="font-heading text-xl text-primary-foreground font-semibold">R$ {property.valorCondominio.toLocaleString('pt-BR')}</p>
                        </div>
                      )}
                      {property.iptuAnual && (
                        <div className="bg-primary-foreground/5 rounded-lg p-4 border border-primary-foreground/10">
                          <p className="font-paragraph text-sm text-primary-foreground/60 mb-1">IPTU Anual</p>
                          <p className="font-heading text-xl text-primary-foreground font-semibold">R$ {property.iptuAnual.toLocaleString('pt-BR')}</p>
                        </div>
                      )}
                      {property.valorSinal && (
                        <div className="bg-primary-foreground/5 rounded-lg p-4 border border-primary-foreground/10">
                          <p className="font-paragraph text-sm text-primary-foreground/60 mb-1">Valor Sinal</p>
                          <p className="font-heading text-xl text-primary-foreground font-semibold">R$ {property.valorSinal.toLocaleString('pt-BR')}</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-primary-foreground/5 rounded-lg p-6 border border-primary-foreground/10">
                      <h3 className="font-heading text-lg text-secondary mb-4 font-semibold">Opções de Financiamento</h3>
                      <div className="space-y-3">
                        {property.permiteFinanciamento && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-secondary" />
                            <span className="font-paragraph text-primary-foreground">Permite Financiamento</span>
                          </div>
                        )}
                        {property.aceitaFgts && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-secondary" />
                            <span className="font-paragraph text-primary-foreground">Aceita FGTS</span>
                          </div>
                        )}
                        {property.aceitaFinanciamentoCaixa && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-secondary" />
                            <span className="font-paragraph text-primary-foreground">Financiamento Caixa Disponível</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
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
                <div className="bg-primary-foreground/5 rounded-2xl p-8 border border-primary-foreground/10">
                  <p className="font-paragraph text-sm text-primary-foreground/60 mb-2">
                    Valor do Imóvel
                  </p>
                  <p className="font-heading text-4xl text-secondary font-bold mb-6">
                    {property.price
                      ? `R$ ${property.price.toLocaleString('pt-BR')}`
                      : 'Consulte'}
                  </p>

                  <div className="space-y-3">
                    <Link to="/simulador" className="block">
                      <Button className="w-full bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90 font-paragraph font-semibold h-12 rounded-lg">
                        <Calculator className="w-5 h-5 mr-2" />
                        Simular Financiamento
                      </Button>
                    </Link>
                    <Link to="/contato" className="block">
                      <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-paragraph font-semibold h-12 rounded-lg">
                        <Phone className="w-5 h-5 mr-2" />
                        Entrar em Contato
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Mídia */}
                <div className="space-y-6">
                  {property.galeriaFotos && (
                    <div className="bg-primary-foreground/5 rounded-2xl p-8 border border-primary-foreground/10">
                      <h3 className="font-heading text-lg text-primary-foreground mb-4 font-semibold">
                        Galeria de Fotos
                      </h3>
                      <div className="bg-foreground p-4 rounded-lg">
                        <Image
                          src={property.galeriaFotos}
                          alt="Galeria"
                          className="w-full h-auto rounded-lg"
                          width={400}
                        />
                      </div>
                    </div>
                  )}

                  {property.plantaBaixa && (
                    <div className="bg-primary-foreground/5 rounded-2xl p-8 border border-primary-foreground/10">
                      <h3 className="font-heading text-lg text-primary-foreground mb-4 font-semibold">
                        Planta Baixa
                      </h3>
                      <div className="bg-foreground p-4 rounded-lg">
                        <Image
                          src={property.plantaBaixa}
                          alt="Planta Baixa"
                          className="w-full h-auto rounded-lg"
                          width={400}
                        />
                      </div>
                    </div>
                  )}

                  {property.tourVirtual && (
                    <div className="bg-primary-foreground/5 rounded-2xl p-8 border border-primary-foreground/10">
                      <h3 className="font-heading text-lg text-primary-foreground mb-4 font-semibold">
                        Tour Virtual
                      </h3>
                      <a
                        href={property.tourVirtual}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block"
                      >
                        <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-paragraph font-semibold h-12 px-6 rounded-lg">
                          Acessar Tour Virtual
                        </Button>
                      </a>
                    </div>
                  )}

                  {property.keyQrCodeUrl && (
                    <div className="bg-primary-foreground/5 rounded-2xl p-8 border border-primary-foreground/10">
                      <h3 className="font-heading text-lg text-primary-foreground mb-4 font-semibold">
                        QR Code da Chave
                      </h3>
                      <div className="bg-foreground p-4 rounded-lg">
                        <Image
                          src={property.keyQrCodeUrl}
                          alt="QR Code"
                          className="w-full h-auto"
                          width={200}
                        />
                      </div>
                      <p className="font-paragraph text-sm text-primary-foreground/60 mt-4">
                        Use este QR Code para acessar informações sobre a chave do imóvel
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
