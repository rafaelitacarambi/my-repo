import React, { useState, useEffect, useMemo } from 'react';
import { Home, Search, MapPin, BedDouble, Images, FilterX } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { Imveis } from '@/entities';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Image } from '@/components/ui/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function AdminFastSearchPage() {
    const [properties, setProperties] = useState<Imveis[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [transactionType, setTransactionType] = useState('all');
    const [propertyType, setPropertyType] = useState('all');
    const [minBedrooms, setMinBedrooms] = useState('0');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                // Fetch up to 1000 properties for quick client-side filtering 
                // Alternatively this could be paginated server-side for heavy databases
                const res = await BaseCrudService.getAll<Imveis>('imoveis', undefined, { limit: 1000 });
                let items = (res as any).items || (res as any).data || (Array.isArray(res) ? res : []);

                // Keep only active properties for broker showing
                items = items.filter((p: any) => p.statusImovel === 'Ativo' || p.statusImovel === 'Disponível');

                // Sort by descending price
                items.sort((a: any, b: any) => {
                    const priceA = a.precoVenda || a.precoLocacao || a.price || 0;
                    const priceB = b.precoVenda || b.precoLocacao || b.price || 0;
                    return priceB - priceA;
                });

                setProperties(items);
            } catch (error) {
                console.error("Error loading fast search properties:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProperties();
    }, []);

    const filteredProperties = useMemo(() => {
        return properties.filter(p => {
            // Text Search (City, Neighborhood, Code, Title)
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const matchName = (p.resumoImovel || p.propertyName || '').toLowerCase().includes(term);
                const matchCity = (p.cidade || '').toLowerCase().includes(term);
                const matchBairro = (p.bairro || p.address || '').toLowerCase().includes(term);
                const matchCode = (p.codigoReference || p.codImovel || '').toLowerCase().includes(term);

                if (!matchName && !matchCity && !matchBairro && !matchCode) return false;
            }

            // Transaction Type
            if (transactionType !== 'all') {
                const pretensao = (p.pretensao || p.transactionType || '').toLowerCase();
                if (!pretensao.includes(transactionType.toLowerCase())) return false;
            }

            // Property Type
            if (propertyType !== 'all') {
                const type = (p.tipoImovel || p.propertyType || '').toLowerCase();
                if (!type.includes(propertyType.toLowerCase())) return false;
            }

            // Bedrooms
            if (minBedrooms !== '0') {
                const beds = parseInt(String(p.dormitorios || p.quartos || p.bedrooms || 0), 10);
                if (beds < parseInt(minBedrooms, 10)) return false;
            }

            // Price bounds
            const activePrice = parseInt(String(p.precoVenda || p.precoLocacao || p.price || 0), 10);
            if (minPrice && activePrice < parseInt(minPrice.replace(/\D/g, ''), 10)) return false;
            if (maxPrice && activePrice > parseInt(maxPrice.replace(/\D/g, ''), 10)) return false;

            return true;
        });
    }, [properties, searchTerm, transactionType, propertyType, minBedrooms, minPrice, maxPrice]);

    const formatBRL = (val: string) => {
        const num = parseInt(val.replace(/\D/g, ''), 10);
        if (isNaN(num)) return '';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setTransactionType('all');
        setPropertyType('all');
        setMinBedrooms('0');
        setMinPrice('');
        setMaxPrice('');
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Header / Config Bar */}
            <div className="sticky top-0 z-20 bg-white border-b shadow-sm p-4 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative w-full md:flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            placeholder="Buscar por bairro, cidade, código ou título..."
                            className="pl-10 h-12 w-full text-base"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 md:grid md:grid-cols-5 md:gap-4">
                    <Select value={transactionType} onValueChange={setTransactionType}>
                        <SelectTrigger className="w-full h-10 bg-white">
                            <SelectValue placeholder="Finalidade" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Venda e Locação</SelectItem>
                            <SelectItem value="Venda">Venda</SelectItem>
                            <SelectItem value="Locação">Locação</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={propertyType} onValueChange={setPropertyType}>
                        <SelectTrigger className="w-full h-10 bg-white">
                            <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Tipos</SelectItem>
                            <SelectItem value="Casa">Casa</SelectItem>
                            <SelectItem value="Apartamento">Apartamento</SelectItem>
                            <SelectItem value="Terreno">Terreno</SelectItem>
                            <SelectItem value="Comercial">Comercial</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={minBedrooms} onValueChange={setMinBedrooms}>
                        <SelectTrigger className="w-full h-10 bg-white">
                            <SelectValue placeholder="Dormitórios" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">Qualquer</SelectItem>
                            <SelectItem value="1">1+ Dormitório</SelectItem>
                            <SelectItem value="2">2+ Dormitórios</SelectItem>
                            <SelectItem value="3">3+ Dormitórios</SelectItem>
                            <SelectItem value="4">4+ Dormitórios</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex gap-2 w-full col-span-2 md:col-span-2">
                        <Input
                            placeholder="R$ Mínimo"
                            className="h-10 text-sm"
                            value={formatBRL(minPrice)}
                            onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ''))}
                        />
                        <Input
                            placeholder="R$ Máximo"
                            className="h-10 text-sm"
                            value={formatBRL(maxPrice)}
                            onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ''))}
                        />
                        <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpar Filtros" className="h-10 w-10 shrink-0">
                            <FilterX className="w-4 h-4 text-gray-500" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Results Grid */}
            <ScrollArea className="flex-1 p-4 md:p-6">
                {loading ? (
                    <div className="flex items-center justify-center p-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
                    </div>
                ) : filteredProperties.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed mx-auto max-w-lg">
                        <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-700">Nenhum imóvel encontrado</h3>
                        <p className="text-gray-500 mt-1">Ajuste os filtros de busca para ver mais resultados.</p>
                        <Button variant="outline" className="mt-4" onClick={clearFilters}>Limpar Filtros</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-20">
                        <AnimatePresence>
                            {filteredProperties.map((p, idx) => (
                                <motion.div
                                    key={p._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2, delay: Math.min(idx * 0.05, 0.3) }}
                                >
                                    <Link to={`/admin/imoveis/${p._id}`}>
                                        <Card className="h-full overflow-hidden hover:shadow-lg transition-all group flex flex-col border-slate-200">
                                            {/* Photo Header */}
                                            <div className="relative h-48 sm:h-56 bg-gradient-to-tr from-slate-200 to-slate-100 overflow-hidden">
                                                {p.propertyImages || (p.galeriaFotos && p.galeriaFotos.length > 0) || p.mainImage ? (
                                                    <Image
                                                        src={p.mainImage || (Array.isArray(p.propertyImages) ? p.propertyImages[0] : p.propertyImages) || (p.galeriaFotos && p.galeriaFotos[0]) || ''}
                                                        alt="Imóvel"
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                                        <Images className="w-10 h-10 opacity-50" />
                                                        <span className="text-xs font-medium">Sem foto principal</span>
                                                    </div>
                                                )}

                                                {/* Code Badge */}
                                                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-mono shadow-sm">
                                                    #{p.codigoReference || p.codImovel || 'N/A'}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <CardContent className="p-4 flex flex-col flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="text-xs font-semibold uppercase tracking-wider text-primary/80 bg-primary/10 px-2 py-1 rounded">
                                                        {p.tipoImovel || p.propertyType || 'Imóvel'}
                                                    </div>
                                                </div>

                                                <h4 className="font-semibold text-gray-800 line-clamp-1 mb-1 text-sm md:text-base">
                                                    {p.resumoImovel || p.propertyName || 'Imóvel sem título'}
                                                </h4>

                                                <div className="flex items-center text-gray-500 text-xs md:text-sm mb-3">
                                                    <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
                                                    <span className="line-clamp-1">{p.bairro || p.address || 'Localização não informada'} {p.cidade ? `- ${p.cidade}` : ''}</span>
                                                </div>

                                                <div className="flex items-center gap-4 text-xs md:text-sm text-gray-600 mb-4 bg-slate-50 p-2 rounded-lg border">
                                                    <div className="flex items-center gap-1.5" title="Dormitórios">
                                                        <BedDouble className="w-4 h-4 text-indigo-500/70" />
                                                        <span className="font-medium">{p.dormitorios || p.quartos || p.bedrooms || 0}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5" title="Vagas">
                                                        <span>🚗</span>
                                                        <span className="font-medium">{p.vagasCobertas || p.vagas || p.garages || 0}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5" title="Área Útil">
                                                        <span>📐</span>
                                                        <span className="font-medium">{p.areaUtil || p.area || p.areaConstruida || 0}m²</span>
                                                    </div>
                                                </div>

                                                <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-end">
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-0.5">{(p.pretensao || p.transactionType || 'Venda').toUpperCase()}</p>
                                                        <p className="text-lg md:text-xl font-bold tracking-tight text-gray-900">
                                                            {formatBRL(String(p.precoVenda || p.precoLocacao || p.price || 0))}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
