import { useEffect, useState } from 'react';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Headphones, ArrowLeft, Mail, Phone, Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BaseCrudService } from '@/integrations';
import { Atendimentos } from '@/entities';

function AdminAtendimentosContent() {
  const [atendimentos, setAtendimentos] = useState<Atendimentos[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    serviceType: '',
    status: 'Aberto',
    priority: 'Normal',
    notes: '',
  });

  useEffect(() => {
    loadAtendimentos();
  }, []);

  const loadAtendimentos = async () => {
    try {
      const { items } = await BaseCrudService.getAll<Atendimentos>('atendimentos');
      setAtendimentos(items.sort((a, b) => {
        const dateA = a.creationDate ? new Date(a.creationDate).getTime() : 0;
        const dateB = b.creationDate ? new Date(b.creationDate).getTime() : 0;
        return dateB - dateA;
      }));
    } catch (error) {
      console.error('Error loading atendimentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await BaseCrudService.update('atendimentos', {
          _id: editingId,
          ...formData,
        });
      } else {
        await BaseCrudService.create('atendimentos', {
          _id: crypto.randomUUID(),
          creationDate: new Date(),
          ...formData,
        });
      }
      loadAtendimentos();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving atendimento:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await BaseCrudService.delete('atendimentos', id);
      loadAtendimentos();
    } catch (error) {
      console.error('Error deleting atendimento:', error);
    }
  };

  const handleEdit = (atendimento: Atendimentos) => {
    setEditingId(atendimento._id);
    setFormData({
      contactName: atendimento.contactName || '',
      contactEmail: atendimento.contactEmail || '',
      contactPhone: atendimento.contactPhone || '',
      serviceType: atendimento.serviceType || '',
      status: atendimento.status || 'Aberto',
      priority: atendimento.priority || 'Normal',
      notes: atendimento.notes || '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      serviceType: '',
      status: 'Aberto',
      priority: 'Normal',
      notes: '',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgente':
        return 'bg-red-100 text-red-800';
      case 'Alta':
        return 'bg-orange-100 text-orange-800';
      case 'Normal':
        return 'bg-blue-100 text-blue-800';
      case 'Baixa':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aberto':
        return 'bg-yellow-100 text-yellow-800';
      case 'Em Andamento':
        return 'bg-blue-100 text-blue-800';
      case 'Resolvido':
        return 'bg-green-100 text-green-800';
      case 'Fechado':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-primary">
      <Header />

      {/* Header */}
      <section className="w-full bg-gradient-to-br from-secondary/10 to-secondary/5 py-12">
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

          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-heading text-4xl lg:text-5xl text-secondary mb-4">
                Gestão de Atendimentos
              </h1>
              <p className="font-paragraph text-lg text-primary-foreground/80">
                Gerencie solicitações de serviço e suporte ao cliente
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => resetForm()}
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-paragraph"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Novo Atendimento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-heading">
                    {editingId ? 'Editar Atendimento' : 'Novo Atendimento'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Nome do Contato"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="font-paragraph"
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="font-paragraph"
                  />
                  <Input
                    placeholder="Telefone"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="font-paragraph"
                  />
                  <Input
                    placeholder="Tipo de Serviço"
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    className="font-paragraph"
                  />
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger className="font-paragraph">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aberto">Aberto</SelectItem>
                      <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                      <SelectItem value="Resolvido">Resolvido</SelectItem>
                      <SelectItem value="Fechado">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger className="font-paragraph">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baixa">Baixa</SelectItem>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Alta">Alta</SelectItem>
                      <SelectItem value="Urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                  <textarea
                    placeholder="Notas"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full p-2 border border-border-gray rounded-lg font-paragraph text-sm"
                    rows={3}
                  />
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSave}
                      className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-paragraph"
                    >
                      Salvar
                    </Button>
                    <Button
                      onClick={() => setIsDialogOpen(false)}
                      variant="outline"
                      className="flex-1 font-paragraph"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Atendimentos List */}
      <section className="w-full py-12">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-primary-foreground/5 rounded-xl h-40 animate-pulse"></div>
              ))}
            </div>
          ) : atendimentos.length === 0 ? (
            <div className="text-center py-20">
              <Headphones className="w-16 h-16 text-primary-foreground/30 mx-auto mb-4" />
              <h3 className="font-heading text-2xl text-primary-foreground mb-2">
                Nenhum atendimento registrado
              </h3>
              <p className="font-paragraph text-base text-primary-foreground/60">
                Comece adicionando um novo atendimento
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {atendimentos.map((atendimento, index) => (
                <motion.div
                  key={atendimento._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="bg-primary-foreground/5 rounded-xl p-6 border border-primary-foreground/10 hover:border-secondary/30 transition-all"
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-heading text-xl text-primary-foreground font-semibold">
                            {atendimento.contactName}
                          </h3>
                          <p className="font-paragraph text-sm text-primary-foreground/60 mt-1">
                            {atendimento.serviceType}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`text-xs font-paragraph px-2 py-1 rounded-full ${getStatusColor(atendimento.status || '')}`}>
                            {atendimento.status}
                          </span>
                          <span className={`text-xs font-paragraph px-2 py-1 rounded-full flex items-center gap-1 ${getPriorityColor(atendimento.priority || '')}`}>
                            {atendimento.priority === 'Urgente' && <AlertCircle className="w-3 h-3" />}
                            {atendimento.priority}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {atendimento.contactEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-secondary flex-shrink-0" />
                            <a
                              href={`mailto:${atendimento.contactEmail}`}
                              className="font-paragraph text-sm text-primary-foreground/70 hover:text-secondary transition-colors"
                            >
                              {atendimento.contactEmail}
                            </a>
                          </div>
                        )}
                        {atendimento.contactPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-secondary flex-shrink-0" />
                            <a
                              href={`tel:${atendimento.contactPhone}`}
                              className="font-paragraph text-sm text-primary-foreground/70 hover:text-secondary transition-colors"
                            >
                              {atendimento.contactPhone}
                            </a>
                          </div>
                        )}
                      </div>

                      {atendimento.notes && (
                        <div className="bg-primary-foreground/10 rounded-lg p-3 mt-3">
                          <p className="font-paragraph text-xs text-primary-foreground/60 mb-1">
                            Notas:
                          </p>
                          <p className="font-paragraph text-sm text-primary-foreground">
                            {atendimento.notes}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(atendimento)}
                        variant="outline"
                        size="sm"
                        className="font-paragraph"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(atendimento._id)}
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive font-paragraph"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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

export default function AdminAtendimentosPage() {
  return (
    <MemberProtectedRoute messageToSignIn="Faça login para gerenciar atendimentos">
      <AdminAtendimentosContent />
    </MemberProtectedRoute>
  );
}
