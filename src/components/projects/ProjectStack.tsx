import React from 'react';
import { motion } from 'framer-motion';
import { ProjectCard } from './ProjectCard';
import { getProjectTheme } from '@/utils/projectTheme';

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
}

interface ProjectStackProps {
    projects: Project[];
    projectMembers: Record<string, Member[]>;
    onProjectClick: (id: string) => void;
    onDeleteProject: (id: string) => Promise<void>;
}

export const ProjectStack: React.FC<ProjectStackProps> = ({ projects, projectMembers, onProjectClick }) => {

    if (projects.length === 0) {
        return null; // Handled by GlobalDashboard empty state
    }

    return (
        <div className="w-full h-fit">
            {/* Desktop: Grid View | Mobile: Stack View */}
            <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8 lg:gap-10 pb-4 md:pb-0 h-fit">
                {projects.map((project, index) => {
                    const members = projectMembers[project.id] || [];
                    const theme = getProjectTheme(project.color, project.id);

                    return (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                delay: index * 0.1,
                                duration: 0.6,
                                ease: [0.23, 1, 0.32, 1]
                            }}
                            whileHover={{
                                y: -8,
                                transition: { duration: 0.3, ease: "easeOut" }
                            }}
                            onClick={() => onProjectClick(project.id)}
                            className="w-full md:h-full relative first:mt-0 -mt-[100px] md:mt-0 transition-transform duration-300 ease-out"
                            style={{
                                zIndex: index,
                                boxShadow: index > 0 ? '0 -15px 40px -10px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            <ProjectCard
                                name={project.name}
                                icon={project.icon}
                                balance={project.balance || 0}
                                memberCount={project.memberCount || 0}
                                members={members}
                                currency={project.currency}
                                theme={theme}
                                isLastStackedCard={projects.length > 4 && index === projects.length - 1}
                            />
                        </motion.div>
                    );
                })}
            </div>
        </div >
    );
};

