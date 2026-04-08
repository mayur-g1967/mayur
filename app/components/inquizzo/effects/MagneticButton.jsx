'use client'

import { useRef } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

export default function MagneticButton({ children, className }) {
    const ref = useRef(null)
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const springX = useSpring(x, { stiffness: 300, damping: 25 })
    const springY = useSpring(y, { stiffness: 300, damping: 25 })

    const move = (e) => {
        const rect = ref.current.getBoundingClientRect()
        x.set((e.clientX - rect.left - rect.width / 2) * 0.35)
        y.set((e.clientY - rect.top - rect.height / 2) * 0.35)
    }

    const reset = () => { x.set(0); y.set(0) }

    return (
        <motion.div
            ref={ref}
            style={{ x: springX, y: springY }}
            onMouseMove={move}
            onMouseLeave={reset}
            className={className}
        >
            {children}
        </motion.div>
    )
}
