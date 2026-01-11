import { useState } from 'react';
import { Dropdown } from '@carbon/react';
import { useProject } from '../../contexts/ProjectContext';
import { useAuth } from '../../contexts/AuthContext';
import { CreateProjectModal } from './CreateProjectModal';

export function ProjectSelector() {
    const { user } = useAuth();
    const { currentProject, projects, setCurrentProject, loading } = useProject();
    const [createModalOpen, setCreateModalOpen] = useState(false);

    if (!user) {
        return null; // Don't show if not authenticated
    }

    if (loading) {
        return (
            <div style={{ padding: '0.5rem', color: '#666', fontSize: '0.875rem' }}>
                Cargando proyectos...
            </div>
        );
    }

    const handleProjectChange = (selectedItem: any) => {
        if (selectedItem.selectedItem?.id === 'create-new') {
            setCreateModalOpen(true);
        } else {
            const project = projects.find(p => p.id === selectedItem.selectedItem?.id);
            if (project) {
                setCurrentProject(project);
            }
        }
    };

    const items = [
        ...projects.map(p => ({
            id: p.id,
            label: `${p.icon} ${p.name}`,
            value: p.id,
        })),
        {
            id: 'create-new',
            label: '➕ Crear Nuevo Proyecto',
            value: 'create-new',
        },
    ];

    return (
        <>
            <div style={{ minWidth: '250px' }}>
                <Dropdown
                    id="project-selector"
                    titleText=""
                    label={currentProject ? `${currentProject.icon} ${currentProject.name}` : 'Seleccionar Proyecto'}
                    items={items}
                    itemToString={(item) => item?.label || ''}
                    onChange={handleProjectChange}
                    selectedItem={currentProject ? items.find(i => i.id === currentProject.id) : null}
                />
            </div>

            <CreateProjectModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
            />
        </>
    );
}
