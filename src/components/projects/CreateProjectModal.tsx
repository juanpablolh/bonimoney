import React, { useState, useEffect, useContext } from 'react';
import { ResponsiveModal, KeyboardViewportContext } from '../ui-custom/ResponsiveModal';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useProject } from '@/contexts/ProjectContext';
import { Plus, Trash, X, CaretDown, Check, PaperPlaneRight } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import EmojiPicker from 'emoji-picker-react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { sendProjectInvitation } from '@/services/invitations';

interface CreateProjectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const EMOJIS = ['🏠', '✈️', '🛒', '🎉'];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ open, onOpenChange }) => {
    const { createProject } = useProject();
    const { user } = useAuth();
    const { keyboardHeight } = useContext(KeyboardViewportContext);
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('🏠');
    const [currency, setCurrency] = useState('CLP');
    const [loading, setLoading] = useState(false);
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
                setLoading(false);
            }, 300); // Wait for animation
            return () => clearTimeout(timer);
        } else {
            // Initialize with current user
            // We don't need to add the current user to the members array state 
            // because we display it separately and handle it in backend
        }
    }, [open]);

    const handleNext = () => {
        if (!name.trim()) return;
        setStep(2);
    };

    const handleCreate = async () => {
        if (!name.trim()) return;

        setLoading(true);
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

            // Import dynamically or assume it's available. 
            // Note: In a real scenario I should have imported this at the top.
            // I will add the import in a separate tool call if needed or assume user fixes imports. 
            // For now, I'll rely on a subsequent edit or existing imports if I can adding it now.
            // Waiting for the next edit to add the import.

            // For now, let's assume sendProjectInvitation is imported.
            // I will add the import in a subsequent edit or check if I can do it in this one.
            // I'll add the import to the top of the file in this same tool call.

            for (const member of emailMembers) {
                await sendProjectInvitation(
                    newProject.id,
                    member.value,
                    user?.user_metadata?.full_name || 'Alguien',
                    newProject.name,
                    newProject.icon
                );
            }

            onOpenChange(false);
        } catch (error: any) {
            alert(`Error al crear el proyecto: ${error.message || 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const addMember = () => {
        if (!inputValue.trim()) return;

        // Validation for email
        if (addMode === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(inputValue)) {
                // Determine how to show error. For now just return.
                // Could actueally show a toast or error state.
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
                {/* Header with X button - same style as ExpenseForm */}
                <div className="bg-neutral-50 shrink-0 rounded-t-3xl overflow-hidden pt-4 border-b border-neutral-100">
                    {/* Drawer Handle */}
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

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto bg-neutral-50 relative no-scrollbar min-h-[300px]">
                    <div className="px-6 py-6 space-y-6">
                        {step === 1 ? (
                            <>
                                <p className="text-neutral-500 font-medium text-base leading-relaxed">
                                    Dale un nombre a tu nuevo grupo para empezar a dividir gastos.
                                </p>

                                {/* Emoji Selection */}
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

                                {/* Project Name Input */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-semibold text-neutral-900">Nombre del grupo</label>
                                    <Input
                                        placeholder="Ej. Viaje a la playa, Casa"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-14 bg-neutral-50 border-neutral-200 rounded-xl text-base font-normal focus-visible:ring-0 focus-visible:border-neutral-300 placeholder:text-neutral-400 px-4"
                                    />
                                </div>

                                {/* Currency Selection Trigger */}
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



                                {/* Owner (You) */}


                                {/* Add Member Controls */}
                                <section
                                    className="rounded-xl p-4 text-white transition-all shadow-lg overflow-hidden flex flex-col justify-between min-h-[220px] bg-neutral-900"
                                >
                                    <div className="relative z-10 space-y-6 flex-1 flex flex-col justify-between">
                                        <div className="space-y-2">

                                            <p className="text-white/80 text-sm font-medium max-w-sm">
                                                Suma a todas las personas que compartirán gastos en este grupo para empezar a organizar.
                                            </p>
                                        </div>

                                        {/* Tabs */}
                                        <div className="flex gap-2 mb-2">
                                            <button
                                                type="button"
                                                onClick={() => setAddMode('name')}
                                                className={cn(
                                                    "flex-1 h-10 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all",
                                                    addMode === 'name' ? "bg-white/20 text-white" : "bg-transparent text-white/60 hover:text-white/80"
                                                )}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                                                    <path d="M234.38,210a123.36,123.36,0,0,0-60.78-53.23,76,76,0,1,0-91.2,0A123.36,123.36,0,0,0,21.62,210a12,12,0,1,0,20.77,12c18.12-31.32,50.12-50,85.61-50s67.49,18.69,85.61,50a12,12,0,0,0,20.77-12ZM76,96a52,52,0,1,1,52,52A52.06,52.06,0,0,1,76,96Z"></path>
                                                </svg>
                                                Por nombre
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setAddMode('email')}
                                                className={cn(
                                                    "flex-1 h-10 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all",
                                                    addMode === 'email' ? "bg-white/20 text-white" : "bg-transparent text-white/60 hover:text-white/80"
                                                )}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                                                    <path d="M224,44H32A12,12,0,0,0,20,56V192a20,20,0,0,0,20,20H216a20,20,0,0,0,20-20V56A12,12,0,0,0,224,44ZM193.15,68,128,127.72,62.85,68ZM44,188V83.28l75.89,69.57a12,12,0,0,0,16.22,0L212,83.28V188Z"></path>
                                                </svg>
                                                Por email
                                            </button>
                                        </div>

                                        {/* Input Area */}
                                        <div className="relative mt-2">
                                            <div className="relative w-full">
                                                <input
                                                    placeholder={addMode === 'name' ? "Nuevo integrante" : "correo@ejemplo.com"}
                                                    value={inputValue}
                                                    onChange={(e) => setInputValue(e.target.value)}
                                                    onKeyDown={handleKeyDown}
                                                    className="w-full h-14 bg-black/20 border-none text-white placeholder:text-white/60 rounded-xl pl-4 pr-36 focus:ring-0 focus:outline-none text-base font-medium transition-colors"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={addMember}
                                                    disabled={!inputValue.trim()}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 flex items-center gap-2 transition-all active:scale-95 hover:brightness-110 shadow-sm disabled:opacity-50 bg-neutral-800 rounded-xl"
                                                >
                                                    {addMode === 'email' ? (
                                                        <>
                                                            <PaperPlaneRight size={16} weight="fill" className="text-white" />
                                                            <span className="text-sm font-semibold text-white">Invitar</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256" className="text-white">
                                                                <path d="M256,136a12,12,0,0,1-12,12h-8v8a12,12,0,0,1-24,0v-8h-8a12,12,0,0,1,0-24h8v-8a12,12,0,0,1,24,0v8h8A12,12,0,0,1,256,136Zm-54.81,56.28a12,12,0,1,1-18.38,15.44C169.12,191.42,145,172,108,172c-28.89,0-55.46,12.68-74.81,35.72a12,12,0,0,1-18.38-15.44A124.08,124.08,0,0,1,63.5,156.53a72,72,0,1,1,89,0A124,124,0,0,1,201.19,192.28ZM108,148a48,48,0,1,0-48-48A48.05,48.05,0,0,0,108,148Z"></path>
                                                            </svg>
                                                            <span className="text-sm font-semibold text-white">Agregar</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Members List Header */}
                                <div className="mb-2">
                                    <p className="text-neutral-500 font-medium text-base leading-relaxed">
                                        Integrantes
                                    </p>
                                </div>

                                {/* Owner (You) */}
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

                                {/* Added Members List */}
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


                {/* Fixed Footer - Outside scroll area, adjusts for keyboard */}
                <footer
                    className="shrink-0 p-6 bg-neutral-50 border-t border-neutral-200 transition-[padding] duration-200"
                    style={{ paddingBottom: keyboardHeight > 0 ? `${keyboardHeight + 24}px` : 'max(1.5rem, env(safe-area-inset-bottom))' }}
                >
                    <div className="flex gap-3">
                        {step === 2 && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStep(1)}
                                className="flex-1 h-14 rounded-xl text-base font-semibold bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-900"
                            >
                                Volver
                            </Button>
                        )}
                        <Button
                            onClick={step === 1 ? handleNext : handleCreate}
                            disabled={step === 1 ? !name.trim() : loading}
                            className="flex-1 h-14 rounded-xl text-base font-semibold bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {step === 1 ? 'Continuar' : (loading ? 'Creando...' : 'Crear grupo')}
                        </Button>
                    </div>
                </footer>

                {/* Emoji Picker - Nested Drawer on mobile */}
                <ResponsiveModal
                    open={showPicker}
                    onOpenChange={setShowPicker}
                    title="Elige un emoji"
                    hideHeader={true}
                    isNested={false}
                    fixedHeight={true}
                >
                    <div className="flex flex-col h-full bg-neutral-50">
                        {/* Header */}
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
                        {/* Emoji Picker Content */}
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

                {/* Currency Picker Overlay */}
                {
                    showCurrencyPicker && (
                        <div className="absolute inset-0 z-[70] flex flex-col bg-neutral-50 animate-in slide-in-from-bottom duration-300 rounded-t-3xl md:rounded-3xl overflow-hidden">
                            <header className="bg-neutral-50 md:rounded-t-3xl shrink-0 pt-4 overflow-hidden border-b border-neutral-100">
                                {/* Drawer Handle */}
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
                    )
                }
            </div>
        </ResponsiveModal>
    );
};
