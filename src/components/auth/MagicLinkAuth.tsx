import { useState } from 'react';
import { TextInput, Button, InlineNotification } from '@carbon/react';
import { Email, ArrowRight } from '@carbon/icons-react';
import { useAuth } from '../../contexts/AuthContext';

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

    if (sent) {
        return (
            <div style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem' }}>
                <InlineNotification
                    kind="success"
                    title="¡Revisa tu email!"
                    subtitle={`Hemos enviado un link mágico a ${email}. Haz clic en el link para iniciar sesión.`}
                    lowContrast
                    hideCloseButton
                />
                <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                    No ves el email? Revisa tu carpeta de spam o{' '}
                    <button
                        onClick={() => setSent(false)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--cds-link-primary)',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                        }}
                    >
                        intenta de nuevo
                    </button>
                    .
                </p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Email size={48} style={{ color: 'var(--cds-icon-primary)', marginBottom: '1rem' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Iniciar Sesión
                </h2>
                <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
                    Te enviaremos un link mágico a tu email.
                    <br />
                    Sin contraseñas, sin complicaciones.
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <TextInput
                    id="email"
                    type="email"
                    labelText="Email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    style={{ marginBottom: '1rem' }}
                />

                {error && (
                    <InlineNotification
                        kind="error"
                        title="Error"
                        subtitle={error}
                        lowContrast
                        hideCloseButton
                        style={{ marginBottom: '1rem' }}
                    />
                )}

                <Button
                    type="submit"
                    kind="primary"
                    size="lg"
                    disabled={loading || !email}
                    renderIcon={ArrowRight}
                    style={{ width: '100%' }}
                >
                    {loading ? 'Enviando...' : 'Enviar link mágico'}
                </Button>
            </form>

            <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--cds-text-secondary)', textAlign: 'center' }}>
                Al continuar, aceptas nuestros{' '}
                <a href="/terms-of-service.html" target="_blank" style={{ color: 'var(--cds-link-primary)' }}>
                    Términos de Servicio
                </a>
                {' '}y{' '}
                <a href="/privacy-policy.html" target="_blank" style={{ color: 'var(--cds-link-primary)' }}>
                    Política de Privacidad
                </a>
                .
            </p>
        </div>
    );
}
