import React, { useState } from 'react';
import { Modal, TextInput, TextArea, Select, SelectItem } from '@carbon/react';
import EmojiPicker from 'emoji-picker-react';
import { useProject } from '../../contexts/ProjectContext';

interface CreateProjectModalProps {
    open: boolean;
    onClose: () => void;
}

const CURRENCIES = [
    { value: 'CLP', label: '🇨🇱 Peso Chileno (CLP)' },
    { value: 'USD', label: '🇺🇸 Dólar (USD)' },
    { value: 'EUR', label: '🇪🇺 Euro (EUR)' },
    { value: 'ARS', label: '🇦🇷 Peso Argentino (ARS)' },
    { value: 'BRL', label: '🇧🇷 Real (BRL)' },
    { value: 'MXN', label: '🇲🇽 Peso Mexicano (MXN)' },
    { value: 'COP', label: '🇨🇴 Peso Colombiano (COP)' },
];

export function CreateProjectModal({ open, onClose }: CreateProjectModalProps) {
    const { createProject } = useProject();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [currency, setCurrency] = useState('CLP');
    const [icon, setIcon] = useState('📊');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError('El nombre del proyecto es obligatorio');
            return;
        }

        try {
            setLoading(true);
            setError('');

            await createProject({
                name: name.trim(),
                description: description.trim() || undefined,
                currency,
                icon,
            });

            // Reset form
            setName('');
            setDescription('');
            setCurrency('CLP');
            setIcon('📊');
            onClose();
        } catch (err) {
            console.error('Error creating project:', err);
            setError('Error al crear el proyecto. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleEmojiClick = (emojiData: any) => {
        setIcon(emojiData.emoji);
        setShowEmojiPicker(false);
    };

    return (
        <Modal
            open={open}
            onRequestClose={onClose}
            modalHeading="Crear Nuevo Proyecto"
            primaryButtonText={loading ? 'Creando...' : 'Crear Proyecto'}
            secondaryButtonText="Cancelar"
            onRequestSubmit={handleSubmit}
            onSecondarySubmit={onClose}
            primaryButtonDisabled={loading || !name.trim()}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {error && (
                    <div style={{ padding: '0.75rem', background: '#fff1f1', color: '#da1e28', borderRadius: '4px' }}>
                        {error}
                    </div>
                )}

                <TextInput
                    id="project-name"
                    labelText="Nombre del Proyecto"
                    placeholder="Ej: Viaje a la Playa"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    required
                />

                <TextArea
                    id="project-description"
                    labelText="Descripción (opcional)"
                    placeholder="Ej: Vacaciones de verano 2026"
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                    rows={3}
                />

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                        Ícono del Proyecto
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            style={{
                                fontSize: '2rem',
                                padding: '0.5rem 1rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                background: 'white',
                                cursor: 'pointer',
                            }}
                        >
                            {icon}
                        </button>
                        <span style={{ color: '#666', fontSize: '0.875rem' }}>
                            Click para cambiar el ícono
                        </span>
                    </div>
                    {showEmojiPicker && (
                        <div style={{ marginTop: '0.5rem' }}>
                            <EmojiPicker onEmojiClick={handleEmojiClick} width="100%" height="300px" />
                        </div>
                    )}
                </div>

                <Select
                    id="project-currency"
                    labelText="Moneda"
                    value={currency}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCurrency(e.target.value)}
                >
                    {CURRENCIES.map(curr => (
                        <SelectItem key={curr.value} value={curr.value} text={curr.label} />
                    ))}
                </Select>

                <div style={{ padding: '0.75rem', background: '#f4f4f4', borderRadius: '4px', fontSize: '0.875rem' }}>
                    <strong>💡 Tip:</strong> Cada proyecto es independiente. Puedes tener "Viaje a la Playa" en CLP y
                    "Supermercado" en USD sin que se mezclen.
                </div>
            </div>
        </Modal>
    );
}
