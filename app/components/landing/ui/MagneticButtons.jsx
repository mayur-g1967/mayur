"use client";

import React from "react";
import { motion } from "framer-motion";
import { useMagnetic } from "../hooks/useMagnetic";
import { ShinyButton } from "./ShinyButton";

// ==========================================
// Base Magnetic Wrapper
// ==========================================
export function MagneticWrapper({ children, className = "" }) {
    const { ref, x, y } = useMagnetic({ mass: 0.5, stiffness: 120, damping: 10 });

    return (
        <motion.div
            ref={ref}
            style={{ x, y }}
            whileTap={{ scale: 0.95 }}
            className={`relative inline-flex z-50 ${className}`}
        >
            {children}
        </motion.div>
    );
}

// ==========================================
// Weak Magnetic Wrapper (for Login)
// ==========================================
export function WeakMagneticWrapper({ children, className = "" }) {
    const { ref, x, y } = useMagnetic({ mass: 0.5, stiffness: 120, damping: 10, pullFactor: 0.03 });

    return (
        <motion.div
            ref={ref}
            style={{ x, y }}
            whileTap={{ scale: 0.95 }}
            className={`relative inline-flex z-50 ${className}`}
        >
            {children}
        </motion.div>
    );
}

// ==========================================
// Get Started Button (Shimmer & Magnetic)
// ==========================================
export function GetStartedButton({
    children = "Get Started",
    className = "",
    onClick,
}) {
    return (
        <MagneticWrapper className={className}>
            <ShinyButton onClick={onClick}>
                {children}
            </ShinyButton>
        </MagneticWrapper>
    );
}

// ==========================================
// Login Button (Ghost / Outline & Weak Magnetic)
// ==========================================
export function LoginButton({
    children = "Login",
    className = "",
    onClick,
}) {
    return (
        <WeakMagneticWrapper className={className}>
            <ShinyButton
                onClick={onClick}
                className="!px-6 !py-2.5 !text-sm" // Slightly smaller for header
            >
                {children}
            </ShinyButton>
        </WeakMagneticWrapper>
    );
}
