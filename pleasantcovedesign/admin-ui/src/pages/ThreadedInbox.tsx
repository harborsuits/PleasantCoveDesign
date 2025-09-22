import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  Search, 
  Send,
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  User,
  X,
  MessageSquare,
  Plus,
  Filter,
  CheckCircle,
  Archive,
  AlertCircle,
  Clock
} from 'lucide-react'
import api, { getWebSocketUrl } from '../api'
import { io, Socket } from 'socket.io-client'

interface ThreadMessage {
  id: number
  threadId: number
  content: string
  senderName: string
  senderType: 'client' | 'admin'
  attachments?: string[]
  readAt?: string
  createdAt: string
}

interface ConversationThread {
  thread_id: number
  project_id: number
  title: string
  status: 'active' | 'resolved' | 'archived'
  category: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  created_by: 'admin' | 'client'
  last_message_at: string
  project_title: string
  project_token: string
  company_name: string
  company_email: string
  message_count: number
  unread_count: number
  last_message?: {
    id: number
    content: string
    senderName: string
    senderType: string
    createdAt: string
  }
}

const ThreadedInbox: React.FC = () => {
  const navigate = useNavigate()
  const { threadId } = useParams<{ threadId?: string }>()
  const [threads, setThreads] = useState<ConversationThread[]>([])
  const [selectedThread, setSelectedThread] = useState<ConversationThread | null>(null)
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'resolved'>('active')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showNewThreadModal, setShowNewThreadModal] = useState(false)
  
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Categories for threads
  const threadCategories = [
    { value: 'general', label: 'General', icon: '💬' },
    { value: 'support', label: 'Support', icon: '🛟' },
    { value: 'billing', label: 'Billing', icon: '💳' },
    { value: 'design_feedback', label: 'Design Feedback', icon: '🎨' },
    { value: 'technical', label: 'Technical', icon: '⚙️' },
    { value: 'content', label: 'Content', icon: '📝' },
    { value: 'other', label: 'Other', icon: '📌' }
  ]

  // Priority colors
  const priorityColors = {
    low: 'text-gray-500',
    normal: 'text-blue-500',
    high: 'text-orange-500',
    urgent: 'text-red-500'
  }

  const priorityIcons = {
    low: '⬇️',
    normal: '➡️',
    high: '⬆️',
    urgent: '🚨'
  }

  // Status icons
  const statusIcons = {
    active: <Clock className="w-4 h-4 text-blue-500" />,
    resolved: <CheckCircle className="w-4 h-4 text-green-500" />,
    archived: <Archive className="w-4 h-4 text-gray-500" />
  }

  useEffect(() => {
    fetchThreads()
    setupWebSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  useEffect(() => {
    if (threadId && threads.length > 0) {
      const thread = threads.find(t => t.thread_id === parseInt(threadId))
      if (thread) {
        handleThreadSelect(thread)
      }
    }
  }, [threadId, threads])

  const setupWebSocket = () => {
    const socket = io(getWebSocketUrl(), {
      transports: ['websocket', 'polling']
    })
    
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket')
      socket.emit('join', 'admin-room')
    })

    socket.on('newMessage', (message: any) => {
      console.log('📨 New message received:', message)
      
      // Update thread list to reflect new message
      setThreads(prev => {
        const updated = [...prev]
        const threadIndex = updated.findIndex(t => t.thread_id === message.threadId)
        
        if (threadIndex > -1) {
          const thread = updated[threadIndex]
          thread.last_message = {
            id: message.id,
            content: message.content,
            senderName: message.senderName,
            senderType: message.senderType,
            createdAt: message.createdAt
          }
          thread.last_message_at = message.createdAt
          
          if (message.senderType === 'client') {
            thread.unread_count = (thread.unread_count || 0) + 1
          }
          
          // Move thread to top
          updated.splice(threadIndex, 1)
          updated.unshift(thread)
        }
        
        return updated
      })
      
      // Update messages if viewing this thread
      if (selectedThread?.thread_id === message.threadId) {
        setThreadMessages(prev => [...prev, message])
        scrollToBottom()
      }
    })
  }

  const fetchThreads = async () => {
    try {
      const response = await api.get('/admin/conversations')
      setThreads(response.data.threads || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching threads:', error)
      setLoading(false)
    }
  }

  const fetchThreadMessages = async (threadId: number) => {
    try {
      const response = await api.get(`/threads/${threadId}/messages`)
      setThreadMessages(response.data.messages || [])
      scrollToBottom()
      
      // Mark messages as read
      await api.post(`/threads/${threadId}/mark-read`)
      
      // Update unread count locally
      setThreads(prev => prev.map(t => 
        t.thread_id === threadId ? { ...t, unread_count: 0 } : t
      ))
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleThreadSelect = async (thread: ConversationThread) => {
    setSelectedThread(thread)
    navigate(`/threaded-inbox/${thread.thread_id}`)
    await fetchThreadMessages(thread.thread_id)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return

    try {
      const response = await api.post(`/threads/${selectedThread.thread_id}/messages`, {
        content: newMessage,
        senderName: 'Pleasant Cove Design',
        senderType: 'admin'
      })

      setNewMessage('')
      
      // Optimistically add message
      const sentMessage: ThreadMessage = response.data.message
      setThreadMessages(prev => [...prev, sentMessage])
      scrollToBottom()
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    }
  }

  const handleCreateThread = async (projectId: number, title: string, category: string) => {
    try {
      const response = await api.post(`/projects/${projectId}/threads`, {
        title,
        category,
        priority: 'normal'
      })
      
      setShowNewThreadModal(false)
      await fetchThreads()
      
      // Select the new thread
      const newThread = response.data.thread
      const fullThread = threads.find(t => t.thread_id === newThread.id)
      if (fullThread) {
        handleThreadSelect(fullThread)
      }
    } catch (error) {
      console.error('Error creating thread:', error)
      alert('Failed to create thread')
    }
  }

  const handleUpdateThreadStatus = async (threadId: number, status: string) => {
    try {
      await api.patch(`/threads/${threadId}`, { status })
      
      // Update local state
      setThreads(prev => prev.map(t => 
        t.thread_id === threadId ? { ...t, status: status as any } : t
      ))
      
      if (selectedThread?.thread_id === threadId) {
        setSelectedThread(prev => prev ? { ...prev, status: status as any } : null)
      }
    } catch (error) {
      console.error('Error updating thread status:', error)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return `${days} days ago`
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  // Filter threads
  const filteredThreads = threads.filter(thread => {
    if (filterStatus !== 'all' && thread.status !== filterStatus) return false
    if (filterCategory !== 'all' && thread.category !== filterCategory) return false
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        thread.title.toLowerCase().includes(search) ||
        thread.company_name.toLowerCase().includes(search) ||
        thread.last_message?.content.toLowerCase().includes(search)
      )
    }
    
    return true
  })

  // Group threads by company
  const threadsByCompany = filteredThreads.reduce((acc, thread) => {
    const key = `${thread.company_name}-${thread.project_id}`
    if (!acc[key]) {
      acc[key] = {
        companyName: thread.company_name,
        projectTitle: thread.project_title,
        projectId: thread.project_id,
        threads: []
      }
    }
    acc[key].threads.push(thread)
    return acc
  }, {} as Record<string, any>)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Loading conversations...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Thread List Sidebar */}
      <div className="w-96 border-r border-gray-200 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Conversations</h1>
            <span className="text-sm text-gray-500">
              {filteredThreads.length} threads
            </span>
          </div>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search threads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="flex-1 px-3 py-1 text-sm border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
            </select>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="flex-1 px-3 py-1 text-sm border rounded-lg"
            >
              <option value="all">All Categories</option>
              {threadCategories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          {Object.values(threadsByCompany).map((group: any) => (
            <div key={`${group.companyName}-${group.projectId}`} className="mb-4">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <p className="font-medium text-sm text-gray-700">{group.companyName}</p>
                <p className="text-xs text-gray-500">{group.projectTitle}</p>
              </div>
              
              {group.threads.map((thread: ConversationThread) => (
                <div
                  key={thread.thread_id}
                  onClick={() => handleThreadSelect(thread)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedThread?.thread_id === thread.thread_id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {threadCategories.find(c => c.value === thread.category)?.icon || '📌'}
                      </span>
                      <h3 className={`font-medium ${thread.unread_count > 0 ? 'font-bold' : ''}`}>
                        {thread.title}
                      </h3>
                      {statusIcons[thread.status]}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${priorityColors[thread.priority]}`}>
                        {priorityIcons[thread.priority]}
                      </span>
                      {thread.unread_count > 0 && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                          {thread.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {thread.last_message && (
                    <p className={`text-sm truncate ${thread.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                      {thread.last_message.senderType === 'admin' ? '🔵 You: ' : '💬 '}
                      {thread.last_message.content}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {thread.message_count} messages
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(thread.last_message_at)}
                    </span>
                  </div>
                </div>
              ))}
              
              {/* New Thread Button */}
              <button
                onClick={() => {
                  // Set project context for new thread
                  setShowNewThreadModal(true)
                }}
                className="w-full p-3 text-sm text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Thread in {group.companyName}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedThread ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-lg">{selectedThread.title}</h2>
                    {statusIcons[selectedThread.status]}
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedThread.company_name} • {selectedThread.project_title}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Thread Actions */}
                  <select
                    value={selectedThread.status}
                    onChange={(e) => handleUpdateThreadStatus(selectedThread.thread_id, e.target.value)}
                    className="px-3 py-1 text-sm border rounded-lg"
                  >
                    <option value="active">Active</option>
                    <option value="resolved">Resolved</option>
                    <option value="archived">Archive</option>
                  </select>
                  
                  <button className="p-2 hover:bg-gray-100 rounded">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded">
                    <Video className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {threadMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex mb-4 ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-md px-4 py-2 rounded-lg ${
                    message.senderType === 'admin'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.senderType === 'admin' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.createdAt)} • {message.senderName}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t">
              <div className="flex gap-3">
                <button className="p-2 hover:bg-gray-100 rounded">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare className="w-16 h-16 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
            <p>Choose a thread from the sidebar to start messaging</p>
          </div>
        )}
      </div>

      {/* New Thread Modal */}
      {showNewThreadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Create New Thread</h3>
            {/* Modal content would go here */}
            <button
              onClick={() => setShowNewThreadModal(false)}
              className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ThreadedInbox;
