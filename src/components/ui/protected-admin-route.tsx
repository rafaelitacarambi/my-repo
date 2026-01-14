import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthValidation } from '@/hooks/use-auth-validation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface ProtectedAdminRouteProps {
  children: ReactNode;
  allowedProfiles?: string[];
  messageToSignIn?: string;
}

function ProtectedAdminContent({ 
  children, 
  allowedProfiles = [] 
}: { 
  children: ReactNode; 
  allowedProfiles: string[];
}) {
  const { isValidating, isAuthorized, userProfile, error } = useAuthValidation();

  // Show loading state while validating
  if (isValidating) {
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

  // If not authorized, show error
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-primary">
        <Header />
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-16">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertDescription className="font-paragraph text-base">
              {error || 'Acesso não autorizado'}
            </AlertDescription>
          </Alert>
        </div>
        <Footer />
      </div>
    );
  }

  // Check if user has required profile (if specified)
  if (allowedProfiles.length > 0 && userProfile?.profile) {
    const userProfileLower = userProfile.profile.toLowerCase();
    const hasAccess = allowedProfiles.some(
      profile => profile.toLowerCase() === userProfileLower
    );

    if (!hasAccess) {
      return (
        <div className="min-h-screen bg-primary">
          <Header />
          <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-16">
            <Alert variant="destructive" className="max-w-2xl mx-auto">
              <AlertDescription className="font-paragraph text-base">
                Você não tem permissão para acessar esta página. Perfil necessário: {allowedProfiles.join(', ')}
              </AlertDescription>
            </Alert>
          </div>
          <Footer />
        </div>
      );
    }
  }

  // User is authorized and has correct profile
  return <>{children}</>;
}

export function ProtectedAdminRoute({ 
  children, 
  allowedProfiles = [],
  messageToSignIn = "Faça login para acessar esta área"
}: ProtectedAdminRouteProps) {
  return (
    <MemberProtectedRoute messageToSignIn={messageToSignIn}>
      <ProtectedAdminContent allowedProfiles={allowedProfiles}>
        {children}
      </ProtectedAdminContent>
    </MemberProtectedRoute>
  );
}
