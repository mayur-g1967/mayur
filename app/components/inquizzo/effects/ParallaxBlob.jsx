'use client'

import { useEffect } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

export default function ParallaxBlob({ offsetFactor = 0.02, className }) {
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const springX = useSpring(x, { stiffness: 30, damping: 20 })
    const springY = useSpring(y, { stiffness: 30, damping: 20 })

    useEffect(() => {
        const move = (e) => {
            x.set((e.clientX - window.innerWidth / 2) * offsetFactor)
            y.set((e.clientY - window.innerHeight / 2) * offsetFactor)
        }
        window.addEventListener("mousemove", move)
        return () => window.removeEventListener("mousemove", move)
    }, [])

    return (
        <motion.div
            style={{ x: springX, y: springY }}
            className={`absolute rounded-full blur-[120px] pointer-events-none ${className}`}
        />
    )
}
