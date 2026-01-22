import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Kanban } from 'lucide-react';
import { CreateNewModal } from '@/components/CreateNewModal';

export default function QuickActions() {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="flex gap-4 mb-8">
      <Button
        onClick={() => setShowCreateModal(true)}
        className="bg-brandaccent hover:bg-orange-600 text-white flex items-center gap-2"
      >
        <Plus size={20} />
        Criar Novo
      </Button>

      <Button
        onClick={() => navigate('/admin/financiamento-kanban')}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Kanban size={20} />
        Kanban de Financiamento
      </Button>

      {showCreateModal && (
        <CreateNewModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
