import Image from "next/image";
import Link from "next/link";
import { PillSubheading } from "../ui/PillSubheading";

export default function BenefitsGrid() {
  return (
    <section className="bg-muted/30 dark:bg-background py-14 md:py-28 transition-colors duration-300">
      <div className="wrapper">
        <div className="max-w-2xl mx-auto mb-12 text-center">
          <PillSubheading text="Key Advantages" />
          <h2 className="max-w-lg mx-auto mb-3 font-bold text-center text-foreground text-3xl md:text-title-lg leading-tight">
            Transform Your Personal & Professional Presence.
          </h2>
          <p className="max-w-2xl mx-auto text-base font-normal leading-6 text-muted-foreground">
            Harness the power of behavioral AI to master social dynamics, build unshakeable
            confidence, and accelerate your learning through evidence-based coaching.
          </p>
        </div>
        <div className="max-w-[1008px] mx-auto">
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6 flex flex-col">
              <div className="relative flex flex-col justify-between items-center bg-primary rounded-[20px] p-9 md:p-13 shadow-xl shadow-primary/20 h-full gap-8">
                <div className="flex flex-col items-center text-center">
                  <h3 className="font-bold text-white text-2xl md:text-3xl mb-4">
                    Navigate High-Stakes Social Scenarios
                  </h3>
                  <p className="text-base text-white/70 max-w-sm">
                    Practice interviews, negotiations, and difficult conversations with
                    our interactive 3D Social Mentor avatar.
                  </p>
                </div>
                <div>
                  <Image
                    src="/images/benefits/ka-1.jpg"
                    className="w-full rounded-xl object-cover shadow-2xl"
                    alt="Social Mentor"
                    width={488}
                    height={288}
                    sizes="100vw"
                  />
                </div>
              </div>
            </div>
            <div className="lg:col-span-6 flex flex-col">
              <div className="relative flex flex-col justify-between items-center bg-secondary rounded-[20px] p-9 md:p-13 overflow-hidden shadow-xl shadow-secondary/20 h-full gap-8">
                <div>
                  <Image
                    src="/images/benefits/ka-2.jpg"
                    alt="Confidence Coach"
                    width={400}
                    height={300}
                    className="rounded-xl shadow-lg object-cover"
                  />
                </div>
                <div className="flex flex-col items-center text-center">
                  <h3 className="font-bold max-w-xs text-white text-2xl md:text-3xl mb-4">
                    Project Unshakeable Vocal Confidence.
                  </h3>
                  <p className="text-base max-w-sm text-white/70">
                    Get real-time AI feedback on your tone, pace, and presence
                    with our specialized Confidence Coach.
                  </p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-12">
              <div className="lg:px-12 p-8 bg-muted border border-border lg:p-12 relative rounded-[20px] h-full lg:flex lg:flex-row lg:items-center justify-between bg-cover flex-col gap-5 shadow-sm overflow-hidden">
                <div className="max-w-sm relative z-10">
                  <h3 className="font-bold text-foreground text-2xl md:text-3xl mb-4">
                    Master Subjects Through Active Learning
                  </h3>
                  <p className="text-base text-muted-foreground mb-8">
                    Accelerate your growth with personalized micro-lessons and dynamic
                    quizzes designed for maximum retention.
                  </p>
                  <Link
                    href="/micro-learning"
                    className="font-medium inline-block text-sm text-primary-foreground rounded-full bg-primary hover:opacity-90 transition py-3 px-6"
                  >
                    Start Learning for Free
                  </Link>
                </div>
                <div>
                  <Image
                    src="/images/benefits/ka-3.jpg"
                    className="hidden lg:block relative z-10 rounded-2xl shadow-2xl object-cover right-[-2%]"
                    alt="Micro-learning"
                    width={400}
                    height={350}
                  />
                </div>
                <Image
                  src="/images/benefits/blur-shape.png"
                  alt=""
                  className="h-full w-full -z-0 absolute top-0 right-0"
                  width={399}
                  height={399}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
