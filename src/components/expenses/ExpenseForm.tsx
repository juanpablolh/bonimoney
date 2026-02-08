import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
    Check,
    X,
    CaretDown,
    Spinner
} from '@phosphor-icons/react';
import { getMemberAvatarColor } from '../../utils/avatarColors';
import { AnimatePresence, motion } from 'framer-motion';
import { capitalizeName } from '../../utils/calculations';

interface Member {
    id: string;
    name: string;
    avatar_url?: string;
    user_id?: string; // ID of the authenticated user linked to this member
}

interface ExpenseFormProps {
    members: Member[];
    onSave: (data: any) => Promise<void>;
    onClose?: () => void;
    initialData?: any;
    currentUserId?: string; // ID of the authenticated user
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
    members,
    onSave,
    onClose,
    initialData,
    currentUserId
}) => {
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [displayAmount, setDisplayAmount] = useState(initialData?.amount ? new Intl.NumberFormat('es-CL').format(initialData.amount) : '');
    const [description, setDescription] = useState(initialData?.description || '');

    // Find the current user's member to set as default payer
    const currentUserMember = currentUserId
        ? members.find(m => m.user_id === currentUserId)
        : null;
    const [paidBy, setPaidBy] = useState(
        initialData?.paid_by || currentUserMember?.id || members[0]?.id || ''
    );
    const [isSelectingPayer, setIsSelectingPayer] = useState(false);
    const [splitWith, setSplitWith] = useState<string[]>(initialData?.split_details?.map((s: any) => s.member_id) || members.map(m => m.id));
    const [notes] = useState(initialData?.notes || '');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

    const [date] = useState<Date | undefined>(
        initialData?.date ? new Date(initialData.date) : new Date()
    );

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\./g, '');
        if (rawValue === '' || /^\d+$/.test(rawValue)) {
            setAmount(rawValue);
            setDisplayAmount(rawValue ? new Intl.NumberFormat('es-CL').format(parseInt(rawValue)) : '');
        }
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

    const toggleMember = (id: string) => {
        setSplitWith(prev =>
            prev.includes(id)
                ? prev.filter(m => m !== id)
                : [...prev, id]
        );
    };

    const handleSave = async () => {
        setStatus('loading');
        try {
            // Dismiss keyboard
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }

            await onSave({
                amount: parseFloat(amount),
                description,
                paid_by: paidBy,
                split_details: splitWith.map(id => ({ member_id: id })),
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
    const isAllSelected = members.length > 0 && splitWith.length === members.length;

    return (
        <div className="flex flex-col h-full bg-neutral-50 overflow-hidden">
            {/* Header Wrapper to avoid corner slivers */}
            <div className="bg-neutral-50 shrink-0 rounded-t-3xl overflow-hidden pt-4 border-b border-neutral-100">
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
            <div className="flex-1 overflow-y-auto bg-neutral-50 relative no-scrollbar min-h-[250px]">
                <div className="px-6 py-6 space-y-6">
                    {/* AMOUNT */}
                    <section className="space-y-3">
                        <label className="block text-sm font-semibold text-neutral-900">¿Cuánto fue?</label>
                        <div className="flex items-center gap-2">
                            <span style={{
                                color: 'var(--neutral-600)',
                                fontFamily: 'DM Sans',
                                fontSize: '2.5rem',
                                fontStyle: 'normal',
                                fontWeight: 400,
                                lineHeight: '100%',
                                letterSpacing: '0.0125rem'
                            }}>$</span>
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
                                className="border-none bg-transparent h-auto p-0 focus-visible:ring-0 placeholder:text-neutral-200 w-full"
                                style={{
                                    color: 'var(--neutral-600)',
                                    fontFamily: 'DM Sans',
                                    fontSize: '2.5rem',
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
                    <section className="space-y-3">
                        <label className="block text-sm font-semibold text-neutral-900">¿Qué compraste?</label>
                        <Input
                            placeholder="Cena para bonis"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="h-14 bg-neutral-50 border-neutral-200 rounded-xl text-base font-normal focus-visible:ring-0 focus-visible:border-neutral-300 placeholder:text-neutral-400 px-4"
                        />
                    </section>

                    {/* SPLIT */}
                    <section className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-semibold text-neutral-900">Dividir con</label>
                            <button
                                type="button"
                                onClick={() => setSplitWith(members.map(m => m.id))}
                                className={cn(
                                    "text-sm font-semibold px-4 h-10 min-h-0 rounded-lg transition-colors flex items-center justify-center",
                                    isAllSelected
                                        ? "bg-neutral-900 text-white hover:bg-neutral-800"
                                        : "text-neutral-600 bg-neutral-100 hover:bg-neutral-200"
                                )}
                            >
                                Todos
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {members.map((member) => {
                                const isSelected = splitWith.includes(member.id);
                                return (
                                    <button
                                        key={member.id}
                                        onClick={() => toggleMember(member.id)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-lg transition-all shadow-sm",
                                            isSelected
                                                ? "border-transparent"
                                                : "bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300"
                                        )}
                                        style={isSelected ? { backgroundColor: getMemberAvatarColor(member).bg, color: getMemberAvatarColor(member).text } : {}}
                                    >
                                        <Avatar className="h-6 w-6 shrink-0">
                                            <AvatarImage src={member.avatar_url} />
                                            <AvatarFallback
                                                className="text-[10px] font-bold"
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
                                        <span className="text-sm font-semibold">{capitalizeName(member.name)}</span>
                                        {isSelected && <Check size={14} weight="bold" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Payer Selector Button */}
                        <button
                            type="button"
                            onClick={() => setIsSelectingPayer(true)}
                            className="w-full bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-xl px-4 h-14 flex items-center justify-between transition-colors text-left"
                        >
                            <div className="flex items-center gap-1">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Pagado por</p>
                                    <p className="text-base font-semibold text-neutral-900">
                                        {capitalizeName(currentMember?.name) || 'Seleccionar...'}
                                    </p>
                                </div>
                            </div>
                            <CaretDown size={20} className="text-neutral-400" />
                        </button>
                    </section>
                </div>
            </div>

            {/* Fixed Footer - Outside scroll area */}
            <footer
                className="shrink-0 p-6 bg-neutral-50 border-t border-neutral-200"
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
            </footer>

            {/* Payer Picker Overlay */}
            {isSelectingPayer && (
                <div className="absolute inset-0 z-[70] flex flex-col bg-neutral-50 animate-in slide-in-from-bottom duration-300 rounded-t-3xl md:rounded-3xl overflow-hidden">
                    <header className="bg-neutral-50 shrink-0 pt-4 overflow-hidden border-b border-neutral-100">
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
                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Integrantes</p>

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
                                            className="text-base font-bold"
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
                                        <p className="text-base font-semibold truncate text-neutral-900">
                                            {capitalizeName(member.name) || 'Sin nombre'}
                                        </p>
                                    </div>
                                    {paidBy === member.id && <Check size={20} weight="bold" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
