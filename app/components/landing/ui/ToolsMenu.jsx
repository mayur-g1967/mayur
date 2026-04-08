'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Mic,
    Users,
    GraduationCap,
    Brain,
    ChevronDown,
    Rocket
} from 'lucide-react';

const tools = [
    {
        title: 'Dashboard',
        description: 'View your progress, analytics, and active learning modules.',
        icon: LayoutDashboard,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        link: '/dashboard'
    },
    {
        title: 'Confidence Coach',
        description: 'Practice communication with real-time AI feedback and analysis.',
        icon: Mic,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
        link: '/confidence-coach'
    },
    {
        title: 'Social Mentor',
        description: 'Navigate social scenarios with personalized AI roleplay.',
        icon: Users,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        link: '/social-mentor'
    },
    {
        title: 'Micro-Learning',
        description: 'Bite-sized, personalized lessons to build skills fast.',
        icon: GraduationCap,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        link: '/micro-learning'
    },
    {
        title: 'InQuizzo',
        description: 'Test your knowledge with dynamic, AI-generated quizzes.',
        icon: Brain,
        color: 'text-primary',
        bg: 'bg-primary/10',
        link: '/inquizzo'
    }
];

export function ToolsMenu() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className="relative"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2">
                Tools
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="w-4 h-4" />
                </motion.div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Invisible bridge to prevent dropdown from closing when moving mouse to it */}
                        <div className="absolute top-full left-0 w-full h-2 z-10" />

                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-[600px] z-50 origin-top"
                        >
                            <div className="bg-background/80 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-3xl p-6 shadow-2xl overflow-hidden grid grid-cols-2 gap-4">
                                {/* Background Glows */}
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 blur-[100px] pointer-events-none" />
                                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/10 blur-[100px] pointer-events-none" />

                                {tools.map((tool, index) => (
                                    <motion.div
                                        key={tool.title}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group relative p-4 rounded-2xl hover:bg-white/5 dark:hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer overflow-hidden"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`p-2 rounded-xl ${tool.bg} ${tool.color} group-hover:scale-110 transition-transform duration-300`}>
                                                <tool.icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                                        {tool.title}
                                                    </h4>
                                                    <Rocket className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 -translate-x-1 transition-all text-primary" />
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                                    {tool.description}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}

                                {/* Bottom Footer Area */}
                                <div className="col-span-2 mt-2 pt-4 border-t border-white/5 flex items-center justify-between px-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                                            Explore our full ecosystem
                                        </span>
                                    </div>
                                    <button className="text-[10px] uppercase tracking-wider font-bold text-primary hover:underline underline-offset-4">
                                        View All Features
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
