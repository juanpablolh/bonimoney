import { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useProject } from './contexts/ProjectContext';
import { useMembers } from './contexts/MemberContext';
import { useExpenses } from './contexts/ExpenseContext';
import { AuthLanding, AuthLogin, AuthRegister, AuthForgotPassword } from './components/auth/DesktopAuthLanding';
import { Toaster, toast } from 'sonner';

import AuthModal from './components/auth/AuthModal';
import { adaptMembers, adaptExpenses } from './utils/dataAdapters';
import { calculateBalancesByCurrency, optimizeTransactionsByCurrency, formatCurrency } from './utils/calculations';
import { ResponsiveModal } from './components/ui-custom/ResponsiveModal';
import { ExpenseForm } from './components/expenses/ExpenseForm';
import { CreateProjectModal } from './components/projects/CreateProjectModal';
import { SettingsDrawer } from './components/settings/SettingsDrawer';
import { Plus, House, CaretLeft } from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getMemberAvatarColor } from './utils/avatarColors';

// Lazy load heavy components
const GlobalDashboard = lazy(() => import('./components/dashboard/GlobalDashboard').then(m => ({ default: m.GlobalDashboard })));
const InviteAcceptPage = lazy(() => import('./components/invite/InviteAcceptPage'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const MembersSection = lazy(() => import('./components/MembersSection'));
const ExpensesSection = lazy(() => import('./components/ExpensesSection'));

// Loading fallback component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-neutral-50">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
  </div>
);

// Component for the home/groups view
function HomeView() {
  const { user } = useAuth();
  const { projects, deleteProject } = useProject();
  const navigate = useNavigate();
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <GlobalDashboard
        key={`dashboard-${user?.user_metadata?.avatar_url || 'no-avatar'}`}
        projects={projects}
        onProjectClick={(id) => {
          navigate(`/project/${id}`);
        }}
        onCreateProject={() => setCreateProjectModalOpen(true)}
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
        onOpenChange={setCreateProjectModalOpen}
      />
    </>
  );
}

