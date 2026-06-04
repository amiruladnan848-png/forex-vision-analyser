import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, TrendingUp, TrendingDown, Loader2, Clock, AlertTriangle, Radio, Maximize2, Minimize2, Activity, Volume2, CheckCircle2, XCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { generateBinarySignal, type BinarySignal } from "@/lib/binarySignalEngine";
import { PAIRS_MAP } from "@/lib/analysisEngine";
import { fetchLivePrice } from "@/lib/derivApi";
import { useBinarySignalUsage, BINARY_DAILY_LIMIT } from "@/hooks/useBinarySignalUsage";
import TradingViewMiniChart from "./TradingViewMiniChart";

const BINARY_PAIRS = [
  "EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD", "NZD/USD", "USD/CHF",
  "EUR/JPY", "GBP/JPY", "EUR/GBP", "AUD/JPY",
  "XAU/USD", "BTC/USD", "ETH/USD",
];

interface Props { apiKey?: string }

const BinarySignalPanel = (_: Props) => {
  const [pair, setPair] = useState("EUR/USD");
  const [loading, setLoading] = useState(false);
  const [signal, setSignal] = useState<BinarySignal | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [priceDir, setPriceDir] = useState<"up" | "down" | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [mtgUsed, setMtgUsed] = useState(false);
  const [resolution, setResolution] = useState<"PENDING" | "LIVE" | "WIN" | "LOSS" | null>(null);
  const resolvedRef = useRef(false);
  const { canAnalyze, recordUsage, count, remaining } = useBinarySignalUsage();
  const tickRef = useRef<number | null>(null);
  const priceRef = useRef<number | null>(null);

  // Live countdown until entry time (when to enter the trade)
  useEffect(() => {
    if (!signal) return;
    const end = new Date(signal.entryTimeISO).getTime();
    const tick = () => {
      const ms = end - Date.now();
      setCountdown(ms > 0 ? ms : 0);
      if (ms > -60_000) tickRef.current = window.setTimeout(tick, 250);
    };
    tick();
    return () => { if (tickRef.current) window.clearTimeout(tickRef.current); };
  }, [signal]);

  // Live price polling (every 3s) for selected pair
  useEffect(() => {
    let alive = true;
    let timer: number | null = null;
    const poll = async () => {
      try {
        const p = await fetchLivePrice(pair);
        if (!alive) return;
        if (typeof p === "number") {
          const prev = priceRef.current;
          if (prev != null && p !== prev) setPriceDir(p > prev ? "up" : "down");
          priceRef.current = p;
          setLivePrice(p);
        }
      } catch { /* silent — keep last price */ }
      if (alive) timer = window.setTimeout(poll, 2500);
    };
    poll();
    return () => { alive = false; if (timer) window.clearTimeout(timer); };
  }, [pair]);

  const speakBangla = (text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const voices = window.speechSynthesis.getVoices();
      const bn = voices.find(v => /bn|bengali|bangla/i.test(v.lang + " " + v.name));
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = bn?.lang || "bn-BD";
      if (bn) utterance.voice = bn;
      utterance.rate = 0.94;
      utterance.pitch = 1.05;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    } catch { /* ignore */ }
  };

  const handleGenerate = async (mtgStep: 0 | 1 = 0, previousLossDirection?: "CALL" | "PUT") => {
    if (!canAnalyze) {
      toast.error(`Daily binary limit reached (${BINARY_DAILY_LIMIT} signals / 24h)`);
      return;
    }
    setLoading(true);
    setSignal(null);
    try {
      if (mtgStep === 1) speakBangla("লস ডিটেক্টেড। এক ধাপ এম টি জি সিগন্যাল তৈরি হচ্ছে।");
      const s = await generateBinarySignal(pair, { mtgStep, previousLossDirection });
      setSignal(s);
      setMtgUsed(mtgStep === 1);
      setResolution("PENDING");
      resolvedRef.current = false;
      setLivePrice(s.entryPrice);
      priceRef.current = s.entryPrice;
      await recordUsage({ pair, direction: s.direction, confidence: s.confidence });
      speakBangla(s.voiceScript);
      toast.success(`${s.direction} signal — ${s.confidence}% confidence`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate signal");
    } finally {
      setLoading(false);
    }
  };

  const isCall = signal?.direction === "CALL";
  const secs = Math.ceil(countdown / 1000);
  const decimals = PAIRS_MAP[pair]?.decimals ?? 5;

  // ===== AUTO Win/Loss/MTG detection =====
  // Mark LIVE when entry time hits, then resolve at expiry against live price.
  useEffect(() => {
    if (!signal) return;
    const entryMs = new Date(signal.entryTimeISO).getTime();
    const expiryMs = new Date(signal.expiryISO).getTime();
    let liveT: number | null = null;
    let resolveT: number | null = null;

    const toLive = entryMs - Date.now();
    if (toLive > 0) {
      liveT = window.setTimeout(() => {
        setResolution(r => (r === "PENDING" ? "LIVE" : r));
        speakBangla("ট্রেড লাইভ। মূল্য পর্যবেক্ষণ চলছে।");
      }, toLive);
    } else {
      setResolution(r => (r === "PENDING" ? "LIVE" : r));
    }

    const toResolve = expiryMs - Date.now() + 600; // small buffer for last tick
    resolveT = window.setTimeout(async () => {
      if (resolvedRef.current) return;
      resolvedRef.current = true;
      let closePx = priceRef.current ?? signal.entryPrice;
      try {
        const p = await fetchLivePrice(signal.pair);
        if (typeof p === "number") closePx = p;
      } catch { /* keep last */ }
      const moved = closePx - signal.entryPrice;
      const won = signal.direction === "CALL" ? moved > 0 : moved < 0;
      if (won) {
        setResolution("WIN");
        setMtgUsed(false);
        toast.success(`✅ WIN — ${signal.pair} closed ${closePx.toFixed(decimals)}`);
        speakBangla("অভিনন্দন! উইন ডিটেক্টেড। এম টি জি রিসেট করা হয়েছে।");
      } else {
        setResolution("LOSS");
        toast.error(`❌ LOSS — ${signal.pair} closed ${closePx.toFixed(decimals)}`);
        if (!mtgUsed && canAnalyze) {
          speakBangla("লস ডিটেক্টেড। এক ধাপ এম টি জি রিকভারি সিগন্যাল তৈরি হচ্ছে।");
          setTimeout(() => handleGenerate(1, signal.direction), 1400);
        } else {
          speakBangla("লস ডিটেক্টেড। এম টি জি ইতিমধ্যে ব্যবহৃত হয়েছে।");
        }
      }
    }, toResolve);

    return () => {
      if (liveT) window.clearTimeout(liveT);
      if (resolveT) window.clearTimeout(resolveT);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal?.entryTimeISO]);


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="terminal-card p-6 glow-border aurora-bg overflow-hidden relative"
    >
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-primary animate-pulse" />
          <h3 className="font-display text-lg font-bold tracking-wider shimmer-text">
            BINARY 1-MIN SIGNAL
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setVoiceEnabled(v => !v)}
          className={`shrink-0 h-8 w-8 rounded-md border flex items-center justify-center transition-colors ${voiceEnabled ? "border-primary/50 bg-primary/10 text-primary" : "border-border/50 bg-muted/40 text-muted-foreground"}`}
          title="Bangla voice alert"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>
      <p className="font-mono text-xs text-muted-foreground mb-4">
        Manual trigger only. Signal targets the next 1-minute candle close. {remaining === Infinity ? "Admin unlimited" : `${remaining}/${BINARY_DAILY_LIMIT} signals left`}.
      </p>

      <div className="grid sm:grid-cols-[1fr_auto] gap-3 mb-3">
        <Select value={pair} onValueChange={(value) => { setPair(value); setSignal(null); setMtgUsed(false); }} disabled={loading}>
          <SelectTrigger className="font-mono"><SelectValue /></SelectTrigger>
          <SelectContent>
            {BINARY_PAIRS.filter(p => PAIRS_MAP[p]).map(p => (
              <SelectItem key={p} value={p} className="font-mono">{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => handleGenerate()}
          disabled={loading || !canAnalyze}
          size="lg"
          className="font-display tracking-wider bg-gradient-to-r from-primary to-accent hover:opacity-90"
        >
          {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> ANALYZING…</>) : (<><Zap className="w-4 h-4 mr-2" /> GET SIGNAL</>)}
        </Button>
      </div>

      {/* Live price ticker */}
      <div className="flex items-center justify-between mb-3 px-3 py-2 rounded bg-background/50 border border-border/40">
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${priceDir === "up" ? "text-buy" : priceDir === "down" ? "text-sell" : "text-primary"} animate-pulse`} />
          <span className="font-mono text-xs text-muted-foreground">LIVE {pair}</span>
        </div>
        <span className={`font-display text-base font-bold transition-colors ${priceDir === "up" ? "text-buy" : priceDir === "down" ? "text-sell" : "text-foreground"}`}>
          {livePrice != null ? livePrice.toFixed(decimals) : "…"}
        </span>
      </div>

      {/* TradingView 1-min live chart */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-display text-[10px] tracking-widest text-muted-foreground">TRADINGVIEW • 1M LIVE</span>
          <button
            onClick={() => setExpanded(e => !e)}
            className="font-mono text-[10px] text-primary hover:text-accent flex items-center gap-1 transition-colors"
          >
            {expanded ? <><Minimize2 className="w-3 h-3" /> COLLAPSE</> : <><Maximize2 className="w-3 h-3" /> EXPAND</>}
          </button>
        </div>
        <TradingViewMiniChart pair={pair} interval="1" height={expanded ? 620 : 360} scanning={loading} />
      </div>

      <AnimatePresence mode="wait">
        {signal && (
          <motion.div
            key={signal.expiryISO}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-lg border-2 p-5 ${isCall ? "border-buy/60 bg-buy/5" : "border-sell/60 bg-sell/5"}`}
            style={{ boxShadow: isCall ? "0 0 24px hsl(var(--buy) / 0.35)" : "0 0 24px hsl(var(--sell) / 0.35)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {isCall ? <TrendingUp className="w-10 h-10 text-buy" /> : <TrendingDown className="w-10 h-10 text-sell" />}
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
                <div className="font-display text-2xl font-bold shimmer-text">{signal.confidence}%</div>
                <div className="font-mono text-[10px] text-muted-foreground">CONFIDENCE</div>
              </div>
            </div>

            {/* Live price inside signal card */}
            <div className="grid sm:grid-cols-3 gap-2 mb-3">
              <div className="p-3 rounded bg-background/60 border border-primary/20">
                <div className="font-mono text-[10px] text-muted-foreground mb-1">ENTRY PRICE</div>
                <div className="font-display text-xl font-bold text-primary">{signal.entryPrice.toFixed(decimals)}</div>
              </div>
              <div className="p-3 rounded bg-background/60 border border-primary/20">
                <div className="font-mono text-[10px] text-muted-foreground mb-1">VOLATILITY</div>
                <div className={`font-display text-xl font-bold ${signal.safeMode ? "text-warning" : "text-accent"}`}>{signal.volatility}</div>
              </div>
              <div className="p-3 rounded bg-background/60 border border-primary/20">
                <div className="font-mono text-[10px] text-muted-foreground mb-1">MTG STEP</div>
                <div className="font-display text-xl font-bold">{signal.mtgStep}/1</div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3 p-3 rounded bg-background/60 border border-primary/20">
              <div className="flex items-center gap-2">
                <Activity className={`w-4 h-4 ${priceDir === "up" ? "text-buy" : priceDir === "down" ? "text-sell" : "text-primary"} animate-pulse`} />
                <span className="font-mono text-[11px] text-muted-foreground">LIVE PRICE</span>
              </div>
              <span className={`font-display text-xl font-bold ${priceDir === "up" ? "text-buy" : priceDir === "down" ? "text-sell" : "text-foreground"}`}>
                {livePrice != null ? livePrice.toFixed(decimals) : "…"}
              </span>
            </div>

            {/* AUTO Win/Loss/MTG status (no manual buttons) */}
            <div className={`mb-3 p-3 rounded border-2 flex items-center justify-between gap-3 ${
              resolution === "WIN" ? "border-buy/60 bg-buy/10" :
              resolution === "LOSS" ? "border-sell/60 bg-sell/10" :
              resolution === "LIVE" ? "border-primary/50 bg-primary/10 animate-pulse" :
              "border-border/40 bg-background/40"
            }`}>
              <div className="flex items-center gap-2">
                {resolution === "WIN" ? <CheckCircle2 className="w-5 h-5 text-buy" /> :
                 resolution === "LOSS" ? <XCircle className="w-5 h-5 text-sell" /> :
                 resolution === "LIVE" ? <Activity className="w-5 h-5 text-primary animate-pulse" /> :
                 <Shield className="w-5 h-5 text-muted-foreground" />}
                <div>
                  <div className="font-display text-xs tracking-wider text-muted-foreground">AUTO TRADE STATUS</div>
                  <div className={`font-display text-sm font-bold ${
                    resolution === "WIN" ? "text-buy" :
                    resolution === "LOSS" ? "text-sell" :
                    resolution === "LIVE" ? "text-primary" : "text-foreground"
                  }`}>
                    {resolution === "WIN" ? "WIN DETECTED ✓" :
                     resolution === "LOSS" ? (mtgUsed ? "LOSS — MTG COMPLETE" : "LOSS — AUTO MTG…") :
                     resolution === "LIVE" ? "LIVE • MONITORING PRICE" :
                     "AWAITING ENTRY"}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[10px] text-muted-foreground">MTG STEP</div>
                <div className="font-display text-lg font-bold">{signal.mtgStep}/1</div>
              </div>
            </div>


            <div className="grid sm:grid-cols-3 gap-2 mb-3">
              <div className="p-3 rounded bg-background/60 border border-primary/30">
                <div className="font-mono text-[10px] text-muted-foreground mb-1">⏱ ENTRY TIME</div>
                <div className="font-display text-lg font-bold text-primary">{signal.entryTime}</div>
                <div className={`font-mono text-[10px] mt-0.5 ${secs <= 10 ? "text-warning animate-pulse" : "text-muted-foreground"}`}>
                  in {secs}s
                </div>
              </div>
              <div className="p-3 rounded bg-background/60 border border-accent/30">
                <div className="font-mono text-[10px] text-muted-foreground mb-1">⏳ EXPIRY TIME</div>
                <div className="font-display text-lg font-bold text-accent">{signal.expiry}</div>
                <div className="font-mono text-[10px] mt-0.5 text-muted-foreground">1 min expiry</div>
              </div>
              <div className="p-3 rounded bg-background/60 border border-border/50 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <div>
                  <div className="font-mono text-[10px] text-muted-foreground">GENERATED</div>
                  <div className="font-display text-sm font-bold">{signal.generatedAt}</div>
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
                <div className="font-display text-xs tracking-wider text-muted-foreground mb-2">CONFLUENCE REASONS</div>
                <div className="flex flex-wrap gap-1.5">
                  {signal.reasons.map((r, i) => (
                    <span key={i} className="font-mono text-[10px] px-2 py-0.5 rounded border border-primary/40 bg-primary/5 text-foreground">
                      ✓ {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="font-display text-xs tracking-wider text-muted-foreground mb-2">INDICATORS</div>
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
