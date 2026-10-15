import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { hasPermission } from "./utils/rbac";

// Pages
import SplashScreen from "./pages/SplashScreen/SplashScreen";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import UploadRoom from "./pages/UploadRoom/UploadRoom";
import FileVault from "./pages/FileVault/FileVault";
import AuditLog from "./pages/AuditLog/AuditLog";
import AdminPanel from "./pages/AdminPanel/AdminPanel";
import ArchiveVault from "./pages/ArchiveVault/ArchiveVault";
import CouncilorPortal from "./pages/CouncilorPortal/CouncilorPortal";
import RoutingEngine from "./pages/RoutingEngine/RoutingEngine";
import Approvals from "./pages/Approvals/Approvals";

import AppLayout from "./components/Layout/AppLayout";

// Route guard — redirects to login if not authenticated, wraps in AppLayout
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
};

// Role guard — only renders if user has permission
const RoleGuard = ({ children, permission }) => {
  const { user } = useAuth();
  if (!user || !hasPermission(user.role, permission)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route path="/splash" element={<SplashScreen />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <UploadRoom />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vault"
        element={
          <ProtectedRoute>
            <FileVault />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vault/:documentId"
        element={
          <ProtectedRoute>
            <FileVault />
          </ProtectedRoute>
        }
      />
      <Route
        path="/archive"
        element={
          <ProtectedRoute>
            <ArchiveVault />
          </ProtectedRoute>
        }
      />
      <Route
        path="/councilor"
        element={
          <ProtectedRoute>
            <CouncilorPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/routing"
        element={
          <ProtectedRoute>
            <RoutingEngine />
          </ProtectedRoute>
        }
      />
      <Route
        path="/approvals"
        element={
          <ProtectedRoute>
            <Approvals />
          </ProtectedRoute>
        }
      />

      {/* Admin-only routes */}
      <Route
        path="/audit-log"
        element={
          <ProtectedRoute>
            <RoleGuard permission="canViewAuditLog">
              <AuditLog />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleGuard permission="canManageUsers">
              <AdminPanel />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
