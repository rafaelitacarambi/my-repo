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
