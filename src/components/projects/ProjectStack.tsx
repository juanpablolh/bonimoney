import React from 'react';
import { motion } from 'framer-motion';
import { ProjectCard } from './ProjectCard';

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

interface ProjectStackProps {
    projects: Project[];
    projectMembers: Record<string, Member[]>;
    onProjectClick: (id: string) => void;
    onDeleteProject: (id: string) => Promise<void>;
}



// Map project color to OKLCH color
const getColorClass = (projectColor?: string, projectId?: string, fallbackIndex: number = 0): string => {
    const palette = [
        'bg-[oklch(0.25_0.08_145)]', // 0. Emerald
        'bg-[oklch(0.23_0.08_175)]', // 1. Deep Teal
        'bg-[oklch(0.22_0.09_200)]', // 2. Sky
        'bg-[oklch(0.20_0.10_225)]', // 3. Sapphire
        'bg-[oklch(0.20_0.10_250)]', // 4. Indigo
        'bg-[oklch(0.20_0.10_265)]', // 5. Deep Violet
        'bg-[oklch(0.22_0.11_290)]', // 6. Purple
        'bg-[oklch(0.25_0.12_310)]', // 7. Orchid
        'bg-[oklch(0.22_0.12_330)]', // 8. Magenta
        'bg-[oklch(0.22_0.10_350)]', // 9. Rose
        'bg-[oklch(0.25_0.12_15)]',  // 10. Crimson
        'bg-[oklch(0.28_0.10_35)]',  // 11. Red Orange
        'bg-[oklch(0.28_0.09_55)]',  // 12. Burnt Orange
        'bg-[oklch(0.28_0.08_80)]',  // 13. Amber
        'bg-[oklch(0.26_0.07_110)]', // 14. Olive
    ];

    if (projectColor) {
        switch (projectColor) {
            case 'project-emerald': return palette[0];
            case 'project-sky': return palette[2];
            case 'project-indigo': return palette[4];
            case 'project-rose': return palette[9];
            case 'project-amber': return palette[13];
        }
    }

    // Stable fallback based on ID hash
    if (projectId) {
        let hash = 0;
        for (let i = 0; i < projectId.length; i++) {
            hash = projectId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return palette[Math.abs(hash) % palette.length];
    }

    return palette[fallbackIndex % palette.length];
};

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
                                zIndex: index
                            }}
                        >
                            <ProjectCard
                                name={project.name}
                                icon={project.icon}
                                balance={project.balance || 0}
                                memberCount={project.memberCount || 0}
                                members={members}
                                currency={project.currency}
                                colorClass={getColorClass(project.color, project.id, index)}
                                isLastStackedCard={projects.length > 4 && index === projects.length - 1}
                            />
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