// Component for project view
function ProjectView() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { projects, setCurrentProject, currentProject, deleteProject } = useProject();
  const { members: contextMembers, addMember, updateMember, removeMember, loadMembers } = useMembers();
  const { expenses: contextExpenses, addExpense, updateExpense, deleteExpense } = useExpenses();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'expenses'>('dashboard');
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Set current project based on URL parameter
  useEffect(() => {
    if (projectId && projects.length > 0) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setCurrentProject(project);
      } else {
        // Project not found, redirect to home
        navigate('/');
      }
    }
  }, [projectId, projects, setCurrentProject, navigate]);

  // Handlers for Dashboard
  const handleSettleUp = async (fromId: string, toId: string, amount: number, notes?: string) => {
    try {
      await addExpense({
        description: notes || `Pago de deuda`,
        amount: amount,
        paid_by: fromId,
        split_method: 'exact',
        split_details: [{ member_id: toId, amount: amount }],
        date: new Date().toISOString(),
        expense_type: 'settlement',
        metadata: notes ? { notes } : undefined
      });
    } catch {
      // Error handled by expense context
    }
  };


  // Adapters for compatibility (memoized for performance)
  const members = useMemo(() => adaptMembers(contextMembers), [contextMembers]);
  const expenses = useMemo(() => adaptExpenses(contextExpenses), [contextExpenses]);
  const balancesByCurrency = useMemo(
    () => calculateBalancesByCurrency(members, expenses),
    [members, expenses]
  );
  const transactionsByCurrency = useMemo(
    () => optimizeTransactionsByCurrency(balancesByCurrency),
    [balancesByCurrency]
  );

  // Show loading while project is being set
  if (!currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
          <p className="font-medium text-neutral-500">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100 lg:h-screen lg:overflow-hidden">
      <SettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Header - Figma Design */}
      <header className="bg-neutral-50 sticky top-0 z-40 border-b border-neutral-200 flex-shrink-0">
        <div className="max-w-[1280px] mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: Breadcrumb with Home + Title */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (activeTab === 'dashboard') {
                  navigate('/');
                } else {
                  setActiveTab('dashboard');
                }
              }}
              className="w-12 h-9 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors flex items-center justify-center"
            >
              {activeTab === 'dashboard' ? (
                <House size={16} weight="regular" />
              ) : (
                <CaretLeft size={16} weight="bold" />
              )}
            </button>

            {/* Title */}
            <h1 className="font-serif text-2xl text-neutral-900 tracking-tight">
              Bonimoney
            </h1>
          </div>

          {/* Right: Avatar + Plus Button */}
          <div className="flex items-center gap-4">
            {(() => {
              // Systematized avatar color logic
              const colors = getMemberAvatarColor({
                name: user?.user_metadata?.full_name || user?.email?.split('@')[0],
                user_id: user?.id
              });

              return (
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="rounded-full transition-transform hover:scale-105 active:scale-95 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900"
                >
                  <Avatar className="w-12 h-12 cursor-pointer shadow-sm border border-neutral-100">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback
                      className="font-bold"
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              );
            })()}


          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 min-h-0 max-w-[1280px] w-full mx-auto px-4 pt-8 pb-12 lg:py-4 flex flex-col bg-neutral-50 ${activeTab === 'dashboard' ? 'lg:overflow-hidden' : 'lg:overflow-y-auto'}`}>
        {activeTab === 'dashboard' && (
          <Dashboard
            members={members}
            expenses={expenses}
            balancesByCurrency={balancesByCurrency}
            transactionsByCurrency={transactionsByCurrency}
            currentProject={currentProject}
            onNavigateToMembers={() => setActiveTab('members')}
            onNavigateToExpenses={() => setActiveTab('expenses')}
            onSettleUp={handleSettleUp}
            onDeleteProject={async () => {
              if (currentProject) {
                await deleteProject(currentProject.id);
                navigate('/');
              }
            }}
          />
        )}
        {activeTab === 'members' && (
          <MembersSection
            members={contextMembers}
            onAddMember={async (name) => {
              await addMember({ name });
            }}
            onEditMember={async (id, name) => {
              await updateMember(id, { name });
            }}
            onDeleteMember={removeMember}
            onShareGroup={() => {
              // Share functionality
              if (navigator.share) {
                navigator.share({
                  title: `Unirse a ${currentProject.name}`,
                  text: `Unete a mi grupo en BoniMoney para dividir gastos.`,
                  url: window.location.href,
                }).catch(() => { /* User cancelled */ });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('¡Enlace copiado al portapapeles!');
              }
            }}
            onDeleteProject={async () => {
              if (currentProject) {
                await deleteProject(currentProject.id);
                navigate('/');
              }
            }}
            onMembersRefresh={loadMembers}
          />
        )}
        {activeTab === 'expenses' && (
          <ExpensesSection
            expenses={expenses}
            members={members}
            onAddExpense={async (exp: any) => {
              await addExpense({
                description: exp.description,
                amount: exp.amount,
                paid_by: exp.paidBy,
                split_details: exp.splitBetween.map((id: string) => ({ member_id: id })),
                split_method: 'equal',
              });
            }}
            onEditExpense={(expense) => {
              setEditingExpense(expense);
              setExpenseModalOpen(true);
            }}
            onDeleteExpense={(id: string) => deleteExpense(id)}
          />
        )}
      </main>

      {/* Floating Action Button - Mobile */}
      <button
        onClick={() => setExpenseModalOpen(true)}
        className="fixed bottom-8 right-5 w-14 h-14 rounded-full bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-800 transition-all hover:scale-110 active:scale-95 shadow-2xl z-50 sm:hidden"
      >
        <Plus size={24} weight="bold" />
      </button>

      {/* Floating Action Button - Desktop */}
      <button
        onClick={() => setExpenseModalOpen(true)}
        className="hidden sm:flex fixed bottom-10 right-10 w-16 h-16 rounded-2xl bg-neutral-900 text-white items-center justify-center hover:bg-neutral-800 transition-all hover:scale-110 active:scale-95 shadow-2xl z-50"
      >
        <Plus size={28} weight="bold" />
      </button>

      <ResponsiveModal
        open={expenseModalOpen}
        onOpenChange={(open) => {
          setExpenseModalOpen(open);
          if (!open) setEditingExpense(null);
        }}
        title={editingExpense ? "Editar Gasto" : "Nuevo Gasto"}
        hideHeader={true}
        showCloseButton={false}
        fixedHeight={true}
      >
        <ExpenseForm
          members={members}
          currentUserId={user?.id}
          initialData={editingExpense ? {
            amount: editingExpense.amount,
            description: editingExpense.description,
            paid_by: editingExpense.paidBy,
            split_details: editingExpense.splitBetween.map((id: string) => ({ member_id: id })),
            date: editingExpense.date,
            notes: editingExpense.notes
          } : null}
          onClose={() => {
            setExpenseModalOpen(false);
            setEditingExpense(null);
          }}
          onSave={async (data) => {
            try {
              if (editingExpense) {
                await updateExpense(editingExpense.id, {
                  ...data,
                  split_method: 'equal',
                });
                toast.success('Gasto actualizado', {
                  description: `${data.description} - ${formatCurrency(data.amount, data.currency)}`
                });
              } else {
                await addExpense({
                  ...data,
                  split_method: 'equal',
                });
                toast.success('Gasto guardado', {
                  description: `${data.description} - ${formatCurrency(data.amount, data.currency)}`
                });
              }
              // Don't close immediately to allow animation
              // setExpenseModalOpen(false);
              // setEditingExpense(null);
            } catch (error) {
              console.error(error);
              toast.error('Error al guardar', {
                description: 'Por favor intenta de nuevo.'
              });
              throw error; // Re-throw to let ExpenseForm know it failed
            }
          }}
        />
      </ResponsiveModal>
    </div>
  );
}

function App() {
  const { user, loading: authLoading } = useAuth();
  const { loading: projectsLoading } = useProject();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Show loading state
  if (authLoading || projectsLoading) {
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
      <Suspense fallback={<LoadingSpinner />}>
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
      </Suspense>
    );
  }

  // Logged in - show app routes
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Toaster richColors position="top-center" theme="light" />
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/project/:projectId" element={<ProjectView />} />
        {/* Invitation accept page - also accessible when logged in */}
        <Route path="/invite/:token" element={<InviteAcceptPage />} />
        {/* Redirect auth routes to home if already logged in */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Common Modals hoisted to top level */}
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </Suspense>
  );
}

export default App;
