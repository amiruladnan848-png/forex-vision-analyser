import { useState } from "react";
import { motion } from "framer-motion";
import { Key, Check, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { validateApiKey } from "@/lib/analysisEngine";

interface ApiKeySetupProps {
  onSave: (key: string) => void;
  savedKey: string;
}

const ApiKeySetup = ({ onSave, savedKey }: ApiKeySetupProps) => {
  const [key, setKey] = useState(savedKey);
  const [show, setShow] = useState(false);
  const [validating, setValidating] = useState(false);
  const [status, setStatus] = useState<"idle" | "valid" | "invalid">(savedKey ? "valid" : "idle");

  const handleSave = async () => {
    const trimmed = key.trim();
    if (trimmed.length < 5) return;
    setValidating(true);
    setStatus("idle");
    const valid = await validateApiKey(trimmed);
    setValidating(false);
    if (valid) {
      setStatus("valid");
      onSave(trimmed);
    } else {
      setStatus("invalid");
    }
  };

  return (
    <motion.div
      className="terminal-card p-5 glow-border"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
          <Key className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold tracking-wider">MARKET DATA API</h3>
          <p className="text-xs text-muted-foreground font-mono">Real-time price engine</p>
        </div>
        {status === "valid" && <div className="ml-auto pulse-dot" />}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? "text" : "password"}
            value={key}
            onChange={e => { setKey(e.target.value); setStatus("idle"); }}
            placeholder="Enter API key..."
            className="w-full bg-muted/50 border border-border/50 rounded-md px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 transition-colors"
          />
          <button onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={validating || key.trim().length < 5}
          className={`px-4 py-2 rounded-md font-display text-xs font-semibold tracking-wider transition-colors disabled:opacity-50 ${
            status === "valid" ? "bg-accent text-accent-foreground"
              : status === "invalid" ? "bg-destructive text-destructive-foreground"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : status === "valid" ? <Check className="w-4 h-4" /> : "CONNECT"}
        </motion.button>
      </div>

      {status === "invalid" && (
        <motion.div className="flex items-center gap-2 mt-2 text-destructive" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <AlertCircle className="w-3 h-3" />
          <span className="font-mono text-xs">Invalid API key. Please check and try again.</span>
        </motion.div>
      )}
      {status === "valid" && (
        <motion.div className="flex items-center gap-2 mt-2 text-accent" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <CheckCircle2 className="w-3 h-3" />
          <span className="font-mono text-xs">Connected — real-time market data active</span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ApiKeySetup;
