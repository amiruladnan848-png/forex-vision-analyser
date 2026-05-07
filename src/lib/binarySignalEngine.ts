// Binary 1-minute signal engine — manual trigger only.
// Pulls 1min OHLC from market data API and combines multiple professional binary strategies:
//  • EMA(5/13) cross + slope
//  • RSI(7) extremes & midline reversal
//  • Bollinger band touch with rejection candle
//  • Momentum / ROC
//  • Candle pattern (engulfing, pin bar, doji at zone)
//  • Stochastic %K/%D cross
//  • Price action vs S/R micro-pivots
//  • Volatility / ADX gate (avoid choppy)
// Returns CALL/PUT verdict for the NEXT 1-min candle close, with confidence and expiry time in user TZ.

import { PAIRS_MAP, type OHLC } from "./analysisEngine";

// Re-implement minimal needed indicators (kept local to avoid circular deps if engine changes)
function ema(values: number[], period: number): number[] {
  if (!values.length) return [];
  const k = 2 / (period + 1);
  const out = [values[0]];
  for (let i = 1; i < values.length; i++) out.push(values[i] * k + out[i - 1] * (1 - k));
  return out;
}
function rsi(closes: number[], period = 7): number {
  if (closes.length < period + 1) return 50;
  const c = [...closes].reverse();
  let g = 0, l = 0;
  for (let i = 1; i <= period; i++) {
    const d = c[i] - c[i - 1];
    if (d > 0) g += d; else l += -d;
  }
  g /= period; l /= period;
  for (let i = period + 1; i < c.length; i++) {
    const d = c[i] - c[i - 1];
    g = (g * (period - 1) + (d > 0 ? d : 0)) / period;
    l = (l * (period - 1) + (d < 0 ? -d : 0)) / period;
  }
  if (l === 0) return 100;
  return 100 - 100 / (1 + g / l);
}
function bb(closes: number[], period = 20, mult = 2) {
  const c = [...closes].reverse();
  if (c.length < period) return { upper: 0, lower: 0, middle: 0 };
  const slice = c.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period);
  return { upper: mean + mult * std, lower: mean - mult * std, middle: mean };
}
function stoch(candles: OHLC[], k = 14) {
  if (candles.length < k) return { k: 50, d: 50 };
  const ks: number[] = [];
  for (let i = 0; i < Math.min(3, candles.length - k + 1); i++) {
    const slice = candles.slice(i, i + k);
    const h = Math.max(...slice.map(c => c.high));
    const l = Math.min(...slice.map(c => c.low));
    ks.push(h !== l ? ((candles[i].close - l) / (h - l)) * 100 : 50);
  }
  return { k: ks[0], d: ks.reduce((a, b) => a + b, 0) / ks.length };
}
function adxApprox(candles: OHLC[], period = 14): number {
  if (candles.length < period + 2) return 20;
  const c = [...candles].reverse();
  let trSum = 0, plus = 0, minus = 0;
  for (let i = c.length - period; i < c.length; i++) {
    const up = c[i].high - c[i - 1].high;
    const dn = c[i - 1].low - c[i].low;
    trSum += Math.max(c[i].high - c[i].low, Math.abs(c[i].high - c[i - 1].close), Math.abs(c[i].low - c[i - 1].close));
    if (up > dn && up > 0) plus += up;
    if (dn > up && dn > 0) minus += dn;
  }
  const di = trSum > 0 ? Math.abs(plus - minus) / (plus + minus + 1e-9) * 100 : 0;
  return Math.min(60, di);
}

const cache = new Map<string, { candles: OHLC[]; ts: number }>();

async function fetchMin1(symbol: string, apiKey: string): Promise<OHLC[]> {
  const key = `${symbol}:1min`;
  const c = cache.get(key);
  // 25s TTL — keeps freshness for binary while reducing credits
  if (c && Date.now() - c.ts < 25_000) return c.candles;
  const res = await fetch(
    `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=1min&outputsize=60&apikey=${encodeURIComponent(apiKey)}&format=JSON`
  );
  const data = await res.json();
  if (data.status === "error" || !data.values) {
    throw new Error(data.message || "Market data unavailable. Market may be closed.");
  }
  const candles: OHLC[] = data.values.map((v: any) => ({
    open: +v.open, high: +v.high, low: +v.low, close: +v.close, datetime: v.datetime,
  }));
  cache.set(key, { candles, ts: Date.now() });
  return candles;
}

export interface BinarySignal {
  pair: string;
  direction: "CALL" | "PUT";
  confidence: number;
  expiry: string;          // local time HH:mm:ss
  expiryISO: string;
  countdownMs: number;
  reasons: string[];
  indicators: string[];
  caution?: string;
}

