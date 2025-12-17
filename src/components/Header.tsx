import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b border-matte-silver sticky top-0 z-50 shadow-sm">
      <div className="max-w-[100rem] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <Image
              src="https://static.wixstatic.com/media/9b23b4_c5959c54bcc24c369727070cc053e52c~mv2.png"
              className="h-12 w-auto"
              width={120}
              originWidth={5379}
              originHeight={3842} />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link
              to="/imoveis"
              className={`font-paragraph text-sm font-medium transition-colors ${
                isActive('/imoveis')
                  ? 'text-secondary'
                  : 'text-dark-gray hover:text-secondary'
              }`}
            >
              Imóveis
            </Link>
            <Link
              to="/simulador"
              className={`font-paragraph text-sm font-medium transition-colors ${
                isActive('/simulador')
                  ? 'text-secondary'
                  : 'text-dark-gray hover:text-secondary'
              }`}
            >
              Simulador
            </Link>
            <Link
              to="/corretores"
              className={`font-paragraph text-sm font-medium transition-colors ${
                isActive('/corretores')
                  ? 'text-secondary'
                  : 'text-dark-gray hover:text-secondary'
              }`}
            >
              Corretores
            </Link>
            <Link
              to="/contato"
              className={`font-paragraph text-sm font-medium transition-colors ${
                isActive('/contato')
                  ? 'text-secondary'
                  : 'text-dark-gray hover:text-secondary'
              }`}
            >
              Contato
            </Link>
            <Link to="/area-restrita">
              <Button className="bg-secondary text-foreground hover:bg-black font-paragraph font-semibold h-10 px-6 rounded-none">
                Área Restrita
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-secondary p-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-6 border-t border-matte-silver">
            <div className="flex flex-col gap-4">
              <Link
                to="/imoveis"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-paragraph text-sm font-medium py-2 transition-colors ${
                  isActive('/imoveis')
                    ? 'text-secondary'
                    : 'text-dark-gray hover:text-secondary'
                }`}
              >
                Imóveis
              </Link>
              <Link
                to="/simulador"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-paragraph text-sm font-medium py-2 transition-colors ${
                  isActive('/simulador')
                    ? 'text-secondary'
                    : 'text-dark-gray hover:text-secondary'
                }`}
              >
                Simulador
              </Link>
              <Link
                to="/corretores"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-paragraph text-sm font-medium py-2 transition-colors ${
                  isActive('/corretores')
                    ? 'text-secondary'
                    : 'text-dark-gray hover:text-secondary'
                }`}
              >
                Corretores
              </Link>
              <Link
                to="/contato"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-paragraph text-sm font-medium py-2 transition-colors ${
                  isActive('/contato')
                    ? 'text-secondary'
                    : 'text-dark-gray hover:text-secondary'
                }`}
              >
                Contato
              </Link>
              <Link to="/area-restrita" onClick={() => setMobileMenuOpen(false)}>
                <Button className="bg-secondary text-foreground hover:bg-black font-paragraph font-semibold h-10 px-6 rounded-none w-full">
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
