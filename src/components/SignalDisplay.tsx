import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Target, ShieldAlert, BarChart3, Layers, Zap, Activity, Download } from "lucide-react";
import React, { useRef, useCallback, useState } from "react";
import type { OHLC, FVGZone, LiquidityZone, OrderBlock, StructureBreak } from "@/lib/analysisEngine";

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
  imageData?: string;
  fibLevels?: Record<string, number>;
  support?: number;
  resistance?: number;
  ema8?: number;
  ema21?: number;
  fvgZones?: FVGZone[];
  liquidityZones?: LiquidityZone[];
  orderBlocks?: OrderBlock[];
  structureBreaks?: StructureBreak[];
}

interface SignalDisplayProps {
  signal: Signal;
}

/* ─── Chart drawn ON the user's screenshot ─── */
const SignalChart = ({ signal }: { signal: Signal }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const hasImage = !!signal.imageData;
  const hasCandles = signal.candles && signal.candles.length >= 5;

  const draw = useCallback((img: HTMLImageElement | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 800, H = 450;
    canvas.width = W * 2;
    canvas.height = H * 2;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(2, 2);

    // Draw screenshot as background — KEEP IT VISIBLE
    if (img) {
      ctx.drawImage(img, 0, 0, W, H);
      // Very light overlay so user's chart stays readable
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = "#0a0e14";
      ctx.fillRect(0, 0, W, H);
    }

    if (!hasCandles || !signal.candles) { setLoaded(true); return; }

    const candles = [...signal.candles].reverse().slice(-40);
    const entry = parseFloat(signal.entry);
    const sl = parseFloat(signal.stopLoss);
    const tp1 = parseFloat(signal.takeProfit1);
    const tp2 = parseFloat(signal.takeProfit2);
    const tp3 = parseFloat(signal.takeProfit3);

    const allPrices = [
      ...candles.map(c => c.high), ...candles.map(c => c.low),
      entry, sl, tp1, tp2, tp3,
      signal.bbUpper || 0, signal.bbLower || Infinity,
      signal.support || Infinity, signal.resistance || 0,
    ].filter(v => v > 0 && v < Infinity);

    const minP = Math.min(...allPrices);
    const maxP = Math.max(...allPrices);
    const range = maxP - minP || 1;
    const padL = 70, padR = 80, padT = 35, padB = 25;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    const yScale = (price: number) => padT + chartH - ((price - minP) / range) * chartH;
    const isBuy = signal.direction === "BUY";

    // ── Grid lines ──
    ctx.strokeStyle = "rgba(100,200,220,0.08)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const y = padT + (chartH / 5) * i;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      const price = maxP - (range / 5) * i;
      ctx.fillStyle = "rgba(180,200,210,0.5)";
      ctx.font = "9px monospace";
      ctx.textAlign = "right";
      ctx.fillText(price.toFixed(signal.entry.includes(".") ? signal.entry.split(".")[1].length : 2), padL - 5, y + 3);
    }

    // ── Order Blocks ──
    if (signal.orderBlocks && signal.orderBlocks.length > 0) {
      signal.orderBlocks.forEach((ob) => {
        const obTop = yScale(ob.top);
        const obBot = yScale(ob.bottom);
        const obH = Math.abs(obBot - obTop);
        const xStart = padL + (ob.index / candles.length) * chartW;
        const obW = Math.max(chartW - (xStart - padL), chartW * 0.3);
        if (ob.type === "bullish") {
          ctx.fillStyle = "rgba(0,180,255,0.12)";
          ctx.strokeStyle = "rgba(0,180,255,0.6)";
        } else {
          ctx.fillStyle = "rgba(255,100,50,0.12)";
          ctx.strokeStyle = "rgba(255,100,50,0.6)";
        }
        ctx.fillRect(xStart, Math.min(obTop, obBot), obW, obH);
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(xStart, Math.min(obTop, obBot), obW, obH);
        ctx.setLineDash([]);
        // Label
        ctx.fillStyle = ob.type === "bullish" ? "rgba(0,180,255,0.9)" : "rgba(255,100,50,0.9)";
        ctx.font = "bold 7px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`OB ${ob.type === "bullish" ? "▲" : "▼"}`, xStart + 3, Math.min(obTop, obBot) - 3);
      });
    }

    // ── Fair Value Gaps (FVG) ──
    if (signal.fvgZones && signal.fvgZones.length > 0) {
      signal.fvgZones.forEach((fvg) => {
        const fvgTop = yScale(fvg.top);
        const fvgBot = yScale(fvg.bottom);
        const fvgH = Math.abs(fvgBot - fvgTop);
        const xStart = padL + (fvg.index / candles.length) * chartW;
        const fvgW = Math.max(chartW - (xStart - padL), chartW * 0.25);
        if (fvg.type === "bullish") {
          ctx.fillStyle = "rgba(0,255,180,0.1)";
          ctx.strokeStyle = "rgba(0,255,180,0.5)";
        } else {
          ctx.fillStyle = "rgba(255,80,180,0.1)";
          ctx.strokeStyle = "rgba(255,80,180,0.5)";
        }
        ctx.fillRect(xStart, Math.min(fvgTop, fvgBot), fvgW, Math.max(fvgH, 2));
        ctx.lineWidth = 0.8;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(xStart, Math.min(fvgTop, fvgBot));
        ctx.lineTo(xStart + fvgW, Math.min(fvgTop, fvgBot));
        ctx.moveTo(xStart, Math.max(fvgTop, fvgBot));
        ctx.lineTo(xStart + fvgW, Math.max(fvgTop, fvgBot));
        ctx.stroke();
        ctx.setLineDash([]);
        // FVG label
        ctx.fillStyle = fvg.type === "bullish" ? "rgba(0,255,180,0.85)" : "rgba(255,80,180,0.85)";
        ctx.font = "bold 7px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`FVG`, xStart + 3, Math.min(fvgTop, fvgBot) + fvgH / 2 + 3);
      });
    }

    // ── Liquidity Zones ──
    if (signal.liquidityZones && signal.liquidityZones.length > 0) {
      signal.liquidityZones.forEach((lz) => {
        const ly = yScale(lz.price);
        if (ly < padT || ly > H - padB) return;
        const color = lz.type === "buy-side" ? "rgba(255,200,0,0.6)" : "rgba(150,100,255,0.6)";
        const bgColor = lz.type === "buy-side" ? "rgba(255,200,0,0.06)" : "rgba(150,100,255,0.06)";
        // Zone band
        ctx.fillStyle = bgColor;
        ctx.fillRect(padL, ly - 5, chartW, 10);
        // Dashed line
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 4, 2, 4]);
        ctx.beginPath(); ctx.moveTo(padL, ly); ctx.lineTo(W - padR, ly); ctx.stroke();
        ctx.setLineDash([]);
        // $ icons for liquidity
        ctx.fillStyle = color;
        ctx.font = "bold 8px monospace";
        ctx.textAlign = "right";
        const label = lz.type === "buy-side" ? `$$$ BSL (${lz.strength}x)` : `$$$ SSL (${lz.strength}x)`;
        ctx.fillText(label, W - padR - 3, ly - 7);
      });
    }

    // ── Structure Breaks (CHoCH / BOS) ──
    if (signal.structureBreaks && signal.structureBreaks.length > 0) {
      signal.structureBreaks.forEach((sb) => {
        const sy = yScale(sb.price);
        if (sy < padT || sy > H - padB) return;
        const color = sb.direction === "bullish" ? "rgba(0,220,255,0.7)" : "rgba(255,120,0,0.7)";
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 3]);
        ctx.beginPath(); ctx.moveTo(padL, sy); ctx.lineTo(W - padR, sy); ctx.stroke();
        ctx.setLineDash([]);
        // Label badge
        const text = `${sb.type} ${sb.direction === "bullish" ? "▲" : "▼"}`;
        const tw = ctx.measureText(text).width + 12;
        ctx.fillStyle = color;
        const bx = padL + chartW * 0.6;
        ctx.beginPath();
        ctx.roundRect(bx, sy - 10, tw, 16, 3);
        ctx.fill();
        ctx.fillStyle = "#0a0e14";
        ctx.font = "bold 8px monospace";
        ctx.textAlign = "left";
        ctx.fillText(text, bx + 6, sy + 2);
      });
    }

    // ── Support & Resistance zones ──
    if (signal.support) {
      const sy = yScale(signal.support);
      ctx.fillStyle = "rgba(0,200,120,0.08)";
      ctx.fillRect(padL, sy - 6, chartW, 12);
      ctx.strokeStyle = "rgba(0,200,120,0.6)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(padL, sy); ctx.lineTo(W - padR, sy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(0,200,120,0.9)";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`SUPPORT: ${signal.support.toFixed(2)}`, padL + 3, sy - 8);
    }
    if (signal.resistance) {
      const ry = yScale(signal.resistance);
      ctx.fillStyle = "rgba(255,80,80,0.08)";
      ctx.fillRect(padL, ry - 6, chartW, 12);
      ctx.strokeStyle = "rgba(255,80,80,0.6)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(padL, ry); ctx.lineTo(W - padR, ry); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,80,80,0.9)";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`RESISTANCE: ${signal.resistance.toFixed(2)}`, padL + 3, ry - 8);
    }

    // ── Fibonacci levels ──
    if (signal.fibLevels) {
      const fibColors: Record<string, string> = {
        "23.6%": "rgba(255,215,0,0.35)", "38.2%": "rgba(255,200,0,0.45)",
        "50.0%": "rgba(255,180,0,0.5)", "61.8%": "rgba(255,160,0,0.6)",
        "78.6%": "rgba(255,140,0,0.4)",
      };
      Object.entries(signal.fibLevels).forEach(([label, price]) => {
        if (label.startsWith("ext")) return;
        const fy = yScale(price);
        if (fy < padT || fy > H - padB) return;
        ctx.strokeStyle = fibColors[label] || "rgba(255,200,0,0.3)";
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 5]);
        ctx.beginPath(); ctx.moveTo(padL, fy); ctx.lineTo(W - padR, fy); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = fibColors[label] || "rgba(255,200,0,0.6)";
        ctx.font = "7px monospace";
        ctx.textAlign = "right";
        ctx.fillText(`Fib ${label}`, W - padR - 3, fy - 3);
      });
    }

    // ── Bollinger Bands ──
    if (signal.bbUpper && signal.bbLower) {
      [signal.bbUpper, signal.bbLower, signal.bbMiddle].forEach((val, idx) => {
        if (!val) return;
        const by = yScale(val);
        ctx.strokeStyle = idx === 2 ? "rgba(255,215,0,0.2)" : "rgba(255,215,0,0.35)";
        ctx.lineWidth = idx === 2 ? 0.6 : 0.9;
        ctx.setLineDash(idx === 2 ? [2, 4] : [4, 4]);
        ctx.beginPath(); ctx.moveTo(padL, by); ctx.lineTo(W - padR, by); ctx.stroke();
        ctx.setLineDash([]);
      });
      const bbTopY = yScale(signal.bbUpper);
      const bbBotY = yScale(signal.bbLower);
      ctx.fillStyle = "rgba(255,215,0,0.04)";
      ctx.fillRect(padL, bbTopY, chartW, bbBotY - bbTopY);
    }

    // ── NO simulated candles drawn — overlay zones only on user screenshot ──


    // ── EMA trend lines ──
    if (signal.ema8 && signal.ema21) {
      const lastX = padL + chartW - 20;
      const ema8Y = yScale(signal.ema8);
      const ema21Y = yScale(signal.ema21);
      ctx.strokeStyle = "rgba(0,200,255,0.5)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(lastX - 60, ema8Y + (signal.ema8 > signal.ema21 ? 5 : -5)); ctx.lineTo(lastX, ema8Y); ctx.stroke();
      ctx.strokeStyle = "rgba(255,165,0,0.5)";
      ctx.beginPath(); ctx.moveTo(lastX - 60, ema21Y + (signal.ema8 > signal.ema21 ? 5 : -5)); ctx.lineTo(lastX, ema21Y); ctx.stroke();
    }

    // ── TP/SL Zones (shaded) ──
    const entryY = yScale(entry);
    const tp3Y = yScale(tp3);
    const slY = yScale(sl);
    ctx.fillStyle = isBuy ? "rgba(0,210,130,0.07)" : "rgba(255,70,70,0.07)";
    ctx.fillRect(padL, Math.min(entryY, tp3Y), chartW, Math.abs(tp3Y - entryY));
    ctx.fillStyle = "rgba(255,50,50,0.07)";
    ctx.fillRect(padL, Math.min(entryY, slY), chartW, Math.abs(slY - entryY));

    // ── Signal levels ──
    const drawLevel = (price: number, label: string, color: string, dash: number[]) => {
      const y = yScale(price);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash(dash);
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      ctx.setLineDash([]);
      const priceStr = price.toFixed(signal.entry.includes(".") ? signal.entry.split(".")[1].length : 2);
      ctx.fillStyle = color;
      ctx.fillRect(W - padR + 2, y - 9, padR - 6, 18);
      ctx.fillStyle = "#0a0e14";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(priceStr, W - padR + 2 + (padR - 6) / 2, y + 3);
      ctx.fillStyle = color;
      const lw = ctx.measureText(label).width + 10;
      ctx.fillRect(padL, y - 9, lw, 18);
      ctx.fillStyle = "#0a0e14";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "left";
      ctx.fillText(label, padL + 5, y + 3);
    };

    drawLevel(entry, "ENTRY", "rgb(0,220,200)", []);
    drawLevel(sl, "SL", "rgb(255,60,60)", [5, 3]);
    drawLevel(tp1, "TP1", "rgba(0,200,120,0.7)", [4, 3]);
    drawLevel(tp2, "TP2", "rgba(0,210,130,0.85)", [4, 3]);
    drawLevel(tp3, "TP3", "rgb(0,220,140)", [4, 3]);

    // ── Direction arrow ──
    const arrowX = W - padR - 25;
    const arrowLen = 40;
    const arrowEndY = isBuy ? entryY - arrowLen : entryY + arrowLen;
    ctx.strokeStyle = isBuy ? "rgb(0,220,140)" : "rgb(255,60,60)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(arrowX, entryY); ctx.lineTo(arrowX, arrowEndY); ctx.stroke();
    ctx.fillStyle = isBuy ? "rgb(0,220,140)" : "rgb(255,60,60)";
    ctx.beginPath();
    if (isBuy) {
      ctx.moveTo(arrowX - 7, arrowEndY + 10); ctx.lineTo(arrowX, arrowEndY); ctx.lineTo(arrowX + 7, arrowEndY + 10);
    } else {
      ctx.moveTo(arrowX - 7, arrowEndY - 10); ctx.lineTo(arrowX, arrowEndY); ctx.lineTo(arrowX + 7, arrowEndY - 10);
    }
    ctx.fill();

    // ── Title bar ──
    ctx.fillStyle = "rgba(10,14,20,0.8)";
    ctx.fillRect(0, 0, W, 30);
    ctx.fillStyle = "rgb(0,220,200)";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`${signal.pair} • ${signal.timeframe}`, 10, 19);
    ctx.fillStyle = isBuy ? "rgb(0,220,140)" : "rgb(255,60,60)";
    const dirW = ctx.measureText(signal.direction).width + 14;
    ctx.fillRect(W / 2 - dirW / 2, 6, dirW, 18);
    ctx.fillStyle = "#0a0e14";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(signal.direction, W / 2, 19);

    // Strategy label
    ctx.fillStyle = "rgba(180,220,255,0.5)";
    ctx.font = "9px monospace";
    ctx.textAlign = "right";
    ctx.fillText(signal.strategy, W - 10, 19);

    // ── Legend bar bottom ──
    ctx.fillStyle = "rgba(10,14,20,0.8)";
    ctx.fillRect(0, H - 28, W, 28);
    ctx.fillStyle = "rgba(180,200,210,0.6)";
    ctx.font = "8px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`Confidence: ${signal.confidence}%  |  R:R ${signal.riskReward}  |  ${signal.trend || ""}`, 10, H - 14);
    // Legend items
    const legends = [
      { color: "rgba(0,180,255,0.8)", label: "OB" },
      { color: "rgba(0,255,180,0.8)", label: "FVG" },
      { color: "rgba(255,200,0,0.8)", label: "LIQ" },
      { color: "rgba(0,220,255,0.8)", label: "BOS" },
    ];
    let lx = W - 10;
    ctx.font = "bold 7px monospace";
    ctx.textAlign = "right";
    legends.reverse().forEach(lg => {
      ctx.fillStyle = lg.color;
      ctx.fillText(lg.label, lx, H - 14);
      lx -= ctx.measureText(lg.label).width + 4;
      ctx.fillRect(lx - 6, H - 18, 5, 5);
      lx -= 12;
    });

    setLoaded(true);
  }, [signal, hasCandles]);

  // Load image and draw
  const initDraw = useCallback(() => {
    if (signal.imageData) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => draw(img);
      img.onerror = () => draw(null);
      img.src = signal.imageData;
    } else {
      draw(null);
    }
  }, [signal.imageData, draw]);

  React.useEffect(() => { initDraw(); }, [initDraw]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${signal.pair.replace("/", "-")}_${signal.timeframe}_${signal.direction}_signal.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [signal]);

  if (!hasImage) return null;

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
      <canvas
        ref={canvasRef}
        className={`w-full h-auto rounded-md transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        style={{ maxHeight: 450 }}
      />
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
                  }`}>{signal.trend}</span>
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
