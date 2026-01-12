import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useProject } from './contexts/ProjectContext';
import { useMembers } from './contexts/MemberContext';
import { useExpenses } from './contexts/ExpenseContext';
import HomeLogin from './components/auth/HomeLogin';

import AuthModal from './components/auth/AuthModal';
import { GlobalDashboard } from './components/dashboard/GlobalDashboard';
import { Button } from './components/ui/button';
import { adaptMembers, adaptExpenses } from './utils/dataAdapters';
import { calculateBalancesByCurrency, optimizeTransactionsByCurrency } from './utils/calculations';
import { ResponsiveModal } from './components/ui-custom/ResponsiveModal';
import { ExpenseForm } from './components/expenses/ExpenseForm';
import { CreateProjectModal } from './components/projects/CreateProjectModal';
import { Plus, House, SignOut, CaretLeft } from '@phosphor-icons/react';
import Dashboard from './components/Dashboard';
import MembersSection from './components/MembersSection';
import ExpensesSection from './components/ExpensesSection';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function App() {
  const { user, signOut } = useAuth();
  const { currentProject, projects, loading: projectsLoading, setCurrentProject, deleteProject } = useProject();
  const { members: contextMembers, addMember, updateMember, removeMember } = useMembers();
  const { expenses: contextExpenses, addExpense, updateExpense, deleteExpense } = useExpenses();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'expenses'>('dashboard');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);

  // Handlers for Dashboard
  const handleSettleUp = async (fromId: string, toId: string, amount: number) => {
    try {
      await addExpense({
        description: `Pago de deuda`,
        amount: amount,
        paid_by: fromId,
        split_method: 'exact',
        split_details: [{ member_id: toId, amount: amount }],
        date: new Date().toISOString(),
        expense_type: 'settlement'
      });
    } catch (error) {
      console.error('Error settling up:', error);
    }
  };

  const handleResetData = async () => {
    if (confirm('¿Estás seguro de que quieres borrar todos los gastos de este proyecto?')) {
      try {
        for (const expense of contextExpenses) {
          await deleteExpense(expense.id);
        }
      } catch (error) {
        console.error('Error resetting expenses:', error);
      }
    }
  };

  // Adapters for compatibility
  const members = adaptMembers(contextMembers);
  const expenses = adaptExpenses(contextExpenses);
  const balancesByCurrency = calculateBalancesByCurrency(members, expenses);
  const transactionsByCurrency = optimizeTransactionsByCurrency(balancesByCurrency);

  // Show loading state
  if (projectsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
          <p className="font-medium text-stone-500">BoniMoney</p>
        </div>
      </div>
    );
  }

  // Not logged in view
  if (!user) {
    return <HomeLogin />;
  }

  return (
    <>
      {!currentProject ? (
        // Global Dashboard (No project selected)
        <>
          <GlobalDashboard
            projects={projects}
            onProjectClick={(id) => {
              const proj = projects.find(p => p.id === id);
              if (proj) {
                setCurrentProject(proj);
                setActiveTab('dashboard');
              }
            }}
            onCreateProject={() => setCreateProjectModalOpen(true)}
            onDeleteProject={deleteProject}
            userName={user.user_metadata?.full_name || user.email?.split('@')[0] || "Usuario"}
          />
          <div className="fixed bottom-6 right-6 z-[60]">
            <Button
              variant="outline"
              size="icon"
              onClick={() => signOut()}
              className="rounded-full h-12 w-12 bg-white/80 backdrop-blur-md shadow-lg border-stone-100 hover:bg-stone-50 transition-all active:scale-90"
            >
              <SignOut size={20} weight="bold" />
            </Button>
          </div>
        </>
      ) : (
        // Project Specific View
        <div className="min-h-screen flex flex-col bg-stone-50/30 lg:h-screen lg:overflow-hidden">
          {/* Header - Figma Design */}
          <header className="bg-white sticky top-0 z-40 border-b border-stone-100 flex-shrink-0">
            <div className="max-w-[1280px] mx-auto px-4 py-3 flex items-center justify-between">
              {/* Left: Breadcrumb with Home + Title */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (activeTab === 'dashboard') {
                      setCurrentProject(null);
                    } else {
                      setActiveTab('dashboard');
                    }
                  }}
                  className="w-12 h-9 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors flex items-center justify-center"
                >
                  {activeTab === 'dashboard' ? (
                    <House size={16} weight="regular" />
                  ) : (
                    <CaretLeft size={16} weight="bold" />
                  )}
                </button>

                {/* Title */}
                <h1 className="font-serif text-2xl text-stone-900 tracking-tight">
                  Bonimoney
                </h1>
              </div>

              {/* Right: Avatar + Plus Button */}
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-stone-200 text-stone-700 font-bold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                <button
                  onClick={() => setExpenseModalOpen(true)}
                  className="w-12 h-12 rounded-xl bg-stone-900 text-white flex items-center justify-center hover:bg-stone-800 transition-colors shadow-lg"
                >
                  <Plus size={20} weight="bold" />
                </button>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 min-h-0 max-w-[1280px] w-full mx-auto px-4 pt-8 pb-12 lg:py-4 lg:overflow-hidden flex flex-col">
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
                onReset={handleResetData}
                onAddMember={async (name) => {
                  if (currentProject) {
                    await addMember({ name });
                  }
                }}
              />
            )}
            {activeTab === 'members' && (
              <MembersSection
                members={members}
                onAddMember={async (name) => {
                  await addMember({ name });
                }}
                onEditMember={async (id, name) => {
                  await updateMember(id, { name });
                }}
                onDeleteMember={async (id) => {
                  try {
                    await removeMember(id);
                  } catch (error) {
                    console.error("Failed to delete member:", error);
                    alert("No se puede eliminar este integrante porque tiene gastos o transacciones asociadas. Elimina sus gastos primero.");
                  }
                }}
                onShareGroup={() => {
                  // Share functionality
                  if (navigator.share) {
                    navigator.share({
                      title: `Unirse a ${currentProject.name}`,
                      text: `Unete a mi grupo en BoniMoney para dividir gastos.`,
                      url: window.location.href,
                    }).catch(console.error);
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('¡Enlace copiado al portapapeles!');
                  }
                }}
                onDeleteProject={async () => {
                  if (currentProject) {
                    await deleteProject(currentProject.id);
                    setCurrentProject(null);
                  }
                }}
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
                if (editingExpense) {
                  await updateExpense(editingExpense.id, {
                    ...data,
                    split_method: 'equal',
                  });
                } else {
                  await addExpense({
                    ...data,
                    split_method: 'equal',
                  });
                }
                setExpenseModalOpen(false);
                setEditingExpense(null);
              }}
            />
          </ResponsiveModal>
        </div>
      )}

      {/* Common Modals hoisted to top level */}
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      <CreateProjectModal
        open={createProjectModalOpen}
        onOpenChange={setCreateProjectModalOpen}
      />
    </>
  );
}

export default App;
