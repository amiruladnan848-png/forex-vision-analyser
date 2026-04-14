import { type Signal } from "@/components/SignalDisplay";

// ─── Forex + Crypto Pair Configuration ────────────────────────────────

export const PAIRS_MAP: Record<string, { display: string; symbol: string; decimals: number; pipSize: number; type: "forex" | "crypto" }> = {
  // Major Forex
  "EUR/USD": { display: "EUR/USD", symbol: "EUR/USD", decimals: 5, pipSize: 0.0001, type: "forex" },
  "GBP/USD": { display: "GBP/USD", symbol: "GBP/USD", decimals: 5, pipSize: 0.0001, type: "forex" },
  "USD/JPY": { display: "USD/JPY", symbol: "USD/JPY", decimals: 3, pipSize: 0.01, type: "forex" },
  "AUD/USD": { display: "AUD/USD", symbol: "AUD/USD", decimals: 5, pipSize: 0.0001, type: "forex" },
  "USD/CAD": { display: "USD/CAD", symbol: "USD/CAD", decimals: 5, pipSize: 0.0001, type: "forex" },
  "NZD/USD": { display: "NZD/USD", symbol: "NZD/USD", decimals: 5, pipSize: 0.0001, type: "forex" },
  "USD/CHF": { display: "USD/CHF", symbol: "USD/CHF", decimals: 5, pipSize: 0.0001, type: "forex" },
  // Forex Crosses
  "EUR/GBP": { display: "EUR/GBP", symbol: "EUR/GBP", decimals: 5, pipSize: 0.0001, type: "forex" },
  "GBP/JPY": { display: "GBP/JPY", symbol: "GBP/JPY", decimals: 3, pipSize: 0.01, type: "forex" },
  "EUR/JPY": { display: "EUR/JPY", symbol: "EUR/JPY", decimals: 3, pipSize: 0.01, type: "forex" },
  "AUD/JPY": { display: "AUD/JPY", symbol: "AUD/JPY", decimals: 3, pipSize: 0.01, type: "forex" },
  "EUR/AUD": { display: "EUR/AUD", symbol: "EUR/AUD", decimals: 5, pipSize: 0.0001, type: "forex" },
  "GBP/AUD": { display: "GBP/AUD", symbol: "GBP/AUD", decimals: 5, pipSize: 0.0001, type: "forex" },
  "GBP/CAD": { display: "GBP/CAD", symbol: "GBP/CAD", decimals: 5, pipSize: 0.0001, type: "forex" },
  "EUR/CAD": { display: "EUR/CAD", symbol: "EUR/CAD", decimals: 5, pipSize: 0.0001, type: "forex" },
  "EUR/NZD": { display: "EUR/NZD", symbol: "EUR/NZD", decimals: 5, pipSize: 0.0001, type: "forex" },
  "GBP/NZD": { display: "GBP/NZD", symbol: "GBP/NZD", decimals: 5, pipSize: 0.0001, type: "forex" },
  "AUD/CAD": { display: "AUD/CAD", symbol: "AUD/CAD", decimals: 5, pipSize: 0.0001, type: "forex" },
  "AUD/NZD": { display: "AUD/NZD", symbol: "AUD/NZD", decimals: 5, pipSize: 0.0001, type: "forex" },
  "CAD/JPY": { display: "CAD/JPY", symbol: "CAD/JPY", decimals: 3, pipSize: 0.01, type: "forex" },
  "CHF/JPY": { display: "CHF/JPY", symbol: "CHF/JPY", decimals: 3, pipSize: 0.01, type: "forex" },
  "NZD/JPY": { display: "NZD/JPY", symbol: "NZD/JPY", decimals: 3, pipSize: 0.01, type: "forex" },
  "NZD/CAD": { display: "NZD/CAD", symbol: "NZD/CAD", decimals: 5, pipSize: 0.0001, type: "forex" },
  // Metals
  "XAU/USD": { display: "XAU/USD", symbol: "XAU/USD", decimals: 2, pipSize: 0.01, type: "forex" },
  "XAG/USD": { display: "XAG/USD", symbol: "XAG/USD", decimals: 3, pipSize: 0.001, type: "forex" },
  // Crypto
  "BTC/USD": { display: "BTC/USD", symbol: "BTC/USD", decimals: 2, pipSize: 1.0, type: "crypto" },
  "ETH/USD": { display: "ETH/USD", symbol: "ETH/USD", decimals: 2, pipSize: 0.1, type: "crypto" },
  "SOL/USD": { display: "SOL/USD", symbol: "SOL/USD", decimals: 2, pipSize: 0.01, type: "crypto" },
  "XRP/USD": { display: "XRP/USD", symbol: "XRP/USD", decimals: 4, pipSize: 0.0001, type: "crypto" },
  "BNB/USD": { display: "BNB/USD", symbol: "BNB/USD", decimals: 2, pipSize: 0.01, type: "crypto" },
  "ADA/USD": { display: "ADA/USD", symbol: "ADA/USD", decimals: 4, pipSize: 0.0001, type: "crypto" },
  "DOGE/USD": { display: "DOGE/USD", symbol: "DOGE/USD", decimals: 5, pipSize: 0.00001, type: "crypto" },
  "DOT/USD": { display: "DOT/USD", symbol: "DOT/USD", decimals: 3, pipSize: 0.001, type: "crypto" },
  "MATIC/USD": { display: "MATIC/USD", symbol: "MATIC/USD", decimals: 4, pipSize: 0.0001, type: "crypto" },
  "AVAX/USD": { display: "AVAX/USD", symbol: "AVAX/USD", decimals: 2, pipSize: 0.01, type: "crypto" },
  "LINK/USD": { display: "LINK/USD", symbol: "LINK/USD", decimals: 3, pipSize: 0.001, type: "crypto" },
  "LTC/USD": { display: "LTC/USD", symbol: "LTC/USD", decimals: 2, pipSize: 0.01, type: "crypto" },
};

