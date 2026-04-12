import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Loader2, Crosshair, X, ImageIcon, ChevronDown } from "lucide-react";
import SignalDisplay, { type Signal } from "./SignalDisplay";
import { analyzeChartImage, PAIRS_MAP } from "@/lib/analysisEngine";

interface ChartAnalyzerProps {
  apiKey: string;
}

const TIMEFRAMES = ["1min", "5min", "15min", "30min", "1h", "4h", "1day", "1week"];
const TIMEFRAME_LABELS: Record<string, string> = {
  "1min": "M1", "5min": "M5", "15min": "M15", "30min": "M30",
  "1h": "H1", "4h": "H4", "1day": "D1", "1week": "W1",
};

const ChartAnalyzer = ({ apiKey }: ChartAnalyzerProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [signal, setSignal] = useState<Signal | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [selectedPair, setSelectedPair] = useState("EUR/USD");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1h");
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setSignal(null);
      setError("");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyze = async () => {
    if (!image || !apiKey) return;
    setAnalyzing(true);
    setError("");
    try {
      const result = await analyzeChartImage({
        imageData: image,
        apiKey,
        pair: selectedPair,
        timeframe: selectedTimeframe,
      });
      setSignal(result);
    } catch (err: any) {
      setError(err.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const clearImage = () => { setImage(null); setSignal(null); setError(""); };

  return (
    <div className="space-y-4">
      {/* Pair & Timeframe Selector */}
      <motion.div
        className="terminal-card p-4 flex flex-wrap gap-3 items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex-1 min-w-[180px]">
          <label className="font-display text-[10px] tracking-widest text-muted-foreground mb-1 block">CURRENCY PAIR</label>
          <div className="relative">
            <select
              value={selectedPair}
              onChange={e => { setSelectedPair(e.target.value); setSignal(null); }}
              className="w-full bg-muted/50 border border-border/50 rounded-md px-3 py-2 font-mono text-sm text-foreground appearance-none cursor-pointer focus:outline-none focus:border-primary/60 transition-colors"
            >
              {Object.keys(PAIRS_MAP).map(pair => (
                <option key={pair} value={pair}>{pair}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        <div className="min-w-[140px]">
          <label className="font-display text-[10px] tracking-widest text-muted-foreground mb-1 block">TIMEFRAME</label>
          <div className="flex gap-1 flex-wrap">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => { setSelectedTimeframe(tf); setSignal(null); }}
                className={`px-2 py-1.5 rounded text-xs font-mono transition-all ${
                  selectedTimeframe === tf
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {TIMEFRAME_LABELS[tf]}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Upload Area */}
      <motion.div
        className={`terminal-card p-6 border-2 border-dashed transition-colors cursor-pointer ${
          dragOver ? "border-primary bg-primary/5" : "border-border/30 hover:border-primary/40"
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
        onClick={() => !image && fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />
        
        <AnimatePresence mode="wait">
          {!image ? (
            <motion.div key="upload" className="flex flex-col items-center gap-4 py-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div
                className="w-16 h-16 rounded-full border-2 border-primary/30 flex items-center justify-center bg-primary/5"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                <Upload className="w-8 h-8 text-primary" />
              </motion.div>
              <div className="text-center">
                <p className="font-display text-sm font-semibold tracking-wider">DROP CHART SCREENSHOT</p>
                <p className="font-mono text-xs text-muted-foreground mt-1">or click to upload • PNG, JPG, WEBP</p>
                <p className="font-mono text-[10px] text-muted-foreground/60 mt-2">Select your pair & timeframe above • Then upload chart</p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="preview" className="relative" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <button onClick={(e) => { e.stopPropagation(); clearImage(); }} className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-background/80 border border-border/50 flex items-center justify-center hover:bg-destructive/20 transition-colors">
                <X className="w-4 h-4" />
              </button>
              <img src={image} alt="Chart" className="w-full rounded-md max-h-[400px] object-contain" />
              <div className="neon-line mt-3" />
              <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <span className="font-mono text-xs text-muted-foreground">
                    {selectedPair} • {TIMEFRAME_LABELS[selectedTimeframe]} • Ready
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px hsl(175 100% 45% / 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => { e.stopPropagation(); handleAnalyze(); }}
                  disabled={analyzing}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-primary text-primary-foreground font-display text-sm font-semibold tracking-wider disabled:opacity-50 transition-all"
                >
                  {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" />ANALYZING...</> : <><Crosshair className="w-4 h-4" />ANALYZE CHART</>}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {analyzing && (
          <motion.div className="terminal-card p-6 overflow-hidden relative" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <div className="flex items-center gap-3">
              <motion.div className="w-3 h-3 rounded-full bg-primary" animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} />
              <span className="font-display text-sm tracking-wider">ANALYZING {selectedPair} ({TIMEFRAME_LABELS[selectedTimeframe]})...</span>
            </div>
            <div className="mt-4 space-y-2">
              {[
                `Fetching ${selectedPair} OHLC data...`,
                "Computing RSI, MACD, Stochastic indicators...",
                "Identifying candlestick patterns & market structure...",
                "Running SMC + ICT + Fibonacci confluence analysis...",
                "Calculating optimal Entry, SL & TP levels...",
              ].map((t, i) => (
                <motion.div key={i} className="font-mono text-xs text-muted-foreground" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.5 }}>
                  {">"} {t}
                </motion.div>
              ))}
            </div>
            <motion.div className="absolute bottom-0 left-0 h-0.5 bg-primary" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 3, ease: "linear" }} />
          </motion.div>
        )}
      </AnimatePresence>

      {error && <motion.div className="terminal-card p-4 border-destructive/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><p className="font-mono text-sm text-destructive">{error}</p></motion.div>}
      {signal && <SignalDisplay signal={signal} />}
    </div>
  );
};

export default ChartAnalyzer;
