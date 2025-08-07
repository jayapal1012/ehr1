import { createContext, useContext, useEffect, useState } from 'react';
import { authService, type AuthUser } from '@/lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(authService.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  const login = async (credentials: any) => {
    const response = await authService.login(credentials);
    setUser(response.user);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasRole = (role: string) => {
    return authService.hasRole(role);
  };

  const hasAnyRole = (roles: string[]) => {
    return authService.hasAnyRole(roles);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated,
      hasRole,
      hasAnyRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
