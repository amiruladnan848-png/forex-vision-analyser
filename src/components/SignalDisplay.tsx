import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Target, ShieldAlert, BarChart3, Layers, Zap, Activity } from "lucide-react";
import React from "react";
import type { OHLC } from "@/lib/analysisEngine";

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
  trend?: string;
  candles?: OHLC[];
  bbUpper?: number;
  bbLower?: number;
  bbMiddle?: number;
  adx?: number;
}

interface SignalDisplayProps {
  signal: Signal;
}

// Mini chart drawn with SVG from real candle data
const SignalChart = ({ signal }: { signal: Signal }) => {
  const candles = signal.candles;
  if (!candles || candles.length < 5) return null;

  const displayCandles = [...candles].reverse().slice(-30);
  const allHighs = displayCandles.map(c => c.high);
  const allLows = displayCandles.map(c => c.low);
  const entry = parseFloat(signal.entry);
  const sl = parseFloat(signal.stopLoss);
  const tp1 = parseFloat(signal.takeProfit1);
  const tp2 = parseFloat(signal.takeProfit2);
  const tp3 = parseFloat(signal.takeProfit3);

  const minP = Math.min(...allLows, sl, signal.direction === "SELL" ? tp3 : sl);
  const maxP = Math.max(...allHighs, tp3, signal.direction === "BUY" ? tp3 : sl);
  const range = maxP - minP || 1;
  const W = 500, H = 220, pad = 10;
  const chartW = W - pad * 2, chartH = H - pad * 2;
  const candleW = Math.max(2, chartW / displayCandles.length - 1);

  const yScale = (price: number) => pad + chartH - ((price - minP) / range) * chartH;

  return (
    <motion.div
      className="rounded-md border border-border/30 bg-muted/10 p-3 overflow-hidden"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Activity className="w-3 h-3 text-primary" />
        <span className="font-display text-[10px] font-semibold tracking-wider text-muted-foreground">SIGNAL CHART</span>
        <span className="font-mono text-[10px] text-primary ml-auto">{signal.pair} {signal.timeframe}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ minHeight: 180 }}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(pct => (
          <line key={pct} x1={pad} x2={W - pad} y1={pad + chartH * pct} y2={pad + chartH * pct} stroke="hsl(180 60% 20% / 0.15)" strokeDasharray="3,3" />
        ))}

        {/* TP3 zone */}
        <rect x={pad} y={Math.min(yScale(tp3), yScale(entry))} width={chartW} height={Math.abs(yScale(tp3) - yScale(entry))} fill={signal.direction === "BUY" ? "hsl(145 80% 45% / 0.06)" : "hsl(0 85% 55% / 0.06)"} />

        {/* SL zone */}
        <rect x={pad} y={Math.min(yScale(sl), yScale(entry))} width={chartW} height={Math.abs(yScale(sl) - yScale(entry))} fill="hsl(0 85% 55% / 0.08)" />

        {/* Candlesticks */}
        {displayCandles.map((c, i) => {
          const x = pad + i * (chartW / displayCandles.length) + candleW * 0.1;
          const isBull = c.close >= c.open;
          const bodyTop = yScale(Math.max(c.open, c.close));
          const bodyBot = yScale(Math.min(c.open, c.close));
          const bodyH = Math.max(1, bodyBot - bodyTop);
          return (
            <g key={i}>
              <line x1={x + candleW / 2} x2={x + candleW / 2} y1={yScale(c.high)} y2={yScale(c.low)} stroke={isBull ? "hsl(145 80% 45% / 0.7)" : "hsl(0 85% 55% / 0.7)"} strokeWidth={1} />
              <rect x={x} y={bodyTop} width={candleW * 0.8} height={bodyH} fill={isBull ? "hsl(145 80% 45% / 0.8)" : "hsl(0 85% 55% / 0.8)"} rx={0.5} />
            </g>
          );
        })}

        {/* Level lines */}
        <LevelLine y={yScale(entry)} w={W} pad={pad} color="hsl(175 100% 45%)" label="ENTRY" dash="" />
        <LevelLine y={yScale(sl)} w={W} pad={pad} color="hsl(0 85% 55%)" label="SL" dash="4,3" />
        <LevelLine y={yScale(tp1)} w={W} pad={pad} color="hsl(145 80% 45% / 0.6)" label="TP1" dash="4,3" />
        <LevelLine y={yScale(tp2)} w={W} pad={pad} color="hsl(145 80% 45% / 0.8)" label="TP2" dash="4,3" />
        <LevelLine y={yScale(tp3)} w={W} pad={pad} color="hsl(145 80% 45%)" label="TP3" dash="4,3" />

        {/* Bollinger Bands */}
        {signal.bbUpper && signal.bbLower && (
          <>
            <line x1={pad} x2={W - pad} y1={yScale(signal.bbUpper)} y2={yScale(signal.bbUpper)} stroke="hsl(45 100% 50% / 0.3)" strokeDasharray="2,4" strokeWidth={0.8} />
            <line x1={pad} x2={W - pad} y1={yScale(signal.bbLower)} y2={yScale(signal.bbLower)} stroke="hsl(45 100% 50% / 0.3)" strokeDasharray="2,4" strokeWidth={0.8} />
            {signal.bbMiddle && <line x1={pad} x2={W - pad} y1={yScale(signal.bbMiddle)} y2={yScale(signal.bbMiddle)} stroke="hsl(45 100% 50% / 0.2)" strokeDasharray="1,3" strokeWidth={0.5} />}
          </>
        )}
      </svg>
    </motion.div>
  );
};

