
CREATE TABLE IF NOT EXISTS public.signal_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pair TEXT NOT NULL,
  timeframe TEXT,
  direction TEXT,
  confidence INTEGER,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signal_usage_user_date ON public.signal_usage(user_id, used_at);

ALTER TABLE public.signal_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own signal usage"
ON public.signal_usage FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own signal usage"
ON public.signal_usage FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_daily_signal_count(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*)::INTEGER, 0)
  FROM public.signal_usage
  WHERE user_id = _user_id
    AND used_at >= (now() - INTERVAL '24 hours');
$$;
