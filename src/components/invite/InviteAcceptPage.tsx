import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getInvitationByToken, acceptInvitationByToken, InvitationDetails } from '@/services/invitations';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, WarningCircle, Users, ArrowRight, Spinner } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

type PageState = 'loading' | 'preview' | 'accepting' | 'accepted' | 'error';

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load invitation details
  useEffect(() => {
    async function loadInvitation() {
      if (!token) {
        setError('Token de invitacion invalido');
        setPageState('error');
        return;
      }

      const result = await getInvitationByToken(token);

      if (!result.success || !result.invitation) {
        setError(result.error || 'Invitacion no encontrada');
        setPageState('error');
        return;
      }

      // If already accepted, redirect to project
      if (result.invitation.status === 'accepted') {
        navigate(`/project/${result.invitation.project_id}`);
        return;
      }

      setInvitation(result.invitation);
      setPageState('preview');
    }

    loadInvitation();
  }, [token, navigate]);

  // Auto-accept when user is authenticated
  useEffect(() => {
    async function autoAccept() {
      if (authLoading || !user || !invitation || pageState !== 'preview') return;

      // Check if email matches
      if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
        setError(`Esta invitacion es para ${invitation.email}. Inicia sesion con ese email.`);
        setPageState('error');
        return;
      }

      setPageState('accepting');

      const result = await acceptInvitationByToken(token!);

      if (!result.success) {
        setError(result.error || 'Error al aceptar la invitacion');
        setPageState('error');
        return;
      }

      setPageState('accepted');

      // Redirect after brief delay
      setTimeout(() => {
        navigate(`/project/${result.projectId}`);
      }, 1500);
    }

    autoAccept();
  }, [user, authLoading, invitation, pageState, token, navigate]);

  // Handle login redirect
  const handleLogin = () => {
    // Store token for processing after login
    localStorage.setItem('pending_invitation_token', token!);
    navigate('/login');
  };

  // Handle signup redirect
  const handleSignup = () => {
    localStorage.setItem('pending_invitation_token', token!);
    navigate('/register');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bonimoney bg-cover bg-center bg-no-repeat">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[400px] bg-neutral-50 rounded-3xl shadow-lg overflow-hidden"
      >
        {/* Header */}
        <div className="bg-neutral-900 px-5 py-5 flex flex-col items-start justify-center">
          <h1 className="font-serif text-3xl leading-none text-white tracking-[-1px]">
            Bonimoney
          </h1>
        </div>

        {/* Body */}
        <div className="p-4">
          <AnimatePresence mode="wait">
            {/* Loading State */}
            {pageState === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 flex flex-col items-center gap-4"
              >
                <Spinner size={32} className="text-neutral-400 animate-spin" />
                <p className="text-neutral-500 text-sm font-medium">Cargando invitacion...</p>
              </motion.div>
            )}

            {/* Preview State (Not Logged In) */}
            {pageState === 'preview' && !user && invitation && (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 pb-2"
              >
                {/* Invitation Card */}
                <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{invitation.project_icon}</div>
                    <div>
                      <p className="text-xs text-neutral-400 font-medium">Te invitaron a</p>
                      <h3 className="text-xl font-serif text-neutral-900">{invitation.project_name}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <Users size={16} weight="fill" />
                    <span>Invitado por <strong className="text-neutral-700">{invitation.inviter_name}</strong></span>
                  </div>
                </div>

                {/* Auth Prompt */}
                <div className="space-y-3">
                  <p className="text-sm text-neutral-600 font-medium text-center">
                    Para unirte necesitas iniciar sesion con <strong className="text-neutral-900">{invitation.email}</strong>
                  </p>

                  <Button
                    onClick={handleLogin}
                    className="w-full h-12 bg-neutral-900 hover:bg-black text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                  >
                    Iniciar sesion
                    <ArrowRight size={18} weight="bold" />
                  </Button>

                  <Button
                    onClick={handleSignup}
                    variant="outline"
                    className="w-full h-12 border-neutral-200 rounded-xl font-semibold"
                  >
                    Crear cuenta
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Accepting State */}
            {pageState === 'accepting' && (
              <motion.div
                key="accepting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 flex flex-col items-center gap-4"
              >
                <Spinner size={32} className="text-neutral-400 animate-spin" />
                <p className="text-neutral-500 text-sm font-medium">Aceptando invitacion...</p>
              </motion.div>
            )}

            {/* Accepted State */}
            {pageState === 'accepted' && invitation && (
              <motion.div
                key="accepted"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 text-center space-y-6"
              >
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                    <CheckCircle size={32} weight="fill" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif text-neutral-900">¡Te uniste!</h3>
                  <p className="text-neutral-500 text-sm font-medium leading-relaxed">
                    Ahora eres parte de <strong className="text-neutral-900">{invitation.project_name}</strong>
                  </p>
                </div>
                <p className="text-xs text-neutral-400">Redirigiendo al proyecto...</p>
              </motion.div>
            )}

            {/* Error State */}
            {pageState === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8 space-y-6"
              >
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center">
                    <WarningCircle size={32} weight="fill" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-serif text-neutral-900">Algo salio mal</h3>
                  <p className="text-neutral-500 text-sm font-medium leading-relaxed">
                    {error}
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/')}
                  className="w-full h-12 bg-neutral-900 hover:bg-black text-white rounded-xl font-semibold"
                >
                  Ir al inicio
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
