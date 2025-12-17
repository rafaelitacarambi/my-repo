import { useEffect, useState } from 'react';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, ArrowLeft, Mail, Phone, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BaseCrudService } from '@/integrations';
import { LeadsdeContato } from '@/entities';

function AdminLeadsContent() {
  const [leads, setLeads] = useState<LeadsdeContato[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const { items } = await BaseCrudService.getAll<LeadsdeContato>('leadsdecontato');
      setLeads(items.sort((a, b) => {
        const dateA = a.submissionDate ? new Date(a.submissionDate).getTime() : 0;
        const dateB = b.submissionDate ? new Date(b.submissionDate).getTime() : 0;
        return dateB - dateA;
      }));
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      await BaseCrudService.update('leadsdecontato', {
        _id: leadId,
        leadStatus: newStatus,
      });
      loadLeads();
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Data não disponível';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
              Gestão de Leads
            </h1>
            <p className="font-paragraph text-lg text-primary-foreground/80">
              Visualize e gerencie leads de contato
            </p>
          </div>
        </div>
      </section>

      {/* Leads List */}
      <section className="w-full py-12">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-primary-foreground/5 rounded-xl h-48 animate-pulse"></div>
              ))}
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-16 h-16 text-primary-foreground/30 mx-auto mb-4" />
              <h3 className="font-heading text-2xl text-primary-foreground mb-2">
                Nenhum lead cadastrado
              </h3>
              <p className="font-paragraph text-base text-primary-foreground/60">
                Leads enviados pelo formulário de contato aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {leads.map((lead, index) => (
                <motion.div
                  key={lead._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="bg-primary-foreground/5 rounded-xl p-6 border border-primary-foreground/10 hover:border-secondary/30 transition-all"
                >
                  <div className="flex flex-col lg:flex-row justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-heading text-xl text-primary-foreground font-semibold mb-2">
                            {lead.fullName}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-primary-foreground/60 mb-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(lead.submissionDate)}</span>
                          </div>
                        </div>
                        <div className="w-40">
                          <Select
                            value={lead.leadStatus}
                            onValueChange={(value) => updateLeadStatus(lead._id, value)}
                          >
                            <SelectTrigger className="h-9 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Novo">Novo</SelectItem>
                              <SelectItem value="Em Contato">Em Contato</SelectItem>
                              <SelectItem value="Qualificado">Qualificado</SelectItem>
                              <SelectItem value="Convertido">Convertido</SelectItem>
                              <SelectItem value="Perdido">Perdido</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-secondary flex-shrink-0" />
                          <a
                            href={`mailto:${lead.email}`}
                            className="font-paragraph text-sm text-primary-foreground/70 hover:text-secondary transition-colors"
                          >
                            {lead.email}
                          </a>
                        </div>
                        {lead.phoneNumber && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-secondary flex-shrink-0" />
                            <a
                              href={`tel:${lead.phoneNumber}`}
                              className="font-paragraph text-sm text-primary-foreground/70 hover:text-secondary transition-colors"
                            >
                              {lead.phoneNumber}
                            </a>
                          </div>
                        )}
                      </div>

                      {lead.propertyOfInterest && (
                        <div className="bg-primary-foreground/10 rounded-lg p-3">
                          <p className="font-paragraph text-xs text-primary-foreground/60 mb-1">
                            Imóvel de Interesse:
                          </p>
                          <p className="font-paragraph text-sm text-primary-foreground">
                            {lead.propertyOfInterest}
                          </p>
                        </div>
                      )}

                      {lead.message && (
                        <div className="bg-primary-foreground/10 rounded-lg p-3">
                          <p className="font-paragraph text-xs text-primary-foreground/60 mb-1">
                            Mensagem:
                          </p>
                          <p className="font-paragraph text-sm text-primary-foreground leading-relaxed">
                            {lead.message}
                          </p>
                        </div>
                      )}

                      {lead.leadSource && (
                        <p className="font-paragraph text-xs text-primary-foreground/50">
                          Origem: {lead.leadSource}
                        </p>
                      )}
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

export default function AdminLeadsPage() {
  return (
    <MemberProtectedRoute messageToSignIn="Faça login para gerenciar leads">
      <AdminLeadsContent />
    </MemberProtectedRoute>
  );
}
