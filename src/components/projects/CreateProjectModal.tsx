import React, { useState, useEffect, useContext } from 'react';
import { ResponsiveModal, KeyboardViewportContext } from '../ui-custom/ResponsiveModal';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useProject } from '@/contexts/ProjectContext';
import { Plus, Trash, X, CaretDown, Check, PaperPlaneRight, Spinner } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import EmojiPicker from 'emoji-picker-react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { sendProjectInvitation } from '@/services/invitations';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';

interface CreateProjectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const EMOJIS = ['🏠', '✈️', '🛒', '🎉'];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ open, onOpenChange }) => {
    const { createProject, loadProjects } = useProject();
    const { user } = useAuth();
    const { keyboardHeight } = useContext(KeyboardViewportContext);
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('🏠');
    const [currency, setCurrency] = useState('CLP');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
    const [showPicker, setShowPicker] = useState(false);
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
    const [members, setMembers] = useState<{ type: 'name' | 'email', value: string }[]>([]);
    const [addMode, setAddMode] = useState<'name' | 'email'>('name');
    const [inputValue, setInputValue] = useState('');

    const CURRENCIES = [
        { code: 'CLP', name: 'Peso chileno', flag: '🇨🇱' },
        { code: 'USD', name: 'Dólar estadounidense', flag: '🇺🇸' },
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
            const timer = setTimeout(() => {
                setStep(1);
                setName('');
                setMembers([]);
                setInputValue('');
                setAddMode('name');
                setIcon('🏠');
                setCurrency('CLP');
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
        if (!name.trim()) return;
        setStep(2);
    };

    const handleCreate = async () => {
        if (!name.trim()) return;

        setStatus('loading');
        // setLoading(true);
        try {
            const colors = [
                'project-emerald', 'project-teal', 'project-sky', 'project-sapphire',
                'project-indigo', 'project-violet', 'project-purple', 'project-orchid',
                'project-magenta', 'project-rose', 'project-crimson', 'project-orange',
                'project-burntorange', 'project-amber', 'project-olive'
            ];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];

            // 1. Create Project
            const newProject = await createProject({
                name,
                icon,
                currency,
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

            // 4. Reload projects to get updated member count
            await loadProjects();

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

    const selectedCurrencyInfo = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

    return (
        <ResponsiveModal
            open={open}
            onOpenChange={onOpenChange}
            title={step === 1 ? "Crea tu primer grupo" : "Agrega integrantes"}
            hideHeader={true}
            showCloseButton={false}
            fixedHeight={true}
        >
            <div className="flex flex-col h-full bg-neutral-50 rounded-t-3xl overflow-hidden">
                {/* Header with X button */}
                <div className="bg-neutral-50 shrink-0 rounded-t-3xl overflow-hidden pt-4 border-b border-neutral-100">
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
                <div className="flex-1 overflow-y-auto bg-neutral-50 relative no-scrollbar min-h-[300px]">
                    <div className="px-6 py-6 space-y-6">
                        {step === 1 ? (
                            <>
                                <p className="text-neutral-500 font-medium text-base leading-relaxed">
                                    Dale un nombre a tu nuevo grupo para empezar a dividir gastos.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {EMOJIS.map(e => (
                                        <button
                                            key={e}
                                            type="button"
                                            onClick={() => {
                                                setIcon(e);
                                                setShowPicker(false);
                                            }}
                                            className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all ${icon === e
                                                ? 'bg-neutral-900 shadow-lg scale-105'
                                                : 'bg-neutral-200 hover:bg-neutral-300'
                                                }`}
                                        >
                                            {e}
                                        </button>
                                    ))}
                                    {!EMOJIS.includes(icon) ? (
                                        <button
                                            key="custom-emoji"
                                            type="button"
                                            onClick={() => setShowPicker(true)}
                                            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-neutral-900 shadow-lg scale-105 transition-all"
                                        >
                                            {icon}
                                        </button>
                                    ) : (
                                        <button
                                            key="plus-button"
                                            type="button"
                                            onClick={() => setShowPicker(true)}
                                            className="w-14 h-14 rounded-xl flex items-center justify-center text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-all"
                                        >
                                            <Plus size={24} weight="bold" />
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-sm font-semibold text-neutral-900">Nombre del grupo</label>
                                    <Input
                                        placeholder="Ej. Viaje a la playa, Casa"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-14 bg-neutral-50 border-neutral-200 rounded-xl text-base font-normal focus-visible:ring-0 focus-visible:border-neutral-300 placeholder:text-neutral-400 px-4"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-sm font-semibold text-neutral-900">Moneda predeterminada</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrencyPicker(true)}
                                        className="w-full h-14 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-xl px-4 flex items-center justify-between transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-2xl shrink-0">
                                                {selectedCurrencyInfo.flag}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-neutral-900 leading-tight">{selectedCurrencyInfo.name}</p>
                                                <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">{selectedCurrencyInfo.code}</p>
                                            </div>
                                        </div>
                                        <CaretDown size={20} className="text-neutral-400" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <section className="rounded-xl p-4 transition-all shadow-lg overflow-hidden flex flex-col justify-between min-h-[220px] bg-neutral-200">
                                    <div className="relative z-10 space-y-6 flex-1 flex flex-col justify-between">
                                        <div className="space-y-2">
                                            <p className="text-neutral-600 text-sm font-medium max-w-sm">
                                                Suma a todas las personas que compartirán gastos en este grupo para empezar a organizar.
                                            </p>
                                        </div>
                                        <div className="flex gap-2 mb-2">
                                            <button
                                                type="button"
                                                onClick={() => setAddMode('name')}
                                                className={cn(
                                                    "flex-1 h-10 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all",
                                                    addMode === 'name' ? "bg-neutral-300 text-neutral-900" : "bg-transparent text-neutral-600 hover:text-neutral-900"
                                                )}
                                            >
                                                Por nombre
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setAddMode('email')}
                                                className={cn(
                                                    "flex-1 h-10 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all",
                                                    addMode === 'email' ? "bg-neutral-300 text-neutral-900" : "bg-transparent text-neutral-600 hover:text-neutral-900"
                                                )}
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
                                                    className="w-full h-12 bg-white border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 rounded-xl pl-4 pr-14 focus:ring-0 focus:outline-none text-base font-medium transition-colors"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={addMember}
                                                    disabled={!inputValue.trim()}
                                                    style={{ width: '40px', height: '40px', minHeight: '40px' }}
                                                    className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center transition-all active:scale-95 hover:bg-neutral-800 shadow-sm disabled:opacity-50 bg-neutral-900 rounded-xl"
                                                    title={addMode === 'email' ? 'Invitar' : 'Agregar'}
                                                >
                                                    {addMode === 'email' ? (
                                                        <PaperPlaneRight size={18} weight="fill" className="text-white" />
                                                    ) : (
                                                        <Plus size={18} weight="bold" className="text-white" />
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
                                    <div className="w-10 h-10 rounded-full bg-neutral-300 flex items-center justify-center text-neutral-600 font-bold text-sm">
                                        {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2">
                                            <p className="font-semibold text-neutral-900 truncate">
                                                Tú <span className="font-normal text-neutral-500">({user?.user_metadata?.full_name || 'Usuario'})</span>
                                            </p>
                                        </div>
                                        <p className="text-xs text-neutral-500">Administrador</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {members.map((member, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-white border border-neutral-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                                                    member.type === 'email' ? "bg-purple-100 text-purple-600" : "bg-neutral-100 text-neutral-600"
                                                )}>
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
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <footer
                    className="shrink-0 p-6 bg-neutral-50 border-t border-neutral-200 transition-[padding] duration-200"
                    style={{ paddingBottom: keyboardHeight > 0 ? `${keyboardHeight + 24}px` : 'max(1.5rem, env(safe-area-inset-bottom))' }}
                >
                    <div className="flex gap-3">
                        {step === 2 && status !== 'success' && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStep(1)}
                                disabled={status === 'loading'}
                                className="flex-1 h-14 rounded-xl text-base font-semibold bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-900"
                            >
                                Volver
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
                        <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
                            <style>{`
                                .epr-category-nav { display: none !important; }
                                .epr-search-container input { font-size: 16px !important; }
                            `}</style>
                            <EmojiPicker
                                onEmojiClick={(emojiData) => {
                                    setIcon(emojiData.emoji);
                                    setShowPicker(false);
                                }}
                                lazyLoadEmojis={true}
                                skinTonesDisabled={true}
                                searchPlaceholder="Buscar emoji..."
                                width="100%"
                                height="100%"
                            />
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
