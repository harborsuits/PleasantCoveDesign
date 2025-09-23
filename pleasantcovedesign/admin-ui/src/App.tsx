import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import Layout from './Layout'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import { LeadScraper } from './pages/LeadScraper'
import Proposals from './pages/Proposals'
import Outreach from './pages/Outreach'
import Schedule from './pages/Schedule'
import Clients from './pages/Clients'
import ClientProfile from './pages/ClientProfile'
import ClientPortal from './pages/ClientPortal'
import Workspace from './pages/Workspace'
import ProjectWorkspace from './pages/ProjectWorkspace'
import Interactions from './pages/Interactions'
import Progress from './pages/Progress'
import Inbox from './pages/Inbox'
import EnhancedInbox from './pages/EnhancedInbox'
import ThreadedInbox from './pages/ThreadedInbox'
import DemoGallery from './pages/DemoGallery'
import Team from './pages/Team'
import Settings from './pages/Settings'
import LoginPage from './pages/Login'

import { useAuth } from './contexts/AuthContext'

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
})

function App() {
  const { isAuthenticated } = useAuth()

  // Add error boundary
  const ErrorFallback = () => (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Something went wrong</h2>
      <button onClick={() => window.location.reload()}>Reload</button>
    </div>
  )

  try {
    if (!isAuthenticated) {
      return (
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <LoginPage />
        </ThemeProvider>
      )
    }

    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="leads" element={<Leads />} />
              <Route path="lead-scraper" element={<LeadScraper />} />
              <Route path="proposals" element={<Proposals />} />
              <Route path="outreach" element={<Outreach />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="clients" element={<Clients />} />
              <Route path="clients/:clientId" element={<ClientProfile />} />
              <Route path="client-portal/:clientId" element={<ClientPortal />} />
              <Route path="workspace" element={<Workspace />} />
              <Route path="projects/:projectToken" element={<ProjectWorkspace />} />
              <Route path="interactions" element={<Interactions />} />
              <Route path="progress" element={<Progress />} />
              <Route path="inbox" element={<Inbox />} />
              <Route path="inbox/:projectToken" element={<Inbox />} />
              <Route path="enhanced-inbox" element={<EnhancedInbox />} />
              <Route path="threaded-inbox" element={<ThreadedInbox />} />
              <Route path="business/1/inbox" element={<Inbox />} />
              <Route path="demos" element={<DemoGallery />} />
              <Route path="team" element={<Team />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    )
  } catch (error) {
    console.error('App render error:', error)
    return <ErrorFallback />
  }
}

export default App