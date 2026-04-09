'use client'

import { useRef, useState } from "react"

export default function SpotlightCard({ children, className }) {
    const ref = useRef(null)
    const [pos, setPos] = useState({ x: 0, y: 0, opacity: 0 })

    const handleMouse = (e) => {
        const rect = ref.current.getBoundingClientRect()
        setPos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            opacity: 1
        })
    }

    return (
        <div
            ref={ref}
            onMouseMove={handleMouse}
            onMouseLeave={() => setPos(p => ({ ...p, opacity: 0 }))}
            className={`relative overflow-hidden ${className}`}
        >
            {/* Spotlight layer */}
            <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-300 rounded-2xl"
                style={{
                    opacity: pos.opacity,
                    background: `radial-gradient(300px circle at ${pos.x}px ${pos.y}px, rgba(236,56,188,0.08), transparent 60%)`
                }}
            />
            {children}
        </div>
    )
}
