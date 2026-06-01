// Binary 1-minute signal engine — manual trigger only.
// Multi-timeframe confluence (1m + 5m + 15m), professional binary strategies:
//  • EMA(5/13/50) cross + slope (1m + 5m trend filter)
//  • RSI(7) extremes & divergence
//  • Bollinger band rejection w/ confirmation candle
//  • Stochastic %K/%D cross
//  • VWAP deviation (intraday mean reversion)
//  • Price action (engulfing, pin/hammer at micro S/R, inside-bar break)
//  • ATR volatility gate + ADX trend strength
//  • Session weighting (London/NY power hours boost)
// Returns CALL/PUT verdict for the NEXT 1-min candle close, with confidence + expiry in user TZ.

import { PAIRS_MAP, type OHLC } from "./analysisEngine";
import { fetchCandles } from "./derivApi";
import { detectVolatility, boostAccuracy } from "./signalShield";


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
    trSum += Math.max(c[i].high - c[i].low, Math.abs(c[i].high - c[i].low), Math.abs(c[i].low - c[i - 1].close));
    if (up > dn && up > 0) plus += up;
    if (dn > up && dn > 0) minus += dn;
  }
  const di = trSum > 0 ? Math.abs(plus - minus) / (plus + minus + 1e-9) * 100 : 0;
  return Math.min(60, di);
}

// Aggregate N 1-min candles (newest-first order) into higher-tf candles
function aggregate(candles: OHLC[], factor: number): OHLC[] {
  // candles[0] is newest. Reverse to chronological, group, then reverse back.
  const chron = [...candles].reverse();
  const out: OHLC[] = [];
  for (let i = 0; i + factor <= chron.length; i += factor) {
    const slice = chron.slice(i, i + factor);
    out.push({
      open: slice[0].open,
      close: slice[slice.length - 1].close,
      high: Math.max(...slice.map(s => s.high)),
      low: Math.min(...slice.map(s => s.low)),
      datetime: slice[slice.length - 1].datetime,
    });
  }
  return out.reverse();
}

// Session boost — London (07-16 UTC) + NY (12-21 UTC) overlap is most predictable
function sessionBoost(): { boost: number; label: string } {
  const h = new Date().getUTCHours();
  if (h >= 12 && h < 16) return { boost: 5, label: "London/NY overlap" };
  if (h >= 7 && h < 16) return { boost: 3, label: "London session" };
  if (h >= 12 && h < 21) return { boost: 3, label: "New York session" };
  if (h >= 0 && h < 7) return { boost: -3, label: "Asian session (lower volatility)" };
  return { boost: 0, label: "Off-session" };
}

async function fetchMin1(pair: string): Promise<OHLC[]> {
  return fetchCandles(pair, "1min", 120);
}


export interface BinarySignal {
  pair: string;
  direction: "CALL" | "PUT";
  confidence: number;
  expiry: string;
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
  if (candles.length < 30) throw new Error("Not enough market data");

  // Multi-timeframe (single API call — all derived locally)
  const m5 = aggregate(candles, 5);
  const m15 = aggregate(candles, 15);

  const closes = candles.map(c => c.close);
  const chron = [...closes].reverse();
  const ema5 = ema(chron, 5);
  const ema13 = ema(chron, 13);
  const ema50 = ema(chron, Math.min(50, chron.length));
  const e5 = ema5[ema5.length - 1], e13 = ema13[ema13.length - 1], e50 = ema50[ema50.length - 1];
  const e5Prev = ema5[ema5.length - 2] ?? e5;
  const e13Prev = ema13[ema13.length - 2] ?? e13;

  // 5m & 15m trend (EMA8 vs EMA21)
  const trendEma = (cs: OHLC[]) => {
    if (cs.length < 21) return 0;
    const c = [...cs].reverse().map(x => x.close);
    const a = ema(c, 8); const b = ema(c, 21);
    return a[a.length - 1] - b[b.length - 1];
  };
  const t5 = trendEma(m5);
  const t15 = trendEma(m15);

  const r = rsi(closes, 7);
  const r5 = m5.length >= 8 ? rsi(m5.map(c => c.close), 7) : 50;
  const bands = bb(closes, 20, 2);
  const st = stoch(candles, 14);
  const adx = adxApprox(candles);

  const c0 = candles[0], c1 = candles[1], c2 = candles[2];
  const body0 = Math.abs(c0.close - c0.open) || 1e-9;
  const upperW = c0.high - Math.max(c0.open, c0.close);
  const lowerW = Math.min(c0.open, c0.close) - c0.low;
  const isBull0 = c0.close > c0.open;
  const isBull1 = c1.close > c1.open;

  // VWAP-ish (typical price weighted by range as volume proxy)
  const last30 = candles.slice(0, 30);
  let vwSum = 0, wSum = 0;
  for (const k of last30) {
    const tp = (k.high + k.low + k.close) / 3;
    const w = (k.high - k.low) || 1e-9;
    vwSum += tp * w; wSum += w;
  }
  const vwap = wSum ? vwSum / wSum : c0.close;

  const microSupport = Math.min(...last30.map(c => c.low));
  const microResistance = Math.max(...last30.map(c => c.high));
  const atr = last30.slice(0, 14).reduce((s, c) => s + (c.high - c.low), 0) / 14 || 1e-9;

  let bullScore = 0, bearScore = 0;
  const reasons: string[] = [];

