import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useProject } from './ProjectContext';
import { supabase } from '../utils/supabase';
import { Currency } from '../types';

export interface Expense {
    id: string;
    project_id: string;
    description: string;
    amount: number;
    currency: Currency;
    paid_by: string; // project_member id
    expense_type: 'expense' | 'settlement';
    settled_to?: string; // project_member id (for settlements)
    date: string;
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
}

interface ExpenseContextType {
    expenses: Expense[];
    loading: boolean;
    loadExpenses: () => Promise<void>;
    addExpense: (data: AddExpenseData) => Promise<Expense>;
    updateExpense: (id: string, data: Partial<AddExpenseData>) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;
}

interface AddExpenseData {
    description: string;
    amount: number;
    paid_by: string; // member_id
    split_between: string[]; // array of member_ids
    expense_type?: 'expense' | 'settlement';
    settled_to?: string;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function ExpenseProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { currentProject } = useProject();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(false);

    // Load expenses for current project
    const loadExpenses = async () => {
        if (!currentProject) {
            setExpenses([]);
            return;
        }

        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .eq('project_id', currentProject.id)
                .is('deleted_at', null)
                .order('date', { ascending: false });

            if (error) throw error;

            setExpenses(data || []);
        } catch (error) {
            console.error('Error loading expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    // Add expense with splits
    const addExpense = async (data: AddExpenseData): Promise<Expense> => {
        if (!currentProject || !user) throw new Error('No project selected or user not authenticated');

        try {
            // 1. Create expense
            const { data: newExpense, error: expenseError } = await supabase
                .from('expenses')
                .insert({
                    project_id: currentProject.id,
                    description: data.description,
                    amount: data.amount,
                    paid_by: data.paid_by,
                    expense_type: data.expense_type || 'expense',
                    settled_to: data.settled_to,
                    date: new Date().toISOString(),
                    created_by: user.id,
                })
                .select()
                .single();

            if (expenseError) throw expenseError;

            // 2. Create splits
            const amountPerPerson = data.amount / data.split_between.length;
            const splits = data.split_between.map(member_id => ({
                expense_id: newExpense.id,
                member_id,
                amount_owed: amountPerPerson,
            }));

            const { error: splitsError } = await supabase
                .from('splits')
                .insert(splits);

            if (splitsError) throw splitsError;

            setExpenses(prev => [newExpense, ...prev]);
            return newExpense;
        } catch (error) {
            console.error('Error adding expense:', error);
            throw error;
        }
    };

    // Update expense
    const updateExpense = async (id: string, data: Partial<AddExpenseData>) => {
        try {
            // 1. Update expense
            const updateData: any = {};
            if (data.description) updateData.description = data.description;
            if (data.amount) updateData.amount = data.amount;
            if (data.paid_by) updateData.paid_by = data.paid_by;

            const { error: expenseError } = await supabase
                .from('expenses')
                .update(updateData)
                .eq('id', id);

            if (expenseError) throw expenseError;

            // 2. Update splits if split_between changed
            if (data.split_between && data.amount) {
                // Delete old splits
                await supabase
                    .from('splits')
                    .delete()
                    .eq('expense_id', id);

                // Create new splits
                const amountPerPerson = data.amount / data.split_between.length;
                const splits = data.split_between.map(member_id => ({
                    expense_id: id,
                    member_id,
                    amount_owed: amountPerPerson,
                }));

                const { error: splitsError } = await supabase
                    .from('splits')
                    .insert(splits);

                if (splitsError) throw splitsError;
            }

            // Update local state
            setExpenses(prev =>
                prev.map(e => (e.id === id ? { ...e, ...updateData } : e))
            );
        } catch (error) {
            console.error('Error updating expense:', error);
            throw error;
        }
    };

    // Delete expense (soft delete)
    const deleteExpense = async (id: string) => {
        if (!user) throw new Error('User not authenticated');

        try {
            const { error } = await supabase
                .from('expenses')
                .update({
                    deleted_at: new Date().toISOString(),
                    deleted_by: user.id,
                })
                .eq('id', id);

            if (error) throw error;

            setExpenses(prev => prev.filter(e => e.id !== id));
        } catch (error) {
            console.error('Error deleting expense:', error);
            throw error;
        }
    };

    // Load expenses when project changes
    useEffect(() => {
        loadExpenses();
    }, [currentProject]);

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
