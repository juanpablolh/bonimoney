import { useState } from 'react';
import { Button, Tile } from '@carbon/react';
import { User, Logout } from '@carbon/icons-react';
import { useAuth } from '../../contexts/AuthContext';

export default function UserProfile() {
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleSignOut = async () => {
        setLoading(true);
        await signOut();
        setLoading(false);
    };

    if (!user) {
        return null;
    }

    return (
        <Tile style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div
                    style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0f62fe 0%, #0353e9 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                    }}
                >
                    <User size={24} />
                </div>
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                        {user.email}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                        Cuenta verificada
                    </p>
                </div>
                <Button
                    kind="ghost"
                    size="sm"
                    renderIcon={Logout}
                    onClick={handleSignOut}
                    disabled={loading}
                >
                    {loading ? 'Saliendo...' : 'Cerrar sesión'}
                </Button>
            </div>
        </Tile>
    );
}
