import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { UsuriosdoSistema, Units } from '@/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Search, UserPlus, Edit, Trash2, Mail, Shield, Building2, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { UserRegistrationModal } from '@/components/UserRegistrationModal';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<UsuriosdoSistema[]>([]);
  const [units, setUnits] = useState<Units[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UsuriosdoSistema | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersResult, unitsResult] = await Promise.all([
        BaseCrudService.getAll<UsuriosdoSistema>('usuariossistema'),
        BaseCrudService.getAll<Units>('unidades')
      ]);
      setUsers(usersResult.items);
      setUnits(unitsResult.items);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: UsuriosdoSistema) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      await BaseCrudService.delete('usuariossistema', userId);
      setUsers(users.filter(u => u._id !== userId));
      toast({
        title: 'Sucesso',
        description: 'Usuário excluído com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o usuário',
        variant: 'destructive'
      });
    }
  };

  const handleSaveUser = async (userData: Partial<UsuriosdoSistema>) => {
    try {
      if (selectedUser) {
        await BaseCrudService.update('usuariossistema', {
          _id: selectedUser._id,
          ...userData
        });
        setUsers(users.map(u => u._id === selectedUser._id ? { ...u, ...userData } : u));
        toast({
          title: 'Sucesso',
          description: 'Usuário atualizado com sucesso'
        });
      } else {
        const newUser = await BaseCrudService.create('usuariossistema', {
          _id: crypto.randomUUID(),
          ...userData
        });
        setUsers([...users, newUser as UsuriosdoSistema]);
        toast({
          title: 'Sucesso',
          description: 'Usuário cadastrado com sucesso'
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o usuário',
        variant: 'destructive'
      });
    }
  };

  const getUnitName = (unitRef?: string) => {
    if (!unitRef) return 'Sem unidade';
    const unit = units.find(u => u._id === unitRef);
    return unit?.unitName || 'Unidade não encontrada';
  };

  const getStatusBadge = (status?: string) => {
    const statusConfig = {
      'Ativo': { variant: 'default' as const, color: 'bg-green-500' },
      'Pendente': { variant: 'secondary' as const, color: 'bg-yellow-500' },
      'Inativo': { variant: 'destructive' as const, color: 'bg-red-500' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Pendente'];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <span className={`w-2 h-2 rounded-full ${config.color}`}></span>
        {status || 'Pendente'}
      </Badge>
    );
  };

  const getProfileBadge = (profile?: string) => {
    const profileColors = {
      'Admin': 'bg-purple-100 text-purple-800',
      'Corretor': 'bg-green-100 text-green-800',
      'Operacional': 'bg-blue-100 text-blue-800',
      'Financeiro': 'bg-orange-100 text-orange-800'
    };

    const colorClass = profileColors[profile as keyof typeof profileColors] || 'bg-gray-100 text-gray-800';
    return (
      <Badge variant="outline" className={colorClass}>
        <Shield className="w-3 h-3 mr-1" />
        {profile || 'Não definido'}
      </Badge>
    );
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.emailLogin?.toLowerCase().includes(searchLower) ||
      user.profile?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-secondary/10 to-brandaccent/5 py-12">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/area-restrita')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Hub
              </Button>
            </div>
            <h1 className="font-heading text-4xl lg:text-5xl text-foreground mb-4">
              Gestão de Usuários do Sistema
            </h1>
            <p className="font-paragraph text-lg text-foreground/70">
              Gerencie usuários, permissões e integrações com Wix Members
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="w-full py-12">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/40 w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar por nome, email ou perfil..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleCreateUser} className="bg-secondary hover:bg-secondary/90">
              <UserPlus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </div>

          {/* Users List */}
          <div className="min-h-[400px]">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner />
              </div>
            ) : filteredUsers.length === 0 ? (
              <Card className="p-12 text-center">
                <UserPlus className="w-16 h-16 mx-auto mb-4 text-foreground/30" />
                <h3 className="font-heading text-xl text-foreground mb-2">
                  {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                </h3>
                <p className="font-paragraph text-foreground/60 mb-6">
                  {searchTerm
                    ? 'Tente ajustar os filtros de busca'
                    : 'Comece cadastrando o primeiro usuário do sistema'}
                </p>
                {!searchTerm && (
                  <Button onClick={handleCreateUser} className="bg-secondary hover:bg-secondary/90">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Cadastrar Primeiro Usuário
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredUsers.map((user, index) => (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="p-6 hover:shadow-lg transition-shadow">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                              <span className="font-heading text-xl text-secondary">
                                {user.name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-heading text-xl text-foreground mb-1">
                                {user.name || 'Nome não informado'}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                {getStatusBadge(user.status)}
                                {getProfileBadge(user.profile)}
                              </div>
                              <div className="space-y-1 text-sm text-foreground/60">
                                {user.emailLogin && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    <span>{user.emailLogin}</span>
                                  </div>
                                )}
                                {user.setores && user.setores.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {user.setores.map(sector => (
                                      <Badge key={sector} variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-blue-100">
                                        {sector}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                {user.lastLogin && (
                                  <div className="text-xs text-foreground/50">
                                    Último acesso: {format(new Date(user.lastLogin), 'dd/MM/yyyy HH:mm')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 lg:flex-col">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            className="flex-1 lg:flex-none"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user._id)}
                            className="flex-1 lg:flex-none"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          {!isLoading && users.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <Card className="p-4 text-center">
                <div className="text-2xl font-heading text-secondary mb-1">
                  {users.length}
                </div>
                <div className="text-sm text-foreground/60">Total de Usuários</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-heading text-green-600 mb-1">
                  {users.filter(u => u.status === 'Ativo').length}
                </div>
                <div className="text-sm text-foreground/60">Ativos</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-heading text-yellow-600 mb-1">
                  {users.filter(u => u.status === 'Pendente').length}
                </div>
                <div className="text-sm text-foreground/60">Pendentes</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-heading text-red-600 mb-1">
                  {users.filter(u => u.status === 'Inativo').length}
                </div>
                <div className="text-sm text-foreground/60">Inativos</div>
              </Card>
            </motion.div>
          )}
        </div>
      </section>

      <Footer />

      <UserRegistrationModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={handleSaveUser}
        user={selectedUser}
        units={units}
      />
    </div>
  );
}
