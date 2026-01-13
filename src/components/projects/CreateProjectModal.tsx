import React, { useState, useEffect, useContext } from 'react';
import { ResponsiveModal, KeyboardHeightContext } from '../ui-custom/ResponsiveModal';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useProject } from '@/contexts/ProjectContext';
import { Plus, Trash, X, CaretDown, Check } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import EmojiPicker from 'emoji-picker-react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface CreateProjectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const EMOJIS = ['🏠', '✈️', '🛒', '🎉'];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ open, onOpenChange }) => {
    const { createProject } = useProject();
    const { user } = useAuth();
    const keyboardHeight = useContext(KeyboardHeightContext);
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('🏠');
    const [currency, setCurrency] = useState('CLP');
    const [loading, setLoading] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
    const [members, setMembers] = useState<string[]>(['']);

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
                setMembers(['']);
                setIcon('🏠');
                setCurrency('CLP');
                setShowPicker(false);
                setShowCurrencyPicker(false);
                setLoading(false);
            }, 300); // Wait for animation
            return () => clearTimeout(timer);
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

            // 2. Add Members
            const validMembers = members.filter(m => m.trim().length > 0);
            if (validMembers.length > 0) {
                const membersToAdd = validMembers.map(memberName => ({
                    project_id: newProject.id,
                    name: memberName,
                    role: 'member',
                    status: 'accepted', // Auto-accept ghost members
                    invited_by: user?.id,
                    joined_at: new Date().toISOString()
                }));

                const { error: membersError } = await supabase
                    .from('project_members')
                    .insert(membersToAdd);

                if (membersError) {
                    console.error("Error adding members:", membersError);
                    // Don't block creation if members fail, but maybe warn?
                }
            }

            onOpenChange(false);
        } catch (error: any) {
            console.error("Error creating project:", error);
            alert(`Error al crear el proyecto: ${error.message || 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const addMemberRow = () => {
        setMembers([...members, '']);
    };

    const updateMemberName = (index: number, value: string) => {
        const newMembers = [...members];
        newMembers[index] = value;
        setMembers(newMembers);
    };

    const removeMemberRow = (index: number) => {
        if (members.length === 1) {
            setMembers(['']);
            return;
        }
        const newMembers = members.filter((_, i) => i !== index);
        setMembers(newMembers);
    };

    const selectedCurrencyInfo = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

    return (
        <ResponsiveModal
            open={open}
            onOpenChange={onOpenChange}
            title={step === 1 ? "Crea tu primer grupo" : "Agrega integrantes"}
            hideHeader={true}
            showCloseButton={false}
        >
            <div className="flex flex-col h-[85svh] max-h-[85svh] bg-neutral-50 md:h-full rounded-t-3xl overflow-hidden">
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
                <div className="flex-1 overflow-y-auto bg-neutral-50 relative">
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
                                <p className="text-neutral-500 font-medium text-base leading-relaxed">
                                    Agrega a las personas con las que compartirás gastos.
                                </p>

                                {/* Owner (You) */}
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-100/50">
                                    <div className="w-10 h-10 rounded-full bg-neutral-300 flex items-center justify-center text-neutral-600 font-bold">
                                        {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-neutral-900">Tú ({user?.user_metadata?.full_name || 'Usuario'})</p>
                                        <p className="text-xs text-neutral-500">Administrador</p>
                                    </div>
                                </div>

                                {/* Members List */}
                                <div className="space-y-3">
                                    {members.map((member, index) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                placeholder={`Nombre integrante ${index + 1}`}
                                                value={member}
                                                onChange={(e) => updateMemberName(index, e.target.value)}
                                                className="h-14 bg-neutral-50 border-neutral-200 rounded-xl text-base font-normal focus-visible:ring-0 focus-visible:border-neutral-300 placeholder:text-neutral-400 px-4 flex-1"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeMemberRow(index)}
                                                className="w-14 h-14 flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                            >
                                                <Trash size={24} />
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={addMemberRow}
                                        className="flex items-center gap-2 text-neutral-500 font-medium hover:text-neutral-800 transition-colors px-2 py-2"
                                    >
                                        <Plus size={20} weight="bold" />
                                        <span>Agregar otro integrante</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Fixed Footer - Outside scroll area, adjusts for keyboard */}
                <footer
                    className="shrink-0 p-6 bg-neutral-50 border-t border-neutral-200 transition-[padding] duration-200"
                    style={{
                        paddingBottom: keyboardHeight > 0
                            ? `${keyboardHeight + 16}px`
                            : 'max(1.5rem, env(safe-area-inset-bottom))'
                    }}
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

                {/* Emoji Picker Overlay */}
                {showPicker && (
                    <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200 rounded-[inherit]">
                        <div className="absolute inset-0" onClick={() => setShowPicker(false)}></div>
                        <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
                            <style>{`
                                .epr-category-nav { display: none !important; }
                            `}</style>
                            <EmojiPicker
                                onEmojiClick={(emojiData) => {
                                    setIcon(emojiData.emoji);
                                    setShowPicker(false);
                                }}
                                lazyLoadEmojis={true}
                                skinTonesDisabled={true}
                                searchPlaceholder="Buscar emoji..."
                                width={350}
                                height={450}
                            />
                        </div>
                    </div>
                )}

                {/* Currency Picker Overlay */}
                {showCurrencyPicker && (
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
                )}
            </div>
        </ResponsiveModal>
    );
};
