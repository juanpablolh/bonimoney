import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '@/contexts/ProjectContext';
import { Trash, PencilSimple, Check, X as XIcon } from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { X } from '@phosphor-icons/react';


/**
 * ProjectSettings Component
 * 
 * Project configuration and management page:
 * - View project information (icon, name, creation date)
 * - Edit project name inline
 * - Delete/close project (danger zone)
 * 
 * Features:
 * - Inline editing with keyboard shortcuts (Enter to save, Escape to cancel)
 * - Confirmation dialog before deleting project
 * - Automatic navigation to home after project deletion
 * 
 * Note: This is a centralized settings page. Previously, some of these
 * features were scattered across other pages (e.g., delete in ProjectMembers).
 */
export default function ProjectSettings() {
    const navigate = useNavigate();
    const { currentProject, deleteProject, updateProject } = useProject();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState('');

    // Delete project and navigate to home
    const handleDeleteProject = async () => {
        if (currentProject) {
            await deleteProject(currentProject.id);
            navigate('/');
        }
    };

    const handleEditName = () => {
        setEditedName(currentProject?.name || '');
        setIsEditingName(true);
    };

    const handleSaveName = async () => {
        if (currentProject && editedName.trim()) {
            await updateProject(currentProject.id, { name: editedName.trim() });
            setIsEditingName(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditingName(false);
        setEditedName('');
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">

            {/* ========================================
                SECTION 1: PROJECT INFORMATION CARD
                
                Displays and allows editing of project details:
                - Project icon (emoji)
                - Project name (editable inline)
                - Creation date
                
                Inline editing:
                - Click "Editar Nombre" to enter edit mode
                - Press Enter to save, Escape to cancel
                - Save button disabled if name is empty
            ======================================== */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 space-y-4">
                <div>
                    <h2 className="text-xl font-medium text-neutral-900 mb-6">
                        Información del grupo
                    </h2>
                    <div className="flex flex-col items-center gap-4">
                        <span className="text-5xl">{currentProject?.icon}</span>
                        <div className="flex-1 w-full">
                            {isEditingName ? (
                                <div className="space-y-3">
                                    <Input
                                        value={editedName}
                                        onChange={(e) => setEditedName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveName();
                                            if (e.key === 'Escape') handleCancelEdit();
                                        }}
                                        autoFocus
                                        className="text-base font-medium"
                                        placeholder="Nombre del proyecto"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2 flex-1"
                                            onClick={handleCancelEdit}
                                        >
                                            <XIcon size={16} />
                                            Cancelar
                                        </Button>
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="gap-2 flex-1"
                                            onClick={handleSaveName}
                                            disabled={!editedName.trim()}
                                        >
                                            <Check size={16} />
                                            Guardar
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="font-medium text-neutral-900 text-base text-center">
                                        {currentProject?.name}
                                    </p>
                                    <p className="text-sm text-neutral-500 text-center">
                                        Creado el {currentProject?.created_at ? new Date(currentProject.created_at).toLocaleDateString('es-ES') : ''}
                                    </p>
                                </>
                            )}
                        </div>
                        {!isEditingName && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 w-full"
                                onClick={handleEditName}
                            >
                                <PencilSimple size={16} />
                                Editar Nombre
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* ========================================
                SECTION 2: DANGER ZONE
                
                Destructive action area for closing the project:
                - Permanently deletes the project
                - Deletes all associated expenses and data
                - Cannot be undone
                
                Styled with red/warning colors to indicate danger.
                Requires confirmation dialog before proceeding.
            ======================================== */}
            <div className="bg-red-50 rounded-2xl border border-red-200 shadow-sm p-6 space-y-2">
                <div>
                    <h3 className="text-lg font-medium text-neutral-900 mb-1">
                        Cerrar grupo
                    </h3>
                </div>

                <div className="flex flex-col gap-4 items-center justify-between">
                    <p className="text-sm text-neutral-500">
                        Elimina permanentemente este grupo y todos sus datos
                    </p>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2 w-full"
                        onClick={() => setDeleteDialogOpen(true)}
                    >
                        <Trash size={16} />
                        Cerrar grupo
                    </Button>
                </div>
            </div>

            {/* ========================================
                DIALOG: DELETE PROJECT CONFIRMATION
                
                Final confirmation before deleting the project.
                Warns user that:
                - Action is permanent and cannot be undone
                - All expenses and data will be deleted
                
                On confirmation, deletes project and navigates to home.
            ======================================== */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[440px] border-0 shadow-2xl rounded-[2rem] p-6 gap-0" showCloseButton={false}>
                    <DialogHeader className="flex flex-row items-center justify-between space-y-0 mb-4">
                        <DialogTitle className="text-2xl font-serif font-medium tracking-tight text-neutral-900 text-left leading-tight">
                            Cerrar grupo
                        </DialogTitle>
                        <button
                            onClick={() => setDeleteDialogOpen(false)}
                            className="p-2 hover:bg-neutral-200 rounded-full transition-colors text-neutral-500"
                        >
                            <X size={20} weight="bold" />
                        </button>
                    </DialogHeader>
                    <DialogHeader className="space-y-4">
                        <DialogDescription className="text-neutral-500 font-medium text-left text-base leading-relaxed -mt-4">
                            ¿Estás seguro que quieres cerrar este grupo? Esta acción no se puede deshacer y borrará todos los gastos y datos asociados permanentemente.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end mt-8">
                        <Button
                            variant="outline"
                            size="lg"
                            className="rounded-2xl w-full sm:w-auto"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            size="lg"
                            className="rounded-2xl w-full sm:w-auto"
                            onClick={() => {
                                handleDeleteProject();
                                setDeleteDialogOpen(false);
                            }}
                        >
                            Cerrar grupo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
