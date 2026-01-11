import { useState, useEffect } from 'react';
import { Button, Tile } from '@carbon/react';
import { Information } from '@carbon/icons-react';

/**
 * Detecta si la aplicación está corriendo online (no en localhost)
 */
const isOnline = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168.');
};

const COOKIE_CONSENT_KEY = 'split-cookie-consent';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Solo mostrar el banner si está online y no hay consentimiento previo
    if (isOnline()) {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!consent) {
        setShowBanner(true);
      }
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setShowBanner(false);
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
    setShowBanner(false);
    // Si rechaza, limpiar los datos guardados en cookies
    // (opcional, dependiendo de si quieres mantener los datos o no)
  };

  if (!showBanner) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      padding: '1rem',
      maxWidth: '1280px',
      margin: '0 auto'
    }}>
      <Tile style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
          <Information size={24} style={{ flexShrink: 0, marginTop: '0.125rem' }} />
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Uso de Cookies
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', lineHeight: '1.5' }}>
              Utilizamos cookies para guardar tu información y que puedas acceder a ella en futuras visitas. 
              Sin cookies, tus datos se perderán al cerrar el navegador.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0, width: '100%' }}>
          <Button kind="secondary" size="sm" onClick={handleReject} style={{ flex: '1 1 auto' }}>
            Rechazar
          </Button>
          <Button kind="primary" size="sm" onClick={handleAccept} style={{ flex: '1 1 auto' }}>
            Aceptar
          </Button>
        </div>
      </Tile>
    </div>
  );
}
