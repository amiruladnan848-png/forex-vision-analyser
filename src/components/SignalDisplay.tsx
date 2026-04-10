import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Target, ShieldAlert, ArrowUpRight, ArrowDownRight, BarChart3, Layers, Zap } from "lucide-react";

export interface Signal {
  pair: string;
  timeframe: string;
  direction: "BUY" | "SELL";
  entry: string;
  stopLoss: string;
  takeProfit1: string;
  takeProfit2: string;
  takeProfit3: string;
  riskReward: string;
  confidence: number;
  strategy: string;
  patterns: string[];
  indicators: string[];
  analysis: string;
  keyLevels: string[];
}

interface SignalDisplayProps {
  signal: Signal;
}

const SignalDisplay = ({ signal }: SignalDisplayProps) => {
  const isBuy = signal.direction === "BUY";

  return (
    <motion.div
      className="terminal-card overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className={`p-4 border-b border-border/30 ${isBuy ? "bg-buy/5" : "bg-sell/5"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className={`w-12 h-12 rounded-lg flex items-center justify-center ${isBuy ? "bg-buy/20" : "bg-sell/20"}`}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              {isBuy ? <TrendingUp className="w-6 h-6 text-buy" /> : <TrendingDown className="w-6 h-6 text-sell" />}
            </motion.div>
            <div>
              <h2 className="font-display text-xl font-bold tracking-wider">{signal.pair}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`font-display text-xs font-bold px-2 py-0.5 rounded ${isBuy ? "bg-buy/20 text-buy" : "bg-sell/20 text-sell"}`}>
                  {signal.direction}
                </span>
                <span className="font-mono text-xs text-muted-foreground">{signal.timeframe}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-xs text-muted-foreground mb-1">Confidence</div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${signal.confidence >= 80 ? "bg-accent" : signal.confidence >= 60 ? "bg-warning" : "bg-destructive"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${signal.confidence}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
              <span className="font-display text-sm font-bold">{signal.confidence}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Entry, SL, TP */}
        <div className="grid grid-cols-2 gap-3">
          <PriceBox icon={<ArrowUpRight className="w-4 h-4" />} label="ENTRY" value={signal.entry} color="text-primary" />
          <PriceBox icon={<ShieldAlert className="w-4 h-4" />} label="STOP LOSS" value={signal.stopLoss} color="text-destructive" />
          <PriceBox icon={<Target className="w-4 h-4" />} label="TP 1" value={signal.takeProfit1} color="text-accent" />
          <PriceBox icon={<Target className="w-4 h-4" />} label="TP 2" value={signal.takeProfit2} color="text-accent" />
          <PriceBox icon={<Target className="w-4 h-4" />} label="TP 3" value={signal.takeProfit3} color="text-accent" />
          <PriceBox icon={<BarChart3 className="w-4 h-4" />} label="RISK:REWARD" value={signal.riskReward} color="text-warning" />
        </div>

        {/* Strategy */}
        <div className="rounded-md border border-border/30 p-3 bg-muted/10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-display text-xs font-semibold tracking-wider">STRATEGY</span>
          </div>
          <p className="font-mono text-sm text-foreground/90">{signal.strategy}</p>
        </div>

        {/* Patterns & Indicators */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-3 h-3 text-primary" />
              <span className="font-display text-[10px] font-semibold tracking-wider text-muted-foreground">PATTERNS</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {signal.patterns.map((p, i) => (
                <motion.span
                  key={i}
                  className="px-2 py-0.5 rounded border border-primary/20 bg-primary/5 font-mono text-[10px] text-primary"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  {p}
                </motion.span>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-3 h-3 text-accent" />
              <span className="font-display text-[10px] font-semibold tracking-wider text-muted-foreground">INDICATORS</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {signal.indicators.map((ind, i) => (
                <motion.span
                  key={i}
                  className="px-2 py-0.5 rounded border border-accent/20 bg-accent/5 font-mono text-[10px] text-accent"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                >
                  {ind}
                </motion.span>
              ))}
            </div>
          </div>
        </div>

        {/* Key Levels */}
        {signal.keyLevels.length > 0 && (
          <div className="rounded-md border border-border/30 p-3 bg-muted/10">
            <span className="font-display text-[10px] font-semibold tracking-wider text-muted-foreground">KEY LEVELS</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {signal.keyLevels.map((l, i) => (
                <span key={i} className="font-mono text-xs text-foreground/80">{l}</span>
              ))}
            </div>
          </div>
        )}

        {/* Analysis */}
        <div className="rounded-md border border-border/30 p-3 bg-muted/10">
          <span className="font-display text-[10px] font-semibold tracking-wider text-muted-foreground">FULL ANALYSIS</span>
          <p className="font-body text-sm text-foreground/80 mt-2 leading-relaxed">{signal.analysis}</p>
        </div>
      </div>
    </motion.div>
  );
};

const PriceBox = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) => (
  <motion.div
    className="rounded-md border border-border/30 p-3 bg-muted/10"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex items-center gap-1.5 mb-1">
      <span className={color}>{icon}</span>
      <span className="font-display text-[10px] font-semibold tracking-wider text-muted-foreground">{label}</span>
    </div>
    <span className={`font-mono text-lg font-bold ${color}`}>{value}</span>
  </motion.div>
);

export default SignalDisplay;
