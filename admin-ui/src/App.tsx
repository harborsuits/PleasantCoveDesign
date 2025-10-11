import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Demos from "./pages/Demos";
import Outreach from "./pages/Outreach";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/Projects/ProjectDetail";
import CompaniesPage from "./pages/Companies/CompaniesPage";
import AppointmentsPage from "./pages/Appointments/AppointmentsPage";
import Sales from "./pages/Sales";
import Schedule from "./pages/Schedule";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { useWsToasts } from "@/lib/ws/useWsToasts";
import { socketService } from "@/lib/ws/SocketService";
import { AuthService } from "@/lib/auth/AuthService";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { ConversationsList } from "@/components/ConversationsList";
import { MessagesThread } from "@/components/MessagesThread";

const queryClient = new QueryClient();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hooks must be called unconditionally at the top
  const { toast } = useToast();
  useWsToasts();

  useEffect(() => {
    initializeApp();
  }, []);

  async function initializeApp() {
    try {
      console.log('🚀 [APP] Starting initialization...');
      console.log('📍 [APP] Step 1: Getting JWT token...');
      await AuthService.ensureValidToken();
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('📍 [APP] Step 2: Connecting WebSocket...');
      await socketService.connect();
      console.log('✅ [APP] WebSocket connected');
      setIsAuthenticated(true);
      console.log('🎉 [APP] Initialization complete!');
    } catch (error) {
      console.error('❌ [APP] Initialization failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>🔄 Loading Pleasant Cove Design CRM...</h2>
        <p style={{ color: '#666' }}>Connecting to backend...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '40px'
      }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#dc2626' }}>❌ Connection Error</h2>
        <p style={{ marginBottom: '20px', color: '#666' }}>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
        <div style={{ marginTop: '40px', fontSize: '14px', color: '#666', textAlign: 'center' }}>
          <p>Make sure your backend is running on localhost:3000</p>
          <p>Check the browser console for detailed logs</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>⚠️ Authentication Required</h2>
        <button 
          onClick={initializeApp}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={window.location.pathname.startsWith('/admin2') ? '/admin2' : '/admin'}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="leads" element={<Leads />} />
              <Route path="demos" element={<Demos />} />
              <Route path="outreach" element={<Outreach />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/:id" element={<ProjectDetail />} />
              <Route path="companies" element={<CompaniesPage />} />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="sales" element={<Sales />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
              <Route path="messages" element={<InboxRoute />} />
              <Route path="inbox" element={<Navigate to="messages" replace />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function InboxRoute() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 96px)' }}>
      <div style={{ width: '350px', borderRight: '1px solid #e5e7eb', background: 'white', overflowY: 'auto' }}>
        <ConversationsList onSelectConversation={setSelectedConversation} />
      </div>
      <div style={{ flex: 1, background: 'white' }}>
        {selectedConversation ? (
          <MessagesThread projectToken={selectedConversation} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>👈</div>
              <h2>Select a conversation</h2>
              <p>Choose a client conversation to view and reply</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
