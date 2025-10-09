const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const ADMIN_KEY = 'pleasantcove2024admin';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'client';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export class AuthService {
  private static instance: AuthService;
  private static TOKEN_KEYS = ['pcd_token', 'auth_token']; // Both keys for compatibility
  
  private authState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  };

  private listeners: ((state: AuthState) => void)[] = [];

  private constructor() {
    this.initialize();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Static method for direct authentication
  static async authenticate(): Promise<string> {
    try {
      console.log('🔐 [AUTH] Authenticating with backend...', API_URL);
      
      const response = await fetch(`${API_URL}/api/auth/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminKey: ADMIN_KEY })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Auth failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.token) {
        throw new Error('No token received from server');
      }

      // Store token in BOTH locations for compatibility
      this.TOKEN_KEYS.forEach(key => {
        localStorage.setItem(key, data.token);
      });
      
      console.log('✅ [AUTH] Token stored successfully');
      console.log('📝 [AUTH] Token preview:', data.token.substring(0, 20) + '...');
      
      return data.token;
    } catch (error) {
      console.error('❌ [AUTH] Authentication error:', error);
      throw error;
    }
  }

  // Static method to get stored token
  static getStoredToken(): string | null {
    // Try both token keys
    for (const key of this.TOKEN_KEYS) {
      const token = localStorage.getItem(key);
      if (token) {
        return token;
      }
    }
    return null;
  }

  // Static method to check if authenticated
  static isTokenValid(token: string | null): boolean {
    if (!token) {
      console.log('❌ [AUTH] No token found');
      return false;
    }

    try {
      // Decode JWT payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      const isValid = Date.now() < expiry;
      
      if (!isValid) {
        console.log('⏰ [AUTH] Token expired');
      } else {
        console.log('✅ [AUTH] Token valid until', new Date(expiry).toLocaleString());
      }
      
      return isValid;
    } catch (error) {
      console.error('❌ [AUTH] Token validation error:', error);
      return false;
    }
  }

  // Static method to ensure valid token
  static async ensureValidToken(): Promise<string> {
    const token = this.getStoredToken();
    
    if (token && this.isTokenValid(token)) {
      console.log('✅ [AUTH] Using existing valid token');
      return token;
    }

    console.log('🔄 [AUTH] Getting new token...');
    return this.authenticate();
  }

  private async initialize(): Promise<void> {
    try {
      // Check for existing token in localStorage
      const token = AuthService.getStoredToken();
      
      if (token && AuthService.isTokenValid(token)) {
        // Token exists and is valid
        this.authState = {
          user: { id: 1, email: 'admin@pleasantcove.com', name: 'Admin', role: 'admin' },
          token,
          isAuthenticated: true,
          isLoading: false,
        };
      } else {
        // If no token or invalid, we need to get a proper JWT token
        console.log('🔐 [AUTH] No valid token found, getting JWT token for admin...');
        await this.getAdminJWT();
      }

      this.authState.isLoading = false;
    } catch (error) {
      console.error('Auth initialization failed:', error);
      this.authState.isLoading = false;
    }

    this.notifyListeners();
  }

  private async getAdminJWT(): Promise<boolean> {
    try {
      const token = await AuthService.authenticate();
      
      // Set auth state
      this.authState = {
        user: { 
          id: 1, 
          email: 'admin@pleasantcove.com', 
          name: 'Admin', 
          role: 'admin' 
        },
        token: token,
        isAuthenticated: true,
        isLoading: false,
      };

      return true;
    } catch (error) {
      console.error('Failed to get admin JWT:', error);
      throw error;
    }
  }

  async login(credentials: { email: string; password: string }): Promise<boolean> {
    try {
      this.authState.isLoading = true;
      this.notifyListeners();

      // Get a proper JWT token from the auth endpoint
      const response = await fetch('http://localhost:3000/api/auth/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminKey: 'pleasantcove2024admin' // For now, use the admin key
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.token) {
          // Store JWT token
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('pcd_token', data.token);

          // Set auth state
          this.authState = {
            user: { 
              id: data.userId || 1, 
              email: credentials.email, 
              name: data.name || 'Admin', 
              role: 'admin' 
            },
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          };

          this.notifyListeners();
          return true;
        }
      }

      this.authState.isLoading = false;
      this.notifyListeners();
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      this.authState.isLoading = false;
      this.notifyListeners();
      return false;
    }
  }

  async logout(): Promise<void> {
    // Clear local storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('pcd_token');

    // Reset state
    this.authState = {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    };

    this.notifyListeners();
  }

  getToken(): string | null {
    return this.authState.token;
  }

  getState(): AuthState {
    return { ...this.authState };
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.authState));
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();