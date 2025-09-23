import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Eye, Download, MessageCircle, Calendar, DollarSign, CheckCircle, Clock, AlertCircle, Paperclip, Send, TrendingUp, Palette, Search, Filter, Trash2, Archive, MoreVertical, Plus } from 'lucide-react'
import DesignCanvas from '../components/Canvas/DesignCanvas'
import ProjectAccessControls from '../components/ProjectAccessControls'
import api from '../api'

interface ClientProject {
  id: number
  name: string
  description: string
  status: 'active' | 'review' | 'completed' | 'on_hold'
  progress: number
  totalValue: number
  paidAmount: number
  nextPayment: number
  dueDate: string
  createdAt: string
  milestones: Array<{
    id: number
    title: string
    description: string
    status: 'pending' | 'in_progress' | 'completed'
    dueDate: string
    completedAt?: string
  }>
  files: Array<{
    id: number
    name: string
    size: number
    type: string
    uploadedAt: string
    uploadedBy: string
    url: string
  }>
  messages: Array<{
    id: number
    content: string
    sender: 'client' | 'team'
    timestamp: string
    senderName: string
  }>
}

interface ClientInfo {
  companyName: string
  contactName: string
  email: string
  phone: string
}

const ProjectWorkspace: React.FC = () => {
  const { projectToken } = useParams<{ projectToken: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<ClientProject | null>(null)
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'design' | 'milestones' | 'files' | 'messages'>('overview')
  const [projects, setProjects] = useState<any[]>([])
  const [isAdminMode, setIsAdminMode] = useState(!projectToken)

  // Milestone management state
  const [milestones, setMilestones] = useState<any[]>([])
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<any>(null)
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    order: 0
  })
  
  // Project management state (for admin mode)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'archived'>('all')
  const [showActions, setShowActions] = useState<number | null>(null)

  useEffect(() => {
    // Only proceed if we have a valid project token (not null, undefined, or 'null')
    if (projectToken && projectToken !== 'null' && projectToken !== 'undefined') {
      setIsAdminMode(false)
      fetchProjectData()
    } else {
      setIsAdminMode(true)
      fetchProjectsList()
    }
  }, [projectToken])

  // Fetch milestones when project loads
  useEffect(() => {
    if (project?.id && !isAdminMode) {
      fetchMilestones()
    }
  }, [project?.id, isAdminMode])
  
  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showActions !== null) {
        setShowActions(null)
      }
    }
    
    if (isAdminMode && showActions !== null) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showActions, isAdminMode])

  const fetchProjectsList = async () => {
    try {
      setLoading(true)
      // Fetch projects for admin mode
      const response = await api.get('/projects?token=pleasantcove2024admin')
      setProjects(response.data || [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      setLoading(false)
    }
  }

  const fetchProjectData = async () => {
    try {
      setLoading(true)
      
      // Try to fetch real project data using token
      try {
        // Only fetch if we have a valid project ID
        if (!projectToken || projectToken === 'null' || projectToken === 'undefined') {
          throw new Error('Invalid project ID')
        }
        // Use admin endpoint to get project by ID
        const response = await api.get(`/projects/${projectToken}`)
        
        // Handle both direct project response and wrapped response
        const projectData = response.data.project || response.data
        
        setProject(projectData)
        setClientInfo({
          companyName: projectData.company?.name || response.data.company?.name || 'Company Name',
          contactName: projectData.company?.name || response.data.company?.name || 'Contact Name',
          email: projectData.company?.email || response.data.company?.email || 'email@example.com',
          phone: projectData.company?.phone || response.data.company?.phone || '555-555-5555'
        })
      } catch (error: any) {
        console.log('API Error:', error.message)
        if (error.message?.includes('Invalid project') || error.response?.status === 404) {
          setError('Project not found. Redirecting to dashboard...')
          setTimeout(() => {
            navigate('/')
          }, 2000)
        } else {
          console.log('No real project data, using mock data for demonstration')
          
          // Mock data for demonstration
          const mockProject: ClientProject = {
            id: 1,
            name: "Professional Website Development",
            description: "Custom website with modern design, responsive layout, and content management system",
            status: "active",
            progress: 65,
            totalValue: 2497,
            paidAmount: 1200,
            nextPayment: 1297,
            dueDate: "2025-02-15",
            createdAt: "2025-01-10",
            milestones: [
              {
                id: 1,
                title: "Discovery & Planning",
                description: "Gathering requirements and creating project roadmap",
                status: "completed",
                dueDate: "2025-01-15",
                completedAt: "2025-01-14"
              },
              {
                id: 2,
                title: "Design & Wireframes",
                description: "Creating visual designs and user interface layouts",
                status: "completed",
                dueDate: "2025-01-22",
                completedAt: "2025-01-21"
              },
              {
                id: 3,
                title: "Development Phase 1",
                description: "Building core functionality and pages",
                status: "in_progress",
                dueDate: "2025-02-05"
              },
              {
                id: 4,
                title: "Content Integration",
                description: "Adding your content and optimizing for search engines",
                status: "pending",
                dueDate: "2025-02-10"
              },
              {
                id: 5,
                title: "Testing & Launch",
                description: "Final testing and website deployment",
                status: "pending",
                dueDate: "2025-02-15"
              }
            ],
            files: [
              {
                id: 1,
                name: "Website_Mockups_v2.pdf",
                size: 2400000,
                type: "application/pdf",
                uploadedAt: "2025-01-21",
                uploadedBy: "Design Team",
                url: "/api/files/download/1"
              },
              {
                id: 2,
                name: "Brand_Guidelines.pdf",
                size: 1800000,
                type: "application/pdf",
                uploadedAt: "2025-01-18",
                uploadedBy: "Design Team",
                url: "/api/files/download/2"
              },
              {
                id: 3,
                name: "Content_Requirements.docx",
                size: 450000,
                type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                uploadedAt: "2025-01-15",
                uploadedBy: "Project Manager",
                url: "/api/files/download/3"
              }
            ],
            messages: [
              {
                id: 1,
                content: "Welcome to your project! We're excited to work with you. Our team has reviewed your requirements and we'll begin with the discovery phase.",
                sender: "team",
                timestamp: "2025-01-10T10:00:00Z",
                senderName: "Sarah - Project Manager"
              },
              {
                id: 2,
                content: "Thank you! I'm looking forward to seeing the progress. When can we expect the first designs?",
                sender: "client",
                timestamp: "2025-01-10T14:30:00Z",
                senderName: "You"
              },
              {
                id: 3,
                content: "Great question! We'll have the initial wireframes ready by January 20th, followed by the visual designs. I've uploaded the project timeline for your reference.",
                sender: "team",
                timestamp: "2025-01-11T09:15:00Z",
                senderName: "Sarah - Project Manager"
              },
              {
                id: 4,
                content: "The design mockups are now ready! Please review the attached PDF and let us know your thoughts. We're particularly interested in your feedback on the color scheme and layout.",
                sender: "team",
                timestamp: "2025-01-21T16:45:00Z",
                senderName: "Mike - Lead Designer"
              }
            ]
          }
          
          const mockClientInfo: ClientInfo = {
            companyName: "Coastal Maine Restaurant",
            contactName: "John Smith",
            email: "john@coastalmainerestaurant.com",
            phone: "(207) 555-0123"
          }
          
          setProject(mockProject)
          setClientInfo(mockClientInfo)
        }
      }
    } catch (error) {
      console.error('Error fetching project data:', error)
      setError('Failed to load project data')
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return
    
    setSendingMessage(true)
    try {
      // Get client info for sender name
      const senderName = clientInfo?.contactName || clientInfo?.companyName || 'Client'
      
      const response = await api.post(`/public/project/${projectToken}/messages`, {
        content: newMessage.trim(),
        senderName: senderName
      })
      
      if (response.data.success) {
        // Add the new message to the local state
        const newMsg = {
          id: Date.now(),
          content: newMessage.trim(),
          sender: 'client' as const,
          timestamp: new Date().toISOString(),
          senderName: 'You'
        }
        
        setProject(prev => prev ? {
          ...prev,
          messages: [...prev.messages, newMsg]
        } : null)
        
        setNewMessage('')
      } else {
        console.warn('Server returned non-success response:', response.data)
        // Add message locally anyway for better UX
        const newMsg = {
          id: Date.now(),
          content: newMessage.trim(),
          sender: 'client' as const,
          timestamp: new Date().toISOString(),
          senderName: 'You'
        }
        
        setProject(prev => prev ? {
          ...prev,
          messages: [...prev.messages, newMsg]
        } : null)
        
        setNewMessage('')
      }
    } catch (error: any) {
      console.error('Error sending message:', error)
      
      if (error.response?.status === 400 && error.response?.data?.error === 'Sender name is required') {
        console.log('Retrying with default sender name')
        // Retry with default sender name
        try {
          const response = await api.post(`/public/project/${projectToken}/messages`, {
            content: newMessage.trim(),
            senderName: 'Client'
          })
          
          if (response.data.success) {
            // Add the new message to the local state
            const newMsg = {
              id: Date.now(),
              content: newMessage.trim(),
              sender: 'client' as const,
              timestamp: new Date().toISOString(),
              senderName: 'You'
            }
            
            setProject(prev => prev ? {
              ...prev,
              messages: [...prev.messages, newMsg]
            } : null)
            
            setNewMessage('')
          }
        } catch (retryError) {
          console.error('Error on retry:', retryError)
          // Fall through to add message locally
        }
      }
      
      // Add message locally anyway for better UX
      const newMsg = {
        id: Date.now(),
        content: newMessage.trim(),
        sender: 'client' as const,
        timestamp: new Date().toISOString(),
        senderName: 'You'
      }
      
      setProject(prev => prev ? {
        ...prev,
        messages: [...prev.messages, newMsg]
      } : null)
      
      setNewMessage('')
    } finally {
      setSendingMessage(false)
    }
  }

  // Project Management Actions
  const handleProjectStatusChange = async (newStatus: 'active' | 'completed' | 'archived') => {
    if (!project?.id) return

    const confirmMessage = newStatus === 'completed'
      ? 'Are you sure you want to mark this project as completed?'
      : newStatus === 'archived'
      ? 'Are you sure you want to archive this project? It will be hidden from active view.'
      : 'Are you sure you want to change the project status?'

    if (!confirm(confirmMessage)) return

    try {
      await api.put(`/projects/${project.id}`, { status: newStatus })

      // Update local project status
      setProject(prev => prev ? { ...prev, status: newStatus } : null)

      alert(`Project ${newStatus === 'completed' ? 'marked as complete' : newStatus === 'archived' ? 'archived' : 'status updated'} successfully!`)
    } catch (error) {
      console.error('Failed to update project status:', error)
      alert('Failed to update project status. Please try again.')
    }
  }

  // Milestone Management Functions
  const fetchMilestones = async () => {
    if (!project?.id) return

    try {
      const response = await api.get(`/projects/${project.id}/milestones`)
      setMilestones(response.data)
    } catch (error) {
      console.error('Failed to fetch milestones:', error)
    }
  }

  const handleCreateMilestone = async () => {
    if (!project?.id) return

    try {
      await api.post(`/projects/${project.id}/milestones`, milestoneForm)
      setShowMilestoneForm(false)
      setMilestoneForm({ title: '', description: '', dueDate: '', order: milestones.length + 1 })
      fetchMilestones()
      alert('Milestone created successfully!')
    } catch (error) {
      console.error('Failed to create milestone:', error)
      alert('Failed to create milestone. Please try again.')
    }
  }

  const handleUpdateMilestone = async (milestoneId: number, updates: any) => {
    if (!project?.id) return

    try {
      await api.put(`/projects/${project.id}/milestones/${milestoneId}`, updates)
      fetchMilestones()
    } catch (error) {
      console.error('Failed to update milestone:', error)
      alert('Failed to update milestone. Please try again.')
    }
  }

  const handleDeleteMilestone = async (milestoneId: number) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return

    if (!project?.id) return

    try {
      await api.delete(`/projects/${project.id}/milestones/${milestoneId}`)
      fetchMilestones()
      alert('Milestone deleted successfully!')
    } catch (error) {
      console.error('Failed to delete milestone:', error)
      alert('Failed to delete milestone. Please try again.')
    }
  }

  const handleEditMilestone = (milestone: any) => {
    setEditingMilestone(milestone)
    setMilestoneForm({
      title: milestone.title,
      description: milestone.description,
      dueDate: milestone.dueDate || '',
      order: milestone.order || 0
    })
    setShowMilestoneForm(true)
  }

  const handleUpdateMilestoneStatus = async (milestoneId: number, status: string) => {
    await handleUpdateMilestone(milestoneId, { status })
  }

  const resetMilestoneForm = () => {
    setMilestoneForm({ title: '', description: '', dueDate: '', order: 0 })
    setEditingMilestone(null)
    setShowMilestoneForm(false)
  }

  const handleDeleteProject = async () => {
    if (!project?.id) return

    const confirmDelete = confirm(
      '⚠️ WARNING: This will permanently delete the project and all associated data!\n\n' +
      'This action cannot be undone. Are you absolutely sure?'
    )

    if (!confirmDelete) return

    // Additional confirmation
    const finalConfirm = prompt('FINAL WARNING: Type "DELETE" to confirm permanent deletion:')
    if (finalConfirm !== 'DELETE') return

    try {
      await api.delete(`/projects/${project.id}`)

      alert('Project deleted successfully.')
      navigate('/') // Redirect to dashboard
    } catch (error) {
      console.error('Failed to delete project:', error)
      alert('Failed to delete project. Please try again.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'review': return 'bg-yellow-100 text-yellow-800'
      case 'on_hold': return 'bg-gray-100 text-gray-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMilestoneIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'in_progress': return <Clock className="h-5 w-5 text-blue-600" />
      case 'pending': return <AlertCircle className="h-5 w-5 text-gray-400" />
      default: return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isAdminMode ? 'Loading projects...' : 'Loading project data...'}
          </p>
        </div>
      </div>
    )
  }

  // Admin Mode: Show project list
  if (isAdminMode) {
    // Filter projects based on search and status
    const filteredProjects = projects.filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.company?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.company?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesFilter = filterStatus === 'all' || 
                           (filterStatus === 'active' && project.stage !== 'completed') ||
                           (filterStatus === 'completed' && project.stage === 'completed') ||
                           (filterStatus === 'archived' && project.status === 'archived')
      
      return matchesSearch && matchesFilter
    })
    
    const handleDeleteProject = async (projectId: number) => {
      if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        return
      }
      
      try {
        await api.delete(`/projects/${projectId}?token=pleasantcove2024admin`)
        setProjects(projects.filter(p => p.id !== projectId))
        alert('Project deleted successfully')
      } catch (error) {
        console.error('Failed to delete project:', error)
        alert('Failed to delete project')
      }
    }
    
    const handleArchiveProject = async (projectId: number) => {
      try {
        await api.patch(`/projects/${projectId}/status`, {
          status: 'archived'
        })
        
        // Update local state
        setProjects(projects.map(p => 
          p.id === projectId ? { ...p, status: 'archived' } : p
        ))
        
        alert('Project archived successfully')
      } catch (error) {
        console.error('Failed to archive project:', error)
        alert('Failed to archive project')
      }
    }
    
    const handleCompleteProject = async (projectId: number) => {
      if (!confirm('Mark this project as completed?')) {
        return
      }
      
      try {
        await api.put(`/projects/${projectId}?token=pleasantcove2024admin`, {
          stage: 'completed',
          status: 'completed',
          progress: 100
        })
        
        // Update local state
        setProjects(projects.map(p => 
          p.id === projectId ? { ...p, stage: 'completed', status: 'completed', progress: 100 } : p
        ))
        
        alert('Project marked as completed')
      } catch (error) {
        console.error('Failed to complete project:', error)
        alert('Failed to complete project')
      }
    }
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Project Workspace</h1>
          <p className="text-muted mt-1">Manage and collaborate on your projects</p>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-lg border p-4 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects, companies, or emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Projects</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">
              {filteredProjects.length} of {projects.length} projects
            </span>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow relative"
            >
              {/* Actions Menu */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowActions(showActions === project.id ? null : project.id)
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <MoreVertical className="h-4 w-4 text-gray-500" />
                </button>
                
                {showActions === project.id && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/workspace/${project.id}`)
                        setShowActions(null)
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Open Workspace
                    </button>
                    
                    {project.stage !== 'completed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCompleteProject(project.id)
                          setShowActions(null)
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-green-600"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark Complete
                      </button>
                    )}
                    
                    {project.status !== 'archived' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleArchiveProject(project.id)
                          setShowActions(null)
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-yellow-600"
                      >
                        <Archive className="h-4 w-4" />
                        Archive
                      </button>
                    )}
                    
                    <div className="border-t my-1"></div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteProject(project.id)
                        setShowActions(null)
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Project
                    </button>
                  </div>
                )}
              </div>
              
              <div 
                onClick={() => {
                  // Always use ID for admin navigation
                  navigate(`/workspace/${project.id}`)
                }}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4 pr-8">
                  <h3 className="font-semibold text-gray-900">{project.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    project.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                    project.stage === 'completed' ? 'bg-green-100 text-green-800' : 
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {project.status === 'archived' ? 'Archived' : project.stage}
                  </span>
                </div>
                
                {/* Company Info */}
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-900">{project.company?.name || 'Unknown Company'}</p>
                  <p className="text-xs text-gray-600">{project.type} • Created {new Date(project.createdAt || Date.now()).toLocaleDateString()}</p>
                </div>
                
                {/* Project Details */}
                {project.notes && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{project.notes}</p>
                )}
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{project.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    ${project.totalAmount || 0} total
                  </span>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Open Workspace →
                  </button>
                </div>
                
                {/* Client Access Info */}
                <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                  {project.company?.email ? (
                    <div className="flex items-center justify-between">
                      <span>Client: {project.company.email}</span>
                      {(project.accessToken || project.token) && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(project.accessToken || project.token);
                            alert('Token copied!');
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Copy Token
                        </button>
                      )}
                    </div>
                  ) : (
                    <span>No client email set</span>
                  )}
                  
                  {/* Last Activity */}
                  {project.updatedAt && (
                    <div className="mt-1 text-gray-400">
                      Last updated: {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <TrendingUp className="h-16 w-16 mx-auto" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || filterStatus !== 'all' ? 'No Projects Found' : 'No Projects Yet'}
            </h4>
            <p className="text-gray-500">
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Projects will appear here when you start working with clients.'}
            </p>
          </div>
        )}
      </div>
    )
  }

  if (error || !project || !clientInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Error</h1>
          <p className="text-gray-600 mb-4">{error || 'Project not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{clientInfo?.companyName || 'Client'}</h1>
                <p className="text-gray-600">{project?.name || 'Project'}</p>
              </div>
              <div className="text-right">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(project?.status || 'active')}`}>
                  {project?.status ? project.status.replace('_', ' ') : 'Active'}
                </span>
                <p className="text-sm text-gray-600 mt-1">Due: {project?.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: Eye },
                { id: 'design', label: 'Design Canvas', icon: Palette },
                { id: 'milestones', label: 'Milestones', icon: CheckCircle },
                { id: 'files', label: 'Files', icon: Paperclip },
                { id: 'messages', label: 'Messages', icon: MessageCircle }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Client Profile */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Client Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Company Information</h4>
                    <div className="space-y-2">
                      <p><span className="font-medium">Company:</span> {clientInfo?.companyName || 'Not provided'}</p>
                      <p><span className="font-medium">Contact:</span> {clientInfo?.contactName || 'Not provided'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h4>
                    <div className="space-y-2">
                      <p><span className="font-medium">Email:</span> {clientInfo?.email || 'Not provided'}</p>
                      <p><span className="font-medium">Phone:</span> {clientInfo?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Overview */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Project Progress</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                    <span className="text-sm font-medium">{project?.progress || 0}% Complete</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${project?.progress || 0}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">{project?.description || 'No description available.'}</p>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">Total Project Value</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(project?.totalValue || 0)}</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">Amount Paid</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(project?.paidAmount || 0)}</p>
                  </div>
                  {project?.nextPayment && project.nextPayment > 0 && (
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-600">Next Payment</p>
                      <p className="text-2xl font-bold text-orange-600">{formatCurrency(project.nextPayment)}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Client Access Controls - Admin Only */}
              {isAdminMode && (
                <ProjectAccessControls
                  project={project}
                  clientEmail={clientInfo?.email}
                  onTokenGenerated={fetchProjectData}
                />
              )}

              {/* Project Management Actions - Admin Only */}
              {isAdminMode && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Archive className="h-5 w-5" />
                    Project Management
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Mark as Complete */}
                    <button
                      onClick={() => handleProjectStatusChange('completed')}
                      disabled={project?.status === 'completed'}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Mark Complete</span>
                    </button>

                    {/* Archive Project */}
                    <button
                      onClick={() => handleProjectStatusChange('archived')}
                      disabled={project?.status === 'archived'}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <Archive className="h-5 w-5" />
                      <span className="font-medium">Archive</span>
                    </button>

                    {/* Delete Project */}
                    <button
                      onClick={() => handleDeleteProject()}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                      <span className="font-medium">Delete</span>
                    </button>
                  </div>

                  {/* Current Status Display */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Current Status:</span>
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                        project?.status === 'completed' ? 'bg-green-100 text-green-800' :
                        project?.status === 'archived' ? 'bg-yellow-100 text-yellow-800' :
                        project?.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project?.status ? project.status.replace('_', ' ').toUpperCase() : 'ACTIVE'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'design' && (
            <div className="space-y-6">
              {/* Canvas Section */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden" style={{ height: '500px' }}>
                <DesignCanvas
                  projectId={project.id.toString()}
                  isReadOnly={false}
                  onSave={(canvasState) => {
                    console.log('Canvas state saved locally:', canvasState)
                    // API call is now handled directly in the DesignCanvas component
                  }}
                  onVersionCreate={(version, description) => {
                    console.log('Version created locally:', { version, description })
                    // API call is now handled directly in the DesignCanvas component
                  }}
                />
              </div>

              {/* Messages Section Below Canvas */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2 text-gray-600" />
                  Project Communication
                </h3>
                
                {/* Messages */}
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-4">
                  {project?.messages?.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'client' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === 'client'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className={`text-xs mt-1 ${message.sender === 'client' ? 'text-blue-100' : 'text-gray-500'}`}>
                          {message.senderName} • {new Date(message.timestamp || Date.now()).toLocaleDateString()} {new Date(message.timestamp || Date.now()).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!project?.messages || project.messages.length === 0) && (
                    <p className="text-center text-gray-500 py-4">No messages yet. Start a conversation!</p>
                  )}
                </div>

                {/* Message Input */}
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={sendingMessage}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>{sendingMessage ? 'Sending...' : 'Send'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'milestones' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Project Milestones</h3>
                <button
                  onClick={() => setShowMilestoneForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Milestone
                </button>
              </div>

              {/* Milestone Form */}
              {showMilestoneForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    {editingMilestone ? 'Edit Milestone' : 'Create New Milestone'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={milestoneForm.title}
                        onChange={(e) => setMilestoneForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Milestone title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (Optional)</label>
                      <input
                        type="date"
                        value={milestoneForm.dueDate}
                        onChange={(e) => setMilestoneForm(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={milestoneForm.description}
                      onChange={(e) => setMilestoneForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe what needs to be accomplished"
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={editingMilestone ?
                        () => handleUpdateMilestone(editingMilestone.id, milestoneForm) :
                        handleCreateMilestone
                      }
                      disabled={!milestoneForm.title || !milestoneForm.description}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {editingMilestone ? 'Update Milestone' : 'Create Milestone'}
                    </button>
                    <button
                      onClick={resetMilestoneForm}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Milestones List */}
              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div key={milestone.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border">
                    <div className="flex-shrink-0 mt-1">
                      {getMilestoneIcon(milestone.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{milestone.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(milestone.status)}`}>
                            {milestone.status?.replace('_', ' ') || 'Pending'}
                          </span>
                          <div className="flex gap-1">
                            {milestone.status === 'pending' && (
                              <button
                                onClick={() => handleUpdateMilestoneStatus(milestone.id, 'in_progress')}
                                className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                title="Mark as In Progress"
                              >
                                Start
                              </button>
                            )}
                            {milestone.status === 'in_progress' && (
                              <button
                                onClick={() => handleUpdateMilestoneStatus(milestone.id, 'completed')}
                                className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                title="Mark as Completed"
                              >
                                Complete
                              </button>
                            )}
                            <button
                              onClick={() => handleEditMilestone(milestone)}
                              className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                              title="Edit Milestone"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMilestone(milestone.id)}
                              className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                              title="Delete Milestone"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                      <div className="flex items-center text-xs text-gray-500 mt-2">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Due: {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : 'N/A'}</span>
                        {milestone.completedDate && (
                          <>
                            <span className="mx-2">•</span>
                            <span>Completed: {new Date(milestone.completedDate).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {milestones.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No milestones defined yet.</p>
                    <button
                      onClick={() => setShowMilestoneForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Create Your First Milestone
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Project Files</h3>
              <div className="space-y-3">
                {project?.files?.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Paperclip className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)} • Uploaded by {file.uploadedBy || 'Unknown'} on {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : 'Unknown date'}
                        </p>
                      </div>
                    </div>
                    <a
                      href={file.url}
                      download={file.name}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download</span>
                    </a>
                  </div>
                ))}
                {(!project?.files || project.files.length === 0) && (
                  <p className="text-center text-gray-500 py-8">No files available yet</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Project Communication</h3>
              
              {/* Messages */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {project?.messages?.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'client' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'client'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className={`text-xs mt-1 ${message.sender === 'client' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {message.senderName} • {message.timestamp ? new Date(message.timestamp).toLocaleDateString() : 'Unknown date'} {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ''}
                      </div>
                    </div>
                  </div>
                ))}
                {(!project?.messages || project.messages.length === 0) && (
                  <p className="text-center text-gray-500 py-8">No messages yet. Start a conversation!</p>
                )}
              </div>

              {/* Message Input */}
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={sendingMessage}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>{sendingMessage ? 'Sending...' : 'Send'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectWorkspace 