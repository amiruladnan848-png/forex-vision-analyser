import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Users, Key, ShieldCheck, Check, X, Plus, Trash2, LogOut, ArrowLeft, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const ADMIN_PIN = "707078";

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  is_approved: boolean;
  created_at: string;
}

interface ApiKeyRow {
  id: string;
  key_value: string;
  label: string | null;
  is_active: boolean;
  created_at: string;
}

const Admin = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [tab, setTab] = useState<"users" | "apikeys">("users");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>([]);
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("*");
    if (data) setProfiles(data);
  }, []);

  const fetchApiKeys = useCallback(async () => {
    const { data } = await supabase.from("api_keys").select("*");
    if (data) setApiKeys(data);
  }, []);

  useEffect(() => {
    if (pinUnlocked && isAdmin) {
      fetchProfiles();
      fetchApiKeys();
    }
  }, [pinUnlocked, isAdmin, fetchProfiles, fetchApiKeys]);

  const handlePinKey = (digit: string) => {
    setPinError(false);
    const next = pin + digit;
    if (next.length <= 6) {
      setPin(next);
      if (next.length === 6) {
        if (next === ADMIN_PIN) {
          setPinUnlocked(true);
        } else {
          setPinError(true);
          setTimeout(() => { setPin(""); setPinError(false); }, 600);
        }
      }
    }
  };

  const toggleApproval = async (profile: Profile) => {
    await supabase.from("profiles").update({ is_approved: !profile.is_approved }).eq("id", profile.id);
    fetchProfiles();
  };

  const toggleAdmin = async (profile: Profile) => {
    const { data: roles } = await supabase.from("user_roles").select("*").eq("user_id", profile.user_id).eq("role", "admin");
    if (roles && roles.length > 0) {
      await supabase.from("user_roles").delete().eq("user_id", profile.user_id).eq("role", "admin");
    } else {
      await supabase.from("user_roles").insert({ user_id: profile.user_id, role: "admin" });
    }
    fetchProfiles();
  };

  const addApiKey = async () => {
    if (!newKey.trim()) return;
    await supabase.from("api_keys").insert({ key_value: newKey.trim(), label: newLabel.trim() || "Default", created_by: user?.id });
    setNewKey("");
    setNewLabel("");
    fetchApiKeys();
  };

  const deleteApiKey = async (id: string) => {
    await supabase.from("api_keys").delete().eq("id", id);
    fetchApiKeys();
  };

  const toggleApiKey = async (k: ApiKeyRow) => {
    await supabase.from("api_keys").update({ is_active: !k.is_active }).eq("id", k.id);
    fetchApiKeys();
  };

  // Pin Lock Screen
  if (!pinUnlocked) {
    const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];
    return (
      <div className="min-h-screen bg-background grid-bg scanline flex items-center justify-center">
        <motion.div className="flex flex-col items-center gap-8" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <motion.div
            className={`w-20 h-20 rounded-full flex items-center justify-center border-2 ${pinError ? "border-destructive bg-destructive/10" : "border-primary/50 bg-primary/5"}`}
            animate={pinError ? { x: [-10, 10, -10, 10, 0] } : {}}
          >
            <Lock className="w-10 h-10 text-primary" />
          </motion.div>
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold tracking-wider glow-text">ADMIN PANEL</h1>
            <p className="font-mono text-sm text-muted-foreground mt-2 tracking-widest">ENTER SECURITY PIN</p>
          </div>
          <div className="flex gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${i < pin.length ? (pinError ? "bg-destructive border-destructive" : "bg-primary border-primary") : "border-muted-foreground/30"}`} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {keys.map((key, i) =>
              key === "" ? <div key={i} /> : (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => key === "⌫" ? (setPin(p => p.slice(0, -1)), setPinError(false)) : handlePinKey(key)}
                  className="w-16 h-16 rounded-lg border border-border/50 bg-secondary/50 font-display text-xl text-foreground hover:border-primary/50 transition-colors flex items-center justify-center"
                >
                  {key}
                </motion.button>
              )
            )}
          </div>
          <button onClick={() => navigate("/")} className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back to app
          </button>
        </motion.div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background grid-bg scanline flex items-center justify-center">
        <motion.div className="terminal-card p-8 text-center max-w-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="font-display text-lg font-bold tracking-wider mb-2">ACCESS DENIED</h2>
          <p className="font-mono text-sm text-muted-foreground">You do not have admin privileges.</p>
          <button onClick={() => navigate("/")} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md font-display text-xs tracking-wider">BACK TO APP</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-bg scanline">
      <motion.header
        className="border-b border-border/30 bg-card/50 backdrop-blur-md sticky top-0 z-40"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <h1 className="font-display text-lg font-bold tracking-[0.2em] glow-text">ADMIN PANEL</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="font-mono text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> App
            </button>
            <button onClick={signOut} className="font-mono text-xs text-destructive hover:text-destructive/80 flex items-center gap-1">
              <LogOut className="w-3 h-3" /> Logout
            </button>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Tabs */}
        <div className="flex border border-border/50 rounded-lg overflow-hidden">
          {([["users", "Users", Users], ["apikeys", "API Keys", Key]] as const).map(([val, label, Icon]) => (
            <button
              key={val}
              onClick={() => setTab(val as any)}
              className={`flex-1 py-3 font-display text-xs tracking-wider transition-all flex items-center justify-center gap-2 ${
                tab === val ? "bg-primary text-primary-foreground" : "bg-card/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "users" && (
            <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              {profiles.map(p => (
                <motion.div key={p.id} className="terminal-card p-4 flex items-center justify-between gap-4" layout>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-foreground truncate">{p.email || "No email"}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleApproval(p)}
                      className={`px-3 py-1.5 rounded text-[10px] font-display tracking-wider transition-colors ${
                        p.is_approved ? "bg-accent text-accent-foreground" : "bg-destructive/20 text-destructive border border-destructive/30"
                      }`}
                    >
                      {p.is_approved ? "APPROVED" : "PENDING"}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleAdmin(p)}
                      title="Toggle admin"
                      className="px-3 py-1.5 rounded text-[10px] font-display tracking-wider bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors"
                    >
                      ADMIN
                    </motion.button>
                  </div>
                </motion.div>
              ))}
              {profiles.length === 0 && (
                <div className="terminal-card p-8 text-center">
                  <p className="font-mono text-sm text-muted-foreground">No users registered yet.</p>
                </div>
              )}
            </motion.div>
          )}

          {tab === "apikeys" && (
            <motion.div key="apikeys" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="terminal-card p-4 glow-border space-y-3">
                <h3 className="font-display text-xs tracking-wider text-muted-foreground">ADD NEW API KEY</h3>
                <div className="flex gap-2">
                  <input
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    placeholder="Label..."
                    className="w-32 bg-muted/50 border border-border/50 rounded-md px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 transition-colors"
                  />
                  <input
                    value={newKey}
                    onChange={e => setNewKey(e.target.value)}
                    placeholder="API Key value..."
                    className="flex-1 bg-muted/50 border border-border/50 rounded-md px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 transition-colors"
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={addApiKey}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-display text-xs tracking-wider"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {apiKeys.map(k => (
                <motion.div key={k.id} className="terminal-card p-4 flex items-center justify-between gap-3" layout>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-xs tracking-wider">{k.label || "Default"}</p>
                    <p className="font-mono text-[10px] text-muted-foreground truncate">{k.key_value.slice(0, 8)}...{k.key_value.slice(-4)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleApiKey(k)}
                      className={`px-3 py-1.5 rounded text-[10px] font-display tracking-wider transition-colors ${
                        k.is_active ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {k.is_active ? "ACTIVE" : "DISABLED"}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deleteApiKey(k.id)}
                      className="p-1.5 rounded text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
              {apiKeys.length === 0 && (
                <div className="terminal-card p-8 text-center">
                  <p className="font-mono text-sm text-muted-foreground">No API keys configured.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Admin;
