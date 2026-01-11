import { Member, Expense, Balance, Transaction } from '../types';
import { formatCurrency, formatDate } from './calculations';

export const exportSummary = (
  members: Member[],
  expenses: Expense[],
  balances: Balance[],
  transactions: Transaction[]
): string => {
  let summary = '=== RESUMEN DE GASTOS COMPARTIDOS ===\n\n';

  // Members
  summary += 'GRUPO:\n';
  members.forEach((member, index) => {
    summary += `${index + 1}. ${member.name}\n`;
  });
  summary += '\n';

  // Expenses
  summary += 'GASTOS:\n';
  if (expenses.length === 0) {
    summary += 'No hay gastos registrados.\n';
  } else {
    expenses.forEach((expense, index) => {
      const paidBy = members.find((m) => m.id === expense.paidBy);
      const splitMembers = expense.splitBetween
        .map((id) => members.find((m) => m.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      summary += `${index + 1}. ${expense.description}\n`;
      summary += `   Monto: ${formatCurrency(expense.amount, expense.currency)}\n`;
      summary += `   Pagado por: ${paidBy?.name || 'Desconocido'}\n`;
      summary += `   Dividido entre: ${splitMembers}\n`;
      summary += `   Fecha: ${formatDate(expense.date)}\n\n`;
    });
  }

  // Balances
  summary += 'BALANCES:\n';
  balances.forEach((balance) => {
    summary += `${balance.memberName}:\n`;
    summary += `  Pagado: ${formatCurrency(balance.totalPaid)}\n`;
    summary += `  Debe: ${formatCurrency(balance.totalOwed)}\n`;
    if (balance.balance > 0.01) {
      summary += `  Le deben: ${formatCurrency(balance.balance)}\n`;
    } else if (balance.balance < -0.01) {
      summary += `  Debe: ${formatCurrency(Math.abs(balance.balance))}\n`;
    } else {
      summary += `  Balance: ${formatCurrency(0)}\n`;
    }
    summary += '\n';
  });

  // Transactions
  summary += 'TRANSACCIONES PARA SALDAR:\n';
  if (transactions.length === 0) {
    summary += 'No hay transacciones pendientes. Todos los balances están saldados.\n';
  } else {
    transactions.forEach((transaction, index) => {
      summary += `${index + 1}. ${transaction.fromName} debe pagar ${formatCurrency(transaction.amount)} a ${transaction.toName}\n`;
    });
  }

  return summary;
};

export const downloadSummary = (content: string, filename: string = 'resumen-gastos.txt'): void => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
