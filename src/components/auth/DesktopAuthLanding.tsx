import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordInput } from './PasswordInput';
import { SignIn, UserPlus, CheckCircle, WarningCircle, ArrowLeft } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

// Shared card wrapper - defined outside to prevent re-renders
function AuthCard({ children, title }: { children: React.ReactNode; title?: string }) {
    const navigate = useNavigate();

    return (
        <div className="w-[92vw] max-w-[480px] bg-neutral-50 rounded-[32px] shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-orange-950 px-6 py-6 flex items-center justify-between">
                <button
                    onClick={() => navigate('/')}
                    className="font-serif text-2xl text-orange-300 tracking-[-0.015em] hover:text-orange-200 transition-colors cursor-pointer"
                >
                    Bonimoney
                </button>
                {title && <span className="text-white/80 font-medium text-base tracking-tight">{title}</span>}
            </div>
            {/* Body */}
            <div className="p-6">
                {children}
            </div>
        </div>
    );
}

// Landing page component
function LandingView() {
    const navigate = useNavigate();

    return (
        <div className="flex w-full min-h-screen bg-[#f5f5f5] lg:bg-neutral-50 relative overflow-hidden lg:overflow-visible">
            {/* Mobile Background Image - logic from Figma node 2027:3547 */}
            <div className="lg:hidden absolute h-[50vh] left-0 bottom-0 w-full z-10">
                <img
                    src="/bg-bonimoney.webp"
                    alt="Bonimoney Background"
                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                />
            </div>

            {/* Content area */}
            <div className="w-full lg:w-1/2 min-h-screen flex items-start lg:items-center justify-center px-6 lg:px-16 py-12 lg:py-8 z-20 relative overflow-auto">
                <div className="flex flex-col w-full max-w-[25rem] gap-6 lg:gap-8">
                    {/* Logo Section */}
                    <div>
                        <h1 className="font-serif text-2xl text-neutral-900 tracking-[-0.015em]">
                            Bonimoney
                        </h1>
                    </div>

                    {/* Content group */}
                    <div className="flex flex-col gap-4 lg:gap-5">
                        <h2 className="font-serif text-[clamp(2rem,5vw,3rem)] text-neutral-900 leading-[115%] font-normal tracking-[-0.0125rem]">
                            Dividir gastos ahora es la parte más fácil del plan
                        </h2>
                        <p className="text-neutral-500 text-base lg:text-lg leading-relaxed max-w-lg">
                            Con Bonimoney, crea grupos, agrega pagos y salda deudas en un par de taps, rápido y claro.
                        </p>
                    </div>

                    {/* Button cards */}
                    <div className="flex gap-4 lg:gap-5 mt-4 lg:mt-6">
                        <button
                            onClick={() => navigate('/login')}
                            className="flex-1 lg:flex-none aspect-square lg:w-[160px] lg:h-[160px] rounded-[24px] bg-orange-500 text-white flex flex-col items-start justify-between p-5 hover:bg-orange-600 transition-colors shadow-sm active:scale-[0.98] cursor-pointer"
                        >
                            <SignIn size={32} weight="bold" />
                            <span className="text-[1.125rem] font-semibold leading-tight text-left">Iniciar Sesión</span>
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            className="flex-1 lg:flex-none aspect-square lg:w-[160px] lg:h-[160px] rounded-[24px] bg-neutral-200 text-neutral-700 flex flex-col items-start justify-between p-5 hover:bg-neutral-300 transition-colors shadow-sm active:scale-[0.98] cursor-pointer"
                        >
                            <UserPlus size={32} weight="regular" />
                            <span className="text-[1.125rem] font-semibold leading-tight text-left">Crear Cuenta</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop Right Panel - Fixed background image */}
            <div className="hidden lg:block fixed top-0 right-0 w-1/2 h-screen overflow-hidden">
                <img
                    src="/bg-bonimoney.webp"
                    alt="Bonimoney Background"
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </div>
        </div>
    );
}



