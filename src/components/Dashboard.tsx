import { useState } from 'react';
import { Tile, Button, IconButton, Tag } from '@carbon/react';
import { Add } from '@carbon/icons-react';
import { Member, Expense, Balance, Transaction, Currency } from '../types';
import { formatCurrency, getCurrencySymbol, capitalizeName } from '../utils/calculations';
import { getExpenseIcon } from '../utils/expenseIcons';
import { getMemberAvatarColor } from '../utils/avatarColors';

interface DashboardProps {
  members: Member[];
  expenses: Expense[];
  balancesByCurrency: Map<Currency, Balance[]>;
  transactionsByCurrency: Transaction[];
  onNavigateToMembers: () => void;
  onNavigateToExpenses: () => void;
  onSettleUp: (fromId: string, toId: string, amount: number) => void;
  onReset: () => void;
}

// Helper function to map hex color to Carbon Tag type
function getTagTypeFromColor(bgColor: string): 'red' | 'magenta' | 'purple' | 'blue' | 'cyan' | 'teal' | 'green' | 'gray' | 'cool-gray' | 'warm-gray' {
  const colorMap: Record<string, 'red' | 'magenta' | 'purple' | 'blue' | 'cyan' | 'teal' | 'green' | 'gray' | 'cool-gray' | 'warm-gray'> = {
    '#002d9c': 'blue',
    '#da1e28': 'red',
    '#198038': 'green',
    '#8d3f9b': 'purple',
    '#0072c3': 'cyan',
    '#007d79': 'teal',
    '#a2191f': 'magenta',
    '#004144': 'teal',
    '#0043ce': 'blue',
    '#00539a': 'blue',
    '#6f2c3d': 'red',
    '#0e6027': 'green',
    '#5b21d0': 'purple',
    '#005d5d': 'teal',
  };
  
  // Normalize color (remove spaces, convert to lowercase)
  const normalizedColor = bgColor.toLowerCase().trim();
  return colorMap[normalizedColor] || 'gray';
}

