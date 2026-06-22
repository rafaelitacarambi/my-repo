import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Kanban } from 'lucide-react';
import { CreateNewModal } from '@/components/CreateNewModal';

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="flex gap-4 mb-8">
      <CreateNewModal
        onSelectProperty={() => navigate('/admin/imoveis')}
        onSelectClient={() => navigate('/admin/clientes', { state: { openNewClient: true } })}
      />

      <Button
        onClick={() => navigate('/admin/financiamento-kanban')}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Kanban size={20} />
        Kanban de Financiamento
      </Button>
    </div>
  );
}
