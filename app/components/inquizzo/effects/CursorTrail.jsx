'use client'

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function CursorTrail() {
    const [dots, setDots] = useState([])

    useEffect(() => {
        let id = 0
        const lastTouchTime = { current: 0 }
        const handleTouch = () => { lastTouchTime.current = Date.now() }
        window.addEventListener("touchstart", handleTouch, { passive: true })

        const move = (e) => {
            if (Date.now() - lastTouchTime.current < 2000) return;
            const dot = { id: id++, x: e.clientX, y: e.clientY }
            setDots(prev => [...prev.slice(-12), dot])
        }
        window.addEventListener("mousemove", move)
        return () => {
            window.removeEventListener("mousemove", move)
            window.removeEventListener("touchstart", handleTouch)
        }
    }, [])

    return (
        <div className="pointer-events-none fixed inset-0 z-50">
            <AnimatePresence>
                {dots.map((dot, i) => (
                    <motion.div
                        key={dot.id}
                        initial={{ opacity: 0.6, scale: 1 }}
                        animate={{ opacity: 0, scale: 0 }}
                        exit={{}}
                        transition={{ duration: 0.6 }}
                        className="absolute rounded-full"
                        style={{
                            left: dot.x,
                            top: dot.y,
                            width: 6 + i * 0.5,
                            height: 6 + i * 0.5,
                            translateX: "-50%",
                            translateY: "-50%",
                            background: i % 2 === 0 ? "#7303C0" : "#EC38BC",
                            boxShadow: `0 0 8px ${i % 2 === 0 ? "#7303C0" : "#EC38BC"}`
                        }}
                    />
                ))}
            </AnimatePresence>
        </div>
    )
}
