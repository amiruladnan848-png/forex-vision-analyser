import { motion } from "framer-motion";
import { Send, Crown } from "lucide-react";
import ownerImg from "@/assets/owner.jpg";

const OwnerBadge = () => {
  return (
    <motion.a
      href="https://t.me/amirul_adnan_trader"
      target="_blank"
      rel="noopener noreferrer"
      className="block terminal-card p-4 overflow-hidden relative group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.05 }}
      whileHover={{ scale: 1.01 }}
    >
      {/* Animated neon sweep */}
      <motion.div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background:
            "linear-gradient(120deg, transparent 30%, hsl(175 100% 45% / 0.25) 50%, transparent 70%)",
          backgroundSize: "200% 100%",
        }}
        animate={{ backgroundPosition: ["200% 0%", "-100% 0%"] }}
        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
      />

      <div className="relative flex items-center gap-4">
        {/* Animated logo / avatar ring */}
        <div className="relative w-14 h-14 shrink-0">
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, hsl(175 100% 45%), hsl(145 80% 45%), hsl(175 100% 45%))",
            }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
          />
          <div className="absolute inset-[2px] rounded-full overflow-hidden bg-background">
            <img
              src={ownerImg}
              alt="Amirul_Adnan owner"
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
          <motion.div
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_0_10px_hsl(175_100%_45%/0.7)]"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
          >
            <Crown className="w-3 h-3" />
          </motion.div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display text-[10px] tracking-[0.25em] text-muted-foreground">
              OWNER & FOUNDER
            </span>
          </div>
          <h3 className="font-display text-base font-bold tracking-wider glow-text truncate">
            Amirul_Adnan
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Send className="w-3 h-3 text-accent" />
            <span className="font-mono text-xs text-accent">@amirul_adnan_trader</span>
          </div>
        </div>

        <motion.div
          className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/30 font-display text-[10px] tracking-widest text-primary"
          whileHover={{ boxShadow: "0 0 18px hsl(175 100% 45% / 0.5)" }}
        >
          CONTACT
        </motion.div>
      </div>
    </motion.a>
  );
};

export default OwnerBadge;
