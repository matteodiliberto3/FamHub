import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Finances from './pages/Finances';
import Permissions from './pages/Permissions';
import Calendar from './pages/Calendar';
import ShoppingLists from './pages/ShoppingLists';
import BudgetRequests from './pages/BudgetRequests';
import Onboarding from './pages/Onboarding';
import ChildrenManagement from './pages/ChildrenManagement';

const AuthenticatedApp = () => {
  const {
    user,
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    navigateToLogin,
    needsOnboarding,
    families,
    completeOnboarding,
  } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  if (needsOnboarding) {
    return (
      <Onboarding
        currentUser={user}
        families={families}
        onComplete={completeOnboarding}
      />
    );
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/finanze" element={<Finances />} />
        <Route path="/permessi" element={<Permissions />} />
        <Route path="/calendario" element={<Calendar />} />
        <Route path="/spesa" element={<ShoppingLists />} />
        <Route path="/budget" element={<BudgetRequests />} />
        <Route path="/figli" element={<ChildrenManagement />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
