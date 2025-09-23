import React from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Home, Users, TrendingUp, Calendar, Settings, Inbox, MessageCircle, Building2, Megaphone, UserCheck, Globe, FileText, Search, LogOut, Wrench, FolderOpen, BarChart3, Layers } from 'lucide-react'
import { clsx } from 'clsx'

// Navigation configuration for Pleasant Cove Design dashboard
interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<any>
}

const navigation: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/leads', label: 'Leads', icon: Users },
  { path: '/lead-scraper', label: 'Lead Scraper', icon: Search },
  { path: '/proposals', label: 'Proposals', icon: FileText },
  { path: '/outreach', label: 'Outreach', icon: Megaphone },
  { path: '/schedule', label: 'Appointments', icon: Calendar },
  { path: '/clients', label: 'Clients', icon: Building2 },
  { path: '/workspace', label: 'Project Workspace', icon: FolderOpen },
  { path: '/progress', label: 'Progress', icon: TrendingUp },
  { path: '/interactions', label: 'Interactions', icon: MessageCircle },
  { path: '/inbox', label: 'Inbox', icon: Inbox },
  { path: '/demos', label: 'Demo Gallery', icon: Globe },
  { path: '/team', label: 'Team', icon: UserCheck },
  { path: '/settings', label: 'Settings', icon: Settings },
]

const Layout: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const isInboxPage = location.pathname.includes('/inbox')

  const handleLogout = () => {
    // Remove authentication data
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    
    // Reload the page to trigger auth check
    window.location.reload()
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header with logo and tabs */}
      <div className="bg-white shadow-sm border-b border-border">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary-600">Pleasant Cove Design</h1>
              <span className="ml-4 text-sm text-gray-500">Complete Business System</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted">Admin Dashboard</div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:block">Logout</span>
              </button>
            </div>
          </div>
          
          {/* Tab Navigation - Full Dashboard with all features */}
          <div className="flex flex-wrap gap-2 items-center -mb-px overflow-x-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap',
                      isActive
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-muted hover:text-foreground hover:border-gray-300'
                    )
                  }
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {item.label}
                </NavLink>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main content - Full width for inbox, regular padding for other pages */}
      <main className={isInboxPage ? '' : 'px-6 py-8'}>
        <Outlet />
      </main>
    </div>
  )
}

export default Layout