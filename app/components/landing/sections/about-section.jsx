'use client';

import { motion } from "framer-motion";
import { Users, Target, Zap } from "lucide-react";
import { PillSubheading } from "../ui/PillSubheading";

export default function AboutSection() {
    return (
        <section id="about" className="py-24 bg-background relative overflow-hidden transition-colors duration-300">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-[72rem] mx-auto px-5 relative z-10">
                <div className="text-center mb-16">
                    <PillSubheading text="Our Story" />
                    <h2 className="mb-6 font-serif font-bold text-foreground text-3xl md:text-5xl max-w-3xl mx-auto tracking-tight">
                        Empowering the next generation of confident communicators.
                    </h2>
                    <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
                        PersonaAI helps students and professionals transform self-doubt into confidence through AI-powered practice modules. Because technical skills get you the interview, confidence gets you the job.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mt-16">
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="p-8 rounded-3xl bg-card/50 dark:bg-card/20 border border-border backdrop-blur-xl transition-all duration-300"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                            <Users className="w-6 h-6 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-foreground">Who We Are</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            A team of educators, psychologists, and AI developers who experienced confidence struggles ourselves. We're making personality development accessible and judgment-free for everyone.
                        </p>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -5 }}
                        className="p-8 rounded-3xl bg-card/50 dark:bg-card/20 border border-border backdrop-blur-xl transition-all duration-300"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
                            <Target className="w-6 h-6 text-purple-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-foreground">Our Mission</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Help 100,000 students and professionals build authentic confidence through personalized AI modules. Success isn't just what you know, it's how confidently you communicate it.
                        </p>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -5 }}
                        className="p-8 rounded-3xl bg-card/50 dark:bg-card/20 border border-border backdrop-blur-xl transition-all duration-300"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                            <Zap className="w-6 h-6 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-foreground">Our Approach</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Five AI-powered modules: Confidence Coach, Voice Quiz, Microlearning, Social Mentor, and progress tracking. Each adapts to your pace and celebrates your growth.
                        </p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}