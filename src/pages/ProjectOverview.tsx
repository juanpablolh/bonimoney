import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  ArrowsLeftRight,
  Sparkle,
  Receipt
} from '@phosphor-icons/react';
import { Transaction, Currency } from '../types';
import { useProject } from '../contexts/ProjectContext';
import { useMembers } from '../contexts/MemberContext';
import { useExpenses } from '../contexts/ExpenseContext';
import { useAuth } from '../contexts/AuthContext';
import { capitalizeName, formatCurrency, calculateBalancesByCurrency, optimizeTransactionsByCurrency } from '../utils/calculations';
import { adaptMembers, adaptExpenses } from '../utils/dataAdapters';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getMemberAvatarColor } from '../utils/avatarColors';
import { getProjectTheme } from '@/utils/projectTheme';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button as UIButton } from '@/components/ui/button';
import { SettlementSheet } from '../components/sheets/SettlementSheet';


/**
 * ProjectOverview Component
 * 
 * Dashboard view showing a comprehensive overview of the project:
 * - Project card with total expenses and member count
 * - Recent activity feed (latest expenses and settlements)
 * - Debts and payments (optimized transactions to settle balances)
 * - Member balances by currency
 * 
 * Features:
 * - Multi-currency support with separate calculations per currency
 * - Settlement flow for marking debts as paid
 * - Responsive layout (stacked on mobile, 3-column grid on desktop)
 * - Real-time balance calculations
 * - Optimized transaction suggestions to minimize number of payments
 * 
 * Layout:
 * - Left: Project info card + total expenses
 * - Middle: Recent activity timeline
 * - Right: Debts/payments + member balances
 */
