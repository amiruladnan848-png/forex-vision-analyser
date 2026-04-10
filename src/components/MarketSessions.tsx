import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Globe, Clock } from "lucide-react";

interface Session {
  name: string;
  city: string;
  openUTC: number;
  closeUTC: number;
  color: string;
}

const sessions: Session[] = [
  { name: "Sydney", city: "AUS", openUTC: 22, closeUTC: 7, color: "text-blue-400" },
  { name: "Tokyo", city: "JPY", openUTC: 0, closeUTC: 9, color: "text-yellow-400" },
  { name: "London", city: "GBP", openUTC: 8, closeUTC: 17, color: "text-primary" },
  { name: "New York", city: "USD", openUTC: 13, closeUTC: 22, color: "text-accent" },
];

const isOpen = (s: Session, hour: number) => {
  if (s.openUTC < s.closeUTC) return hour >= s.openUTC && hour < s.closeUTC;
  return hour >= s.openUTC || hour < s.closeUTC;
};

const MarketSessions = () => {
  const [now, setNow] = useState(new Date());
  const [tz, setTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const utcH = now.getUTCHours();
  const localTime = now.toLocaleTimeString("en-US", { timeZone: tz, hour12: false });

  return (
    <motion.div
      className="terminal-card p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center">
            <Globe className="w-4 h-4 text-accent" />
          </div>
          <h3 className="font-display text-sm font-semibold tracking-wider">MARKET SESSIONS</h3>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span className="text-foreground font-semibold">{localTime}</span>
          <span>UTC+{-(now.getTimezoneOffset() / 60)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <select
          value={tz}
          onChange={e => setTz(e.target.value)}
          className="bg-muted/50 border border-border/50 rounded px-2 py-1 font-mono text-xs text-foreground focus:outline-none focus:border-primary/60"
        >
          {["UTC", "America/New_York", "Europe/London", "Asia/Tokyo", "Australia/Sydney", "Asia/Hong_Kong", "Europe/Frankfurt",
            Intl.DateTimeFormat().resolvedOptions().timeZone
          ].filter((v, i, a) => a.indexOf(v) === i).map(t => (
            <option key={t} value={t}>{t.replace("_", " ")}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {sessions.map((s, i) => {
          const open = isOpen(s, utcH);
          return (
            <motion.div
              key={s.name}
              className={`flex items-center gap-3 p-3 rounded-md border transition-all ${
                open ? "border-primary/30 bg-primary/5" : "border-border/30 bg-muted/20"
              }`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <div className={`w-2 h-2 rounded-full ${open ? "bg-accent animate-glow-pulse" : "bg-muted-foreground/30"}`} />
              <div>
                <span className={`font-display text-xs font-semibold ${s.color}`}>{s.name}</span>
                <span className="text-xs text-muted-foreground ml-2 font-mono">{s.city}</span>
              </div>
              <span className={`ml-auto font-mono text-[10px] uppercase tracking-wider ${open ? "text-accent" : "text-muted-foreground/50"}`}>
                {open ? "OPEN" : "CLOSED"}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default MarketSessions;
