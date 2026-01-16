import React from 'react';
import { CaretRight } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getMemberAvatarColor } from '../../utils/avatarColors';

import { ProjectTheme } from '@/utils/projectTheme';

interface Member {
    id: string;
    name: string;
    project_id: string;
    user_id?: string;
    avatar_url?: string;
}

interface ProjectCardProps {
    name: string;
    icon: string;
    balance: number;
    memberCount: number;
    members: Member[];
    currency: string;
    theme: ProjectTheme;
    isLastStackedCard?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
    name,
    icon,
    memberCount,
    members,
    theme,
    isLastStackedCard = false,
}) => {

    return (
        <div
            className={cn(
                "w-full rounded-2xl p-6 transition-all duration-300",
                "shadow-xl hover:shadow-2xl hover:-translate-y-1",
                "cursor-pointer active:scale-[0.98] group relative overflow-hidden flex flex-col justify-between",
                "h-[180px]"
            )}
            style={{
                backgroundColor: theme.bgColor,
            }}
        >
            {/* Overlay (Glossy or Gradient) */}
            <div className={cn(
                "absolute inset-0 pointer-events-none transition-opacity duration-300",
                theme.overlay || "bg-gradient-to-br from-white/5 to-transparent opacity-30"
            )} />

            <div className="relative z-10">
                {/* Top Row: Icon and Actions */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl filter drop-shadow-sm">
                            {icon}
                        </span>
                        <h3
                            className="text-2xl font-serif tracking-tight leading-tight"
                            style={{ color: theme.textColor }}
                        >
                            {name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()}
                        </h3>
                    </div>
                    <div
                        className={cn(
                            "w-12 h-12 rounded-lg flex items-center justify-center transition-all",
                            "backdrop-blur-sm",
                            "group-hover:scale-105"
                        )}
                        style={{
                            backgroundColor: theme.iconBgColor,
                            color: theme.iconTextColor
                        }}
                    >
                        <CaretRight size={20} weight="bold" />
                    </div>
                </div>
            </div>

            {/* Bottom Section: Balance and Stats */}
            <div className={cn(
                "relative z-10 space-y-4",
                isLastStackedCard && "hidden md:block"
            )}>
                {/* Footer: Member Count & Avatars */}
                <div className="flex items-end justify-between">
                    <div className="flex items-center gap-3">
                        <span
                            className="text-3xl font-serif leading-none"
                            style={{ color: theme.textColor }}
                        >
                            {memberCount}
                        </span>
                        <span
                            className="text-lg font-sans leading-none"
                            style={{ color: theme.mutedTextColor }}
                        >
                            Integrantes
                        </span>
                    </div>

                    {/* Avatar Stack using Shadcn Avatar components */}
                    <div className="flex -space-x-3">
                        {members.slice(0, Math.min(memberCount, 3)).map((member, i) => {
                            const colors = getMemberAvatarColor(member);
                            const initial = member.name.charAt(0).toUpperCase();

                            return (
                                <Avatar
                                    key={member.id}
                                    className="w-10 h-10 border-2 border-white shadow-sm"
                                    style={{ zIndex: 3 - i }}
                                >
                                    <AvatarImage src={member.avatar_url} className="object-cover" />
                                    <AvatarFallback
                                        className="text-sm font-bold"
                                        style={{ backgroundColor: colors.bg, color: colors.text }}
                                    >
                                        {initial}
                                    </AvatarFallback>
                                </Avatar>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
