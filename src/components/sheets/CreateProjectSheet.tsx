import React, { useState, useEffect, useContext } from 'react';
import { ResponsiveModal, KeyboardViewportContext } from '../ui-custom/ResponsiveModal';
import { Button } from '../ui/button';
import { useProject } from '@/contexts/ProjectContext';
import { Plus, Trash, X, CaretDown, Check, PaperPlaneRight, Spinner, MagnifyingGlass } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
// import EmojiPicker from 'emoji-picker-react'; // Removed external lib
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { sendProjectInvitation } from '@/services/invitations';
import { PROJECT_THEMES, getProjectTheme } from '@/utils/projectTheme';
import { EMOJI_CATEGORIES } from '@/utils/emojis';
import { getMemberAvatarColor } from '@/utils/avatarColors';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';

interface CreateProjectSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}



export const CreateProjectSheet: React.FC<CreateProjectSheetProps> = ({ open, onOpenChange }) => {
    const { createProject } = useProject();
    const inviteCardTheme = getProjectTheme('project-slate');
    const { user } = useAuth();
    const adminColors = getMemberAvatarColor({ name: user?.user_metadata?.full_name || user?.email || 'U' });
    const { keyboardHeight } = useContext(KeyboardViewportContext);

    // Load saved state or default
    const getSavedState = () => {
        if (typeof window === 'undefined') return null;
        try {
            const saved = sessionStorage.getItem('boni_create_project_data');
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    };

    const savedState = getSavedState();

    const [step, setStep] = useState(savedState?.step || 1);
    const [name, setName] = useState(savedState?.name || '');
    const [icon, setIcon] = useState(savedState?.icon || null);
    const [currency, setCurrency] = useState(savedState?.currency || null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
    const [showPicker, setShowPicker] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
    const [members, setMembers] = useState<{ type: 'name' | 'email', value: string }[]>(savedState?.members || []);
    const [addMode, setAddMode] = useState<'name' | 'email'>(savedState?.addMode || 'name');
    const [inputValue, setInputValue] = useState(savedState?.inputValue || '');
    const [showError, setShowError] = useState(false);

    // Persist state changes
    useEffect(() => {
        // Only save if open (to avoid saving cleared state during closing animation)
        if (open) {
            const data = {
                step,
                name,
                icon,
                currency,
                members,
                addMode,
                inputValue
            };
            sessionStorage.setItem('boni_create_project_data', JSON.stringify(data));
        }
    }, [open, step, name, icon, currency, members, addMode, inputValue]);

    const CURRENCIES = [
        { code: 'CLP', name: 'Peso chileno', flag: '🇨🇱' },
        { code: 'USD', name: 'Dólar US', flag: '🇺🇸' },
        { code: 'BRL', name: 'Real brasileño', flag: '🇧🇷' },
        { code: 'ARS', name: 'Peso argentino', flag: '🇦🇷' },
        { code: 'PEN', name: 'Sol peruano', flag: '🇵🇪' },
        { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
        { code: 'GBP', name: 'Libra esterlina', flag: '🇬🇧' },
        { code: 'UYU', name: 'Peso uruguayo', flag: '🇺🇾' }
    ];

    // Reset state when modal closes
    useEffect(() => {
        if (!open) {
            // Clear session storage immediately
            sessionStorage.removeItem('boni_create_project_data');

            const timer = setTimeout(() => {
                setStep(1);
                setName('');
                setMembers([]);
                setInputValue('');
                setAddMode('name');
                setIcon(null);
                setCurrency(null);
                setShowPicker(false);
                setShowCurrencyPicker(false);
                setStatus('idle');
                // setLoading(false);
            }, 300); // Wait for animation
            return () => clearTimeout(timer);
        }
    }, [open]);

    // Added separate loading state handling if needed, but status covers it
    // const [loading, setLoading] = useState(false); 

    const handleNext = () => {
        if (!name.trim()) {
            setShowError(true);
            return;
        }
        setShowError(false);
        setStep(2);
    };

    const handleCreate = async () => {
        if (!name.trim()) return;

        setStatus('loading');
        // setLoading(true);
        try {
            const colors = Object.keys(PROJECT_THEMES);
            const randomColor = colors[Math.floor(Math.random() * colors.length)];

            // 1. Create Project
            const newProject = await createProject({
                name,
                icon: icon || '🏠',
                currency: currency || 'CLP',
                color: randomColor
            });

            // 2. Process Members
            // Filter ghost members (name only)
            const ghostMembers = members.filter(m => m.type === 'name' && m.value.trim().length > 0);

            if (ghostMembers.length > 0) {
                const membersToAdd = ghostMembers.map(member => ({
                    project_id: newProject.id,
                    name: member.value,
                    role: 'member',
                    status: 'accepted', // Auto-accept ghost members
                    invited_by: user?.id,
                    joined_at: new Date().toISOString()
                }));

                const { error: membersError } = await supabase
                    .from('project_members')
                    .insert(membersToAdd);

                if (membersError) {
                    console.error('Error adding ghost members:', membersError);
                    // Don't block creation if members fail
                }
            }

            // 3. Process Email Invitations
            const emailMembers = members.filter(m => m.type === 'email' && m.value.trim().length > 0);

            if (emailMembers.length > 0) {
                for (const member of emailMembers) {
                    try {
                        const result = await sendProjectInvitation(
                            newProject.id,
                            member.value,
                            user?.user_metadata?.full_name || 'Alguien',
                            newProject.name,
                            newProject.icon
                        );

                        if (!result.success) {
                            toast.error('Error al enviar invitación', {
                                description: `No se pudo invitar a ${member.value}: ${result.error || 'Error desconocido'}`
                            });
                        }
                    } catch (error) {
                        console.error('Error sending invitation:', error);
                        toast.error('Error al enviar invitación', {
                            description: `No se pudo invitar a ${member.value}`
                        });
                    }
                }
            }

            // 4. Project is already in local state from createProject()
            // Real-time subscriptions will handle any sync if needed

            // Show success state
            setStatus('success');
            toast.success('Grupo creado', {
                description: `¡Listo! Has creado el grupo "${name}".`
            });

            // Delay closing to show animation
            setTimeout(() => {
                onOpenChange(false);
            }, 1500);

        } catch (error: any) {
            console.error(error);
            toast.error('Error al crear el grupo', {
                description: error.message || 'Inténtalo de nuevo.'
            });
            setStatus('idle');
            // setLoading(false);
        }
    };

    const addMember = () => {
        if (!inputValue.trim()) return;

        // Validation for email
        if (addMode === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(inputValue)) {
                return;
            }
        }

        setMembers([...members, { type: addMode, value: inputValue }]);
        setInputValue('');
    };

    const removeMember = (index: number) => {
        setMembers(members.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addMember();
        }
    };

    const selectedCurrencyInfo = CURRENCIES.find(c => c.code === (currency || 'CLP')) || CURRENCIES[0];

    return (
        <ResponsiveModal
            open={open}
            onOpenChange={onOpenChange}
            title={step === 1 ? "Crea tu primer grupo" : "Agrega integrantes"}
            hideHeader={true}
            showCloseButton={false}
            fixedHeight={true}
        >
            <div className="flex flex-col h-full bg-stone-100 rounded-t-3xl overflow-hidden">
                {/* Header with X button */}
                <div className="bg-stone-100 shrink-0 rounded-t-3xl overflow-hidden pt-4 border-b border-neutral-100">
                    <div className="mx-auto h-1 w-[100px] rounded-full bg-neutral-200 mb-4" />
                    <header className="px-6 pb-5 flex items-center justify-between">
                        <h2 className="font-serif text-2xl font-medium text-neutral-900 tracking-[-1px] leading-tight">
                            {step === 1 ? "Nuevo grupo" : "Integrantes"}
                        </h2>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="p-1 min-w-12 hover:bg-neutral-200 rounded-full transition-colors text-neutral-900 flex flex-col justify-center items-center"
                        >
                            <X size={24} weight="regular" />
                        </button>
                    </header>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-stone-100 relative no-scrollbar min-h-[300px]">
                    {/* Progress Bar */}
                    <div className="px-6 pt-6">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-medium text-neutral-400">Paso {step} de 2</span>
                            <span className="text-xs font-bold text-neutral-900">{step === 1 ? '50%' : '100%'}</span>
                        </div>
                        <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-neutral-900 rounded-full"
                                initial={{ width: "50%" }}
                                animate={{ width: step === 1 ? "50%" : "100%" }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </div>

                    <div className="px-6 py-10 space-y-8">
                        {step === 1 ? (
                            <>
                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-neutral-500 tracking-normal">Nombre del grupo</label>
                                    <input
                                        placeholder="Ej. Viaje a la playa"
                                        value={name}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const sentenceCaseVal = val.charAt(0).toUpperCase() + val.slice(1);
                                            setName(sentenceCaseVal);
                                            if (sentenceCaseVal.trim()) setShowError(false);
                                        }}
                                        className={cn(
                                            "w-full text-2xl tracking-tight font-sans text-neutral-900 placeholder:text-neutral-300 bg-transparent border-b-1 transition-colors py-4 focus:outline-none",
                                            showError
                                                ? "border-red-500"
                                                : name.trim()
                                                    ? "border-green-500"
                                                    : "border-neutral-100 focus:border-neutral-900"
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Emoji Selector Card */}
                                    <button
                                        onClick={() => setShowPicker(true)}
                                        className={cn(
                                            "border rounded-[1rem] p-4 text-left flex flex-col items-start justify-between min-h-[160px] hover:shadow-md transition-all active:scale-95 group relative",
                                            icon ? "bg-emerald-50 border-emerald-900/10" : "bg-white border-neutral-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-full border flex items-center justify-center text-xl group-hover:scale-110 transition-transform",
                                            icon ? "bg-white border-emerald-100" : "bg-neutral-50 border-neutral-200"
                                        )}>
                                            {icon ? icon : <Plus size={20} className="text-neutral-400" />}
                                        </div>
                                        <CaretDown size={14} className={cn("absolute right-5 top-6", icon ? "text-emerald-400" : "text-neutral-300")} />
                                        <div className="mt-auto">
                                            <p className={cn("text-sm font-medium leading-tight", icon ? "text-emerald-600/70" : "text-neutral-400")}>Selecciona</p>
                                            <p className={cn("text-sm font-medium", icon ? "text-emerald-800" : "text-neutral-400")}>un emoji</p>
                                        </div>
                                    </button>

                                    {/* Currency Selector Card */}
                                    <button
                                        onClick={() => setShowCurrencyPicker(true)}
                                        className={cn(
                                            "border rounded-[1rem] p-4 text-left flex flex-col items-start justify-between min-h-[160px] hover:shadow-md transition-all active:scale-95 group relative",
                                            currency ? "bg-emerald-50 border-emerald-900/10" : "bg-white border-neutral-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-full border flex items-center justify-center text-xl group-hover:scale-110 transition-transform",
                                            currency ? "bg-white border-emerald-100" : "bg-neutral-50 border-neutral-200"
                                        )}>
                                            {currency ? selectedCurrencyInfo.flag : <Plus size={20} className="text-neutral-400" />}
                                        </div>
                                        <CaretDown size={14} className={cn("absolute right-5 top-6", currency ? "text-emerald-400" : "text-neutral-300")} />
                                        <div className="mt-auto">
                                            <p className={cn("text-sm font-medium leading-tight", currency ? "text-emerald-600/70" : "text-neutral-400")}>
                                                {currency ? selectedCurrencyInfo.name : "Selecciona"}
                                            </p>
                                            <p className={cn("text-sm font-medium", currency ? "text-emerald-800" : "text-neutral-400")}>
                                                {currency ? currency : "la moneda"}
                                            </p>
                                        </div>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <section
                                    className="rounded-xl p-4 transition-all border border-neutral-200 overflow-hidden flex flex-col justify-between min-h-[220px] relative group"
                                    style={{ backgroundColor: inviteCardTheme.bgColor, borderColor: inviteCardTheme.borderColor }}
                                >
                                    <div className={cn(
                                        "absolute inset-0 pointer-events-none transition-opacity duration-300",
                                        inviteCardTheme.overlay
                                    )} />
                                    <div className="relative z-10 space-y-6 flex-1 flex flex-col justify-between">
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-serif font-medium tracking-tight leading-none" style={{ color: inviteCardTheme.textColor }}>
                                                Agregar integrantes
                                            </h3>
                                            <p className="text-sm font-medium max-w-sm leading-relaxed" style={{ color: inviteCardTheme.mutedTextColor }}>
                                                Suma a todas las personas que compartirán gastos en este grupo.
                                            </p>
                                        </div>
                                        <div className="flex gap-2 mb-2">
                                            <button
                                                type="button"
                                                onClick={() => setAddMode('name')}
                                                style={{
                                                    backgroundColor: addMode === 'name' ? inviteCardTheme.iconBgColor : 'transparent',
                                                    color: addMode === 'name' ? inviteCardTheme.textColor : inviteCardTheme.mutedTextColor
                                                }}
                                                className="flex-1 h-10 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all hover:bg-white/20"
                                            >
                                                Por nombre
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setAddMode('email')}
                                                style={{
                                                    backgroundColor: addMode === 'email' ? inviteCardTheme.iconBgColor : 'transparent',
                                                    color: addMode === 'email' ? inviteCardTheme.textColor : inviteCardTheme.mutedTextColor
                                                }}
                                                className="flex-1 h-10 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all hover:bg-white/20"
                                            >
                                                Por email
                                            </button>
                                        </div>
                                        <div className="relative mt-2">
                                            <div className="relative w-full">
                                                <input
                                                    placeholder={addMode === 'name' ? "Nuevo integrante" : "correo@ejemplo.com"}
                                                    value={inputValue}
                                                    onChange={(e) => setInputValue(e.target.value)}
                                                    onKeyDown={handleKeyDown}
                                                    className="w-full h-12 bg-white/60 border-none text-neutral-900 placeholder:text-neutral-500 rounded-xl pl-4 pr-14 focus:ring-0 focus:outline-none text-base font-medium transition-colors backdrop-blur-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={addMember}
                                                    disabled={!inputValue.trim()}
                                                    style={{ width: '40px', height: '40px', minHeight: '40px', backgroundColor: inviteCardTheme.textColor }}
                                                    className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center transition-all active:scale-95 hover:brightness-110 shadow-sm disabled:opacity-50 rounded-xl text-white"
                                                    title={addMode === 'email' ? 'Invitar' : 'Agregar'}
                                                >
                                                    {addMode === 'email' ? (
                                                        <PaperPlaneRight size={18} weight="fill" />
                                                    ) : (
                                                        <Plus size={18} weight="bold" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                                <div className="mb-2">
                                    <p className="text-neutral-500 font-medium text-base leading-relaxed">
                                        Integrantes
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-100/50">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ring-1 ring-inset ring-black/5"
                                        style={{ backgroundColor: adminColors.bg, color: adminColors.text }}
                                    >
                                        {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2">
                                            <p className="font-semibold text-neutral-900 truncate">
                                                Tú <span className="font-normal text-neutral-500">
                                                    ({(user?.user_metadata?.full_name || 'Usuario').toLowerCase().replace(/(?:^|\s)\S/g, (a: string) => a.toUpperCase())})
                                                </span>
                                            </p>
                                        </div>
                                        <p className="text-xs text-neutral-500">Administrador</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {members.map((member, index) => {
                                        const avatarColors = getMemberAvatarColor({ name: member.value });
                                        return (
                                            <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-white border border-neutral-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div
                                                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-sm ring-1 ring-inset ring-black/5"
                                                        style={{ backgroundColor: avatarColors.bg, color: avatarColors.text }}
                                                    >
                                                        {member.type === 'email' ? '✉️' : member.value.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-neutral-900 truncate">{member.value}</p>
                                                        <p className="text-xs text-neutral-500">
                                                            {member.type === 'email' ? 'Invitación por correo' : 'Agregado por nombre'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeMember(index)}
                                                    className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                                                >
                                                    <Trash size={20} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <footer
                    className="shrink-0 p-6 bg-stone-100 border-t border-neutral-200 transition-[padding] duration-200"
                    style={{ paddingBottom: keyboardHeight > 0 ? `${keyboardHeight + 24}px` : 'max(1.5rem, env(safe-area-inset-bottom))' }}
                >
                    <div className="flex gap-3">
                        {status !== 'success' && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => step === 1 ? onOpenChange(false) : setStep(1)}
                                disabled={status === 'loading'}
                                className="flex-1 h-14 rounded-xl text-base font-semibold bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-900"
                            >
                                {step === 1 ? 'Cancelar' : 'Volver'}
                            </Button>
                        )}
                        <Button
                            onClick={step === 1 ? handleNext : handleCreate}
                            disabled={step === 1 ? !name.trim() : (status === 'loading' || status === 'success')}
                            className={cn(
                                "flex-1 h-14 rounded-xl text-base font-semibold text-white transition-all duration-300 relative overflow-hidden",
                                status === 'success'
                                    ? "bg-green-600 hover:bg-green-700 w-full flex-none"
                                    : "bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400"
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
                                        <span>¡Creado!</span>
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
                                        <span>Creando...</span>
                                    </motion.div>
                                ) : (
                                    <motion.span
                                        key="idle"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        {step === 1 ? 'Continuar' : 'Crear grupo'}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Button>
                    </div>
                </footer>

                {/* Pickers */}
                <ResponsiveModal
                    open={showPicker}
                    onOpenChange={setShowPicker}
                    title="Elige un emoji"
                    hideHeader={true}
                    isNested={false}
                    fixedHeight={true}
                >
                    <div className="flex flex-col h-full bg-neutral-50">
                        <div className="bg-neutral-50 shrink-0 pt-4 border-b border-neutral-100">
                            <div className="mx-auto h-1 w-[100px] rounded-full bg-neutral-200 mb-4 md:hidden" />
                            <header className="px-6 pb-5 flex items-center justify-between">
                                <h2 className="font-serif text-2xl font-medium text-neutral-900 tracking-[-1px] leading-tight">
                                    Elige un emoji
                                </h2>
                                <button
                                    onClick={() => setShowPicker(false)}
                                    className="p-1 min-w-12 hover:bg-neutral-200 rounded-full transition-colors text-neutral-900 flex flex-col justify-center items-center"
                                >
                                    <X size={24} weight="regular" />
                                </button>
                            </header>
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col">
                            {/* Search Bar */}
                            <div className="px-6 pb-4">
                                <div className="relative">
                                    <MagnifyingGlass
                                        size={18}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Buscar emoji..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full h-10 pl-10 pr-4 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all placeholder:text-neutral-400"
                                    />
                                </div>
                            </div>

                            {/* Emoji List */}
                            <div className="flex-1 overflow-y-auto px-6 pb-6">
                                {EMOJI_CATEGORIES.map(category => {
                                    // Filter emojis based on search term
                                    const filteredEmojis = category.emojis.filter(item => {
                                        if (!searchTerm.trim()) return true;
                                        const term = searchTerm.toLowerCase();
                                        return (
                                            item.label.toLowerCase().includes(term) ||
                                            item.keywords.some(k => k.toLowerCase().includes(term))
                                        );
                                    });

                                    if (filteredEmojis.length === 0) return null;

                                    return (
                                        <div key={category.id} className="mb-6">
                                            <h3 className="text-sm font-sans font-medium text-neutral-800 tracking-normal mb-3 sticky top-0 bg-neutral-50 py-2 z-10">
                                                {category.name}
                                            </h3>
                                            <div className="grid grid-cols-5 md:grid-cols-8 gap-2">
                                                {filteredEmojis.map((item, idx) => (
                                                    <button
                                                        key={`${category.id}-${idx}`}
                                                        onClick={() => {
                                                            setIcon(item.emoji);
                                                            setShowPicker(false);
                                                            setSearchTerm(''); // Clear search on select
                                                        }}
                                                        className="aspect-square flex items-center justify-center text-4xl hover:bg-neutral-200 rounded-xl transition-colors active:scale-90"
                                                        title={item.label}
                                                    >
                                                        {item.emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Empty State for Search */}
                                {searchTerm && EMOJI_CATEGORIES.every(cat =>
                                    cat.emojis.filter(item =>
                                        item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        item.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
                                    ).length === 0
                                ) && (
                                        <div className="flex flex-col items-center justify-center h-40 text-neutral-400">
                                            <p>No se encontraron emojis</p>
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                </ResponsiveModal>

                {showCurrencyPicker && (
                    <div className="absolute inset-0 z-[70] flex flex-col bg-neutral-50 animate-in slide-in-from-bottom duration-300 rounded-t-3xl md:rounded-3xl overflow-hidden">
                        <header className="bg-neutral-50 md:rounded-t-3xl shrink-0 pt-4 overflow-hidden border-b border-neutral-100">
                            <div className="mx-auto h-1 w-[100px] rounded-full bg-neutral-200 mb-4 md:hidden" />
                            <div className="px-6 pb-5 flex items-center justify-between">
                                <h2 className="font-serif text-2xl font-medium text-neutral-900 tracking-[-1px] leading-tight">
                                    Elige qué divisa añadir
                                </h2>
                                <button
                                    onClick={() => setShowCurrencyPicker(false)}
                                    className="p-1 min-w-12 hover:bg-neutral-200 rounded-full transition-colors text-neutral-900 flex flex-col justify-center items-center"
                                >
                                    <X size={24} weight="regular" />
                                </button>
                            </div>
                        </header>
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Divisas disponibles</p>
                            <div className="bg-white rounded-[1.5rem] p-2 space-y-0.5 border border-neutral-100 mb-8">
                                {CURRENCIES.map((c) => (
                                    <button
                                        key={c.code}
                                        type="button"
                                        onClick={() => {
                                            setCurrency(c.code);
                                            setShowCurrencyPicker(false);
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-4 p-2 transition-all text-left rounded-[1rem]",
                                            currency === c.code ? "bg-neutral-100 text-neutral-900" : "hover:bg-neutral-50"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shrink-0 text-3xl transition-colors",
                                            currency === c.code ? "bg-neutral-200" : "bg-neutral-200"
                                        )}>
                                            {c.flag}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-semibold truncate text-neutral-900">
                                                {c.name}
                                            </p>
                                            <p className={cn("text-xs font-medium uppercase tracking-wider", currency === c.code ? "text-neutral-500" : "text-neutral-400")}>
                                                {c.code}
                                            </p>
                                        </div>
                                        {currency === c.code && <Check size={20} weight="bold" className="text-neutral-900" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ResponsiveModal>
    );
};
