import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Check, X } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { Clients, ServiceRecords } from '@/entities';
import { LeadRegistrationModal } from '@/components/LeadRegistrationModal';

interface ClientRegistrationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (clientId: string) => void;
}

const ROLES = [
  { id: 'comprador', label: 'Comprador' },
  { id: 'vendedor', label: 'Vendedor' },
  { id: 'locatario', label: 'Locatário' },
  { id: 'locador', label: 'Locador' },
  { id: 'investidor', label: 'Investidor' },
  { id: 'parceiro', label: 'Parceiro externo' },
  { id: 'construtora', label: 'Construtora / Incorporadora' },
  { id: 'prestador', label: 'Prestador de serviço' },
];

export function ClientRegistrationModal({
  isOpen,
  onOpenChange,
  onSuccess,
}: ClientRegistrationModalProps) {
  const [step, setStep] = useState<'form' | 'roles' | 'lead-question' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<Clients | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);
  const [wantsLead, setWantsLead] = useState<string>('');
  const [showLeadModal, setShowLeadModal] = useState(false);

  const [formData, setFormData] = useState({
    tipoPessoa: 'PF',
    nomeRazaoSocial: '',
    cpfCnpj: '',
    telefonePrincipal: '',
    whatsAppPrincipal: '',
    emailPrincipal: '',
    address: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      tipoPessoa: 'PF',
      nomeRazaoSocial: '',
      cpfCnpj: '',
      telefonePrincipal: '',
      whatsAppPrincipal: '',
      emailPrincipal: '',
      address: '',
      notes: '',
    });
    setSelectedRoles([]);
    setError(null);
    setDuplicateWarning(null);
    setStep('form');
    setCreatedClientId(null);
    setWantsLead('');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const checkDuplicateClient = async (): Promise<Clients | null> => {
    try {
      const { items } = await BaseCrudService.getAll<Clients>('clientes');
      const duplicate = items.find(
        (c) =>
          (formData.telefonePrincipal && c.telefonePrincipal === formData.telefonePrincipal) ||
          (formData.emailPrincipal && c.emailPrincipal === formData.emailPrincipal) ||
          (formData.cpfCnpj && c.cpfCnpj === formData.cpfCnpj)
      );
      return duplicate || null;
    } catch {
      return null;
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDuplicateWarning(null);

    if (!formData.nomeRazaoSocial.trim()) {
      setError('Nome/Razão Social é obrigatório');
      return;
    }

    if (!formData.emailPrincipal && !formData.telefonePrincipal) {
      setError('Email ou telefone é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const duplicate = await checkDuplicateClient();
      if (duplicate) {
        setDuplicateWarning(duplicate);
        setLoading(false);
        return;
      }

      setStep('roles');
    } catch (err) {
      setError('Erro ao verificar cliente duplicado');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
  };

  const handleCreateClient = async () => {
    if (selectedRoles.length === 0) {
      setError('Selecione pelo menos um papel/função');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const clientId = crypto.randomUUID();
      
      // Create client with new fields
      await BaseCrudService.create('clientes', {
        _id: clientId,
        tipoPessoa: formData.tipoPessoa,
        nomeRazaoSocial: formData.nomeRazaoSocial,
        clientName: formData.nomeRazaoSocial,
        cpfCnpj: formData.cpfCnpj,
        telefonePrincipal: formData.telefonePrincipal,
        phoneNumber: formData.telefonePrincipal,
        whatsAppPrincipal: formData.whatsAppPrincipal,
        emailPrincipal: formData.emailPrincipal,
        email: formData.emailPrincipal,
        address: formData.address,
        notes: formData.notes,
        papeis: selectedRoles.join(', '),
        status: 'Ativo',
      });

      setCreatedClientId(clientId);
      setStep('lead-question');
    } catch (err) {
      setError('Erro ao criar cliente');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeadDecision = () => {
    if (wantsLead === 'sim') {
      setShowLeadModal(true);
      handleClose();
    } else if (wantsLead === 'nao') {
      setStep('success');
    }
  };

  const handleLeadSuccess = (leadId: string) => {
    setShowLeadModal(false);
    setStep('success');
  };

  const handleSuccessClose = () => {
    if (createdClientId) {
      onSuccess?.(createdClientId);
    }
    handleClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl bg-primary border-primary-foreground/20 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-secondary">
              {step === 'form' && 'Etapa 1 — Cadastro do Cliente (CRM)'}
              {step === 'roles' && 'Etapa 2 — Seleção de Papéis/Funções'}
              {step === 'lead-question' && 'Etapa 3 — Criar Novo Lead'}
              {step === 'success' && 'Cliente Criado com Sucesso!'}
            </DialogTitle>
          </DialogHeader>

          {/* Form Step */}
          {step === 'form' && (
            <form onSubmit={handleFormSubmit} className="space-y-4 mt-4">
              {error && (
                <Alert className="bg-destructive/10 border-destructive/30">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive ml-2">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {duplicateWarning && (
                <Alert className="bg-brandaccent/10 border-brandaccent/30">
                  <AlertCircle className="h-4 w-4 text-brandaccent" />
                  <AlertDescription className="text-foreground ml-2">
                    <p className="font-semibold mb-2">Cliente já existe no sistema:</p>
                    <p>{duplicateWarning.nomeRazaoSocial || duplicateWarning.clientName}</p>
                    {duplicateWarning.emailPrincipal && <p>Email: {duplicateWarning.emailPrincipal}</p>}
                    {duplicateWarning.telefonePrincipal && <p>Telefone: {duplicateWarning.telefonePrincipal}</p>}
                    {duplicateWarning.cpfCnpj && <p>CPF/CNPJ: {duplicateWarning.cpfCnpj}</p>}
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <Label className="font-paragraph text-sm text-primary-foreground mb-2 block">
                  Tipo de Pessoa *
                </Label>
                <RadioGroup
                  value={formData.tipoPessoa}
                  onValueChange={(value) => setFormData({ ...formData, tipoPessoa: value })}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PF" id="pf" />
                    <Label htmlFor="pf" className="font-paragraph text-sm text-primary-foreground cursor-pointer">
                      Pessoa Física (PF)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PJ" id="pj" />
                    <Label htmlFor="pj" className="font-paragraph text-sm text-primary-foreground cursor-pointer">
                      Pessoa Jurídica (PJ)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="nomeRazaoSocial" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                  {formData.tipoPessoa === 'PF' ? 'Nome Completo' : 'Razão Social'} *
                </Label>
                <Input
                  id="nomeRazaoSocial"
                  required
                  value={formData.nomeRazaoSocial}
                  onChange={(e) => setFormData({ ...formData, nomeRazaoSocial: e.target.value })}
                  className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                  placeholder={formData.tipoPessoa === 'PF' ? 'Nome completo' : 'Razão social da empresa'}
                />
              </div>

              <div>
                <Label htmlFor="cpfCnpj" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                  {formData.tipoPessoa === 'PF' ? 'CPF' : 'CNPJ'}
                </Label>
                <Input
                  id="cpfCnpj"
                  value={formData.cpfCnpj}
                  onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                  className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                  placeholder={formData.tipoPessoa === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefonePrincipal" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                    Telefone
                  </Label>
                  <Input
                    id="telefonePrincipal"
                    value={formData.telefonePrincipal}
                    onChange={(e) => setFormData({ ...formData, telefonePrincipal: e.target.value })}
                    className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <Label htmlFor="whatsAppPrincipal" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                    WhatsApp
                  </Label>
                  <Input
                    id="whatsAppPrincipal"
                    value={formData.whatsAppPrincipal}
                    onChange={(e) => setFormData({ ...formData, whatsAppPrincipal: e.target.value })}
                    className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="emailPrincipal" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                  E-mail
                </Label>
                <Input
                  id="emailPrincipal"
                  type="email"
                  value={formData.emailPrincipal}
                  onChange={(e) => setFormData({ ...formData, emailPrincipal: e.target.value })}
                  className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <Label htmlFor="address" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                  Cidade
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                  placeholder="Cidade, Estado"
                />
              </div>

              <div>
                <Label htmlFor="notes" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                  Observações
                </Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2 border border-primary-foreground/20 rounded-lg bg-primary-foreground/10 text-primary-foreground font-paragraph text-sm resize-none"
                  rows={3}
                  placeholder="Informações adicionais..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90 font-paragraph font-semibold h-12 rounded-lg"
                >
                  {loading ? 'Verificando...' : 'Próximo'}
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
          )}

        {/* Roles Step */}
        {step === 'roles' && (
          <div className="space-y-4 mt-4">
            <p className="font-paragraph text-sm text-primary-foreground/70">
              Selecione os papéis/funções deste cliente:
            </p>

            <div className="space-y-3">
              {ROLES.map((role) => (
                <div
                  key={role.id}
                  className="bg-primary-foreground/5 rounded-lg p-4 border border-primary-foreground/10 hover:border-secondary/30 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={role.id}
                      checked={selectedRoles.includes(role.id)}
                      onCheckedChange={() => handleRoleToggle(role.id)}
                      className="border-primary-foreground/30 mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={role.id}
                        className="font-paragraph font-semibold text-primary-foreground cursor-pointer"
                      >
                        {role.label}
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <Alert className="bg-destructive/10 border-destructive/30">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive ml-2">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCreateClient}
                disabled={loading || selectedRoles.length === 0}
                className="flex-1 bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90 font-paragraph font-semibold h-12 rounded-lg"
              >
                {loading ? 'Criando...' : `Criar Cliente (${selectedRoles.length} papel${selectedRoles.length !== 1 ? 'éis' : ''})`}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('form')}
                className="flex-1 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 h-12 rounded-lg"
              >
                Voltar
              </Button>
            </div>
          </div>
        )}

        {/* Lead Question Step */}
        {step === 'lead-question' && (
          <div className="space-y-6 mt-4">
            <p className="font-paragraph text-base text-primary-foreground text-center">
              Deseja criar um Lead para este cliente agora?
            </p>

            <RadioGroup
              value={wantsLead}
              onValueChange={setWantsLead}
              className="flex flex-col gap-4"
            >
              <div className="bg-primary-foreground/5 rounded-lg p-4 border border-primary-foreground/10 hover:border-secondary/30 transition-all">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="sim" id="lead-sim" />
                  <Label htmlFor="lead-sim" className="font-paragraph text-base text-primary-foreground cursor-pointer flex-1">
                    Sim, criar Lead agora
                  </Label>
                </div>
              </div>
              <div className="bg-primary-foreground/5 rounded-lg p-4 border border-primary-foreground/10 hover:border-secondary/30 transition-all">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="nao" id="lead-nao" />
                  <Label htmlFor="lead-nao" className="font-paragraph text-base text-primary-foreground cursor-pointer flex-1">
                    Não, apenas criar o cliente
                  </Label>
                </div>
              </div>
            </RadioGroup>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleLeadDecision}
                disabled={!wantsLead}
                className="flex-1 bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90 font-paragraph font-semibold h-12 rounded-lg"
              >
                Continuar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('roles')}
                className="flex-1 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 h-12 rounded-lg"
              >
                Voltar
              </Button>
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="space-y-4 mt-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>

            <div>
              <h3 className="font-heading text-xl text-primary-foreground font-semibold mb-2">
                Cliente criado com sucesso!
              </h3>
              <p className="font-paragraph text-sm text-primary-foreground/70">
                {formData.nomeRazaoSocial}
              </p>
            </div>

            <div className="bg-primary-foreground/5 rounded-lg p-4 border border-primary-foreground/10">
              <p className="font-paragraph text-xs text-primary-foreground/60 mb-2">
                Papéis/Funções selecionados:
              </p>
              <ul className="space-y-1">
                {selectedRoles.map((roleId) => {
                  const role = ROLES.find((r) => r.id === roleId);
                  return (
                    <li key={roleId} className="font-paragraph text-sm text-primary-foreground">
                      ✓ {role?.label}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  window.location.href = '/admin/clientes';
                }}
                className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-paragraph font-semibold h-12 rounded-lg"
              >
                Ver Cliente
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

    <LeadRegistrationModal
      isOpen={showLeadModal}
      onOpenChange={setShowLeadModal}
      clientId={createdClientId}
      onSuccess={handleLeadSuccess}
    />
  </>
  );
}
