"use client";

import { useState, useEffect, useRef } from "react";
import { useSpring } from "framer-motion";

export function useMagnetic(config = {}) {
    const { mass = 0.5, stiffness = 120, damping = 10, pullFactor = 0.08 } = config;
    const ref = useRef(null);

    // Framer motion springs initialized with 0
    const springX = useSpring(0, { mass, stiffness, damping });
    const springY = useSpring(0, { mass, stiffness, damping });

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const handleMouseMove = (e) => {
            // Get button's position and dimensions
            const rect = node.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Calculate distance between mouse and button center
            const distanceX = e.clientX - centerX;
            const distanceY = e.clientY - centerY;

            // Calculate straight-line distance (Pythagoras)
            const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

            // If cursor is within 60px of the button, pull it relative to distance
            if (distance < rect.width / 2 + 60) {
                springX.set(distanceX * pullFactor);
                springY.set(distanceY * pullFactor);
            } else {
                // Reset to center if too far
                springX.set(0);
                springY.set(0);
            }
        };

        const handleMouseLeaveWindow = () => {
            springX.set(0);
            springY.set(0);
        };

        window.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseleave", handleMouseLeaveWindow);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseleave", handleMouseLeaveWindow);
        };
    }, [springX, springY]);

    return { ref, x: springX, y: springY };
}
