import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { processPendingInvitations } from '../services/invitations';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signInWithEmail: (email: string, name?: string) => Promise<{ error: AuthError | null }>;
    signInWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signUp: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>;
    resetPassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            // Hack: Update name if just logged in via HomeLogin
            if (session?.user && _event === 'SIGNED_IN') {
                const tempName = localStorage.getItem('temp_login_name');
                if (tempName) {
                    const currentName = session.user.user_metadata.full_name;
                    if (!currentName || currentName !== tempName) {
                        try {
                            const { data, error } = await supabase.auth.updateUser({
                                data: { full_name: tempName }
                            });
                            if (!error && data.user) {
                                setUser(data.user); // Update local state immediately
                            }
                        } catch {
                            // Silent fail - non-critical metadata update
                        }
                    }
                    localStorage.removeItem('temp_login_name');
                }

                // Process any pending invitations for this user (non-blocking)
                processPendingInvitations()
                    .then(acceptedCount => {
                        if (acceptedCount > 0) {
                            window.dispatchEvent(new CustomEvent('invitations-accepted', {
                                detail: { count: acceptedCount }
                            }));
                        }
                    })
                    .catch(() => { /* Silent fail - non-blocking operation */ });
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithEmail = async (email: string, name?: string) => {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin,
                data: name ? { full_name: name } : undefined,
            },
        });
        return { error };
    };

    const signInWithPassword = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error };
    };

    const signUp = async (email: string, password: string, name: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin,
                data: { full_name: name },
            },
        });
        return { error };
    };

    const resetPassword = async (newPassword: string) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        return { error };
    };

    const signOut = async () => {
        localStorage.removeItem('currentProjectId');
        await supabase.auth.signOut();
        // Force clear local state in case onAuthStateChange doesn't fire
        setUser(null);
        setSession(null);
    };

    const value = {
        user,
        session,
        loading,
        signInWithEmail,
        signInWithPassword,
        signUp,
        resetPassword,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
