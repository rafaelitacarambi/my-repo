import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, Building2, Key, Users, Settings, LogOut, FileText, Calendar, LayoutDashboard, DollarSign, Clock, MessageSquare, Upload } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { useAuth, useClerk } from '@clerk/clerk-react';

export default function Header() {
  return import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY ? <AuthenticatedHeader /> : <HeaderContent isAuthenticated={false} onSignOut={() => {}} />;
}
function AuthenticatedHeader() {
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  return <HeaderContent isAuthenticated={!!isSignedIn} onSignOut={() => { void signOut(); }} />;
}
function HeaderContent({ isAuthenticated, onSignOut }: { isAuthenticated: boolean; onSignOut: () => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname === '/area-restrita' || location.pathname === '/perfil';

  const handleLogout = () => {
    onSignOut();
  };

  return (
    <header className="bg-primary border-b border-border-gray sticky top-0 z-50">
      <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to={isAuthenticated ? "/admin/vendas/dashboard" : "/"} className="flex items-center gap-3 group">
            <Image
              src="https://static.wixstatic.com/media/9b23b4_8b5ff4d697054133a09457af0365ebeb~mv2.png"
              alt="R. Sales Imóveis Logo"
              width={120}
              className="h-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {isAdminRoute && isAuthenticated && (
              <Link to="/admin/vendas/dashboard">
                <Button
                  variant="outline"
                  className="font-paragraph flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Hub
                </Button>
              </Link>
            )}
            <Link
              to="/imoveis"
              className={`font-paragraph text-base transition-colors ${isActive('/imoveis')
                ? 'text-secondary'
                : 'text-primary-foreground hover:text-secondary'
                }`}
            >
              Imóveis
            </Link>
            <Link
              to="/leilao-caixa"
              className={`font-paragraph text-base transition-colors ${isActive('/leilao-caixa')
                ? 'text-secondary'
                : 'text-primary-foreground hover:text-secondary'
                }`}
            >
              Leilão Caixa
            </Link>
            <Link
              to="/simulador"
              className={`font-paragraph text-base transition-colors ${isActive('/simulador')
                ? 'text-secondary'
                : 'text-primary-foreground hover:text-secondary'
                }`}
            >
              Simulador
            </Link>
            <Link
              to="/corretores"
              className={`font-paragraph text-base transition-colors ${isActive('/corretores')
                ? 'text-secondary'
                : 'text-primary-foreground hover:text-secondary'
                }`}
            >
              Corretores
            </Link>
            <Link
              to="/contato"
              className={`font-paragraph text-base transition-colors ${isActive('/contato')
                ? 'text-secondary'
                : 'text-primary-foreground hover:text-secondary'
                }`}
            >
              Contato
            </Link>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link to="/admin/vendas/dashboard">
                  <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-paragraph font-semibold h-11 px-6 rounded-lg">
                    Área Restrita
                  </Button>
                </Link>
                {isAdminRoute && (
                  <Link
                    to="/admin/whatsapp"
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-secondary/10 hover:text-secondary rounded-lg transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    WhatsApp Inbox
                  </Link>
                )}
                {isAdminRoute && (
                  <Link
                    to="/admin/imoveis/importar"
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-secondary/10 hover:text-secondary rounded-lg transition-colors"
                    title="Importar Imóveis"
                  >
                    <Upload className="w-4 h-4" />
                    Migrar
                  </Link>
                )}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="h-11 px-4 rounded-lg"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Link to="/admin/vendas/dashboard">
                <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-paragraph font-semibold h-11 px-6 rounded-lg">
                  Área Restrita
                </Button>
              </Link>
            )}
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
              {isAdminRoute && isAuthenticated && (
                <Link to="/admin/vendas/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full font-paragraph flex items-center gap-2"
                  >
                    <Home className="w-4 h-4" />
                    Hub
                  </Button>
                </Link>
              )}
              <Link
                to="/imoveis"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-paragraph text-base py-2 transition-colors ${isActive('/imoveis')
                  ? 'text-secondary'
                  : 'text-primary-foreground hover:text-secondary'
                  }`}
              >
                Imóveis
              </Link>
              <Link
                to="/leilao-caixa"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-paragraph text-base py-2 transition-colors ${isActive('/leilao-caixa')
                  ? 'text-secondary'
                  : 'text-primary-foreground hover:text-secondary'
                  }`}
              >
                Leilão Caixa
              </Link>
              <Link
                to="/simulador"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-paragraph text-base py-2 transition-colors ${isActive('/simulador')
                  ? 'text-secondary'
                  : 'text-primary-foreground hover:text-secondary'
                  }`}
              >
                Simulador
              </Link>
              <Link
                to="/corretores"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-paragraph text-base py-2 transition-colors ${isActive('/corretores')
                  ? 'text-secondary'
                  : 'text-primary-foreground hover:text-secondary'
                  }`}
              >
                Corretores
              </Link>
              <Link
                to="/contato"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-paragraph text-base py-2 transition-colors ${isActive('/contato')
                  ? 'text-secondary'
                  : 'text-primary-foreground hover:text-secondary'
                  }`}
              >
                Contato
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/admin/vendas/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-paragraph font-semibold h-11 px-6 rounded-lg w-full">
                      Área Restrita
                    </Button>
                  </Link>
                  <Button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    variant="outline"
                    className="w-full h-11 rounded-lg"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </Button>
                </>
              ) : (
                <Link to="/admin/vendas/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-paragraph font-semibold h-11 px-6 rounded-lg w-full">
                    Área Restrita
                  </Button>
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
