import { Link, useLocation } from 'react-router-dom';
import { Building2, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-primary border-b border-border-gray sticky top-0 z-50">
      <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-secondary-foreground" />
            </div>
            <span className="font-heading text-xl text-primary-foreground font-bold">
              ImóvelPrime
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link
              to="/imoveis"
              className={`font-paragraph text-base transition-colors ${
                isActive('/imoveis')
                  ? 'text-secondary'
                  : 'text-primary-foreground hover:text-secondary'
              }`}
            >
              Imóveis
            </Link>
            <Link
              to="/simulador"
              className={`font-paragraph text-base transition-colors ${
                isActive('/simulador')
                  ? 'text-secondary'
                  : 'text-primary-foreground hover:text-secondary'
              }`}
            >
              Simulador
            </Link>
            <Link
              to="/corretores"
              className={`font-paragraph text-base transition-colors ${
                isActive('/corretores')
                  ? 'text-secondary'
                  : 'text-primary-foreground hover:text-secondary'
              }`}
            >
              Corretores
            </Link>
            <Link
              to="/contato"
              className={`font-paragraph text-base transition-colors ${
                isActive('/contato')
                  ? 'text-secondary'
                  : 'text-primary-foreground hover:text-secondary'
              }`}
            >
              Contato
            </Link>
            <Link to="/area-restrita">
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-paragraph font-semibold h-11 px-6 rounded-lg">
                Área Restrita
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-primary-foreground p-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-6 border-t border-border-gray">
            <div className="flex flex-col gap-4">
              <Link
                to="/imoveis"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-paragraph text-base py-2 transition-colors ${
                  isActive('/imoveis')
                    ? 'text-secondary'
                    : 'text-primary-foreground hover:text-secondary'
                }`}
              >
                Imóveis
              </Link>
              <Link
                to="/simulador"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-paragraph text-base py-2 transition-colors ${
                  isActive('/simulador')
                    ? 'text-secondary'
                    : 'text-primary-foreground hover:text-secondary'
                }`}
              >
                Simulador
              </Link>
              <Link
                to="/corretores"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-paragraph text-base py-2 transition-colors ${
                  isActive('/corretores')
                    ? 'text-secondary'
                    : 'text-primary-foreground hover:text-secondary'
                }`}
              >
                Corretores
              </Link>
              <Link
                to="/contato"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-paragraph text-base py-2 transition-colors ${
                  isActive('/contato')
                    ? 'text-secondary'
                    : 'text-primary-foreground hover:text-secondary'
                }`}
              >
                Contato
              </Link>
              <Link to="/area-restrita" onClick={() => setMobileMenuOpen(false)}>
                <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-paragraph font-semibold h-11 px-6 rounded-lg w-full">
                  Área Restrita
                </Button>
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
