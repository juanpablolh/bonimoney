import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { EnvelopeSimple, ArrowRight, CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MagicLinkAuth() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { signInWithEmail } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await signInWithEmail(email);

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSent(true);
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-sm mx-auto p-2">
            <AnimatePresence mode="wait">
                {sent ? (
                    <motion.div
                        key="sent"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-6 py-8"
                    >
                        <div className="flex justify-center">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                                <CheckCircle size={40} weight="fill" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-neutral-900 tracking-tight">¡Revisa tu email!</h2>
                            <p className="text-neutral-500 text-sm font-medium leading-relaxed">
                                Hemos enviado un link mágico a <span className="font-bold text-neutral-900">{email}</span>. Haz clic para entrar.
                            </p>
                        </div>
                        <p className="text-xs text-neutral-400 font-medium">
                            ¿No llegó? Revisa tu carpeta de spam o{' '}
                            <button
                                onClick={() => setSent(false)}
                                className="text-primary font-bold hover:underline"
                            >
                                intenta de nuevo
                            </button>
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-8 py-4"
                    >
                        <div className="text-center space-y-3">
                            <div className="flex justify-center">
                                <div className="w-14 h-14 bg-neutral-100 text-neutral-900 rounded-2xl flex items-center justify-center rotate-3 transform">
                                    <EnvelopeSimple size={30} weight="bold" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black text-neutral-900 tracking-tighter">Acceso Directo</h2>
                                <p className="text-neutral-500 text-sm font-medium">Sin contraseñas. Solo tu email.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest ml-1">Tu Correo Electrónico</label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="ejemplo@correo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="h-14 bg-neutral-50 border-neutral-100 rounded-2xl text-base font-bold placeholder:text-neutral-300 focus-visible:ring-neutral-200"
                                />
                            </div>

                            {error && (
                                <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3 text-orange-800 animate-in fade-in slide-in-from-top-1 duration-300">
                                    <WarningCircle size={20} weight="bold" className="shrink-0 mt-0.5" />
                                    <p className="text-xs font-bold leading-tight">{error}</p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={loading || !email}
                                className="w-full h-14 rounded-2xl text-base font-black shadow-xl shadow-neutral-200 transition-all active:scale-95 flex gap-2"
                            >
                                {loading ? 'Enviando...' : (
                                    <>
                                        Continuar
                                        <ArrowRight size={18} weight="bold" />
                                    </>
                                )}
                            </Button>
                        </form>

                        <p className="text-[10px] text-neutral-400 text-center font-medium leading-normal px-4">
                            Al continuar, aceptas nuestros{' '}
                            <a href="#" className="text-neutral-900 hover:underline font-bold">Términos</a>
                            {' '}y{' '}
                            <a href="#" className="text-neutral-900 hover:underline font-bold">Privacidad</a>.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
