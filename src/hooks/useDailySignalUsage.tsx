import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const DAILY_SIGNAL_LIMIT = 10;

export function useDailySignalUsage() {
  const { user, isAdmin } = useAuth();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: c } = await supabase
      .from("signal_usage")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("used_at", since);
    setCount(c ?? 0);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  const recordUsage = useCallback(
    async (data: { pair: string; timeframe?: string; direction?: string; confidence?: number }) => {
      if (!user) return;
      await supabase.from("signal_usage").insert({
        user_id: user.id,
        pair: data.pair,
        timeframe: data.timeframe ?? null,
        direction: data.direction ?? null,
        confidence: data.confidence ?? null,
      });
      setCount((c) => c + 1);
    },
    [user]
  );

  const remaining = isAdmin ? Infinity : Math.max(0, DAILY_SIGNAL_LIMIT - count);
  const canAnalyze = isAdmin || count < DAILY_SIGNAL_LIMIT;

  return { count, remaining, canAnalyze, loading, recordUsage, refresh: fetchCount };
}
