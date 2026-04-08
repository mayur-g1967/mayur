'use client'

import { useEffect, useRef } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

export default function CursorGlow() {
    const x = useMotionValue(-400)
    const y = useMotionValue(-400)

    const springX = useSpring(x, { stiffness: 80, damping: 20 })
    const springY = useSpring(y, { stiffness: 80, damping: 20 })

    const lastTouchTime = useRef(0)

    useEffect(() => {
        const handleTouch = () => { lastTouchTime.current = Date.now() }
        window.addEventListener("touchstart", handleTouch, { passive: true })

        const move = (e) => {
            if (Date.now() - lastTouchTime.current < 2000) return;
            x.set(e.clientX)
            y.set(e.clientY)
        }
        window.addEventListener("mousemove", move)
        return () => {
            window.removeEventListener("mousemove", move)
            window.removeEventListener("touchstart", handleTouch)
        }
    }, [])

    return (
        <motion.div
            className="pointer-events-none fixed inset-0 z-0"
            style={{ background: "transparent" }}
        >
            <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{
                    width: 600,
                    height: 600,
                    x: springX,
                    y: springY,
                    translateX: "-50%",
                    translateY: "-50%",
                    background: "radial-gradient(circle, rgba(115,3,192,0.12) 0%, rgba(236,56,188,0.06) 40%, transparent 70%)",
                    filter: "blur(20px)"
                }}
            />
        </motion.div>
    )
}
