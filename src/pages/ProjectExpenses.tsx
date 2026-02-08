import { useState, useEffect, useRef } from 'react';
import {
  PencilSimple,
  MagnifyingGlass,
  X,
  Receipt,
  CaretDown,
  CaretUp
} from '@phosphor-icons/react';
import { Expense } from '../types';
import { formatCurrency, formatDate, capitalizeName } from '../utils/calculations';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';
import { getMemberAvatarColor } from '../utils/avatarColors';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useMembers } from '@/contexts/MemberContext';
import { useExpenses } from '@/contexts/ExpenseContext';
import { useMemo } from 'react';
import { adaptMembers, adaptExpenses } from '../utils/dataAdapters';
import { useNavigate } from 'react-router-dom';


/**
 * ProjectExpenses Component
 * 
 * Displays and manages all expenses for a project:
 * - View expenses in a searchable, sortable list (newest first)
 * - Expand expense cards to see full details (date, split members, actions)
 * - Delete expenses with confirmation dialog
 * - Navigate to members page if no members exist
 * 
 * Features:
 * - Real-time search filtering by description
 * - Accordion-style expansion for expense details
 * - Auto-scroll to expanded expense
 * - Color-coded member badges showing who the expense is split between
 * 
 * Note: Edit functionality is marked as TODO and currently logs to console
 */
