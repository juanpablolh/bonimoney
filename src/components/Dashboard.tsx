import { useState, useEffect } from 'react';
import {
  ArrowRight,
  TrendDown,
  Clock,
  ArrowsLeftRight,
  UserPlus,
  MagnifyingGlass,
  X,
  Sparkle,
  Receipt,
  Trash,
  CurrencyCircleDollar
} from '@phosphor-icons/react';
import { Member, Expense, Balance, Transaction, Currency } from '../types';
import { Project } from '../contexts/ProjectContext';
import { capitalizeName } from '../utils/calculations';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { getExpenseColor } from '../utils/expenseIcons';
import { getMemberAvatarColor } from '../utils/avatarColors';

interface DashboardProps {
  members: Member[];
  expenses: Expense[];
  balancesByCurrency: Map<Currency, Balance[]>;
  transactionsByCurrency: Transaction[];
  currentProject: Project | null;
  onNavigateToMembers: () => void;
  onNavigateToExpenses: () => void;
  onSettleUp: (fromId: string, toId: string, amount: number) => void;
  onReset: () => void;
  onAddMember: (name: string) => Promise<void>;
}

export default function Dashboard({
  members,
  expenses,
  balancesByCurrency,
  transactionsByCurrency,
  currentProject,
  onNavigateToMembers,
  onNavigateToExpenses,
  onSettleUp: _onSettleUp,
  onReset,
  onAddMember
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [isDesktop, setIsDesktop] = useState(false);

  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      onNavigateToMembers();
      return;
    }

    try {
      await onAddMember(newMemberName.trim());
      setNewMemberName('');
    } catch (error) {
      console.error('Error adding member:', error);
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

  // Calculate total expenses by currency
  const totalByCurrency = new Map<Currency, number>();
  expenses.forEach((expense) => {
    const current = totalByCurrency.get(expense.currency) || 0;
    totalByCurrency.set(expense.currency, current + expense.amount);
  });

  const currencies = Array.from(totalByCurrency.entries());

  const sortedExpenses = [...expenses].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  const filteredExpenses = sortedExpenses.filter(e =>
    e.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Premium OKLCH Color Palette matching GlobalDashboard (15 variants)
  const getProjectBgColor = () => {
    const palette = [
      'oklch(0.25 0.08 145)', // 0. Emerald
      'oklch(0.23 0.08 175)', // 1. Deep Teal
      'oklch(0.22 0.09 200)', // 2. Sky
      'oklch(0.20 0.10 225)', // 3. Sapphire
      'oklch(0.20 0.10 250)', // 4. Indigo
      'oklch(0.20 0.10 265)', // 5. Deep Violet
      'oklch(0.22 0.11 290)', // 6. Purple
      'oklch(0.25 0.12 310)', // 7. Orchid
      'oklch(0.22 0.12 330)', // 8. Magenta
      'oklch(0.22 0.10 350)', // 9. Rose
      'oklch(0.25 0.12 15)',  // 10. Crimson
      'oklch(0.28 0.10 35)',  // 11. Red Orange
      'oklch(0.28 0.09 55)',  // 12. Burnt Orange
      'oklch(0.28 0.08 80)',  // 13. Amber
      'oklch(0.26 0.07 110)', // 14. Olive
    ];

    if (currentProject?.color) {
      switch (currentProject.color) {
        case 'project-emerald': return palette[0];
        case 'project-sky': return palette[2];
        case 'project-indigo': return palette[4];
        case 'project-rose': return palette[9];
        case 'project-amber': return palette[13];
      }
    }

    // Stable fallback based on ID hash if no color is set
    if (currentProject?.id) {
      const id = currentProject.id;
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
      }
      return palette[Math.abs(hash) % palette.length];
    }

    return palette[0];
  };

  // Darker version for buttons (950 equivalent)
  const getProjectButtonBgColor = () => {
    // Generated darker variants (approx L-0.08, C-0.02)
    const palette = [
      'oklch(0.18 0.06 145)', // 0. Emerald
      'oklch(0.16 0.06 175)', // 1. Deep Teal
      'oklch(0.15 0.07 200)', // 2. Sky
      'oklch(0.14 0.08 225)', // 3. Sapphire
      'oklch(0.14 0.08 250)', // 4. Indigo
      'oklch(0.14 0.08 265)', // 5. Deep Violet
      'oklch(0.15 0.09 290)', // 6. Purple
      'oklch(0.18 0.10 310)', // 7. Orchid
      'oklch(0.16 0.10 330)', // 8. Magenta
      'oklch(0.16 0.08 350)', // 9. Rose
      'oklch(0.18 0.10 15)',  // 10. Crimson
      'oklch(0.20 0.08 35)',  // 11. Red Orange
      'oklch(0.20 0.07 55)',  // 12. Burnt Orange
      'oklch(0.20 0.06 80)',  // 13. Amber
      'oklch(0.19 0.05 110)', // 14. Olive
    ];

    if (currentProject?.color) {
      switch (currentProject.color) {
        case 'project-emerald': return palette[0];
        case 'project-sky': return palette[2];
        case 'project-indigo': return palette[4];
        case 'project-rose': return palette[9];
        case 'project-amber': return palette[13];
      }
    }

    if (currentProject?.id) {
      const id = currentProject.id;
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
      }
      return palette[Math.abs(hash) % palette.length];
    }

    return palette[0];
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:grid-rows-1 lg:gap-6 pb-0 lg:pb-0 w-full min-w-0 lg:h-full">

      {/* ===== LEFT COLUMN: PROJECT CARD + GASTO TOTAL ===== */}
      <div className="lg:col-span-4 space-y-4 flex flex-col min-w-0 min-h-0 h-auto lg:h-full flex-shrink-0">
        {/* Project Card (Dynamic Color) */}
        <div
          className="rounded-xl p-4 text-white transition-all shadow-lg overflow-hidden flex flex-col justify-between min-h-[220px]"
          style={{ backgroundColor: getProjectBgColor() }}
        >
          {/* Header Row: Icon + Title + Users Button */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{currentProject?.icon}</span>
              <h2 className="font-serif text-2xl tracking-tight leading-none text-white mt-1">
                {(currentProject?.name || '').charAt(0).toUpperCase() + (currentProject?.name || '').slice(1).toLowerCase()}
              </h2>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); onNavigateToMembers(); }}
              className="text-white/90 font-medium text-sm flex items-center gap-2 hover:text-white transition-colors"
            >
              Detalles <ArrowRight size={18} weight="bold" />
            </button>
          </div>

          {/* TOTAL GASTO SECTION (Moved) */}
          <div className="mt-4">
            <p className="text-white/80 text-sm font-medium mb-1">
              Gasto total
            </p>
            {currencies.length > 0 ? (
              currencies.map(([curr, amount]) => (
                <h3 key={curr} className="font-serif tracking-tighter text-white leading-none" style={{ fontSize: '32px' }}>
                  $ {amount.toLocaleString('es-CL')} <span className="text-xl font-sans text-white/60 ml-1 tracking-wide">{curr}</span>
                </h3>
              ))
            ) : (
              <h3 className="font-serif text-4xl tracking-tighter text-white/40">$ 0</h3>
            )}
          </div>

          {/* Input Section */}
          <div className="mt-4 relative">
            <Input
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddMember();
                }
              }}
              placeholder="Nuevo integrante"
              className="w-full h-14 bg-black/20 border-none text-white placeholder:text-white/60 rounded-xl pl-4 pr-36 focus-visible:ring-0 text-base"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddMember();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 rounded-lg flex items-center gap-2 transition-all active:scale-95 hover:brightness-110 shadow-sm"
              style={{ backgroundColor: getProjectButtonBgColor() }}
            >
              <UserPlus size={16} weight="bold" />
              <span className="text-xs font-semibold">Integrante</span>
            </button>
          </div>

          {/* Footer Row: Count + Avatars */}
          <div className="flex items-end justify-between mt-6">
            <p className="text-white/90 pb-1">
              <span className="font-serif text-3xl tracking-tight">{members.length}</span>
              <span className="ml-2 text-sm font-medium">Integrantes</span>
            </p>
            <div className="flex -space-x-3">
              {members.slice(0, 4).map((member) => {
                const colors = getMemberAvatarColor(member);
                return (
                  <Avatar key={member.id} className="w-10 h-10 border-2 border-white/10 ring-2 ring-black/5">
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

      {/* ===== MIDDLE COLUMN: ACTIVIDAD RECIENTE ===== */}
      <section className="lg:col-span-4 flex flex-col h-auto lg:h-full min-w-0 min-h-0 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden flex flex-col h-full">
          {/* Header */}
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-[12px] border-b border-stone-100">
            <div className="flex items-center gap-2 text-stone-950 h-fit">
              <Clock size={20} weight="regular" />
              <p className="text-sm font-semibold leading-[1.3125rem] tracking-[0.00438rem]">Actividad reciente</p>
            </div>
            <button
              onClick={onNavigateToExpenses}
              className="text-base font-medium text-stone-900 flex items-center gap-2 hover:text-stone-600 transition-colors"
            >
              Detalles <ArrowRight size={18} weight="bold" />
            </button>
          </div>



          {/* Search Bar */}
          <div className="px-4 pb-4 pt-4">
            <div className="relative">
              <MagnifyingGlass
                className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
                size={18}
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar gastos..."
                className="pl-11 h-12 bg-stone-50 border-stone-100 rounded-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Expense List */}
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-2 no-scrollbar pb-4 pr-1 scroll-smooth">
            {filteredExpenses.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3">
                <div className="w-14 h-14 bg-stone-50 rounded-full flex items-center justify-center text-stone-300">
                  <Receipt size={28} />
                </div>
                <p className="text-stone-400 text-sm">No hay gastos aún</p>
              </div>
            ) : (
              (isDesktop ? filteredExpenses : filteredExpenses.slice(0, 6)).map((expense) => {
                const paidBy = members.find(m => m.id === expense.paidBy);
                return (
                  <div key={expense.id} className="px-4 py-0 flex items-start gap-4 hover:bg-stone-50/50 transition-colors">
                    {/* Icon Circle */}
                    {(() => {
                      const colors = getExpenseColor(expense.id);
                      return (
                        <div className={cn(
                          "w-11 h-11 aspect-square self-start rounded-full flex items-center justify-center flex-shrink-0",
                          colors.bg,
                          colors.text
                        )}>
                          {expense.icon ? (
                            <span className="text-xl leading-none block">{expense.icon}</span>
                          ) : (
                            <CurrencyCircleDollar size={24} weight="regular" />
                          )}
                        </div>
                      );
                    })()}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-900 text-base leading-tight truncate">
                        {expense.description ? (expense.description.charAt(0).toUpperCase() + expense.description.slice(1).toLowerCase()) : 'Sin descripción'}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-stone-400">
                          Por {(paidBy?.name || 'Alguien').split(' ')[0]}
                        </p>
                        <p style={{
                          color: 'var(--general-foreground, #020617)',
                          fontFamily: 'var(--font-definitions-font-family-body, "DM Sans")',
                          fontSize: 'var(--paragraph-small-font-size, 0.875rem)',
                          fontStyle: 'normal',
                          fontWeight: 600,
                          lineHeight: 'var(--paragraph-small-line-height, 1.3125rem)',
                          letterSpacing: '0.00438rem'
                        }}>
                          $ {expense.amount.toLocaleString('es-CL')} <span className="ml-1" style={{
                            color: 'var(--stone-500, #78716C)',
                            fontFamily: 'var(--font-definitions-font-family-body, "DM Sans")',
                            fontSize: 'var(--paragraph-small-font-size, 0.875rem)',
                            fontStyle: 'normal',
                            fontWeight: 500,
                            lineHeight: 'var(--paragraph-small-line-height, 1.3125rem)',
                            letterSpacing: '0.00438rem'
                          }}>{expense.currency}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-5 pt-3">
            <span className="text-sm text-stone-500">{expenses.length} Gastos en total</span>
          </div>
        </div>
      </section>


      {/* ===== RIGHT COLUMN: SINGLE CARD WITH DEUDAS + ESTADO + FOOTER ===== */}
      <section className="lg:col-span-4 flex flex-col h-auto lg:h-full min-w-0 min-h-0 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm flex flex-col h-full overflow-hidden">
          {/* Header matching Actividad reciente */}
          <div className="flex items-center justify-between p-4 border-b border-stone-100">
            <div className="flex items-center gap-2 text-stone-950">
              <ArrowsLeftRight size={20} weight="regular" />
              <p className="text-sm font-semibold leading-[1.3125rem] tracking-[0.00438rem]">Deudas y cobros</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 min-h-0 p-4">

            {/* Deudas y cobros List */}
            <div>

              {transactionsByCurrency.length === 0 ? (
                <div className="bg-emerald-50 rounded-2xl p-6 text-center flex items-center justify-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500">
                    <Sparkle size={20} weight="fill" />
                  </div>
                  <p className="text-emerald-700 font-medium text-sm">Todo saldado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactionsByCurrency.map((t, idx) => (
                    <div key={idx} className="bg-stone-50 rounded-2xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const fromMember = members.find(m => m.name === t.fromName);
                            const colors = fromMember ? getMemberAvatarColor(fromMember) : { bg: '#E7E5E4', text: '#44403C' };
                            return (
                              <Avatar className="w-8 h-8 border border-white">
                                <AvatarFallback
                                  className="text-[10px] font-semibold"
                                  style={{ backgroundColor: colors.bg, color: colors.text }}
                                >
                                  {(t.fromName || '?').charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            );
                          })()}
                          <span className="text-xs font-medium text-stone-600 truncate max-w-[80px]">
                            {capitalizeName((t.fromName || '').split(' ')[0])}
                          </span>
                        </div>
                        <ArrowRight size={12} className="text-stone-300" />
                        <div className="flex items-center gap-2">
                          {(() => {
                            const toMember = members.find(m => m.name === t.toName);
                            const colors = toMember ? getMemberAvatarColor(toMember) : { bg: '#E7E5E4', text: '#44403C' };
                            return (
                              <Avatar className="w-8 h-8 border border-white">
                                <AvatarFallback
                                  className="text-[10px] font-semibold"
                                  style={{ backgroundColor: colors.bg, color: colors.text }}
                                >
                                  {(t.toName || '?').charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            );
                          })()}
                          <span className="text-xs font-medium text-stone-600 truncate max-w-[80px]">
                            {capitalizeName((t.toName || '').split(' ')[0])}
                          </span>
                        </div>
                      </div>
                      <p style={{
                        color: 'var(--general-foreground, #020617)',
                        fontFamily: 'var(--font-definitions-font-family-body, "DM Sans")',
                        fontSize: 'var(--paragraph-small-font-size, 0.875rem)',
                        fontStyle: 'normal',
                        fontWeight: 600,
                        lineHeight: 'var(--paragraph-small-line-height, 1.3125rem)',
                        letterSpacing: '0.00438rem'
                      }}>
                        $ {t.amount.toLocaleString('es-CL')} <span style={{
                          color: 'var(--stone-500, #78716C)',
                          fontFamily: 'var(--font-definitions-font-family-body, "DM Sans")',
                          fontSize: 'var(--paragraph-small-font-size, 0.875rem)',
                          fontStyle: 'normal',
                          fontWeight: 500,
                          lineHeight: 'var(--paragraph-small-line-height, 1.3125rem)',
                          letterSpacing: '0.00438rem'
                        }}>{t.currency}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Estado individual Section */}
            <div>
              <p className="text-sm font-semibold leading-[1.3125rem] tracking-[0.00438rem] text-stone-950 flex items-center gap-2 mb-4">
                <ArrowsLeftRight size={18} /> Estado individual
              </p>
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
                          isPositive ? "bg-stone-100" :
                            isNegative ? "bg-rose-50" :
                              "bg-stone-50"
                        )}
                      >
                        <span className={cn(
                          "font-medium",
                          isNegative ? "text-rose-600" : "text-stone-700"
                        )}>
                          {capitalizeName(b.memberName) || 'Alguien'}
                        </span>
                        <div className="flex items-center gap-1">
                          {isNegative && <TrendDown size={16} weight="bold" className="text-rose-500" />}
                          <span className={cn(
                            "font-bold",
                            isNegative ? "text-rose-600" : "text-stone-900"
                          )}>
                            {currency} {Math.abs(b.balance).toLocaleString('es-CL')}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ))}
              </div>
            </div>


          </div>
          {/* Datos del grupo footer */}
          <div className="hidden md:flex justify-end p-4 pt-4 border-t border-stone-100">
            <button
              onClick={onReset}
              className="flex items-center gap-2 text-sm font-medium text-rose-400 hover:text-rose-600 transition-colors"
            >
              Datos del grupo <Trash size={16} />
            </button>
          </div>
        </div>
      </section>


    </div>
  );
}
