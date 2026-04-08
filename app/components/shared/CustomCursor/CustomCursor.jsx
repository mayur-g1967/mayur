"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

const CustomCursor = () => {
    const pathname = usePathname();
    const { theme, resolvedTheme } = useTheme();

    const [isHovered, setIsHovered] = useState(false);
    const [isClicked, setIsClicked] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [isHiddenRoute, setIsHiddenRoute] = useState(false);

    // Initial setup and route monitoring
    useEffect(() => {
        setMounted(true);
        const checkRoute = () => {
            const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
            const isModuleRoute = pathname?.startsWith("/micro-learning");
            setIsHiddenRoute(isMobile || isModuleRoute);
        };
        checkRoute();

        // Preload cursor images for immediate availability
        const preloadImages = () => {
            ['/cursor_light_mode.png', '/cursor_dark_mode.png'].forEach(src => {
                const img = new Image();
                img.src = src;
            });
        };
        preloadImages();
    }, [pathname]);

    // Native cursor suppression
    useEffect(() => {
        if (mounted && isVisible && !isHiddenRoute) {
            document.body.classList.add("custom-cursor-active");
        } else {
            document.body.classList.remove("custom-cursor-active");
        }
        return () => document.body.classList.remove("custom-cursor-active");
    }, [isVisible, isHiddenRoute, mounted]);

    const currentTheme = mounted ? (resolvedTheme || theme) : "light";
    const customImage = currentTheme === "dark" ? "/cursor_dark_mode.png" : "/cursor_light_mode.png";

    // Mouse tracking
    const mouseX = useMotionValue(-100);
    const mouseY = useMotionValue(-100);
    const lastTouchTime = useRef(0);

    useEffect(() => {
        if (!mounted || isHiddenRoute) return;

        const moveMouse = (e) => {
            if (Date.now() - lastTouchTime.current < 2000) return;
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
            if (!isVisible) setIsVisible(true);
        };

        const handleHover = (e) => {
            if (Date.now() - lastTouchTime.current < 2000) return;
            const target = e.target;
            const isPointer = target.closest("button, a") ||
                window.getComputedStyle(target).cursor === "pointer";
            setIsHovered(!!isPointer);
        };

        const handleMouseDown = () => setIsClicked(true);
        const handleMouseUp = () => setIsClicked(false);
        const handleMouseLeave = () => setIsVisible(false);
        const handleMouseEnter = () => !isHiddenRoute && setIsVisible(true);

        const handleTouch = () => {
            lastTouchTime.current = Date.now();
            setIsVisible(false);
        };

        window.addEventListener("mousemove", moveMouse);
        window.addEventListener("mouseover", handleHover);
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("touchstart", handleTouch, { passive: true });
        document.addEventListener("mouseleave", handleMouseLeave);
        document.addEventListener("mouseenter", handleMouseEnter);

        return () => {
            window.removeEventListener("mousemove", moveMouse);
            window.removeEventListener("mouseover", handleHover);
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("touchstart", handleTouch);
            document.removeEventListener("mouseleave", handleMouseLeave);
            document.removeEventListener("mouseenter", handleMouseEnter);
        };
    }, [mounted, isHiddenRoute, isVisible]);

    if (!mounted || isHiddenRoute) return null;

    return (
        <div
            className="fixed inset-0 pointer-events-none z-[9999]"
            style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.2s ease-out' }}
        >
            <motion.div
                style={{
                    x: mouseX.current === -100 ? (typeof window !== "undefined" ? window.innerWidth / 2 : 0) : mouseX,
                    y: mouseY.current === -100 ? (typeof window !== "undefined" ? window.innerHeight / 2 : 0) : mouseY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
                animate={{
                    scale: isClicked ? 0.6 : (isHovered ? 1.15 : 1),
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="absolute w-7 h-7 flex items-center justify-center pointer-events-none"
            >
                <img
                    key={currentTheme}
                    src={customImage}
                    alt="cursor"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.style.border = '2px solid white';
                        e.target.parentElement.style.borderRadius = '50%';
                        e.target.parentElement.style.background = 'rgba(255,255,255,0.2)';
                    }}
                />
            </motion.div>
        </div>
    );
};

export default CustomCursor;
