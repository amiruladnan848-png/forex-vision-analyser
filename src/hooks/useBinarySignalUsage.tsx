import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const BINARY_DAILY_LIMIT = 15;

// Binary signals are tracked in signal_usage with timeframe = '1min'
export function useBinarySignalUsage() {
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
      .eq("timeframe", "1min")
      .gte("used_at", since);
    setCount(c ?? 0);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  const recordUsage = useCallback(
    async (data: { pair: string; direction?: string; confidence?: number }) => {
      if (!user) return;
      await supabase.from("signal_usage").insert({
        user_id: user.id,
        pair: data.pair,
        timeframe: "1min",
        direction: data.direction ?? null,
        confidence: data.confidence ?? null,
      });
      setCount((c) => c + 1);
    },
    [user]
  );

  const remaining = isAdmin ? Infinity : Math.max(0, BINARY_DAILY_LIMIT - count);
  const canAnalyze = isAdmin || count < BINARY_DAILY_LIMIT;

  return { count, remaining, canAnalyze, loading, recordUsage, refresh: fetchCount, limit: BINARY_DAILY_LIMIT };
}
