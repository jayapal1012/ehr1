import { apiRequest } from "./queryClient";
import type { LoginData, User } from "@shared/schema";

export interface AuthUser {
  id: number;
  username: string;
  role: string;
  name: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

class AuthService {
  private token: string | null = null;
  private user: AuthUser | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          this.user = JSON.parse(userStr);
        } catch (e) {
          this.clearAuth();
        }
      }
    }
  }

  async login(credentials: LoginData): Promise<AuthResponse> {
    const response = await apiRequest('POST', '/api/login', credentials);
    const data = await response.json();
    
    this.token = data.token;
    this.user = data.user;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', this.token);
      localStorage.setItem('user', JSON.stringify(this.user));
    }
    
    return data;
  }

  async logout(): Promise<void> {
    if (this.token) {
      try {
        await apiRequest('POST', '/api/logout', {});
      } catch (e) {
        // Ignore errors during logout
      }
    }
    
    this.clearAuth();
  }

  private clearAuth(): void {
    this.token = null;
    this.user = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.token !== null && this.user !== null;
  }

  hasRole(role: string): boolean {
    return this.user?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    return this.user ? roles.includes(this.user.role) : false;
  }
}

export const authService = new AuthService();

// Override the default query client to include auth headers
export const getAuthHeaders = () => {
  const token = authService.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
