import { Sparkles as Stars } from "lucide-react";
import { motion } from "framer-motion";

export function Subheading({ text }) {
  return (
    <div className="relative mx-auto mb-6 max-w-fit rounded-full p-[1px] overflow-hidden group shadow-[0_0_20px_rgba(223,88,205,0.2)] dark:shadow-[0_0_20px_rgba(144,103,198,0.2)]">
      {/* Centering wrapper for the spinning gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] aspect-square z-0">
        {/* Animated flowing gradient */}
        <motion.div
          className="w-full h-full bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0%,#df58cd_25%,transparent_50%,#9067c6_75%,transparent_100%)] opacity-80"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
        />
      </div>

      {/* Container for content that sits above the animated background */}
      <div className="relative bg-background py-2 text-sm items-center gap-2 px-5 inline-flex text-foreground rounded-full transition-colors duration-300 z-10">
        <Stars className="w-4 h-4 text-primary" />
        <p className="font-medium">{text}</p>
      </div>
    </div>
  );
}
