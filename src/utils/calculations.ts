import { Member, Expense, Balance, Transaction, Currency } from '../types';

/**
 * Capitalizes each word in a name
 * Example: "juan pablo" -> "Juan Pablo"
 */
export const capitalizeName = (name: string | null | undefined): string => {
  if (!name) return '';

  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Calculate balances for each member
 */
export const calculateBalances = (
  members: Member[],
  expenses: Expense[]
): Balance[] => {
  const balances: Map<string, Balance> = new Map();

  // Initialize balances
  members.forEach((member) => {
    balances.set(member.id, {
      memberId: member.id,
      memberName: member.name,
      totalPaid: 0,
      totalOwed: 0,
      balance: 0,
    });
  });

  // Process expenses
  expenses.forEach((expense) => {
    const paidByBalance = balances.get(expense.paidBy);
    if (paidByBalance) {
      paidByBalance.totalPaid += expense.amount;
    }

    // Calculate how much each person owes
    const splitAmount = expense.amount / expense.splitBetween.length;
    expense.splitBetween.forEach((memberId) => {
      const balance = balances.get(memberId);
      if (balance) {
        balance.totalOwed += splitAmount;
      }
    });
  });

  // Calculate final balance (positive = owed money, negative = owes money)
  balances.forEach((balance) => {
    balance.balance = balance.totalPaid - balance.totalOwed;
  });

  return Array.from(balances.values());
};

/**
 * Calculate balances for each member grouped by currency
 */
export const calculateBalancesByCurrency = (
  members: Member[],
  expenses: Expense[]
): Map<Currency, Balance[]> => {
  const balancesByCurrency = new Map<Currency, Map<string, Balance>>();

  // Initialize balances for each currency
  const currencies: Currency[] = ['CLP', 'USD', 'BRL', 'ARS', 'EUR', 'GBP', 'PEN'];
  currencies.forEach((currency) => {
    const balances: Map<string, Balance> = new Map();
    members.forEach((member) => {
      balances.set(member.id, {
        memberId: member.id,
        memberName: member.name,
        totalPaid: 0,
        totalOwed: 0,
        balance: 0,
      });
    });
    balancesByCurrency.set(currency, balances);
  });

  // Process expenses by currency
  expenses.forEach((expense) => {
    const balances = balancesByCurrency.get(expense.currency);
    if (!balances) return;

    const paidByBalance = balances.get(expense.paidBy);
    if (paidByBalance) {
      paidByBalance.totalPaid += expense.amount;
    }

    // Calculate how much each person owes
    if (expense.splits && expense.splits.length > 0) {
      expense.splits.forEach((split) => {
        const balance = balances.get(split.memberId);
        if (balance) {
          balance.totalOwed += split.amountOwed;
        }
      });
    } else {
      // Fallback to equal split if no splits provided (legacy)
      const splitAmount = expense.amount / expense.splitBetween.length;
      expense.splitBetween.forEach((memberId) => {
        const balance = balances.get(memberId);
        if (balance) {
          balance.totalOwed += splitAmount;
        }
      });
    }
  });

  // Calculate final balance for each currency
  const result = new Map<Currency, Balance[]>();
  balancesByCurrency.forEach((balances, currency) => {
    balances.forEach((balance) => {
      balance.balance = balance.totalPaid - balance.totalOwed;
    });
    // Only include currencies that have non-zero balances
    const nonZeroBalances = Array.from(balances.values()).filter(
      (b) => Math.abs(b.balance) > 0.01 || Math.abs(b.totalPaid) > 0.01 || Math.abs(b.totalOwed) > 0.01
    );
    if (nonZeroBalances.length > 0) {
      result.set(currency, nonZeroBalances);
    }
  });

  return result;
};

/**
 * Optimize transactions to minimize the number of payments needed
 * Uses a greedy algorithm to settle debts
 */
export const optimizeTransactions = (balances: Balance[]): Transaction[] => {
  // Separate creditors (positive balance) and debtors (negative balance)
  const creditors: Balance[] = balances
    .filter((b) => b.balance > 0.01) // Use small threshold to avoid floating point issues
    .sort((a, b) => b.balance - a.balance);

  const debtors: Balance[] = balances
    .filter((b) => b.balance < -0.01)
    .map((b) => ({ ...b, balance: Math.abs(b.balance) })) // Convert to positive for easier calculation
    .sort((a, b) => b.balance - a.balance);

  const transactions: Transaction[] = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];

    const amount = Math.min(creditor.balance, debtor.balance);

    if (amount > 0.01) {
      transactions.push({
        from: debtor.memberId,
        fromName: debtor.memberName,
        to: creditor.memberId,
        toName: creditor.memberName,
        amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
        currency: 'CLP', // Default currency for backward compatibility
      });

      creditor.balance -= amount;
      debtor.balance -= amount;

      if (creditor.balance < 0.01) {
        creditorIndex++;
      }
      if (debtor.balance < 0.01) {
        debtorIndex++;
      }
    } else {
      break;
    }
  }

  return transactions;
};

