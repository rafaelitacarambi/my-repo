import { useEffect, useState } from 'react';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, ArrowLeft, Mail, Phone, Plus, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BaseCrudService } from '@/integrations';
import { Clients } from '@/entities';

function AdminClientesContent() {
  const [clientes, setClientes] = useState<Clients[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    clientName: '',
    email: '',
    phoneNumber: '',
    status: 'Ativo',
    address: '',
    notes: '',
  });

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      const { items } = await BaseCrudService.getAll<Clients>('clientes');
      setClientes(items);
    } catch (error) {
      console.error('Error loading clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await BaseCrudService.update('clientes', {
          _id: editingId,
          ...formData,
        });
      } else {
        await BaseCrudService.create('clientes', {
          _id: crypto.randomUUID(),
          ...formData,
        });
      }
      loadClientes();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving cliente:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await BaseCrudService.delete('clientes', id);
      loadClientes();
    } catch (error) {
      console.error('Error deleting cliente:', error);
    }
  };

  const handleEdit = (cliente: Clients) => {
    setEditingId(cliente._id);
    setFormData({
      clientName: cliente.clientName || '',
      email: cliente.email || '',
      phoneNumber: cliente.phoneNumber || '',
      status: cliente.status || 'Ativo',
      address: cliente.address || '',
      notes: cliente.notes || '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      clientName: '',
      email: '',
      phoneNumber: '',
      status: 'Ativo',
      address: '',
      notes: '',
    });
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
                Gestão de Clientes
              </h1>
              <p className="font-paragraph text-lg text-primary-foreground/80">
                Gerencie informações de clientes e histórico de contatos
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => resetForm()}
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-paragraph"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-heading">
                    {editingId ? 'Editar Cliente' : 'Novo Cliente'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Nome do Cliente"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="font-paragraph"
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="font-paragraph"
                  />
                  <Input
                    placeholder="Telefone"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="font-paragraph"
                  />
                  <Input
                    placeholder="Endereço"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="font-paragraph"
                  />
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger className="font-paragraph">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                      <SelectItem value="Suspenso">Suspenso</SelectItem>
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

      {/* Clientes List */}
      <section className="w-full py-12">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-primary-foreground/5 rounded-xl h-32 animate-pulse"></div>
              ))}
            </div>
          ) : clientes.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-16 h-16 text-primary-foreground/30 mx-auto mb-4" />
              <h3 className="font-heading text-2xl text-primary-foreground mb-2">
                Nenhum cliente cadastrado
              </h3>
              <p className="font-paragraph text-base text-primary-foreground/60">
                Comece adicionando um novo cliente
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {clientes.map((cliente, index) => (
                <motion.div
                  key={cliente._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="bg-primary-foreground/5 rounded-xl p-6 border border-primary-foreground/10 hover:border-secondary/30 transition-all"
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                    <div className="flex-1 space-y-3">
                      <h3 className="font-heading text-xl text-primary-foreground font-semibold">
                        {cliente.clientName}
                      </h3>
                      <div className="space-y-2">
                        {cliente.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-secondary flex-shrink-0" />
                            <a
                              href={`mailto:${cliente.email}`}
                              className="font-paragraph text-sm text-primary-foreground/70 hover:text-secondary transition-colors"
                            >
                              {cliente.email}
                            </a>
                          </div>
                        )}
                        {cliente.phoneNumber && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-secondary flex-shrink-0" />
                            <a
                              href={`tel:${cliente.phoneNumber}`}
                              className="font-paragraph text-sm text-primary-foreground/70 hover:text-secondary transition-colors"
                            >
                              {cliente.phoneNumber}
                            </a>
                          </div>
                        )}
                      </div>
                      {cliente.address && (
                        <p className="font-paragraph text-sm text-primary-foreground/60">
                          📍 {cliente.address}
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-2">
                        <span className="text-xs font-paragraph text-primary-foreground/50">Status:</span>
                        <span className={`text-xs font-paragraph px-2 py-1 rounded-full ${
                          cliente.status === 'Ativo' ? 'bg-green-100 text-green-800' :
                          cliente.status === 'Inativo' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {cliente.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(cliente)}
                        variant="outline"
                        size="sm"
                        className="font-paragraph"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(cliente._id)}
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

export default function AdminClientesPage() {
  return (
    <MemberProtectedRoute messageToSignIn="Faça login para gerenciar clientes">
      <AdminClientesContent />
    </MemberProtectedRoute>
  );
}