export default function ProjectOverview() {
  const navigate = useNavigate();
  const { currentProject, deleteProject } = useProject();
  const { members: contextMembers } = useMembers();
  const { expenses: contextExpenses, addExpense } = useExpenses();
  const { user } = useAuth();

  // Adapt data from contexts
  const members = useMemo(() => adaptMembers(contextMembers), [contextMembers]);
  const expenses = useMemo(() => adaptExpenses(contextExpenses), [contextExpenses]);

  // Calculate balances and transactions
  const balancesByCurrency = useMemo(() =>
    calculateBalancesByCurrency(members, expenses),
    [members, expenses]
  );

  const transactionsByCurrency = useMemo(() =>
    optimizeTransactionsByCurrency(balancesByCurrency),
    [balancesByCurrency]
  );

  // UI state
  const [isDesktop, setIsDesktop] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [settlementDrawerOpen, setSettlementDrawerOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Check if current user can settle a transaction (Debtor or Admin)
  const canSettleTransaction = (transaction: Transaction) => {
    if (!user || !currentProject) return false;

    // Is Admin?
    const isAdmin = currentProject.owner_id === user.id;

    // Is Debtor?
    const debtorMember = members.find(m => m.id === transaction.from);
    // Support linking via user_id
    const isDebtor = debtorMember?.user_id === user.id;

    return isAdmin || isDebtor;
  };

  // Handle settlement confirmation
  const handleSettlement = async (amount: number, notes?: string) => {
    if (!selectedTransaction) return;

    try {
      await addExpense({
        description: notes || `Pago de deuda`,
        amount: amount,
        paid_by: selectedTransaction.from,
        split_method: 'exact',
        split_details: [{ member_id: selectedTransaction.to, amount: amount }],
        date: new Date().toISOString(),
        expense_type: 'settlement',
        metadata: notes ? { notes } : undefined
      });
      setSettlementDrawerOpen(false);
      setSelectedTransaction(null);
    } catch {
      alert('Error al registrar el pago. Intenta nuevamente.');
    }
  };

  // Check for desktop breakpoint
  useEffect(() => {
    const checkDesktop = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Calculate total expenses by currency (excluding settlements)
  const totalByCurrency = useMemo(() => {
    const map = new Map<Currency, number>();
    expenses.forEach((expense) => {
      // Skip settlement transactions from total
      if (expense.expense_type === 'settlement' || expense.expense_type === 'payment') return;
      const current = map.get(expense.currency) || 0;
      map.set(expense.currency, current + expense.amount);
    });
    return map;
  }, [expenses]);

  // Extract currencies for display
  const currencies = useMemo(() => Array.from(totalByCurrency.entries()), [totalByCurrency]);

  // Sort expenses by date (newest first), with same-day tiebreaker using creation time
  const sortedExpenses = useMemo(() =>
    [...expenses].sort((a, b) => {
      // Compare dates at midnight to ignore time differences (like 00:00 vs 05:00)
      const dateA = new Date(a.date);
      dateA.setHours(0, 0, 0, 0);
      const dateB = new Date(b.date);
      dateB.setHours(0, 0, 0, 0);

      const diff = dateB.getTime() - dateA.getTime();
      if (diff !== 0) return diff;

      // Fallback to creation time for same-day expenses
      const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;

      return createdB - createdA;
    }),
    [expenses]
  );

  const theme = getProjectTheme(currentProject?.color, currentProject?.id);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-6 pb-0 lg:pb-0 w-full min-w-0">

      {/* ========================================
          SECTION 1: PROJECT CARD (Left Column)
          
          Displays project information and summary:
          - Project icon and name
          - Total expenses by currency
          - Member count with avatar stack
          - Quick link to members page
          
          Styled with dynamic theme based on project color.
      ======================================== */}
      <div className="space-y-4 flex flex-col min-w-0">
        {/* Project Card (Dynamic Color) */}
        <div
          className="rounded-xl p-4 transition-all shadow-md overflow-hidden flex flex-col justify-between min-h-[220px] relative group"
          style={{ backgroundColor: theme.bgColor, borderColor: theme.borderColor }}
        >
          {/* Overlay */}
          <div className={cn(
            "absolute inset-0 pointer-events-none transition-opacity duration-300",
            theme.overlay || "bg-gradient-to-br from-white/5 to-transparent opacity-30"
          )} />

          {/* Header Row: Icon + Title + Users Button */}
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <span className="text-4xl filter drop-shadow-sm">{currentProject?.icon}</span>
              <h2
                className="font-serif text-2xl tracking-tight leading-none mt-1"
                style={{ color: theme.textColor }}
              >
                {(currentProject?.name || '').charAt(0).toUpperCase() + (currentProject?.name || '').slice(1).toLowerCase()}
              </h2>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); navigate('members'); }}
              className="font-medium text-sm flex items-center gap-2 transition-colors hover:opacity-80"
              style={{ color: theme.mutedTextColor }}
            >
              Detalles <ArrowRight size={18} weight="bold" />
            </button>
          </div>

          {/* TOTAL GASTO SECTION (Moved) */}
          <div className="mt-4 relative z-10">
            <p className="text-sm font-medium mb-1" style={{ color: theme.mutedTextColor }}>
              Gasto total
            </p>
            {currencies.length > 0 ? (
              currencies.map(([curr, amount]) => (
                <h3 key={curr} className="font-sans tracking-normal leading-none" style={{ fontSize: '24px', color: theme.textColor }}>
                  {formatCurrency(amount, curr as Currency)}
                </h3>
              ))
            ) : (
              <h3 className="font-sans text-2xl tracking-tight" style={{ color: theme.mutedTextColor, opacity: 0.5 }}>$ 0</h3>
            )}
          </div>

          {/* Footer Row: Count + Avatars */}
          <div className="flex items-end justify-between mt-6 relative z-10">
            <p className="pb-1" style={{ color: theme.textColor }}>
              <span className="font-serif text-3xl tracking-tight">{members.length}</span>
              <span className="ml-2 text-sm font-medium" style={{ color: theme.mutedTextColor }}>Integrantes</span>
            </p>
            <div className="flex -space-x-3">
              {members.slice(0, 4).map((member) => {
                const colors = getMemberAvatarColor(member);
                return (
                  <Avatar key={member.id} className="w-10 h-10 border-2 border-white shadow-sm">
                    <AvatarImage src={member.avatar_url} />
                    <AvatarFallback
                      className="text-xs font-bold uppercase"
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {(member.name || '?').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* ========================================
          SECTION 2: RECENT ACTIVITY (Middle Column)
          
          Timeline of recent expenses and settlements:
          - Shows all expenses on desktop, first 3 on mobile
          - Displays expense description, payer, and amount
          - Settlement transactions marked with 💸 emoji
          - Quick link to full expenses page
          
          Auto-scrollable list with smooth scrolling behavior.
      ======================================== */}
      <section className="flex flex-col min-w-0">
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center px-4 py-5 border-b border-neutral-100">
            <div className="flex items-center gap-2 text-neutral-950">
              <Clock size={20} weight="regular" />
              <p className="text-sm font-semibold leading-[1.3125rem] tracking-[0.00438rem]">Actividad reciente</p>
            </div>
          </div>



          {/* Expense List */}
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-4 no-scrollbar p-4 scroll-smooth">
            {sortedExpenses.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3">
                <div className="w-14 h-14 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-300">
                  <Receipt size={28} />
                </div>
                <p className="text-neutral-400 text-sm">No hay gastos aún</p>
              </div>
            ) : (
              (isDesktop ? sortedExpenses : sortedExpenses.slice(0, 3)).map((expense) => {
                const paidBy = members.find(m => m.id === expense.paidBy);
                const isPayment = (expense as any).expense_type === 'settlement' || (expense as any).expense_type === 'payment';

                // Normalize title
                let displayTitle = expense.description;
                if (isPayment) {
                  displayTitle = "Pago de deuda";
                } else {
                  displayTitle = expense.description ? (expense.description.charAt(0).toUpperCase() + expense.description.slice(1).toLowerCase()) : 'Sin descripción';
                }

                return (
                  <div key={expense.id} className="flex items-start gap-4 hover:bg-neutral-50/50 transition-colors">


                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 text-base leading-tight truncate pb-1">
                        {isPayment && (
                          <span className="text-emerald-600 mr-1">💸</span>
                        )}
                        {displayTitle}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <p className="text-sm text-neutral-400">
                          Por {capitalizeName(paidBy?.name) || 'Alguien'}
                          {isPayment && expense.splits && expense.splits.length > 0 && (() => {
                            const toMember = members.find(m => m.id === expense.splits![0].memberId);
                            return toMember ? ` a ${capitalizeName(toMember.name)}` : '';
                          })()}
                        </p>
                        <p className="font-sans font-regular text-neutral-950 text-sm" style={{ letterSpacing: '-0.3px' }}>
                          {formatCurrency(expense.amount, expense.currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="py-2 px-4 flex justify-end border-t border-neutral-100">
            <button
              onClick={() => navigate('expenses')}
              className="text-base font-medium text-neutral-600 flex items-center gap-2 hover:text-neutral-600 transition-colors"
            >
              Ver todos <ArrowRight size={18} weight="regular" />
            </button>
          </div>
        </div>
      </section>




      {/* ========================================
          SECTION 3: DEBTS & PAYMENTS (Right Column - Top)
          
          Optimized transactions showing who owes whom:
          - Displays simplified payment suggestions
          - Minimizes number of transactions needed to settle all balances
          - Click "Saldar deuda" to mark debt as paid (opens settlement drawer)
          - Shows "Todo saldado" when all balances are zero
          
          Only debtors (people who owe money) can see the "Saldar deuda" button
          for their own debts.
      ======================================== */}
      <section className="flex flex-col min-w-0">
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-neutral-100">
            <div className="flex items-center gap-2 text-neutral-950">
              <ArrowsLeftRight size={20} weight="regular" />
              <p className="text-sm font-semibold leading-[1.3125rem] tracking-[0.00438rem]">Deudas</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 p-4">
            {/* Optimized Transactions: Who owes whom */}
            <div>

              {transactionsByCurrency.length === 0 ? (
                <div className="bg-emerald-50 rounded-2xl p-6 text-center flex items-center justify-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500">
                    <Sparkle size={20} weight="light" />
                  </div>
                  <p className="text-emerald-700 font-medium text-sm">Todo saldado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactionsByCurrency.map((t, idx) => (
                    <div key={idx} className="bg-neutral-50 rounded-2xl p-3 space-y-2 border border-neutral-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            {(() => {
                              const fromMember = members.find(m => m.id === t.from);
                              const colors = fromMember ? getMemberAvatarColor(fromMember) : { bg: 'var(--neutral-200)', text: 'var(--neutral-900)' };
                              return (
                                <div
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: colors.bg }}
                                />
                              );
                            })()}
                            <span className="text-sm font-medium text-neutral-600 truncate max-w-[120px]">
                              {capitalizeName(t.fromName)}
                            </span>
                          </div>
                          <ArrowRight size={12} className="text-neutral-600" />
                          <div className="flex items-center gap-1.5">
                            {(() => {
                              const toMember = members.find(m => m.id === t.to);
                              const colors = toMember ? getMemberAvatarColor(toMember) : { bg: 'var(--neutral-200)', text: 'var(--neutral-900)' };
                              return (
                                <div
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: colors.bg }}
                                />
                              );
                            })()}
                            <span className="text-sm font-medium text-neutral-600 truncate max-w-[120px]">
                              {capitalizeName(t.toName)}
                            </span>
                          </div>
                        </div>
                        <p className="font-sans font-medium text-neutral-950 text-sm" style={{ letterSpacing: '-0.3px' }}>
                          {formatCurrency(t.amount, t.currency)}
                        </p>
                      </div>

                      {/* Botón Saldar - solo visible para deudores o admin */}
                      {canSettleTransaction(t) && (
                        <UIButton
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedTransaction(t);
                            setSettlementDrawerOpen(true);
                          }}
                          className="w-full border border-neutral-200"
                        >
                          Saldar deuda
                        </UIButton>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION 4: INDIVIDUAL BALANCES (Right Column - Bottom)
          
          Shows each member's net balance by currency:
          - Positive balance (green/neutral): Member is owed money
          - Negative balance (red): Member owes money
          - Zero balance (neutral): Member is settled
          
          Balances are calculated across all expenses and settlements.
          Multi-currency support: separate balance per currency.
          
          Footer includes "Cerrar grupo" button (desktop only) to delete
          the entire project.
      ======================================== */}
      <section className="flex flex-col min-w-0">
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-neutral-100">
            <div className="flex items-center gap-2 text-neutral-950">
              <ArrowsLeftRight size={20} weight="regular" />
              <p className="text-sm font-semibold leading-[1.3125rem] tracking-[0.00438rem]">Estado individual</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 p-4">
            {/* Member Balances by Currency */}
            <div className="space-y-2">
              {Array.from(balancesByCurrency.entries()).map(([currency, currencyBalances]) => (
                currencyBalances.map((b, bIdx) => {
                  const isPositive = b.balance > 0.01;
                  const isNegative = b.balance < -0.01;
                  return (
                    <div
                      key={`${currency}-${bIdx}`}
                      className={cn(
                        "px-4 py-3 rounded-lg text-sm flex items-center justify-between",
                        isPositive ? "bg-neutral-100" :
                          isNegative ? "bg-rose-50" :
                            "bg-neutral-50"
                      )}
                    >
                      <span className={cn(
                        "font-medium",
                        isNegative ? "text-rose-600" : "text-neutral-700"
                      )}>
                        {capitalizeName(b.memberName) || 'Alguien'}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={cn(
                          "font-medium",
                          isNegative ? "text-rose-600" : "text-neutral-900"
                        )}>
                          {isNegative && "- "}
                          {formatCurrency(Math.abs(b.balance), currency)}
                        </span>
                      </div>
                    </div>
                  );
                })
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          DIALOG: DELETE PROJECT CONFIRMATION
          
          Confirmation dialog for closing/deleting the project.
          Warns that this action is permanent and will delete
          all expenses and data.
      ======================================== */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[440px] border-0 shadow-2xl rounded-[2rem] p-6 gap-0">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-[28px] font-serif font-bold text-neutral-900 text-left leading-tight">Cerrar grupo</DialogTitle>
            <DialogDescription className="text-neutral-500 font-medium text-left text-base leading-relaxed">
              ¿Estás seguro que quieres cerrar este grupo? Esta acción no se puede deshacer y borrará todos los gastos y datos asociados permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end mt-8">
            <UIButton
              variant="outline"
              size="lg"
              className="rounded-2xl w-full sm:w-auto"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </UIButton>
            <UIButton
              variant="destructive"
              size="lg"
              className="rounded-2xl w-full sm:w-auto"
              onClick={async () => {
                if (currentProject) {
                  await deleteProject(currentProject.id);
                  navigate('/');
                }
                setDeleteDialogOpen(false);
              }}
            >
              Cerrar grupo
            </UIButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================
          DRAWER: SETTLEMENT FLOW
          
          Bottom drawer for confirming debt payments:
          - Shows transaction details (who pays whom, amount)
          - Optional notes field
          - Creates a settlement expense when confirmed
          
          Only shown when a transaction is selected.
      ======================================== */}
      {selectedTransaction && (
        <SettlementSheet
          open={settlementDrawerOpen}
          onOpenChange={setSettlementDrawerOpen}
          transaction={selectedTransaction}
          members={members}
          onConfirm={handleSettlement}
        />
      )
      }

    </div >
  );
}
