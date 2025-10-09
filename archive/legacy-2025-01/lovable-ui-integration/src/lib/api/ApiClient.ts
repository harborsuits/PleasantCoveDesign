import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { z } from 'zod';

// Environment-based API configuration
const getApiBaseUrl = (): string => {
  const baseURL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || window.location.origin;
  return baseURL;
};

// Fetch admin JWT token (secure method)
async function fetchAdminJwt(): Promise<string | null> {
  // Check cache first
  const cached = localStorage.getItem("auth_token");
  if (cached) {
    // For 90-day tokens, we can trust localStorage until manually cleared
    // The server will reject expired tokens automatically
    return cached;
  }

  // Try JWT exchange (production-safe)
  const adminKey = import.meta.env.VITE_ADMIN_KEY;
  if (adminKey) {
    try {
      console.log("🔐 [AUTH] Attempting JWT token exchange...");
      const { data } = await api.post("/api/token", { adminKey });
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
        console.log("✅ [AUTH] JWT token obtained successfully");
        return data.token;
      }
    } catch (error) {
      console.warn("❌ [AUTH] JWT exchange failed:", error.response?.data || error.message);
    }
  }

  // Fallback: legacy token for local development ONLY (never bundle in production)
  const legacy = import.meta.env.VITE_ADMIN_TOKEN;
  if (legacy) {
    console.warn("⚠️ [AUTH] Using legacy admin token (development only!)");
    localStorage.setItem("auth_token", legacy);
    return legacy;
  }

  console.error("❌ [AUTH] No admin authentication available");
  return null;
}

// API Response schemas
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });

export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    hasMore: z.boolean(),
    nextCursor: z.string().optional(),
  });

export class ApiClient {
  private client: AxiosInstance;
  private tokenRefreshPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: getApiBaseUrl(),
      timeout: 30000,
      withCredentials: false,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - attach auth token
    this.client.interceptors.request.use(
      async (config) => {
        // Get admin token (JWT preferred, legacy fallback)
        const token = localStorage.getItem("auth_token") || await fetchAdminJwt();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle 401s
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Try to refresh token
            const newToken = await this.refreshAuthToken();
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            // Redirect to login or emit auth error
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshAuthToken(): Promise<string | null> {
    // Clear cached token and try to get a new one
    localStorage.removeItem("auth_token");
    return await fetchAdminJwt();
  }

  // Generic request methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config);
  }

  // Get the underlying axios instance for advanced usage
  getInstance(): AxiosInstance {
    return this.client;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
