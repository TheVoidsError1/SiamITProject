
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AppSidebar } from '@/components/AppSidebar';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import LeaveRequest from '@/pages/LeaveRequest';
import LeaveHistory from '@/pages/LeaveHistory';
import Profile from '@/pages/Profile';
import AdminDashboard from '@/pages/AdminDashboard';
import EmployeeManagement from '@/pages/EmployeeManagement';
import EmployeeDetail from '@/pages/EmployeeDetail';
import NotFound from '@/pages/NotFound';
import '@/i18n';

const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes with sidebar */}
              <Route 
                path="/*" 
                element={
                  <ProtectedRoute>
                    <SidebarProvider>
                      <div className="flex min-h-screen w-full">
                        <AppSidebar />
                        <div className="flex-1">
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/leave-request" element={<LeaveRequest />} />
                            <Route path="/leave-history" element={<LeaveHistory />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/admin" element={<AdminDashboard />} />
                            <Route path="/admin/employees" element={<EmployeeManagement />} />
                            <Route path="/admin/employees/:id" element={<EmployeeDetail />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </div>
                      </div>
                    </SidebarProvider>
                  </ProtectedRoute>
                } 
              />
            </Routes>
            <Toaster />
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
