"use client";

import { motion } from "framer-motion";

export function WordReveal({ text, className = "" }) {
    // Split the text into an array of words
    const words = text.split(" ");

    // Container animation configuration
    const containerVariants = {
        hidden: { opacity: 1 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1, // Delay between each word
            },
        },
    };

    // Individual word animation configuration
    const childVariants = {
        hidden: {
            opacity: 0,
            y: 20, // Start 20px lower
        },
        visible: {
            opacity: 1,
            y: 0, // Slide up to original position
            transition: {
                type: "spring",
                stiffness: 100, // Matching the requested physics
                damping: 15,
            },
        },
    };

    return (
        <motion.h1
            className={className}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {words.map((word, index) => (
                <motion.span
                    key={index}
                    variants={childVariants}
                    className="inline-block mr-[0.25em]" // preserve natural spacing
                >
                    {word}
                </motion.span>
            ))}
        </motion.h1>
    );
}
