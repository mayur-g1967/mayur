'use client'

import Link from 'next/link';
import { Theme } from '../shared/header/HeaderComponents';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { LoginButton } from './ui/MagneticButtons';
import { ToolsMenu } from './ui/ToolsMenu';
import { MobileMenu } from './ui/MobileMenu';
import Image from 'next/image';
import { Assets } from '@/assets/assets';

export default function LandingHeader() {
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme } = useTheme();

    // Prevent hydration mismatch for theme-dependent styles
    useEffect(() => {
        setMounted(true);
    }, []);

    const isLight = mounted && resolvedTheme === 'light';
    const isDarkMode = mounted && resolvedTheme === 'dark';

    const handleScrollToSection = (e, id) => {
        e.preventDefault();
        const section = document.getElementById(id);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="fixed top-0 z-50 w-full">
            <header
                className='w-full text-foreground px-4 bg-transparent backdrop-blur-md border-b border-black/5 dark:border-white/5 shadow-none transition-colors duration-300'
            >
                <div className="h-16 flex flex-row items-center justify-between gap-4 max-w-[120rem] mx-auto">
                    {/* Left: Logo */}
                    <div className="flex items-center gap-2 shrink-0">
                        <Link href="/" className="flex items-center gap-2 group">
                            {mounted && (
                                <Image
                                    src={isDarkMode ? Assets.logo_dark : Assets.logo_light}
                                    className="w-10 h-10 transition-transform duration-300 group-hover:scale-105"
                                    alt="PersonaAI Logo"
                                />
                            )}
                            <p className='text-xl md:text-2xl font-bold tracking-tight'>
                                <span className="text-foreground group-hover:text-primary transition-colors">Persona</span><span className="group-hover:text-foreground transition-colors text-primary">AI</span>
                            </p>
                        </Link>
                    </div>

                    {/* Center: Navigation */}
                    <nav className='hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2'>
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                            Home
                        </a>
                        <ToolsMenu />
                        <a
                            href="#about"
                            onClick={(e) => handleScrollToSection(e, 'about')}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                            About
                        </a>
                    </nav>

                    {/* Right: Theme + Login */}
                    <div className='flex items-center gap-4 shrink-0'>
                        <Theme />
                        <Link href="/login" className="hidden sm:block">
                            <LoginButton />
                        </Link>
                        <MobileMenu />
                    </div>
                </div>
            </header>
        </div>
    );
}
