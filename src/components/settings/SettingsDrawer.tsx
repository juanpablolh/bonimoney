import { useState, useEffect, useRef } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getMemberAvatarColor } from '@/utils/avatarColors';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useProject } from '@/contexts/ProjectContext';
import { supabase } from '@/utils/supabase';
import { toast } from 'sonner';
import { User, SignOut, ShieldWarning, Moon, Sun, PencilSimple, Eye, EyeSlash, X } from '@phosphor-icons/react';
import { compressImage } from '@/utils/imageCompression';

interface SettingsDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsDrawer({ open, onOpenChange }: SettingsDrawerProps) {
    const { user, signOut } = useAuth();
    const { theme, setTheme } = useTheme();
    const { projects } = useProject();

    // Profile state
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    // Avatar state
    const [avatarLoading, setAvatarLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Password state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Initialize state with user data 
    useEffect(() => {
        if (user) {
            setName(user.user_metadata?.full_name || '');
        }
    }, [user, open]);

    const handleUpdateProfile = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: name }
            });

            if (error) throw error;

            toast.success('Perfil actualizado');
        } catch (error) {
            toast.error('Error al actualizar perfil');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Avatar Upload Logic
    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        // 1. Validation
        if (file.size > 5 * 1024 * 1024) { // 5MB limit before compression
            toast.error('La imagen es demasiado grande (máx 5MB)');
            return;
        }

        setAvatarLoading(true);

        try {
            // 2. Compression
            const compressedBlob = await compressImage(file, 500, 0.8);
            const compressedFile = new File([compressedBlob], 'avatar.webp', { type: 'image/webp' });

            // 3. Upload to Supabase
            const fileExt = 'webp';
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, compressedFile, { upsert: true });

            if (uploadError) throw uploadError;

            // 4. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            // 5. Update Profile
            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            if (updateError) throw updateError;

            toast.success('Avatar actualizado');

        } catch (error) {
            console.error('Avatar upload error:', error);
            toast.error('Error al subir la imagen');
        } finally {
            setAvatarLoading(false);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveAvatar = async () => {
        if (!user) return;
        setAvatarLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { avatar_url: null }
            });

            if (error) throw error;
            toast.success('Avatar eliminado');
        } catch (error) {
            console.error('Error removing avatar:', error);
            toast.error('Error al eliminar avatar');
        } finally {
            setAvatarLoading(false);
        }
    };

    // Password Update Logic
    const handleUpdatePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        setPasswordLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            toast.success('Contraseña actualizada');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error('Error al actualizar contraseña');
            console.error(error);
        } finally {
            setPasswordLoading(false);
        }
    };

    // Delete Account Logic
    const handleDeleteAccount = async () => {
        if (!user) return;

        // 1. Check ownership
        const ownedProjects = projects.filter(p => p.owner_id === user.id);

        if (ownedProjects.length > 0) {
            toast.error(`No puedes eliminar tu cuenta mientras seas dueño de ${ownedProjects.length} proyectos. Transfiérelos o elimínalos primero.`);
            return;
        }

        // 2. Confirmation
        const verification = window.prompt('¿Estás seguro? Esta acción es irreversible.\nPara confirmar, escribe "ELIMINAR" en mayúsculas:');

        if (verification !== 'ELIMINAR') {
            if (verification !== null) toast.error('Confirmación incorrecta');
            return;
        }

        // 3. Execution (Mocked request)
        toast.message('Procesando solicitud...', { duration: 1000 });

        setTimeout(() => {
            toast.success('Solicitud de eliminación enviada. Te contactaremos pronto.');
        }, 1500);

        // In a real app, integrate with backend logic here
    };

    const handleSignOut = async () => {
        await signOut();
        onOpenChange(false);
    };

    if (!user) return null;

    const colors = getMemberAvatarColor({ name: user.user_metadata?.full_name || '', user_id: user.id });

    return (
        <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="h-full right-0 inset-y-0 w-full data-[vaul-drawer-direction=right]:w-[90%] sm:max-w-md rounded-l-[32px] rounded-r-none border-l border-neutral-200 outline-none">

                <div className="h-full flex flex-col overflow-hidden bg-white">
                    <DrawerHeader className="px-6 py-6 border-b border-neutral-100 flex-shrink-0 flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <DrawerTitle className="text-2xl font-serif text-neutral-900">Configuración</DrawerTitle>
                            <DrawerDescription>Gestiona tu cuenta y preferencias</DrawerDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-neutral-100 text-neutral-500"
                            onClick={() => onOpenChange(false)}
                        >
                            <X size={20} />
                        </Button>
                    </DrawerHeader>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">

                        {/* Profile Section */}
                        <section className="space-y-4">
                            <h3 className="font-medium text-base text-neutral-500 flex items-center gap-2">
                                <User size={16} /> Perfil
                            </h3>

                            <div className="flex items-center gap-4">
                                <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                                    <Avatar className="w-12 h-12 border-2 border-white transition-opacity">
                                        {avatarLoading ? (
                                            <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 opacity-100 z-10 rounded-full">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neutral-900" />
                                            </div>
                                        ) : null}
                                        <AvatarImage src={user.user_metadata?.avatar_url} className="object-cover" />
                                        <AvatarFallback
                                            className="text-lg font-medium"
                                            style={{ backgroundColor: colors.bg, color: colors.text }}
                                        >
                                            {(name || user.email || 'U').charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 border border-neutral-100 shadow-sm text-neutral-600">
                                        <PencilSimple size={12} weight="regular" />
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                        accept="image/png,image/jpeg,image/webp,image/jpg"
                                    />
                                </div>

                                <div className="flex-1 flex flex-col gap-1">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-neutral-700">Nombre completo</label>
                                        {user.user_metadata?.avatar_url && (
                                            <button
                                                onClick={handleRemoveAvatar}
                                                className="text-xs text-red-500 hover:text-red-700 font-medium"
                                                disabled={avatarLoading}
                                            >
                                                Eliminar foto
                                            </button>
                                        )}
                                    </div>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Tu nombre"
                                        className="bg-neutral-50 border-neutral-200"
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleUpdateProfile}
                                disabled={loading || name === user.user_metadata?.full_name}
                                className="w-full bg-neutral-900 text-white hover:bg-neutral-800"
                            >
                                {loading ? 'Guardando...' : 'Guardar cambios'}
                            </Button>
                        </section>

                        {/* Appearance Section */}
                        <section className="space-y-4">
                            <h3 className="font-medium text-base text-neutral-500 flex items-center gap-2">
                                <Moon size={16} /> Apariencia
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setTheme("light")}
                                    className={`h-20 flex flex-col gap-2 ${theme === 'light' ? 'border-neutral-900 ring-1 ring-neutral-900 bg-neutral-50' : 'border-neutral-200'}`}
                                >
                                    <Sun size={24} weight={theme === 'light' ? 'fill' : 'regular'} />
                                    <span className="text-xs">Claro</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    disabled={true}
                                    className="h-20 flex flex-col gap-2 border-neutral-200 opacity-50 cursor-not-allowed"
                                >
                                    <Moon size={24} />
                                    <span className="text-xs">Oscuro</span>
                                </Button>
                            </div>
                        </section>

                        {/* Accordion Zone (Security & Danger) */}
                        <Accordion type="multiple" className="w-full">
                            {/* Security Section */}
                            <AccordionItem value="security" className="border-b-0">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <h3 className="font-medium text-base text-neutral-500 flex items-center gap-2">
                                        <ShieldWarning size={16} /> Seguridad
                                    </h3>
                                </AccordionTrigger>
                                <AccordionContent className="px-1 pb-1">
                                    <div className="flex flex-col gap-4 pt-2">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-sm font-medium text-neutral-700">Nueva contraseña</label>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    placeholder="Mínimo 6 caracteres"
                                                    className="bg-neutral-50 border-neutral-200 pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                                                >
                                                    {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-sm font-medium text-neutral-700">Confirmar contraseña</label>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="Repite la contraseña"
                                                    className="bg-neutral-50 border-neutral-200 pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                                                >
                                                    {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleUpdatePassword}
                                            disabled={!newPassword || !confirmPassword || passwordLoading}
                                            className="w-full bg-neutral-900 text-white hover:bg-neutral-800"
                                        >
                                            {passwordLoading ? 'Actualizando...' : 'Actualizar contraseña'}
                                        </Button>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Danger Zone */}
                            <AccordionItem value="danger" className="border-b-0">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <h3 className="font-medium text-base text-red-600 flex items-center gap-2">
                                        <ShieldWarning size={16} /> Zona de Peligro
                                    </h3>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="p-4 bg-red-50 rounded-xl border border-red-100 space-y-4 mt-2">
                                        <div>
                                            <h4 className="text-sm font-medium text-red-900">Eliminar cuenta</h4>
                                            <p className="text-xs text-red-700 mt-1">
                                                Esta acción es irreversible. Perderás acceso a todos los proyectos compartidos.
                                            </p>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            onClick={handleDeleteAccount}
                                            className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                                        >
                                            Eliminar mi cuenta
                                        </Button>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>



                    </div>

                    <DrawerFooter className="flex-shrink-0 border-t border-neutral-100 p-6 bg-neutral-50">
                        <p className="text-xs text-center text-neutral-400">
                            Bonimoney v1.0 • Hecho con ❤️
                        </p>
                    </DrawerFooter>
                    <div className="absolute bottom-6 right-6 z-40">
                        <button
                            onClick={handleSignOut}
                            className="rounded-full h-12 w-12 bg-white/80 backdrop-blur-md shadow-lg border border-neutral-100 hover:bg-neutral-50 transition-all active:scale-90 flex items-center justify-center text-neutral-900"
                        >
                            <SignOut size={20} />
                        </button>
                    </div>
                </div>
            </DrawerContent >
        </Drawer >
    );
}
