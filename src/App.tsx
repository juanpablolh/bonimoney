import { useState } from 'react';
import { Header, HeaderName, HeaderGlobalBar, HeaderGlobalAction } from '@carbon/react';
import { Login } from '@carbon/icons-react';
import Dashboard from './components/Dashboard';
import MembersSection from './components/MembersSection';
import ExpensesSection from './components/ExpensesSection';
import CookieBanner from './components/CookieBanner';
import { useAuth } from './contexts/AuthContext';
import { useProject } from './contexts/ProjectContext';
import { useMembers } from './contexts/MemberContext';
import { useExpenses } from './contexts/ExpenseContext';
import AuthModal from './components/auth/AuthModal';
import { ProjectSelector } from './components/projects/ProjectSelector';
import { Expense as OldExpense } from './types';
import { calculateBalancesByCurrency, optimizeTransactionsByCurrency } from './utils/calculations';
import { adaptMembers, adaptExpenses } from './utils/dataAdapters';

function App() {
  const { user, signOut } = useAuth();
  const { currentProject, projects, loading: projectsLoading } = useProject();
  const { members: contextMembers, loading: membersLoading, addMember, removeMember } = useMembers();
  const { expenses: contextExpenses, loading: expensesLoading, addExpense, updateExpense, deleteExpense } = useExpenses();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'expenses'>('dashboard');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const tabs = ['dashboard', 'members', 'expenses'] as const;

  // Convert context data to old format using adapters
  const members = adaptMembers(contextMembers);
  const expenses = adaptExpenses(contextExpenses);

  // Calculate balances and transactions (existing logic works!)
  const balancesByCurrency = calculateBalancesByCurrency(members, expenses);
  const transactionsByCurrency = optimizeTransactionsByCurrency(balancesByCurrency);

  // Handler functions - connect to contexts
  const handleAddMember = async (name: string) => {
    await addMember({ name });
  };

  const handleEditMember = async (id: string, name: string) => {
    // TODO: Implement updateMember in MemberContext
    console.log('Edit member:', id, name);
  };

  const handleDeleteMember = async (id: string) => {
    await removeMember(id);
  };

  const handleShareGroup = () => {
    // TODO: Implement sharing
    console.log('Share group');
  };

  const handleAddExpense = async (expense: Omit<OldExpense, 'id' | 'date'>) => {
    await addExpense({
      description: expense.description,
      amount: expense.amount,
      paid_by: expense.paidBy,
      split_between: expense.splitBetween,
    });
  };

  const handleEditExpense = async (id: string, expense: Omit<OldExpense, 'id' | 'date'>) => {
    await updateExpense(id, {
      description: expense.description,
      amount: expense.amount,
      paid_by: expense.paidBy,
      split_between: expense.splitBetween,
    });
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteExpense(id);
  };

  const handleSettleUp = async (fromId: string, toId: string, amount: number) => {
    // TODO: Implement settle-up
    console.log('Settle up:', fromId, toId, amount);
  };

  const handleReset = () => {
    // TODO: Implement reset
    console.log('Reset');
  };

  // Show loading state while contexts are loading
  if (projectsLoading || membersLoading || expensesLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Cargando...</h2>
          <p>Preparando tu proyecto</p>
        </div>
      </div>
    );
  }

  // Show "no project" state if user is logged in but has no projects
  if (user && projects.length === 0 && !currentProject) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <Header aria-label="Bonimoney">
          <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center' }}>
            <HeaderName href="#" prefix="" style={{ fontSize: '20px' }}>
              Bonimoney
            </HeaderName>

            <div style={{ marginLeft: '2rem' }}>
              <ProjectSelector />
            </div>

            <HeaderGlobalBar style={{ marginLeft: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1rem', borderRight: '1px solid var(--cds-border-subtle)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                  {user.email}
                </span>
              </div>
              <HeaderGlobalAction
                aria-label="Cerrar Sesión"
                onClick={() => signOut()}
                tooltipAlignment="end"
              >
                Salir
              </HeaderGlobalAction>
            </HeaderGlobalBar>
          </div>
        </Header>

        <div style={{
          maxWidth: '600px',
          margin: '4rem auto',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            ¡Bienvenido a BoniMoney! 👋
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#666', marginBottom: '2rem' }}>
            Comienza creando tu primer proyecto para gestionar gastos compartidos.
          </p>
          <p style={{ color: '#999' }}>
            Haz clic en "Seleccionar Proyecto" arriba y luego en "➕ Crear Nuevo Proyecto"
          </p>
        </div>

        <CookieBanner />
      </div>
    );
  }

  // Show "select project" state if user has projects but none selected
  if (user && projects.length > 0 && !currentProject) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <Header aria-label="Bonimoney">
          <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center' }}>
            <HeaderName href="#" prefix="" style={{ fontSize: '20px' }}>
              Bonimoney
            </HeaderName>

            <div style={{ marginLeft: '2rem' }}>
              <ProjectSelector />
            </div>

            <HeaderGlobalBar style={{ marginLeft: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1rem', borderRight: '1px solid var(--cds-border-subtle)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                  {user.email}
                </span>
              </div>
              <HeaderGlobalAction
                aria-label="Cerrar Sesión"
                onClick={() => signOut()}
                tooltipAlignment="end"
              >
                Salir
              </HeaderGlobalAction>
            </HeaderGlobalBar>
          </div>
        </Header>

        <div style={{
          maxWidth: '600px',
          margin: '4rem auto',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            Selecciona un proyecto
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#666', marginBottom: '2rem' }}>
            Tienes {projects.length} proyecto{projects.length > 1 ? 's' : ''} disponible{projects.length > 1 ? 's' : ''}.
          </p>
          <p style={{ color: '#999' }}>
            Usa el selector de arriba para elegir un proyecto
          </p>
        </div>

        <CookieBanner />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header aria-label="Bonimoney">
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center' }}>
          <HeaderName href="#" prefix="" style={{ fontSize: '20px' }}>
            Bonimoney
          </HeaderName>

          {/* Project Selector */}
          <div style={{ marginLeft: '2rem' }}>
            <ProjectSelector />
          </div>

          <HeaderGlobalBar style={{ marginLeft: 'auto' }}>
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1rem', borderRight: '1px solid var(--cds-border-subtle)' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                    {user.email}
                  </span>
                </div>
                <HeaderGlobalAction
                  aria-label="Cerrar Sesión"
                  onClick={() => signOut()}
                  tooltipAlignment="end"
                >
                  Salir
                </HeaderGlobalAction>
              </>
            ) : (
              <HeaderGlobalAction
                aria-label="Iniciar Sesión"
                onClick={() => setAuthModalOpen(true)}
                tooltipAlignment="end"
              >
                <Login />
              </HeaderGlobalAction>
            )}
          </HeaderGlobalBar>
        </div>
      </Header>

      {/* Main Content */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '1px solid var(--cds-border-subtle)'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--cds-interactive)' : '2px solid transparent',
                color: activeTab === tab ? 'var(--cds-text-primary)' : 'var(--cds-text-secondary)',
                fontWeight: activeTab === tab ? 600 : 400,
                cursor: 'pointer',
                fontSize: '1rem',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'dashboard' ? 'Resumen' : tab === 'members' ? 'Integrantes' : 'Gastos'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <Dashboard
            members={members}
            expenses={expenses}
            balancesByCurrency={balancesByCurrency}
            transactionsByCurrency={transactionsByCurrency}
            onNavigateToMembers={() => setActiveTab('members')}
            onNavigateToExpenses={() => setActiveTab('expenses')}
            onSettleUp={handleSettleUp}
            onReset={handleReset}
          />
        )}
        {activeTab === 'members' && (
          <MembersSection
            members={members}
            onAddMember={handleAddMember}
            onEditMember={handleEditMember}
            onDeleteMember={handleDeleteMember}
            onShareGroup={handleShareGroup}
          />
        )}
        {activeTab === 'expenses' && (
          <ExpensesSection
            expenses={expenses}
            members={members}
            onAddExpense={handleAddExpense}
            onEditExpense={handleEditExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}
      </div>

      {/* Modals */}
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <CookieBanner />
    </div>
  );
}

export default App;