export async function generateBinarySignal(pair: string, apiKey: string): Promise<BinarySignal> {
  const info = PAIRS_MAP[pair];
  if (!info) throw new Error("Unknown pair");

  const candles = await fetchMin1(info.symbol, apiKey);
  if (candles.length < 25) throw new Error("Not enough market data");

  const closes = candles.map(c => c.close);
  const chron = [...closes].reverse();
  const ema5 = ema(chron, 5);
  const ema13 = ema(chron, 13);
  const ema50 = ema(chron, Math.min(50, chron.length));
  const e5 = ema5[ema5.length - 1], e13 = ema13[ema13.length - 1], e50 = ema50[ema50.length - 1];
  const e5Prev = ema5[ema5.length - 2] ?? e5;
  const e13Prev = ema13[ema13.length - 2] ?? e13;
  const r = rsi(closes, 7);
  const bands = bb(closes, 20, 2);
  const st = stoch(candles, 14);
  const adx = adxApprox(candles);

  const c0 = candles[0], c1 = candles[1], c2 = candles[2];
  const body0 = Math.abs(c0.close - c0.open);
  const range0 = c0.high - c0.low || 1e-9;
  const upperW = c0.high - Math.max(c0.open, c0.close);
  const lowerW = Math.min(c0.open, c0.close) - c0.low;
  const isBull0 = c0.close > c0.open;
  const isBull1 = c1.close > c1.open;

  // Micro S/R from last 30 candles
  const recent = candles.slice(0, 30);
  const microSupport = Math.min(...recent.map(c => c.low));
  const microResistance = Math.max(...recent.map(c => c.high));
  const atr = recent.slice(0, 14).reduce((s, c) => s + (c.high - c.low), 0) / 14;

  let bullScore = 0, bearScore = 0;
  const reasons: string[] = [];

  // 1. EMA cross & slope
  if (e5 > e13 && e5Prev <= e13Prev) { bullScore += 14; reasons.push("EMA5/13 bullish cross"); }
  else if (e5 < e13 && e5Prev >= e13Prev) { bearScore += 14; reasons.push("EMA5/13 bearish cross"); }
  else if (e5 > e13 && e5 > e5Prev) { bullScore += 7; reasons.push("EMA5 above EMA13 with up-slope"); }
  else if (e5 < e13 && e5 < e5Prev) { bearScore += 7; reasons.push("EMA5 below EMA13 with down-slope"); }

  // 2. EMA50 macro filter
  if (e5 > e50) bullScore += 4; else bearScore += 4;

  // 3. RSI extremes & midline reversal
  if (r < 25) { bullScore += 12; reasons.push(`RSI(7) oversold ${r.toFixed(0)}`); }
  else if (r > 75) { bearScore += 12; reasons.push(`RSI(7) overbought ${r.toFixed(0)}`); }
  else if (r > 50 && r < 65) bullScore += 4;
  else if (r < 50 && r > 35) bullScore += 4;

  // 4. Bollinger band rejection
  if (c0.low <= bands.lower && c0.close > bands.lower) { bullScore += 10; reasons.push("BB lower-band rejection"); }
  if (c0.high >= bands.upper && c0.close < bands.upper) { bearScore += 10; reasons.push("BB upper-band rejection"); }

  // 5. Stochastic cross
  if (st.k < 25 && st.k > st.d) { bullScore += 8; reasons.push("Stoch oversold cross up"); }
  if (st.k > 75 && st.k < st.d) { bearScore += 8; reasons.push("Stoch overbought cross down"); }

  // 6. Candle pattern at micro zone
  const atSupport = Math.abs(c0.low - microSupport) < atr * 0.6;
  const atResistance = Math.abs(c0.high - microResistance) < atr * 0.6;
  if (lowerW > body0 * 2 && upperW < body0 * 0.6 && atSupport) { bullScore += 12; reasons.push("Hammer/Pin at support"); }
  if (upperW > body0 * 2 && lowerW < body0 * 0.6 && atResistance) { bearScore += 12; reasons.push("Shooting star at resistance"); }
  if (isBull0 && !isBull1 && c0.close > c1.open && c0.open < c1.close && body0 > Math.abs(c1.close - c1.open))
    { bullScore += 10; reasons.push("Bullish engulfing"); }
  if (!isBull0 && isBull1 && c0.open > c1.close && c0.close < c1.open && body0 > Math.abs(c1.close - c1.open))
    { bearScore += 10; reasons.push("Bearish engulfing"); }

  // 7. Momentum (3-bar ROC)
  const roc3 = ((c0.close - c2.close) / c2.close) * 100;
  if (roc3 > 0.02) bullScore += Math.min(8, Math.round(roc3 * 100));
  if (roc3 < -0.02) bearScore += Math.min(8, Math.round(-roc3 * 100));

  // 8. Trend continuation: 3 same-color candles
  if (isBull0 && isBull1 && c2.close > c2.open) { bullScore += 5; reasons.push("3 bullish candles in a row"); }
  if (!isBull0 && !isBull1 && c2.close < c2.open) { bearScore += 5; reasons.push("3 bearish candles in a row"); }

  // 9. Choppy filter
  let caution: string | undefined;
  if (adx < 12) {
    bullScore -= 6;
    bearScore -= 6;
    caution = "Choppy market — reduced confidence";
  }

  const dir: "CALL" | "PUT" = bullScore >= bearScore ? "CALL" : "PUT";
  const winning = Math.max(bullScore, bearScore);
  const losing = Math.min(bullScore, bearScore);
  // Confidence formula calibrated to 55-94 range
  let confidence = 55 + Math.round((winning - losing) * 1.4);
  if (confidence < 55) confidence = 55;
  if (confidence > 94) confidence = 94;

  // Next 1-min candle close (binary expiry)
  const now = new Date();
  const expiry = new Date(Math.ceil((now.getTime() + 1) / 60_000) * 60_000);
  const fmt = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  return {
    pair,
    direction: dir,
    confidence,
    expiry: fmt(expiry),
    expiryISO: expiry.toISOString(),
    countdownMs: expiry.getTime() - now.getTime(),
    reasons: reasons.slice(0, 6),
    indicators: [
      `EMA5: ${e5.toFixed(info.decimals)}`,
      `EMA13: ${e13.toFixed(info.decimals)}`,
      `RSI(7): ${r.toFixed(1)}`,
      `Stoch K/D: ${st.k.toFixed(0)}/${st.d.toFixed(0)}`,
      `BB: ${bands.lower.toFixed(info.decimals)} - ${bands.upper.toFixed(info.decimals)}`,
      `ADX~: ${adx.toFixed(1)}`,
      `ROC3: ${roc3.toFixed(3)}%`,
    ],
    caution,
  };
}
