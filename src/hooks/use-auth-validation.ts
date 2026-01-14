import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { BaseCrudService } from '@/integrations';
import { UsuriosdoSistema } from '@/entities';

export interface AuthValidationResult {
  isValidating: boolean;
  isAuthorized: boolean;
  userProfile: UsuriosdoSistema | null;
  error: string | null;
}

export function useAuthValidation() {
  const { member, isAuthenticated, isLoading: memberLoading } = useMember();
  const [validationState, setValidationState] = useState<AuthValidationResult>({
    isValidating: true,
    isAuthorized: false,
    userProfile: null,
    error: null,
  });

  useEffect(() => {
    async function validateUser() {
      // Wait for member authentication to complete
      if (memberLoading) {
        return;
      }

      // If not authenticated, mark as unauthorized
      if (!isAuthenticated || !member) {
        setValidationState({
          isValidating: false,
          isAuthorized: false,
          userProfile: null,
          error: 'Usuário não autenticado',
        });
        return;
      }

      try {
        // Get member email
        const memberEmail = member.loginEmail;
        
        if (!memberEmail) {
          setValidationState({
            isValidating: false,
            isAuthorized: false,
            userProfile: null,
            error: 'Email do usuário não encontrado',
          });
          return;
        }

        // Check if user exists in usuariossistema collection
        const { items } = await BaseCrudService.getAll<UsuriosdoSistema>('usuariossistema');
        
        // Find user by memberRef or emailLogin
        const userProfile = items.find(
          (user) => 
            user.memberRef === member._id || 
            user.emailLogin?.toLowerCase() === memberEmail.toLowerCase()
        );

        if (!userProfile) {
          setValidationState({
            isValidating: false,
            isAuthorized: false,
            userProfile: null,
            error: 'Usuário não cadastrado no sistema. Entre em contato com o administrador.',
          });
          return;
        }

        // Check if user is active
        if (!userProfile.ativo) {
          setValidationState({
            isValidating: false,
            isAuthorized: false,
            userProfile: null,
            error: 'Usuário inativo. Entre em contato com o administrador.',
          });
          return;
        }

        // User is authorized
        setValidationState({
          isValidating: false,
          isAuthorized: true,
          userProfile,
          error: null,
        });
      } catch (error) {
        console.error('Error validating user:', error);
        setValidationState({
          isValidating: false,
          isAuthorized: false,
          userProfile: null,
          error: 'Erro ao validar usuário. Tente novamente.',
        });
      }
    }

    validateUser();
  }, [member, isAuthenticated, memberLoading]);

  return validationState;
}