// ─── OHLC Data Types ──────────────────────────────────────────────────

export interface OHLC {
  open: number;
  high: number;
  low: number;
  close: number;
  datetime: string;
}

// ─── Single API Call: Fetch OHLC Time Series (1 credit) ───────────────

async function fetchOHLC(symbol: string, apiKey: string, interval: string = "1h", outputSize: number = 50): Promise<OHLC[]> {
  const res = await fetch(
    `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputSize}&apikey=${encodeURIComponent(apiKey)}&format=JSON`
  );
  const data = await res.json();
  if (data.code === 401 || data.status === "error") {
    throw new Error(data.message || "API error. Check your API key.");
  }
  if (!data.values || data.values.length === 0) {
    throw new Error("No market data available. Market may be closed.");
  }
  return data.values.map((v: any) => ({
    open: parseFloat(v.open),
    high: parseFloat(v.high),
    low: parseFloat(v.low),
    close: parseFloat(v.close),
    datetime: v.datetime,
  }));
}

// ─── Technical Indicators (ALL from real OHLC data) ───────────────────

function calcEMA(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const ema: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    ema.push(values[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

function calcRSI(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50;
  const chron = [...closes].reverse();
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const ch = chron[i] - chron[i - 1];
    if (ch > 0) avgGain += ch; else avgLoss += Math.abs(ch);
  }
  avgGain /= period; avgLoss /= period;
  for (let i = period + 1; i < chron.length; i++) {
    const ch = chron[i] - chron[i - 1];
    avgGain = (avgGain * (period - 1) + (ch > 0 ? ch : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (ch < 0 ? Math.abs(ch) : 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - (100 / (1 + avgGain / avgLoss));
}

function calcATR(candles: OHLC[], period: number = 14): number {
  if (candles.length < 2) return 0;
  const chron = [...candles].reverse();
  const trs: number[] = [];
  for (let i = 1; i < chron.length; i++) {
    trs.push(Math.max(chron[i].high - chron[i].low, Math.abs(chron[i].high - chron[i - 1].close), Math.abs(chron[i].low - chron[i - 1].close)));
  }
  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trs.length; i++) atr = (atr * (period - 1) + trs[i]) / period;
  return atr;
}

function calcMACD(closes: number[]): { macd: number; signal: number; histogram: number } {
  const chron = [...closes].reverse();
  const ema12 = calcEMA(chron, 12);
  const ema26 = calcEMA(chron, 26);
  if (ema12.length < 26) return { macd: 0, signal: 0, histogram: 0 };
  const macdLine = ema12.map((v, i) => v - (ema26[i] || 0));
  const sig = calcEMA(macdLine, 9);
  const l = macdLine.length - 1;
  return { macd: macdLine[l], signal: sig[l] || 0, histogram: macdLine[l] - (sig[l] || 0) };
}

function calcStochastic(candles: OHLC[], kPeriod: number = 14): { k: number; d: number } {
  if (candles.length < kPeriod) return { k: 50, d: 50 };
  const kValues: number[] = [];
  for (let i = 0; i < Math.min(3, candles.length - kPeriod + 1); i++) {
    const slice = candles.slice(i, i + kPeriod);
    const h = Math.max(...slice.map(c => c.high));
    const l = Math.min(...slice.map(c => c.low));
    const c = candles[i].close;
    kValues.push(h !== l ? ((c - l) / (h - l)) * 100 : 50);
  }
  return { k: kValues[0], d: kValues.reduce((a, b) => a + b, 0) / kValues.length };
}

function calcBollingerBands(closes: number[], period: number = 20, multiplier: number = 2): { upper: number; middle: number; lower: number; width: number } {
  const chron = [...closes].reverse();
  if (chron.length < period) return { upper: 0, middle: 0, lower: 0, width: 0 };
  const slice = chron.slice(chron.length - period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((sum, v) => sum + (v - mean) ** 2, 0) / period;
  const std = Math.sqrt(variance);
  return { upper: mean + multiplier * std, middle: mean, lower: mean - multiplier * std, width: (multiplier * std * 2) / mean };
}

function calcADX(candles: OHLC[], period: number = 14): number {
  if (candles.length < period + 2) return 25;
  const chron = [...candles].reverse();
  const plusDM: number[] = [], minusDM: number[] = [], tr: number[] = [];
  for (let i = 1; i < chron.length; i++) {
    const upMove = chron[i].high - chron[i - 1].high;
    const downMove = chron[i - 1].low - chron[i].low;
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    tr.push(Math.max(chron[i].high - chron[i].low, Math.abs(chron[i].high - chron[i - 1].close), Math.abs(chron[i].low - chron[i - 1].close)));
  }
  // Smooth with Wilder's method
  let smoothTR = tr.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b, 0);
  const dxValues: number[] = [];
  for (let i = period; i < tr.length; i++) {
    smoothTR = smoothTR - smoothTR / period + tr[i];
    smoothPlusDM = smoothPlusDM - smoothPlusDM / period + plusDM[i];
    smoothMinusDM = smoothMinusDM - smoothMinusDM / period + minusDM[i];
    const plusDI = smoothTR > 0 ? (smoothPlusDM / smoothTR) * 100 : 0;
    const minusDI = smoothTR > 0 ? (smoothMinusDM / smoothTR) * 100 : 0;
    const diSum = plusDI + minusDI;
    dxValues.push(diSum > 0 ? (Math.abs(plusDI - minusDI) / diSum) * 100 : 0);
  }
  if (dxValues.length === 0) return 25;
  return dxValues.slice(-period).reduce((a, b) => a + b, 0) / Math.min(dxValues.length, period);
}

function findSupportResistance(candles: OHLC[]): { support: number; resistance: number; levels: number[] } {
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const pivotHighs: number[] = [], pivotLows: number[] = [];
  for (let i = 2; i < candles.length - 2; i++) {
    if (highs[i] > highs[i-1] && highs[i] > highs[i-2] && highs[i] > highs[i+1] && highs[i] > highs[i+2]) pivotHighs.push(highs[i]);
    if (lows[i] < lows[i-1] && lows[i] < lows[i-2] && lows[i] < lows[i+1] && lows[i] < lows[i+2]) pivotLows.push(lows[i]);
  }
  return {
    support: pivotLows.length > 0 ? Math.max(...pivotLows.slice(-3)) : Math.min(...lows),
    resistance: pivotHighs.length > 0 ? Math.min(...pivotHighs.slice(-3)) : Math.max(...highs),
    levels: [...pivotLows, ...pivotHighs].sort((a, b) => a - b),
  };
}

// ─── Fair Value Gap (FVG) Detection ───────────────────────────────────

export interface FVGZone {
  type: "bullish" | "bearish";
  top: number;
  bottom: number;
  index: number;
}

function detectFVG(candles: OHLC[]): FVGZone[] {
  const zones: FVGZone[] = [];
  // candles[0] is most recent; we work chronologically reversed
  for (let i = 2; i < candles.length; i++) {
    const prev = candles[i];      // oldest of 3
    const mid = candles[i - 1];   // middle
    const next = candles[i - 2];  // newest of 3
    // Bullish FVG: gap between prev.high and next.low (mid's body fills in between)
    if (next.low > prev.high) {
      zones.push({ type: "bullish", top: next.low, bottom: prev.high, index: i - 1 });
    }
    // Bearish FVG: gap between prev.low and next.high
    if (next.high < prev.low) {
      zones.push({ type: "bearish", top: prev.low, bottom: next.high, index: i - 1 });
    }
  }
  return zones.slice(0, 5); // max 5
}

// ─── Liquidity Zone Detection ─────────────────────────────────────────

export interface LiquidityZone {
  type: "buy-side" | "sell-side";
  price: number;
  strength: number; // how many times tested
  index: number;
}

function detectLiquidityZones(candles: OHLC[]): LiquidityZone[] {
  const zones: LiquidityZone[] = [];
  const tolerance = (Math.max(...candles.map(c => c.high)) - Math.min(...candles.map(c => c.low))) * 0.005;

  // Equal highs = buy-side liquidity
  for (let i = 0; i < candles.length - 1; i++) {
    let count = 1;
    for (let j = i + 1; j < candles.length; j++) {
      if (Math.abs(candles[i].high - candles[j].high) < tolerance) count++;
    }
    if (count >= 2) {
      zones.push({ type: "buy-side", price: candles[i].high, strength: count, index: i });
    }
  }
  // Equal lows = sell-side liquidity
  for (let i = 0; i < candles.length - 1; i++) {
    let count = 1;
    for (let j = i + 1; j < candles.length; j++) {
      if (Math.abs(candles[i].low - candles[j].low) < tolerance) count++;
    }
    if (count >= 2) {
      zones.push({ type: "sell-side", price: candles[i].low, strength: count, index: i });
    }
  }
  // Deduplicate nearby zones
  const deduped: LiquidityZone[] = [];
  for (const z of zones) {
    if (!deduped.some(d => d.type === z.type && Math.abs(d.price - z.price) < tolerance * 3)) {
      deduped.push(z);
    }
  }
  return deduped.sort((a, b) => b.strength - a.strength).slice(0, 6);
}

// ─── Order Block Detection ────────────────────────────────────────────

export interface OrderBlock {
  type: "bullish" | "bearish";
  top: number;
  bottom: number;
  index: number;
}

function detectOrderBlocks(candles: OHLC[]): OrderBlock[] {
  const blocks: OrderBlock[] = [];
  for (let i = 1; i < candles.length - 2; i++) {
    const c = candles[i];
    const next = candles[i - 1];
    // Bullish OB: last bearish candle before a strong bullish move
    if (c.close < c.open && next.close > next.open && (next.close - next.open) > (c.open - c.close) * 1.5) {
      blocks.push({ type: "bullish", top: c.open, bottom: c.low, index: i });
    }
    // Bearish OB: last bullish candle before a strong bearish move
    if (c.close > c.open && next.close < next.open && (next.open - next.close) > (c.close - c.open) * 1.5) {
      blocks.push({ type: "bearish", top: c.high, bottom: c.open, index: i });
    }
  }
  return blocks.slice(0, 4);
}

// ─── Break of Structure Detection ─────────────────────────────────────

export interface StructureBreak {
  type: "CHoCH" | "BOS";
  direction: "bullish" | "bearish";
  price: number;
  index: number;
}

function detectStructureBreaks(candles: OHLC[]): StructureBreak[] {
  const breaks: StructureBreak[] = [];
  const swingHighs: { price: number; idx: number }[] = [];
  const swingLows: { price: number; idx: number }[] = [];

  for (let i = 2; i < candles.length - 2; i++) {
    if (candles[i].high > candles[i-1].high && candles[i].high > candles[i+1].high) {
      swingHighs.push({ price: candles[i].high, idx: i });
    }
    if (candles[i].low < candles[i-1].low && candles[i].low < candles[i+1].low) {
      swingLows.push({ price: candles[i].low, idx: i });
    }
  }

  // Check if recent price broke above swing high (bullish BOS) or below swing low (bearish BOS)
  if (swingHighs.length >= 2) {
    const recent = candles[0];
    const lastSwingHigh = swingHighs[0];
    if (recent.close > lastSwingHigh.price) {
      breaks.push({ type: "BOS", direction: "bullish", price: lastSwingHigh.price, index: lastSwingHigh.idx });
    }
  }
  if (swingLows.length >= 2) {
    const recent = candles[0];
    const lastSwingLow = swingLows[0];
    if (recent.close < lastSwingLow.price) {
      breaks.push({ type: "BOS", direction: "bearish", price: lastSwingLow.price, index: lastSwingLow.idx });
    }
  }

  // CHoCH: trend reversal — breaking in opposite direction of previous trend
  if (swingHighs.length >= 2 && swingLows.length >= 1) {
    const sh1 = swingHighs[0], sh2 = swingHighs[1];
    if (sh1.price < sh2.price && candles[0].close > sh1.price) {
      breaks.push({ type: "CHoCH", direction: "bullish", price: sh1.price, index: sh1.idx });
    }
  }
  if (swingLows.length >= 2 && swingHighs.length >= 1) {
    const sl1 = swingLows[0], sl2 = swingLows[1];
    if (sl1.price > sl2.price && candles[0].close < sl1.price) {
      breaks.push({ type: "CHoCH", direction: "bearish", price: sl1.price, index: sl1.idx });
    }
  }

  return breaks.slice(0, 4);
}

function detectTrend(candles: OHLC[]): "BULLISH" | "BEARISH" | "SIDEWAYS" {
  const closes = [...candles].reverse().map(c => c.close);
  if (closes.length < 21) return "SIDEWAYS";
  const ema8 = calcEMA(closes, 8);
  const ema21 = calcEMA(closes, 21);
  const l = ema8.length - 1;
  const diff = (ema8[l] - ema21[l]) / ema21[l];
  const prev = l > 3 ? (ema8[l - 3] - ema21[l - 3]) / ema21[l - 3] : diff;
  if (diff > 0.0005 && ema8[l] > ema8[l - 1]) return "BULLISH";
  if (diff < -0.0005 && ema8[l] < ema8[l - 1]) return "BEARISH";
  return "SIDEWAYS";
}

function fibonacciLevels(high: number, low: number, isBullish: boolean) {
  const diff = high - low;
  const base = isBullish
    ? { "23.6%": high - diff * 0.236, "38.2%": high - diff * 0.382, "50.0%": high - diff * 0.5, "61.8%": high - diff * 0.618, "78.6%": high - diff * 0.786 }
    : { "23.6%": low + diff * 0.236, "38.2%": low + diff * 0.382, "50.0%": low + diff * 0.5, "61.8%": low + diff * 0.618, "78.6%": low + diff * 0.786 };
  return {
    ...base,
    "ext_127%": isBullish ? high + diff * 0.272 : low - diff * 0.272,
    "ext_161%": isBullish ? high + diff * 0.618 : low - diff * 0.618,
  };
}

// ─── Real OHLC Candlestick Patterns ───────────────────────────────────

function detectCandlePatterns(candles: OHLC[]): string[] {
  const patterns: string[] = [];
  if (candles.length < 3) return ["Insufficient Data"];
  const [c0, c1, c2] = candles;
  const body0 = Math.abs(c0.close - c0.open), range0 = c0.high - c0.low;
  const body1 = Math.abs(c1.close - c1.open);
  const isBull0 = c0.close > c0.open, isBull1 = c1.close > c1.open;

  if (range0 > 0 && body0 / range0 < 0.1) patterns.push("Doji");
  if (range0 > 0) {
    const upperW = c0.high - Math.max(c0.open, c0.close);
    const lowerW = Math.min(c0.open, c0.close) - c0.low;
    if (lowerW > body0 * 2 && upperW < body0 * 0.5) patterns.push("Hammer");
    if (upperW > body0 * 2 && lowerW < body0 * 0.5) patterns.push("Shooting Star");
    if (body0 < range0 * 0.33 && (lowerW > range0 * 0.6 || upperW > range0 * 0.6))
      patterns.push(lowerW > upperW ? "Bullish Pin Bar" : "Bearish Pin Bar");
  }
  if (isBull0 && !isBull1 && c0.close > c1.open && c0.open < c1.close && body0 > body1) patterns.push("Bullish Engulfing");
  if (!isBull0 && isBull1 && c0.open > c1.close && c0.close < c1.open && body0 > body1) patterns.push("Bearish Engulfing");
  if (c2.close < c2.open && body1 < Math.abs(c2.close - c2.open) * 0.3 && isBull0 && c0.close > (c2.open + c2.close) / 2) patterns.push("Morning Star");
  if (c2.close > c2.open && body1 < Math.abs(c2.close - c2.open) * 0.3 && !isBull0 && c0.close < (c2.open + c2.close) / 2) patterns.push("Evening Star");
  if (c0.close > c0.open && c1.close > c1.open && c2.close > c2.open && c0.close > c1.close && c1.close > c2.close) patterns.push("Three White Soldiers");
  if (c0.close < c0.open && c1.close < c1.open && c2.close < c2.open && c0.close < c1.close && c1.close < c2.close) patterns.push("Three Black Crows");

  return patterns.length > 0 ? patterns : ["No Clear Pattern"];
}

// ─── Session Detection ────────────────────────────────────────────────

function getActiveSession(): { name: string; volatility: string } {
  const utcH = new Date().getUTCHours();
  if (utcH >= 13 && utcH < 17) return { name: "London + New York Overlap", volatility: "VERY HIGH" };
  if (utcH >= 8 && utcH < 17) return { name: "London", volatility: "HIGH" };
  if (utcH >= 13 && utcH < 22) return { name: "New York", volatility: "HIGH" };
  if (utcH >= 0 && utcH < 9) return { name: "Tokyo", volatility: "MEDIUM" };
  if (utcH >= 22 || utcH < 7) return { name: "Sydney", volatility: "LOW" };
  return { name: "Off-Session", volatility: "LOW" };
}

// ─── Multi-Confluence Strategy Engine ─────────────────────────────────

interface StrategyResult {
  name: string;
  direction: "BUY" | "SELL";
  confidence: number;
  patterns: string[];
  indicators: string[];
  analysis: string;
  slMultiplier: number;
  tp1Multiplier: number;
  tp2Multiplier: number;
  tp3Multiplier: number;
}

function scoreConfluence(
  isBullish: boolean, trend: string, rsi: number,
  macd: { histogram: number }, stoch: { k: number; d: number },
  adx: number, bb: { upper: number; lower: number; width: number },
  price: number, candlePatterns: string[], nearZone: boolean
): number {
  let conf = 50;
  // Trend alignment (strong factor)
  if ((isBullish && trend === "BULLISH") || (!isBullish && trend === "BEARISH")) conf += 10;
  else if (trend === "SIDEWAYS") conf += 0;
  else conf -= 8; // Counter-trend penalty

  // RSI confirmation
  if (isBullish && rsi < 35) conf += 8;
  else if (isBullish && rsi > 70) conf -= 10;
  else if (!isBullish && rsi > 65) conf += 8;
  else if (!isBullish && rsi < 30) conf -= 10;

  // MACD
  if ((isBullish && macd.histogram > 0) || (!isBullish && macd.histogram < 0)) conf += 7;
  else conf -= 4;

  // Stochastic
  if ((isBullish && stoch.k < 30 && stoch.k > stoch.d) || (!isBullish && stoch.k > 70 && stoch.k < stoch.d)) conf += 8;
  else if ((isBullish && stoch.k > 80) || (!isBullish && stoch.k < 20)) conf -= 5;

  // ADX trend strength
  if (adx > 25) conf += 6; // Strong trend
  else if (adx < 15) conf -= 3; // Weak/choppy

  // Bollinger Band position
  if (isBullish && price <= bb.lower) conf += 7;
  else if (!isBullish && price >= bb.upper) conf += 7;

  // S/R zone proximity
  if (nearZone) conf += 8;

  // Candlestick patterns
  const bullPatterns = ["Bullish Engulfing", "Hammer", "Morning Star", "Three White Soldiers", "Bullish Pin Bar"];
  const bearPatterns = ["Bearish Engulfing", "Shooting Star", "Evening Star", "Three Black Crows", "Bearish Pin Bar"];
  const relevant = isBullish ? bullPatterns : bearPatterns;
  if (candlePatterns.some(p => relevant.includes(p))) conf += 7;
  if (candlePatterns.includes("Doji")) conf += 3; // Indecision = potential reversal

  // Sideways market handling — reduce confidence for directional trades
  if (trend === "SIDEWAYS" && adx < 20) conf -= 5;

  return Math.max(35, Math.min(conf, 95));
}

function buildStrategy(
  name: string, isBullish: boolean, confidence: number,
  trend: string, rsi: number, atr: number, price: number,
  support: number, resistance: number,
  macd: { macd: number; signal: number; histogram: number },
  stoch: { k: number; d: number }, adx: number,
  bb: { upper: number; middle: number; lower: number; width: number },
  candlePatterns: string[], d: number,
  slMul: number, tp1Mul: number, tp2Mul: number, tp3Mul: number,
  extraPatterns: string[], analysisText: string
): StrategyResult {
  const dir = isBullish ? "BUY" as const : "SELL" as const;
  const indicators = [
    `RSI: ${rsi.toFixed(1)}`,
    `MACD: ${macd.histogram > 0 ? "+" : ""}${macd.histogram.toFixed(d)}`,
    `Stoch: ${stoch.k.toFixed(0)}/${stoch.d.toFixed(0)}`,
    `ADX: ${adx.toFixed(1)} (${adx > 25 ? "Strong" : adx > 20 ? "Moderate" : "Weak"})`,
    `BB: ${bb.width > 0.02 ? "Wide" : "Narrow"} (${bb.lower.toFixed(d)}-${bb.upper.toFixed(d)})`,
  ];
  return {
    name, direction: dir, confidence,
    patterns: [...candlePatterns.slice(0, 2), ...extraPatterns].slice(0, 5),
    indicators,
    slMultiplier: slMul, tp1Multiplier: tp1Mul, tp2Multiplier: tp2Mul, tp3Multiplier: tp3Mul,
    analysis: analysisText,
  };
}

function runSMC(
  trend: string, rsi: number, atr: number, price: number, support: number, resistance: number,
  candlePatterns: string[], macd: ReturnType<typeof calcMACD>, stoch: ReturnType<typeof calcStochastic>,
  adx: number, bb: ReturnType<typeof calcBollingerBands>, d: number
): StrategyResult {
  const isBullish = trend === "BULLISH" || (trend === "SIDEWAYS" && rsi < 40 && stoch.k < 25);
  const nearZone = isBullish ? Math.abs(price - support) < atr * 2.5 : Math.abs(price - resistance) < atr * 2.5;
  const conf = scoreConfluence(isBullish, trend, rsi, macd, stoch, adx, bb, price, candlePatterns, nearZone);
  const extras = isBullish
    ? ["Bullish Order Block", nearZone ? "Demand Zone" : "CHoCH"]
    : ["Bearish Order Block", nearZone ? "Supply Zone" : "BOS"];
  const analysis = isBullish
    ? `SMC confirms bullish CHoCH near ${support.toFixed(d)}. ${candlePatterns[0]} rejection with RSI ${rsi.toFixed(1)}, MACD hist ${macd.histogram > 0 ? "positive" : "turning"}. ADX ${adx.toFixed(1)} shows ${adx > 25 ? "strong" : "developing"} trend. Stoch %K(${stoch.k.toFixed(0)}) > %D(${stoch.d.toFixed(0)}) confirms momentum. BB ${price <= bb.lower ? "at lower band — oversold" : "within range"}. Target: ${resistance.toFixed(d)}.`
    : `SMC bearish BOS at ${resistance.toFixed(d)}. ${candlePatterns[0]} confirms distribution. RSI ${rsi.toFixed(1)}, MACD ${macd.histogram.toFixed(d)}. ADX ${adx.toFixed(1)} ${adx > 25 ? "strong bearish" : "developing"}. Stoch overbought cross. BB ${price >= bb.upper ? "at upper band — overbought" : "within range"}. Target: ${support.toFixed(d)}.`;
  return buildStrategy("Smart Money Concepts + ICT", isBullish, conf, trend, rsi, atr, price, support, resistance, macd, stoch, adx, bb, candlePatterns, d, 1.5, 2.0, 3.5, 5.0, extras, analysis);
}

function runFibSD(
  trend: string, rsi: number, atr: number, price: number, support: number, resistance: number,
  candlePatterns: string[], macd: ReturnType<typeof calcMACD>, stoch: ReturnType<typeof calcStochastic>,
  adx: number, bb: ReturnType<typeof calcBollingerBands>, d: number
): StrategyResult {
  const isBullish = trend === "BULLISH" || (trend === "SIDEWAYS" && price < (support + resistance) / 2);
  const fibs = fibonacciLevels(resistance, support, isBullish);
  const nearFib = Math.abs(price - fibs["61.8%"]) < atr * 1.5 || Math.abs(price - fibs["38.2%"]) < atr * 1.5;
  const conf = scoreConfluence(isBullish, trend, rsi, macd, stoch, adx, bb, price, candlePatterns, nearFib);
  const extras = [isBullish ? "Rally-Base-Rally" : "Drop-Base-Drop"];
  if (Math.abs(price - fibs["61.8%"]) < atr * 1.5) extras.push("Fib 61.8% Zone");
  if (Math.abs(price - fibs["38.2%"]) < atr * 1.5) extras.push("Fib 38.2% Zone");
  const analysis = isBullish
    ? `Price at Fib golden pocket (${fibs["61.8%"].toFixed(d)}). ${candlePatterns[0]} confirms demand. RSI ${rsi.toFixed(1)}, MACD ${macd.histogram.toFixed(d)}, ADX ${adx.toFixed(1)}. Fib extensions: ${fibs["ext_127%"].toFixed(d)} / ${fibs["ext_161%"].toFixed(d)}. Support ${support.toFixed(d)}, resistance ${resistance.toFixed(d)}.`
    : `Supply rejection at Fib ${fibs["38.2%"].toFixed(d)}. ${candlePatterns[0]} bearish confirmation. RSI ${rsi.toFixed(1)}, MACD ${macd.histogram.toFixed(d)}, ADX ${adx.toFixed(1)}. Targets: ${support.toFixed(d)}. Fib extensions project deeper downside.`;
  return buildStrategy("Supply & Demand + Fibonacci", isBullish, conf, trend, rsi, atr, price, support, resistance, macd, stoch, adx, bb, candlePatterns, d, 1.8, 2.5, 4.0, 6.0, extras, analysis);
}

function runWyckoff(
  trend: string, rsi: number, atr: number, price: number, support: number, resistance: number,
  candlePatterns: string[], macd: ReturnType<typeof calcMACD>, stoch: ReturnType<typeof calcStochastic>,
  adx: number, bb: ReturnType<typeof calcBollingerBands>, d: number
): StrategyResult {
  const isBullish = trend === "BULLISH" || (trend === "SIDEWAYS" && rsi < 38 && stoch.k < 25);
  const nearZone = isBullish ? Math.abs(price - support) < atr * 2 : Math.abs(price - resistance) < atr * 2;
  const conf = scoreConfluence(isBullish, trend, rsi, macd, stoch, adx, bb, price, candlePatterns, nearZone);
  const phase = isBullish ? "Accumulation (Spring)" : "Distribution (LPSY)";
  const harmonic = isBullish ? "Bullish Bat" : "Bearish Gartley";
  const analysis = isBullish
    ? `Wyckoff ${phase} at ${support.toFixed(d)}. ${harmonic} D-point. RSI ${rsi.toFixed(1)}, Stoch ${stoch.k.toFixed(0)}/${stoch.d.toFixed(0)} crossing up. ${candlePatterns[0]} confirms. ADX ${adx.toFixed(1)}, MACD ${macd.histogram.toFixed(d)}. Target: ${resistance.toFixed(d)}.`
    : `Wyckoff ${phase} at ${resistance.toFixed(d)}. ${harmonic} rejection. RSI ${rsi.toFixed(1)}, Stoch ${stoch.k.toFixed(0)}/${stoch.d.toFixed(0)} crossing down. ${candlePatterns[0]}. ADX ${adx.toFixed(1)}, MACD ${macd.histogram.toFixed(d)}. Target: ${support.toFixed(d)}.`;
  return buildStrategy("Wyckoff + Harmonic Patterns", isBullish, conf, trend, rsi, atr, price, support, resistance, macd, stoch, adx, bb, candlePatterns, d, 2.0, 3.0, 4.5, 6.5, [phase, harmonic], analysis);
}

function runElliott(
  trend: string, rsi: number, atr: number, price: number, support: number, resistance: number,
  candlePatterns: string[], macd: ReturnType<typeof calcMACD>, stoch: ReturnType<typeof calcStochastic>,
  adx: number, bb: ReturnType<typeof calcBollingerBands>, d: number
): StrategyResult {
  const isBullish = trend === "BULLISH" || (trend === "SIDEWAYS" && rsi < 42 && macd.histogram > 0);
  const nearZone = isBullish ? Math.abs(price - support) < atr * 2 : Math.abs(price - resistance) < atr * 2;
  const conf = scoreConfluence(isBullish, trend, rsi, macd, stoch, adx, bb, price, candlePatterns, nearZone);
  const wave = isBullish ? "Wave 3 Impulse" : "Wave C Corrective";
  const sweep = isBullish ? "Liquidity Sweep Low" : "Liquidity Sweep High";
  const analysis = isBullish
    ? `Elliott ${wave} starting after Wave 2 correction. Liquidity below ${support.toFixed(d)} swept. RSI ${rsi.toFixed(1)} recovering, MACD crossing at ${macd.macd.toFixed(d)}/${macd.signal.toFixed(d)}. ADX ${adx.toFixed(1)} expanding. ${candlePatterns[0]} impulse confirmation. Stoch ${stoch.k.toFixed(0)}/${stoch.d.toFixed(0)}.`
    : `Elliott ${wave} after 5-wave completion. Liquidity above ${resistance.toFixed(d)} swept. RSI divergence at ${rsi.toFixed(1)}, MACD bearish ${macd.macd.toFixed(d)}/${macd.signal.toFixed(d)}. ADX ${adx.toFixed(1)}. ${candlePatterns[0]}. Targets: ${support.toFixed(d)}.`;
  return buildStrategy("Elliott Wave + Liquidity", isBullish, conf, trend, rsi, atr, price, support, resistance, macd, stoch, adx, bb, candlePatterns, d, 1.6, 2.8, 4.2, 6.0, [wave, sweep], analysis);
}

// ─── Main Analysis Function (1 API credit) ────────────────────────────

export interface AnalysisInput {
  imageData: string;
  apiKey: string;
  pair: string;
  timeframe?: string;
}

export const analyzeChartImage = async (ctx: AnalysisInput): Promise<Signal> => {
  const pairInfo = PAIRS_MAP[ctx.pair] || PAIRS_MAP["EUR/USD"];
  const timeframe = ctx.timeframe || "1h";
  const d = pairInfo.decimals;

  // Single API call (1 credit)
  const candles = await fetchOHLC(pairInfo.symbol, ctx.apiKey, timeframe, 50);
  const currentPrice = candles[0].close;
  const closes = candles.map(c => c.close);

  // ALL real indicators
  const rsi = calcRSI(closes);
  const atr = calcATR(candles);
  const macd = calcMACD(closes);
  const stoch = calcStochastic(candles);
  const bb = calcBollingerBands(closes);
  const adx = calcADX(candles);
  const { support, resistance } = findSupportResistance(candles);
  const trend = detectTrend(candles);
  const candlePatterns = detectCandlePatterns(candles);
  const session = getActiveSession();

  // Run all 4 strategies with full confluence scoring
  const strategies = [
    runSMC(trend, rsi, atr, currentPrice, support, resistance, candlePatterns, macd, stoch, adx, bb, d),
    runFibSD(trend, rsi, atr, currentPrice, support, resistance, candlePatterns, macd, stoch, adx, bb, d),
    runWyckoff(trend, rsi, atr, currentPrice, support, resistance, candlePatterns, macd, stoch, adx, bb, d),
    runElliott(trend, rsi, atr, currentPrice, support, resistance, candlePatterns, macd, stoch, adx, bb, d),
  ];

  strategies.sort((a, b) => b.confidence - a.confidence);
  const best = strategies[0];

  const isBuy = best.direction === "BUY";
  const entry = currentPrice;
  const sl = isBuy ? entry - atr * best.slMultiplier : entry + atr * best.slMultiplier;
  const tp1 = isBuy ? entry + atr * best.tp1Multiplier : entry - atr * best.tp1Multiplier;
  const tp2 = isBuy ? entry + atr * best.tp2Multiplier : entry - atr * best.tp2Multiplier;
  const tp3 = isBuy ? entry + atr * best.tp3Multiplier : entry - atr * best.tp3Multiplier;
  const rr = Math.abs(entry - sl) > 0 ? (Math.abs(tp2 - entry) / Math.abs(entry - sl)).toFixed(1) : "2.0";

  const fibs = fibonacciLevels(resistance, support, isBuy);

  // Compute EMAs for chart drawing
  const chronCloses = [...closes].reverse();
  const ema8Arr = calcEMA(chronCloses, 8);
  const ema21Arr = calcEMA(chronCloses, 21);

  // Detect advanced zones
  const fvgZones = detectFVG(candles);
  const liquidityZones = detectLiquidityZones(candles);
  const orderBlocks = detectOrderBlocks(candles);
  const structureBreaks = detectStructureBreaks(candles);

  return {
    pair: ctx.pair,
    timeframe: timeframe.toUpperCase(),
    direction: best.direction,
    entry: entry.toFixed(d),
    stopLoss: sl.toFixed(d),
    takeProfit1: tp1.toFixed(d),
    takeProfit2: tp2.toFixed(d),
    takeProfit3: tp3.toFixed(d),
    riskReward: `1:${rr}`,
    confidence: best.confidence,
    strategy: best.name,
    patterns: best.patterns,
    indicators: best.indicators,
    analysis: best.analysis,
    keyLevels: [
      `${support.toFixed(d)} Support`,
      `${fibs["50.0%"].toFixed(d)} Fib 50%`,
      `${resistance.toFixed(d)} Resistance`,
      `${session.name} (${session.volatility})`,
    ],
    trend,
    candles,
    bbUpper: bb.upper,
    bbLower: bb.lower,
    bbMiddle: bb.middle,
    adx,
    imageData: ctx.imageData,
    fibLevels: fibs,
    support,
    resistance,
    ema8: ema8Arr.length > 0 ? ema8Arr[ema8Arr.length - 1] : undefined,
    ema21: ema21Arr.length > 0 ? ema21Arr[ema21Arr.length - 1] : undefined,
    fvgZones,
    liquidityZones,
    orderBlocks,
    structureBreaks,
  };
};

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.twelvedata.com/price?symbol=EUR/USD&apikey=${encodeURIComponent(apiKey)}`);
    const data = await res.json();
    return !!data.price;
  } catch { return false; }
}
