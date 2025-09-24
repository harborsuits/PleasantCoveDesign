import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
// Force rebuild: ${new Date().toISOString()}
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import Layout from './Layout'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import LeadsUnified from './pages/LeadsUnified'
import Proposals from './pages/Proposals'
import Outreach from './pages/Outreach'
import Schedule from './pages/Schedule'
import Clients from './pages/Clients'
import ClientProfile from './pages/ClientProfile'
import Workspace from './pages/Workspace'
import ProjectWorkspace from './pages/ProjectWorkspace'
import Interactions from './pages/Interactions'
import Inbox from './pages/Inbox'
import Demos from './pages/Demos'
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
            <Route path="leads" element={<LeadsUnified />} />
            <Route path="lead-scraper" element={<LeadsUnified />} />
            <Route path="proposals" element={<Proposals />} />
            <Route path="outreach" element={<Outreach />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/:clientId" element={<ClientProfile />} />
            <Route path="workspace" element={<Workspace />} />
            <Route path="projects/:projectToken" element={<ProjectWorkspace />} />
            <Route path="interactions" element={<Interactions />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="inbox/:projectToken" element={<Inbox />} />
            <Route path="business/1/inbox" element={<Inbox />} />
            <Route path="demos" element={<Demos />} />
            <Route path="team" element={<Team />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App