/**
 * Optimize transactions by currency to minimize the number of payments needed
 * Uses a greedy algorithm to settle debts for each currency separately
 */
export const optimizeTransactionsByCurrency = (
  balancesByCurrency: Map<Currency, Balance[]>
): Transaction[] => {
  const allTransactions: Transaction[] = [];

  balancesByCurrency.forEach((balances, currency) => {
    // Separate creditors (positive balance) and debtors (negative balance)
    const creditors: Balance[] = balances
      .filter((b) => b.balance > 0.01) // Use small threshold to avoid floating point issues
      .sort((a, b) => b.balance - a.balance);

    const debtors: Balance[] = balances
      .filter((b) => b.balance < -0.01)
      .map((b) => ({ ...b, balance: Math.abs(b.balance) })) // Convert to positive for easier calculation
      .sort((a, b) => b.balance - a.balance);

    let creditorIndex = 0;
    let debtorIndex = 0;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex];
      const debtor = debtors[debtorIndex];

      const amount = Math.min(creditor.balance, debtor.balance);

      if (amount > 0.01) {
        allTransactions.push({
          from: debtor.memberId,
          fromName: debtor.memberName,
          to: creditor.memberId,
          toName: creditor.memberName,
          amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
          currency: currency,
        });

        creditor.balance -= amount;
        debtor.balance -= amount;

        if (creditor.balance < 0.01) {
          creditorIndex++;
        }
        if (debtor.balance < 0.01) {
          debtorIndex++;
        }
      } else {
        break;
      }
    }
  });

  return allTransactions;
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number, currency: Currency = 'CLP'): string => {
  const localeMap: Record<Currency, string> = {
    CLP: 'es-CL',
    USD: 'en-US',
    BRL: 'pt-BR',
    ARS: 'es-AR',
    EUR: 'es-ES',
    GBP: 'en-GB',
    PEN: 'es-PE',
  };

  return new Intl.NumberFormat(localeMap[currency], {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Get currency symbol
 */
export const getCurrencySymbol = (currency: Currency): string => {
  const localeMap: Record<Currency, string> = {
    CLP: 'es-CL',
    USD: 'en-US',
    BRL: 'pt-BR',
    ARS: 'es-AR',
    EUR: 'es-ES',
    GBP: 'en-GB',
    PEN: 'es-PE',
  };

  const formatter = new Intl.NumberFormat(localeMap[currency], {
    style: 'currency',
    currency: currency,
  });

  // Get the symbol by formatting 0 and extracting the symbol
  const parts = formatter.formatToParts(0);
  const symbolPart = parts.find(part => part.type === 'currency');
  return symbolPart ? symbolPart.value : currency;
};

/**
 * Format date
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
};

/**
 * Get decimal separator for currency
 */
export const getDecimalSeparator = (currency: Currency): string => {
  const decimalSeparator: Record<Currency, string> = {
    CLP: '.',
    USD: '.',
    BRL: ',',
    ARS: ',',
    EUR: ',',
    GBP: '.',
    PEN: '.',
  };
  return decimalSeparator[currency];
};

/**
 * Get thousands separator for currency
 */
export const getThousandsSeparator = (currency: Currency): string => {
  // For most currencies, thousands separator is opposite of decimal separator
  const decimalSep = getDecimalSeparator(currency);
  return decimalSep === '.' ? '.' : '.';
};

/**
 * Get placeholder for currency input
 */
export const getCurrencyPlaceholder = (currency: Currency): string => {
  // Get the formatted currency with 0 to see the format
  const formatted = formatCurrency(0, currency);

  // Extract the number format pattern
  // For example: "$0.00" -> "0.00", "0,00 €" -> "0,00", "R$ 0,00" -> "0,00"
  const numberMatch = formatted.match(/[\d.,]+/);
  if (numberMatch) {
    return numberMatch[0];
  }

  // Fallback based on currency locale
  const separator = getDecimalSeparator(currency);
  return `0${separator}00`;
};

/**
 * Format amount input with thousands separator while typing
 * Maximum value: 99,000,000
 */
export const formatAmountInput = (value: string, currency: Currency): string => {
  if (!value) return '';

  const MAX_VALUE = 99000000;
  const decimalSeparator = getDecimalSeparator(currency);
  const thousandsSeparator = '.';

  // Remove all non-digit characters except dots and commas
  let cleaned = value.replace(/[^\d.,]/g, '');

  if (decimalSeparator === ',') {
    // For currencies with comma as decimal separator (BRL, ARS, EUR)
    // All dots are thousands separators, comma is decimal separator
    const lastCommaIndex = cleaned.lastIndexOf(',');

    if (lastCommaIndex !== -1) {
      // Has decimal part (or just the comma separator)
      const integerPart = cleaned.substring(0, lastCommaIndex).replace(/[,.]/g, '');
      const decimalPart = cleaned.substring(lastCommaIndex + 1).replace(/[,.]/g, '');

      // Check if integer part exceeds maximum
      const integerValue = parseInt(integerPart || '0', 10);
      if (integerValue > MAX_VALUE) {
        // Limit to maximum
        const limitedInteger = MAX_VALUE.toString();
        const limitedDecimal = decimalPart.substring(0, 2);
        const formattedInteger = limitedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
        return formattedInteger + decimalSeparator + limitedDecimal;
      }

      const limitedDecimal = decimalPart.substring(0, 2);

      // Format integer part with thousands separator
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);

      // Always show the decimal separator if it was typed, even if no digits after
      return formattedInteger + decimalSeparator + limitedDecimal;
    } else {
      // No decimal part, all dots are thousands separators
      const integerPart = cleaned.replace(/[,.]/g, '');
      const integerValue = parseInt(integerPart || '0', 10);

      if (integerValue > MAX_VALUE) {
        // Limit to maximum
        const limitedInteger = MAX_VALUE.toString();
        return limitedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
      }

      return integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
    }
  } else {
    // For currencies with dot as decimal separator (CLP, USD, GBP)
    // Strategy: If the last dot has more than 2 digits after it, it's a thousands separator
    // If it has 2 or fewer digits, it's a decimal separator
    const lastDotIndex = cleaned.lastIndexOf('.');
    const lastCommaIndex = cleaned.lastIndexOf(',');

    // Determine if there's a decimal part
    let hasDecimal = false;
    let decimalPart = '';
    let integerPart = '';

    if (lastDotIndex !== -1) {
      const afterLastDot = cleaned.substring(lastDotIndex + 1).replace(/[,.]/g, '');
      const beforeLastDot = cleaned.substring(0, lastDotIndex).replace(/[,.]/g, '');
      const dotCount = (cleaned.match(/\./g) || []).length;

      // If there are more than 2 digits after the last dot, it's a thousands separator
      // Move those digits to the integer part
      if (afterLastDot.length > 2) {
        // Last dot is thousands separator, all digits go to integer part
        integerPart = cleaned.replace(/[,.]/g, '');
      } else if (afterLastDot.length > 0 && (lastCommaIndex === -1 || lastDotIndex > lastCommaIndex)) {
        // Last dot is decimal separator (1-2 digits after it)
        hasDecimal = true;
        integerPart = beforeLastDot;
        decimalPart = afterLastDot;
      } else if (dotCount === 1 && beforeLastDot.length > 0) {
        // Only one dot and it's at the end (user just typed the decimal separator)
        // Treat it as decimal separator to allow adding decimals
        hasDecimal = true;
        integerPart = beforeLastDot;
        decimalPart = '';
      } else {
        // Multiple dots or no digits before, treat as thousands separator
        integerPart = cleaned.replace(/[,.]/g, '');
      }
    } else if (lastCommaIndex !== -1 && (lastDotIndex === -1 || lastCommaIndex > lastDotIndex)) {
      // Last separator is a comma, but we use dot for decimal - convert it
      const afterLastComma = cleaned.substring(lastCommaIndex + 1).replace(/[,.]/g, '');
      if (afterLastComma.length > 0 && afterLastComma.length <= 2) {
        hasDecimal = true;
        integerPart = cleaned.substring(0, lastCommaIndex).replace(/[,.]/g, '');
        decimalPart = afterLastComma;
      } else {
        integerPart = cleaned.replace(/[,.]/g, '');
      }
    } else {
      // No decimal separator, all are thousands separators
      integerPart = cleaned.replace(/[,.]/g, '');
    }

    // Check if integer part exceeds maximum
    const integerValue = parseInt(integerPart || '0', 10);
    if (integerValue > MAX_VALUE) {
      // Limit to maximum
      const limitedInteger = MAX_VALUE.toString();
      const formattedInteger = limitedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);

      if (hasDecimal) {
        const limitedDecimal = decimalPart.substring(0, 2);
        return formattedInteger + (limitedDecimal ? decimalSeparator + limitedDecimal : '');
      }
      return formattedInteger;
    }

    // Format integer part with thousands separator
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);

    if (hasDecimal) {
      const limitedDecimal = decimalPart.substring(0, 2);
      // Always show decimal separator if it was typed, even if no digits after
      return formattedInteger + decimalSeparator + limitedDecimal;
    }

    return formattedInteger;
  }
};
