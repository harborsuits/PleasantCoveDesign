import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  timeout: 8000,
});

let token: string | null = null;

async function login() {
  try {
    const username = import.meta.env.VITE_ADMIN_USERNAME;
    const password = import.meta.env.VITE_ADMIN_PASSWORD;
    
    // Skip login if credentials not configured
    if (!username || !password) {
      console.log('[API] Skipping auth - no credentials configured');
      return null;
    }
    
    const r = await api.post("/auth/login", { username, password });
    token = r.data.token;
    return token!;
  } catch (error) {
    console.error('[API] Login failed:', error);
    return null;
  }
}

export async function loginIfNeeded() {
  if (token) return token;
  return login();
}

api.interceptors.request.use(async (config) => {
  // Skip auth for public endpoints
  const publicEndpoints = ['/api/report/story', '/api/health', '/api/metrics'];
  const isPublic = publicEndpoints.some(endpoint => config.url?.includes(endpoint));
  
  if (!isPublic) {
    await loginIfNeeded();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err?.response?.status === 401) {
      token = null;
      await login();
      return api.request(err.config);
    }
    return Promise.reject(err);
  }
);

export default api;

export async function get<T>(url: string, params?: any) {
  const r = await api.get<T>(url, { params });
  return r.data;
}
export async function post<T>(url: string, data?: any, mutate = false) {
  const headers = mutate ? { "X-API-Key": import.meta.env.VITE_API_KEY_PRIMARY } : undefined;
  const r = await api.post<T>(url, data, { headers });
  return r.data;
}
export async function del<T>(url: string, mutate = false) {
  const headers = mutate ? { "X-API-Key": import.meta.env.VITE_API_KEY_PRIMARY } : undefined;
  const r = await api.delete<T>(url, { headers });
  return r.data;
}

// Simple fetch-based helper for dashboard queries (no auth needed)
export async function j<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}

// Resilient array helper for API responses
export function asItems<T>(x: any): T[] {
  return Array.isArray(x?.items) ? x.items : (Array.isArray(x) ? x : []);
}
