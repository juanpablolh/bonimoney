import React, { useState, useEffect } from 'react';
import { ProjectStack } from '../projects/ProjectStack';
import { Plus } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getMemberAvatarColor } from '../../utils/avatarColors';
import { supabase } from '../../utils/supabase';
import { capitalizeName } from '../../utils/calculations';

interface Project {
    id: string;
    name: string;
    icon: string;
    currency: string;
    balance?: number;
    memberCount?: number;
    color?: string;
}

interface Member {
    id: string;
    name: string;
    project_id: string;
    user_id?: string;
    avatar_url?: string;
}

interface GlobalDashboardProps {
    projects: Project[];
    onProjectClick: (id: string) => void;
    onCreateProject: () => void;
    onDeleteProject: (id: string) => Promise<void>;
    userName?: string;
    userId?: string;
    userAvatarUrl?: string;
    onOpenSettings?: () => void;
}

export const GlobalDashboard: React.FC<GlobalDashboardProps> = ({
    projects,
    onProjectClick,
    onCreateProject,
    onDeleteProject,
    userName = "Usuario",
    userId,
    userAvatarUrl,
    onOpenSettings
}) => {
    const [projectMembers, setProjectMembers] = useState<Record<string, Member[]>>({});

    // Fetch members for all projects (optimized with RPC function + fallback)
    useEffect(() => {
        const fetchAllMembers = async () => {
            if (projects.length === 0) {
                setProjectMembers({});
                return;
            }

            try {
                // Try RPC function first for parallel fetching (1 query instead of N)
                const projectIds = projects.map(p => p.id);

                const { data, error } = await supabase
                    .rpc('get_all_project_members', { project_ids: projectIds });

                // If RPC function doesn't exist yet (PGRST202), fallback to sequential queries
                if (error?.code === 'PGRST202') {
                    console.warn('RPC function not found, using fallback method. Execute supabase/migrations/create_get_all_project_members.sql for better performance');

                    // Fallback: sequential queries (old method)
                    const membersMap: Record<string, Member[]> = {};
                    for (const project of projects) {
                        const { data: memberData, error: memberError } = await supabase
                            .from('project_members')
                            .select('id, name, project_id, user_id, avatar_url')
                            .eq('project_id', project.id)
                            .eq('status', 'accepted')
                            .order('created_at', { ascending: true });

                        if (!memberError && memberData) {
                            membersMap[project.id] = memberData;
                        }
                    }
                    setProjectMembers(membersMap);
                    return;
                }

                if (error) {
                    console.error('Error fetching project members:', error);
                    return;
                }

                // Group members by project_id
                const membersMap: Record<string, Member[]> = {};
                data?.forEach((member: Member) => {
                    if (!membersMap[member.project_id]) {
                        membersMap[member.project_id] = [];
                    }
                    membersMap[member.project_id].push(member);
                });

                setProjectMembers(membersMap);
            } catch (error) {
                console.error('Error in fetchAllMembers:', error);
            }
        };

        fetchAllMembers();
    }, [projects]); // Solo recargar cuando cambian los proyectos

    return (
        <div className="min-h-screen bg-neutral-50 selection:bg-neutral-200">
            {/* Figma-aligned Header / Breadcrumb */}
            <header className="bg-neutral-50 sticky top-0 z-40 border-b border-neutral-200 flex-shrink-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                    {/* Left: Title */}
                    <div className="flex items-center gap-2">
                        <h1 className="font-serif text-2xl text-neutral-900 tracking-tight">
                            Bonimoney
                        </h1>
                    </div>

                    {/* Right: Avatar + Plus Button */}
                    <div className="flex items-center gap-4">
                        {(() => {
                            const colors = getMemberAvatarColor({ name: userName, user_id: userId });
                            return (
                                <button
                                    onClick={onOpenSettings}
                                    className="rounded-full transition-transform hover:scale-105 active:scale-95 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900"
                                >
                                    <Avatar className="w-10 h-10 cursor-pointer border border-neutral-100">
                                        <AvatarImage src={userAvatarUrl} className="object-cover" />
                                        <AvatarFallback
                                            className="font-bold"
                                            style={{ backgroundColor: colors.bg, color: colors.text }}
                                        >
                                            {userName.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>
                            );
                        })()}


                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-32">

                {/* Personalized Greeting */}
                <section className="mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="font-serif text-[56px] text-neutral-900 tracking-tighter leading-[0.9]"
                    >
                        Hola<br />
                        <span className="text-neutral-400">{capitalizeName(userName)}.</span>
                    </motion.h1>
                </section>

                <div className="space-y-6 rounded-b-[20px] h-fit overflow-visible md:h-auto md:overflow-visible pt-12">
                    <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                        className="font-serif text-2xl text-neutral-900 tracking-tight"
                    >
                        Tus grupos
                    </motion.h3>

                    {!projects.length ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-8 bg-neutral-100 rounded-[3rem]">
                            <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl shadow-neutral-200/50 flex items-center justify-center text-5xl rotate-3">
                                📂
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xl font-serif text-neutral-900">Empieza aquí</h4>
                                <p className="text-neutral-500 font-medium text-sm">Crea tu primer proyecto para dividir gastos.</p>
                            </div>
                            <Button
                                onClick={onCreateProject}
                                className="rounded-2xl px-8"
                            >
                                Crear proyecto
                            </Button>
                        </div>
                    ) : (
                        <ProjectStack
                            projects={projects}
                            projectMembers={projectMembers}
                            onProjectClick={onProjectClick}
                            onDeleteProject={onDeleteProject}
                        />
                    )}
                </div>
            </main>

            {/* Floating Action Button - Mobile */}
            <button
                onClick={onCreateProject}
                className="fixed bottom-8 right-5 w-14 h-14 rounded-full bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-800 transition-all hover:scale-110 active:scale-95 shadow-2xl z-50 sm:hidden"
            >
                <Plus size={24} weight="bold" />
            </button>

            {/* Floating Action Button - Desktop */}
            <button
                onClick={onCreateProject}
                className="hidden sm:flex fixed bottom-10 right-10 w-16 h-16 rounded-2xl bg-neutral-900 text-white items-center justify-center hover:bg-neutral-800 transition-all hover:scale-110 active:scale-95 shadow-2xl z-50"
            >
                <Plus size={28} weight="bold" />
            </button>
        </div>
    );
};
