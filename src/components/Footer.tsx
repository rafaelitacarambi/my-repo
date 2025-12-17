import { Building2, Mail, Phone, MapPin, Facebook, Instagram, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-primary border-t border-primary-foreground/10">
      <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-secondary-foreground" />
              </div>
              <span className="font-heading text-xl text-primary-foreground font-bold">
                ImóvelPrime
              </span>
            </div>
            <p className="font-paragraph text-base text-primary-foreground/80 leading-relaxed">
              Sua parceira de confiança em soluções imobiliárias. Especialistas em financiamento Caixa e atendimento personalizado.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading text-lg text-secondary mb-6 font-semibold">
              Links Rápidos
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/imoveis"
                  className="font-paragraph text-base text-primary-foreground/80 hover:text-secondary transition-colors"
                >
                  Imóveis
                </Link>
              </li>
              <li>
                <Link
                  to="/simulador"
                  className="font-paragraph text-base text-primary-foreground/80 hover:text-secondary transition-colors"
                >
                  Simulador de Financiamento
                </Link>
              </li>
              <li>
                <Link
                  to="/corretores"
                  className="font-paragraph text-base text-primary-foreground/80 hover:text-secondary transition-colors"
                >
                  Nossos Corretores
                </Link>
              </li>
              <li>
                <Link
                  to="/contato"
                  className="font-paragraph text-base text-primary-foreground/80 hover:text-secondary transition-colors"
                >
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-heading text-lg text-secondary mb-6 font-semibold">
              Contato
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                <span className="font-paragraph text-base text-primary-foreground/80">
                  (11) 3456-7890
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                <span className="font-paragraph text-base text-primary-foreground/80">
                  contato@imovelprime.com.br
                </span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                <span className="font-paragraph text-base text-primary-foreground/80">
                  Av. Paulista, 1000 - São Paulo, SP
                </span>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="font-heading text-lg text-secondary mb-6 font-semibold">
              Redes Sociais
            </h3>
            <div className="flex gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-primary-foreground/10 hover:bg-secondary rounded-lg flex items-center justify-center transition-colors group"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5 text-primary-foreground group-hover:text-secondary-foreground" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-primary-foreground/10 hover:bg-secondary rounded-lg flex items-center justify-center transition-colors group"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 text-primary-foreground group-hover:text-secondary-foreground" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-primary-foreground/10 hover:bg-secondary rounded-lg flex items-center justify-center transition-colors group"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5 text-primary-foreground group-hover:text-secondary-foreground" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-paragraph text-sm text-primary-foreground/60">
              © {new Date().getFullYear()} ImóvelPrime. Todos os direitos reservados.
            </p>
            <p className="font-paragraph text-sm text-primary-foreground/60">
              CRECI: 12345-J | CNPJ: 12.345.678/0001-90
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
