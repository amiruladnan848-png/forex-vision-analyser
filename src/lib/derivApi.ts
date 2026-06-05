// Deriv + Binance free public-data layer.
// - Forex / metals → Deriv WebSocket (wss://ws.derivws.com, free public app_id=1089, no auth)
// - Crypto pairs   → Binance public REST (no auth)
// Replaces TwelveData entirely. Default setup, no API keys required.

import type { OHLC } from "./analysisEngine";

// ─── Pair → provider symbol maps ──────────────────────────────────────

const DERIV_SYMBOLS: Record<string, string> = {
  "EUR/USD": "frxEURUSD", "GBP/USD": "frxGBPUSD", "USD/JPY": "frxUSDJPY",
  "AUD/USD": "frxAUDUSD", "USD/CAD": "frxUSDCAD", "NZD/USD": "frxNZDUSD",
  "USD/CHF": "frxUSDCHF", "EUR/GBP": "frxEURGBP", "GBP/JPY": "frxGBPJPY",
  "EUR/JPY": "frxEURJPY", "AUD/JPY": "frxAUDJPY", "EUR/AUD": "frxEURAUD",
  "GBP/AUD": "frxGBPAUD", "GBP/CAD": "frxGBPCAD", "EUR/CAD": "frxEURCAD",
  "EUR/NZD": "frxEURNZD", "GBP/NZD": "frxGBPNZD", "AUD/CAD": "frxAUDCAD",
  "AUD/NZD": "frxAUDNZD", "CAD/JPY": "frxCADJPY", "CHF/JPY": "frxCHFJPY",
  "NZD/JPY": "frxNZDJPY", "NZD/CAD": "frxNZDCAD",
  "XAU/USD": "frxXAUUSD", "XAG/USD": "frxXAGUSD",
};

const BINANCE_SYMBOLS: Record<string, string> = {
  "BTC/USD": "BTCUSDT", "ETH/USD": "ETHUSDT", "SOL/USD": "SOLUSDT",
  "XRP/USD": "XRPUSDT", "BNB/USD": "BNBUSDT", "ADA/USD": "ADAUSDT",
  "DOGE/USD": "DOGEUSDT", "DOT/USD": "DOTUSDT", "MATIC/USD": "MATICUSDT",
  "AVAX/USD": "AVAXUSDT", "LINK/USD": "LINKUSDT", "LTC/USD": "LTCUSDT",
};

// Deriv granularity (sec). 1week is aggregated locally from 1day.
const DERIV_GRAN: Record<string, number> = {
  "1min": 60, "5min": 300, "15min": 900, "30min": 1800,
  "1h": 3600, "4h": 14400, "1day": 86400, "1week": 86400,
};
const BINANCE_TF: Record<string, string> = {
  "1min": "1m", "5min": "5m", "15min": "15m", "30min": "30m",
  "1h": "1h", "4h": "4h", "1day": "1d", "1week": "1w",
};

// ─── Tiny cache to keep things smooth ─────────────────────────────────

interface CacheEntry { candles: OHLC[]; ts: number }
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<OHLC[]>>();
interface DerivError { message?: string }
interface DerivCandle { open: number | string; high: number | string; low: number | string; close: number | string; epoch: number }
interface DerivCandleResponse { error?: DerivError; candles?: DerivCandle[] }
interface DerivTickResponse { error?: DerivError; tick?: { quote?: number | string } }
type BinanceKline = [number, string, string, string, string, ...unknown[]];
const CACHE_TTL: Record<string, number> = {
  "1min": 2_500, "5min": 35_000, "15min": 4 * 60_000, "30min": 8 * 60_000,
  "1h": 20 * 60_000, "4h": 60 * 60_000, "1day": 6 * 3600_000, "1week": 24 * 3600_000,
};

function aggregateWeekly(daily: OHLC[]): OHLC[] {
  const chron = [...daily].reverse();
  const out: OHLC[] = [];
  for (let i = 0; i + 7 <= chron.length; i += 7) {
    const s = chron.slice(i, i + 7);
    out.push({
      open: s[0].open, close: s[s.length - 1].close,
      high: Math.max(...s.map(c => c.high)),
      low: Math.min(...s.map(c => c.low)),
      datetime: s[s.length - 1].datetime,
    });
  }
  return out.reverse();
}

// ─── Deriv WebSocket (one-shot) ───────────────────────────────────────

