import { useEffect, useState, useRef } from 'react';
import { socketService } from '@/lib/ws/SocketService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Message {
  id: number;
  content: string;
  senderType: 'client' | 'admin';
  senderName: string;
  createdAt: string;
  projectToken?: string;
}

export function MessagesThread({ projectToken }: { projectToken: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!projectToken) return;

    let socketRef: any = null;
    let handler: any = null;

    (async () => {
      await loadMessages();
      socketRef = await socketService.connect();
      // Join room by access token (backend emits to token-named room)
      socketRef.emit('join', projectToken, (response: any) => {
        console.log('📌 Joined room:', response);
      });

      handler = (message: Message & { projectToken?: string }) => {
        if (!projectToken || message.projectToken !== projectToken) return;
        setMessages(prev => [...prev, message]);
      };
      socketRef.on('newMessage', handler);
    })();

    return () => {
      if (socketRef && handler) {
        socketRef.off('newMessage', handler);
      }
    };
  }, [projectToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // joinRoom and listen handled inside the effect above

  async function loadMessages() {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/public/project/${projectToken}/messages`
      );
      if (!response.ok) throw new Error('Failed to load messages');
      const data = await response.json();
      const items = Array.isArray(data?.items) ? data.items : data;
      setMessages(items);
    } catch (error) {
      console.error('❌ Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    try {
      setSending(true);
      const response = await fetch(
        `${API_URL}/api/public/project/${projectToken}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: newMessage,
            senderType: 'admin',
            senderName: 'Pleasant Cove Design'
          })
        }
      );
      if (!response.ok) throw new Error('Failed to send message');
      setNewMessage('');
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading messages...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
        <h3 style={{ margin: 0 }}>Conversation</h3>
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
          {projectToken.substring(0, 16)}...
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#f9fafb' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '40px' }}>
            No messages yet
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                marginBottom: '16px',
                display: 'flex',
                justifyContent: msg.senderType === 'admin' ? 'flex-start' : 'flex-end'
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: msg.senderType === 'admin' ? 'white' : '#667eea',
                  color: msg.senderType === 'admin' ? '#1f2937' : 'white',
                  border: msg.senderType === 'admin' ? '1px solid #e5e7eb' : 'none'
                }}
              >
                <div style={{ fontWeight: '600', fontSize: '12px', marginBottom: '4px', opacity: 0.8 }}>
                  {msg.senderName}
                </div>
                <div>{msg.content}</div>
                <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} style={{ padding: '20px', borderTop: '1px solid #e5e7eb', background: 'white' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your reply..."
            style={{ flex: 1, padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '24px', fontSize: '14px', outline: 'none' }}
            onFocus={(e) => (e.target.style.borderColor = '#667eea')}
            onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
          />
          <button type="submit" disabled={!newMessage.trim() || sending} style={{ padding: '12px 24px', background: sending ? '#9ca3af' : '#667eea', color: 'white', border: 'none', borderRadius: '24px', cursor: sending ? 'not-allowed' : 'pointer', fontWeight: '600' }}>
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}


