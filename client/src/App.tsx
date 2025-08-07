import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/components/auth-provider";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import PatientView from "@/pages/patient-view";

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, hasAnyRole } = useAuth();
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    return <Redirect to="/unauthorized" />;
  }
  
  return <>{children}</>;
}

function Router() {
  const { isAuthenticated, hasRole } = useAuth();

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? (
          hasRole('patient') ? <Redirect to="/patient-view" /> : <Redirect to="/dashboard" />
        ) : (
          <Login />
        )}
      </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute allowedRoles={['staff', 'admin']}>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/patient-view">
        <ProtectedRoute allowedRoles={['patient']}>
          <PatientView />
        </ProtectedRoute>
      </Route>
      
      <Route path="/patient/:patientId/data">
        <ProtectedRoute allowedRoles={['patient', 'staff', 'admin']}>
          <PatientView />
        </ProtectedRoute>
      </Route>
      
      <Route path="/unauthorized">
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h1>
            <p className="text-gray-600 dark:text-gray-400">You don't have permission to access this page.</p>
          </div>
        </div>
      </Route>
      
      <Route path="/">
        {isAuthenticated ? (
          hasRole('patient') ? <Redirect to="/patient-view" /> : <Redirect to="/dashboard" />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
