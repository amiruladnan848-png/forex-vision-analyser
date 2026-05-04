import { motion } from "framer-motion";
import { ShieldCheck, Wallet, TrendingUp, AlertTriangle, Clock, Brain } from "lucide-react";

const RULES = [
  {
    icon: <Wallet className="w-4 h-4" />,
    title: "1–2% Risk Rule",
    text: "Never risk more than 1–2% of your account on a single trade. Protect capital first, profit second.",
  },
  {
    icon: <ShieldCheck className="w-4 h-4" />,
    title: "Always Use Stop Loss",
    text: "Place SL at the structural invalidation point shown on the signal. No SL = no trade.",
  },
  {
    icon: <TrendingUp className="w-4 h-4" />,
    title: "Min 1:2 R:R",
    text: "Only take signals where Reward ≥ 2× Risk. Aim for TP2/TP3 with partial closes at TP1.",
  },
  {
    icon: <Brain className="w-4 h-4" />,
    title: "Trade With Confluence",
    text: "Only enter when confidence ≥ 70% and at least 3/4 strategies agree on direction.",
  },
  {
    icon: <Clock className="w-4 h-4" />,
    title: "Trade The Sessions",
    text: "Best execution during London / New York overlap. Avoid major news minutes (NFP, CPI, FOMC).",
  },
  {
    icon: <AlertTriangle className="w-4 h-4" />,
    title: "No Revenge Trading",
    text: "After 2 consecutive losses, stop for the day. Emotional trades destroy accounts.",
  },
];

const MoneyManagementRules = () => {
  return (
    <motion.div
      className="terminal-card p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <motion.div
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ repeat: Infinity, duration: 4 }}
        >
          <ShieldCheck className="w-5 h-5 text-primary" />
        </motion.div>
        <h3 className="font-display text-sm font-bold tracking-[0.2em] glow-text">
          MONEY MANAGEMENT RULES
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {RULES.map((r, i) => (
          <motion.div
            key={r.title}
            className="rounded-md border border-border/30 bg-muted/10 p-3 hover:border-primary/50 hover:bg-primary/5 transition-all"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 * i }}
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-primary">{r.icon}</span>
              <span className="font-display text-xs font-semibold tracking-wider">
                {r.title}
              </span>
            </div>
            <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
              {r.text}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default MoneyManagementRules;
