import { useEffect, useState } from 'react';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Building2, Plus, Edit, Trash2, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BaseCrudService } from '@/integrations';
import { Imveis } from '@/entities';

const SEGMENTOS = [
  'Minha Casa Minha Vida',
  'Usados (Oportunidades)',
  'Terrenos',
  'Áreas',
  'Leilão Caixa',
  'Alto Padrão'
];

function AdminImoveisContent() {
  const [properties, setProperties] = useState<Imveis[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Imveis | null>(null);
  const [formData, setFormData] = useState<Partial<Imveis>>(getInitialFormData());
  const [selectedSegmentos, setSelectedSegmentos] = useState<string[]>([]);

  function getInitialFormData(): Partial<Imveis> {
    return {
      propertyName: '',
      propertyType: 'Apartamento',
      transactionType: 'Venda',
      price: 0,
      address: '',
      bedrooms: 0,
      bathrooms: 0,
      area: 0,
      description: '',
      propertyImages: '',
      status: 'Disponível',
      keyQrCodeUrl: '',
      segmentoCompra: '',
      investimentoOportunidade: false,
    };
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dataToSave = {
        ...formData,
        segmentoCompra: selectedSegmentos.join(','),
      };

      if (editingProperty) {
        await BaseCrudService.update('imoveis', {
          _id: editingProperty._id,
          ...dataToSave,
        });
      } else {
        await BaseCrudService.create('imoveis', {
          _id: crypto.randomUUID(),
          ...dataToSave,
        });
      }

      setDialogOpen(false);
      setEditingProperty(null);
      resetForm();
      loadProperties();
    } catch (error) {
      console.error('Error saving property:', error);
    }
  };

  const handleEdit = (property: Imveis) => {
    setEditingProperty(property);
    setFormData({
      propertyName: property.propertyName,
      propertyType: property.propertyType,
      transactionType: property.transactionType,
      price: property.price,
      address: property.address,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      description: property.description,
      propertyImages: property.propertyImages,
      status: property.status,
      keyQrCodeUrl: property.keyQrCodeUrl,
      investimentoOportunidade: property.investimentoOportunidade,
    });
    const segmentos = property.segmentoCompra?.split(',').filter(s => s) || [];
    setSelectedSegmentos(segmentos);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este imóvel?')) return;

    try {
      await BaseCrudService.delete('imoveis', id);
      loadProperties();
    } catch (error) {
      console.error('Error deleting property:', error);
    }
  };

  const resetForm = () => {
    setFormData(getInitialFormData());
    setSelectedSegmentos([]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'price' || name === 'bedrooms' || name === 'bathrooms' || name === 'area'
        ? parseFloat(value) || 0
        : value,
    });
  };

  const toggleSegmento = (segmento: string) => {
    setSelectedSegmentos(prev =>
      prev.includes(segmento)
        ? prev.filter(s => s !== segmento)
        : [...prev, segmento]
    );
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

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="font-heading text-4xl lg:text-5xl text-secondary mb-4">
                Gestão de Imóveis
              </h1>
              <p className="font-paragraph text-lg text-primary-foreground/80">
                Cadastre e gerencie imóveis disponíveis
              </p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setEditingProperty(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90 font-paragraph font-semibold h-12 px-6 rounded-lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Novo Imóvel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-primary border-primary-foreground/20">
                <DialogHeader>
                  <DialogTitle className="font-heading text-2xl text-secondary">
                    {editingProperty ? 'Editar Imóvel' : 'Novo Imóvel'}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="propertyName" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                        Nome do Imóvel *
                      </Label>
                      <Input
                        id="propertyName"
                        name="propertyName"
                        required
                        value={formData.propertyName}
                        onChange={handleChange}
                        className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                      />
                    </div>

                    <div>
                      <Label htmlFor="propertyType" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                        Tipo *
                      </Label>
                      <Select
                        value={formData.propertyType}
                        onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                      >
                        <SelectTrigger className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Apartamento">Apartamento</SelectItem>
                          <SelectItem value="Casa">Casa</SelectItem>
                          <SelectItem value="Terreno">Terreno</SelectItem>
                          <SelectItem value="Comercial">Comercial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="transactionType" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                        Transação *
                      </Label>
                      <Select
                        value={formData.transactionType}
                        onValueChange={(value) => setFormData({ ...formData, transactionType: value })}
                      >
                        <SelectTrigger className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Venda">Venda</SelectItem>
                          <SelectItem value="Locação">Locação</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="price" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                        Preço (R$) *
                      </Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        required
                        value={formData.price}
                        onChange={handleChange}
                        className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bedrooms" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                        Quartos *
                      </Label>
                      <Input
                        id="bedrooms"
                        name="bedrooms"
                        type="number"
                        required
                        value={formData.bedrooms}
                        onChange={handleChange}
                        className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bathrooms" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                        Banheiros *
                      </Label>
                      <Input
                        id="bathrooms"
                        name="bathrooms"
                        type="number"
                        required
                        value={formData.bathrooms}
                        onChange={handleChange}
                        className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                      />
                    </div>

                    <div>
                      <Label htmlFor="area" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                        Área (m²) *
                      </Label>
                      <Input
                        id="area"
                        name="area"
                        type="number"
                        required
                        value={formData.area}
                        onChange={handleChange}
                        className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                      />
                    </div>

                    <div>
                      <Label htmlFor="status" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                        Status *
                      </Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Disponível">Disponível</SelectItem>
                          <SelectItem value="Reservado">Reservado</SelectItem>
                          <SelectItem value="Vendido">Vendido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                      Endereço *
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                      Descrição
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground resize-none"
                    />
                  </div>

                  <div>
                    <Label className="font-paragraph text-sm text-primary-foreground mb-3 block">
                      Segmentos de Compra
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {SEGMENTOS.map((segmento) => (
                        <div key={segmento} className="flex items-center gap-2">
                          <Checkbox
                            id={segmento}
                            checked={selectedSegmentos.includes(segmento)}
                            onCheckedChange={() => toggleSegmento(segmento)}
                            className="border-primary-foreground/30"
                          />
                          <Label
                            htmlFor={segmento}
                            className="font-paragraph text-sm text-primary-foreground cursor-pointer"
                          >
                            {segmento}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="investimentoOportunidade"
                      checked={formData.investimentoOportunidade || false}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, investimentoOportunidade: checked as boolean })
                      }
                      className="border-primary-foreground/30"
                    />
                    <Label
                      htmlFor="investimentoOportunidade"
                      className="font-paragraph text-sm text-primary-foreground cursor-pointer"
                    >
                      Marcar como Investimento/Oportunidade
                    </Label>
                  </div>

                  <div>
                    <Label htmlFor="propertyImages" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                      URL da Imagem
                    </Label>
                    <Input
                      id="propertyImages"
                      name="propertyImages"
                      type="url"
                      value={formData.propertyImages}
                      onChange={handleChange}
                      placeholder="https://static.wixstatic.com/media/9b23b4_a76dcf7c42ef462b8db93d40d0dae796~mv2.png?originWidth=896&originHeight=576"
                      className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                    />
                  </div>

                  <div>
                    <Label htmlFor="keyQrCodeUrl" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                      URL do QR Code da Chave
                    </Label>
                    <Input
                      id="keyQrCodeUrl"
                      name="keyQrCodeUrl"
                      type="url"
                      value={formData.keyQrCodeUrl}
                      onChange={handleChange}
                      placeholder="https://static.wixstatic.com/media/9b23b4_875dcfda084644b7b6ed0542d72a60cf~mv2.png?originWidth=896&originHeight=576"
                      className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      className="flex-1 bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90 font-paragraph font-semibold h-12 rounded-lg"
                    >
                      {editingProperty ? 'Atualizar' : 'Cadastrar'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        setEditingProperty(null);
                        resetForm();
                      }}
                      className="flex-1 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 h-12 rounded-lg"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Properties List */}
      <section className="w-full py-12">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-primary-foreground/5 rounded-xl h-32 animate-pulse"></div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-20">
              <Building2 className="w-16 h-16 text-primary-foreground/30 mx-auto mb-4" />
              <h3 className="font-heading text-2xl text-primary-foreground mb-2">
                Nenhum imóvel cadastrado
              </h3>
              <p className="font-paragraph text-base text-primary-foreground/60">
                Clique em "Novo Imóvel" para começar
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {properties.map((property, index) => (
                <motion.div
                  key={property._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="bg-primary-foreground/5 rounded-xl p-6 border border-primary-foreground/10 hover:border-secondary/30 transition-all"
                >
                  <div className="flex flex-col lg:flex-row justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-heading text-xl text-primary-foreground font-semibold">
                          {property.propertyName}
                        </h3>
                        <span className={`font-paragraph text-xs px-2 py-1 rounded ${
                          property.status === 'Disponível'
                            ? 'bg-secondary text-secondary-foreground'
                            : property.status === 'Reservado'
                            ? 'bg-brandaccent text-foreground'
                            : 'bg-destructive text-destructiveforeground'
                        }`}>
                          {property.status}
                        </span>
                        {property.investimentoOportunidade && (
                          <span className="font-paragraph text-xs px-2 py-1 rounded bg-brandaccent text-foreground">
                            Oportunidade
                          </span>
                        )}
                      </div>
                      <p className="font-paragraph text-sm text-primary-foreground/60 mb-2">
                        {property.address}
                      </p>
                      {property.segmentoCompra && (
                        <p className="font-paragraph text-xs text-primary-foreground/50 mb-2">
                          Segmentos: {property.segmentoCompra}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-primary-foreground/70">
                        <span>{property.propertyType}</span>
                        <span>•</span>
                        <span>{property.transactionType}</span>
                        <span>•</span>
                        <span>{property.bedrooms} quartos</span>
                        <span>•</span>
                        <span>{property.bathrooms} banheiros</span>
                        <span>•</span>
                        <span>{property.area}m²</span>
                      </div>
                    </div>
                    <div className="flex flex-col lg:items-end justify-between gap-4">
                      <p className="font-heading text-2xl text-secondary font-bold">
                        R$ {property.price?.toLocaleString('pt-BR')}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(property)}
                          variant="outline"
                          size="sm"
                          className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          onClick={() => handleDelete(property._id)}
                          variant="outline"
                          size="sm"
                          className="border-destructive/50 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
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

export default function AdminImoveisPage() {
  return (
    <MemberProtectedRoute messageToSignIn="Faça login para gerenciar imóveis">
      <AdminImoveisContent />
    </MemberProtectedRoute>
  );
}
