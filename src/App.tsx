import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useProject } from './contexts/ProjectContext';
import { useMembers } from './contexts/MemberContext';
import { useExpenses } from './contexts/ExpenseContext';
import { AuthLanding, AuthLogin, AuthRegister, AuthForgotPassword } from './components/auth/DesktopAuthLanding';
import { Toaster, toast } from 'sonner';

import AuthModal from './components/auth/AuthModal';
import { Button } from './components/ui/button';
import { adaptMembers, adaptExpenses } from './utils/dataAdapters';
import { calculateBalancesByCurrency, optimizeTransactionsByCurrency } from './utils/calculations';
import { ResponsiveModal } from './components/ui-custom/ResponsiveModal';
import { ExpenseForm } from './components/expenses/ExpenseForm';
import { CreateProjectModal } from './components/projects/CreateProjectModal';
import { Plus, House, SignOut, CaretLeft } from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  const { user, signOut } = useAuth();
  const { projects, deleteProject } = useProject();
  const navigate = useNavigate();
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);

  return (
    <>
      <GlobalDashboard
        projects={projects}
        onProjectClick={(id) => {
          navigate(`/project/${id}`);
        }}
        onCreateProject={() => setCreateProjectModalOpen(true)}
        onDeleteProject={deleteProject}
        userName={user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Usuario"}
      />
      {!createProjectModalOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            variant="outline"
            size="icon"
            onClick={() => signOut()}
            className="rounded-full h-12 w-12 bg-white/80 backdrop-blur-md shadow-lg border-neutral-100 hover:bg-neutral-50 transition-all active:scale-90"
          >
            <SignOut size={20} weight="bold" />
          </Button>
        </div>
      )}
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


  // Adapters for compatibility
  const members = adaptMembers(contextMembers);
  const expenses = adaptExpenses(contextExpenses);
  const balancesByCurrency = calculateBalancesByCurrency(members, expenses);
  const transactionsByCurrency = optimizeTransactionsByCurrency(balancesByCurrency);

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
      {/* Header - Figma Design */}
      <header className="bg-white sticky top-0 z-40 border-b border-neutral-100 flex-shrink-0">
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
            <Avatar className="w-12 h-12">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-neutral-200 text-neutral-700 font-bold">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            <button
              onClick={() => setExpenseModalOpen(true)}
              className="w-12 h-12 rounded-xl bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-800 transition-colors shadow-lg"
            >
              <Plus size={20} weight="bold" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 max-w-[1280px] w-full mx-auto px-4 pt-8 pb-12 lg:py-4 lg:overflow-hidden flex flex-col bg-neutral-100">
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
                  description: `${data.description} - $${data.amount.toLocaleString('es-CL')}`
                });
              } else {
                await addExpense({
                  ...data,
                  split_method: 'equal',
                });
                toast.success('Gasto guardado', {
                  description: `${data.description} - $${data.amount.toLocaleString('es-CL')}`
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
