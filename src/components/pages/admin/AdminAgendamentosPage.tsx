import { useEffect, useState } from 'react';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, ArrowLeft, Clock, Plus, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BaseCrudService } from '@/integrations';
import { Appointments } from '@/entities';

function AdminAgendamentosContent() {
  const [agendamentos, setAgendamentos] = useState<Appointments[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    appointmentDateTime: '',
    serviceType: '',
    status: 'Agendado',
    duration: 60,
    notes: '',
  });

  useEffect(() => {
    loadAgendamentos();
  }, []);

  const loadAgendamentos = async () => {
    try {
      const { items } = await BaseCrudService.getAll<Appointments>('agendamentos');
      setAgendamentos(items.sort((a, b) => {
        const dateA = a.appointmentDateTime ? new Date(a.appointmentDateTime).getTime() : 0;
        const dateB = b.appointmentDateTime ? new Date(b.appointmentDateTime).getTime() : 0;
        return dateA - dateB;
      }));
    } catch (error) {
      console.error('Error loading agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await BaseCrudService.update('agendamentos', {
          _id: editingId,
          ...formData,
          duration: Number(formData.duration),
        });
      } else {
        await BaseCrudService.create('agendamentos', {
          _id: crypto.randomUUID(),
          ...formData,
          duration: Number(formData.duration),
        });
      }
      loadAgendamentos();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving agendamento:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await BaseCrudService.delete('agendamentos', id);
      loadAgendamentos();
    } catch (error) {
      console.error('Error deleting agendamento:', error);
    }
  };

  const handleEdit = (agendamento: Appointments) => {
    setEditingId(agendamento._id);
    setFormData({
      appointmentDateTime: agendamento.appointmentDateTime ? 
        new Date(agendamento.appointmentDateTime).toISOString().slice(0, 16) : '',
      serviceType: agendamento.serviceType || '',
      status: agendamento.status || 'Agendado',
      duration: agendamento.duration || 60,
      notes: agendamento.notes || '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      appointmentDateTime: '',
      serviceType: '',
      status: 'Agendado',
      duration: 60,
      notes: '',
    });
  };

  const formatDateTime = (date: Date | string | undefined) => {
    if (!date) return 'Data não disponível';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Agendado':
        return 'bg-blue-100 text-blue-800';
      case 'Confirmado':
        return 'bg-green-100 text-green-800';
      case 'Realizado':
        return 'bg-gray-100 text-gray-800';
      case 'Cancelado':
        return 'bg-red-100 text-red-800';
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
                Gestão de Agendamentos
              </h1>
              <p className="font-paragraph text-lg text-primary-foreground/80">
                Gerencie compromissos e agendamentos de serviços
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => resetForm()}
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-paragraph"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Novo Agendamento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-heading">
                    {editingId ? 'Editar Agendamento' : 'Novo Agendamento'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="font-paragraph text-sm text-primary-foreground/70 mb-1 block">
                      Data e Hora
                    </label>
                    <Input
                      type="datetime-local"
                      value={formData.appointmentDateTime}
                      onChange={(e) => setFormData({ ...formData, appointmentDateTime: e.target.value })}
                      className="font-paragraph"
                    />
                  </div>
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
                      <SelectItem value="Agendado">Agendado</SelectItem>
                      <SelectItem value="Confirmado">Confirmado</SelectItem>
                      <SelectItem value="Realizado">Realizado</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <div>
                    <label className="font-paragraph text-sm text-primary-foreground/70 mb-1 block">
                      Duração (minutos)
                    </label>
                    <Input
                      type="number"
                      min="15"
                      step="15"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                      className="font-paragraph"
                    />
                  </div>
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

      {/* Agendamentos List */}
      <section className="w-full py-12">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-primary-foreground/5 rounded-xl h-32 animate-pulse"></div>
              ))}
            </div>
          ) : agendamentos.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 text-primary-foreground/30 mx-auto mb-4" />
              <h3 className="font-heading text-2xl text-primary-foreground mb-2">
                Nenhum agendamento registrado
              </h3>
              <p className="font-paragraph text-base text-primary-foreground/60">
                Comece adicionando um novo agendamento
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {agendamentos.map((agendamento, index) => (
                <motion.div
                  key={agendamento._id}
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
                            {agendamento.serviceType}
                          </h3>
                          <div className="flex items-center gap-2 mt-2 text-primary-foreground/60">
                            <Calendar className="w-4 h-4" />
                            <span className="font-paragraph text-sm">
                              {formatDateTime(agendamento.appointmentDateTime)}
                            </span>
                          </div>
                        </div>
                        <span className={`text-xs font-paragraph px-2 py-1 rounded-full ${getStatusColor(agendamento.status || '')}`}>
                          {agendamento.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-primary-foreground/60">
                        <Clock className="w-4 h-4" />
                        <span className="font-paragraph text-sm">
                          {agendamento.duration} minutos
                        </span>
                      </div>

                      {agendamento.notes && (
                        <div className="bg-primary-foreground/10 rounded-lg p-3 mt-3">
                          <p className="font-paragraph text-xs text-primary-foreground/60 mb-1">
                            Notas:
                          </p>
                          <p className="font-paragraph text-sm text-primary-foreground">
                            {agendamento.notes}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(agendamento)}
                        variant="outline"
                        size="sm"
                        className="font-paragraph"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(agendamento._id)}
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

export default function AdminAgendamentosPage() {
  return (
    <MemberProtectedRoute messageToSignIn="Faça login para gerenciar agendamentos">
      <AdminAgendamentosContent />
    </MemberProtectedRoute>
  );
}
