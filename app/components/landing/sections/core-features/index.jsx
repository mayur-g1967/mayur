import { CORE_FEATURES } from "./data";
import { motion } from "framer-motion";

export function CoreFeatures() {
  return (
    <section className="py-24 bg-background px-5 relative z-10 transition-colors duration-300">
      <div className="max-w-[72rem] mx-auto">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-serif font-bold text-foreground text-3xl md:text-5xl max-w-xl mx-auto tracking-tight">
            Elevate Your Journey
          </h2>

          <p className="max-w-xl mx-auto text-lg text-muted-foreground">
            Experience weightless progression with tools designed to analyze,
            track, and connect you with a community of ambitious learners.
          </p>
        </div>

        {/* 3-COLUMN BENTO GRID */}
        <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6 max-w-[72rem] mx-auto">
          {CORE_FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="bg-card/50 dark:bg-card/20 border border-border backdrop-blur-xl rounded-[2rem] p-8 flex flex-col gap-6 transition-colors duration-300"
            >
              <div className="flex flex-col h-full relative z-10">

                {/* Header / Pill Area */}
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary/10 border border-primary/20">
                    <feature.iconUrl className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-secondary px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20">
                    {feature.pillText}
                  </span>
                </div>

                {/* Content Area */}
                <h3 className="mb-3 font-bold text-2xl text-foreground">
                  {feature.title}
                </h3>
                <p className="leading-relaxed flex-1 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
