import { useEffect, useState } from 'react';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BaseCrudService } from '@/integrations';
import { ProcessosdeVenda } from '@/entities';

function AdminProcessosContent() {
  const [processes, setProcesses] = useState<ProcessosdeVenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<ProcessosdeVenda | null>(null);
  const [formData, setFormData] = useState<Partial<ProcessosdeVenda>>({
    processTitle: '',
    currentStatus: 'Em Andamento',
    startDate: '',
    lastUpdateDate: '',
    processStage: 'Negociação',
    expectedClosingDate: '',
    notes: '',
  });

  useEffect(() => {
    loadProcesses();
  }, []);

  const loadProcesses = async () => {
    try {
      const { items } = await BaseCrudService.getAll<ProcessosdeVenda>('processosdevenda');
      setProcesses(items);
    } catch (error) {
      console.error('Error loading processes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingProcess) {
        await BaseCrudService.update('processosdevenda', {
          _id: editingProcess._id,
          ...formData,
          lastUpdateDate: new Date().toISOString(),
        });
      } else {
        await BaseCrudService.create('processosdevenda', {
          _id: crypto.randomUUID(),
          ...formData,
          startDate: formData.startDate || new Date().toISOString(),
          lastUpdateDate: new Date().toISOString(),
        });
      }

      setDialogOpen(false);
      setEditingProcess(null);
      resetForm();
      loadProcesses();
    } catch (error) {
      console.error('Error saving process:', error);
    }
  };

  const handleEdit = (process: ProcessosdeVenda) => {
    setEditingProcess(process);
    setFormData({
      processTitle: process.processTitle,
      currentStatus: process.currentStatus,
      startDate: process.startDate ? new Date(process.startDate).toISOString().split('T')[0] : '',
      processStage: process.processStage,
      expectedClosingDate: process.expectedClosingDate ? new Date(process.expectedClosingDate).toISOString().split('T')[0] : '',
      notes: process.notes,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este processo?')) return;

    try {
      await BaseCrudService.delete('processosdevenda', id);
      loadProcesses();
    } catch (error) {
      console.error('Error deleting process:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      processTitle: '',
      currentStatus: 'Em Andamento',
      startDate: '',
      lastUpdateDate: '',
      processStage: 'Negociação',
      expectedClosingDate: '',
      notes: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-primary">
      <Header />

      {/* Header */}
      <section className="w-full bg-gradient-to-br from-brandaccent/10 to-secondary/5 py-12">
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

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="font-heading text-4xl lg:text-5xl text-secondary mb-4">
                Gestão de Processos
              </h1>
              <p className="font-paragraph text-lg text-primary-foreground/80">
                Acompanhe processos de venda e locação
              </p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setEditingProcess(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90 font-paragraph font-semibold h-12 px-6 rounded-lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Novo Processo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-primary border-primary-foreground/20">
                <DialogHeader>
                  <DialogTitle className="font-heading text-2xl text-secondary">
                    {editingProcess ? 'Editar Processo' : 'Novo Processo'}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="processTitle" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                      Título do Processo *
                    </Label>
                    <Input
                      id="processTitle"
                      name="processTitle"
                      required
                      value={formData.processTitle}
                      onChange={handleChange}
                      className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currentStatus" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                        Status *
                      </Label>
                      <Select
                        value={formData.currentStatus}
                        onValueChange={(value) => setFormData({ ...formData, currentStatus: value })}
                      >
                        <SelectTrigger className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                          <SelectItem value="Concluído">Concluído</SelectItem>
                          <SelectItem value="Cancelado">Cancelado</SelectItem>
                          <SelectItem value="Pausado">Pausado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="processStage" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                        Etapa *
                      </Label>
                      <Select
                        value={formData.processStage}
                        onValueChange={(value) => setFormData({ ...formData, processStage: value })}
                      >
                        <SelectTrigger className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Negociação">Negociação</SelectItem>
                          <SelectItem value="Proposta">Proposta</SelectItem>
                          <SelectItem value="Documentação">Documentação</SelectItem>
                          <SelectItem value="Financiamento">Financiamento</SelectItem>
                          <SelectItem value="Assinatura">Assinatura</SelectItem>
                          <SelectItem value="Finalizado">Finalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="startDate" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                        Data de Início
                      </Label>
                      <Input
                        id="startDate"
                        name="startDate"
                        type="date"
                        value={typeof formData.startDate === 'string' ? formData.startDate : formData.startDate instanceof Date ? formData.startDate.toISOString().split('T')[0] : ''}
                        onChange={handleChange}
                        className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                      />
                    </div>

                    <div>
                      <Label htmlFor="expectedClosingDate" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                        Data Prevista de Fechamento
                      </Label>
                      <Input
                        id="expectedClosingDate"
                        name="expectedClosingDate"
                        type="date"
                        value={typeof formData.expectedClosingDate === 'string' ? formData.expectedClosingDate : formData.expectedClosingDate instanceof Date ? formData.expectedClosingDate.toISOString().split('T')[0] : ''}
                        onChange={handleChange}
                        className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes" className="font-paragraph text-sm text-primary-foreground mb-2 block">
                      Observações
                    </Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={4}
                      className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      className="flex-1 bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90 font-paragraph font-semibold h-12 rounded-lg"
                    >
                      {editingProcess ? 'Atualizar' : 'Cadastrar'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        setEditingProcess(null);
                        resetForm();
                      }}
                      className="flex-1 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 h-12 rounded-lg"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Processes List */}
      <section className="w-full py-12">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-primary-foreground/5 rounded-xl h-32 animate-pulse"></div>
              ))}
            </div>
          ) : processes.length === 0 ? (
            <div className="text-center py-20">
              <TrendingUp className="w-16 h-16 text-primary-foreground/30 mx-auto mb-4" />
              <h3 className="font-heading text-2xl text-primary-foreground mb-2">
                Nenhum processo cadastrado
              </h3>
              <p className="font-paragraph text-base text-primary-foreground/60">
                Clique em "Novo Processo" para começar
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processes.map((process, index) => (
                <motion.div
                  key={process._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="bg-primary-foreground/5 rounded-xl p-6 border border-primary-foreground/10 hover:border-secondary/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-heading text-lg text-primary-foreground font-semibold flex-1">
                      {process.processTitle}
                    </h3>
                    <span className={`font-paragraph text-xs px-2 py-1 rounded flex-shrink-0 ml-2 ${
                      process.currentStatus === 'Em Andamento'
                        ? 'bg-brandaccent text-foreground'
                        : process.currentStatus === 'Concluído'
                        ? 'bg-secondary text-secondary-foreground'
                        : 'bg-destructive text-destructiveforeground'
                    }`}>
                      {process.currentStatus}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 text-sm text-primary-foreground/70">
                    <p>Etapa: <span className="text-primary-foreground">{process.processStage}</span></p>
                    <p>Início: {formatDate(process.startDate)}</p>
                    {process.expectedClosingDate && (
                      <p>Previsão: {formatDate(process.expectedClosingDate)}</p>
                    )}
                    {process.lastUpdateDate && (
                      <p className="text-xs text-primary-foreground/50">
                        Atualizado: {formatDate(process.lastUpdateDate)}
                      </p>
                    )}
                  </div>

                  {process.notes && (
                    <p className="font-paragraph text-sm text-primary-foreground/70 mb-4 line-clamp-2">
                      {process.notes}
                    </p>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-primary-foreground/10">
                    <Button
                      onClick={() => handleEdit(process)}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleDelete(process._id)}
                      variant="outline"
                      size="sm"
                      className="border-destructive/50 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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

export default function AdminProcessosPage() {
  return (
    <MemberProtectedRoute messageToSignIn="Faça login para gerenciar processos">
      <AdminProcessosContent />
    </MemberProtectedRoute>
  );
}
