import { useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useProject } from './contexts/ProjectContext';
import { AuthLanding, AuthLogin, AuthRegister, AuthForgotPassword } from './components/auth/DesktopAuthLanding';
import { Toaster } from 'sonner';

import AuthModal from './components/auth/AuthModal';
import { CreateProjectModal } from './components/projects/CreateProjectModal';
import { SettingsDrawer } from './components/settings/SettingsDrawer';

// Import pages
import { GlobalDashboard } from './components/dashboard/GlobalDashboard';
import InviteAcceptPage from './components/invite/InviteAcceptPage';
import { ProjectLayout } from './layouts/ProjectLayout';
import ProjectOverview from './pages/ProjectOverview';
import ProjectExpenses from './pages/ProjectExpenses';
import ProjectMembers from './pages/ProjectMembers';
import ProjectSettings from './pages/ProjectSettings';

// Component for the home/groups view
function HomeView() {
  const { user } = useAuth();
  const { projects, deleteProject } = useProject();
  const navigate = useNavigate();
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(() => {
    // Restore open state from session storage (handles background refresh)
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('boni_create_project_open') === 'true';
    }
    return false;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleCreateProjectOpenChange = (open: boolean) => {
    setCreateProjectModalOpen(open);
    if (open) {
      sessionStorage.setItem('boni_create_project_open', 'true');
    } else {
      sessionStorage.removeItem('boni_create_project_open');
    }
  };

  return (
    <>
      <GlobalDashboard
        key={`dashboard-${user?.user_metadata?.avatar_url || 'no-avatar'}`}
        projects={projects}
        onProjectClick={(id: string) => {
          navigate(`/projects/${id}`);
        }}
        onCreateProject={() => handleCreateProjectOpenChange(true)}
        onDeleteProject={deleteProject}
        userName={user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Usuario"}
        userId={user?.id}
        userAvatarUrl={user?.user_metadata?.avatar_url}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <SettingsDrawer
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />

      <CreateProjectModal
        open={createProjectModalOpen}
        onOpenChange={handleCreateProjectOpenChange}
      />
    </>
  );
}

function App() {
  const { user, loading: authLoading } = useAuth();
  const { projects, loading: projectsLoading } = useProject();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Soft Loading Check: Only show full-page loader if we have NO data in state
  const isHardLoading = (authLoading || projectsLoading) && projects.length === 0;

  if (isHardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
          <p className="font-medium text-neutral-500">BoniMoney</p>
        </div>
      </div>
    );
  }

  // Not logged in - show auth routes
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<AuthLanding />} />
        <Route path="/login" element={<AuthLogin />} />
        <Route path="/register" element={<AuthRegister />} />
        <Route path="/forgot-password" element={<AuthForgotPassword />} />
        {/* Invitation accept page - accessible without login */}
        <Route path="/invite/:token" element={<InviteAcceptPage />} />
        {/* Redirect any other route to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Logged in - show app routes
  return (
    <>
      <Toaster richColors position="top-center" theme="light" />
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/projects/:projectId" element={<ProjectLayout />}>
          <Route index element={<ProjectOverview />} />
          <Route path="expenses" element={<ProjectExpenses />} />
          <Route path="members" element={<ProjectMembers />} />
          <Route path="settings" element={<ProjectSettings />} />
        </Route>
        {/* Legacy route redirect */}
        <Route path="/project/:projectId" element={<Navigate to="/projects/:projectId" replace />} />
        {/* Invitation accept page - also accessible when logged in */}
        <Route path="/invite/:token" element={<InviteAcceptPage />} />
        {/* Redirect auth routes to home if already logged in */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Common Modals hoisted to top level */}
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}

export default App;
