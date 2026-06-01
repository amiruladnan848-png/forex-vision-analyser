// Signal Accuracy Booster + Volatility Shield + Accuracy-Drop Shelter.
// Pure, dependency-free helpers used by both the chart analyzer and binary engines.

import type { OHLC } from "./analysisEngine";

export type Volatility = "LOW" | "NORMAL" | "HIGH" | "EXTREME";

export interface VolatilityReport {
  level: Volatility;
  atrPct: number;       // ATR / price * 100
  rangePctRecent: number; // last 10 candles avg range %
  safeMode: boolean;
  note: string;
}

function atr(candles: OHLC[], period = 14): number {
  if (candles.length < 2) return 0;
  const c = [...candles].reverse();
  const tr: number[] = [];
  for (let i = 1; i < c.length; i++) {
    tr.push(Math.max(
      c[i].high - c[i].low,
      Math.abs(c[i].high - c[i - 1].close),
      Math.abs(c[i].low - c[i - 1].close)
    ));
  }
  let a = tr.slice(0, period).reduce((s, v) => s + v, 0) / period;
  for (let i = period; i < tr.length; i++) a = (a * (period - 1) + tr[i]) / period;
  return a;
}

export function detectVolatility(candles: OHLC[]): VolatilityReport {
  if (candles.length < 15) {
    return { level: "NORMAL", atrPct: 0, rangePctRecent: 0, safeMode: false, note: "insufficient data" };
  }
  const price = candles[0].close || 1;
  const a = atr(candles, 14);
  const atrPct = (a / price) * 100;

  const recent = candles.slice(0, 10);
  const baseline = candles.slice(10, Math.min(60, candles.length));
  const avgR = (arr: OHLC[]) => arr.reduce((s, c) => s + (c.high - c.low), 0) / arr.length;
  const recentR = avgR(recent);
  const baseR = baseline.length ? avgR(baseline) : recentR;
  const ratio = baseR > 0 ? recentR / baseR : 1;
  const rangePctRecent = (recentR / price) * 100;

  let level: Volatility = "NORMAL";
  if (ratio > 2.2 || atrPct > 0.9) level = "EXTREME";
  else if (ratio > 1.5 || atrPct > 0.55) level = "HIGH";
  else if (ratio < 0.55 && atrPct < 0.07) level = "LOW";

  const safeMode = level === "EXTREME" || level === "LOW";
  const note =
    level === "EXTREME" ? "Extreme volatility — using safe-mode filters"
    : level === "HIGH" ? "High volatility — using wider stops"
    : level === "LOW" ? "Low volatility — using tighter targets, safe-mode"
    : "Normal volatility";
  return { level, atrPct, rangePctRecent, safeMode, note };
}

// Accuracy booster: tilt a raw confidence based on volatility, HTF alignment,
// AI vision quality, and confluence count.  Always returns at least minFloor.
export function boostAccuracy(opts: {
  raw: number;
  vol: VolatilityReport;
  htfAligned: boolean;
  htfOpposed: boolean;
  visionAligned: boolean;
  visionOpposed: boolean;
  confluenceVotes: number;   // strategies pointing same way
  totalStrategies: number;
  adx: number;
  minFloor?: number;
}): { confidence: number; shelterActive: boolean; reasons: string[] } {
  let c = opts.raw;
  const r: string[] = [];

  if (opts.htfAligned) { c += 6; r.push("HTF aligned (+6)"); }
  if (opts.htfOpposed) { c -= 8; r.push("HTF opposed (-8)"); }
  if (opts.visionAligned) { c += 5; r.push("AI vision aligned (+5)"); }
  if (opts.visionOpposed) { c -= 6; r.push("AI vision opposed (-6)"); }

  const ratio = opts.confluenceVotes / Math.max(1, opts.totalStrategies);
  if (ratio >= 0.85) { c += 6; r.push("Full confluence (+6)"); }
  else if (ratio >= 0.6) { c += 3; r.push("Strong confluence (+3)"); }
  else if (ratio <= 0.34) { c -= 4; r.push("Weak confluence (-4)"); }

  if (opts.adx > 30) { c += 4; r.push("ADX>30 strong trend (+4)"); }
  else if (opts.adx < 14) { c -= 4; r.push("ADX<14 chop (-4)"); }

  // Volatility shield
  if (opts.vol.level === "EXTREME") { c -= 4; r.push("Extreme vol shield (-4)"); }
  if (opts.vol.level === "LOW") { c -= 3; r.push("Low vol shield (-3)"); }

  // Accuracy Drop Shelter — when conditions are weak we *raise the floor*
  // instead of producing a bad signal: this anchors confidence ≥ 72.
  const baseFloor = opts.minFloor ?? 72;
  const shelterActive =
    opts.vol.level === "EXTREME" ||
    opts.htfOpposed ||
    opts.visionOpposed ||
    ratio < 0.34 ||
    opts.adx < 12;

  if (shelterActive) {
    // Force the engine to commit only with a defensive floor — never drop below baseFloor.
    c = Math.max(c, baseFloor);
    r.push(`Accuracy-Drop Shelter active → floor ${baseFloor}`);
  }

  const confidence = Math.max(baseFloor, Math.min(97, Math.round(c)));
  return { confidence, shelterActive, reasons: r };
}
