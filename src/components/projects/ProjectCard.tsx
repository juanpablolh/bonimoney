import React from 'react';
import { CaretRight } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
    name: string;
    icon: string;
    balance: number;
    memberCount: number;
    currency: string;
    colorClass?: string;
    isLastStackedCard?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
    name,
    icon,
    memberCount,
    colorClass = 'bg-[oklch(0.25_0.08_145)]',
    isLastStackedCard = false,
}) => {

    return (
        <div className={cn(
            "w-full rounded-2xl p-6 transition-all duration-300 border border-white/5",
            "shadow-xl hover:shadow-2xl hover:-translate-y-1",
            "cursor-pointer active:scale-[0.98] group relative overflow-hidden flex flex-col justify-between",
            "h-[180px]",
            colorClass
        )}>
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-30 pointer-events-none" />

            <div className="relative z-10">
                {/* Top Row: Icon and Actions */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl filter drop-shadow-sm">
                            {icon}
                        </span>
                        <h3 className="text-2xl font-serif text-white tracking-tight leading-tight">
                            {name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()}
                        </h3>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-black/20 backdrop-blur-sm flex items-center justify-center text-white/90 group-hover:text-white group-hover:bg-black/30 transition-all border border-white/5">
                        <CaretRight size={20} weight="bold" />
                    </div>
                </div>
            </div>

            {/* Bottom Section: Balance and Stats */}
            <div className={cn(
                "relative z-10 space-y-4",
                isLastStackedCard && "hidden md:block"
            )}>
                {/* Balance Badge - Hidden in Global Dashboard */}
                {/* <div className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-md self-start transition-all",
                    isPositive
                        ? "bg-green-200 text-green-700"
                        : "bg-red-200 text-red-700"
                )}>
                    <span className="text-sm font-medium">
                        {isPositive ? 'Te deben' : 'Debes'}
                    </span>
                    {isPositive ? <ArrowUpRight size={16} weight="bold" /> : <ArrowDownLeft size={16} weight="bold" />}
                    <div className="flex items-baseline gap-1 font-bold">
                        <span className="text-xs opacity-80">{currency}</span>
                        <span className="text-base tracking-tight">
                            {Math.abs(balance).toLocaleString()}
                        </span>
                    </div>
                </div> */}

                {/* Footer: Member Count & Avatars */}
                <div className="flex items-end justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl font-serif text-white/90 leading-none">
                            {memberCount}
                        </span>
                        <span className="text-lg font-sans text-white/80 leading-none">
                            Integrantes
                        </span>
                    </div>

                    {/* Avatar Stack representation using standard circle style */}
                    <div className="flex -space-x-3">
                        {[...Array(Math.min(memberCount, 3))].map((_, i) => (
                            <div
                                key={i}
                                className="w-10 h-10 rounded-full bg-white border-2 border-transparent flex items-center justify-center overflow-hidden shadow-sm"
                                style={{ zIndex: 3 - i }}
                            >
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}-${i}`}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
