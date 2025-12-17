import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import { useMember } from '@/integrations';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User, Mail, Calendar, ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function PerfilContent() {
  const { member, actions } = useMember();

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
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

          <div>
            <h1 className="font-heading text-4xl lg:text-5xl text-secondary mb-4">
              Meu Perfil
            </h1>
            <p className="font-paragraph text-lg text-primary-foreground/80">
              Visualize suas informações pessoais
            </p>
          </div>
        </div>
      </section>

      {/* Profile Content */}
      <section className="w-full py-12">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-1"
            >
              <div className="bg-primary-foreground/5 rounded-2xl p-8 border border-primary-foreground/10 text-center">
                <div className="w-32 h-32 mx-auto mb-6 bg-primary-foreground/10 rounded-full flex items-center justify-center overflow-hidden">
                  {member?.profile?.photo?.url ? (
                    <Image
                      src={member.profile.photo.url}
                      alt={member?.profile?.nickname || 'Perfil'}
                      className="w-full h-full object-cover"
                      width={128}
                    />
                  ) : (
                    <User className="w-16 h-16 text-primary-foreground/30" />
                  )}
                </div>

                <h2 className="font-heading text-2xl text-primary-foreground mb-2 font-semibold">
                  {member?.profile?.nickname || member?.contact?.firstName || 'Usuário'}
                </h2>

                {member?.profile?.title && (
                  <p className="font-paragraph text-base text-primary-foreground/60 mb-6">
                    {member.profile.title}
                  </p>
                )}

                <Button
                  onClick={actions.logout}
                  variant="outline"
                  className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Sair
                </Button>
              </div>
            </motion.div>

            {/* Information */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-2 space-y-6"
            >
              <div className="bg-primary-foreground/5 rounded-2xl p-8 border border-primary-foreground/10">
                <h3 className="font-heading text-2xl text-secondary mb-6 font-semibold">
                  Informações Pessoais
                </h3>

                <div className="space-y-6">
                  {member?.contact?.firstName && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <p className="font-paragraph text-sm text-primary-foreground/60 mb-1">
                          Nome
                        </p>
                        <p className="font-paragraph text-base text-primary-foreground">
                          {member.contact.firstName} {member.contact.lastName || ''}
                        </p>
                      </div>
                    </div>
                  )}

                  {member?.loginEmail && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <p className="font-paragraph text-sm text-primary-foreground/60 mb-1">
                          E-mail
                        </p>
                        <p className="font-paragraph text-base text-primary-foreground">
                          {member.loginEmail}
                        </p>
                        {member.loginEmailVerified && (
                          <span className="inline-block mt-1 font-paragraph text-xs text-secondary bg-secondary/20 px-2 py-1 rounded">
                            Verificado
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {member?._createdDate && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <p className="font-paragraph text-sm text-primary-foreground/60 mb-1">
                          Membro desde
                        </p>
                        <p className="font-paragraph text-base text-primary-foreground">
                          {formatDate(member._createdDate)}
                        </p>
                      </div>
                    </div>
                  )}

                  {member?.lastLoginDate && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <p className="font-paragraph text-sm text-primary-foreground/60 mb-1">
                          Último acesso
                        </p>
                        <p className="font-paragraph text-base text-primary-foreground">
                          {formatDate(member.lastLoginDate)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-2xl p-8 border border-secondary/20">
                <h3 className="font-heading text-xl text-secondary mb-4 font-semibold">
                  Acesso Rápido
                </h3>
                <p className="font-paragraph text-base text-primary-foreground/80 mb-6 leading-relaxed">
                  Gerencie imóveis, leads, processos e muito mais através da área restrita
                </p>
                <Link to="/area-restrita">
                  <Button className="bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90 font-paragraph font-semibold h-12 px-6 rounded-lg">
                    Ir para Área Restrita
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function PerfilPage() {
  return (
    <MemberProtectedRoute messageToSignIn="Faça login para ver seu perfil">
      <PerfilContent />
    </MemberProtectedRoute>
  );
}
