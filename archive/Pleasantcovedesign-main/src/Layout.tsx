import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Home, Users, TrendingUp, Calendar, Settings, Inbox, MessageCircle } from 'lucide-react'
import { clsx } from 'clsx'

// Navigation configuration for Pleasant Cove Design dashboard
interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<any>
}

const navigation: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/business/1/inbox', label: 'Biz Pro Inbox', icon: Inbox },
  { path: '/leads', label: 'Leads', icon: Users },
  { path: '/interactions', label: 'Interactions', icon: MessageCircle },
  { path: '/progress', label: 'Progress', icon: TrendingUp },
  { path: '/schedule', label: 'Appointments', icon: Calendar },
  { path: '/settings', label: 'Settings', icon: Settings },
]

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with logo and tabs */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">Pleasant Cove Design</h1>
            </div>
            <div className="text-sm text-gray-600">Biz Pro Dashboard</div>
          </div>

          {/* Tab Navigation - Full Dashboard */}
          <div className="flex space-x-8 -mb-px">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    isActive
                      ? 'flex items-center py-4 px-1 border-b-2 font-medium text-sm border-blue-500 text-blue-600'
                      : 'flex items-center py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
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

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout 