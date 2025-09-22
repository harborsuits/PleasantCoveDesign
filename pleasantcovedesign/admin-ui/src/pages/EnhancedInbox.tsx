import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  Search, 
  Send,
  Paperclip,
  ChevronDown,
  ChevronRight,
  Clock,
  Calendar,
  MessageSquare,
  Filter,
  X
} from 'lucide-react'
import api, { getWebSocketUrl } from '../api'
import { io, Socket } from 'socket.io-client'

interface Message {
  id: number
  projectId: number
  projectToken: string
  content: string
  senderName: string
  senderType: 'client' | 'admin'
  createdAt: string
  readAt?: string
  attachments?: string[]
}

interface Conversation {
  id: number
  projectId: number
  projectToken: string
  projectTitle: string
  customerName: string
  customerEmail: string
  lastMessage?: Message
  lastMessageTime: string
  unreadCount: number
  messages: Message[]
}

interface MessageThread {
  id: string
  title: string
  messages: Message[]
  startTime: string
  endTime: string
  unreadCount: number
  category?: string
}

// Message templates for quick replies
const MESSAGE_TEMPLATES = [
  { label: '👍 Acknowledge', text: 'Thanks for your message. I\'ll look into this and get back to you shortly.' },
  { label: '❓ Need Info', text: 'Could you please provide more details about this issue?' },
  { label: '✅ Resolved', text: 'This issue has been resolved. Please let me know if you need anything else.' },
  { label: '📞 Schedule Call', text: 'Would you like to schedule a call to discuss this further?' },
  { label: '⏰ Update', text: 'I\'m currently working on this and will have an update for you soon.' },
  { label: '📋 Next Steps', text: 'Here are the next steps we\'ll take to address this:' }
]

