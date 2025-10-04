import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 15_000,
      gcTime: 5 * 60_000,
      // Keep shapes as-is globally; transform lists per-query only
      
      // Disable refetching on window focus for a smoother experience
      refetchOnWindowFocus: false,
    },
    mutations: {}
  },
});
