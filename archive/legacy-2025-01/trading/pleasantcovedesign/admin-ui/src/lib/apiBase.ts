export const API_BASE = ((import.meta as any).env?.VITE_API_URL || '').replace(/\/$/, '');
export const api = (path: string) => (path.startsWith('http') ? path : `${API_BASE}${path}`);


