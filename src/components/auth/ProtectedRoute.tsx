import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
                    <p className="text-xs font-black uppercase tracking-widest text-neutral-400">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
