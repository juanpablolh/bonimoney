import { useState, useEffect, useRef } from 'react';
import { Header, HeaderName, HeaderGlobalBar, HeaderGlobalAction, Modal, TextInput, Button as CarbonButton } from '@carbon/react';
import { Add, Copy, Checkmark, Login } from '@carbon/icons-react';
import { Member, Expense, AppData } from './types';
import { loadData, saveData, clearData } from './utils/storage';
import { calculateBalancesByCurrency, optimizeTransactionsByCurrency } from './utils/calculations';
import { getAvailableColor } from './utils/avatarColors';
import { generateShareUrl, extractSharedDataFromUrl, clearShareDataFromUrl } from './utils/share';
import { updateExpenseTimestamp } from './utils/merge';
import { subscribeToGroup, upsertGroup } from './utils/supabase';
import Dashboard from './components/Dashboard';
import MembersSection from './components/MembersSection';
import ExpensesSection from './components/ExpensesSection';
import CookieBanner from './components/CookieBanner';
import { useAuth } from './contexts/AuthContext';
import AuthModal from './components/auth/AuthModal';
// import UserProfile from './components/auth/UserProfile'; // TODO: Add to settings page

function App() {
  const { user, signOut } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'expenses'>('dashboard');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [sharedData, setSharedData] = useState<AppData | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedSharedData, setHasLoadedSharedData] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const isReceivingUpdateRef = useRef(false);
  const isSyncingRef = useRef(false);
  const timeoutRefs = useRef<Set<NodeJS.Timeout>>(new Set());

  // Load data on mount and check for shared group
  useEffect(() => {
    const hash = window.location.hash;
    const shareMatch = hash.match(/^#share=([A-Za-z0-9]{8})$/);

    if (shareMatch && shareMatch[1]) {
      // We're joining a shared group
      const id = shareMatch[1];
      setGroupId(id);
      setIsLoading(true);

      // Load data from Supabase (only once)
      extractSharedDataFromUrl().then(shared => {
        console.log('📥 Datos recibidos de extractSharedDataFromUrl:', shared);

        if (shared) {
          console.log('✅ Datos encontrados:', {
            members: shared.members?.length || 0,
            expenses: shared.expenses?.length || 0
          });

          // Cargar datos incluso si están vacíos (puede ser un grupo nuevo)
          setMembers(shared.members || []);
          setExpenses(shared.expenses || []);
          setHasLoadedSharedData(true);
          console.log('✅ Datos compartidos cargados correctamente');
        } else {
          // No data found - could be empty group
          console.warn('⚠️ No se encontraron datos compartidos para el ID:', id);
          console.warn('Esto puede ser normal si el grupo está vacío. Se cargará un grupo vacío.');

          // Load empty group (user can start adding data)
          setMembers([]);
          setExpenses([]);
          setHasLoadedSharedData(true);
        }
        setIsLoading(false);
      }).catch(error => {
        console.error('❌ Error loading shared data:', error);
        // Load local data as fallback
        const data = loadData();
        setMembers(data.members);
        setExpenses(data.expenses);
        setHasLoadedSharedData(true);
        setIsLoading(false);
      });
    } else {
      // Normal mode - load local data
      const data = loadData();
      setMembers(data.members);
      setExpenses(data.expenses);
      setIsLoading(false);
    }
  }, []);

  // Subscribe to real-time updates when in shared group mode
  useEffect(() => {
    if (!groupId || isLoading) return;

    console.log('🔔 Suscribiéndose a actualizaciones en tiempo real para grupo:', groupId);

    const unsubscribe = subscribeToGroup(groupId, (data) => {
      // Usar refs para evitar dependencias en el callback
      if (isSyncingRef.current || isReceivingUpdateRef.current) {
        console.log('⏸️ Omitiendo actualización: sincronizando o recibiendo actualización');
        return;
      }

      if (data && hasLoadedSharedData) {
        // Marcar que estamos recibiendo una actualización (evitar loop)
        isReceivingUpdateRef.current = true;

        // Obtener valores actuales usando función de actualización
        setMembers(currentMembers => {
          setExpenses(currentExpenses => {
            const currentMembersCount = currentMembers.length;
            const currentExpensesCount = currentExpenses.length;
            const newMembersCount = data.members?.length || 0;
            const newExpensesCount = data.expenses?.length || 0;

            // Detectar si hay nuevos miembros o gastos
            const hasNewMembers = newMembersCount > currentMembersCount;
            const hasNewExpenses = newExpensesCount > currentExpensesCount;
            const hasRemovedMembers = newMembersCount < currentMembersCount;
            const hasRemovedExpenses = newExpensesCount < currentExpensesCount;

            if (hasNewMembers || hasNewExpenses || hasRemovedMembers || hasRemovedExpenses) {
              console.log('🆕 Cambios detectados:', {
                nuevosMiembros: hasNewMembers ? `+${newMembersCount - currentMembersCount}` : '0',
                nuevosGastos: hasNewExpenses ? `+${newExpensesCount - currentExpensesCount}` : '0',
                miembrosEliminados: hasRemovedMembers ? `${currentMembersCount - newMembersCount}` : '0',
                gastosEliminados: hasRemovedExpenses ? `${currentExpensesCount - newExpensesCount}` : '0',
              });

              if (hasNewMembers || hasNewExpenses) {
                console.log('✨ ¡Nuevos datos disponibles!');
              }
            }

            console.log('📨 Actualización en tiempo real aplicada:', {
              miembros: `${currentMembersCount} → ${newMembersCount}`,
              gastos: `${currentExpensesCount} → ${newExpensesCount}`
            });

            // Save to local storage as backup (pero NO a Supabase para evitar loop)
            saveData(data);

            // Reset flag after a delay (with cleanup)
            const timeoutId = setTimeout(() => {
              isReceivingUpdateRef.current = false;
              timeoutRefs.current.delete(timeoutId);
            }, 2000);
            timeoutRefs.current.add(timeoutId);

            return data.expenses || [];
          });
          return data.members || [];
        });
      }
    });

    return () => {
      console.log('🔕 Desuscribiéndose de actualizaciones en tiempo real');
      unsubscribe();
    };
  }, [groupId, isLoading, hasLoadedSharedData]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, []);

  // Save data whenever members or expenses change
  useEffect(() => {
    // Don't save during initial load
    if (isLoading || !hasLoadedSharedData) {
      return;
    }

    // Don't save if we're receiving an update from real-time (evitar loop)
    if (isReceivingUpdateRef.current) {
      console.log('⏸️ Omitiendo guardado: actualización en tiempo real en progreso');
      return;
    }

    // Save to local storage
    saveData({ members, expenses });

    // If in shared group mode, also save to Supabase
    if (groupId && !isSyncingRef.current && hasLoadedSharedData) {
      isSyncingRef.current = true;
      console.log('💾 Guardando datos en Supabase...', {
        members: members.length,
        expenses: expenses.length
      });

      upsertGroup(groupId, { members, expenses })
        .then(() => {
          console.log('✅ Datos guardados en Supabase correctamente');
          isSyncingRef.current = false;
        })
        .catch((error) => {
          console.error('❌ Error syncing to Supabase:', error);
          isSyncingRef.current = false;
        });
    }
  }, [members, expenses, groupId, isLoading, hasLoadedSharedData]);

  const addMember = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      console.warn('Intento de agregar miembro con nombre vacío');
      return;
    }
    const newMember: Member = {
      id: crypto.randomUUID(),
      name: trimmedName,
      avatarColor: getAvailableColor(members),
    };
    setMembers([...members, newMember]);
  };

  const editMember = (id: string, newName: string) => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      console.warn('Intento de editar miembro con nombre vacío');
      return;
    }
    setMembers(members.map((m) => (m.id === id ? { ...m, name: trimmedName } : m)));
  };

  const deleteMember = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este integrante? Esto también eliminará todos los gastos relacionados.')) {
      setMembers(members.filter((m) => m.id !== id));
      setExpenses(expenses.filter((e) => e.paidBy !== id && !e.splitBetween.includes(id)));
    }
  };

  const addExpense = (expense: Omit<Expense, 'id' | 'date'>) => {
    // Validate expense data
    if (!expense.description?.trim()) {
      console.warn('Intento de agregar gasto sin descripción');
      return;
    }
    if (expense.amount <= 0 || !isFinite(expense.amount)) {
      console.warn('Intento de agregar gasto con monto inválido:', expense.amount);
      return;
    }
    if (!expense.paidBy || !expense.splitBetween || expense.splitBetween.length === 0) {
      console.warn('Intento de agregar gasto sin pagador o sin participantes');
      return;
    }

    const newExpense: Expense = updateExpenseTimestamp({
      ...expense,
      id: crypto.randomUUID(),
      date: new Date(),
    });
    setExpenses([...expenses, newExpense]);
  };

  const editExpense = (id: string, expense: Omit<Expense, 'id' | 'date'>) => {
    const existingExpense = expenses.find((e) => e.id === id);
    if (existingExpense) {
      const updatedExpense: Expense = updateExpenseTimestamp({
        ...expense,
        id: existingExpense.id,
        date: existingExpense.date, // Mantener la fecha original
      });
      setExpenses(expenses.map((e) => (e.id === id ? updatedExpense : e)));
    }
  };

  const deleteExpense = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      setExpenses(expenses.filter((e) => e.id !== id));
    }
  };

  const settleUp = (fromId: string, toId: string, amount: number) => {
    // Create a settlement expense
    const fromMember = members.find((m) => m.id === fromId);
    const toMember = members.find((m) => m.id === toId);

    if (fromMember && toMember) {
      const settlementExpense: Expense = {
        id: crypto.randomUUID(),
        description: `Saldar cuenta: ${fromMember.name} → ${toMember.name}`,
        amount: amount,
        currency: 'CLP', // Default currency for settlements
        paidBy: toId, // The person receiving the money
        splitBetween: [fromId], // Only the person paying
        date: new Date(),
      };
      setExpenses([...expenses, settlementExpense]);
    }
  };

  const resetData = () => {
    if (window.confirm('¿Estás seguro de que quieres resetear todos los datos? Esta acción no se puede deshacer.')) {
      clearData();
      setMembers([]);
      setExpenses([]);
    }
  };

  const handleShareGroup = async () => {
    try {
      // ENFORCE AUTHENTICATION: User must be logged in to share groups
      if (!user) {
        setAuthModalOpen(true);
        return;
      }

      // If already in a group, use that ID
      if (groupId) {
        const currentUrl = window.location.origin + window.location.pathname;
        const url = `${currentUrl}#share=${groupId}`;
        setShareUrl(url);
        setShareModalOpen(true);
        setCopied(false);
        return;
      }

      // Validate data before sharing
      if (members.length === 0 && expenses.length === 0) {
        alert('No hay datos para compartir. Agrega al menos un integrante o gasto primero.');
        return;
      }

      // Create new group
      const url = await generateShareUrl({ members, expenses });
      const shareMatch = url.match(/#share=([A-Za-z0-9]{8})$/);
      if (shareMatch && shareMatch[1]) {
        const newGroupId = shareMatch[1];
        setGroupId(newGroupId);

        // Update browser URL to include the share ID
        // This ensures the user is in "shared group mode" and will sync to Supabase
        window.history.replaceState(null, '', url);

        // Mark that shared data has been loaded (since we just created it)
        setHasLoadedSharedData(true);

        console.log('✅ Grupo creado y URL actualizada:', newGroupId);
      }
      setShareUrl(url);
      setShareModalOpen(true);
      setCopied(false);
    } catch (error) {
      console.error('Error generating share URL:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al generar el link de compartir: ${errorMessage}. Por favor, intenta de nuevo.`);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      const timeoutId = setTimeout(() => {
        setCopied(false);
        timeoutRefs.current.delete(timeoutId);
      }, 2000);
      timeoutRefs.current.add(timeoutId);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Fallback: select text
      try {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        setCopied(true);
        const timeoutId = setTimeout(() => {
          setCopied(false);
          timeoutRefs.current.delete(timeoutId);
        }, 2000);
        timeoutRefs.current.add(timeoutId);
      } catch (fallbackError) {
        console.error('Error in fallback copy:', fallbackError);
      }
    }
  };

  const handleImportSharedData = () => {
    if (sharedData) {
      if (window.confirm('¿Estás seguro de que quieres importar estos datos? Esto reemplazará todos tus datos actuales.')) {
        setMembers(sharedData.members);
        setExpenses(sharedData.expenses);
        clearShareDataFromUrl();
        setImportModalOpen(false);
        setSharedData(null);
      }
    }
  };

  const handleJoinGroup = () => {
    const hash = window.location.hash;
    const shareMatch = hash.match(/^#share=([A-Za-z0-9]{8})$/);

    if (shareMatch && shareMatch[1]) {
      const id = shareMatch[1];
      setGroupId(id);
      setImportModalOpen(false);
      setSharedData(null);
      // Data will be loaded by the subscription
    }
  };

  const handleCancelImport = () => {
    clearShareDataFromUrl();
    setImportModalOpen(false);
    setSharedData(null);
  };


  // Calculate balances and transactions by currency
  const balancesByCurrency = calculateBalancesByCurrency(members, expenses);
  const transactionsByCurrency = optimizeTransactionsByCurrency(balancesByCurrency);

  const tabs = ['dashboard', 'members', 'expenses'] as const;

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <Header aria-label="Bonimoney">
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center' }}>
          <HeaderName href="#" prefix="" style={{ fontSize: '20px' }}>
            Bonimoney
          </HeaderName>
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
                <Login size={20} />
              </HeaderGlobalAction>
            )}
            <HeaderGlobalAction
              aria-label="Agregar Gasto"
              onClick={() => setActiveTab('expenses')}
              tooltipAlignment="end"
              className="black-add-button"
            >
              Agregar Gasto
              <Add size={20} />
            </HeaderGlobalAction>
          </HeaderGlobalBar>
        </div>
      </Header>

      {/* Navigation Tabs */}
      <nav style={{
        width: '100%',
        backgroundColor: '#f4f4f4',
        borderBottom: '1px solid #e0e0e0',
        position: 'sticky',
        top: '56px',
        zIndex: 10
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1rem'
        }}>
          <div style={{
            display: 'flex',
            gap: '0',
            width: '100%'
          }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              const labels: Record<typeof tab, string> = {
                dashboard: 'Dashboard',
                members: 'Mi Grupo',
                expenses: 'Gastos'
              };

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '16px 24px',
                    border: 'none',
                    background: isActive ? '#ffffff' : 'transparent',
                    color: isActive ? '#0f62fe' : '#525252',
                    borderBottom: isActive ? '3px solid #0f62fe' : '3px solid transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 400,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    minHeight: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    outline: 'none',
                    flex: 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#e5e5e5';
                      e.currentTarget.style.color = '#161616';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#525252';
                    }
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline = '2px solid #0f62fe';
                    e.currentTarget.style.outlineOffset = '-2px';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = 'none';
                  }}
                  aria-label={`Navegar a ${labels[tab]}`}
                  aria-selected={isActive}
                  role="tab"
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: 'calc(64px + 1rem) 1rem 1rem' }}>
        {activeTab === 'dashboard' && (
          <Dashboard
            members={members}
            expenses={expenses}
            balancesByCurrency={balancesByCurrency}
            transactionsByCurrency={transactionsByCurrency}
            onNavigateToMembers={() => setActiveTab('members')}
            onNavigateToExpenses={() => setActiveTab('expenses')}
            onSettleUp={settleUp}
            onReset={resetData}
          />
        )}
        {activeTab === 'members' && (
          <MembersSection
            members={members}
            onAddMember={addMember}
            onEditMember={editMember}
            onDeleteMember={deleteMember}
            onShareGroup={handleShareGroup}
          />
        )}
        {activeTab === 'expenses' && (
          <ExpensesSection
            members={members}
            expenses={expenses}
            onAddExpense={addExpense}
            onEditExpense={editExpense}
            onDeleteExpense={deleteExpense}
            onReset={resetData}
            onNavigateToMembers={() => setActiveTab('members')}
          />
        )}
      </main>

      {/* Cookie Banner */}
      <CookieBanner />

      {/* Share Modal */}
      <Modal
        open={shareModalOpen}
        onRequestClose={() => setShareModalOpen(false)}
        modalHeading="Compartir Grupo"
        primaryButtonText="Cerrar"
        onRequestSubmit={() => setShareModalOpen(false)}
      >
        <p style={{ marginBottom: '1rem', color: 'var(--cds-text-secondary)' }}>
          Comparte este link con los integrantes del grupo para que puedan ver los gastos en sus dispositivos.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <TextInput
            id="share-url"
            labelText=""
            value={shareUrl}
            readOnly
            style={{ flex: 1 }}
          />
          <CarbonButton
            kind="secondary"
            onClick={handleCopyLink}
            renderIcon={copied ? Checkmark : Copy}
            disabled={copied}
          >
            {copied ? 'Copiado' : 'Copiar'}
          </CarbonButton>
        </div>

        {/* Social Share Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <CarbonButton
            kind="tertiary"
            size="md"
            onClick={() => {
              const text = encodeURIComponent('¡Únete a mi grupo de gastos en BoniMoney! 💰');
              const url = encodeURIComponent(shareUrl);
              window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
            }}
            style={{ flex: '1 1 auto' }}
          >
            📱 Compartir en WhatsApp
          </CarbonButton>
          <CarbonButton
            kind="tertiary"
            size="md"
            onClick={() => {
              const text = encodeURIComponent('¡Únete a mi grupo de gastos en BoniMoney! 💰');
              const url = encodeURIComponent(shareUrl);
              window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
            }}
            style={{ flex: '1 1 auto' }}
          >
            ✈️ Compartir en Telegram
          </CarbonButton>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
          <strong>Nota:</strong> Este link contiene todos los datos del grupo. Compártelo solo con personas de confianza.
        </p>
      </Modal>

      {/* Import/Join Group Modal */}
      <Modal
        open={importModalOpen}
        onRequestClose={handleCancelImport}
        modalHeading={groupId ? "Unirse a Grupo Compartido" : "Importar Datos Compartidos"}
        primaryButtonText={groupId ? "Unirse" : "Importar"}
        secondaryButtonText="Cancelar"
        onRequestSubmit={groupId ? handleJoinGroup : handleImportSharedData}
        onSecondarySubmit={handleCancelImport}
      >
        {sharedData ? (
          <>
            <p style={{ marginBottom: '1rem' }}>
              {groupId
                ? "Te has unido a un grupo compartido. Los cambios se sincronizarán en tiempo real con todos los integrantes."
                : "Se detectaron datos compartidos. Al importar, estos datos reemplazarán todos tus datos actuales."}
            </p>

            <div style={{
              backgroundColor: 'var(--cds-layer-01)',
              padding: '1rem',
              borderRadius: '4px',
              marginBottom: '1rem'
            }}>
              <p style={{ marginBottom: '0.75rem', fontWeight: 500 }}>
                Resumen de datos compartidos:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                <div>👥 {sharedData.members.length} integrante(s)</div>
                <div>💰 {sharedData.expenses.length} gasto(s)</div>
              </div>
            </div>

            {!groupId && (
              <p style={{ fontSize: '0.875rem', color: 'var(--cds-support-warning)', fontWeight: 500 }}>
                ⚠️ Advertencia: Esta acción reemplazará todos tus datos actuales y no se puede deshacer.
              </p>
            )}
          </>
        ) : (
          <p>Cargando...</p>
        )}
      </Modal>

      {/* Auth Modal */}
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        reason="Inicia sesión para compartir grupos y sincronizar tus datos en tiempo real."
      />
    </div>
  );
}

export default App;
