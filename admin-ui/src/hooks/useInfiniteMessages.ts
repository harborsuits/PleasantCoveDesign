import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import api from '@/lib/api/client';
import { getSocket } from '@/lib/ws/SocketService';

interface Message {
  id: number;
  projectId: number;
  senderType: 'admin' | 'client';
  senderName: string;
  content: string;
  attachments?: string[];
  createdAt: string;
}

export function useInfiniteMessages(projectId: number, token?: string) {
  const queryClient = useQueryClient();

  // Infinite query for messages
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['messages', projectId],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await api.get(`/projects/${projectId}/messages`, {
        params: { cursor: pageParam, limit: 20 },
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!projectId,
  });

  // Flatten messages from all pages
  const messages = data?.pages.flatMap(page => page.items) || [];

  // Socket connection for real-time updates
  useEffect(() => {
    if (!projectId || !token) return;

    const initSocket = async () => {
      try {
        const socket = await getSocket();

        // Join project room
        socket.emit('join', { projectId });

        // Listen for new messages
        const handleNewMessage = (message: Message) => {
          if (message.projectId === projectId) {
            queryClient.setQueryData(['messages', projectId], (oldData: any) => {
              if (!oldData) return oldData;

              // Add message to the first page
              const newPages = [...oldData.pages];
              newPages[0] = {
                ...newPages[0],
                items: [message, ...newPages[0].items],
              };

              return {
                ...oldData,
                pages: newPages,
              };
            });
          }
        };

        socket.on('message:new', handleNewMessage);

      } catch (error) {
        console.error('Failed to initialize socket for messages:', error);
      }
    };

    initSocket();
  }, [projectId, token, queryClient]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, attachments }: { content: string; attachments?: string[] }) => {
      const response = await api.post(`/projects/${projectId}/messages`, {
        content,
        attachments,
      });
      return response.data;
    },
    onSuccess: (newMessage) => {
      // Optimistically add to cache
      queryClient.setQueryData(['messages', projectId], (oldData: any) => {
        if (!oldData) return oldData;

        const newPages = [...oldData.pages];
        newPages[0] = {
          ...newPages[0],
          items: [newMessage, ...newPages[0].items],
        };

        return {
          ...oldData,
          pages: newPages,
        };
      });
    },
  });

  return {
    messages,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
  };
}
