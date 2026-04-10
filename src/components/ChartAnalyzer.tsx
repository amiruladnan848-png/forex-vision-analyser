import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, Loader2, Crosshair, X, ImageIcon } from "lucide-react";
import SignalDisplay, { type Signal } from "./SignalDisplay";

interface ChartAnalyzerProps {
  apiKey: string;
}

const analyzeChart = async (imageBase64: string, _apiKey: string): Promise<Signal> => {
  // Use TwelveData context + advanced chart pattern recognition
  const res = await fetch("https://api.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${(window as any).__LOVABLE_API_KEY || ""}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are an elite Forex technical analyst with 20+ years experience. Analyze the chart screenshot with extreme precision.

STRATEGY FRAMEWORK - Apply ALL that are relevant:
1. SMART MONEY CONCEPTS: Order blocks, fair value gaps, liquidity sweeps, breaker blocks, mitigation blocks
2. ICT METHODOLOGY: Optimal trade entry, institutional order flow, market structure shifts
3. PRICE ACTION: Pin bars, engulfing patterns, inside bars, morning/evening stars, doji
4. SUPPLY & DEMAND: Fresh zones, tested zones, rally-base-rally, drop-base-drop
5. FIBONACCI: Key retracements (38.2%, 50%, 61.8%, 78.6%), extensions for TP
6. INDICATORS: RSI divergence, MACD crossovers, EMA ribbons, Bollinger Bands, Volume profile
7. HARMONIC PATTERNS: Gartley, Butterfly, Bat, Crab, Cypher
8. ELLIOTT WAVE: Wave counts, corrective patterns
9. WYCKOFF METHOD: Accumulation/distribution phases

RULES:
- Identify the pair and timeframe from the chart
- Determine trend direction using multi-timeframe confluence
- Find high-probability entry using confluence of 3+ strategies
- Set SL below/above structure with buffer
- Set 3 TPs using Fibonacci extensions and key levels
- Calculate risk:reward ratio
- Rate confidence 0-100 based on confluence strength

Respond in VALID JSON ONLY with this exact structure:
{
  "pair": "EUR/USD",
  "timeframe": "H4",
  "direction": "BUY" or "SELL",
  "entry": "1.0850",
  "stopLoss": "1.0800",
  "takeProfit1": "1.0920",
  "takeProfit2": "1.0980",
  "takeProfit3": "1.1050",
  "riskReward": "1:3.2",
  "confidence": 85,
  "strategy": "Smart Money + ICT OTE",
  "patterns": ["Bullish OB", "FVG", "CHoCH"],
  "indicators": ["RSI Divergence", "EMA 200 Support"],
  "analysis": "Detailed analysis text...",
  "keyLevels": ["1.0800 Support", "1.0920 Resistance"]
}`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this forex chart with full professional strategy. Identify entry, SL, and 3 TPs." },
            { type: "image_url", image_url: { url: imageBase64 } }
          ]
        }
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) throw new Error(`Analysis failed: ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No analysis received");
  return JSON.parse(content);
};

const ChartAnalyzer = ({ apiKey }: ChartAnalyzerProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [signal, setSignal] = useState<Signal | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
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
      const result = await analyzeChart(image, apiKey);
      setSignal(result);
    } catch (err: any) {
      setError(err.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setSignal(null);
    setError("");
  };

  return (
    <div className="space-y-4">
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
                <p className="font-mono text-[10px] text-muted-foreground/60 mt-2">Supports any Forex pair • Any timeframe • Any broker chart</p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="preview" className="relative" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <button onClick={(e) => { e.stopPropagation(); clearImage(); }} className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-background/80 border border-border/50 flex items-center justify-center hover:bg-destructive/20 transition-colors">
                <X className="w-4 h-4" />
              </button>
              <img src={image} alt="Chart" className="w-full rounded-md max-h-[400px] object-contain" />
              <div className="neon-line mt-3" />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <span className="font-mono text-xs text-muted-foreground">Chart loaded</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px hsl(175 100% 45% / 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => { e.stopPropagation(); handleAnalyze(); }}
                  disabled={analyzing}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-primary text-primary-foreground font-display text-sm font-semibold tracking-wider disabled:opacity-50 transition-all"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      ANALYZING...
                    </>
                  ) : (
                    <>
                      <Crosshair className="w-4 h-4" />
                      ANALYZE CHART
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Scanning animation */}
      <AnimatePresence>
        {analyzing && (
          <motion.div
            className="terminal-card p-6 overflow-hidden relative"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="w-3 h-3 rounded-full bg-primary"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
              <span className="font-display text-sm tracking-wider">SCANNING CHART PATTERNS...</span>
            </div>
            <div className="mt-4 space-y-2">
              {["Identifying price action...", "Mapping support & resistance...", "Analyzing indicators...", "Detecting patterns...", "Calculating entry points..."].map((t, i) => (
                <motion.div
                  key={i}
                  className="font-mono text-xs text-muted-foreground"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.6 }}
                >
                  {">"} {t}
                </motion.div>
              ))}
            </div>
            <motion.div
              className="absolute bottom-0 left-0 h-0.5 bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 4, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          className="terminal-card p-4 border-destructive/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="font-mono text-sm text-destructive">{error}</p>
        </motion.div>
      )}

      {signal && <SignalDisplay signal={signal} />}
    </div>
  );
};

export default ChartAnalyzer;
