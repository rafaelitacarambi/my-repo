import { listingFields, listingPrice, matchesTransaction } from '@/lib/property-listing';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BaseCrudService } from '@/integrations';
import { Imveis } from '@/entities';

const SEGMENTOS = [
  { id: 'minha-casa', label: 'Minha Casa Minha Vida', icon: '🏠' },
  { id: 'usados', label: 'Usados (Oportunidades)', icon: '💎' },
  { id: 'terrenos', label: 'Terrenos', icon: '🌳' },
  { id: 'areas', label: 'Áreas', icon: '📐' },
  { id: 'leilao-caixa', label: 'Leilão Caixa', icon: '🏛️' },
  { id: 'alto-padrao', label: 'Alto Padrão', icon: '✨' },
];

const SEGMENTO_MAP: Record<string, string> = {
  'minha-casa': 'Minha Casa Minha Vida',
  'usados': 'Usados (Oportunidades)',
  'terrenos': 'Terrenos',
  'areas': 'Áreas',
  'leilao-caixa': 'Leilão Caixa',
  'alto-padrao': 'Alto Padrão',
};

export default function ImoveisPage() {
  const [properties, setProperties] = useState<Imveis[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Imveis[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [segmentoFilter, setSegmentoFilter] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Advanced filters
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [bedroomsMin, setBedroomsMin] = useState('');
  const [areaMin, setAreaMin] = useState('');
  const [amenitiesFilter, setAmenitiesFilter] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const loadProperties = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const { items } = await BaseCrudService.getAll<Imveis>('imoveis', undefined, { limit: 1000 });

        // Sort by date (newest first)
        const sortedItems = items.map(listingFields).sort((a, b) => {
          const dateA = a._createdDate ? new Date(a._createdDate).getTime() : 0;
          const dateB = b._createdDate ? new Date(b._createdDate).getTime() : 0;
          return dateB - dateA;
        });

        if (!active) return;
        setProperties(sortedItems);
        setFilteredProperties(sortedItems);
      } catch (error) {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProperties();
    return () => { active = false; };
  }, [loadAttempt]);

  useEffect(() => {
    let filtered = properties;

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          (p.resumoImovel || p.propertyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.address || p.logradouro || p.bairro || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Hard filter: Only Active properties
    filtered = filtered.filter(p => p.statusImovel === 'Ativo');

    if (typeFilter !== 'all') {
      filtered = filtered.filter((p) => p.propertyType === typeFilter);
    }

    if (transactionFilter !== 'all') {
      filtered = filtered.filter((p) => matchesTransaction(p.transactionType, transactionFilter));
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    if (segmentoFilter) {
      const segmentoLabel = SEGMENTO_MAP[segmentoFilter];
      filtered = filtered.filter((p) =>
        p.segmentoCompra?.includes(segmentoLabel)
      );
    }

    // Advanced filters (AND logic)
    if (priceMin) {
      filtered = filtered.filter((p) => listingPrice(p, transactionFilter) >= parseFloat(priceMin));
    }

    if (priceMax) {
      filtered = filtered.filter((p) => listingPrice(p, transactionFilter) <= parseFloat(priceMax));
    }

    if (bedroomsMin) {
      filtered = filtered.filter((p) => (p.bedrooms || 0) >= parseFloat(bedroomsMin));
    }

    if (areaMin) {
      filtered = filtered.filter((p) => (p.area || 0) >= parseFloat(areaMin));
    }

    // Amenities filter (AND logic - must have ALL selected amenities)
    if (amenitiesFilter.length > 0) {
      filtered = filtered.filter((p) => {
        return amenitiesFilter.every((amenity) => {
          switch (amenity) {
            case 'piscina':
              return p.piscina;
            case 'academia':
              return p.academia;
            case 'elevador':
              return p.elevador;
            case 'seguranca24h':
              return p.seguranca24h;
            case 'acessibilidade':
              return p.acessibilidade;
            case 'churrasqueira':
              return p.churrasqueira;
            case 'playground':
              return p.playground;
            case 'sacadaVaranda':
              return p.sacadaVaranda;
            default:
              return true;
          }
        });
      });
    }

    setFilteredProperties(filtered);
  }, [searchTerm, typeFilter, transactionFilter, statusFilter, segmentoFilter, properties, priceMin, priceMax, bedroomsMin, areaMin, amenitiesFilter]);

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
            <h1 className="font-heading text-5xl lg:text-6xl text-secondary mb-6">
              Encontre Seu Imóvel Ideal
            </h1>
            <p className="font-paragraph text-lg text-dark-gray max-w-2xl mx-auto">
              Explore nossa seleção completa de imóveis disponíveis para venda e locação
            </p>
          </motion.div>
        </div>
      </section>

      {/* Segmentos Section */}
      <section className="w-full py-12 bg-light-gray/30">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <div className="mb-8">
            <h2 className="font-heading text-3xl text-secondary mb-2">Navegue por Tipo de Compra</h2>
            <p className="font-paragraph text-dark-gray">Selecione uma categoria para filtrar imóveis</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SEGMENTOS.map((segmento, index) => (
              <motion.button
                key={segmento.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                onClick={() => setSegmentoFilter(segmentoFilter === segmento.id ? null : segmento.id)}
                className={`p-6 rounded-2xl border-2 transition-all text-left group ${segmentoFilter === segmento.id
                  ? 'border-secondary bg-secondary/10'
                  : 'border-border-gray bg-primary hover:border-secondary/50'
                  }`}
              >
                <div className="text-4xl mb-3">{segmento.icon}</div>
                <h3 className="font-heading text-xl text-primary-foreground mb-2 group-hover:text-secondary transition-colors">
                  {segmento.label}
                </h3>
                <p className="font-paragraph text-sm text-dark-gray">
                  {segmentoFilter === segmento.id ? 'Filtro ativo' : 'Clique para filtrar'}
                </p>
              </motion.button>
            ))}
          </div>
          {segmentoFilter && (
            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => setSegmentoFilter(null)}
                variant="outline"
                className="border-secondary text-secondary hover:bg-secondary/10"
              >
                Limpar Filtro de Segmento
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Filters Section */}
      <section className="w-full bg-light-gray/50 py-8 border-b border-border-gray">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-gray" />
                <Input
                  type="text"
                  placeholder="Buscar por nome ou endereço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 bg-primary border-border-gray text-primary-foreground placeholder:text-dark-gray rounded-lg"
                />
              </div>
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-12 bg-primary border-border-gray text-primary-foreground rounded-lg">
                <SelectValue placeholder="Tipo de Imóvel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="Apartamento">Apartamento</SelectItem>
                <SelectItem value="Casa">Casa</SelectItem>
                <SelectItem value="Terreno">Terreno</SelectItem>
                <SelectItem value="Comercial">Comercial</SelectItem>
              </SelectContent>
            </Select>

            <Select value={transactionFilter} onValueChange={setTransactionFilter}>
              <SelectTrigger className="h-12 bg-primary border-border-gray text-primary-foreground rounded-lg">
                <SelectValue placeholder="Transação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Venda">Venda</SelectItem>
                <SelectItem value="Locação">Locação</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-12 bg-primary border-border-gray text-primary-foreground rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Disponível">Disponível</SelectItem>
                <SelectItem value="Reservado">Reservado</SelectItem>
                <SelectItem value="Vendido">Vendido</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              variant="outline"
              className="h-12 border-border-gray text-primary-foreground hover:bg-primary-foreground/5 rounded-lg col-span-1 md:col-span-2 lg:col-span-1"
            >
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              Filtros Avançados
              <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-border-gray space-y-6"
            >
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="font-paragraph text-sm text-primary-foreground/60 mb-2 block">
                    Preço Mínimo (R$)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="h-10 bg-primary border-border-gray text-primary-foreground rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-paragraph text-sm text-primary-foreground/60 mb-2 block">
                    Preço Máximo (R$)
                  </label>
                  <Input
                    type="number"
                    placeholder="Sem limite"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="h-10 bg-primary border-border-gray text-primary-foreground rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-paragraph text-sm text-primary-foreground/60 mb-2 block">
                    Quartos Mínimos
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={bedroomsMin}
                    onChange={(e) => setBedroomsMin(e.target.value)}
                    className="h-10 bg-primary border-border-gray text-primary-foreground rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-paragraph text-sm text-primary-foreground/60 mb-2 block">
                    Área Mínima (m²)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={areaMin}
                    onChange={(e) => setAreaMin(e.target.value)}
                    className="h-10 bg-primary border-border-gray text-primary-foreground rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-paragraph text-sm text-primary-foreground/60 mb-3 block">
                  Amenidades (selecione as desejadas)
                </label>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { id: 'piscina', label: 'Piscina' },
                    { id: 'academia', label: 'Academia' },
                    { id: 'elevador', label: 'Elevador' },
                    { id: 'seguranca24h', label: 'Segurança 24h' },
                    { id: 'acessibilidade', label: 'Acessibilidade' },
                    { id: 'churrasqueira', label: 'Churrasqueira' },
                    { id: 'playground', label: 'Playground' },
                    { id: 'sacadaVaranda', label: 'Sacada/Varanda' },
                  ].map((amenity) => (
                    <div key={amenity.id} className="flex items-center gap-2">
                      <Checkbox
                        id={amenity.id}
                        checked={amenitiesFilter.includes(amenity.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAmenitiesFilter([...amenitiesFilter, amenity.id]);
                          } else {
                            setAmenitiesFilter(amenitiesFilter.filter(a => a !== amenity.id));
                          }
                        }}
                        className="border-primary-foreground/30"
                      />
                      <label
                        htmlFor={amenity.id}
                        className="font-paragraph text-sm text-primary-foreground cursor-pointer"
                      >
                        {amenity.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {(priceMin || priceMax || bedroomsMin || areaMin || amenitiesFilter.length > 0) && (
                <Button
                  onClick={() => {
                    setPriceMin('');
                    setPriceMax('');
                    setBedroomsMin('');
                    setAreaMin('');
                    setAmenitiesFilter([]);
                  }}
                  variant="outline"
                  className="border-secondary/50 text-secondary hover:bg-secondary/10"
                >
                  Limpar Filtros Avançados
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* Properties Grid */}
      <section className="w-full py-12">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between mb-8">
            <p className="font-paragraph text-base text-dark-gray">
              {loading ? 'Carregando imóveis…' : loadError ? 'Consulta indisponível' : `${filteredProperties.length} ${filteredProperties.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}`}
            </p>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-light-gray rounded-2xl h-96 animate-pulse border border-border-gray"></div>
              ))}
            </div>
          ) : loadError ? (
            <div role="alert" className="text-center py-20 space-y-4">
              <h3 className="font-heading text-2xl">Não foi possível carregar os imóveis</h3>
              <p>Tente novamente em alguns instantes.</p>
              <Button onClick={() => setLoadAttempt(value => value + 1)}>Tentar novamente</Button>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-20">
              <Home className="w-16 h-16 text-primary-foreground/30 mx-auto mb-4" />
              <h3 className="font-heading text-2xl text-primary-foreground mb-2">
                Nenhum imóvel encontrado
              </h3>
              <p className="font-paragraph text-base text-dark-gray">
                Tente ajustar os filtros para ver mais resultados
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.map((property, index) => (
                <motion.div
                  key={property._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                >
                  <Link to={`/imoveis/${property._id}`}>
                    <div className="bg-light-gray rounded-2xl overflow-hidden border border-border-gray hover:border-secondary/30 transition-all group h-full">
                      <div className="relative h-64 bg-light-gray overflow-hidden">
                        {property.propertyImages || (property.galeriaFotos && property.galeriaFotos.length > 0) ? (
                          <Image
                            src={(Array.isArray(property.propertyImages) ? property.propertyImages[0] : property.propertyImages) || (property.galeriaFotos && property.galeriaFotos[0]) || ''}
                            alt={property.resumoImovel || property.propertyName || 'Imóvel'}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            width={400}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Home className="w-16 h-16 text-primary-foreground/30" />
                          </div>
                        )}
                        {(property.statusImovel || property.status) && (
                          <div className="absolute top-4 right-4">
                            <span className={`font-paragraph text-xs px-3 py-1 rounded-lg font-semibold ${(property.statusImovel || property.status) === 'Ativo' || (property.statusImovel || property.status) === 'Disponível'
                              ? 'bg-secondary text-secondary-foreground'
                              : (property.statusImovel || property.status) === 'Reservado'
                                ? 'bg-dark-gray text-white'
                                : 'bg-destructive text-destructive-foreground'
                              }`}>
                              {property.statusImovel || property.status}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-paragraph text-xs text-dark-gray bg-border-gray px-2 py-1 rounded">
                            {property.propertyType}
                          </span>
                          <span className="font-paragraph text-xs text-dark-gray bg-border-gray px-2 py-1 rounded">
                            {property.transactionType}
                          </span>
                        </div>
                        <h3 className="font-heading text-xl text-primary-foreground mb-2 font-semibold line-clamp-1">
                          {property.resumoImovel || property.propertyName || 'Imóvel sem título'}
                        </h3>
                        <p className="font-paragraph text-sm text-dark-gray mb-4 line-clamp-1">
                          {property.bairro || property.address || 'Bairro não informado'}
                        </p>
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-paragraph text-sm text-dark-gray">
                            {property.bedrooms || property.dormitorios || property.quartos || 0} quartos • {property.bathrooms || property.banheiros || 0} banheiros
                          </span>
                          <span className="font-paragraph text-sm text-dark-gray">
                            {property.area || property.areaUtil || property.areaTotal || property.areaConstruida || 0}m²
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-heading text-2xl text-secondary font-bold">
                            {listingPrice(property, transactionFilter)
                              ? `R$ ${listingPrice(property, transactionFilter).toLocaleString('pt-BR')}`
                              : 'Consulte'}
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

      <Footer />
    </div>
  );
}