const EnhancedInbox: React.FC = () => {
  const navigate = useNavigate()
  const { projectToken } = useParams<{ projectToken?: string }>()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [collapsedThreads, setCollapsedThreads] = useState<Set<string>>(new Set())
  const [filterUnread, setFilterUnread] = useState(false)
  
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Detect message category from content
  const detectCategory = (content: string): string => {
    const lowerContent = content.toLowerCase()
    if (lowerContent.includes('[support]') || lowerContent.includes('help') || lowerContent.includes('issue')) {
      return 'support'
    }
    if (lowerContent.includes('[billing]') || lowerContent.includes('payment') || lowerContent.includes('invoice')) {
      return 'billing'
    }
    if (lowerContent.includes('[design]') || lowerContent.includes('mockup') || lowerContent.includes('layout')) {
      return 'design'
    }
    if (lowerContent.includes('[urgent]') || lowerContent.includes('asap') || lowerContent.includes('critical')) {
      return 'urgent'
    }
    return 'general'
  }

  // Group messages into logical threads
  const groupMessagesIntoThreads = (messages: Message[]): MessageThread[] => {
    if (!messages || messages.length === 0) return []
    
    const threads: MessageThread[] = []
    let currentThread: Message[] = []
    
    // Sort messages by time
    const sortedMessages = [...messages].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    
    sortedMessages.forEach((msg, index) => {
      const prevMsg = sortedMessages[index - 1]
      
      // Start new thread if:
      // - First message
      // - More than 2 hours since last message
      // - Category change detected
      const timeDiff = prevMsg 
        ? new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()
        : 0
      
      const shouldStartNewThread = !prevMsg || 
        timeDiff > 2 * 60 * 60 * 1000 || // 2 hours
        detectCategory(msg.content) !== detectCategory(prevMsg.content)
      
      if (shouldStartNewThread && currentThread.length > 0) {
        threads.push({
          id: `thread-${threads.length}`,
          title: extractThreadTitle(currentThread),
          messages: currentThread,
          startTime: currentThread[0].createdAt,
          endTime: currentThread[currentThread.length - 1].createdAt,
          unreadCount: currentThread.filter(m => m.senderType === 'client' && !m.readAt).length,
          category: detectCategory(currentThread[0].content)
        })
        currentThread = []
      }
      
      currentThread.push(msg)
    })
    
    // Add last thread
    if (currentThread.length > 0) {
      threads.push({
        id: `thread-${threads.length}`,
        title: extractThreadTitle(currentThread),
        messages: currentThread,
        startTime: currentThread[0].createdAt,
        endTime: currentThread[currentThread.length - 1].createdAt,
        unreadCount: currentThread.filter(m => m.senderType === 'client' && !m.readAt).length,
        category: detectCategory(currentThread[0].content)
      })
    }
    
    return threads.reverse() // Newest first
  }

  // Extract a meaningful title from thread messages
  const extractThreadTitle = (messages: Message[]): string => {
    const firstClientMessage = messages.find(m => m.senderType === 'client')
    if (firstClientMessage) {
      // Remove category tags
      let content = firstClientMessage.content
        .replace(/\[(support|billing|design|urgent|general)\]/gi, '')
        .trim()
      
      // Truncate and add ellipsis if needed
      if (content.length > 50) {
        content = content.substring(0, 50) + '...'
      }
      
      return content || 'New conversation'
    }
    return 'New conversation'
  }

  // Group conversations by date
  const groupConversationsByDate = (convs: Conversation[]) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const groups: Record<string, Conversation[]> = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'Older': []
    }
    
    convs.forEach(conv => {
      const messageDate = new Date(conv.lastMessageTime)
      if (messageDate >= today) {
        groups['Today'].push(conv)
      } else if (messageDate >= yesterday) {
        groups['Yesterday'].push(conv)
      } else if (messageDate >= weekAgo) {
        groups['This Week'].push(conv)
      } else {
        groups['Older'].push(conv)
      }
    })
    
    return groups
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K = Focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      
      // Cmd/Ctrl + Enter = Send message
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && selectedConversation) {
        e.preventDefault()
        handleSendMessage()
      }
      
      // Escape = Close conversation
      if (e.key === 'Escape' && selectedConversation) {
        setSelectedConversation(null)
        navigate('/enhanced-inbox')
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedConversation, newMessage])

  // Initialize and fetch data
  useEffect(() => {
    fetchConversations()
    setupWebSocket()
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  // Auto-select conversation based on URL
  useEffect(() => {
    if (projectToken && conversations.length > 0) {
      const conversation = conversations.find(c => c.projectToken === projectToken)
      if (conversation) {
        setSelectedConversation(conversation)
      }
    }
  }, [projectToken, conversations])

  const setupWebSocket = () => {
    const socket = io(getWebSocketUrl(), {
      transports: ['websocket', 'polling']
    })
    
    socketRef.current = socket
    
    socket.on('connect', () => {
      socket.emit('join', 'admin-room')
    })
    
    socket.on('newMessage', (message: Message) => {
      // Update conversations with new message
      setConversations(prev => {
        const updated = [...prev]
        const convIndex = updated.findIndex(c => c.projectToken === message.projectToken)
        
        if (convIndex > -1) {
          const conv = { ...updated[convIndex] }
          conv.messages = [...conv.messages, message]
          conv.lastMessage = message
          conv.lastMessageTime = message.createdAt
          
          if (message.senderType === 'client' && !message.readAt) {
            conv.unreadCount = (conv.unreadCount || 0) + 1
          }
          
          // Move to top
          updated.splice(convIndex, 1)
          updated.unshift(conv)
        }
        
        return updated
      })
      
      // Update selected conversation if it matches
      if (selectedConversation?.projectToken === message.projectToken) {
        setSelectedConversation(prev => prev ? {
          ...prev,
          messages: [...prev.messages, message]
        } : null)
        scrollToBottom()
      }
    })
  }

  const fetchConversations = async () => {
    try {
      const response = await api.get('/admin/inbox')
      const projectMessages = response.data.projectMessages || []
      
      const convs: Conversation[] = projectMessages.map((project: any) => ({
        id: project.projectId,
        projectId: project.projectId,
        projectToken: project.accessToken,
        projectTitle: project.projectTitle,
        customerName: project.customerName || 'Unknown Customer',
        customerEmail: project.customerEmail || 'unknown@example.com',
        lastMessage: project.messages?.[project.messages.length - 1],
        lastMessageTime: project.messages?.[project.messages.length - 1]?.createdAt || new Date().toISOString(),
        unreadCount: project.messages?.filter((m: any) => m.senderType === 'client' && !m.readAt).length || 0,
        messages: project.messages || []
      }))
      
      // Sort by last message time
      convs.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime())
      
      setConversations(convs)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return
    
    try {
      const response = await api.post('/messages', {
        projectToken: selectedConversation.projectToken,
        sender: 'Pleasant Cove Design',
        body: newMessage,
        attachmentKeys: [],
        hasFiles: false
      })
      
      setNewMessage('')
      setShowTemplates(false)
      
      // Optimistically add message
      const sentMessage: Message = {
        id: response.data.id || Date.now(),
        projectId: selectedConversation.projectId,
        projectToken: selectedConversation.projectToken,
        content: newMessage,
        senderName: 'Pleasant Cove Design',
        senderType: 'admin',
        createdAt: new Date().toISOString()
      }
      
      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, sentMessage]
      } : null)
      
      scrollToBottom()
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message. Please try again.')
    }
  }

  const markConversationAsRead = async (conversation: Conversation) => {
    const unreadMessages = conversation.messages.filter(m => m.senderType === 'client' && !m.readAt)
    
    for (const msg of unreadMessages) {
      try {
        await api.post(`/messages/${msg.id}/read`)
      } catch (error) {
        console.error('Failed to mark message as read:', error)
      }
    }
    
    // Update local state
    setConversations(prev => prev.map(c => 
      c.id === conversation.id ? { ...c, unreadCount: 0 } : c
    ))
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
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  // Filter conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(conv => 
        conv.customerName.toLowerCase().includes(search) ||
        conv.projectTitle.toLowerCase().includes(search) ||
        conv.messages.some(m => m.content.toLowerCase().includes(search))
      )
    }
    
    // Unread filter
    if (filterUnread) {
      filtered = filtered.filter(conv => conv.unreadCount > 0)
    }
    
    return filtered
  }, [conversations, searchTerm, filterUnread])

  // Group filtered conversations by date
  const groupedConversations = useMemo(() => 
    groupConversationsByDate(filteredConversations),
    [filteredConversations]
  )

  // Get threads for selected conversation
  const conversationThreads = useMemo(() => 
    selectedConversation ? groupMessagesIntoThreads(selectedConversation.messages) : [],
    [selectedConversation]
  )

  // Category styles
  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'support': return 'border-red-500 bg-red-50'
      case 'billing': return 'border-green-500 bg-green-50'
      case 'design': return 'border-purple-500 bg-purple-50'
      case 'urgent': return 'border-orange-500 bg-orange-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Loading conversations...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Conversations Sidebar */}
      <div className="w-96 border-r border-gray-200 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold mb-4">Enhanced Inbox</h1>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search messages... (⌘K)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFilterUnread(!filterUnread)}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                filterUnread ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-3 h-3" />
              Unread Only
              {filterUnread && ` (${conversations.filter(c => c.unreadCount > 0).length})`}
            </button>
            
            <div className="text-sm text-gray-500">
              {filteredConversations.length} of {conversations.length} conversations
            </div>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {Object.entries(groupedConversations).map(([dateGroup, convs]) => (
            convs.length > 0 && (
              <div key={dateGroup} className="mb-4">
                <div className="px-4 py-2 bg-gray-50 border-b sticky top-0 z-10">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {dateGroup}
                    <span className="text-xs text-gray-400">({convs.length})</span>
                  </div>
                </div>
                
                {convs.map(conv => (
                  <div
                    key={conv.projectToken}
                    onClick={() => {
                      setSelectedConversation(conv)
                      markConversationAsRead(conv)
                      navigate(`/enhanced-inbox/${conv.projectToken}`)
                    }}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation?.projectToken === conv.projectToken ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h3 className={`font-medium ${conv.unreadCount > 0 ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                        {conv.customerName}
                      </h3>
                      <div className="flex items-center gap-2">
                        {conv.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                            {conv.unreadCount} new
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatTime(conv.lastMessageTime)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 truncate mb-1">
                      {conv.projectTitle}
                    </p>
                    
                    {conv.lastMessage && (
                      <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                        {conv.lastMessage.senderType === 'admin' ? '↗️ ' : '↘️ '}
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )
          ))}
          
          {filteredConversations.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No conversations found</p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-blue-600 hover:text-blue-700"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-lg">{selectedConversation.customerName}</h2>
                  <p className="text-sm text-gray-600">{selectedConversation.projectTitle}</p>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  {conversationThreads.length} threads • {selectedConversation.messages.length} messages
                </div>
              </div>
            </div>

            {/* Messages grouped by threads */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {conversationThreads.map((thread) => {
                const isCollapsed = collapsedThreads.has(thread.id)
                const threadCategory = thread.category || 'general'
                
                return (
                  <div
                    key={thread.id}
                    className={`mb-6 border-l-4 pl-4 ${getCategoryStyle(threadCategory)}`}
                  >
                    {/* Thread Header */}
                    <div
                      onClick={() => {
                        const newCollapsed = new Set(collapsedThreads)
                        if (isCollapsed) {
                          newCollapsed.delete(thread.id)
                        } else {
                          newCollapsed.add(thread.id)
                        }
                        setCollapsedThreads(newCollapsed)
                      }}
                      className="cursor-pointer hover:bg-white/50 -ml-4 pl-4 py-2 rounded transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          <h3 className="font-medium">{thread.title}</h3>
                          {thread.unreadCount > 0 && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                              {thread.unreadCount} new
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatTime(thread.startTime)} - {formatTime(thread.endTime)}
                        </span>
                      </div>
                    </div>

                    {/* Thread Messages */}
                    <div className={`mt-2 space-y-2 ${isCollapsed ? 'hidden' : ''}`}>
                      {thread.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
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
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t">
              {/* Quick Reply Templates */}
              {showTemplates && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Quick Replies</span>
                    <button
                      onClick={() => setShowTemplates(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {MESSAGE_TEMPLATES.map((template) => (
                      <button
                        key={template.label}
                        onClick={() => {
                          setNewMessage(template.text)
                          setShowTemplates(false)
                        }}
                        className="px-3 py-1 text-sm bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {template.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  title="Quick replies"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700">
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
                  placeholder="Type a message... (⌘Enter to send)"
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
              
              <div className="mt-2 text-xs text-gray-500 text-center">
                Press ⌘K to search • ⌘Enter to send • Esc to close
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare className="w-16 h-16 mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
            <p className="text-gray-400">Choose a conversation to view messages</p>
            <div className="mt-8 p-4 bg-blue-50 rounded-lg max-w-md text-center">
              <p className="text-sm text-blue-700">
                💡 <strong>Pro Tip:</strong> Messages are automatically grouped into threads based on time and topic. 
                Click thread headers to collapse/expand them.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EnhancedInbox;
