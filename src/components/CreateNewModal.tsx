import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Building2, Users, FileText } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface CreateNewModalProps {
  onSelectProperty?: () => void;
  onSelectClient?: () => void;
  onClose?: () => void;
}

export function CreateNewModal({ onSelectProperty, onSelectClient, onClose }: CreateNewModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handlePropertyClick = () => {
    if (onSelectProperty) {
      onSelectProperty();
    } else {
      navigate('/admin/imoveis');
    }
    setIsOpen(false);
    onClose?.();
  };

  const handleClientClick = () => {
    if (onSelectClient) {
      onSelectClient();
    } else {
      // Will be handled by parent component
    }
    setIsOpen(false);
    onClose?.();
  };

  const handleLeadClick = () => {
    navigate('/admin/leads');
    setIsOpen(false);
    onClose?.();
  };

  const handleServiceClick = () => {
    navigate('/admin/atendimentos');
    setIsOpen(false);
    onClose?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90 font-paragraph font-semibold h-12 px-8 rounded-lg shadow-lg">
          <Plus className="w-5 h-5 mr-2" />
          Criar Novo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-primary border-primary-foreground/20">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-secondary">
            O que deseja criar?
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-6">
          <button
            onClick={handleServiceClick}
            className="w-full bg-primary-foreground/5 hover:bg-primary-foreground/10 border border-primary-foreground/20 rounded-xl p-6 transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                <FileText className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="font-heading text-lg text-primary-foreground font-semibold">
                  Novo Atendimento
                </h3>
                <p className="font-paragraph text-sm text-primary-foreground/60 mt-1">
                  Crie um novo atendimento (Financiamento)
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
                <Users className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="font-heading text-lg text-primary-foreground font-semibold">
                  Novo Lead
                </h3>
                <p className="font-paragraph text-sm text-primary-foreground/60 mt-1">
                  Registre um novo lead de contato
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
                  Novo Cliente
                </h3>
                <p className="font-paragraph text-sm text-primary-foreground/60 mt-1">
                  Registre um novo cliente (Pessoa/Empresa)
                </p>
              </div>
            </div>
          </button>

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
                  Novo Imóvel
                </h3>
                <p className="font-paragraph text-sm text-primary-foreground/60 mt-1">
                  Adicione um novo imóvel ao sistema
                </p>
              </div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
