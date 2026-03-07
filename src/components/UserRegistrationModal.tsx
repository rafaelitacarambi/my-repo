import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { UsuriosdoSistema, Units } from '@/entities';
import { CheckboxWithText } from '@/components/ui/checkbox';

interface UserRegistrationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (userData: Partial<UsuriosdoSistema>) => Promise<void>;
  user?: UsuriosdoSistema | null;
  units: Units[];
}

export function UserRegistrationModal({
  isOpen,
  onOpenChange,
  onSave,
  user,
  units
}: UserRegistrationModalProps) {
  const [formData, setFormData] = useState<Partial<UsuriosdoSistema>>({
    name: '',
    emailLogin: '',
    password: '',
    profile: undefined,
    status: 'Pendente',
    ativo: true,
    unidadeRef: '',
    memberRef: '',
    setores: []
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        emailLogin: user.emailLogin || '',
        password: user.password || '',
        profile: user.profile || undefined,
        status: user.status || 'Pendente',
        ativo: user.ativo ?? true,
        unidadeRef: user.unidadeRef || '',
        memberRef: user.memberRef || '',
        setores: user.setores || []
      });
    } else {
      setFormData({
        name: '',
        emailLogin: '',
        password: '',
        profile: undefined,
        status: 'Pendente',
        ativo: true,
        unidadeRef: '',
        memberRef: '',
        setores: []
      });
    }
  }, [user, isOpen]);

  const toggleSector = (sector: string) => {
    const currentSetores = formData.setores || [];
    if (currentSetores.includes(sector)) {
      setFormData({ ...formData, setores: currentSetores.filter(s => s !== sector) });
    } else {
      setFormData({ ...formData, setores: [...currentSetores, sector] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.profile) {
      alert("Por favor, selecione um Perfil de Acesso.");
      return;
    }
    if (!formData.status) {
      alert("Por favor, selecione um Status.");
      return;
    }
    if (!formData.setores || formData.setores.length === 0) {
      alert("Por favor, selecione pelo menos um Setor do Sistema.");
      return;
    }

    setIsSaving(true);
    try {
      const dataToSave: Partial<UsuriosdoSistema> = {
        ...formData,
        inviteDate: user?.inviteDate || new Date().toISOString()
      };

      await onSave(dataToSave);
      // parent should close the modal via isOpen prop
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      setIsSaving(false);
    }
  };



  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="font-heading text-2xl">
            {user ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Digite o nome completo"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email / Login */}
              <div className="space-y-2">
                <Label htmlFor="emailLogin">E-mail de Login *</Label>
                <Input
                  id="emailLogin"
                  type="email"
                  value={formData.emailLogin}
                  onChange={(e) => setFormData({ ...formData, emailLogin: e.target.value })}
                  placeholder="exemplo@email.com"
                  required
                />
                <p className="text-[10px] text-muted-foreground">Obrigatório formato de e-mail válido</p>
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
                  required={!user}
                  minLength={8}
                />
                <p className="text-[10px] text-muted-foreground">Mínimo 8 caracteres</p>
              </div>
            </div>

            {/* Perfil */}
            <div className="space-y-2">
              <Label htmlFor="profile">Perfil de Acesso *</Label>
              <select
                id="profile"
                className="w-full p-2 border rounded-md bg-background"
                value={formData.profile || ''}
                onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
                required
              >
                <option value="" disabled>Selecione o perfil</option>
                <option value="Admin">Admin</option>
                <option value="Corretor">Corretor</option>
                <option value="Operacional">Operacional</option>
                <option value="Financeiro">Financeiro</option>
              </select>
            </div>

            {/* Setores (Unidade) */}
            <div className="space-y-3">
              <Label className="text-base">Setores do Sistema (Unidade) *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-xl bg-slate-50/50">
                <CheckboxWithText
                  id="sector-financiamento"
                  label="Setor de Financiamento"
                  checked={formData.setores?.includes('Financiamento')}
                  onCheckedChange={() => toggleSector('Financiamento')}
                />
                <CheckboxWithText
                  id="sector-vendas"
                  label="Venda, Compra e Locação"
                  checked={formData.setores?.includes('Venda, Compra e Locação')}
                  onCheckedChange={() => toggleSector('Venda, Compra e Locação')}
                />
                <CheckboxWithText
                  id="sector-administrativo"
                  label="Administrativo"
                  checked={formData.setores?.includes('Administrativo')}
                  onCheckedChange={() => toggleSector('Administrativo')}
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <select
                id="status"
                className="w-full p-2 border rounded-md bg-background"
                value={formData.status || ''}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
              >
                <option value="Ativo">Ativo</option>
                <option value="Pendente">Pendente</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>

            {/* Ativo Switch */}
            <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
              <div className="space-y-0.5">
                <Label htmlFor="ativo" className="text-base">Usuário Ativo</Label>
                <p className="text-sm text-foreground/60">
                  Permite que o usuário acesse o sistema
                </p>
              </div>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 border-t gap-2 bg-background mt-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-secondary hover:bg-secondary/90"
            >
              {isSaving ? (user ? 'Atualizando...' : 'Salvando...') : user ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
