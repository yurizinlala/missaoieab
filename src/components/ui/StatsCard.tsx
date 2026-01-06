import React, { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, ChevronDown, ChevronUp } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    subValue?: string | number;
    label?: string;
    className?: string;
    icon?: React.ReactNode;
    fullName?: string;
    address?: string;
    pastors?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
    title, value, subValue, label, className, icon,
    fullName, address, pastors
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasDetails = address || pastors;

    return (
        <motion.div
            layout
            onClick={() => hasDetails && setIsExpanded(!isExpanded)}
            className={twMerge(clsx(
                "relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-xl transition-all duration-300 group",
                hasDetails && "cursor-pointer hover:bg-white/20",
                isExpanded ? "p-6 md:p-8 z-50 ring-2 ring-gold/50 bg-deep-blue/80" : "p-4 md:p-6",
                className
            ))}
            role={hasDetails ? "button" : undefined}
            aria-expanded={hasDetails ? isExpanded : undefined}
            tabIndex={hasDetails ? 0 : undefined}
            onKeyDown={(e) => {
                if (hasDetails && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    setIsExpanded(!isExpanded);
                }
            }}
        >
            <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className={clsx(
                    "text-sm md:text-lg font-light tracking-wide text-gray-200 transition-all font-sansation",
                    isExpanded && "text-gold font-bold"
                )}>
                    {isExpanded ? (fullName || title) : title}
                </h3>
                <div className="flex items-center gap-2">
                    {icon && <div className="text-gold opacity-80 group-hover:scale-110 transition-transform">{icon}</div>}
                    {hasDetails && (
                        <div className="text-white/50">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col relative z-10">
                <span className="text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-md font-sansation tabular-nums">
                    {value}
                </span>
                {subValue !== undefined && (
                    <span className="text-xs md:text-sm font-medium text-emerald-400 mt-1 font-sansation">
                        {label}: {subValue}
                    </span>
                )}
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-white/10 space-y-2 md:space-y-3"
                    >
                        {address && (
                            <div className="flex items-start gap-2 md:gap-3 text-xs md:text-sm text-gray-300">
                                <MapPin size={14} className="mt-0.5 text-gold/70 shrink-0" />
                                <span>{address}</span>
                            </div>
                        )}
                        {pastors && (
                            <div className="flex items-start gap-2 md:gap-3 text-xs md:text-sm text-gray-300">
                                <Users size={14} className="mt-0.5 text-gold/70 shrink-0" />
                                <span>{pastors}</span>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Decorative Glow */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-gold/20 blur-3xl rounded-full pointer-events-none transition-opacity duration-500 group-hover:opacity-100" />
            {isExpanded && <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-t from-deep-blue/90 to-transparent pointer-events-none -z-10" />}
        </motion.div>
    );
};
