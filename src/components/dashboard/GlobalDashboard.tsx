import React, { useState, useEffect } from 'react';
import { ProjectStack } from '../projects/ProjectStack';
import { Plus } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getMemberAvatarColor } from '../../utils/avatarColors';
import { supabase } from '../../utils/supabase';

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
}

interface GlobalDashboardProps {
    projects: Project[];
    onProjectClick: (id: string) => void;
    onCreateProject: () => void;
    onDeleteProject: (id: string) => Promise<void>;
    userName?: string;
}

export const GlobalDashboard: React.FC<GlobalDashboardProps> = ({
    projects,
    onProjectClick,
    onCreateProject,
    onDeleteProject,
    userName = "Usuario"
}) => {
    const [projectMembers, setProjectMembers] = useState<Record<string, Member[]>>({});

    // Fetch members for all projects
    useEffect(() => {
        const fetchAllMembers = async () => {
            if (projects.length === 0) return;

            const membersMap: Record<string, Member[]> = {};

            for (const project of projects) {
                const { data, error } = await supabase
                    .from('project_members')
                    .select('id, name, project_id')
                    .eq('project_id', project.id)
                    .eq('status', 'accepted')
                    .order('created_at', { ascending: true });

                if (!error && data) {
                    membersMap[project.id] = data;
                }
            }

            setProjectMembers(membersMap);
        };

        fetchAllMembers();
    }, [projects]);

    return (
        <div className="min-h-screen bg-neutral-50 selection:bg-neutral-200">
            {/* Figma-aligned Header / Breadcrumb */}
            <header className="bg-white sticky top-0 z-40 border-b border-neutral-100 flex-shrink-0">
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
                            const colors = getMemberAvatarColor({ name: userName });
                            return (
                                <Avatar className="w-12 h-12">
                                    <AvatarImage src="" />
                                    <AvatarFallback
                                        className="font-bold"
                                        style={{ backgroundColor: colors.bg, color: colors.text }}
                                    >
                                        {userName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            );
                        })()}

                        <button
                            onClick={onCreateProject}
                            className="w-12 h-12 rounded-xl bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-800 transition-colors shadow-lg"
                        >
                            <Plus size={20} weight="bold" />
                        </button>
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
                        className="font-serif text-6xl md:text-7xl text-neutral-900 tracking-tighter leading-[0.9]"
                    >
                        Hola<br />
                        <span className="text-neutral-400">{userName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}.</span>
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
        </div>
    );
};
