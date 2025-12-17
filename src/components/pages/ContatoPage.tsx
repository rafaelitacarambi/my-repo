import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BaseCrudService } from '@/integrations';
import { LeadsdeContato } from '@/entities';

export default function ContatoPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    message: '',
    propertyOfInterest: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const lead: LeadsdeContato = {
        _id: crypto.randomUUID(),
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        message: formData.message,
        propertyOfInterest: formData.propertyOfInterest,
        leadSource: 'Website - Formulário de Contato',
        leadStatus: 'Novo',
        submissionDate: new Date().toISOString(),
      };

      await BaseCrudService.create('leadsdecontato', lead);
      setSubmitted(true);
      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '',
        message: '',
        propertyOfInterest: '',
      });
    } catch (error) {
      console.error('Error submitting contact form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="w-full bg-ice-gray py-16">
        <div className="max-w-[100rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-secondary rounded-none flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8 text-foreground" />
            </div>
            <h1 className="font-heading text-5xl lg:text-6xl text-secondary mb-6 font-bold">
              Entre em Contato
            </h1>
            <p className="font-paragraph text-lg text-dark-gray max-w-2xl mx-auto">
              Estamos prontos para ajudar você a encontrar o imóvel ideal. Preencha o formulário ou use nossos canais de contato
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="w-full py-16">
        <div className="max-w-[100rem] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              {submitted ? (
                <div className="bg-ice-gray rounded-none p-12 border border-matte-silver text-center">
                  <CheckCircle className="w-16 h-16 text-secondary mx-auto mb-6" />
                  <h2 className="font-heading text-3xl text-secondary mb-4 font-semibold">
                    Mensagem Enviada!
                  </h2>
                  <p className="font-paragraph text-base text-dark-gray mb-8 leading-relaxed">
                    Obrigado pelo contato! Nossa equipe entrará em contato em breve.
                  </p>
                  <Button
                    onClick={() => setSubmitted(false)}
                    className="bg-secondary text-foreground hover:bg-black font-paragraph font-semibold h-12 px-6 rounded-none"
                  >
                    Enviar Nova Mensagem
                  </Button>
                </div>
              ) : (
                <div className="bg-ice-gray rounded-none p-8 border border-matte-silver">
                  <h2 className="font-heading text-2xl text-secondary mb-8 font-semibold">
                    Envie Sua Mensagem
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="fullName" className="font-paragraph text-base text-secondary mb-2 block font-semibold">
                        Nome Completo *
                      </Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Seu nome completo"
                        className="h-12 bg-white border-matte-silver text-secondary placeholder:text-medium-gray rounded-none"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="font-paragraph text-base text-secondary mb-2 block font-semibold">
                        E-mail *
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="seu@email.com"
                        className="h-12 bg-white border-matte-silver text-secondary placeholder:text-medium-gray rounded-none"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phoneNumber" className="font-paragraph text-base text-secondary mb-2 block font-semibold">
                        Telefone *
                      </Label>
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        required
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="(11) 98765-4321"
                        className="h-12 bg-white border-matte-silver text-secondary placeholder:text-medium-gray rounded-none"
                      />
                    </div>

                    <div>
                      <Label htmlFor="propertyOfInterest" className="font-paragraph text-base text-secondary mb-2 block font-semibold">
                        Imóvel de Interesse (opcional)
                      </Label>
                      <Input
                        id="propertyOfInterest"
                        name="propertyOfInterest"
                        type="text"
                        value={formData.propertyOfInterest}
                        onChange={handleChange}
                        placeholder="Nome ou código do imóvel"
                        className="h-12 bg-white border-matte-silver text-secondary placeholder:text-medium-gray rounded-none"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message" className="font-paragraph text-base text-secondary mb-2 block font-semibold">
                        Mensagem *
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Como podemos ajudar você?"
                        rows={6}
                        className="bg-white border-matte-silver text-secondary placeholder:text-medium-gray rounded-none resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-secondary text-foreground hover:bg-black font-paragraph font-semibold h-14 rounded-none text-base disabled:opacity-50"
                    >
                      {submitting ? (
                        'Enviando...'
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Enviar Mensagem
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              )}
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-ice-gray rounded-none p-8 border border-matte-silver">
                <h2 className="font-heading text-2xl text-secondary mb-8 font-semibold">
                  Informações de Contato
                </h2>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-secondary rounded-none flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg text-secondary mb-2 font-semibold">
                        Telefone
                      </h3>
                      <a
                        href="tel:+551134567890"
                        className="font-paragraph text-base text-dark-gray hover:text-secondary transition-colors"
                      >
                        (11) 3456-7890
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-secondary rounded-none flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg text-secondary mb-2 font-semibold">
                        E-mail
                      </h3>
                      <a
                        href="mailto:contato@rsalesimoveiscom.br"
                        className="font-paragraph text-base text-dark-gray hover:text-secondary transition-colors"
                      >
                        contato@rsalesimoveiscom.br
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-secondary rounded-none flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg text-secondary mb-2 font-semibold">
                        Endereço
                      </h3>
                      <p className="font-paragraph text-base text-dark-gray leading-relaxed">
                        Av. Paulista, 1000<br />
                        São Paulo, SP<br />
                        CEP: 01310-100
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-secondary rounded-none p-8 border border-matte-silver">
                <h3 className="font-heading text-xl text-foreground mb-4 font-semibold">
                  Horário de Atendimento
                </h3>
                <div className="space-y-2 font-paragraph text-base text-foreground">
                  <p>Segunda a Sexta: 9h às 18h</p>
                  <p>Sábado: 9h às 13h</p>
                  <p>Domingo: Fechado</p>
                </div>
              </div>

              <div className="bg-ice-gray rounded-none p-8 border border-matte-silver">
                <h3 className="font-heading text-xl text-secondary mb-4 font-semibold">
                  Precisa de Ajuda Imediata?
                </h3>
                <p className="font-paragraph text-base text-dark-gray mb-6 leading-relaxed">
                  Nossa equipe está disponível para atender você via WhatsApp
                </p>
                <a
                  href="https://wa.me/5511987654321"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full bg-secondary text-foreground hover:bg-black font-paragraph font-semibold h-12 rounded-none">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Falar no WhatsApp
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