export default function Dashboard({ members, expenses, balancesByCurrency, transactionsByCurrency, onNavigateToMembers, onNavigateToExpenses: _onNavigateToExpenses, onSettleUp: _onSettleUp, onReset }: DashboardProps) {
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  
  // Calculate total expenses by currency
  const expensesByCurrency = new Map<Currency, number>();
  expenses.forEach((expense) => {
    const current = expensesByCurrency.get(expense.currency) || 0;
    expensesByCurrency.set(expense.currency, current + expense.amount);
  });
  
  const currencies = Array.from(expensesByCurrency.entries());
  
  const sortedExpenses = expenses
    .slice()
    .sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  
  const displayedExpenses = showAllExpenses ? sortedExpenses : sortedExpenses.slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem'
      }}>
        {/* Total del Grupo */}
        <Tile style={{ display: 'flex', flexDirection: 'column', minHeight: '160px', position: 'relative', overflow: 'visible' }}>
          <IconButton
            kind="secondary"
            size="sm"
            label="Agregar integrante"
            onClick={onNavigateToMembers}
            style={{ 
              position: 'absolute',
              top: '-0.75rem',
              right: '-0.75rem',
              flexShrink: 0,
              margin: 0,
              zIndex: 1,
              width: '48px',
              height: '48px',
              minWidth: '48px',
              minHeight: '48px'
            }}
          >
            <Add size={20} />
          </IconButton>
          <div style={{ 
            fontSize: '0.875rem', 
            color: 'var(--cds-text-secondary)',
            marginBottom: '0.5rem',
            minHeight: '32px'
          }}>
            Integrantes
          </div>
          <div style={{ marginTop: 'auto', width: '100%' }}>
            {members.length === 0 ? (
              <div style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>Sin integrantes</div>
            ) : (
              <>
                {members.length > 1 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', fontWeight: 500, marginBottom: '0.5rem' }}>
                    {members.length}
                  </div>
                )}
                <div style={{ 
                  position: 'relative',
                  marginLeft: '-1rem',
                  marginRight: '-1rem',
                  paddingLeft: '1rem'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'nowrap', 
                    gap: '0.5rem',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    scrollbarWidth: 'thin',
                    WebkitOverflowScrolling: 'touch',
                    paddingBottom: '0.25rem',
                    marginBottom: '-0.25rem',
                    width: '100%'
                  }}>
                    {members.map((member) => {
                      const memberAvatarColors = getMemberAvatarColor(member);
                      const capitalizedName = capitalizeName(member.name);
                      return (
                        <Tag key={member.id} type={getTagTypeFromColor(memberAvatarColors.bg)} size="sm" style={{ flexShrink: 0 }}>
                          {capitalizedName}
                        </Tag>
                      );
                    })}
                  </div>
                  {/* Fade gradient overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: '0.25rem',
                    width: '2.5rem',
                    pointerEvents: 'none',
                    background: 'linear-gradient(to left, var(--cds-layer-01, #f4f4f4) 70%, transparent 100%)'
                  }} />
                </div>
              </>
            )}
          </div>
        </Tile>
        
        {/* Total de Gastos */}
        <Tile style={{ display: 'flex', flexDirection: 'column', minHeight: '160px' }}>
          <div style={{ 
            fontSize: '0.875rem', 
            color: 'var(--cds-text-secondary)',
            marginBottom: '0.5rem',
            minHeight: '32px'
          }}>
            Total de Gastos
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {currencies.length === 1 ? (
              // Single currency: show abbreviation above value
              <>
                <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', fontWeight: 500 }}>
                  {currencies[0][0]}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 500 }}>
                  {formatCurrency(currencies[0][1], currencies[0][0])}
                </div>
              </>
            ) : (
              // Multiple currencies: show symbol with adjusted font size, stacked
              currencies.map(([currency, amount]) => {
                const localeMap: Record<Currency, string> = {
                  CLP: 'es-CL',
                  USD: 'en-US',
                  BRL: 'pt-BR',
                  ARS: 'es-AR',
                  EUR: 'es-ES',
                  GBP: 'en-GB',
                  PEN: 'es-PE',
                };
                const formattedAmount = new Intl.NumberFormat(localeMap[currency], {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                }).format(amount);
                
                return (
                  <div key={currency} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 500 }}>
                      {getCurrencySymbol(currency)}{formattedAmount}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Tile>
      </div>

      {/* Recent Expenses */}
      <Tile>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 500, 
          marginBottom: '1rem',
          backgroundColor: 'rgba(141, 141, 141, 0.20)',
          padding: '0.75rem 1rem',
          marginLeft: '-1rem',
          marginRight: '-1rem',
          marginTop: '-1rem',
          borderLeft: '3px solid var(--cds-button-primary, #0f62fe)'
        }}>Gastos Recientes</h3>
        {expenses.length === 0 ? (
          <p style={{ color: 'var(--cds-text-secondary)' }}>No hay gastos registrados.</p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {displayedExpenses.map((expense) => {
                const paidBy = members.find((m) => m.id === expense.paidBy);
                const expenseIcon = getExpenseIcon(expense.icon, 24);
                const paidByAvatarColors = paidBy ? getMemberAvatarColor(paidBy) : null;
                const capitalizedPaidByName = paidBy?.name ? capitalizeName(paidBy.name) : null;
                
                return (
                  <div key={expense.id} style={{ 
                    padding: '1rem 0', 
                    backgroundColor: 'var(--cds-layer-01)',
                    borderRadius: '4px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                        {expenseIcon && (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--cds-layer-02)',
                            flexShrink: 0,
                            color: 'var(--cds-button-primary, #0f62fe)'
                          }}>
                            {expenseIcon}
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500 }}>{expense.description.charAt(0).toUpperCase() + expense.description.slice(1).toLowerCase()}</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            Pagado por{' '}
                            {capitalizedPaidByName && paidByAvatarColors ? (
                              <Tag type={getTagTypeFromColor(paidByAvatarColors.bg)} size="sm">
                                {capitalizedPaidByName}
                              </Tag>
                            ) : (
                              'Desconocido'
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 500, flexShrink: 0 }}>
                        {formatCurrency(expense.amount, expense.currency)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {expenses.length > 3 && (
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                <Button
                  kind="ghost"
                  size="sm"
                  onClick={() => setShowAllExpenses(!showAllExpenses)}
                >
                  {showAllExpenses ? 'Mostrar menos' : `Ver todos los gastos (${expenses.length})`}
                </Button>
              </div>
            )}
          </>
        )}
      </Tile>

      {/* Quick Balances */}
      <Tile>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 500, 
          marginBottom: '1rem',
          backgroundColor: 'rgba(141, 141, 141, 0.20)',
          padding: '0.75rem 1rem',
          marginLeft: '-1rem',
          marginRight: '-1rem',
          marginTop: '-1rem',
          borderLeft: '3px solid var(--cds-button-primary, #0f62fe)'
        }}>Balances Rápidos</h3>
        {balancesByCurrency.size === 0 ? (
          <p style={{ color: 'var(--cds-text-secondary)' }}>No hay integrantes registrados.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {Array.from(balancesByCurrency.entries()).map(([currency, currencyBalances]) => (
              <div key={currency} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  color: 'var(--cds-text-secondary)',
                  marginBottom: '0.25rem',
                  textTransform: 'uppercase'
                }}>
                  {currency}
                </div>
                {currencyBalances.map((balance) => {
                  const member = members.find(m => m.id === balance.memberId);
                  const memberAvatarColors = getMemberAvatarColor(
                    member || { name: balance.memberName }
                  );
                  
                  let pillText = '';
                  let pillStyle: React.CSSProperties = {};
                  
                  if (balance.balance < -0.01) {
                    pillText = `Debe: ${formatCurrency(Math.abs(balance.balance), currency)}`;
                    pillStyle = {
                      backgroundColor: 'var(--cds-support-error-inverse)',
                      color: 'var(--cds-text-on-color)',
                      border: '1px solid var(--cds-border-subtle-01)'
                    };
                  } else if (balance.balance > 0.01) {
                    pillText = `Le deben: ${formatCurrency(balance.balance, currency)}`;
                    pillStyle = {
                      backgroundColor: 'var(--cds-layer-01)',
                      color: 'var(--cds-text-primary)',
                      border: '1px solid var(--cds-border-subtle-01)'
                    };
                  } else {
                    pillText = `Debe: ${formatCurrency(0, currency)}`;
                    pillStyle = {
                      backgroundColor: 'var(--cds-layer-02)',
                      color: 'var(--cds-text-secondary)',
                      border: '1px solid var(--cds-border-subtle-01)'
                    };
                  }

                  const capitalizedName = capitalizeName(balance.memberName);

                  return (
                    <div
                      key={`${currency}-${balance.memberId}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.7rem 0',
                        backgroundColor: 'var(--cds-layer-01)',
                        borderRadius: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <Tag type={getTagTypeFromColor(memberAvatarColors.bg)} size="sm">
                          {capitalizedName}
                        </Tag>
                        <div style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                          Pagó: {formatCurrency(balance.totalPaid, currency)}
                        </div>
                      </div>
                      <div>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          ...pillStyle
                        }}>
                          {pillText}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </Tile>

      {/* Optimized Transactions */}
      <Tile>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 500, 
          marginBottom: '1rem',
          backgroundColor: 'rgba(141, 141, 141, 0.20)',
          padding: '0.75rem 1rem',
          marginLeft: '-1rem',
          marginRight: '-1rem',
          marginTop: '-1rem',
          borderLeft: '3px solid var(--cds-button-primary, #0f62fe)'
        }}>Quién le debe a quién</h3>
        {transactionsByCurrency.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--cds-text-secondary)', padding: '2rem' }}>
            ¡Excelente! Todos los balances están saldados.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {Array.from(new Set(transactionsByCurrency.map(t => t.currency))).map((currency) => {
              const currencyTransactions = transactionsByCurrency.filter(t => t.currency === currency);
              return (
                <div key={currency} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: 'var(--cds-text-secondary)',
                    marginBottom: '0.25rem',
                    textTransform: 'uppercase'
                  }}>
                    {currency}
                  </div>
                  {currencyTransactions.map((transaction, index) => {
                    const fromMember = members.find(m => m.id === transaction.from);
                    const toMember = members.find(m => m.id === transaction.to);
                    const fromAvatarColors = getMemberAvatarColor(
                      fromMember || { name: transaction.fromName }
                    );
                    const toAvatarColors = getMemberAvatarColor(
                      toMember || { name: transaction.toName }
                    );
                    
                    return (
                    <div
                      key={`${currency}-${index}`}
                      style={{
                        padding: '0.6125rem 0',
                        backgroundColor: 'var(--cds-layer-01)',
                        borderRadius: '4px',
                        border: '1px solid var(--cds-border-subtle-01)',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        flexWrap: 'nowrap'
                      }}
                    >
                      {/* Transaction Flow */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem',
                        flexWrap: 'nowrap',
                        flex: 1,
                        minWidth: 0
                      }}>
                        <Tag type={getTagTypeFromColor(fromAvatarColors.bg)} size="sm">
                          {capitalizeName(transaction.fromName)}
                        </Tag>
                        <span style={{ color: 'var(--cds-text-secondary)', fontSize: '1.25rem', flexShrink: 0 }}>→</span>
                        <Tag type={getTagTypeFromColor(toAvatarColors.bg)} size="sm">
                          {capitalizeName(transaction.toName)}
                        </Tag>
                      </div>
                      
                      {/* Amount */}
                      <div style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        flexShrink: 0
                      }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginBottom: '0.25rem' }}>
                          Monto
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--cds-text-primary)' }}>
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </Tile>

      {/* Reset Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }} className="reset-button-container">
        <Button
          kind="secondary"
          onClick={onReset}
          className="reset-button-mobile"
        >
          Eliminar Datos
        </Button>
      </div>
    </div>
  );
}
