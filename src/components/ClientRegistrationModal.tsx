import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Check } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { Clients } from '@/entities';
import { LeadRegistrationModal } from '@/components/LeadRegistrationModal';

interface ClientRegistrationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (clientId: string) => void;
}

const ROLES = [
  { id: 'Comprador', label: 'Comprador' },
  { id: 'Vendedor', label: 'Vendedor' },
  { id: 'Locatário', label: 'Locatário' },
  { id: 'Locador', label: 'Locador' },
  { id: 'Investidor', label: 'Investidor' },
  { id: 'Parceiro', label: 'Parceiro' },
  { id: 'Construtora / Incorporadora', label: 'Construtora / Incorporadora' },
  { id: 'Prestador', label: 'Prestador' },
];

export function ClientRegistrationModal({
  isOpen,
  onOpenChange,
  onSuccess,
}: ClientRegistrationModalProps) {
  const [step, setStep] = useState<'form' | 'roles' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<Clients | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [createLead, setCreateLead] = useState<'sim' | 'nao'>('nao');
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);

  const [formData, setFormData] = useState({
    clientName: '',
    email: '',
    phoneNumber: '',
    address: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      clientName: '',
      email: '',
      phoneNumber: '',
      address: '',
      notes: '',
    });
    setSelectedRoles([]);
    setCreateLead('nao');
    setError(null);
    setDuplicateWarning(null);
    setStep('form');
    setCreatedClientId(null);
    setShowLeadModal(false);
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
          (formData.phoneNumber && c.phoneNumber === formData.phoneNumber) ||
          (formData.email && c.email === formData.email)
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

    if (!formData.clientName.trim()) {
      setError('Nome do cliente é obrigatório');
      return;
    }

    if (!formData.email && !formData.phoneNumber) {
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

      // Move to roles step (now optional)
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
    // Roles are now optional - no validation needed
    setLoading(true);
    setError(null);

    try {
      const clientId = crypto.randomUUID();
      
      // Create client with optional roles saved in papeis field
      await BaseCrudService.create('clientes', {
        _id: clientId,
        clientName: formData.clientName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        notes: formData.notes,
        status: 'Ativo',
        papeis: selectedRoles.length > 0 ? selectedRoles.join(', ') : undefined, // Optional roles
      });

      setCreatedClientId(clientId);
      
      // Check if user wants to create a lead
      if (createLead === 'sim') {
        setStep('success');
        // Open lead modal after a short delay
        setTimeout(() => {
          setShowLeadModal(true);
        }, 500);
      } else {
        setStep('success');
      }
    } catch (err) {
      setError('Erro ao criar cliente');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    if (createdClientId) {
      onSuccess?.(createdClientId);
    }
    handleClose();
  };

  const handleLeadSuccess = (leadId: string) => {
    setShowLeadModal(false);
    // Lead was created successfully
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-primary border-primary-foreground/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-secondary">
            {step === 'form' && 'Cadastrar Novo Cliente'}
            {step === 'roles' && 'Selecionar Papéis/Funções'}
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
                  <p>{duplicateWarning.clientName}</p>
                  {duplicateWarning.email && <p>Email: {duplicateWarning.email}</p>}
                  {duplicateWarning.phoneNumber && <p>Telefone: {duplicateWarning.phoneNumber}</p>}
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="clientName" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                Nome do Cliente *
              </Label>
              <Input
                id="clientName"
                required
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                placeholder="Nome completo ou razão social"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <Label htmlFor="phoneNumber" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                  Telefone
                </Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                Endereço
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                placeholder="Rua, número, bairro, cidade"
              />
            </div>

            <div>
              <Label htmlFor="notes" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                Notas
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
              Selecione os papéis/funções deste cliente (opcional). Os papéis servem apenas para classificação no CRM e não afetam nenhum fluxo.
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

            {/* Create Lead Option */}
            <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/30 mt-6">
              <Label className="font-paragraph font-semibold text-primary-foreground mb-3 block">
                Criar Lead para este cliente?
              </Label>
              <RadioGroup value={createLead} onValueChange={(value: 'sim' | 'nao') => setCreateLead(value)}>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="sim" id="lead-sim" />
                  <Label htmlFor="lead-sim" className="font-paragraph text-sm text-primary-foreground cursor-pointer">
                    Sim
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nao" id="lead-nao" />
                  <Label htmlFor="lead-nao" className="font-paragraph text-sm text-primary-foreground cursor-pointer">
                    Não
                  </Label>
                </div>
              </RadioGroup>
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
                disabled={loading}
                className="flex-1 bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90 font-paragraph font-semibold h-12 rounded-lg"
              >
                {loading ? 'Criando...' : selectedRoles.length > 0 ? `Criar Cliente (${selectedRoles.length} papel${selectedRoles.length !== 1 ? 'éis' : ''})` : 'Criar Cliente'}
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
                {formData.clientName}
              </p>
            </div>

            {selectedRoles.length > 0 && (
              <div className="bg-primary-foreground/5 rounded-lg p-4 border border-primary-foreground/10">
                <p className="font-paragraph text-xs text-primary-foreground/60 mb-2">
                  Papéis selecionados:
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
            )}

            {createLead === 'sim' && (
              <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/30">
                <p className="font-paragraph text-sm text-primary-foreground">
                  O formulário de Lead será aberto em seguida...
                </p>
              </div>
            )}

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

      {/* Lead Registration Modal */}
      <LeadRegistrationModal
        isOpen={showLeadModal}
        onOpenChange={setShowLeadModal}
        clientId={createdClientId}
        onSuccess={handleLeadSuccess}
      />
    </Dialog>
  );
}
