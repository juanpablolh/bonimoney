import { useState, useEffect, useRef } from 'react';
import {
  Receipt,
  Trash,
  PencilSimple,
  CalendarBlank,
  User,
  MagnifyingGlass,
  X,
  CurrencyCircleDollar
} from '@phosphor-icons/react';
import { Member, Expense } from '../types';
import { formatCurrency, formatDate } from '../utils/calculations';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { getExpenseColor } from '../utils/expenseIcons';
import { getMemberAvatarColor } from '../utils/avatarColors';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ExpensesSectionProps {
  members: Member[];
  expenses: Expense[];
  onAddExpense: (expense: any) => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onNavigateToMembers?: () => void;
}

export default function ExpensesSection({
  members,
  expenses,
  onEditExpense: _onEditExpense,
  onDeleteExpense,
  onNavigateToMembers,
}: ExpensesSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const expandedRef = useRef<HTMLDivElement>(null);

  const sortedExpenses = [...expenses].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  const filteredExpenses = sortedExpenses.filter(e =>
    e.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Handle click outside to close expanded expense
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (expandedRef.current && !expandedRef.current.contains(event.target as Node)) {
        setExpandedId(null);
      }
    };

    if (expandedId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedId]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 1. SEARCH & HEADER */}
      <section className="space-y-4 px-2">
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

        <div className="relative group">
          <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" />
          <Input
            placeholder="Buscar por descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-14 pl-12 bg-neutral-50 border-neutral-100 rounded-2xl font-semibold text-sm text-neutral-900 focus-visible:ring-neutral-200 placeholder:text-neutral-300"
            style={{ letterSpacing: '-0.2px' }}
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
      </section>

      {/* 2. EXPENSES TIMELINE */}
      <section className="space-y-3">
        {filteredExpenses.length === 0 ? (
          <div className="py-24 text-center space-y-4 bg-white rounded-[1rem] border border-neutral-100 shadow-sm">
            <div className="w-20 h-20 bg-neutral-50 rounded-[1rem] flex items-center justify-center mx-auto shadow-inner">
              <Receipt size={32} className="text-neutral-200" />
            </div>
            <div className="space-y-1">
              <p className="text-neutral-400 font-black text-sm uppercase tracking-widest">No hay registros</p>
              <p className="text-neutral-300 text-xs font-medium italic">¿Quizás quieres agregar uno nuevo?</p>
            </div>
          </div>
        ) : (
          filteredExpenses.map((expense) => {
            const isExpanded = expandedId === expense.id;
            const paidBy = members.find(m => m.id === expense.paidBy);

            return (
              <div
                key={expense.id}
                ref={isExpanded ? expandedRef : null}
                className={cn(
                  "bg-white rounded-[1rem] transition-all duration-300 overflow-hidden",
                  isExpanded ? "shadow-2xl shadow-neutral-200 scale-[1.02] z-10" : "shadow-sm"
                )}
              >
                {/* Main Card */}
                <div
                  onClick={() => toggleExpand(expense.id)}
                  className="p-4 flex items-center justify-between cursor-pointer active:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {(() => {
                      const colors = getExpenseColor(expense.id);
                      return (
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center transition-colors group",
                          colors.bg,
                          colors.text
                        )}>
                          {expense.icon ? <span className="text-2xl">{expense.icon}</span> : <CurrencyCircleDollar size={24} weight="regular" />}
                        </div>
                      );
                    })()}
                    <div>
                      <p className="mb-1" style={{
                        color: 'var(--neutral-900, var(--neutral-900))',
                        fontFamily: 'var(--font-definitions-font-family-body, "DM Sans")',
                        fontSize: 'var(--paragraph-small-font-size, 0.875rem)',
                        fontStyle: 'normal',
                        fontWeight: 500,
                        lineHeight: 'var(--paragraph-small-line-height, 1.3125rem)',
                        letterSpacing: '0.00438rem'
                      }}>
                        {expense.description.charAt(0).toUpperCase() + expense.description.slice(1)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <p style={{
                      color: 'var(--general-foreground, var(--neutral-950))',
                      fontFamily: 'var(--font-definitions-font-family-body, "DM Sans")',
                      fontSize: 'var(--paragraph-small-font-size, 0.875rem)',
                      fontStyle: 'normal',
                      fontWeight: 600,
                      lineHeight: 'var(--paragraph-small-line-height, 1.3125rem)',
                      letterSpacing: '0.00438rem'
                    }}>
                      {formatCurrency(expense.amount, expense.currency)}
                    </p>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-5 pt-2 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-2 gap-2 border-t border-neutral-200 pt-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-neutral-400 tracking-tight flex items-center gap-1.5">
                          <User size={12} weight="bold" /> Pagado por
                        </p>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const payer = members.find(m => m.id === expense.paidBy);
                            const colors = payer ? getMemberAvatarColor(payer) : { bg: 'var(--neutral-100)', text: 'var(--neutral-900)' };
                            return (
                              <Avatar className="w-6 h-6">
                                <AvatarFallback
                                  className="text-[10px] font-black"
                                  style={{ backgroundColor: colors.bg, color: colors.text }}
                                >
                                  {(paidBy?.name || '?').charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            );
                          })()}
                          <p className="text-sm font-semibold text-neutral-700">{paidBy?.name || 'Desconocido'}</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium text-neutral-400 tracking-tight flex items-center gap-1.5">
                          <CalendarBlank size={12} weight="bold" /> Fecha
                        </p>
                        <p className="text-sm font-semibold text-neutral-700">{formatDate(expense.date)}</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-neutral-200">
                      <p className="text-sm font-medium text-neutral-400 tracking-tight">Dividido entre</p>
                      <div className="flex flex-wrap gap-2">
                        {expense.splitBetween.map(id => {
                          const m = members.find(mbr => mbr.id === id);
                          const colors = m ? getMemberAvatarColor(m) : { bg: 'var(--background)', text: 'var(--neutral-900)' };
                          return (
                            <div key={id} className="bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-100 flex items-center gap-2">
                              <Avatar className="w-5 h-5">
                                <AvatarFallback
                                  className="text-[8px] font-black"
                                  style={{ backgroundColor: colors.bg, color: colors.text }}
                                >
                                  {(m?.name || '?').charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-[12px] font-medium text-neutral-600">{(m?.name || 'Alguien').split(' ')[0].charAt(0).toUpperCase() + (m?.name || 'Alguien').split(' ')[0].slice(1)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="secondary"
                        className="flex-1 h-12 rounded-2xl flex gap-2 font-semibold"
                        onClick={(e) => {
                          e.stopPropagation();
                          _onEditExpense(expense);
                        }}
                      >
                        <PencilSimple size={14} weight="bold" /> Editar
                      </Button>
                      <Button
                        variant="outline"
                        className="w-12 h-12 rounded-2xl border-neutral-100 text-neutral-400 hover:text-orange-600 hover:border-orange-100 hover:bg-orange-50 transition-all p-0 bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpenseToDelete(expense);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash size={18} weight="bold" className="text-red-400" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl rounded-3xl overflow-hidden">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-serif font-normal text-neutral-900 text-left">Eliminar gasto</DialogTitle>
            <DialogDescription className="text-neutral-500 font-medium text-left">
              ¿Estás seguro que quieres eliminar <span className="text-neutral-900 font-bold">"{expenseToDelete?.description}"</span>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-center mt-6">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="h-12 px-6 rounded-2xl font-bold bg-neutral-50 border-neutral-100 hover:bg-neutral-100 w-full sm:w-auto text-neutral-900"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (expenseToDelete) {
                  onDeleteExpense(expenseToDelete.id);
                  setDeleteDialogOpen(false);
                }
              }}
              className="h-12 px-6 rounded-2xl font-bold bg-red-500 hover:bg-red-600 w-full sm:w-auto text-white"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. ADD BUTTON (Helpful hint) */}
      {members.length === 0 && (
        <div className="bg-neutral-900 rounded-[1rem] p-8 text-center space-y-4">
          <h4 className="text-white font-black text-lg">¿Empezamos?</h4>
          <p className="text-neutral-400 text-sm font-medium">Primero agrega algunos amigos para poder anotar gastos.</p>
          <Button
            onClick={onNavigateToMembers}
            className="w-full h-14 rounded-2xl bg-white text-neutral-900 font-black"
          >
            Ir a Miembros
          </Button>
        </div>
      )}
    </div>
  );
}
