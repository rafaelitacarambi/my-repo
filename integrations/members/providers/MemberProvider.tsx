import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { MemberActions, MemberContext, MemberState } from '.';
import { getCurrentMember, Member } from '..';

// Local storage key
const MEMBER_STORAGE_KEY = 'member-store';

interface MemberProviderProps {
  children: ReactNode;
}

export const MemberProvider: React.FC<MemberProviderProps> = ({ children }) => {
  // Initialize state from localStorage or defaults
  const [state, setState] = useState<MemberState>(() => {
    let storedMemberData: Member | null = null;

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(MEMBER_STORAGE_KEY);
        if (stored) {
          const parsedData = JSON.parse(stored);
          // Only use member data from localStorage, not authentication status
          storedMemberData = parsedData;
        }
      } catch (error) {
        console.error('Error loading member state from localStorage:', error);
      }
    }

    // Always start with loading true and not authenticated
    // We'll verify authentication with the server on mount
    return {
      member: storedMemberData,
      isAuthenticated: false,
      isLoading: true,
      error: null,
    };
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error('Error saving member state to localStorage:', error);
      }
    }
  }, [state]);

  // Update state helper
  const updateState = useCallback((updates: Partial<MemberState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Member actions
  const actions: MemberActions = {
    /**
     * Load current member from Wix
     */
    loadCurrentMember: useCallback(async () => {
      try {
        updateState({ isLoading: true, error: null });

        const member = await getCurrentMember();

        if (member) {
          updateState({
            member,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          updateState({
            member: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (err) {
        updateState({
          error: err instanceof Error ? err.message : 'Failed to load member',
          member: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    }, [updateState]),

    /**
     * Login redirect
     */
    login: useCallback(() => {
      const returnUrl = encodeURIComponent(window.location.pathname);
      const loginUrl = `/api/auth/login?returnToUrl=${returnUrl}`;

      const insideIframe = window.self !== window.top;
      if (!insideIframe) {
        // dev machine url has been opened outside the picasso iframe
        window.location.href = loginUrl;
        return;
      }

      // we are on a different domain, we need to ask for storage access,
      // otherwise we won't be able to access session cookie
      document
        .hasStorageAccess()
        .catch(() => false)
        .then(hasAccess => {
          if (hasAccess) {
            return true;
          }

          // in case access is not granted, we need to clear partitioned cookies
          // otherwise after storage access is granted, we will be getting duplicated cookies.
          document.cookie = "wixSession=; max-age=0; Secure; SameSite=None; Partitioned";
          document.cookie = "XSRF-TOKEN=; max-age=0; Secure; SameSite=None; Partitioned";

          return document.requestStorageAccess().then(() => true).catch(() => false);
        })
        .then(accessGranted => {
          if (accessGranted) {
            const loginWindow = window.open(loginUrl, '_blank');
            reloadOnceLoggedIn(loginWindow);
          }
        });
    }, []),

    /**
     * Login with credentials (Local Dev only)
     */
    loginWithCredentials: useCallback(async (email, password) => {
      // Basic mock validation
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay

      try {
        const { items: { query, insert, update } } = await import('@/lib/wix-data-mock');

        // Find user case-insensitively
        const result = await query('usuariossistema').find();
        let userRecord = result.items.find(u => u.emailLogin?.toLowerCase() === email.toLowerCase());

        // Seeding / Repair logic for dev convenience
        const MOCK_EMAIL = "RSales";
        const MOCK_PASS = "1234";
        const ALT_MOCK_EMAIL = "admin@rsales.com";
        const ALT_MOCK_PASS = "123456";

        const isMockAdmin = (email.toLowerCase() === MOCK_EMAIL.toLowerCase() && password === MOCK_PASS) ||
          (email.toLowerCase() === ALT_MOCK_EMAIL.toLowerCase() && password === ALT_MOCK_PASS);

        if (isMockAdmin) {
          const defaultSectors = ["Financiamento", "Venda, Compra e Locação", "Administrativo"];
          if (!userRecord) {
            userRecord = await insert('usuariossistema', {
              emailLogin: email.toLowerCase() === MOCK_EMAIL.toLowerCase() ? MOCK_EMAIL : ALT_MOCK_EMAIL,
              password: email.toLowerCase() === MOCK_EMAIL.toLowerCase() ? MOCK_PASS : ALT_MOCK_PASS,
              name: "Admin User",
              profile: "Admin",
              ativo: true,
              status: "Ativo",
              setores: defaultSectors
            });
            console.log("Seeded mock admin user into usuariossistema");
          } else {
            let needsUpdate = false;
            if (userRecord.password !== password) {
              userRecord.password = password;
              needsUpdate = true;
            }
            // Ensure admin always has all sectors assigned
            if (!userRecord.setores || userRecord.setores.length < 3) {
              userRecord.setores = defaultSectors;
              needsUpdate = true;
            }
            if (needsUpdate) {
              await update('usuariossistema', userRecord);
              console.log("Repaired mock admin record in usuariossistema");
            }
          }
        }

        if (userRecord && userRecord.password === password) {
          const mockMember: Member = {
            _id: userRecord._id || "mock-member-id-" + Date.now(),
            loginEmail: userRecord.emailLogin,
            profile: {
              nickname: userRecord.name || "Usuário",
              title: userRecord.profile || "Usuário"
            },
            contact: {
              firstName: userRecord.name?.split(' ')[0] || "Usuário",
              lastName: userRecord.name?.split(' ').slice(1).join(' ') || ""
            },
            status: "APPROVED"
          };

          updateState({
            member: mockMember,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          return;
        }
      } catch (e) {
        console.warn("Failed to validate credentials against usuariossistema:", e);
      }

      throw new Error("Credenciais inválidas. Tente novamente.");
    }, [updateState]),

    /**
     * Logout action
     */
    logout: useCallback(() => {
      // Clear localStorage immediately
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(MEMBER_STORAGE_KEY);
        } catch (error) {
          console.error('Error clearing member state from localStorage:', error);
        }
      }

      // Create a form programmatically and submit it
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/auth/logout';
      form.setAttribute('data-astro-reload', '');

      // Hide the form
      form.style.display = 'none';

      // Add the form to the document
      document.body.appendChild(form);

      // Submit the form
      form.submit();

      // Clean up - remove the form after submission
      setTimeout(() => {
        document.body.removeChild(form);
      }, 100);
    }, [updateState]),

    /**
     * Clear member state
     */
    clearMember: useCallback(() => {
      updateState({
        member: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }, [updateState]),
  };

  // Auto-load member on mount
  useEffect(() => {
    actions.loadCurrentMember();
  }, [actions.loadCurrentMember]);

  // Context value
  const contextValue = {
    ...state,
    actions,
  };

  return (
    <MemberContext.Provider value={contextValue}>
      {children}
    </MemberContext.Provider>
  );
};

function reloadOnceLoggedIn(loginWindow: Window) {
  const cookies = document.cookie.split('; ');
  const cookie = cookies.find((row) => row.startsWith('wixSession='));

  if (cookie) {
    const jsonString = decodeURIComponent(cookie.split('=')[1] ?? '');
    const parsed = JSON.parse(jsonString);

    if (parsed?.tokens?.refreshToken?.role === "member") {
      loginWindow.close();
      window.location.reload();

      return;
    }
  }

  setTimeout(() => reloadOnceLoggedIn(loginWindow), 1_000);
}
