import React, { useState, useEffect } from 'react';
import { ResponsiveModal } from '../ui-custom/ResponsiveModal';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useProject } from '@/contexts/ProjectContext';
import { Plus, Trash } from '@phosphor-icons/react';
import EmojiPicker from 'emoji-picker-react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface CreateProjectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const EMOJIS = ['🏠', '✈️', '🛒', '🎉', '💡'];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ open, onOpenChange }) => {
    const { createProject } = useProject();
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('🏠');
    const [loading, setLoading] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [members, setMembers] = useState<string[]>(['']);

    // Reset state when modal closes
    useEffect(() => {
        if (!open) {
            const timer = setTimeout(() => {
                setStep(1);
                setName('');
                setMembers(['']);
                setIcon('🏠');
                setShowPicker(false);
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
            const colors = ['project-emerald', 'project-rose', 'project-amber', 'project-sky', 'project-indigo'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];

            // 1. Create Project
            const newProject = await createProject({
                name,
                icon,
                currency: 'CLP', // Default
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

    return (
        <ResponsiveModal
            open={open}
            onOpenChange={onOpenChange}
            title={step === 1 ? "Crea tu primer grupo" : "Agrega integrantes"}
            hideHeader={true}
            showCloseButton={false}
        >
            <div className="flex flex-col h-full bg-stone-50 overflow-hidden rounded-t-3xl md:rounded-3xl shadow-2xl ring-1 ring-black/5 relative">
                {/* Header */}
                <div className="bg-[#44403C] rounded-t-3xl shrink-0">
                    <header className="px-8 py-8 flex items-center justify-between">
                        <h2 className="font-serif text-[32px] font-medium text-[#FAFAF9] tracking-[-1px] leading-tight">
                            {step === 1 ? "Crea tu primer grupo" : "Quiénes participan"}
                        </h2>
                    </header>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 bg-stone-50 relative">
                    {step === 1 ? (
                        <>
                            <p className="text-stone-500 font-medium text-lg leading-relaxed">
                                Dale un nombre a tu nuevo grupo para empezar a dividir gastos de forma inteligente.
                            </p>

                            <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
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
                                                ? 'bg-[#44403C] shadow-lg scale-105'
                                                : 'bg-[#E7E5E4] hover:bg-[#D6D3D1]'
                                                }`}
                                        >
                                            {e}
                                        </button>
                                    ))}
                                    {/* Custom Emoji or Plus Button */}
                                    {!EMOJIS.includes(icon) ? (
                                        <button
                                            key="custom-emoji"
                                            type="button"
                                            onClick={() => setShowPicker(true)}
                                            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-[#44403C] shadow-lg scale-105 transition-all"
                                        >
                                            {icon}
                                        </button>
                                    ) : (
                                        <button
                                            key="plus-button"
                                            type="button"
                                            onClick={() => setShowPicker(true)}
                                            className="w-14 h-14 rounded-xl flex items-center justify-center text-stone-600 bg-[#F5F5F4] hover:bg-[#E7E5E4] transition-all"
                                            style={{ backgroundColor: 'var(--color-stone-100)' }}
                                        >
                                            <Plus size={24} weight="bold" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2 mb-6">
                                    <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Nombre del proyecto</label>
                                    <Input
                                        placeholder="Ej. Viaje a la playa, Casa"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-14 bg-white border border-stone-200 rounded-xl text-lg font-medium placeholder:text-stone-400 px-4 focus-visible:ring-stone-900"
                                        style={{ letterSpacing: '-0.3px' }}
                                    />
                                </div>

                                <div className="flex gap-3 pt-6">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => onOpenChange(false)}
                                        className="flex-1 h-14 rounded-2xl text-base font-bold bg-white border-stone-200 hover:bg-stone-50 text-stone-900"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={!name.trim()}
                                        className="flex-1 h-14 rounded-2xl text-base font-bold bg-stone-800 hover:bg-stone-900 text-white shadow-xl"
                                        style={{ letterSpacing: '-0.2px' }}
                                    >
                                        Continuar
                                    </Button>
                                </div>
                            </form>
                        </>
                    ) : (
                        // STEP 2: Members
                        <>
                            <p className="text-stone-500 font-medium text-lg leading-relaxed">
                                Agrega a las personas con las que compartirás gastos. Puedes agregar más después.
                            </p>

                            <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="space-y-4">
                                <div className="space-y-3">
                                    {/* Owner (You) */}
                                    <div className="flex items-center gap-3 p-2 rounded-xl bg-stone-100/50 border border-transparent">
                                        <div className="w-10 h-10 rounded-full bg-stone-300 flex items-center justify-center text-stone-600 font-bold">
                                            {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-stone-900">Tú ({user?.user_metadata?.full_name || 'Usuario'})</p>
                                            <p className="text-xs text-stone-500">Administrador</p>
                                        </div>
                                    </div>

                                    {members.map((member, index) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                placeholder={`Nombre integrante ${index + 1}`}
                                                value={member}
                                                onChange={(e) => updateMemberName(index, e.target.value)}
                                                className="h-14 bg-white border border-stone-200 rounded-xl text-lg font-medium placeholder:text-stone-400 px-4 focus-visible:ring-stone-900 flex-1"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeMemberRow(index)}
                                                className="w-14 h-14 flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                            >
                                                <Trash size={24} />
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={addMemberRow}
                                        className="flex items-center gap-2 text-stone-500 font-medium hover:text-stone-800 transition-colors px-2 py-2"
                                    >
                                        <Plus size={20} weight="bold" />
                                        <span style={{ letterSpacing: '-0.2px' }}>Agregar otro integrante</span>
                                    </button>
                                </div>

                                <div className="flex gap-3 pt-6">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setStep(1)}
                                        className="flex-1 h-14 rounded-2xl text-base font-semibold bg-white border-stone-200 hover:bg-stone-50 text-stone-900"
                                    >
                                        Atrás
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 h-14 rounded-2xl text-base font-bold bg-stone-800 hover:bg-stone-900 text-white shadow-xl"
                                        style={{ letterSpacing: '-0.2px' }}
                                    >
                                        {loading ? 'Creando...' : 'Crear grupo'}
                                    </Button>
                                </div>
                            </form>
                        </>
                    )}
                </div>

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
            </div>
        </ResponsiveModal>
    );
};
