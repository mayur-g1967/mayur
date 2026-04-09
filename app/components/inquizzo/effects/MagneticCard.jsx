'use client'

import { useRef } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

export default function MagneticCard({ children, className, style, ...rest }) {
    const ref = useRef(null)
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 30 })
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 30 })

    const handleMouse = (e) => {
        const rect = ref.current.getBoundingClientRect()
        x.set((e.clientX - rect.left) / rect.width - 0.5)
        y.set((e.clientY - rect.top) / rect.height - 0.5)
    }

    const reset = () => {
        x.set(0)
        y.set(0)
    }

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouse}
            onMouseLeave={reset}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d", ...style }}
            className={className}
            {...rest}
        >
            {children}
        </motion.div>
    )
}
