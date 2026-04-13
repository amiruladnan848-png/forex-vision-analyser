import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Target, ShieldAlert, BarChart3, Layers, Zap, Activity, Download } from "lucide-react";
import React, { useRef, useCallback } from "react";
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

const LevelLine = ({ y, w, pad, color, label, price, dash }: { y: number; w: number; pad: number; color: string; label: string; price: string; dash: string }) => (
  <g>
    <line x1={pad} x2={w - pad} y1={y} y2={y} stroke={color} strokeWidth={1.2} strokeDasharray={dash} />
    {/* Label badge on right */}
    <rect x={w - pad - 30} y={y - 8} width={30} height={16} fill={color} rx={3} opacity={0.9} />
    <text x={w - pad - 15} y={y + 4} textAnchor="middle" fill="hsl(220 20% 4%)" fontSize={7.5} fontFamily="monospace" fontWeight="bold">{label}</text>
    {/* Price badge on left */}
    <rect x={pad} y={y - 8} width={58} height={16} fill="hsl(220 20% 8% / 0.9)" rx={3} stroke={color} strokeWidth={0.6} />
    <text x={pad + 29} y={y + 4} textAnchor="middle" fill={color} fontSize={7} fontFamily="monospace" fontWeight="600">{price}</text>
  </g>
);

const SignalChart = ({ signal }: { signal: Signal }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const candles = signal.candles;
  const hasCandles = candles && candles.length >= 5;

  const handleDownload = useCallback(() => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      canvas.width = 560 * 2;
      canvas.height = 280 * 2;
      ctx.scale(2, 2);
      ctx.fillStyle = "#0a0e14";
      ctx.fillRect(0, 0, 560, 280);
      ctx.drawImage(img, 0, 0, 560, 280);
      URL.revokeObjectURL(url);
      const link = document.createElement("a");
      link.download = `${signal.pair.replace("/", "-")}_${signal.timeframe}_${signal.direction}_signal.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = url;
  }, [signal]);

  if (!hasCandles) return null;

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
  const W = 560, H = 280, pad = 68;
  const chartW = W - pad - 10, chartH = H - 20;
  const candleW = Math.max(2, chartW / displayCandles.length - 1);

  const yScale = (price: number) => 10 + chartH - ((price - minP) / range) * chartH;

  const handleDownload = useCallback(() => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      canvas.width = W * 2;
      canvas.height = H * 2;
      ctx.scale(2, 2);
      ctx.fillStyle = "#0a0e14";
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0, W, H);
      URL.revokeObjectURL(url);
      const link = document.createElement("a");
      link.download = `${signal.pair.replace("/", "-")}_${signal.timeframe}_${signal.direction}_signal.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = url;
  }, [signal]);

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
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleDownload}
          className="ml-2 p-1.5 rounded-md border border-border/40 bg-muted/30 hover:bg-primary/10 hover:border-primary/40 transition-all"
          title="Download chart image"
        >
          <Download className="w-3.5 h-3.5 text-primary" />
        </motion.button>
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ minHeight: 220 }}>
        <rect width={W} height={H} fill="hsl(220 20% 4%)" rx={6} />
        {/* Grid lines */}
        {[0.2, 0.4, 0.6, 0.8].map(pct => (
          <line key={pct} x1={pad} x2={W - 10} y1={10 + chartH * pct} y2={10 + chartH * pct} stroke="hsl(180 60% 20% / 0.12)" strokeDasharray="3,3" />
        ))}

        {/* TP zone */}
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
              <rect x={x} y={bodyTop} width={candleW * 0.8} height={bodyH} fill={isBull ? "hsl(145 80% 45% / 0.85)" : "hsl(0 85% 55% / 0.85)"} rx={0.5} />
            </g>
          );
        })}

        {/* Direction arrow */}
        {(() => {
          const lastX = pad + (displayCandles.length - 1) * (chartW / displayCandles.length) + candleW;
          const arrowY = yScale(entry);
          const isBuy = signal.direction === "BUY";
          const arrowLen = 30;
          const endY = isBuy ? arrowY - arrowLen : arrowY + arrowLen;
          return (
            <g>
              <line x1={lastX + 12} x2={lastX + 12} y1={arrowY} y2={endY} stroke={isBuy ? "hsl(145 80% 50%)" : "hsl(0 85% 55%)"} strokeWidth={2.5} />
              <polygon
                points={isBuy
                  ? `${lastX + 6},${endY + 8} ${lastX + 12},${endY} ${lastX + 18},${endY + 8}`
                  : `${lastX + 6},${endY - 8} ${lastX + 12},${endY} ${lastX + 18},${endY - 8}`}
                fill={isBuy ? "hsl(145 80% 50%)" : "hsl(0 85% 55%)"}
              />
            </g>
          );
        })()}

        {/* Level lines with prices */}
        <LevelLine y={yScale(entry)} w={W} pad={pad} color="hsl(175 100% 45%)" label="ENTRY" price={signal.entry} dash="" />
        <LevelLine y={yScale(sl)} w={W} pad={pad} color="hsl(0 85% 55%)" label="SL" price={signal.stopLoss} dash="4,3" />
        <LevelLine y={yScale(tp1)} w={W} pad={pad} color="hsl(145 80% 45% / 0.6)" label="TP1" price={signal.takeProfit1} dash="4,3" />
        <LevelLine y={yScale(tp2)} w={W} pad={pad} color="hsl(145 80% 45% / 0.8)" label="TP2" price={signal.takeProfit2} dash="4,3" />
        <LevelLine y={yScale(tp3)} w={W} pad={pad} color="hsl(145 80% 45%)" label="TP3" price={signal.takeProfit3} dash="4,3" />

        {/* Bollinger Bands */}
        {signal.bbUpper && signal.bbLower && (
          <>
            <line x1={pad} x2={W - 10} y1={yScale(signal.bbUpper)} y2={yScale(signal.bbUpper)} stroke="hsl(45 100% 50% / 0.3)" strokeDasharray="2,4" strokeWidth={0.8} />
            <line x1={pad} x2={W - 10} y1={yScale(signal.bbLower)} y2={yScale(signal.bbLower)} stroke="hsl(45 100% 50% / 0.3)" strokeDasharray="2,4" strokeWidth={0.8} />
            {signal.bbMiddle && <line x1={pad} x2={W - 10} y1={yScale(signal.bbMiddle)} y2={yScale(signal.bbMiddle)} stroke="hsl(45 100% 50% / 0.2)" strokeDasharray="1,3" strokeWidth={0.5} />}
          </>
        )}

        {/* Pair & Direction label */}
        <text x={pad + 4} y={22} fill="hsl(180 100% 95%)" fontSize={10} fontFamily="monospace" fontWeight="bold">{signal.pair} • {signal.timeframe}</text>
        <rect x={pad + 4} y={28} width={32} height={14} fill={signal.direction === "BUY" ? "hsl(145 80% 45%)" : "hsl(0 85% 55%)"} rx={3} />
        <text x={pad + 20} y={39} textAnchor="middle" fill="hsl(220 20% 4%)" fontSize={8} fontFamily="monospace" fontWeight="bold">{signal.direction}</text>
      </svg>
    </motion.div>
  );
};

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
