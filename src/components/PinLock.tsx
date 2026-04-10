import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ShieldCheck, AlertTriangle } from "lucide-react";

const CORRECT_PIN = "707078";

interface PinLockProps {
  onUnlock: () => void;
}

const PinLock = ({ onUnlock }: PinLockProps) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleKey = useCallback((digit: string) => {
    if (success) return;
    setError(false);
    const next = pin + digit;
    if (next.length <= 6) {
      setPin(next);
      if (next.length === 6) {
        if (next === CORRECT_PIN) {
          setSuccess(true);
          setTimeout(onUnlock, 800);
        } else {
          setError(true);
          setTimeout(() => { setPin(""); setError(false); }, 600);
        }
      }
    }
  }, [pin, success, onUnlock]);

  const handleDelete = () => {
    setPin(p => p.slice(0, -1));
    setError(false);
  };

  const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background grid-bg scanline"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="flex flex-col items-center gap-8"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <motion.div
          className={`w-20 h-20 rounded-full flex items-center justify-center border-2 ${
            success ? "border-accent bg-accent/10" : error ? "border-destructive bg-destructive/10" : "border-primary/50 bg-primary/5"
          }`}
          animate={error ? { x: [-10, 10, -10, 10, 0] } : success ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.4 }}
        >
          {success ? (
            <ShieldCheck className="w-10 h-10 text-accent" />
          ) : error ? (
            <AlertTriangle className="w-10 h-10 text-destructive" />
          ) : (
            <Lock className="w-10 h-10 text-primary" />
          )}
        </motion.div>

        <div className="text-center">
          <h1 className="font-display text-3xl font-bold tracking-wider glow-text">FOREX-VISION</h1>
          <p className="font-mono text-sm text-muted-foreground mt-2 tracking-widest uppercase">Enter Security Pin</p>
        </div>

        <div className="flex gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                i < pin.length
                  ? error ? "bg-destructive border-destructive" : success ? "bg-accent border-accent" : "bg-primary border-primary"
                  : "border-muted-foreground/30"
              }`}
              animate={i < pin.length ? { scale: [0.8, 1.2, 1] } : {}}
              transition={{ duration: 0.2 }}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {keys.map((key, i) => (
            key === "" ? <div key={i} /> : (
              <motion.button
                key={i}
                whileHover={{ scale: 1.05, boxShadow: "0 0 15px hsl(175 100% 45% / 0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => key === "⌫" ? handleDelete() : handleKey(key)}
                className="w-16 h-16 rounded-lg border border-border/50 bg-secondary/50 font-display text-xl text-foreground hover:border-primary/50 transition-colors flex items-center justify-center"
              >
                {key}
              </motion.button>
            )
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PinLock;
