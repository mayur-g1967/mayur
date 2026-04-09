import Image from "next/image";
import Link from "next/link";
import { Subheading } from "./subheading";
import { GetStartedButton } from "../../ui/MagneticButtons";
import { WordReveal } from "../../ui/WordReveal";
import { motion } from "framer-motion";
import FloatingLines from "../../ui/FloatingLines";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function HeroSection() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLight = mounted && resolvedTheme === 'light';

  return (
    <section className="pb-24 pt-20 relative overflow-hidden bg-background min-h-[100vh] flex items-center transition-colors duration-300">

      {/* FLOATING LINES – FULL BLEED BACKGROUND */}
      <div className="absolute inset-0 z-[5] pointer-events-auto">
        <FloatingLines
          linesGradient={["#9067c6", "#8d86c9", "#242038"]}
          animationSpeed={isLight ? 1 : 1.1}
          interactive={true}
          bendRadius={isLight ? 5 : 7}
          bendStrength={isLight ? -0.5 : 0.5}
          mouseDamping={isLight ? 0.05 : 0.07}
          parallax={false}
          parallaxStrength={isLight ? 0.2 : 1}
          mixBlendMode="normal"
        />
      </div>



      <div className="max-w-[120rem] mx-auto relative z-20 w-full pointer-events-none">
        <div className="wrapper pointer-events-auto">
          <div className="max-w-[900px] mx-auto">
            <div className="text-center pb-16">

              <motion-div className="pointer-events-auto" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
                <Subheading text="AI-Powered Confidence & Learning Platform" />
              </motion-div>

              {/* BRAND NAME LOGO */}
              <motion-div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
                <div className="flex justify-center items-center mb-6">
                  <p className='text-5xl sm:text-7xl md:text-8xl font-bold font-serif tracking-tight text-primary'>
                    <span className='text-foreground'>Persona</span>AI
                  </p>
                </div>
              </motion-div>

              {/* ANTIGRAVITY TYPOGRAPHY - BOLD SERIF */}
              <WordReveal
                text="Become the best version of yourself"
                className="font-serif text-foreground mx-auto font-bold mb-6 text-4xl sm:text-[52px] sm:leading-[1.1] max-w-[800px] tracking-tight"
              />

              {/* CLEAN SANS-SERIF BODY */}
              <motion-p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
                className="max-w-[600px] text-center mx-auto text-muted-foreground text-lg sm:text-xl font-sans"
              >
                PersonaAI helps students and young professionals improve
                confidence, communication, and learning through personalized
                AI-powered coaching and insights.
              </motion-p>

              <motion-div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="mt-12 flex sm:flex-row flex-col gap-4 relative z-30 items-center justify-center"
              >
                <Link href="/login" className="w-full sm:w-auto">
                  <GetStartedButton />
                </Link>
              </motion-div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
