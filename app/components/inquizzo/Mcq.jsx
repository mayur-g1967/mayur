'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card } from "@/components/ui/card"
import SpotlightCard from './effects/SpotlightCard'

export default function Mcq({ question, options, onAnswer, currentIndex, total, timeLeft }) {
  return (
    <div className="w-full flex flex-col gap-6">

      {/* Progress bar with Argon gradient */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-[#1a0533] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${((currentIndex + 1) / total) * 100}%`,
              background: 'linear-gradient(to right, #7303C0, #EC38BC)'
            }}
          />
        </div>
        <span className="text-xs text-muted-foreground font-medium">{currentIndex + 1}/{total}</span>
      </div>

      {/* Question Card with Spotlight */}
      <SpotlightCard className="rounded-2xl">
        <Card className="p-6 border border-[#1a0533] bg-[#08011a]/80 backdrop-blur-sm rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#7303C0] via-[#EC38BC] to-transparent" />
          <p className="text-lg font-semibold text-persona-ink leading-relaxed">{question}</p>
        </Card>
      </SpotlightCard>

      {/* Options with Argon scan line */}
      <div className="flex flex-col gap-3">
        {options && options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => onAnswer(idx)}
            className="relative flex items-center gap-4 px-5 py-4 rounded-xl text-left
                       border border-[#1a0533]/60 bg-gradient-to-r from-[#08011a] to-transparent
                       hover:border-[#7303C0]/40
                       hover:from-[#7303C0]/10 hover:to-transparent
                       hover:shadow-md hover:shadow-[#7303C0]/10
                       transition-all duration-200 group cursor-pointer overflow-hidden"
          >
            {/* Argon scan line on hover */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ x: "-100%", opacity: 0 }}
              whileHover={{ x: "200%", opacity: 1 }}
              transition={{ duration: 0.55, ease: "easeInOut" }}
              style={{
                background: "linear-gradient(90deg, transparent, rgba(236,56,188,0.12), rgba(253,239,249,0.06), transparent)"
              }}
            />
            <div className="w-8 h-8 rounded-lg border border-[#1a0533] bg-[#1a0533]/50
                           flex items-center justify-center text-xs font-bold text-muted-foreground
                           group-hover:border-[#7303C0]/40 group-hover:text-[#EC38BC] transition-colors">
              {String.fromCharCode(65 + idx)}
            </div>
            <span className="text-sm font-medium text-persona-ink">{option}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
