import { ReactNode } from 'react';
import { SignedIn, SignedOut, SignIn, ClerkLoading, ClerkLoaded } from '@clerk/clerk-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface MemberProtectedRouteProps {
  children: ReactNode;
  messageToLoading?: string;
  loadingClassName?: string;
  messageToSignIn?: string;
}

export function MemberProtectedRoute({
  children,
  messageToLoading = "Validando credenciais na nuvem...",
  loadingClassName = "",
}: MemberProtectedRouteProps) {
  return (
    <>
      <ClerkLoading>
        <div className="min-h-screen flex items-center justify-center p-4">
          <LoadingSpinner
            message={messageToLoading}
            className={loadingClassName}
          />
        </div>
      </ClerkLoading>
      <ClerkLoaded>
        <SignedIn>
          {children}
        </SignedIn>
        <SignedOut>
          <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50/50">
            <SignIn routing="hash" />
          </div>
        </SignedOut>
      </ClerkLoaded>
    </>
  );
}
