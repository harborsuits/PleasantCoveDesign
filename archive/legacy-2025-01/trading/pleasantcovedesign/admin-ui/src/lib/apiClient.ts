const API = (import.meta.env.VITE_API_URL as string) || '/api';

async function request<T>(path: string, init?: RequestInit, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API}${path}`, { ...init, signal, headers: { 'content-type': 'application/json', ...(init?.headers || {}) } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const api = {
  get: request,
  post: async <T>(path: string, body: any, signal?: AbortSignal) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }, signal),
};