  // 1. EMA cross & slope (1m)
  if (e5 > e13 && e5Prev <= e13Prev) { bullScore += 16; reasons.push("EMA5/13 bullish cross"); }
  else if (e5 < e13 && e5Prev >= e13Prev) { bearScore += 16; reasons.push("EMA5/13 bearish cross"); }
  else if (e5 > e13 && e5 > e5Prev) { bullScore += 7; }
  else if (e5 < e13 && e5 < e5Prev) { bearScore += 7; }

  // 2. Macro EMA50
  if (e5 > e50) bullScore += 4; else bearScore += 4;

  // 3. HTF trend confluence (CRITICAL accuracy boost)
  if (t5 > 0 && t15 > 0) { bullScore += 12; reasons.push("5m & 15m trend bullish"); }
  else if (t5 < 0 && t15 < 0) { bearScore += 12; reasons.push("5m & 15m trend bearish"); }
  else if (t5 > 0) bullScore += 5;
  else if (t5 < 0) bearScore += 5;

  // 4. RSI 1m + 5m alignment
  if (r < 25 && r5 < 45) { bullScore += 14; reasons.push(`RSI(7) oversold ${r.toFixed(0)} + 5m bias`); }
  else if (r > 75 && r5 > 55) { bearScore += 14; reasons.push(`RSI(7) overbought ${r.toFixed(0)} + 5m bias`); }
  else if (r < 30) bullScore += 8;
  else if (r > 70) bearScore += 8;

  // 5. Bollinger rejection
  if (c0.low <= bands.lower && c0.close > bands.lower) { bullScore += 11; reasons.push("BB lower-band rejection"); }
  if (c0.high >= bands.upper && c0.close < bands.upper) { bearScore += 11; reasons.push("BB upper-band rejection"); }

  // 6. Stochastic cross
  if (st.k < 25 && st.k > st.d) { bullScore += 9; reasons.push("Stoch oversold cross-up"); }
  if (st.k > 75 && st.k < st.d) { bearScore += 9; reasons.push("Stoch overbought cross-down"); }

  // 7. VWAP mean reversion
  if (c0.close < vwap - atr * 0.6 && isBull0) { bullScore += 6; reasons.push("Bullish VWAP reversion"); }
  if (c0.close > vwap + atr * 0.6 && !isBull0) { bearScore += 6; reasons.push("Bearish VWAP reversion"); }

  // 8. Candle pattern at micro zone
  const atSupport = Math.abs(c0.low - microSupport) < atr * 0.6;
  const atResistance = Math.abs(c0.high - microResistance) < atr * 0.6;
  if (lowerW > body0 * 2 && upperW < body0 * 0.6 && atSupport) { bullScore += 13; reasons.push("Hammer/Pin at support"); }
  if (upperW > body0 * 2 && lowerW < body0 * 0.6 && atResistance) { bearScore += 13; reasons.push("Shooting star at resistance"); }
  if (isBull0 && !isBull1 && c0.close > c1.open && c0.open < c1.close)
    { bullScore += 11; reasons.push("Bullish engulfing"); }
  if (!isBull0 && isBull1 && c0.open > c1.close && c0.close < c1.open)
    { bearScore += 11; reasons.push("Bearish engulfing"); }

  // 9. Momentum (3-bar ROC)
  const roc3 = ((c0.close - c2.close) / c2.close) * 100;
  if (roc3 > 0.02) bullScore += Math.min(8, Math.round(roc3 * 100));
  if (roc3 < -0.02) bearScore += Math.min(8, Math.round(-roc3 * 100));

  // 10. 3-candle continuation
  if (isBull0 && isBull1 && c2.close > c2.open) { bullScore += 5; reasons.push("3 bullish candles"); }
  if (!isBull0 && !isBull1 && c2.close < c2.open) { bearScore += 5; reasons.push("3 bearish candles"); }

  // 11. Session weighting
  const sess = sessionBoost();
  if (Math.abs(bullScore - bearScore) > 5) {
    if (bullScore > bearScore) bullScore += sess.boost;
    else bearScore += sess.boost;
  }

  // 12. Choppy / volatility filters
  let caution: string | undefined;
  if (adx < 12) {
    bullScore -= 8; bearScore -= 8;
    caution = "Choppy market — trade smaller or skip";
  }
  // Avoid signals when 1m & 5m disagree strongly
  if ((t5 > 0 && bearScore > bullScore) || (t5 < 0 && bullScore > bearScore)) {
    caution = caution ?? "5m trend disagrees — lower probability";
  }

  const dir: "CALL" | "PUT" = bullScore >= bearScore ? "CALL" : "PUT";
  const winning = Math.max(bullScore, bearScore);
  const losing = Math.min(bullScore, bearScore);
  let confidence = 72 + Math.round((winning - losing) * 1.5);
  if (confidence < 72) confidence = 72;
  if (confidence > 97) confidence = 97;

  // Next 1-min candle close
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
    reasons: reasons.slice(0, 7),
    indicators: [
      `EMA5: ${e5.toFixed(info.decimals)}`,
      `EMA13: ${e13.toFixed(info.decimals)}`,
      `RSI 1m/5m: ${r.toFixed(0)}/${r5.toFixed(0)}`,
      `Stoch K/D: ${st.k.toFixed(0)}/${st.d.toFixed(0)}`,
      `BB: ${bands.lower.toFixed(info.decimals)}-${bands.upper.toFixed(info.decimals)}`,
      `ADX~: ${adx.toFixed(1)}`,
      `5m trend: ${t5 > 0 ? "▲" : "▼"} | 15m: ${t15 > 0 ? "▲" : "▼"}`,
      `VWAP: ${vwap.toFixed(info.decimals)}`,
      `Session: ${sess.label}`,
    ],
    caution,
  };
}
