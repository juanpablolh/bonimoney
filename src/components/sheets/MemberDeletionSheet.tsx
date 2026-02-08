import { useState, useContext } from 'react';
import {
    Trash,
    ArrowsLeftRight,
    X
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Member } from '../../types';
import {
    ResponsiveModal,
    KeyboardViewportContext
} from '@/components/ui-custom/ResponsiveModal';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from '@/utils/calculations';

interface MemberDeletionSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    member: Member | null;
    otherMembers: Member[];
    onResolve: (type: 'reassign' | 'purge', targetMemberId?: string) => Promise<void>;
    activitySummary?: {
        totalPaid: number;
        totalOwed: number;
        currency: string;
    };
}

export function MemberDeletionSheet({
    open,
    onOpenChange,
    member,
    otherMembers,
    onResolve,
    activitySummary
}: MemberDeletionSheetProps) {
    const { keyboardHeight } = useContext(KeyboardViewportContext);
    const [resolutionType, setResolutionType] = useState<'reassign' | 'purge'>('reassign');
    const [targetMemberId, setTargetMemberId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirm = async () => {
        if (resolutionType === 'reassign' && !targetMemberId) return;

        setIsSubmitting(true);
        try {
            await onResolve(resolutionType, targetMemberId || undefined);
            onOpenChange(false);
        } catch (error) {
            console.error('Error resolving deletion:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!member) return null;

    return (
        <ResponsiveModal
            open={open}
            onOpenChange={onOpenChange}
            title="Actividad pendiente"
            hideHeader={true}
            fixedHeight={true}
            showCloseButton={false}
        >
            <div className="flex flex-col h-full bg-stone-100 rounded-t-[2rem] sm:rounded-none overflow-hidden">
                {/* Header - Styled like standard app sheets */}
                <div className="bg-stone-100 shrink-0 pt-4 border-b border-neutral-100 tracking-tighter">
                    {/* Drawer Handle (Mobile Only) */}
                    <div className="sm:hidden mx-auto h-1.5 w-12 rounded-full bg-neutral-200 mb-4" />

                    <header className="px-6 pb-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h2 className="font-serif text-2xl font-medium text-neutral-900 tracking-tight leading-tight">
                                Actividad pendiente
                            </h2>
                        </div>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="p-2 hover:bg-neutral-200 rounded-full transition-colors text-neutral-500"
                        >
                            <X size={20} weight="bold" />
                        </button>
                    </header>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <div className="p-6 space-y-8">
                        <p className="text-neutral-500 font-medium text-base leading-relaxed">
                            <span className="text-neutral-900 font-bold">{member.name}</span> tiene gastos o deudas registradas. ¿Cómo quieres resolver su actividad antes de eliminarlo?
                        </p>

                        {/* Activity Summary Card */}
                        {activitySummary && (
                            <div className="bg-white rounded-xl p-5 flex justify-between items-center border border-neutral-300">
                                <div>
                                    <p className="text-sm font-medium text-neutral-500 tracking-tight mb-2">Pagó en total</p>
                                    <p className="text-xl font-medium text-neutral-900 leading-none">
                                        {formatCurrency(activitySummary.totalPaid, activitySummary.currency as any)}
                                    </p>
                                </div>
                                <div className="h-10 w-px bg-neutral-100" />
                                <div className="text-right">
                                    <p className="text-sm font-medium text-neutral-500 tracking-tight mb-2">
                                        {activitySummary.totalPaid - activitySummary.totalOwed >= 0 ? 'Le deben' : 'Debe'}
                                    </p>
                                    <p className={cn(
                                        "text-xl font-medium leading-none",
                                        activitySummary.totalPaid - activitySummary.totalOwed >= 0 ? "text-emerald-600" : "text-rose-600"
                                    )}>
                                        {formatCurrency(activitySummary.totalPaid - activitySummary.totalOwed, activitySummary.currency as any)}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Option: Reassign */}
                            <button
                                onClick={() => setResolutionType('reassign')}
                                className={cn(
                                    "w-full text-left p-5 rounded-xl border-1 transition-all flex items-start gap-4 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2",
                                    resolutionType === 'reassign'
                                        ? "border-neutral-900 bg-neutral-900/3"
                                        : "border-neutral-100 bg-white hover:border-neutral-200 shadow-sm"
                                )}
                            >
                                <div className={cn(
                                    "mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                    resolutionType === 'reassign' ? "border-neutral-900 bg-neutral-900" : "border-neutral-200"
                                )}>
                                    {resolutionType === 'reassign' && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-medium text-neutral-900 text-base">Reasignar actividad</p>
                                        <ArrowsLeftRight size={20} className={resolutionType === 'reassign' ? "text-neutral-900" : "text-neutral-400"} />
                                    </div>
                                    <p className="text-sm text-neutral-500 font-medium leading-normal mb-4">
                                        Transfiere todos sus pagos y deudas a otro integrante del grupo.
                                    </p>

                                    {resolutionType === 'reassign' && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                            <Select value={targetMemberId} onValueChange={setTargetMemberId}>
                                                <SelectTrigger className="h-12 w-full rounded-md border-neutral-200 bg-white shadow-xs ring-offset-white focus:ring-1 focus:ring-neutral-950">
                                                    <SelectValue placeholder="Seleccionar integrante" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-lg border-neutral-200 shadow-md p-2">
                                                    {otherMembers.map(m => (
                                                        <SelectItem key={m.id} value={m.id} className="rounded-sm p-2">
                                                            {m.name.toLowerCase().replace(/(?:^|\s)\S/g, (a: string) => a.toUpperCase())}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </button>

                            {/* Option: Purge */}
                            <button
                                onClick={() => setResolutionType('purge')}
                                className={cn(
                                    "w-full text-left p-5 rounded-xl border-1 transition-all flex items-start gap-4 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2",
                                    resolutionType === 'purge'
                                        ? "border-rose-600 bg-rose-50/50"
                                        : "border-neutral-100 bg-white hover:border-neutral-200 shadow-sm"
                                )}
                            >
                                <div className={cn(
                                    "mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                    resolutionType === 'purge' ? "border-rose-600 bg-rose-600" : "border-neutral-200"
                                )}>
                                    {resolutionType === 'purge' && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-medium text-neutral-900 text-base">Eliminar sus gastos</p>
                                        <Trash size={20} className={resolutionType === 'purge' ? "text-rose-600" : "text-neutral-400"} />
                                    </div>
                                    <p className="text-sm text-neutral-500 font-medium leading-normal">
                                        Borra permanentemente todos los gastos pagados por <span className="font-bold">{member.name}</span>. Los balances de los demás cambiarán.
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer - Fixed at bottom */}
                <footer
                    className="shrink-0 p-6 bg-stone-100 border-t border-neutral-100 flex flex-col sm:flex-row gap-3 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]"
                    style={{ paddingBottom: keyboardHeight > 0 ? `${keyboardHeight + 24}px` : 'max(1.5rem, env(safe-area-inset-bottom))' }}
                >
                    <Button
                        variant="ghost"
                        className="rounded-xl h-14 font-bold text-neutral-500 hover:bg-neutral-100 order-2 sm:order-1"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant={resolutionType === 'purge' ? "destructive" : "default"}
                        className={cn(
                            "flex-1 rounded-xl h-14 px-8 font-bold shadow-md transition-all active:scale-[0.98] order-1 sm:order-2 px-10",
                            resolutionType === 'reassign' && "bg-neutral-900 hover:bg-neutral-800"
                        )}
                        onClick={handleConfirm}
                        disabled={isSubmitting || (resolutionType === 'reassign' && !targetMemberId)}
                    >
                        {isSubmitting ? "Resolviendo..." : "Confirmar y eliminar"}
                    </Button>
                </footer>
            </div>
        </ResponsiveModal>
    );
}
