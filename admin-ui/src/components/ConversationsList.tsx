import { useEffect, useState } from 'react';
import { AuthService } from '@/lib/auth/AuthService';

// At the top of the file
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Conversation {
  projectId: number;
  projectTitle: string;
  customerName: string;
  accessToken: string;
  lastMessageTime?: string;
}

export function ConversationsList({ onSelectConversation }: { onSelectConversation: (token: string) => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    try {
      const token = await AuthService.ensureValidToken();
      const response = await fetch(`${API_URL}/api/admin/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to load conversations');

      const data = await response.json();
      const list: Conversation[] = (data?.projectMessages || []).map((c: any) => ({
        projectId: c.projectId,
        projectTitle: c.projectTitle || `Project ${c.projectId}`,
        customerName: c.customerName,
        accessToken: c.accessToken,
        lastMessageTime: c.lastMessageTime,
      }));

      console.log('📥 Loaded conversations:', list.length);
      setConversations(list);
    } catch (error) {
      console.error('❌ Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Loading conversations...</div>;
  }

  if (conversations.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
        <h3>No conversations yet</h3>
        <p>Client messages will appear here</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <h2 style={{ padding: '16px', margin: 0, borderBottom: '1px solid #e5e7eb' }}>
        Conversations ({conversations.length})
      </h2>
      {conversations.map((c) => (
        <div
          key={c.projectId}
          onClick={() => onSelectConversation(c.accessToken)}
          style={{
            padding: '16px',
            borderBottom: '1px solid #f3f4f6',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>
            {c.projectTitle}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Client: {c.customerName}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
            Token: {c.accessToken.substring(0, 12)}...
          </div>
          {c.lastMessageTime && (
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
              Last message: {new Date(c.lastMessageTime).toLocaleString()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}



