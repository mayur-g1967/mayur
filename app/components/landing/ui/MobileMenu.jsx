import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Rocket, LayoutDashboard, Mic, Users, GraduationCap, Brain } from 'lucide-react';
import Link from 'next/link';

const tools = [
    {
        title: 'Dashboard',
        icon: LayoutDashboard,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        link: '/dashboard'
    },
    {
        title: 'Confidence Coach',
        icon: Mic,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
        link: '/confidence-coach'
    },
    {
        title: 'Social Mentor',
        icon: Users,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        link: '/social-mentor'
    },
    {
        title: 'Micro-Learning',
        icon: GraduationCap,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        link: '/micro-learning'
    },
    {
        title: 'InQuizzo',
        icon: Brain,
        color: 'text-primary',
        bg: 'bg-primary/10',
        link: '/inquizzo'
    }
];

export function MobileMenu() {
    const [isOpen, setIsOpen] = useState(false);

    // Prevent scrolling when mobile menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleScrollToSection = (id) => {
        setIsOpen(false);
        setTimeout(() => {
            const section = document.getElementById(id);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        }, 300); // Wait for menu close animation
    };

    return (
        <div className="md:hidden">
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 text-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
                aria-label="Open Mobile Menu"
            >
                <Menu className="w-6 h-6" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
                        />

                        {/* Sliding Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-[300px] h-[100dvh] bg-background/95 backdrop-blur-xl border-l border-border z-[101] shadow-2xl flex flex-col"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-border">
                                <span className="font-bold text-lg font-serif tracking-tight">
                                    Navigation
                                </span>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 py-8">
                                <div className="flex flex-col gap-6">
                                    <button
                                        onClick={() => {
                                            setIsOpen(false);
                                            setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 300);
                                        }}
                                        className="text-left text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
                                    >
                                        Home
                                    </button>

                                    <div className="space-y-4">
                                        <button
                                            onClick={() => handleScrollToSection('ai-tools')}
                                            className="text-left text-lg font-medium text-foreground/80 hover:text-foreground transition-colors flex items-center justify-between w-full"
                                        >
                                            Tools
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full uppercase tracking-widest font-bold">Menu</span>
                                        </button>

                                        <div className="pl-4 border-l border-border flex flex-col gap-3">
                                            {tools.map((tool) => (
                                                <Link
                                                    key={tool.title}
                                                    href={tool.link}
                                                    onClick={() => setIsOpen(false)}
                                                    className="flex items-center gap-3 group py-1"
                                                >
                                                    <div className={`p-1.5 rounded-lg ${tool.bg} ${tool.color}`}>
                                                        <tool.icon className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                                        {tool.title}
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleScrollToSection('about')}
                                        className="text-left text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
                                    >
                                        About
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 border-t border-border mt-auto">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                                            All Systems Go
                                        </span>
                                    </div>
                                    <Rocket className="w-4 h-4 text-primary" />
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
