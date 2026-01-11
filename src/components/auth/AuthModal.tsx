import { Modal, Button } from '@carbon/react';
import { Login } from '@carbon/icons-react';
import MagicLinkAuth from './MagicLinkAuth';

interface AuthModalProps {
    open: boolean;
    onClose: () => void;
    reason?: string;
}

export default function AuthModal({ open, onClose, reason }: AuthModalProps) {
    return (
        <Modal
            open={open}
            onRequestClose={onClose}
            modalHeading="Iniciar Sesión"
            passiveModal
            size="sm"
        >
            {reason && (
                <p style={{ marginBottom: '1.5rem', color: 'var(--cds-text-secondary)' }}>
                    {reason}
                </p>
            )}
            <MagicLinkAuth />
        </Modal>
    );
}

interface AuthPromptProps {
    onAuthClick: () => void;
}

export function AuthPrompt({ onAuthClick }: AuthPromptProps) {
    return (
        <div
            style={{
                padding: '1.5rem',
                background: 'var(--cds-layer-01)',
                borderRadius: '4px',
                border: '1px solid var(--cds-border-subtle)',
                textAlign: 'center',
                marginBottom: '1rem',
            }}
        >
            <Login size={32} style={{ color: 'var(--cds-icon-primary)', marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Inicia sesión para compartir grupos
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginBottom: '1rem' }}>
                Puedes usar BoniMoney sin cuenta, pero necesitas iniciar sesión para compartir grupos con otros usuarios.
            </p>
            <Button kind="primary" size="md" renderIcon={Login} onClick={onAuthClick}>
                Iniciar sesión
            </Button>
        </div>
    );
}
