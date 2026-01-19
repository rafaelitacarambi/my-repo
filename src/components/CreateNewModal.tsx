import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Building2, Users, Headphones, UserPlus } from 'lucide-react';
import { useState } from 'react';

interface CreateNewModalProps {
  onSelectProperty: () => void;
  onSelectClient: () => void;
  onSelectAtendimento: () => void;
  onSelectLead: () => void;
}

export function CreateNewModal({ onSelectProperty, onSelectClient, onSelectAtendimento, onSelectLead }: CreateNewModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePropertyClick = () => {
    onSelectProperty();
    setIsOpen(false);
  };

  const handleClientClick = () => {
    onSelectClient();
    setIsOpen(false);
  };

  const handleAtendimentoClick = () => {
    onSelectAtendimento();
    setIsOpen(false);
  };

  const handleLeadClick = () => {
    onSelectLead();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90 font-paragraph font-semibold h-12 px-8 rounded-lg shadow-lg">
          <Plus className="w-5 h-5 mr-2" />
          Criar Novo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-primary border-primary-foreground/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-secondary">
            O que deseja criar?
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-6">
          <button
            onClick={handlePropertyClick}
            className="w-full bg-primary-foreground/5 hover:bg-primary-foreground/10 border border-primary-foreground/20 rounded-xl p-6 transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                <Building2 className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="font-heading text-lg text-primary-foreground font-semibold">
                  Cadastro de Imóvel
                </h3>
                <p className="font-paragraph text-sm text-primary-foreground/60 mt-1">
                  Adicione um novo imóvel ao sistema
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={handleClientClick}
            className="w-full bg-primary-foreground/5 hover:bg-primary-foreground/10 border border-primary-foreground/20 rounded-xl p-6 transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                <Users className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="font-heading text-lg text-primary-foreground font-semibold">
                  Cadastro de Cliente
                </h3>
                <p className="font-paragraph text-sm text-primary-foreground/60 mt-1">
                  Registre um novo cliente (Pessoa/Empresa)
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={handleAtendimentoClick}
            className="w-full bg-primary-foreground/5 hover:bg-primary-foreground/10 border border-primary-foreground/20 rounded-xl p-6 transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                <Headphones className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="font-heading text-lg text-primary-foreground font-semibold">
                  Cadastro de Atendimento
                </h3>
                <p className="font-paragraph text-sm text-primary-foreground/60 mt-1">
                  Registre um novo atendimento
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={handleLeadClick}
            className="w-full bg-primary-foreground/5 hover:bg-primary-foreground/10 border border-primary-foreground/20 rounded-xl p-6 transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                <UserPlus className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="font-heading text-lg text-primary-foreground font-semibold">
                  Novo Lead
                </h3>
                <p className="font-paragraph text-sm text-primary-foreground/60 mt-1">
                  Cadastre um novo lead de contato
                </p>
              </div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
