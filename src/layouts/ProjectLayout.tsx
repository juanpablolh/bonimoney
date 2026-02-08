import { Outlet, useNavigate, useParams, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { SettingsDrawer } from '@/components/settings/SettingsDrawer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getMemberAvatarColor } from '@/utils/avatarColors';
import { House, CaretLeft } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export function ProjectLayout() {
    const { projectId } = useParams<{ projectId: string }>();
    const { user } = useAuth();
    const { projects, setCurrentProject, currentProject } = useProject();
    const navigate = useNavigate();
    const location = useLocation();
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Set current project based on URL parameter
    useEffect(() => {
        if (projectId && projects.length > 0) {
            const project = projects.find(p => p.id === projectId);
            if (project) {
                setCurrentProject(project);
            } else {
                navigate('/');
            }
        }
    }, [projectId, projects, setCurrentProject, navigate]);

    // Determine if we're on the overview page
    const isOverview = location.pathname === `/projects/${projectId}`;

    // Get user avatar colors
    const avatarColors = getMemberAvatarColor({
        name: user?.user_metadata?.full_name || user?.email?.split('@')[0],
        user_id: user?.id
    });

    return (
        <div className="min-h-screen flex flex-col bg-neutral-100 lg:h-screen lg:overflow-hidden">
            <SettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} />

            {/* Header */}
            <header className="bg-neutral-50 sticky top-0 z-40 border-b border-neutral-200 flex-shrink-0">
                <div className="max-w-[1280px] mx-auto px-4 py-3 flex items-center justify-between">
                    {/* Left: Back button + Title */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (isOverview) {
                                    navigate('/');
                                } else {
                                    navigate(`/projects/${projectId}`);
                                }
                            }}
                            className="w-12 h-9 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors flex items-center justify-center"
                        >
                            {isOverview ? (
                                <House size={16} weight="regular" />
                            ) : (
                                <CaretLeft size={16} weight="bold" />
                            )}
                        </button>

                        <h1 className="font-serif text-2xl text-neutral-900 tracking-tight">
                            Bonimoney
                        </h1>
                    </div>

                    {/* Right: Avatar */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSettingsOpen(true)}
                            className="rounded-full transition-transform hover:scale-105 active:scale-95 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900"
                        >
                            <Avatar className="w-10 h-10 cursor-pointer border border-neutral-100">
                                <AvatarImage src={user?.user_metadata?.avatar_url} />
                                <AvatarFallback
                                    className="font-bold"
                                    style={{ backgroundColor: avatarColors.bg, color: avatarColors.text }}
                                >
                                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </div>
                </div>

                {/* Navigation - All Screens */}
                <nav className="border-t border-neutral-200">
                    <div className="max-w-[1280px] mx-auto px-4 flex gap-1 pt-2">
                        <NavLink
                            to={`/projects/${projectId}`}
                            end
                            className={({ isActive }) =>
                                cn(
                                    "px-3 py-3 text-sm font-medium transition-colors relative",
                                    isActive
                                        ? "text-neutral-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-neutral-900"
                                        : "text-neutral-500 hover:text-neutral-700"
                                )
                            }
                        >
                            Resumen
                        </NavLink>
                        <NavLink
                            to={`/projects/${projectId}/expenses`}
                            className={({ isActive }) =>
                                cn(
                                    "px-3 py-3 text-sm font-medium transition-colors relative",
                                    isActive
                                        ? "text-neutral-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-neutral-900"
                                        : "text-neutral-500 hover:text-neutral-700"
                                )
                            }
                        >
                            Gastos
                        </NavLink>
                        <NavLink
                            to={`/projects/${projectId}/members`}
                            className={({ isActive }) =>
                                cn(
                                    "px-3 py-3 text-sm font-medium transition-colors relative",
                                    isActive
                                        ? "text-neutral-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-neutral-900"
                                        : "text-neutral-500 hover:text-neutral-700"
                                )
                            }
                        >
                            Integrantes
                        </NavLink>
                        <NavLink
                            to={`/projects/${projectId}/settings`}
                            className={({ isActive }) =>
                                cn(
                                    "px-3 py-3 text-sm font-medium transition-colors relative",
                                    isActive
                                        ? "text-neutral-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-neutral-900"
                                        : "text-neutral-500 hover:text-neutral-700"
                                )
                            }
                        >
                            Ajustes
                        </NavLink>
                    </div>
                </nav>
            </header>

            {/* Main Content */}
            <main className="flex-1 min-h-0 max-w-[1280px] w-full mx-auto px-4 pt-8 pb-12 lg:py-4 flex flex-col bg-neutral-50 overflow-y-auto">
                <Outlet />
            </main>


        </div>
    );
}
