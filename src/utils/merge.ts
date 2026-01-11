import { AppData, Expense } from '../types';

/**
 * Get current timestamp
 */
const getTimestamp = (): number => Date.now();

/**
 * Update lastModified timestamp for an expense
 */
export const updateExpenseTimestamp = (expense: Expense): Expense => ({
  ...expense,
  lastModified: getTimestamp(),
});

/**
 * Add metadata to AppData
 */
export const addMetadata = (data: AppData): AppData => ({
  ...data,
  lastModified: getTimestamp(),
  version: (data.version || 0) + 1,
  expenses: data.expenses.map(exp => ({
    ...exp,
    lastModified: exp.lastModified || getTimestamp(),
  })),
});

