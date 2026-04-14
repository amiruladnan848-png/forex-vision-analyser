import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Activity, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (mode === "signup") {
      const { error: err } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin },
      });
      setLoading(false);
      if (err) { setError(err.message); return; }
      setSuccess("Check your email to confirm your account.");
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (err) { setError(err.message); return; }
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background grid-bg scanline flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <motion.div
            className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center"
            animate={{ boxShadow: ["0 0 10px hsl(175 100% 45%/0.2)", "0 0 25px hsl(175 100% 45%/0.5)", "0 0 10px hsl(175 100% 45%/0.2)"] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Activity className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="font-display text-2xl font-bold tracking-[0.2em] glow-text">FOREX-VISION</h1>
          <p className="font-mono text-xs text-muted-foreground tracking-widest">AI CHART ANALYSIS SYSTEM</p>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 border border-border/50 rounded-lg overflow-hidden">
          {(["login", "signup"] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); setSuccess(""); }}
              className={`flex-1 py-3 font-display text-xs tracking-wider transition-all duration-300 ${
                mode === m ? "bg-primary text-primary-foreground" : "bg-card/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "login" ? "SIGN IN" : "SIGN UP"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="terminal-card p-6 glow-border space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full bg-muted/50 border border-border/50 rounded-md pl-10 pr-3 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 transition-colors"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              className="w-full bg-muted/50 border border-border/50 rounded-md pl-10 pr-10 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 transition-colors"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-mono text-xs">{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-accent font-mono text-xs">
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-md bg-primary text-primary-foreground font-display text-sm font-semibold tracking-wider transition-colors hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
          </motion.button>
        </form>

        <p className="text-center text-xs text-muted-foreground font-mono mt-4">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setSuccess(""); }} className="text-primary hover:underline">
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
