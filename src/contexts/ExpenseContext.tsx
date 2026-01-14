import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useProject } from './ProjectContext';
import { supabase } from '../utils/supabase';
import { Currency } from '../types';

export type SplitMethod = 'equal' | 'exact' | 'percentage' | 'shares' | 'manual';
export type PaymentMethod = 'cash' | 'paypal' | 'venmo' | 'transfer' | 'zelle' | 'other';
export type ExpenseType = 'expense' | 'settlement' | 'payment';

export interface Expense {
    id: string;
    project_id: string;
    description: string;
    amount: number;
    currency: Currency;
    paid_by: string; // project_member id
    expense_type: ExpenseType;
    settled_to?: string; // project_member id (for settlements)
    date: string;
    split_method: SplitMethod;
    payment_method?: PaymentMethod;
    payment_reference?: string;
    metadata?: any;
    created_by?: string;
    deleted_at?: string;
    created_at: string;
    updated_at: string;
}

export interface Split {
    id: string;
    expense_id: string;
    member_id: string;
    amount_owed: number;
    percentage?: number;
    shares?: number;
    notes?: string;
}

// Expense with splits loaded
export interface ExpenseWithSplits extends Expense {
    splits: Split[];
}

export interface SplitDetail {
    member_id: string;
    amount?: number;      // For exact amounts/manual
    percentage?: number;  // For percentages
    shares?: number;      // For shares
    notes?: string;
}

interface ExpenseContextType {
    expenses: ExpenseWithSplits[];
    loading: boolean;
    loadExpenses: () => Promise<void>;
    addExpense: (data: AddExpenseData) => Promise<Expense>;
    updateExpense: (id: string, data: Partial<AddExpenseData>) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;
}

export interface AddExpenseData {
    description: string;
    amount: number;
    paid_by: string; // member_id
    expense_type?: ExpenseType;
    split_method?: SplitMethod;
    split_details: SplitDetail[];
    payment_method?: PaymentMethod;
    payment_reference?: string;
    metadata?: any;
    settled_to?: string;
    date?: string;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function ExpenseProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { currentProject } = useProject();
    const [expenses, setExpenses] = useState<ExpenseWithSplits[]>([]);
    const [loading, setLoading] = useState(false);

