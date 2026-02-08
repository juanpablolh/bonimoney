import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
    Check,
    X,
    CaretDown,
    Spinner,
    Percent,
    CurrencyDollar
} from '@phosphor-icons/react';
import { getMemberAvatarColor } from '../../utils/avatarColors';
import { AnimatePresence, motion } from 'framer-motion';
import { capitalizeName, formatAmountInput, getCurrencySymbol, parseFormattedAmount } from '../../utils/calculations';
import { Currency } from '@/types';

/**
 * Internal interface representing a project member
 */
interface Member {
    id: string;
    name: string;
    avatar_url?: string;
    user_id?: string; // ID of the authenticated user linked to this member
}

/**
 * Props for the ExpenseForm component
 */
interface ExpenseFormProps {
    /** List of members available to split the expense with */
    members: Member[];
    /** Callback function to save the expense data */
    onSave: (data: any) => Promise<void>;
    /** Optional callback to close the form/sheet */
    onClose?: () => void;
    /** Initial data for editing an existing expense */
    initialData?: any;
    /** ID of the currently authenticated user */
    currentUserId?: string;
    /** Project currency */
    currency: Currency;
}

/**
 * ExpenseForm Component
 * 
 * A comprehensive form for creating and editing expenses.
 * Supports advanced split modes: Equal, Percentage, and Exact Amount.
 */