export default function ProjectExpenses() {
  const navigate = useNavigate();
  const { members: contextMembers } = useMembers();
  const { expenses: contextExpenses, deleteExpense } = useExpenses();

  // Adapt data from contexts
  const members = useMemo(() => adaptMembers(contextMembers), [contextMembers]);
  const expenses = useMemo(() => adaptExpenses(contextExpenses), [contextExpenses]);

  // UI state for expansion, search, and deletion
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const expandedRef = useRef<HTMLDivElement>(null);

  // Sort expenses by date (newest first)
  const sortedExpenses = [...expenses].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  // Filter expenses by search query (case-insensitive description match)
  const filteredExpenses = sortedExpenses.filter(e =>
    e.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Auto-scroll to expanded expense for better UX
  useEffect(() => {
    // Scroll to the expanded element if needed
    if (expandedId && expandedRef.current) {
      // Small timeout to allow for animation
      setTimeout(() => {
        expandedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 300);
    }
  }, [expandedId]);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ========================================
          SECTION 1: PAGE HEADER
          
          Simple header displaying the page title.
      ======================================== */}
      <section className="px-2">
        <div className="flex justify-between items-end">
          <div>
            <h2 style={{
              color: 'var(--neutral-900, var(--neutral-900))',
              fontFamily: 'var(--font-definitions-font-family-headings, "Abhaya Libre Medium")',
              fontSize: '1.5rem',
              fontStyle: 'normal',
              fontWeight: 500,
              lineHeight: 'var(--heading-3-line-height, 1.8rem)',
              letterSpacing: 'var(--heading-3-letter-spacing, -0.0625rem)'
            }}>Gastos</h2>
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION 2: EXPENSES LIST
          
          Main content area displaying all expenses:
          - Empty state when no expenses exist
          - Search bar for filtering by description
          - Accordion-style expense cards with:
            * Collapsed: Description, amount, payer
            * Expanded: Date, split members, edit/delete actions
          
          Interaction:
          - Click anywhere on card to expand/collapse
          - Click actions to edit/delete (stops propagation)
      ======================================== */}
      <section>
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-3 bg-white rounded-[1rem] border border-neutral-100 shadow-sm">
            <div className="w-14 h-14 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-300">
              <Receipt size={28} />
            </div>
            <p className="text-neutral-400 text-sm">No hay gastos aún</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-neutral-100 shadow-sm overflow-hidden divide-y divide-neutral-100">
            {/* Search Bar: Filter expenses by description */}
            <div className="p-4 bg-neutral-50/30 border-b border-neutral-100">
              <div className="relative group">
                <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" />
                <Input
                  placeholder="Buscar gastos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-11 bg-white border-neutral-200 rounded-md text-base border-1 focus:ring-1"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            {filteredExpenses.map((expense) => {
              const isExpanded = expandedId === expense.id;

              return (
                <div
                  key={expense.id}
                  ref={isExpanded ? expandedRef : null}
                  className={cn(
                    "transition-all duration-300",
                    isExpanded ? "bg-neutral-50/50 z-10" : ""
                  )}
                >
                  {/* Collapsed View: Description, amount, and expand button */}
                  <div
                    onClick={() => toggleExpand(expense.id)}
                    className="px-4 py-3 flex flex-col gap-0.5 cursor-pointer active:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center justify-between w-full">
                      <p className="font-sans text-base font-semibold text-neutral-900 tracking-tight">
                        {expense.description.charAt(0).toUpperCase() + expense.description.slice(1)}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="font-sans font-regular text-neutral-950 text-sm">
                          {formatCurrency(expense.amount, expense.currency)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-neutral-400 hover:text-neutral-900 h-8 w-8 rounded-sm"
                          asChild
                        >
                          <div>
                            {isExpanded ? (
                              <CaretUp size={16} weight="bold" />
                            ) : (
                              <CaretDown size={16} weight="bold" />
                            )}
                          </div>
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-400 font-medium tracking-normal">
                      Por {capitalizeName(members.find(m => m.id === expense.paidBy)?.name) || 'Desconocido'}
                    </p>
                  </div>

                  {/* Expanded View: Full expense details and actions */}
                  {isExpanded && (
                    <div className="px-2 pb-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3 space-y-3">
                        {/* Date Info */}
                        <div className="flex items-center justify-between pb-3">
                          <span className="text-sm font-medium text-neutral-500 tracking-tight">Fecha</span>
                          <span className="text-sm font-medium text-neutral-600">{formatDate(expense.date)}</span>
                        </div>

                        <div className="flex flex-wrap items-start justify-between gap-y-3">
                          <p className="text-sm font-medium text-neutral-500 tracking-normal shrink-0">Dividido entre</p>
                          <div className="flex flex-col gap-1 justify-end">
                            {expense.splitBetween.map(id => {
                              const m = members.find(mbr => mbr.id === id);
                              const colors = m ? getMemberAvatarColor(m) : { bg: 'var(--background)', text: 'var(--neutral-900)' };
                              return (
                                <div
                                  key={id}
                                  className="px-2 py-1 rounded-sm text-xs font-medium w-fit border border-blue-900/10"
                                  style={{ backgroundColor: colors.bg, color: colors.text }}
                                >
                                  {capitalizeName(m?.name)}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex gap-2 justify-between">
                          <Button
                            variant="link"
                            className="text-red-400/70 hover:text-red-700 font-medium px-0 h-auto underline-offset-4"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpenseToDelete(expense);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            Eliminar gasto
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon-xl"
                            className="rounded-lg border border-neutral-200 text-neutral-400 hover:text-neutral-900 bg-neutral-50/50"
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: Implement edit expense modal
                              console.log('Edit expense:', expense);
                            }}
                          >
                            <PencilSimple size={16} weight="regular" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================
          DIALOG: DELETE EXPENSE CONFIRMATION
          
          Confirmation dialog shown before deleting an expense.
          Warns user that the action cannot be undone.
      ======================================== */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[440px] border-0 shadow-2xl rounded-[2rem] p-6 gap-0">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-[28px] font-serif font-bold text-neutral-900 text-left leading-tight">Eliminar gasto</DialogTitle>
            <DialogDescription className="text-neutral-500 font-medium text-left text-base leading-relaxed">
              ¿Estás seguro que quieres eliminar <span className="text-neutral-900 font-bold">"{expenseToDelete?.description}"</span>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end mt-8">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-2xl w-full sm:w-auto text-neutral-900 font-bold"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="lg"
              onClick={() => {
                if (expenseToDelete) {
                  deleteExpense(expenseToDelete.id);
                  setDeleteDialogOpen(false);
                }
              }}
              className="rounded-2xl w-full sm:w-auto font-bold"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================
          HELPER SECTION: NO MEMBERS PROMPT
          
          Shown when no members exist in the project.
          Prompts user to add members before creating expenses.
          Includes navigation button to members page.
      ======================================== */}
      {members.length === 0 && (
        <div className="bg-neutral-900 rounded-[1rem] p-8 text-center space-y-4">
          <h4 className="text-white font-black text-lg">¿Empezamos?</h4>
          <p className="text-neutral-400 text-sm font-medium">Primero agrega algunos amigos para poder anotar gastos.</p>
          <Button
            onClick={() => navigate('members')}
            className="w-full h-14 rounded-2xl bg-white text-neutral-900 font-black"
          >
            Ir a Miembros
          </Button>
        </div>
      )}
    </div>
  );
}
