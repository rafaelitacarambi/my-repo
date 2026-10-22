import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { accessRole } from '@/lib/access-role';

export interface AuthValidationResult {
  isValidating: boolean;
  isAuthorized: boolean;
  userProfile: any | null;
  error: string | null;
}

export function useAuthValidation() {
  const { isLoaded, isSignedIn, user } = useUser();

  const [validationState, setValidationState] = useState<AuthValidationResult>({
    isValidating: true,
    isAuthorized: false,
    userProfile: null,
    error: null,
  });

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      setValidationState({
        isValidating: false,
        isAuthorized: false,
        userProfile: null,
        error: 'Sessão expirada ou usuário não logado.',
      });
      return;
    }

    const role = accessRole(user.publicMetadata?.role);
    if (!role) {
      setValidationState({ isValidating: false, isAuthorized: false,
        userProfile: null, error: 'Seu perfil de acesso ainda não foi autorizado.' });
      return;
    }

    setValidationState({
      isValidating: false,
      isAuthorized: true,
      userProfile: {
        profile: role,
        emailLogin: user.primaryEmailAddress?.emailAddress || '',
        nome: user.fullName || user.firstName || 'Membro da R Sales',
        ativo: true
      },
      error: null,
    });

  }, [isLoaded, isSignedIn, user]);

  return validationState;
}
