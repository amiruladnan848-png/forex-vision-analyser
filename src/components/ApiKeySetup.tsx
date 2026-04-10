import { useState } from "react";
import { motion } from "framer-motion";
import { Key, Check, Eye, EyeOff, ExternalLink } from "lucide-react";

interface ApiKeySetupProps {
  onSave: (key: string) => void;
  savedKey: string;
}

const ApiKeySetup = ({ onSave, savedKey }: ApiKeySetupProps) => {
  const [key, setKey] = useState(savedKey);
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(!!savedKey);

  const handleSave = () => {
    if (key.trim().length > 5) {
      onSave(key.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
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
          <h3 className="font-display text-sm font-semibold tracking-wider">TWELVEDATA API</h3>
          <p className="text-xs text-muted-foreground font-mono">Market data engine</p>
        </div>
        {savedKey && <div className="ml-auto pulse-dot" />}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? "text" : "password"}
            value={key}
            onChange={e => { setKey(e.target.value); setSaved(false); }}
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
          className={`px-4 py-2 rounded-md font-display text-xs font-semibold tracking-wider transition-colors ${
            saved ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {saved ? <Check className="w-4 h-4" /> : "SAVE"}
        </motion.button>
      </div>

      <a
        href="https://twelvedata.com/apikey"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 mt-3 text-xs text-primary/70 hover:text-primary font-mono transition-colors"
      >
        Get free API key <ExternalLink className="w-3 h-3" />
      </a>
    </motion.div>
  );
};

export default ApiKeySetup;
