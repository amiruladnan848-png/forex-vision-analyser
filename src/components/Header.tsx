import { motion } from "framer-motion";
import { Activity, Radio } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const Header = () => (
  <motion.header
    className="border-b border-border/30 bg-card/50 backdrop-blur-md sticky top-0 z-40"
    initial={{ y: -60, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.6 }}
  >
    <div className="container mx-auto px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <motion.div
          className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center"
          animate={{ boxShadow: ["0 0 10px hsl(175 100% 45% / 0.2)", "0 0 20px hsl(175 100% 45% / 0.5)", "0 0 10px hsl(175 100% 45% / 0.2)"] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Activity className="w-5 h-5 text-primary" />
        </motion.div>
        <div>
          <h1 className="font-display text-lg font-bold tracking-[0.2em] glow-text">FOREX-VISION</h1>
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest">AI CHART ANALYSIS SYSTEM</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Radio className="w-3 h-3 text-accent animate-pulse" />
          <span className="font-mono text-[10px] text-accent tracking-wider">LIVE</span>
        </div>
        <ThemeToggle />
      </div>
    </div>
  </motion.header>
);

export default Header;
