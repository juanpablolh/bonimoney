import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
    Check,
    X,
    CaretDown
} from '@phosphor-icons/react';

interface Member {
    id: string;
    name: string;
    avatar_url?: string;
}

interface ExpenseFormProps {
    members: Member[];
    onSave: (data: any) => void;
    onClose?: () => void;
    initialData?: any;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
    members,
    onSave,
    onClose,
    initialData
}) => {
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [displayAmount, setDisplayAmount] = useState(initialData?.amount ? new Intl.NumberFormat('es-CL').format(initialData.amount) : '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [paidBy, setPaidBy] = useState(initialData?.paid_by || members[0]?.id || '');
    const [isSelectingPayer, setIsSelectingPayer] = useState(false);
    const [splitWith, setSplitWith] = useState<string[]>(initialData?.split_details?.map((s: any) => s.member_id) || members.map(m => m.id));
    const [notes] = useState(initialData?.notes || '');

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
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-focus amount on mount
    useEffect(() => {
        if (amountRef.current) {
            amountRef.current.focus();
        }
    }, []);

    // Handle keyboard focus - scroll input into view
    useEffect(() => {
        const handleFocus = (e: FocusEvent) => {
            const target = e.target;
            if (target && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
                setTimeout(() => {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });
                }, 300); // Wait for keyboard animation
            }
        };

        document.addEventListener('focusin', handleFocus);
        return () => document.removeEventListener('focusin', handleFocus);
    }, []);

    const progress = {
        amountFilled: parseFloat(amount) > 0,
        conceptFilled: description.length >= 2,
        splitSelected: splitWith.length > 0
    };

    // Auto-scroll when amount is filled and newer sections appear
    useEffect(() => {
        if (progress.amountFilled && scrollRef.current) {
            setTimeout(() => {
                scrollRef.current?.scrollTo({
                    top: scrollRef.current.scrollHeight,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }, [progress.amountFilled]);

    const toggleMember = (id: string) => {
        setSplitWith(prev =>
            prev.includes(id)
                ? prev.filter(m => m !== id)
                : [...prev, id]
        );
    };

    const currentMember = members.find(m => m.id === paidBy);

    return (
        <div className="flex flex-col h-full bg-stone-50 md:rounded-3xl shadow-2xl ring-1 ring-black/5">
            {/* Header Wrapper to avoid corner slivers */}
            <div className="bg-[#44403C] md:rounded-t-3xl shrink-0">
                <header className="px-6 py-5 flex items-center justify-between">
                    <h2 className="font-serif text-2xl font-medium text-[#FAFAF9] tracking-[-1px] leading-tight">
                        Nuevo gasto
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 min-w-12 hover:bg-white/10 rounded-full transition-colors text-[#FAFAF9] flex flex-col justify-center items-center"
                    >
                        <X size={24} weight="regular" />
                    </button>
                </header>
            </div>

            {/* Scrollable Content Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto bg-stone-50 relative">
                <div className="px-6 py-6 space-y-6 pb-24">
                    {/* AMOUNT */}
                    <section className="space-y-3">
                        <label className="block text-sm font-semibold text-stone-900">¿Cuánto fue?</label>
                        <div className="flex items-center gap-2">
                            <span style={{
                                color: '#57534E',
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
                                className="border-none bg-transparent h-auto p-0 focus-visible:ring-0 placeholder:text-stone-200 w-full"
                                style={{
                                    color: '#57534E',
                                    fontFamily: 'DM Sans',
                                    fontSize: '2.5rem',
                                    fontStyle: 'normal',
                                    fontWeight: 400,
                                    lineHeight: '100%',
                                    letterSpacing: '0.0125rem'
                                }}
                            />
                        </div>
                    </section>

                    {/* CONCEPT */}
                    <AnimatePresence>
                        {progress.amountFilled && (
                            <motion.section
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-3"
                            >
                                <label className="block text-sm font-semibold text-stone-900">¿Qué compraste?</label>
                                <Input
                                    placeholder="Cena para bonis"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="h-14 bg-stone-50 border-stone-200 rounded-xl text-base font-normal focus-visible:ring-0 focus-visible:border-stone-300 placeholder:text-stone-400 px-4"
                                />
                            </motion.section>
                        )}
                    </AnimatePresence>

                    {/* SPLIT */}
                    <AnimatePresence>
                        {progress.amountFilled && (
                            <motion.section
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-stone-900">Dividir con</label>
                                    <button
                                        onClick={() => setSplitWith(members.map(m => m.id))}
                                        className="text-sm font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors"
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
                                                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                                                    isSelected
                                                        ? "bg-stone-900 text-white"
                                                        : "bg-white text-stone-600 border border-stone-200 hover:border-stone-300"
                                                )}
                                            >
                                                <Avatar className="h-6 w-6 shrink-0">
                                                    <AvatarImage src={member.avatar_url} />
                                                    <AvatarFallback className={isSelected ? "bg-white/10 text-white text-xs" : "bg-stone-100 text-xs"}>
                                                        {(member.name || '?').charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm font-semibold">{((member.name || 'Alguien').split(' ')[0].charAt(0).toUpperCase() + (member.name || 'Alguien').split(' ')[0].slice(1).toLowerCase())}</span>
                                                {isSelected && <Check size={14} weight="bold" />}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Payer Selector */}
                                <div
                                    onClick={() => setIsSelectingPayer(!isSelectingPayer)}
                                    className="bg-stone-50 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-colors hover:bg-stone-100 border border-stone-200"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-semibold text-sm shrink-0">
                                            {(currentMember?.name || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Pagado por</p>
                                            <p className="text-base font-semibold text-stone-900">
                                                {currentMember?.name
                                                    ? currentMember.name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
                                                    : 'Seleccionar...'}
                                            </p>
                                        </div>
                                    </div>
                                    <CaretDown size={20} weight="regular" className={cn("text-stone-400 transition-transform", isSelectingPayer && "rotate-180")} />
                                </div>

                                {/* Payer Dropdown */}
                                <AnimatePresence>
                                    {isSelectingPayer && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-20"
                                                onClick={() => setIsSelectingPayer(false)}
                                            />
                                            <motion.div
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-white rounded-xl border border-stone-200 mt-2 z-30 relative divide-y divide-stone-100"
                                            >
                                                {members.map((member) => (
                                                    <button
                                                        key={member.id}
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPaidBy(member.id);
                                                            setIsSelectingPayer(false);
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center gap-3 p-3 hover:bg-stone-50 transition-colors text-left",
                                                            paidBy === member.id && "bg-stone-50"
                                                        )}
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-semibold text-xs shrink-0">
                                                            {(member.name || '?').charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className={cn("text-sm font-semibold flex-1", paidBy === member.id ? "text-stone-900" : "text-stone-500")}>
                                                            {member.name ? (member.name.charAt(0).toUpperCase() + member.name.slice(1).toLowerCase()) : ''}
                                                        </span>
                                                        {paidBy === member.id && <Check size={16} weight="bold" className="text-stone-900" />}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </motion.section>
                        )}
                    </AnimatePresence>
                </div>

                {/* Sticky Footer */}
                <footer className="sticky bottom-0 left-0 right-0 p-6 bg-stone-50/95 backdrop-blur-sm border-t border-stone-200">
                    <Button
                        onClick={() => onSave({
                            amount: parseFloat(amount),
                            description,
                            paid_by: paidBy,
                            split_details: splitWith.map(id => ({ member_id: id })),
                            notes,
                            date: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                        })}
                        disabled={!progress.amountFilled}
                        className={cn(
                            "w-full h-14 rounded-xl text-base font-semibold transition-colors",
                            progress.amountFilled
                                ? "bg-stone-900 text-white hover:bg-stone-800"
                                : "bg-stone-200 text-stone-400 cursor-not-allowed"
                        )}
                    >
                        Guardar gasto
                    </Button>
                </footer>
            </div>
        </div>
    );
};
