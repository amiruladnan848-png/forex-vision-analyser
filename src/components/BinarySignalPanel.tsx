import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, TrendingUp, TrendingDown, Loader2, Clock, AlertTriangle, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { generateBinarySignal, type BinarySignal } from "@/lib/binarySignalEngine";
import { PAIRS_MAP } from "@/lib/analysisEngine";
import { useDailySignalUsage } from "@/hooks/useDailySignalUsage";

// TradingView pairs available for binary 1-min trading (matches engine + brokers like Pocket Option, Quotex, IQ Option)
const BINARY_PAIRS = [
  "EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD", "NZD/USD", "USD/CHF",
  "EUR/JPY", "GBP/JPY", "EUR/GBP", "AUD/JPY",
  "XAU/USD", "BTC/USD", "ETH/USD",
];

interface Props {
  apiKey: string;
}

const BinarySignalPanel = ({ apiKey }: Props) => {
  const [pair, setPair] = useState("EUR/USD");
  const [loading, setLoading] = useState(false);
  const [signal, setSignal] = useState<BinarySignal | null>(null);
  const [countdown, setCountdown] = useState(0);
  const { canAnalyze, recordUsage, count, remaining } = useDailySignalUsage();
  const tickRef = useRef<number | null>(null);

  // Live countdown for expiry
  useEffect(() => {
    if (!signal) return;
    const end = new Date(signal.expiryISO).getTime();
    const tick = () => {
      const ms = end - Date.now();
      setCountdown(ms > 0 ? ms : 0);
      if (ms > 0) tickRef.current = window.setTimeout(tick, 250);
    };
    tick();
    return () => {
      if (tickRef.current) window.clearTimeout(tickRef.current);
    };
  }, [signal]);

  const handleGenerate = async () => {
    if (!canAnalyze) {
      toast.error("Daily limit reached (10 signals / 24h)");
      return;
    }
    setLoading(true);
    setSignal(null);
    try {
      const s = await generateBinarySignal(pair, apiKey);
      setSignal(s);
      await recordUsage({
        pair,
        timeframe: "1min",
        direction: s.direction,
        confidence: s.confidence,
      });
      toast.success(`${s.direction} signal — ${s.confidence}% confidence`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate signal");
    } finally {
      setLoading(false);
    }
  };

  const isCall = signal?.direction === "CALL";
  const secs = Math.ceil(countdown / 1000);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="terminal-card p-6 glow-border aurora-bg overflow-hidden relative"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-primary animate-pulse" />
          <h3 className="font-display text-lg font-bold tracking-wider shimmer-text">
            BINARY 1-MIN SIGNAL
          </h3>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {remaining === Infinity ? "∞" : `${count}/10`}
        </span>
      </div>
      <p className="font-mono text-xs text-muted-foreground mb-4">
        Manual trigger only. Signal targets the next 1-minute candle close (binary expiry).
      </p>

      <div className="grid sm:grid-cols-[1fr_auto] gap-3 mb-4">
        <Select value={pair} onValueChange={setPair} disabled={loading}>
          <SelectTrigger className="font-mono">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BINARY_PAIRS.filter(p => PAIRS_MAP[p]).map(p => (
              <SelectItem key={p} value={p} className="font-mono">{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleGenerate}
          disabled={loading || !canAnalyze}
          size="lg"
          className="font-display tracking-wider bg-gradient-to-r from-primary to-accent hover:opacity-90"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> ANALYZING…</>
          ) : (
            <><Zap className="w-4 h-4 mr-2" /> GET SIGNAL</>
          )}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {signal && (
          <motion.div
            key={signal.expiryISO}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-lg border-2 p-5 ${
              isCall
                ? "border-buy/60 bg-buy/5"
                : "border-sell/60 bg-sell/5"
            }`}
            style={{
              boxShadow: isCall
                ? "0 0 24px hsl(var(--buy) / 0.35)"
                : "0 0 24px hsl(var(--sell) / 0.35)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {isCall ? (
                  <TrendingUp className="w-10 h-10 text-buy" />
                ) : (
                  <TrendingDown className="w-10 h-10 text-sell" />
                )}
                <div>
                  <div className={`font-display text-3xl font-black tracking-wider ${isCall ? "text-buy" : "text-sell"}`}>
                    {signal.direction}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {signal.pair} • 1 MIN EXPIRY
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl font-bold shimmer-text">
                  {signal.confidence}%
                </div>
                <div className="font-mono text-[10px] text-muted-foreground">CONFIDENCE</div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3 p-3 rounded bg-background/50">
              <Clock className="w-4 h-4 text-primary" />
              <div className="flex-1">
                <div className="font-mono text-xs text-muted-foreground">Expiry (your local time)</div>
                <div className="font-display text-lg font-bold">{signal.expiry}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-xs text-muted-foreground">Enter within</div>
                <div className={`font-display text-2xl font-bold ${secs <= 10 ? "text-warning animate-pulse" : "text-primary"}`}>
                  {secs}s
                </div>
              </div>
            </div>

            {signal.caution && (
              <div className="flex items-start gap-2 mb-3 p-2 rounded bg-warning/10 border border-warning/30">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <span className="font-mono text-xs text-warning">{signal.caution}</span>
              </div>
            )}

            {signal.reasons.length > 0 && (
              <div className="mb-3">
                <div className="font-display text-xs tracking-wider text-muted-foreground mb-2">
                  CONFLUENCE REASONS
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {signal.reasons.map((r, i) => (
                    <span
                      key={i}
                      className="font-mono text-[10px] px-2 py-0.5 rounded border border-primary/40 bg-primary/5 text-foreground"
                    >
                      ✓ {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="font-display text-xs tracking-wider text-muted-foreground mb-2">
                INDICATORS
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {signal.indicators.map((ind, i) => (
                  <div key={i} className="font-mono text-[10px] text-muted-foreground bg-background/40 px-2 py-1 rounded">
                    {ind}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BinarySignalPanel;
