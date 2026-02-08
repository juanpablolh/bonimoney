import { ResponsiveModal } from '../ui-custom/ResponsiveModal';
import { ExpenseForm } from '../expenses/ExpenseForm';
import { Expense } from '@/types';
import { adaptMember } from '@/utils/dataAdapters'; // Ensure this utility is available or reuse the one in ProjectLayout
import { useMembers } from '@/contexts/MemberContext';
import { useAuth } from '@/contexts/AuthContext';
import { useExpenses } from '@/contexts/ExpenseContext';

interface ExpenseSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    expenseToEdit?: Expense | null; // Allow null
}

export function ExpenseSheet({
    open,
    onOpenChange,
    expenseToEdit
}: ExpenseSheetProps) {
    const { members } = useMembers();
    const { user } = useAuth();
    const { addExpense, updateExpense } = useExpenses();

    const handleSave = async (data: any) => {
        if (expenseToEdit) {
            await updateExpense(expenseToEdit.id, data);
        } else {
            await addExpense(data);
        }
        onOpenChange(false);
    };

    return (
        <ResponsiveModal
            open={open}
            onOpenChange={onOpenChange}
            title={expenseToEdit ? "Editar gasto" : "Nuevo gasto"}
            hideHeader={true}
            fixedHeight={true}
            showCloseButton={false}
        >
            <div className="h-full bg-stone-100 flex flex-col rounded-t-3xl overflow-hidden">
                <ExpenseForm
                    initialData={expenseToEdit ? {
                        ...expenseToEdit,
                        // Ensure legacy structure compatibility if needed
                        split_details: (expenseToEdit as any).splits || [],
                        notes: (expenseToEdit as any).metadata?.notes
                    } : undefined}
                    members={members.map(adaptMember)}
                    currentUserId={user?.id}
                    onClose={() => onOpenChange(false)}
                    onSave={handleSave}
                />
            </div>
        </ResponsiveModal>
    );
}
