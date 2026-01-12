import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { CheckCircle, WarningCircle, ArrowRight } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomeLogin() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { signInWithEmail } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (name) {
            localStorage.setItem('temp_login_name', name);
        }

        try {
            const { error } = await signInWithEmail(email, name);
            if (error) {
                setError(error.message);
            } else {
                setSent(true);
            }
        } catch (err) {
            setError('Ocurrió un error inesperado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[400px] bg-[#FAFAF9] rounded-3xl shadow-lg overflow-hidden"
            >
                {/* Header */}
                <div className="bg-[#44403C] px-8 py-4 flex flex-col items-start justify-center">
                    <h1 className="font-serif text-[32px] leading-none text-white tracking-tight">
                        Bonimoney
                    </h1>
                </div>

                {/* Body */}
                <div className="p-4 space-y-8">
                    <AnimatePresence mode="wait">
                        {sent ? (
                            <motion.div
                                key="sent"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center space-y-6"
                            >
                                <div className="flex justify-center">
                                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                                        <CheckCircle size={32} weight="fill" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-serif text-stone-900">¡Revisa tu email!</h3>
                                    <p className="text-stone-500 text-sm font-medium leading-relaxed">
                                        Enviamos el enlace mágico a <span className="text-stone-900 font-bold">{email}</span>
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.form
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onSubmit={handleSubmit}
                                className="space-y-6"
                            >
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-[#A8A29E] ml-1">
                                            Tu nombre
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="Ej. Juan Pérez"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            disabled={loading}
                                            className="h-16 bg-white border-none rounded-2xl text-lg font-medium placeholder:text-stone-300 px-6 shadow-sm ring-1 ring-stone-100 focus-visible:ring-stone-300"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-[#A8A29E] ml-1">
                                            Tu email
                                        </label>
                                        <div className="relative">
                                            <Input
                                                type="email"
                                                placeholder="nombre@ejemplo.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                disabled={loading}
                                                className="h-16 bg-white border-none rounded-2xl text-lg font-medium placeholder:text-stone-300 pl-6 pr-24 shadow-sm ring-1 ring-stone-100 focus-visible:ring-stone-300"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!email || !name || loading}
                                                className="absolute right-2 top-2 bottom-2 aspect-square bg-[#1C1917] rounded-xl text-white flex items-center justify-center hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                            >
                                                {loading ? (
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <ArrowRight size={20} weight="bold" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-orange-50 rounded-2xl flex items-start gap-3 text-orange-800 animate-in fade-in slide-in-from-top-1">
                                        <WarningCircle size={20} weight="fill" className="shrink-0 mt-0.5" />
                                        <p className="text-sm font-medium">{error}</p>
                                    </div>
                                )}

                                <div className="text-center">
                                    <p className="text-xs text-[#A8A29E] font-medium">
                                        Al continuar aceptas nuestros <a href="#" className="text-stone-900 hover:underline">Términos</a> y <a href="#" className="text-stone-900 hover:underline">Privacidad</a>.
                                    </p>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