const LevelLine = ({ y, w, pad, color, label, dash }: { y: number; w: number; pad: number; color: string; label: string; dash: string }) => (
  <g>
    <line x1={pad} x2={w - pad} y1={y} y2={y} stroke={color} strokeWidth={1.2} strokeDasharray={dash} />
    <rect x={w - pad - 28} y={y - 7} width={28} height={14} fill={color} rx={2} opacity={0.9} />
    <text x={w - pad - 14} y={y + 3.5} textAnchor="middle" fill="hsl(220 20% 4%)" fontSize={7} fontFamily="monospace" fontWeight="bold">{label}</text>
  </g>
);

const SignalDisplay = ({ signal }: SignalDisplayProps) => {
  const isBuy = signal.direction === "BUY";

  return (
    <motion.div
      className="terminal-card overflow-hidden"
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className={`p-4 border-b border-border/30 ${isBuy ? "bg-buy/5" : "bg-sell/5"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className={`w-12 h-12 rounded-lg flex items-center justify-center ${isBuy ? "bg-buy/20" : "bg-sell/20"}`}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              {isBuy ? <TrendingUp className="w-6 h-6 text-buy" /> : <TrendingDown className="w-6 h-6 text-sell" />}
            </motion.div>
            <div>
              <h2 className="font-display text-xl font-bold tracking-wider">{signal.pair}</h2>
              <div className="flex items-center gap-2 mt-1">
                <motion.span
                  className={`font-display text-xs font-bold px-2 py-0.5 rounded ${isBuy ? "bg-buy/20 text-buy" : "bg-sell/20 text-sell"}`}
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
                >
                  {signal.direction}
                </motion.span>
                <span className="font-mono text-xs text-muted-foreground">{signal.timeframe}</span>
                {signal.trend && (
                  <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                    signal.trend === "BULLISH" ? "bg-buy/10 text-buy" : signal.trend === "BEARISH" ? "bg-sell/10 text-sell" : "bg-warning/10 text-warning"
                  }`}>
                    {signal.trend}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-xs text-muted-foreground mb-1">Confidence</div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${signal.confidence >= 75 ? "bg-accent" : signal.confidence >= 55 ? "bg-warning" : "bg-destructive"}`}
                  initial={{ width: 0 }} animate={{ width: `${signal.confidence}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
              <span className="font-display text-sm font-bold">{signal.confidence}%</span>
            </div>
            {signal.adx !== undefined && (
              <div className="font-mono text-[10px] text-muted-foreground mt-1">
                Trend Strength: {signal.adx > 25 ? "Strong" : signal.adx > 20 ? "Moderate" : "Weak"}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Signal Chart */}
        <SignalChart signal={signal} />

        {/* Price Levels */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <TrendingUp className="w-4 h-4" />, label: "ENTRY", value: signal.entry, color: "text-primary" },
            { icon: <ShieldAlert className="w-4 h-4" />, label: "STOP LOSS", value: signal.stopLoss, color: "text-destructive" },
            { icon: <Target className="w-4 h-4" />, label: "TP 1", value: signal.takeProfit1, color: "text-accent" },
            { icon: <Target className="w-4 h-4" />, label: "TP 2", value: signal.takeProfit2, color: "text-accent" },
            { icon: <Target className="w-4 h-4" />, label: "TP 3", value: signal.takeProfit3, color: "text-accent" },
            { icon: <BarChart3 className="w-4 h-4" />, label: "RISK:REWARD", value: signal.riskReward, color: "text-warning" },
          ].map((item, i) => (
            <motion.div key={item.label} className="rounded-md border border-border/30 p-3 bg-muted/10"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className={item.color}>{item.icon}</span>
                <span className="font-display text-[10px] font-semibold tracking-wider text-muted-foreground">{item.label}</span>
              </div>
              <span className={`font-mono text-lg font-bold ${item.color}`}>{item.value}</span>
            </motion.div>
          ))}
        </div>

        {/* Strategy */}
        <motion.div className="rounded-md border border-border/30 p-3 bg-muted/10"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-display text-xs font-semibold tracking-wider">STRATEGY</span>
          </div>
          <p className="font-mono text-sm text-foreground/90">{signal.strategy}</p>
        </motion.div>

        {/* Patterns & Indicators */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-3 h-3 text-primary" />
              <span className="font-display text-[10px] font-semibold tracking-wider text-muted-foreground">PATTERNS</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {signal.patterns.map((p, i) => (
                <motion.span key={i} className="px-2 py-0.5 rounded border border-primary/20 bg-primary/5 font-mono text-[10px] text-primary"
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.08 }}>
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
                <motion.span key={i} className="px-2 py-0.5 rounded border border-accent/20 bg-accent/5 font-mono text-[10px] text-accent"
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 + i * 0.08 }}>
                  {ind}
                </motion.span>
              ))}
            </div>
          </div>
        </div>

        {/* Key Levels */}
        {signal.keyLevels.length > 0 && (
          <motion.div className="rounded-md border border-border/30 p-3 bg-muted/10"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          >
            <span className="font-display text-[10px] font-semibold tracking-wider text-muted-foreground">KEY LEVELS</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {signal.keyLevels.map((l, i) => (
                <motion.span key={i} className="font-mono text-xs text-foreground/80 px-2 py-0.5 rounded bg-muted/30"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 + i * 0.1 }}>
                  {l}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Analysis */}
        <motion.div className="rounded-md border border-border/30 p-3 bg-muted/10"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        >
          <span className="font-display text-[10px] font-semibold tracking-wider text-muted-foreground">FULL ANALYSIS</span>
          <p className="font-body text-sm text-foreground/80 mt-2 leading-relaxed">{signal.analysis}</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SignalDisplay;
