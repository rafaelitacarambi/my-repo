import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { BaseCrudService } from '@/integrations';
import { UsuriosdoSistema } from '@/entities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';

export default function DiagnosticoUsuarioPage() {
  const { member, isAuthenticated, isLoading: memberLoading } = useMember();
  const [usuarios, setUsuarios] = useState<UsuriosdoSistema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [diagnostico, setDiagnostico] = useState<any>(null);
  const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { items } = await BaseCrudService.getAll<UsuriosdoSistema>('usuariossistema');
      setUsuarios(items);
      
      if (member && isAuthenticated) {
        analisarSituacao(items);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const analisarSituacao = (usuarios: UsuriosdoSistema[]) => {
    const memberEmail = member?.loginEmail;
    const memberId = member?._id;

    // Buscar usuário por email
    const usuarioPorEmail = usuarios.find(
      u => u.emailLogin?.toLowerCase() === memberEmail?.toLowerCase()
    );

    // Buscar usuário por memberRef
    const usuarioPorMemberRef = usuarios.find(
      u => u.memberRef === memberId
    );

    const resultado = {
      memberEmail,
      memberId,
      usuarioPorEmail,
      usuarioPorMemberRef,
      problemas: [] as string[],
      solucoes: [] as string[]
    };

    // Análise de problemas
    if (!usuarioPorEmail && !usuarioPorMemberRef) {
      resultado.problemas.push('Usuário não encontrado na coleção usuariossistema');
      resultado.solucoes.push('Criar novo registro de usuário com perfil Admin');
    } else {
      const usuario = usuarioPorEmail || usuarioPorMemberRef;
      
      if (!usuario?.ativo) {
        resultado.problemas.push('Usuário está inativo');
        resultado.solucoes.push('Ativar o usuário');
      }

      if (usuario?.profile?.toLowerCase() !== 'admin') {
        resultado.problemas.push(`Perfil atual: ${usuario?.profile || 'não definido'} (deveria ser Admin)`);
        resultado.solucoes.push('Alterar perfil para Admin');
      }

      if (usuarioPorEmail && !usuarioPorEmail.memberRef) {
        resultado.problemas.push('Campo memberRef não está vinculado');
        resultado.solucoes.push('Vincular memberRef ao membro autenticado');
      }

      if (usuarioPorMemberRef && !usuarioPorMemberRef.emailLogin) {
        resultado.problemas.push('Campo emailLogin não está preenchido');
        resultado.solucoes.push('Preencher emailLogin com o email do membro');
      }
    }

    setDiagnostico(resultado);
  };

  const corrigirProblemas = async () => {
    if (!diagnostico || !member) return;

    try {
      const usuario = diagnostico.usuarioPorEmail || diagnostico.usuarioPorMemberRef;

      if (!usuario) {
        // Criar novo usuário
        await BaseCrudService.create('usuariossistema', {
          _id: crypto.randomUUID(),
          name: member.profile?.nickname || member.loginEmail || 'Administrador',
          emailLogin: member.loginEmail,
          memberRef: member._id,
          profile: 'Admin',
          ativo: true,
          status: 'Ativo',
          inviteDate: new Date().toISOString()
        });
        
        toast({
          title: 'Sucesso',
          description: 'Usuário administrador criado com sucesso'
        });
      } else {
        // Atualizar usuário existente
        await BaseCrudService.update('usuariossistema', {
          _id: usuario._id,
          name: usuario.name || member.profile?.nickname || member.loginEmail || 'Administrador',
          emailLogin: member.loginEmail,
          memberRef: member._id,
          profile: 'Admin',
          ativo: true,
          status: 'Ativo'
        });
        
        toast({
          title: 'Sucesso',
          description: 'Usuário atualizado para administrador com sucesso'
        });
      }

      // Recarregar dados
      await loadData();
    } catch (error) {
      console.error('Erro ao corrigir problemas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível corrigir os problemas',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    if (!memberLoading && isAuthenticated) {
      loadData();
    }
  }, [memberLoading, isAuthenticated]);

  if (memberLoading || isLoading) {
    return (
      <div className="min-h-screen bg-primary">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-primary">
        <Header />
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-16">
          <Alert variant="destructive">
            <AlertDescription>
              Você precisa estar autenticado para acessar esta página
            </AlertDescription>
          </Alert>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      <Header />
      
      <main className="max-w-[120rem] mx-auto px-6 lg:px-12 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="font-heading text-4xl font-bold text-foreground mb-4">
              Diagnóstico de Usuário
            </h1>
            <p className="font-paragraph text-lg text-dark-gray">
              Análise e correção de problemas de autenticação administrativa
            </p>
          </div>

          {/* Informações do Membro */}
          <Card className="p-6">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
              Informações do Membro Autenticado
            </h2>
            <div className="space-y-2 font-paragraph">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Email:</span>
                <span>{member?.loginEmail || 'Não disponível'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">ID do Membro:</span>
                <span className="text-sm text-dark-gray">{member?._id || 'Não disponível'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Nome:</span>
                <span>{member?.profile?.nickname || 'Não disponível'}</span>
              </div>
            </div>
          </Card>

          {/* Diagnóstico */}
          {diagnostico && (
            <Card className="p-6">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
                Resultado do Diagnóstico
              </h2>

              {/* Status */}
              <div className="mb-6">
                {diagnostico.problemas.length === 0 ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-paragraph font-semibold">
                      Tudo está configurado corretamente!
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-destructive">
                    <XCircle className="w-5 h-5" />
                    <span className="font-paragraph font-semibold">
                      {diagnostico.problemas.length} problema(s) encontrado(s)
                    </span>
                  </div>
                )}
              </div>

              {/* Problemas Encontrados */}
              {diagnostico.problemas.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-3">
                    Problemas Encontrados:
                  </h3>
                  <ul className="space-y-2">
                    {diagnostico.problemas.map((problema: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 font-paragraph">
                        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                        <span>{problema}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Soluções Propostas */}
              {diagnostico.solucoes.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-3">
                    Soluções Propostas:
                  </h3>
                  <ul className="space-y-2">
                    {diagnostico.solucoes.map((solucao: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 font-paragraph">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{solucao}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Informações do Usuário Encontrado */}
              {(diagnostico.usuarioPorEmail || diagnostico.usuarioPorMemberRef) && (
                <div className="mb-6 p-4 bg-light-gray rounded-lg">
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-3">
                    Registro Encontrado:
                  </h3>
                  <div className="space-y-2 font-paragraph text-sm">
                    {diagnostico.usuarioPorEmail && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Nome:</span>
                          <span>{diagnostico.usuarioPorEmail.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Email:</span>
                          <span>{diagnostico.usuarioPorEmail.emailLogin}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Perfil:</span>
                          <Badge variant={diagnostico.usuarioPorEmail.profile === 'Admin' ? 'default' : 'secondary'}>
                            {diagnostico.usuarioPorEmail.profile || 'Não definido'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Status:</span>
                          <Badge variant={diagnostico.usuarioPorEmail.ativo ? 'default' : 'destructive'}>
                            {diagnostico.usuarioPorEmail.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">MemberRef:</span>
                          <span className="text-dark-gray">
                            {diagnostico.usuarioPorEmail.memberRef || 'Não vinculado'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Botão de Correção */}
              {diagnostico.problemas.length > 0 && (
                <div className="flex justify-end">
                  <Button
                    onClick={corrigirProblemas}
                    className="bg-buttonbackground hover:bg-buttonbackground/90 text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Corrigir Problemas Automaticamente
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* Todos os Usuários */}
          <Card className="p-6">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
              Todos os Usuários do Sistema
            </h2>
            <div className="space-y-3">
              {usuarios.map((usuario) => (
                <div
                  key={usuario._id}
                  className="p-4 bg-light-gray rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-paragraph font-semibold text-foreground">
                      {usuario.name}
                    </span>
                    <div className="flex gap-2">
                      <Badge variant={usuario.profile === 'Admin' ? 'default' : 'secondary'}>
                        {usuario.profile || 'Sem perfil'}
                      </Badge>
                      <Badge variant={usuario.ativo ? 'default' : 'destructive'}>
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm font-paragraph text-dark-gray space-y-1">
                    <div>Email: {usuario.emailLogin || 'Não definido'}</div>
                    <div>MemberRef: {usuario.memberRef || 'Não vinculado'}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Alert>
            <AlertDescription className="font-paragraph">
              <strong>Nota:</strong> Após corrigir os problemas, faça logout e login novamente para que as alterações tenham efeito.
            </AlertDescription>
          </Alert>
        </div>
      </main>

      <Footer />
    </div>
  );
}
