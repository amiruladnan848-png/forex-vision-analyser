import { memo, useEffect, useRef } from "react";

// Map our pair keys → TradingView symbols (free, no auth)
const TV_SYMBOL: Record<string, string> = {
  "EUR/USD": "FX:EURUSD", "GBP/USD": "FX:GBPUSD", "USD/JPY": "FX:USDJPY",
  "AUD/USD": "FX:AUDUSD", "USD/CAD": "FX:USDCAD", "NZD/USD": "FX:NZDUSD",
  "USD/CHF": "FX:USDCHF", "EUR/GBP": "FX:EURGBP", "GBP/JPY": "FX:GBPJPY",
  "EUR/JPY": "FX:EURJPY", "AUD/JPY": "FX:AUDJPY",
  "XAU/USD": "OANDA:XAUUSD", "XAG/USD": "OANDA:XAGUSD",
  "BTC/USD": "BINANCE:BTCUSDT", "ETH/USD": "BINANCE:ETHUSDT",
  "SOL/USD": "BINANCE:SOLUSDT", "XRP/USD": "BINANCE:XRPUSDT",
  "BNB/USD": "BINANCE:BNBUSDT", "ADA/USD": "BINANCE:ADAUSDT",
  "DOGE/USD": "BINANCE:DOGEUSDT", "LTC/USD": "BINANCE:LTCUSDT",
  "LINK/USD": "BINANCE:LINKUSDT", "AVAX/USD": "BINANCE:AVAXUSDT",
};

interface Props {
  pair: string;
  height?: number;
  interval?: string; // "1" | "5" | "15" ...
  scanning?: boolean;
}

const TradingViewMiniChart = memo(({ pair, height = 380, interval = "1", scanning = false }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const symbol = TV_SYMBOL[pair] || "FX:EURUSD";

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      save_image: false,
      withdateranges: true,
      studies: ["STD;EMA", "STD;RSI"],
      backgroundColor: "rgba(8, 12, 22, 1)",
      gridColor: "rgba(56, 189, 248, 0.06)",
      support_host: "https://www.tradingview.com",
    });
    ref.current.appendChild(script);
  }, [symbol, interval]);

  return (
    <div
      className="tradingview-widget-container rounded-lg overflow-hidden border border-primary/30 bg-background/40 relative"
      style={{ height, width: "100%" }}
    >
      <div ref={ref} className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }} />
      {scanning && (
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 animate-pulse" />
          <div className="chart-laser-sweep" />
          <div className="chart-laser-glow" />
        </div>
      )}
    </div>
  );
});

export default TradingViewMiniChart;
