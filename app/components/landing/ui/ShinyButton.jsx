'use client';

import React from 'react';
import { motion } from 'framer-motion';

const animationProps = {
    initial: { '--x': '100%', scale: 0.8 },
    animate: { '--x': '-100%', scale: 1 },
    whileTap: { scale: 0.95 },
    transition: {
        repeat: Infinity,
        repeatType: 'loop',
        repeatDelay: 1,
        type: 'spring',
        stiffness: 20,
        damping: 15,
        mass: 2,
        scale: {
            type: 'spring',
            stiffness: 200,
            damping: 5,
            mass: 0.5,
        },
    },
};

export const ShinyButton = React.forwardRef(({ children, className = '', ...props }, ref) => {
    return (
        <motion.button
            ref={ref}
            className={[
                'relative cursor-pointer rounded-full border border-white/20 px-8 py-3 font-semibold backdrop-blur-2xl transition-all duration-300 ease-in-out',
                'bg-white/5 hover:bg-white/10 hover:shadow-[0_0_24px_rgba(255,255,255,0.1)] hover:border-white/40',
                'dark:bg-primary/5 dark:border-primary/20 dark:hover:border-primary/40 dark:hover:shadow-[0_0_20px_oklch(0.565_0.145_285/15%)]',
                className,
            ].join(' ')}
            {...animationProps}
            {...props}
        >
            {/* Shiny text sweep */}
            <span
                className="relative block size-full text-sm tracking-wide uppercase font-bold text-foreground"
                style={{
                    maskImage:
                        'linear-gradient(-75deg, var(--color-primary) calc(var(--x) + 20%), transparent calc(var(--x) + 30%), var(--color-primary) calc(var(--x) + 100%))',
                }}
            >
                {children}
            </span>

            {/* Shiny border sweep */}
            <span
                style={{
                    mask: 'linear-gradient(rgb(0,0,0), rgb(0,0,0)) content-box exclude, linear-gradient(rgb(0,0,0), rgb(0,0,0))',
                    WebkitMask:
                        'linear-gradient(rgb(0,0,0), rgb(0,0,0)) content-box exclude, linear-gradient(rgb(0,0,0), rgb(0,0,0))',
                    backgroundImage:
                        'linear-gradient(-75deg, oklch(0.565 0.145 285 / 10%) calc(var(--x) + 20%), oklch(0.565 0.145 285 / 50%) calc(var(--x) + 25%), oklch(0.565 0.145 285 / 10%) calc(var(--x) + 100%))',
                }}
                className="absolute inset-0 z-10 block rounded-[inherit] p-px"
            />
        </motion.button>
    );
});

ShinyButton.displayName = 'ShinyButton';
