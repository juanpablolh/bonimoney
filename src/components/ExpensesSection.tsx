import { useState, useEffect, useRef } from 'react';
import { 
  TextInput, 
  Select, 
  SelectItem, 
  Dropdown,
  Button, 
  Tile, 
  RadioButtonGroup, 
  RadioButton, 
  Checkbox
} from '@carbon/react';
import { ChevronDown, ChevronRight, TrashCan, Edit } from '@carbon/icons-react';
import { Member, Expense, Currency, ExpenseIcon } from '../types';
import { formatCurrency, formatDate, getCurrencyPlaceholder, formatAmountInput, getDecimalSeparator, capitalizeName } from '../utils/calculations';
import { EXPENSE_ICONS, EXPENSE_ICON_OPTIONS, getExpenseIcon } from '../utils/expenseIcons';

interface ExpensesSectionProps {
  members: Member[];
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  onEditExpense: (id: string, expense: Omit<Expense, 'id' | 'date'>) => void;
  onDeleteExpense: (id: string) => void;
  onReset?: () => void;
  onNavigateToMembers?: () => void;
}

export default function ExpensesSection({
  members,
  expenses,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onNavigateToMembers,
}: ExpensesSectionProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('CLP');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState<'all' | 'selected'>('all');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [isCalloutDismissed, setIsCalloutDismissed] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState<Set<string>>(new Set());
  const [isExpensesListExpanded, setIsExpensesListExpanded] = useState(true);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseIcon, setExpenseIcon] = useState<ExpenseIcon | undefined>(undefined);
  const dropdownWrapperRef = useRef<HTMLDivElement>(null);

  // Update the dropdown button padding to make room for icon and set placeholder
  useEffect(() => {
    const updateDropdown = () => {
      if (dropdownWrapperRef.current) {
        const button = dropdownWrapperRef.current.querySelector('.cds--list-box__field') as HTMLElement;
        if (button) {
          if (expenseIcon) {
            button.style.paddingLeft = '40px';
            button.style.position = 'relative';
          } else {
            button.style.paddingLeft = '';
            // Set placeholder text when no icon is selected
            const label = button.querySelector('.cds--list-box__label') as HTMLElement;
            if (label) {
              if (!label.textContent || label.textContent.trim() === '') {
                label.textContent = 'Seleccionar';
                label.style.color = 'var(--cds-text-placeholder, #8d8d8d)';
              }
            } else {
              // If no label element exists, set it on the button itself
              if (!button.textContent || button.textContent.trim() === '') {
                button.setAttribute('data-placeholder', 'Seleccionar');
              }
            }
            button.setAttribute('title', 'Seleccionar');
          }
        }
      }
    };

    // Run immediately
    updateDropdown();

    // Also run after a short delay to catch any async updates
    const timeout = setTimeout(updateDropdown, 100);

    return () => clearTimeout(timeout);
  }, [expenseIcon]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || !paidBy) return;

    // Convert formatted amount to number
    // For currencies with comma as decimal (BRL, ARS, EUR): remove all dots (thousands), keep comma
    // For currencies with dot as decimal (CLP, USD, GBP): last dot with 2 or fewer digits after is decimal, others are thousands
    let normalizedAmount = '';
    const decimalSeparator = getDecimalSeparator(currency);
    
    if (decimalSeparator === ',') {
      // Remove all dots (thousands separators), keep comma as decimal
      normalizedAmount = amount.replace(/\./g, '').replace(',', '.');
    } else {
      // For currencies with dot as decimal separator
      // Strategy: If last dot has more than 2 digits after it, it's a thousands separator
      // If it has 2 or fewer digits, it's a decimal separator
      const lastDotIndex = amount.lastIndexOf('.');
      if (lastDotIndex !== -1) {
        const afterLastDot = amount.substring(lastDotIndex + 1);
        const digitsAfterDot = afterLastDot.replace(/[^\d]/g, '').length;
        
        if (digitsAfterDot > 2) {
          // Last dot is thousands separator, no decimal part
          normalizedAmount = amount.replace(/\./g, '');
        } else if (digitsAfterDot > 0) {
          // Last dot is decimal separator (1-2 digits after it)
          const integerPart = amount.substring(0, lastDotIndex).replace(/\./g, '');
          const decimalPart = afterLastDot.replace(/[^\d]/g, '');
          normalizedAmount = integerPart + '.' + decimalPart;
        } else {
          // No digits after dot, treat as thousands separator
          normalizedAmount = amount.replace(/\./g, '');
        }
      } else {
        // No decimal part, just remove all dots
        normalizedAmount = amount.replace(/\./g, '');
      }
    }
    
    const amountNum = parseFloat(normalizedAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    
    // Validate maximum value (99 million)
    if (amountNum > 99000000) {
      alert('El monto máximo permitido es 99.000.000');
      return;
    }

    const splitBetween =
      splitType === 'all'
        ? members.map((m) => m.id)
        : Array.from(selectedMembers);

    if (splitBetween.length === 0) return;

    if (editingExpenseId) {
      // Edit existing expense
      onEditExpense(editingExpenseId, {
        description: description.trim(),
        amount: amountNum,
        currency,
        paidBy,
        splitBetween,
        icon: expenseIcon || undefined,
      });
      setEditingExpenseId(null);
    } else {
      // Add new expense
      onAddExpense({
        description: description.trim(),
        amount: amountNum,
        currency,
        paidBy,
        splitBetween,
        icon: expenseIcon || undefined,
      });
    }

    // Reset form
    setDescription('');
    setAmount('');
    setCurrency('CLP');
    setPaidBy('');
    setSplitType('all');
    setSelectedMembers(new Set());
    setExpenseIcon(undefined);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setDescription(expense.description);
    setAmount(expense.amount.toString());
    setCurrency(expense.currency);
    setPaidBy(expense.paidBy);
    setExpenseIcon(expense.icon || undefined);
    
    // Check if split is for all members or selected
    const allMemberIds = members.map((m) => m.id);
    const isAllMembers = expense.splitBetween.length === allMemberIds.length &&
      expense.splitBetween.every((id) => allMemberIds.includes(id));
    
    if (isAllMembers) {
      setSplitType('all');
      setSelectedMembers(new Set());
    } else {
      setSplitType('selected');
      setSelectedMembers(new Set(expense.splitBetween));
    }

    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingExpenseId(null);
    setDescription('');
    setAmount('');
    setCurrency('CLP');
    setPaidBy('');
    setSplitType('all');
    setSelectedMembers(new Set());
    setExpenseIcon(undefined);
  };

  const toggleMember = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const toggleDetails = (expenseId: string) => {
    const newExpanded = new Set(expandedDetails);
    if (newExpanded.has(expenseId)) {
      newExpanded.delete(expenseId);
    } else {
      newExpanded.add(expenseId);
    }
    setExpandedDetails(newExpanded);
  };

  const showCallout = members.length === 0 && !isCalloutDismissed;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Callout Notification */}
      {showCallout && (
        <Tile style={{ 
          backgroundColor: 'var(--cds-notification-info-background, #e5f6ff)',
          borderLeft: '3px solid var(--cds-support-info, #0043ce)',
          padding: '1rem',
          borderRadius: '4px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--cds-support-info, #0043ce)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>i</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    marginBottom: '0.25rem',
                    color: 'var(--cds-text-primary, #161616)'
                  }}>
                    Agrega un integrante primero
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: 'var(--cds-text-secondary, #525252)'
                  }}>
                    Antes de ingresar un gasto, necesitas agregar al menos un integrante al grupo.
                  </div>
                </div>
                <button
                  onClick={() => setIsCalloutDismissed(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--cds-text-secondary, #525252)',
                    flexShrink: 0
                  }}
                  aria-label="Cerrar"
                >
                  <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>×</span>
                </button>
              </div>
            </div>
            {onNavigateToMembers && (
              <div style={{ marginLeft: '32px' }}>
                <Button
                  kind="ghost"
                  size="sm"
                  onClick={onNavigateToMembers}
                  style={{
                    color: 'var(--cds-link-primary, #0043ce)'
                  }}
                >
                  Agregar integrante
                </Button>
              </div>
            )}
          </div>
        </Tile>
      )}

      {/* Add/Edit Expense Form */}
      <Tile style={{ marginTop: '24px' }}>
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
        }}>
          {editingExpenseId ? 'Editar Gasto' : 'Agregar Gasto'}
        </h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <TextInput
            id="expense-description"
            labelText="Descripción"
            placeholder="Ej: Cena en restaurante"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          {/* Icon Selector */}
          <div ref={dropdownWrapperRef} style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
              Tipo de Gasto
            </label>
            <Dropdown
              id="expense-icon"
              label=""
              titleText=""
              items={EXPENSE_ICON_OPTIONS.map((iconName) => ({
                id: iconName,
                value: iconName,
                label: EXPENSE_ICONS[iconName].label,
                icon: iconName
              }))}
              selectedItem={expenseIcon ? {
                id: expenseIcon,
                value: expenseIcon,
                label: EXPENSE_ICONS[expenseIcon].label,
                icon: expenseIcon
              } : null}
              itemToString={(item) => item ? item.label : 'Seleccionar'}
              itemToElement={(item) => {
                if (!item) return null;
                const IconComponent = EXPENSE_ICONS[item.icon as ExpenseIcon].component;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <IconComponent size={16} />
                    <span>{item.label}</span>
                  </div>
                );
              }}
              onChange={(e) => {
                if (e.selectedItem) {
                  setExpenseIcon(e.selectedItem.value as ExpenseIcon);
                }
              }}
            />
            <style>{`
              #expense-icon .cds--list-box__field {
                padding-left: ${expenseIcon ? '40px' : '12px'} !important;
              }
              #expense-icon .cds--list-box__field[data-placeholder] .cds--list-box__label:empty::before,
              #expense-icon .cds--list-box__field[data-placeholder]:not(:has(.cds--list-box__label))::before {
                content: attr(data-placeholder);
                color: var(--cds-text-placeholder, #8d8d8d);
              }
            `}</style>
            {expenseIcon && (() => {
              const IconComponent = EXPENSE_ICONS[expenseIcon].component;
              return (
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(calc(-50% + 12px))',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    zIndex: 1,
                    color: 'var(--cds-button-primary, #0f62fe)'
                  }}
                >
                  <IconComponent size={16} />
                </div>
              );
            })()}
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem'
          }}>
            <Select
              id="expense-currency"
              labelText="Moneda"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              required
            >
              <SelectItem value="CLP" text="Peso Chileno (CLP)" />
              <SelectItem value="USD" text="Dólar (USD)" />
              <SelectItem value="BRL" text="Real Brasileño (BRL)" />
              <SelectItem value="ARS" text="Peso Argentino (ARS)" />
              <SelectItem value="EUR" text="Euro (EUR)" />
              <SelectItem value="GBP" text="Libra Esterlina (GBP)" />
              <SelectItem value="PEN" text="Sol Peruano (PEN)" />
            </Select>

            <TextInput
              id="expense-amount"
              labelText="Monto"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                const formatted = formatAmountInput(e.target.value, currency);
                setAmount(formatted);
              }}
              placeholder={getCurrencyPlaceholder(currency)}
              required
            />

            <Select
              id="expense-paid-by"
              labelText="Pagado por"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              required
            >
              <SelectItem value="" text="Seleccionar..." />
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id} text={member.name} />
              ))}
            </Select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
              Dividir entre
            </label>
            <RadioButtonGroup
              name="splitType"
              valueSelected={splitType}
              onChange={(value) => {
                setSplitType(value as 'all' | 'selected');
                if (value === 'all') {
                  setSelectedMembers(new Set());
                }
              }}
              legendText=""
            >
              <RadioButton labelText="Todos los integrantes" value="all" id="split-all" />
              <RadioButton labelText="Seleccionar integrantes" value="selected" id="split-selected" />
            </RadioButtonGroup>

            {splitType === 'selected' && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '0.5rem',
                padding: '1rem',
                backgroundColor: 'var(--cds-layer-01)',
                borderRadius: '4px',
                marginTop: '1rem'
              }}>
                {members.map((member) => (
                  <Checkbox
                    key={member.id}
                    id={`member-${member.id}`}
                    labelText={member.name}
                    checked={selectedMembers.has(member.id)}
                    onChange={() => toggleMember(member.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
            {editingExpenseId && (
              <Button
                type="button"
                kind="secondary"
                onClick={handleCancelEdit}
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              disabled={splitType === 'selected' && selectedMembers.size === 0}
              style={{ flex: 1, width: '100%' }}
            >
              {editingExpenseId ? 'Guardar Cambios' : 'Agregar Gasto'}
            </Button>
          </div>
        </form>
      </Tile>

      {/* Expenses List */}
      <Tile style={{ marginTop: '24px' }}>
        <h3 
          onClick={() => setIsExpensesListExpanded(!isExpensesListExpanded)}
          style={{ 
            fontSize: '1.25rem', 
            fontWeight: 500, 
            marginBottom: '1rem',
            backgroundColor: 'rgba(141, 141, 141, 0.20)',
            padding: '0.75rem 1rem',
            marginLeft: '-1rem',
            marginRight: '-1rem',
            marginTop: '-1rem',
            borderLeft: '3px solid var(--cds-button-primary, #0f62fe)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none'
          }}
        >
          <span>Lista de Gastos</span>
          {isExpensesListExpanded ? (
            <ChevronDown size={20} style={{ flexShrink: 0 }} />
          ) : (
            <ChevronRight size={20} style={{ flexShrink: 0 }} />
          )}
        </h3>
        {isExpensesListExpanded && (
          <>
            {expenses.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--cds-text-secondary)', padding: '2rem' }}>
            No hay gastos registrados. Agrega el primero arriba.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {expenses
              .slice()
              .sort((a, b) => {
                const dateA = a.date instanceof Date ? a.date : new Date(a.date);
                const dateB = b.date instanceof Date ? b.date : new Date(b.date);
                return dateB.getTime() - dateA.getTime();
              })
              .map((expense) => {
                const paidByMember = members.find((m) => m.id === expense.paidBy);
                const splitMembers = expense.splitBetween
                  .map((id) => members.find((m) => m.id === id)?.name)
                  .filter(Boolean);
                const perPerson = expense.amount / expense.splitBetween.length;
                const isExpanded = expandedDetails.has(expense.id);

                return (
                  <div
                    key={expense.id}
                    style={{
                      padding: '1rem',
                      backgroundColor: 'var(--cds-layer-01)',
                      borderRadius: '4px',
                      border: '1px solid var(--cds-border-subtle-01)',
                      borderBottom: '1px solid var(--cds-border-subtle-02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    {/* Primera fila: Descripción y Monto - Información principal */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start', 
                      gap: '8px',
                      width: '100%'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                        {getExpenseIcon(expense.icon, 24) && (
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
                            {getExpenseIcon(expense.icon, 24)}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            fontWeight: 500, 
                            fontSize: '1rem',
                            wordBreak: 'break-word'
                          }}>
                            {expense.description.charAt(0).toUpperCase() + expense.description.slice(1).toLowerCase()}
                          </div>
                        </div>
                      </div>
                      <div style={{ 
                        fontSize: '1.125rem', 
                        fontWeight: 500,
                        flexShrink: 0,
                        textAlign: 'right'
                      }}>
                        {formatCurrency(expense.amount, expense.currency)}
                      </div>
                    </div>

                    {/* Segunda fila: Información secundaria y acciones */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        flex: 1,
                        minWidth: 0
                      }}>
                        <div style={{ 
                          fontSize: '0.875rem', 
                          color: 'var(--cds-text-secondary)'
                        }}>
                          Pagado por: <span style={{ fontWeight: 500 }}>{paidByMember?.name ? capitalizeName(paidByMember.name) : 'Desconocido'}</span>
                        </div>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        flexShrink: 0
                      }}>
                        <Button
                          kind="ghost"
                          size="sm"
                          hasIconOnly
                          iconDescription="Editar gasto"
                          onClick={() => handleEdit(expense)}
                          renderIcon={Edit}
                        />
                        <Button
                          kind="danger--tertiary"
                          size="sm"
                          hasIconOnly
                          iconDescription="Eliminar gasto"
                          onClick={() => onDeleteExpense(expense.id)}
                          renderIcon={TrashCan}
                        />
                      </div>
                    </div>

                    {/* Botón de detalles */}
                    <div style={{ width: '100%' }}>
                      <Button
                        kind="ghost"
                        size="sm"
                        onClick={() => toggleDetails(expense.id)}
                        style={{ padding: 0 }}
                      >
                        {isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
                        <ChevronDown 
                          size={16} 
                          style={{ 
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                            marginLeft: '0.25rem'
                          }} 
                        />
                      </Button>
                    </div>

                    {/* Tercera fila: Detalles expandidos - Usa todo el ancho */}
                    {isExpanded && (
                      <div style={{ 
                        width: '100%',
                        paddingTop: '0.75rem', 
                        borderTop: '1px solid var(--cds-border-subtle-01)',
                        fontSize: '0.875rem',
                        color: 'var(--cds-text-secondary)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}>
                        <div>
                          Dividido entre: <span style={{ fontWeight: 500 }}>{splitMembers.join(', ')}</span>
                        </div>
                        <div>
                          {formatCurrency(perPerson, expense.currency)} por persona
                        </div>
                        <div>
                          {formatDate(expense.date)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
            )}
          </>
        )}
      </Tile>
    </div>
  );
}