// Login form component
function LoginView() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { signInWithPassword } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await signInWithPassword(email, password);

        if (error) {
            if (error.message.includes('Invalid login credentials')) {
                setError('Email o contraseña incorrectos');
            } else {
                setError(error.message);
            }
        }
        setLoading(false);
    };

    return (
        <AuthCard title="Iniciar Sesión">
            <form id="login-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                    <div className="flex flex-col gap-2.5">
                        <label htmlFor="login-email" className="text-sm font-semibold text-neutral-900">
                            Email
                        </label>
                        <Input
                            id="login-email"
                            name="email"
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            autoComplete="username"
                            className="h-13 bg-white border border-neutral-200 rounded-xl text-base font-normal placeholder:text-neutral-400 px-4 focus-visible:ring-0 focus-visible:border-neutral-300 shadow-sm transition-all"
                        />
                    </div>

                    <div className="flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                            <label htmlFor="login-password" className="text-sm font-semibold text-neutral-900">
                                Contraseña
                            </label>
                            <button
                                type="button"
                                onClick={() => navigate('/forgot-password')}
                                className="text-xs font-medium text-neutral-500 hover:text-neutral-700 transition-colors cursor-pointer"
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>
                        <PasswordInput
                            id="login-password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            autoComplete="current-password"
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-orange-50 rounded-xl flex items-start gap-3 text-orange-800 animate-in fade-in slide-in-from-top-1">
                        <WarningCircle size={20} weight="fill" className="shrink-0 mt-0.5" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                <div className="space-y-6">
                    <Button
                        type="submit"
                        disabled={loading || !email || !password}
                        className="w-full h-14 rounded-2xl text-base font-semibold bg-neutral-900 text-white hover:bg-neutral-800 transition-all shadow-md active:scale-[0.98] cursor-pointer"
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                    </Button>

                    <p className="text-center text-sm text-neutral-500">
                        ¿No tienes cuenta?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/register')}
                            className="font-bold text-neutral-900 hover:underline px-1 cursor-pointer"
                        >
                            Regístrate
                        </button>
                    </p>
                </div>
            </form>
        </AuthCard>
    );
}

// Register form component
function RegisterView() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const { signUp } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            setLoading(false);
            return;
        }

        const { error } = await signUp(email, password, name);

        if (error) {
            if (error.message.includes('already registered')) {
                setError('Este email ya está registrado');
            } else {
                setError(error.message);
            }
        } else {
            setSuccess(true);
        }
        setLoading(false);
    };

    if (success) {
        return (
            <AuthCard title="¡Listo!">
                <div className="text-center space-y-8 py-6">
                    <div className="flex justify-center">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                            <CheckCircle size={40} weight="fill" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-2xl font-serif text-neutral-900">¡Revisa tu email!</h3>
                        <p className="text-neutral-500 text-base font-medium leading-relaxed max-w-sm mx-auto">
                            Te enviamos un enlace de confirmación a <span className="font-bold text-neutral-900">{email}</span>
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/login')}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-700 hover:text-neutral-900 transition-colors cursor-pointer"
                    >
                        <ArrowLeft size={18} weight="bold" />
                        Volver a iniciar sesión
                    </button>
                </div>
            </AuthCard>
        );
    }

    return (
        <AuthCard title="Crear Cuenta">
            <form id="register-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                    <div className="flex flex-col gap-2.5">
                        <label htmlFor="reg-name" className="text-sm font-semibold text-neutral-900">
                            Nombre
                        </label>
                        <Input
                            id="reg-name"
                            name="name"
                            type="text"
                            placeholder="Escribe tu nombre"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            disabled={loading}
                            autoComplete="name"
                            className="h-13 bg-white border border-neutral-200 rounded-xl text-base font-normal placeholder:text-neutral-400 px-4 focus-visible:ring-0 focus-visible:border-neutral-300 shadow-sm transition-all"
                        />
                    </div>

                    <div className="flex flex-col gap-2.5">
                        <label htmlFor="reg-email" className="text-sm font-semibold text-neutral-900">
                            Email
                        </label>
                        <Input
                            id="reg-email"
                            name="email"
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            autoComplete="email"
                            className="h-13 bg-white border border-neutral-200 rounded-xl text-base font-normal placeholder:text-neutral-400 px-4 focus-visible:ring-0 focus-visible:border-neutral-300 shadow-sm transition-all"
                        />
                    </div>

                    <div className="flex flex-col gap-2.5">
                        <label htmlFor="reg-password" className="text-sm font-semibold text-neutral-900">
                            Contraseña
                        </label>
                        <PasswordInput
                            id="reg-password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="flex flex-col gap-2.5">
                        <label htmlFor="reg-confirm-password" className="text-sm font-semibold text-neutral-900">
                            Confirmar contraseña
                        </label>
                        <PasswordInput
                            id="reg-confirm-password"
                            name="confirm-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={loading}
                            autoComplete="new-password"
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-orange-50 rounded-xl flex items-start gap-3 text-orange-800 animate-in fade-in slide-in-from-top-1">
                        <WarningCircle size={20} weight="fill" className="shrink-0 mt-0.5" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                <div className="space-y-6">
                    <Button
                        type="submit"
                        disabled={loading || !email || !password || !name || !confirmPassword}
                        className="w-full h-14 rounded-2xl text-base font-semibold bg-neutral-900 text-white hover:bg-neutral-800 transition-all shadow-md active:scale-[0.98] cursor-pointer"
                    >
                        {loading ? 'Registrando...' : 'Registrarse'}
                    </Button>

                    <p className="text-center text-sm text-neutral-500">
                        ¿Ya tienes cuenta?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="font-bold text-neutral-900 hover:underline px-1 cursor-pointer"
                        >
                            Inicia sesión
                        </button>
                    </p>
                </div>
            </form>
        </AuthCard>
    );
}

