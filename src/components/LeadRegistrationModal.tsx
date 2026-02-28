import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Check } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { LeadsdeContato, Clients } from '@/entities';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface LeadRegistrationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string | null;
  onSuccess?: (leadId: string) => void;
}

export function LeadRegistrationModal({
  isOpen,
  onOpenChange,
  clientId = null,
  onSuccess,
}: LeadRegistrationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [clientData, setClientData] = useState<Clients | null>(null);
  const [createdLeadId, setCreatedLeadId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    interessePrincipal: [] as string[],
    tipoImovelDesejado: [] as string[],
    cidadeDesejada: '',
    bairroDesejado: '',
    faixaValorMin: '',
    faixaValorMax: '',
    potencialEntrada: '',
    rendaBruta: '',
    perfilCompra: '',
    urgencia: '',
  });

  // Load client data if clientId is provided
  useEffect(() => {
    if (clientId && isOpen) {
      loadClientData();
    }
  }, [clientId, isOpen]);

  const loadClientData = async () => {
    if (!clientId) return;

    try {
      const client = await BaseCrudService.getById<Clients>('clientes', clientId);
      setClientData(client);
    } catch (err) {
      console.error('Error loading client:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      interessePrincipal: [],
      tipoImovelDesejado: [],
      cidadeDesejada: '',
      bairroDesejado: '',
      faixaValorMin: '',
      faixaValorMax: '',
      potencialEntrada: '',
      rendaBruta: '',
      perfilCompra: '',
      urgencia: '',
    });
    setError(null);
    setSuccess(false);
    setCreatedLeadId(null);
    setClientData(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.interessePrincipal.length === 0) {
      setError('Interesse principal é obrigatório');
      return;
    }

    if (!clientId && !clientData) {
      setError('Cliente não identificado');
      return;
    }

    setLoading(true);
    try {
      const leadId = crypto.randomUUID();

      // Create lead with all required fields
      await BaseCrudService.create('leadsdecontato', {
        _id: leadId,
        fullName: clientData?.clientName || '',
        email: clientData?.email || '',
        phoneNumber: clientData?.phoneNumber || '',
        interessePrincipal: formData.interessePrincipal.join(', '),
        tipoImovelDesejado: formData.tipoImovelDesejado.join(', '),
        cidadeDesejada: formData.cidadeDesejada,
        bairroDesejado: formData.bairroDesejado,
        faixaValorMin: formData.faixaValorMin ? parseFloat(formData.faixaValorMin) : undefined,
        faixaValorMax: formData.faixaValorMax ? parseFloat(formData.faixaValorMax) : undefined,
        potencialEntrada: formData.potencialEntrada ? parseFloat(formData.potencialEntrada) : undefined,
        rendaBruta: formData.rendaBruta ? parseFloat(formData.rendaBruta) : undefined,
        perfilCompra: formData.perfilCompra,
        urgencia: formData.urgencia,
        leadStatus: 'Novo',
        statusFunil: 'Novo',
        leadSource: 'Área Restrita',
        submissionDate: new Date(),
        ultimaInteracao: new Date(),
      });

      setCreatedLeadId(leadId);
      setSuccess(true);

      // The backend hook (leads-distribuicao.js) will automatically:
      // 1. Identify the sector
      // 2. Assign a broker using round-robin
      // 3. Create a task for the broker
      // 4. Register in history

      onSuccess?.(leadId);
    } catch (err) {
      setError('Erro ao criar lead');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl bg-primary border-primary-foreground/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-black">
            {success ? 'Lead Criado com Sucesso!' : 'Cadastrar Novo Lead'}
          </DialogTitle>
        </DialogHeader>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {error && (
              <Alert className="bg-destructive/10 border-destructive/30">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive ml-2">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {clientData && (
              <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/30">
                <p className="font-paragraph text-sm text-black font-semibold mb-1">
                  Cliente vinculado:
                </p>
                <p className="font-paragraph text-sm text-black">
                  {clientData.clientName}
                </p>
                {clientData.email && (
                  <p className="font-paragraph text-xs text-black/60">
                    {clientData.email}
                  </p>
                )}
                {clientData.phoneNumber && (
                  <p className="font-paragraph text-xs text-black/60">
                    {clientData.phoneNumber}
                  </p>
                )}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="interessePrincipal" className="font-paragraph text-sm text-black mb-2 block font-medium">
                  Interesse Principal *
                </Label>
                <ToggleGroup
                  type="multiple"
                  variant="outline"
                  value={formData.interessePrincipal}
                  onValueChange={(value) => setFormData({ ...formData, interessePrincipal: value })}
                  className="flex flex-wrap justify-start gap-2"
                >
                  <ToggleGroupItem value="Compra" className="bg-primary-foreground/5 border-primary-foreground/20 text-xs py-1 h-auto data-[state=on]:bg-secondary data-[state=on]:text-white text-black font-medium">Compra</ToggleGroupItem>
                  <ToggleGroupItem value="Locação" className="bg-primary-foreground/5 border-primary-foreground/20 text-xs py-1 h-auto data-[state=on]:bg-secondary data-[state=on]:text-white text-black font-medium">Locação</ToggleGroupItem>
                  <ToggleGroupItem value="Investimento" className="bg-primary-foreground/5 border-primary-foreground/20 text-xs py-1 h-auto data-[state=on]:bg-secondary data-[state=on]:text-white text-black font-medium">Investimento</ToggleGroupItem>
                  <ToggleGroupItem value="Leilão Caixa" className="bg-primary-foreground/5 border-primary-foreground/20 text-xs py-1 h-auto data-[state=on]:bg-secondary data-[state=on]:text-white text-black font-medium">Leilão Caixa</ToggleGroupItem>
                  <ToggleGroupItem value="Imóvel na Planta" className="bg-primary-foreground/5 border-primary-foreground/20 text-xs py-1 h-auto data-[state=on]:bg-secondary data-[state=on]:text-white text-black font-medium">Imóvel na Planta</ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div>
                <Label htmlFor="tipoImovelDesejado" className="font-paragraph text-sm text-black mb-2 block font-medium">
                  Tipo de Imóvel Desejado
                </Label>
                <ToggleGroup
                  type="multiple"
                  variant="outline"
                  value={formData.tipoImovelDesejado}
                  onValueChange={(value) => setFormData({ ...formData, tipoImovelDesejado: value })}
                  className="flex flex-wrap justify-start gap-2"
                >
                  <ToggleGroupItem value="Casa" className="bg-primary-foreground/5 border-primary-foreground/20 text-xs py-1 h-auto data-[state=on]:bg-secondary data-[state=on]:text-white text-black font-medium">Casa</ToggleGroupItem>
                  <ToggleGroupItem value="Apartamento" className="bg-primary-foreground/5 border-primary-foreground/20 text-xs py-1 h-auto data-[state=on]:bg-secondary data-[state=on]:text-white text-black font-medium">Apartamento</ToggleGroupItem>
                  <ToggleGroupItem value="Terreno" className="bg-primary-foreground/5 border-primary-foreground/20 text-xs py-1 h-auto data-[state=on]:bg-secondary data-[state=on]:text-white text-black font-medium">Terreno</ToggleGroupItem>
                  <ToggleGroupItem value="Área" className="bg-primary-foreground/5 border-primary-foreground/20 text-xs py-1 h-auto data-[state=on]:bg-secondary data-[state=on]:text-white text-black font-medium">Área</ToggleGroupItem>
                  <ToggleGroupItem value="Comercial" className="bg-primary-foreground/5 border-primary-foreground/20 text-xs py-1 h-auto data-[state=on]:bg-secondary data-[state=on]:text-white text-black font-medium">Comercial</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cidadeDesejada" className="font-paragraph text-sm text-black mb-2 block font-medium">
                  Cidade Desejada
                </Label>
                <Input
                  id="cidadeDesejada"
                  value={formData.cidadeDesejada}
                  onChange={(e) => setFormData({ ...formData, cidadeDesejada: e.target.value })}
                  className="bg-primary-foreground/5 border-primary-foreground/20 text-black placeholder:text-black/40"
                  placeholder="Ex: São Paulo"
                />
              </div>

              <div>
                <Label htmlFor="bairroDesejado" className="font-paragraph text-sm text-black mb-2 block font-medium">
                  Bairro Desejado
                </Label>
                <Input
                  id="bairroDesejado"
                  value={formData.bairroDesejado}
                  onChange={(e) => setFormData({ ...formData, bairroDesejado: e.target.value })}
                  className="bg-primary-foreground/5 border-primary-foreground/20 text-black placeholder:text-black/40"
                  placeholder="Ex: Centro"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="faixaValorMin" className="font-paragraph text-sm text-black mb-2 block font-medium">
                  Faixa de Valor Mínima (R$)
                </Label>
                <Input
                  id="faixaValorMin"
                  type="number"
                  value={formData.faixaValorMin}
                  onChange={(e) => setFormData({ ...formData, faixaValorMin: e.target.value })}
                  className="bg-primary-foreground/5 border-primary-foreground/20 text-black placeholder:text-black/40"
                  placeholder="Ex: 200000"
                />
              </div>

              <div>
                <Label htmlFor="faixaValorMax" className="font-paragraph text-sm text-black mb-2 block font-medium">
                  Faixa de Valor Máxima (R$)
                </Label>
                <Input
                  id="faixaValorMax"
                  type="number"
                  value={formData.faixaValorMax}
                  onChange={(e) => setFormData({ ...formData, faixaValorMax: e.target.value })}
                  className="bg-primary-foreground/5 border-primary-foreground/20 text-black placeholder:text-black/40"
                  placeholder="Ex: 500000"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="potencialEntrada" className="font-paragraph text-sm text-black mb-2 block font-medium">
                  Entrada Disponível (R$)
                </Label>
                <Input
                  id="potencialEntrada"
                  type="number"
                  value={formData.potencialEntrada}
                  onChange={(e) => setFormData({ ...formData, potencialEntrada: e.target.value })}
                  className="bg-primary-foreground/5 border-primary-foreground/20 text-black placeholder:text-black/40"
                  placeholder="Ex: 50000"
                />
              </div>

              <div>
                <Label htmlFor="rendaBruta" className="font-paragraph text-sm text-black mb-2 block font-medium">
                  Renda Bruta Aproximada (R$)
                </Label>
                <Input
                  id="rendaBruta"
                  type="number"
                  value={formData.rendaBruta}
                  onChange={(e) => setFormData({ ...formData, rendaBruta: e.target.value })}
                  className="bg-primary-foreground/5 border-primary-foreground/20 text-black placeholder:text-black/40"
                  placeholder="Ex: 8000"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="perfilCompra" className="font-paragraph text-sm text-black mb-2 block font-medium">
                  Perfil de Compra
                </Label>
                <Select
                  value={formData.perfilCompra}
                  onValueChange={(value) => setFormData({ ...formData, perfilCompra: value })}
                >
                  <SelectTrigger className="bg-primary-foreground/5 border-primary-foreground/20 text-black">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MCMV">MCMV</SelectItem>
                    <SelectItem value="Usado">Usado</SelectItem>
                    <SelectItem value="Alto padrão">Alto padrão</SelectItem>
                    <SelectItem value="Investidor">Investidor</SelectItem>
                    <SelectItem value="Leilão Caixa">Leilão Caixa</SelectItem>
                    <SelectItem value="Planta">Planta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="urgencia" className="font-paragraph text-sm text-black mb-2 block font-medium">
                  Urgência
                </Label>
                <Select
                  value={formData.urgencia}
                  onValueChange={(value) => setFormData({ ...formData, urgencia: value })}
                >
                  <SelectTrigger className="bg-primary-foreground/5 border-primary-foreground/20 text-black">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90 font-paragraph font-semibold h-12 rounded-lg"
              >
                {loading ? 'Criando...' : 'Criar Lead'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 h-12 rounded-lg"
              >
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 mt-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>

            <div>
              <h3 className="font-heading text-xl text-black font-semibold mb-2">
                Lead criado com sucesso!
              </h3>
              <p className="font-paragraph text-sm text-black/70">
                O lead foi registrado e será distribuído automaticamente para um corretor responsável.
              </p>
            </div>

            {clientData && (
              <div className="bg-primary-foreground/5 rounded-lg p-4 border border-primary-foreground/10">
                <p className="font-paragraph text-xs text-black/60 mb-2">
                  Cliente vinculado:
                </p>
                <p className="font-paragraph text-sm text-black font-semibold">
                  {clientData.clientName}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  window.location.href = '/admin/leads';
                }}
                className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-paragraph font-semibold h-12 rounded-lg"
              >
                Ver Leads
              </Button>
              <Button
                onClick={handleSuccessClose}
                variant="outline"
                className="flex-1 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 h-12 rounded-lg"
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