    // Load expenses for current project
    const loadExpenses = useCallback(async () => {
        if (!currentProject) {
            setExpenses([]);
            return;
        }

        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('expenses')
                .select(`
          *,
          splits(*)
        `)
                .eq('project_id', currentProject.id)
                .is('deleted_at', null)
                .order('date', { ascending: false });

            if (error) throw error;

            // Cast to ExpenseWithSplits[]
            setExpenses((data || []) as ExpenseWithSplits[]);
        } catch {
            // Silent fail
        } finally {
            setLoading(false);
        }
    }, [currentProject]);

    // Helper to calculate split amounts based on method
    const calculateSplitAmounts = (
        totalAmount: number,
        splitMethod: SplitMethod,
        splitDetails: SplitDetail[]
    ): { member_id: string; amount_owed: number }[] => {
        if (!splitDetails || splitDetails.length === 0) return [];

        switch (splitMethod) {
            case 'equal': {
                const amountPerPerson = totalAmount / splitDetails.length;
                return splitDetails.map(d => ({
                    member_id: d.member_id,
                    amount_owed: amountPerPerson,
                }));
            }
            case 'exact':
            case 'manual':
                return splitDetails.map(d => ({
                    member_id: d.member_id,
                    amount_owed: d.amount || 0,
                }));
            case 'percentage':
                return splitDetails.map(d => ({
                    member_id: d.member_id,
                    amount_owed: totalAmount * ((d.percentage || 0) / 100),
                }));
            case 'shares': {
                const totalShares = splitDetails.reduce((sum, d) => sum + (d.shares || 0), 0);
                return splitDetails.map(d => ({
                    member_id: d.member_id,
                    amount_owed: totalShares > 0 ? (totalAmount * (d.shares || 0)) / totalShares : 0,
                }));
            }
            default:
                return [];
        }
    };

    // Add expense with splits
    const addExpense = async (data: AddExpenseData): Promise<Expense> => {
        if (!currentProject || !user) throw new Error('No project selected or user not authenticated');

        // 1. Calculate split amounts
        const splits = calculateSplitAmounts(
            data.amount,
            data.split_method || 'equal',
            data.split_details
        );

        // 2. Create expense
        const { data: newExpense, error: expenseError } = await supabase
            .from('expenses')
            .insert({
                project_id: currentProject.id,
                description: data.description,
                amount: data.amount,
                paid_by: data.paid_by,
                expense_type: data.expense_type || 'expense',
                split_method: data.split_method || 'equal',
                payment_method: data.payment_method,
                payment_reference: data.payment_reference,
                metadata: data.metadata,
                settled_to: data.settled_to,
                date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
                created_by: user.id,
            })
            .select()
            .single();

        if (expenseError) throw expenseError;

        // 3. Create splits
        const splitsToInsert = splits.map((split, index) => ({
            expense_id: newExpense.id,
            member_id: split.member_id,
            amount_owed: split.amount_owed,
            percentage: data.split_details[index].percentage,
            shares: data.split_details[index].shares,
            notes: data.split_details[index].notes,
        }));

        const { error: splitsError } = await supabase
            .from('splits')
            .insert(splitsToInsert);

        if (splitsError) throw splitsError;

        // Reload expenses to get splits
        await loadExpenses();

        return newExpense;
    };

    // Update expense
    const updateExpense = async (id: string, data: Partial<AddExpenseData>) => {
        // 1. Update expense
        const updateData: any = {};
        if (data.description) updateData.description = data.description;
        if (data.amount) updateData.amount = data.amount;
        if (data.paid_by) updateData.paid_by = data.paid_by;
        if (data.expense_type) updateData.expense_type = data.expense_type;
        if (data.split_method) updateData.split_method = data.split_method;
        if (data.payment_method) updateData.payment_method = data.payment_method;
        if (data.payment_reference) updateData.payment_reference = data.payment_reference;
        if (data.metadata) updateData.metadata = data.metadata;
        if (data.settled_to) updateData.settled_to = data.settled_to;

        const { error: expenseError } = await supabase
            .from('expenses')
            .update(updateData)
            .eq('id', id);

        if (expenseError) throw expenseError;

        // 2. Update splits if split_details or amount changed
        if ((data.split_details || data.amount) && id) {
            // We need the full current data for calculation if only part is provided
            const currentExpense = expenses.find(e => e.id === id);
            if (currentExpense) {
                const totalAmount = data.amount || currentExpense.amount;
                const splitMethod = data.split_method || currentExpense.split_method;

                // Reconstruct split details if not provided
                let splitDetails = data.split_details;
                if (!splitDetails) {
                    splitDetails = currentExpense.splits.map(s => ({
                        member_id: s.member_id,
                        amount: s.amount_owed,
                        percentage: s.percentage,
                        shares: s.shares,
                        notes: s.notes,
                    }));
                }

                const calculatedSplits = calculateSplitAmounts(
                    totalAmount,
                    splitMethod,
                    splitDetails
                );

                // Delete old splits
                await supabase
                    .from('splits')
                    .delete()
                    .eq('expense_id', id);

                // Create new splits
                const splitsToInsert = calculatedSplits.map((split, index) => ({
                    expense_id: id,
                    member_id: split.member_id,
                    amount_owed: split.amount_owed,
                    percentage: splitDetails![index].percentage,
                    shares: splitDetails![index].shares,
                    notes: splitDetails![index].notes,
                }));

                const { error: splitsError } = await supabase
                    .from('splits')
                    .insert(splitsToInsert);

                if (splitsError) throw splitsError;
            }
        }

        // Reload expenses to get updated splits
        await loadExpenses();
    };

    // Delete expense (soft delete)
    const deleteExpense = async (id: string) => {
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase.rpc('delete_expense', {
            expense_id: id
        });

        if (error) throw error;

        setExpenses(prev => prev.filter(e => e.id !== id));
    };

    // Load expenses when project changes
    useEffect(() => {
        loadExpenses();
    }, [loadExpenses]);

    return (
        <ExpenseContext.Provider
            value={{
                expenses,
                loading,
                loadExpenses,
                addExpense,
                updateExpense,
                deleteExpense,
            }}
        >
            {children}
        </ExpenseContext.Provider>
    );
}

export function useExpenses() {
    const context = useContext(ExpenseContext);
    if (context === undefined) {
        throw new Error('useExpenses must be used within an ExpenseProvider');
    }
    return context;
}