// Forgot password form component
function ForgotPasswordView() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const { signInWithEmail } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await signInWithEmail(email);

        if (error) {
            setError(error.message);
        } else {
            setSuccess(true);
        }
        setLoading(false);
    };

    if (success) {
        return (
            <AuthCard title="¡Listo!">
                <div className="text-center space-y-8 py-6">
                    <div className="flex justify-center">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                            <CheckCircle size={40} weight="fill" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-2xl font-serif text-neutral-900">¡Revisa tu email!</h3>
                        <p className="text-neutral-500 text-base font-medium leading-relaxed max-w-sm mx-auto">
                            Te enviamos un enlace a <span className="font-bold text-neutral-900">{email}</span> para recuperar tu cuenta
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/login')}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-700 hover:text-neutral-900 transition-colors cursor-pointer"
                    >
                        <ArrowLeft size={18} weight="bold" />
                        Volver a iniciar sesión
                    </button>
                </div>
            </AuthCard>
        );
    }

    return (
        <AuthCard title="Recuperar">
            <form id="forgot-password-form" onSubmit={handleSubmit} className="space-y-6">
                <p className="text-sm text-neutral-500 font-medium leading-relaxed">
                    Ingresa tu email y te enviaremos un enlace para recuperar tu cuenta.
                </p>

                <div className="flex flex-col gap-2.5">
                    <label htmlFor="forgot-email" className="text-sm font-semibold text-neutral-900">
                        Email
                    </label>
                    <Input
                        id="forgot-email"
                        name="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        autoComplete="email"
                        className="h-13 bg-white border border-neutral-200 rounded-xl text-base font-normal placeholder:text-neutral-400 px-4 focus-visible:ring-0 focus-visible:border-neutral-300 shadow-sm transition-all"
                    />
                </div>

                {error && (
                    <div className="p-4 bg-orange-50 rounded-xl flex items-start gap-3 text-orange-800 animate-in fade-in slide-in-from-top-1">
                        <WarningCircle size={20} weight="fill" className="shrink-0 mt-0.5" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                <div className="space-y-6">
                    <Button
                        type="submit"
                        disabled={loading || !email}
                        className="w-full h-14 rounded-2xl text-base font-semibold bg-neutral-900 text-white hover:bg-neutral-800 transition-all shadow-md active:scale-[0.98] cursor-pointer"
                    >
                        {loading ? 'Enviando...' : 'Enviar enlace'}
                    </Button>

                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="w-full text-center text-sm font-bold text-neutral-700 hover:text-neutral-900 transition-colors cursor-pointer"
                    >
                        Volver a iniciar sesión
                    </button>
                </div>
            </form>
        </AuthCard>
    );
}

// Main wrapper with background
function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/bg-bonimoney.webp')" }}
        >
            {children}
        </div>
    );
}

// Exported views for routing
export function AuthLanding() {
    return <LandingView />;
}

export function AuthLogin() {
    return (
        <AuthLayout>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
                <LoginView />
            </motion.div>
        </AuthLayout>
    );
}

export function AuthRegister() {
    return (
        <AuthLayout>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
                <RegisterView />
            </motion.div>
        </AuthLayout>
    );
}

export function AuthForgotPassword() {
    return (
        <AuthLayout>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
                <ForgotPasswordView />
            </motion.div>
        </AuthLayout>
    );
}

// Default export for backwards compatibility - remove later
export default function DesktopAuthLanding() {
    return <AuthLanding />;
}
