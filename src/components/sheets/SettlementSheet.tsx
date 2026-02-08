import { useState, useContext, useEffect } from 'react';
import { ArrowRight, X, WarningCircle } from '@phosphor-icons/react';
import { Transaction } from '@/types';
import { ResponsiveModal, KeyboardViewportContext } from '@/components/ui-custom/ResponsiveModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { capitalizeName, formatCurrency } from '@/utils/calculations';
import { getMemberAvatarColor } from '@/utils/avatarColors';
import { cn } from '@/lib/utils';
import type { Member } from '@/types';

interface SettlementSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transaction: Transaction;
    members: Member[];
    onConfirm: (amount: number, notes?: string) => Promise<void>;
}

export function SettlementSheet({
    open,
    onOpenChange,
    transaction,
    members,
    onConfirm
}: SettlementSheetProps) {
    const { keyboardHeight } = useContext(KeyboardViewportContext);
    const [amount, setAmount] = useState(transaction.amount.toString());
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedQuickOption, setSelectedQuickOption] = useState<'full' | 'half' | null>('full');

    const totalDebt = transaction.amount;
    const amountNum = parseFloat(amount) || 0;

    useEffect(() => {
        if (open) {
            setAmount(transaction.amount.toString());
            setNotes('');
            setError('');
            setSelectedQuickOption('full');
        }
    }, [open, transaction.amount]);

    const handleAmountChange = (value: string) => {
        setAmount(value);
        setError('');

        // Clear quick option selection when manually typing
        const num = parseFloat(value);
        if (num === totalDebt) {
            setSelectedQuickOption('full');
        } else if (num === totalDebt / 2) {
            setSelectedQuickOption('half');
        } else {
            setSelectedQuickOption(null);
        }

        if (num > totalDebt) {
            setError(`El monto excede tu deuda de ${formatCurrency(totalDebt, transaction.currency)}`);
        } else if (num <= 0) {
            setError('El monto debe ser mayor a 0');
        }
    };

    const handleConfirm = async () => {
        if (amountNum <= 0 || amountNum > totalDebt) return;

        setLoading(true);
        try {
            await onConfirm(amountNum, notes.trim() || undefined);
            onOpenChange(false);
            // Reset form
            setAmount(transaction.amount.toString());
            setNotes('');
            setError('');
        } catch {
            setError('Error al registrar el pago. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ResponsiveModal
            open={open}
            onOpenChange={onOpenChange}
            title=""
            hideHeader={true}
            fixedHeight={true}
            showCloseButton={false}
        >
            <div className="flex flex-col h-full bg-neutral-50 rounded-t-3xl overflow-hidden">
                {/* Header Wrapper - Dark header like ExpenseForm */}
                <div className="bg-neutral-50 shrink-0 rounded-t-3xl overflow-hidden pt-4 border-b border-neutral-100">
                    {/* Drawer Handle */}
                    <div className="mx-auto h-1 w-[100px] rounded-full bg-neutral-200 mb-4" />
                    <header className="px-6 pb-5 flex items-center justify-between">
                        <h2 className="font-serif text-2xl font-medium text-neutral-900 tracking-[-1px] leading-tight">
                            Saldar Deuda
                        </h2>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="p-1 min-w-12 hover:bg-neutral-200 rounded-full transition-colors text-neutral-900 flex flex-col justify-center items-center"
                        >
                            <X size={24} weight="regular" />
                        </button>
                    </header>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto bg-neutral-50 relative no-scrollbar">
                    <div className="px-6 py-6 space-y-6">
                        {/* Info visual - De/A */}
                        <section className="bg-neutral-100 rounded-xl p-4 border border-neutral-200">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    {(() => {
                                        const fromMember = members.find(m => m.id === transaction.from);
                                        const colors = fromMember ? getMemberAvatarColor(fromMember) : { bg: 'var(--neutral-200)', text: 'var(--neutral-900)' };
                                        return (
                                            <Avatar className="w-10 h-10">
                                                <AvatarFallback
                                                    className="text-sm font-bold"
                                                    style={{ backgroundColor: colors.bg, color: colors.text }}
                                                >
                                                    {transaction.fromName.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        );
                                    })()}
                                    <div>
                                        <p className="text-xs text-neutral-500">De</p>
                                        <p className="font-semibold text-neutral-900">
                                            {capitalizeName(transaction.fromName)}
                                        </p>
                                    </div>
                                </div>

                                <ArrowRight size={20} className="text-neutral-400 shrink-0" />

                                <div className="flex items-center gap-3">
                                    {(() => {
                                        const toMember = members.find(m => m.id === transaction.to);
                                        const colors = toMember ? getMemberAvatarColor(toMember) : { bg: 'var(--neutral-200)', text: 'var(--neutral-900)' };
                                        return (
                                            <Avatar className="w-10 h-10">
                                                <AvatarFallback
                                                    className="text-sm font-bold"
                                                    style={{ backgroundColor: colors.bg, color: colors.text }}
                                                >
                                                    {transaction.toName.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        );
                                    })()}
                                    <div>
                                        <p className="text-xs text-neutral-500">A</p>
                                        <p className="font-semibold text-neutral-900">
                                            {capitalizeName(transaction.toName)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Deuda total */}
                        <section className="space-y-3">
                            <label className="block text-sm font-semibold text-neutral-900">Deuda total</label>
                            <p className="text-2xl font-bold text-neutral-900">
                                {formatCurrency(totalDebt, transaction.currency)}
                            </p>
                        </section>

                        {/* Input monto */}
                        <section className="space-y-3">
                            <label className="block text-sm font-semibold text-neutral-900">
                                Monto a pagar
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => handleAmountChange(e.target.value)}
                                    className="flex-1 h-14 bg-neutral-50 border-neutral-200 rounded-xl text-base font-normal focus-visible:ring-0 focus-visible:border-neutral-300 px-4"
                                    placeholder="0"
                                />
                                <span className="flex items-center text-neutral-500 font-medium">
                                    {transaction.currency}
                                </span>
                            </div>
                            {error && (
                                <p className="text-sm text-rose-600 flex items-center gap-2">
                                    <WarningCircle size={16} weight="regular" />
                                    {error}
                                </p>
                            )}

                            {/* Botones rápidos */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        handleAmountChange(totalDebt.toString());
                                        setSelectedQuickOption('full');
                                    }}
                                    className={cn(
                                        "px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors",
                                        selectedQuickOption === 'full'
                                            ? "bg-neutral-900 text-white"
                                            : "text-neutral-600 bg-neutral-100 hover:bg-neutral-200"
                                    )}
                                >
                                    Pagar todo
                                </button>
                                <button
                                    onClick={() => {
                                        handleAmountChange((totalDebt / 2).toString());
                                        setSelectedQuickOption('half');
                                    }}
                                    className={cn(
                                        "px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors",
                                        selectedQuickOption === 'half'
                                            ? "bg-neutral-900 text-white"
                                            : "text-neutral-600 bg-neutral-100 hover:bg-neutral-200"
                                    )}
                                >
                                    Pago parcial (50%)
                                </button>
                            </div>
                        </section>

                        {/* Notas (opcional) */}
                        <section className="space-y-3">
                            <label className="block text-sm font-semibold text-neutral-900">
                                Notas (opcional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ej: Pago por cena del viernes"
                                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-0 focus:border-neutral-300 resize-none bg-neutral-50 text-base font-normal placeholder:text-neutral-400"
                                rows={3}
                            />
                        </section>
                    </div>
                </div>

                {/* Fixed Footer */}
                <footer
                    className="shrink-0 p-6 bg-neutral-50 border-t border-neutral-200 transition-[padding] duration-200"
                    style={{ paddingBottom: keyboardHeight > 0 ? `${keyboardHeight + 24}px` : 'max(1.5rem, env(safe-area-inset-bottom))' }}
                >
                    <Button
                        onClick={handleConfirm}
                        disabled={loading || !!error || amountNum <= 0}
                        className={cn(
                            "w-full h-14 rounded-xl text-base font-semibold transition-colors",
                            loading || !!error || amountNum <= 0
                                ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                                : "bg-neutral-900 text-white hover:bg-neutral-800"
                        )}
                    >
                        {loading ? 'Registrando...' : 'Confirmar pago'}
                    </Button>
                </footer>
            </div>
        </ResponsiveModal>
    );
}
