import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { UsuriosdoSistema, Units } from '@/entities';
import { useMember } from '@/integrations';
import { Search, X } from 'lucide-react';
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
  const { member } = useMember();
  const [formData, setFormData] = useState<Partial<UsuriosdoSistema>>({
    name: '',
    emailLogin: '',
    password: '',
    profile: '',
    status: 'Pendente',
    ativo: true,
    unidadeRef: '',
    memberRef: '',
    setores: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showMemberSearch, setShowMemberSearch] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        emailLogin: user.emailLogin || '',
        password: user.password || '',
        profile: user.profile || '',
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
        profile: '',
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
    setIsSaving(true);
    try {
      const dataToSave: Partial<UsuriosdoSistema> = {
        ...formData,
        inviteDate: user?.inviteDate || new Date().toISOString()
      };

      await onSave(dataToSave);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLinkCurrentMember = () => {
    if (member?.loginEmail) {
      setFormData({
        ...formData,
        emailLogin: member.loginEmail,
        memberRef: member.loginEmail,
        name: formData.name || member.contact?.firstName || member.profile?.nickname || ''
      });
      setShowMemberSearch(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            {user ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              <Label htmlFor="emailLogin">Login *</Label>
              <Input
                id="emailLogin"
                type="text"
                value={formData.emailLogin}
                onChange={(e) => setFormData({ ...formData, emailLogin: e.target.value })}
                placeholder="Digite o login (email ou usuário)"
                required
              />
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="********"
                required={!user}
              />
            </div>
          </div>

          {/* Wix Member Integration */}
          <div className="space-y-2 p-4 bg-secondary/5 rounded-lg border border-secondary/20">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-semibold">Integração com Wix Members</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMemberSearch(!showMemberSearch)}
              >
                {showMemberSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>

            {showMemberSearch && (
              <div className="space-y-3 pt-2">
                <p className="text-sm text-foreground/60">
                  Vincule este usuário a um membro Wix existente
                </p>
                {member ? (
                  <div className="flex items-center justify-between p-3 bg-background rounded border">
                    <div>
                      <p className="text-sm font-medium">
                        {member.profile?.nickname || member.contact?.firstName || 'Membro Atual'}
                      </p>
                      <p className="text-xs text-foreground/60">{member.loginEmail}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleLinkCurrentMember}
                      className="bg-secondary hover:bg-secondary/90"
                    >
                      Vincular
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-foreground/60">
                    Nenhum membro logado no momento
                  </p>
                )}
              </div>
            )}

            {user?.setores && user.setores.length > 0 && (
              <div className="mt-2">
                <Label className="text-sm font-semibold">Setores do Usuário:</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {user.setores.map(sector => (
                    <Badge key={sector} variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-blue-100">
                      {sector}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {formData.memberRef && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                ✓ Vinculado ao membro: {formData.memberRef}
              </div>
            )}
          </div>

          {/* Perfil */}
          <div className="space-y-2">
            <Label htmlFor="profile">Perfil de Acesso *</Label>
            <Select
              value={formData.profile}
              onValueChange={(value) => setFormData({ ...formData, profile: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Corretor">Corretor</SelectItem>
                <SelectItem value="Operacional">Operacional</SelectItem>
                <SelectItem value="Financeiro">Financeiro</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-foreground/60">
              Admin: acesso total | Corretor: imóveis e leads | Operacional: atendimentos | Financeiro: gestão financeira
            </p>
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
            <p className="text-xs text-foreground/60">
              Selecione todos os setores que este usuário terá acesso. O dashboard será personalizado conforme a seleção.
            </p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
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

          <DialogFooter className="gap-2">
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
              {isSaving ? 'Salvando...' : user ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