function derivCandles(symbol: string, granularity: number, count: number): Promise<OHLC[]> {
  return new Promise((resolve, reject) => {
    if (typeof WebSocket === "undefined") {
      reject(new Error("Live WebSocket data is not available in this browser"));
      return;
    }
    let settled = false;
    const ws = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");
    const done = (fn: () => void) => { if (!settled) { settled = true; try { ws.close(); } catch { void 0; } fn(); } };
    const t = setTimeout(() => done(() => reject(new Error("Deriv timeout"))), 9000);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        ticks_history: symbol,
        adjust_start_time: 1,
        count,
        end: "latest",
        style: "candles",
        granularity,
      }));
    };
    ws.onmessage = (ev) => {
      clearTimeout(t);
      try {
        const d = JSON.parse(ev.data) as DerivCandleResponse;
        if (d.error) return done(() => reject(new Error(d.error.message || "Deriv error")));
        const raw = d.candles || [];
        if (!raw.length) return done(() => reject(new Error("No data from Deriv (market closed?)")));
        const candles: OHLC[] = raw.map(c => ({
          open: +c.open, high: +c.high, low: +c.low, close: +c.close,
          datetime: new Date(c.epoch * 1000).toISOString(),
        })).reverse(); // newest-first
        done(() => resolve(candles));
      } catch (e) {
        done(() => reject(e as Error));
      }
    };
    ws.onerror = () => { clearTimeout(t); done(() => reject(new Error("Deriv WS connection error"))); };
  });
}

function derivTick(symbol: string): Promise<number> {
  return new Promise((resolve, reject) => {
    if (typeof WebSocket === "undefined") {
      reject(new Error("Live WebSocket price is not available in this browser"));
      return;
    }
    let settled = false;
    const ws = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");
    const done = (fn: () => void) => { if (!settled) { settled = true; try { ws.close(); } catch { void 0; } fn(); } };
    const t = setTimeout(() => done(() => reject(new Error("Live tick timeout"))), 5000);
    ws.onopen = () => ws.send(JSON.stringify({ ticks: symbol }));
    ws.onmessage = (ev) => {
      clearTimeout(t);
      try {
        const d = JSON.parse(ev.data) as DerivTickResponse;
        if (d.error) return done(() => reject(new Error(d.error.message || "Deriv tick error")));
        const quote = Number(d.tick?.quote);
        if (!Number.isFinite(quote)) return done(() => reject(new Error("Live tick unavailable")));
        done(() => resolve(quote));
      } catch (e) {
        done(() => reject(e as Error));
      }
    };
    ws.onerror = () => { clearTimeout(t); done(() => reject(new Error("Deriv live tick connection error"))); };
  });
}

async function binanceCandles(symbol: string, tf: string, limit: number): Promise<OHLC[]> {
  const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${tf}&limit=${limit}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Binance error ${res.status}`);
  const arr = await res.json() as BinanceKline[];
  if (!Array.isArray(arr) || !arr.length) throw new Error("No crypto data");
  return arr.map(k => ({
    open: +k[1], high: +k[2], low: +k[3], close: +k[4],
    datetime: new Date(k[0]).toISOString(),
  })).reverse(); // newest-first
}

async function binancePrice(symbol: string): Promise<number> {
  const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Binance live price error ${res.status}`);
  const data = await res.json();
  const price = Number(data?.price);
  if (!Number.isFinite(price)) throw new Error("Crypto live price unavailable");
  return price;
}

// ─── Public API ───────────────────────────────────────────────────────

export async function fetchCandles(pair: string, interval: string = "1h", outputSize: number = 100): Promise<OHLC[]> {
  const tf = interval in DERIV_GRAN ? interval : "1h";
  const key = `${pair}:${tf}:${outputSize}`;
  const ttl = CACHE_TTL[tf] || 60_000;
  const c = cache.get(key);
  if (c && Date.now() - c.ts < ttl) return c.candles;

  const pending = inflight.get(key);
  if (pending) return pending;

  const request = (async () => {
    let candles: OHLC[];
    try {
      if (BINANCE_SYMBOLS[pair]) {
        candles = await binanceCandles(BINANCE_SYMBOLS[pair], BINANCE_TF[tf], outputSize);
      } else if (DERIV_SYMBOLS[pair]) {
        const sym = DERIV_SYMBOLS[pair];
        if (tf === "1week") {
          const daily = await derivCandles(sym, 86400, Math.min(500, outputSize * 7));
          candles = aggregateWeekly(daily);
        } else {
          candles = await derivCandles(sym, DERIV_GRAN[tf], outputSize);
        }
      } else {
        throw new Error(`Pair ${pair} not supported by live data providers`);
      }
    } catch (err) {
      const stale = cache.get(key);
      if (stale?.candles.length) return stale.candles;
      throw err;
    }

    if (!candles.length) throw new Error("No candles returned. Market may be closed.");
    cache.set(key, { candles, ts: Date.now() });
    return candles;
  })();

  inflight.set(key, request);
  try {
    return await request;
  } finally {
    inflight.delete(key);
  }
}

export async function fetchLivePrice(pair: string): Promise<number> {
  try {
    if (BINANCE_SYMBOLS[pair]) return await binancePrice(BINANCE_SYMBOLS[pair]);
    if (DERIV_SYMBOLS[pair]) return await derivTick(DERIV_SYMBOLS[pair]);
  } catch (err) {
    const candles = await fetchCandles(pair, "1min", 3);
    const price = candles[0]?.close;
    if (typeof price === "number" && Number.isFinite(price)) return price;
    throw err;
  }
  const candles = await fetchCandles(pair, "1min", 3);
  const price = candles[0]?.close;
  if (typeof price !== "number" || Number.isNaN(price)) throw new Error("Live price unavailable");
  return price;
}
