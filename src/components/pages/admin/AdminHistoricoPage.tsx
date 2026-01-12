import { useEffect, useState } from 'react';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { History, ArrowLeft, Plus, Trash2, Edit2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BaseCrudService } from '@/integrations';
import { HistricodeInteraes } from '@/entities';

function AdminHistoricoContent() {
  const [historico, setHistorico] = useState<HistricodeInteraes[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    interactionDate: '',
    interactionType: 'Chamada',
    interactionDescription: '',
    interactionOutcome: '',
    interactionMedium: 'Telefone',
  });

  useEffect(() => {
    loadHistorico();
  }, []);

  const loadHistorico = async () => {
    try {
      const { items } = await BaseCrudService.getAll<HistricodeInteraes>('historicointeracoes');
      setHistorico(items.sort((a, b) => {
        const dateA = a.interactionDate ? new Date(a.interactionDate).getTime() : 0;
        const dateB = b.interactionDate ? new Date(b.interactionDate).getTime() : 0;
        return dateB - dateA;
      }));
    } catch (error) {
      console.error('Error loading historico:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await BaseCrudService.update('historicointeracoes', {
          _id: editingId,
          ...formData,
        });
      } else {
        await BaseCrudService.create('historicointeracoes', {
          _id: crypto.randomUUID(),
          ...formData,
        });
      }
      loadHistorico();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving historico:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await BaseCrudService.delete('historicointeracoes', id);
      loadHistorico();
    } catch (error) {
      console.error('Error deleting historico:', error);
    }
  };

  const handleEdit = (item: HistricodeInteraes) => {
    setEditingId(item._id);
    setFormData({
      interactionDate: item.interactionDate ? 
        new Date(item.interactionDate).toISOString().slice(0, 16) : '',
      interactionType: item.interactionType || 'Chamada',
      interactionDescription: item.interactionDescription || '',
      interactionOutcome: item.interactionOutcome || '',
      interactionMedium: item.interactionMedium || 'Telefone',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      interactionDate: '',
      interactionType: 'Chamada',
      interactionDescription: '',
      interactionOutcome: '',
      interactionMedium: 'Telefone',
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Chamada':
        return 'bg-blue-100 text-blue-800';
      case 'Email':
        return 'bg-purple-100 text-purple-800';
      case 'Reunião':
        return 'bg-green-100 text-green-800';
      case 'Chat':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMediumColor = (medium: string) => {
    switch (medium) {
      case 'Telefone':
        return 'bg-blue-50 text-blue-700';
      case 'Email':
        return 'bg-purple-50 text-purple-700';
      case 'Videoconferência':
        return 'bg-green-50 text-green-700';
      case 'Presencial':
        return 'bg-orange-50 text-orange-700';
      default:
        return 'bg-gray-50 text-gray-700';
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
                Histórico de Interações
              </h1>
              <p className="font-paragraph text-lg text-primary-foreground/80">
                Registre e acompanhe todas as interações com clientes
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => resetForm()}
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-paragraph"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Nova Interação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-heading">
                    {editingId ? 'Editar Interação' : 'Nova Interação'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="font-paragraph text-sm text-primary-foreground/70 mb-1 block">
                      Data e Hora
                    </label>
                    <Input
                      type="datetime-local"
                      value={formData.interactionDate}
                      onChange={(e) => setFormData({ ...formData, interactionDate: e.target.value })}
                      className="font-paragraph"
                    />
                  </div>
                  <Select value={formData.interactionType} onValueChange={(value) => setFormData({ ...formData, interactionType: value })}>
                    <SelectTrigger className="font-paragraph">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Chamada">Chamada</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Reunião">Reunião</SelectItem>
                      <SelectItem value="Chat">Chat</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={formData.interactionMedium} onValueChange={(value) => setFormData({ ...formData, interactionMedium: value })}>
                    <SelectTrigger className="font-paragraph">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Telefone">Telefone</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Videoconferência">Videoconferência</SelectItem>
                      <SelectItem value="Presencial">Presencial</SelectItem>
                    </SelectContent>
                  </Select>
                  <textarea
                    placeholder="Descrição da Interação"
                    value={formData.interactionDescription}
                    onChange={(e) => setFormData({ ...formData, interactionDescription: e.target.value })}
                    className="w-full p-2 border border-border-gray rounded-lg font-paragraph text-sm"
                    rows={3}
                  />
                  <Input
                    placeholder="Resultado/Desfecho"
                    value={formData.interactionOutcome}
                    onChange={(e) => setFormData({ ...formData, interactionOutcome: e.target.value })}
                    className="font-paragraph"
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

      {/* Historico List */}
      <section className="w-full py-12">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-primary-foreground/5 rounded-xl h-40 animate-pulse"></div>
              ))}
            </div>
          ) : historico.length === 0 ? (
            <div className="text-center py-20">
              <History className="w-16 h-16 text-primary-foreground/30 mx-auto mb-4" />
              <h3 className="font-heading text-2xl text-primary-foreground mb-2">
                Nenhuma interação registrada
              </h3>
              <p className="font-paragraph text-base text-primary-foreground/60">
                Comece registrando uma nova interação
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {historico.map((item, index) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="bg-primary-foreground/5 rounded-xl p-6 border border-primary-foreground/10 hover:border-secondary/30 transition-all"
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <MessageSquare className="w-5 h-5 text-secondary flex-shrink-0 mt-1" />
                          <div>
                            <h3 className="font-heading text-lg text-primary-foreground font-semibold">
                              {item.interactionType}
                            </h3>
                            <p className="font-paragraph text-sm text-primary-foreground/60 mt-1">
                              {formatDateTime(item.interactionDate)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className={`text-xs font-paragraph px-2 py-1 rounded-full ${getTypeColor(item.interactionType || '')}`}>
                            {item.interactionType}
                          </span>
                          <span className={`text-xs font-paragraph px-2 py-1 rounded-full ${getMediumColor(item.interactionMedium || '')}`}>
                            {item.interactionMedium}
                          </span>
                        </div>
                      </div>

                      {item.interactionDescription && (
                        <div className="bg-primary-foreground/10 rounded-lg p-3">
                          <p className="font-paragraph text-xs text-primary-foreground/60 mb-1">
                            Descrição:
                          </p>
                          <p className="font-paragraph text-sm text-primary-foreground leading-relaxed">
                            {item.interactionDescription}
                          </p>
                        </div>
                      )}

                      {item.interactionOutcome && (
                        <div className="bg-primary-foreground/10 rounded-lg p-3">
                          <p className="font-paragraph text-xs text-primary-foreground/60 mb-1">
                            Resultado:
                          </p>
                          <p className="font-paragraph text-sm text-primary-foreground">
                            {item.interactionOutcome}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(item)}
                        variant="outline"
                        size="sm"
                        className="font-paragraph"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(item._id)}
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

export default function AdminHistoricoPage() {
  return (
    <MemberProtectedRoute messageToSignIn="Faça login para gerenciar histórico">
      <AdminHistoricoContent />
    </MemberProtectedRoute>
  );
}