export const ExpenseForm: React.FC<ExpenseFormProps> = ({
    members,
    onSave,
    onClose,
    initialData,
    currentUserId,
    currency
}) => {
    // --- STATE MANAGEMENT ---
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [displayAmount, setDisplayAmount] = useState(initialData?.amount ? formatAmountInput(initialData.amount.toString(), currency) : '');
    const [description, setDescription] = useState(initialData?.description || '');

    // Find the current user's member to set as default payer
    const currentUserMember = currentUserId
        ? members.find(m => m.user_id === currentUserId)
        : null;

    // Who paid for the expense
    const [paidBy, setPaidBy] = useState(
        initialData?.paid_by || currentUserMember?.id || members[0]?.id || ''
    );
    const [isSelectingPayer, setIsSelectingPayer] = useState(false);

    // List of member IDs to split the expense with
    const [splitWith, setSplitWith] = useState<string[]>(initialData?.split_details?.map((s: any) => s.member_id) || members.map(m => m.id));

    // How the expense is split: 'equal', 'percentage', or 'amount' (exact)
    const [splitMode, setSplitMode] = useState<'equal' | 'percentage' | 'amount'>('equal');

    // Custom values for percentage or amount splits (Key: member.id, Value: user input string)
    const [splitValues, setSplitValues] = useState<Record<string, string>>({});

    // Clear split values when mode changes between percentage and amount
    useEffect(() => {
        setSplitValues({});
    }, [splitMode]);

    const [notes] = useState(initialData?.notes || '');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

    const [date] = useState<Date | undefined>(
        initialData?.date ? new Date(initialData.date) : new Date()
    );

    /**
     * Handles amount input changes, applying currency formatting
     */
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const formatted = formatAmountInput(value, currency);
        const rawAmount = parseFormattedAmount(formatted, currency);

        setAmount(rawAmount.toString());
        setDisplayAmount(formatted);
    };

    const amountRef = useRef<HTMLInputElement>(null);

    // Sync splitWith when members change (e.g., new member added)
    useEffect(() => {
        // Only sync if not editing (initialData) - for new expenses, include all members
        if (!initialData) {
            const memberIds = members.map(m => m.id);
            setSplitWith(memberIds);
        }
    }, [members, initialData]);

    // Auto-focus amount on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            if (amountRef.current) {
                amountRef.current.focus();
            }
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    const progress = {
        amountFilled: parseFloat(amount) > 0,
        conceptFilled: description.length >= 2,
        splitSelected: splitWith.length > 0
    };

    /**
     * Toggles a member's inclusion in the split
     */
    const toggleMember = (id: string) => {
        setSplitWith(prev => {
            const isSelected = prev.includes(id);
            if (isSelected) {
                const newSplit = prev.filter(m => m !== id);
                // Also clear value if removing
                const newValues = { ...splitValues };
                delete newValues[id];
                setSplitValues(newValues);
                return newSplit;
            } else {
                return [...prev, id];
            }
        });
    };

    /**
     * Updates custom split values (percentage or amount) for a specific member
     */
    const handleSplitValueChange = (memberId: string, value: string) => {
        let finalValue = value;

        if (splitMode === 'amount') {
            finalValue = formatAmountInput(value, currency);
        } else {
            // Allow only numbers and one decimal point for percentage
            if (!/^\d*\.?\d*$/.test(value)) return;
        }

        setSplitValues(prev => ({
            ...prev,
            [memberId]: finalValue
        }));

        // Auto-select member if they type a value
        const numericValue = parseFormattedAmount(finalValue, currency);
        if (finalValue && numericValue > 0 && !splitWith.includes(memberId)) {
            setSplitWith(prev => [...prev, memberId]);
        }
    };

    const getSplitPlaceholder = () => {
        return '0';
    };

    /**
     * Validates and saves the expense, constructing the correct split_details payload
     * based on the selected splitMode.
     */
    const handleSave = async () => {
        setStatus('loading');
        try {
            // Dismiss keyboard
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }

            let splitDetails: any[] = [];

            // Construct payload based on mode
            if (splitMode === 'equal') {
                splitDetails = splitWith.map(id => ({ member_id: id }));
            } else if (splitMode === 'percentage') {
                splitDetails = splitWith.map(id => ({
                    member_id: id,
                    percentage: parseFloat(splitValues[id] || '0')
                }));
            } else if (splitMode === 'amount') {
                splitDetails = splitWith.map(id => {
                    const val = splitValues[id] || '0';
                    const numericVal = parseFormattedAmount(val, currency);
                    return {
                        member_id: id,
                        amount: numericVal
                    };
                });
            }

            await onSave({
                amount: parseFloat(amount),
                description,
                paid_by: paidBy,
                split_details: splitDetails,
                // API expects 'exact' for amount splits
                split_method: splitMode === 'amount' ? 'exact' : splitMode,
                notes,
                date: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            });

            setStatus('success');

            // Close after animation
            setTimeout(() => {
                onClose?.();
            }, 1500);
        } catch (error) {
            console.error(error);
            setStatus('idle');
        }
    };

    const currentMember = members.find(m => m.id === paidBy);

    return (
        <div className="flex flex-col h-full bg-neutral-50 overflow-hidden">
            {/* Header Wrapper to avoid corner slivers */}
            <div className="bg-stone-100 shrink-0 rounded-t-3xl overflow-hidden pt-4 border-b border-neutral-100">
                {/* Drawer Handle */}
                <div className="mx-auto h-1 w-[100px] rounded-full bg-neutral-200 mb-4" />
                <header className="px-6 pb-5 flex items-center justify-between">
                    <h2 className="font-serif text-2xl font-medium text-neutral-900 tracking-[-1px] leading-tight">
                        {initialData ? 'Editar gasto' : 'Nuevo gasto'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 min-w-12 hover:bg-neutral-200 rounded-full transition-colors text-neutral-900 flex flex-col justify-center items-center"
                    >
                        <X size={24} weight="regular" />
                    </button>
                </header>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto bg-stone-100 relative no-scrollbar min-h-[250px]">
                <div className="px-6 py-6 space-y-6">
                    {/* AMOUNT */}
                    <section className="space-y-3">
                        <label className="block text-sm font-medium text-neutral-500">¿Cuánto fue?</label>
                        <div className="flex items-center gap-2">
                            <span style={{
                                color: amount ? '#262626' : '#b0b0b0',
                                fontFamily: 'DM Sans',
                                fontSize: '2rem',
                                fontStyle: 'normal',
                                fontWeight: 400,
                                lineHeight: '100%',
                                letterSpacing: '0.0125rem'
                            }}>{getCurrencySymbol(currency)}</span>
                            <style>{`
                                input[type=number]::-webkit-inner-spin-button, 
                                input[type=number]::-webkit-outer-spin-button { 
                                    -webkit-appearance: none; 
                                    margin: 0; 
                                }
                                input[type=number] {
                                    -moz-appearance: textfield;
                                }
                            `}</style>
                            <Input
                                ref={amountRef}
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                value={displayAmount}
                                onChange={handleAmountChange}
                                onWheel={(e) => e.currentTarget.blur()}
                                className="border-none bg-transparent h-auto p-0 focus-visible:ring-0 placeholder:text-neutral-200 w-full text-neutral-800"
                                style={{
                                    color: '#262626', // neutral-800
                                    fontFamily: 'DM Sans',
                                    fontSize: '2rem',
                                    fontStyle: 'normal',
                                    fontWeight: 400,
                                    lineHeight: '100%',
                                    letterSpacing: '0.0125rem'
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        e.currentTarget.blur();
                                    }
                                }}
                                enterKeyHint="done"
                            />
                        </div>
                    </section>

                    {/* CONCEPT */}
                    <section className="space-y-4 mb-6">
                        <label className="text-sm font-medium text-neutral-500 tracking-normal">¿Qué compraste?</label>
                        <input
                            placeholder="Ej. Cena sushi"
                            value={description}
                            onChange={(e) => {
                                const val = e.target.value;
                                const sentenceCaseVal = val.charAt(0).toUpperCase() + val.slice(1);
                                setDescription(sentenceCaseVal);
                            }}
                            className={cn(
                                "w-full text-2xl tracking-tight font-sans text-neutral-900 placeholder:text-neutral-300 bg-transparent border-b-1 transition-colors pb-2 pt-4 focus:outline-none",
                                description.trim()
                                    ? "border-emerald-500"
                                    : "border-neutral-100 focus:border-neutral-900"
                            )}
                        />
                    </section>

                    {/* SPLIT */}
                    <section>
                        <div className="space-y-4">
                            {/* Split Mode Selector */}
                            <div className="flex bg-stone-200/80 p-2 rounded-lg border border-stone-300">
                                {(['equal', 'percentage', 'amount'] as const).map((mode) => (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setSplitMode(mode)}
                                        className={cn(
                                            "flex-1 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-1",
                                            splitMode === mode
                                                ? "bg-white text-neutral-900"
                                                : "text-neutral-500 hover:text-neutral-700"
                                        )}
                                    >
                                        {mode === 'equal' && <span>Equitativo</span>}
                                        {mode === 'percentage' && (
                                            <>
                                                <Percent size={14} weight="bold" />
                                                <span>Porcentaje</span>
                                            </>
                                        )}
                                        {mode === 'amount' && (
                                            <>
                                                <CurrencyDollar size={14} weight="bold" />
                                                <span>Monto</span>
                                            </>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="flex flex-col gap-2 w-full">
                                {members.map((member) => {
                                    const isSelected = splitWith.includes(member.id);
                                    return (
                                        <button
                                            key={member.id}
                                            onClick={() => toggleMember(member.id)}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-3 rounded-lg transition-all w-full justify-between h-14",
                                                isSelected
                                                    ? "border-transparent"
                                                    : "bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300"
                                            )}
                                            style={isSelected ? { backgroundColor: getMemberAvatarColor(member).bg, color: getMemberAvatarColor(member).text } : {}}
                                        >
                                            <div className="flex items-center gap-2"> {/* Wrapper for avatar + name */}
                                                <Avatar className="h-6 w-6 shrink-0">
                                                    <AvatarImage src={member.avatar_url} />
                                                    <AvatarFallback
                                                        className="text-xs font-me"
                                                        style={(() => {
                                                            const colors = getMemberAvatarColor(member);
                                                            return {
                                                                backgroundColor: isSelected ? colors.text : colors.bg,
                                                                color: isSelected ? colors.bg : colors.text
                                                            };
                                                        })()}
                                                    >
                                                        {(member.name || '?').charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm font-medium">{member.name}</span>
                                            </div>

                                            {/* Right Side Logic */}
                                            {isSelected && (
                                                splitMode === 'equal' ? (
                                                    <Check size={14} weight="bold" className="shrink-0" />
                                                ) : (
                                                    <div className="flex items-center justify-between gap-1 bg-stone-100 px-2 rounded-md border border-neutral-100 w-24 h-11" onClick={(e) => e.stopPropagation()}>
                                                        {splitMode === 'amount' && <span className="text-neutral-800 text-xs shrink-0">{getCurrencySymbol(currency)}</span>}
                                                        <input
                                                            type="text"
                                                            inputMode="decimal"
                                                            value={splitValues[member.id] || ''}
                                                            onChange={(e) => handleSplitValueChange(member.id, e.target.value)}
                                                            placeholder={getSplitPlaceholder()}
                                                            className="flex-1 min-w-0 text-right bg-transparent border-none p-0 text-sm font-medium placeholder:text-neutral-500 focus:ring-0 outline-none text-neutral-800"
                                                        />
                                                        {splitMode === 'percentage' && <span className="text-neutral-600 text-xs shrink-0">%</span>}
                                                    </div>
                                                )
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Payer Selector Button */}
                            <button
                                type="button"
                                onClick={() => setIsSelectingPayer(true)}
                                className="w-full bg-white hover:bg-neutral-200 border border-neutral-200 rounded-xl px-4 h-16 flex items-center justify-between transition-colors text-left"
                            >
                                <div className="flex items-center">
                                    <div>
                                        <p className="text-sm font-medium tracking-tight text-neutral-400">Pagado por</p>
                                        <p className="text-base font-medium text-neutral-900">
                                            {capitalizeName(currentMember?.name) || 'Seleccionar...'}
                                        </p>
                                    </div>
                                </div>
                                <CaretDown size={20} className="text-neutral-400" />
                            </button>
                        </div>
                    </section>
                </div>
            </div >

            {/* Fixed Footer - Outside scroll area */}
            < footer
                className="shrink-0 p-6 bg-stone-100 border-t border-neutral-200"
                style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            >
                <Button
                    onClick={handleSave}
                    disabled={!progress.amountFilled || status === 'loading' || status === 'success'}
                    className={cn(
                        "w-full h-14 rounded-xl text-base font-semibold transition-all duration-300 relative overflow-hidden",
                        status === 'success'
                            ? "bg-green-600 hover:bg-green-700 w-full"
                            : (progress.amountFilled
                                ? "bg-neutral-900 text-white hover:bg-neutral-800"
                                : "bg-neutral-200 text-neutral-400 cursor-not-allowed")
                    )}
                >
                    <AnimatePresence mode="wait">
                        {status === 'success' ? (
                            <motion.div
                                key="success"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                className="flex items-center gap-2"
                            >
                                <Check size={20} weight="bold" />
                                <span>¡Guardado!</span>
                            </motion.div>
                        ) : status === 'loading' ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2"
                            >
                                <Spinner size={20} className="animate-spin" />
                                <span>Guardando...</span>
                            </motion.div>
                        ) : (
                            <motion.span
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {initialData ? 'Actualizar gasto' : 'Guardar gasto'}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Button>
            </footer >

            {/* Payer Picker Overlay */}
            {
                isSelectingPayer && (
                    <div className="absolute inset-0 z-[70] flex flex-col bg-stone-100 animate-in slide-in-from-bottom duration-300 rounded-t-3xl md:rounded-3xl overflow-hidden">
                        <header className="bg-stone-100 shrink-0 pt-4 overflow-hidden border-b border-neutral-100">
                            {/* Drawer Handle */}
                            <div className="mx-auto h-1 w-[100px] rounded-full bg-neutral-200 mb-4 md:hidden" />
                            <div className="px-6 pb-5 flex items-center justify-between">
                                <h2 className="font-serif text-2xl font-medium text-neutral-900 tracking-[-1px] leading-tight">
                                    ¿Quién pagó?
                                </h2>
                                <button
                                    onClick={() => setIsSelectingPayer(false)}
                                    className="p-1 min-w-12 hover:bg-neutral-200 rounded-full transition-colors text-neutral-900 flex flex-col justify-center items-center"
                                >
                                    <X size={24} weight="regular" />
                                </button>
                            </div>
                        </header>
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                            <p className="text-base font-medium text-neutral-400 tracking-tight">Integrantes</p>

                            <div className="bg-white rounded-[1.5rem] p-2 space-y-0.5 border border-neutral-100 mb-8">
                                {members.map((member) => (
                                    <button
                                        key={member.id}
                                        type="button"
                                        onClick={() => {
                                            setPaidBy(member.id);
                                            setIsSelectingPayer(false);
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-4 p-2 transition-all text-left rounded-[1rem]",
                                            paidBy === member.id ? "bg-neutral-100 text-neutral-900" : "hover:bg-neutral-50"
                                        )}
                                    >
                                        <Avatar className="w-12 h-12 shrink-0">
                                            <AvatarFallback
                                                className="text-base font-medium"
                                                style={(() => {
                                                    const colors = getMemberAvatarColor(member);
                                                    return {
                                                        backgroundColor: colors.bg,
                                                        color: colors.text
                                                    };
                                                })()}
                                            >
                                                {(member.name || '?').charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-medium truncate text-neutral-900">
                                                {capitalizeName(member.name) || 'Sin nombre'}
                                            </p>
                                        </div>
                                        {paidBy === member.id && <Check size={20} weight="bold" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
