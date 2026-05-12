// Combined chart vision: detects timeframe + deep SMC/ICT/PA/FVG/Liquidity in ONE AI call.
// Uses gemini-2.5-flash-lite for low credit cost. Strict, decisive output for accurate signals.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageData, pair } = await req.json();
    if (!imageData) throw new Error("imageData required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const tools = [
      {
        type: "function",
        function: {
          name: "report_chart_analysis",
          description:
            "Forensic forex/crypto chart read: timeframe + SMC/ICT/PA structure + actionable bias.",
          parameters: {
            type: "object",
            properties: {
              timeframe: {
                type: "string",
                enum: ["1min", "5min", "15min", "30min", "1h", "4h", "1day", "1week"],
                description: "Detected from x-axis time labels.",
              },
              bias: { type: "string", enum: ["BUY", "SELL", "NEUTRAL"] },
              confidence: { type: "number", description: "0-100. Use NEUTRAL if <55." },
              trend: { type: "string", enum: ["BULLISH", "BEARISH", "SIDEWAYS"] },
              structure: { type: "string", description: "BOS / CHoCH / accumulation / distribution / range / trending." },
              last_candle_action: { type: "string", description: "What the last 1-3 candles did: rejection, engulfing, breakout, retest, sweep, etc." },
              fvg_present: { type: "boolean", description: "Unfilled fair value gap visible near price." },
              order_block_present: { type: "boolean", description: "Clear OB visible near price." },
              liquidity_swept: { type: "boolean", description: "Recent buy-side or sell-side liquidity sweep." },
              supply_demand_zone: { type: "string", description: "Price location vs nearest S/D zone: 'in-demand' | 'in-supply' | 'mid-range' | 'breaking-out'." },
              key_observations: {
                type: "array",
                items: { type: "string" },
                description: "4-6 short evidence-based observations from the chart.",
              },
              risk_warnings: { type: "array", items: { type: "string" }, description: "Reasons to skip the trade if any." },
              no_trade: { type: "boolean", description: "True if chart is too unclear or in chop." },
            },
            required: ["timeframe", "bias", "confidence", "trend", "structure", "last_candle_action", "supply_demand_zone", "key_observations", "no_trade"],
            additionalProperties: false,
          },
        },
      },
    ];

    const systemPrompt = `You are a top-tier institutional forex/crypto chart analyst with 15+ years on SMC, ICT, Wyckoff and pure price action.
You will receive a single chart screenshot. Read it FORENSICALLY and ALWAYS COMMIT to a directional bias (BUY or SELL):

1. TIMEFRAME — read x-axis labels precisely.
2. STRUCTURE — identify BOS/CHoCH, swing highs/lows, current trend (HH/HL bullish, LH/LL bearish).
3. PRICE ACTION — describe the latest 1–3 candles (rejection wick, engulfing, inside bar, breakout, retest).
4. SMC/ICT — flag visible Fair Value Gaps, Order Blocks, equal highs/lows (liquidity), liquidity sweeps/stop hunts.
5. SUPPLY/DEMAND — locate price relative to the nearest unmitigated S/D zone.
6. BIAS — ALWAYS choose BUY or SELL. Even on mixed charts, pick the side with the stronger evidence (trend, sweep direction, last impulse, rejection wick). NEVER return NEUTRAL.
7. NO-TRADE — ALWAYS set no_trade=false. Users want a tradeable verdict every time.
8. CONFIDENCE — A+ setup 88–96, strong 78–87, decent 70–77, weaker 65–69. Never below 65.

Be decisive and specific. The user has already decided to trade — your job is to tell them WHICH WAY with the highest-probability read of the chart.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this ${pair || "forex/crypto"} chart screenshot forensically and return your verdict via report_chart_analysis. If the chart does not show a clean institutional setup, return no_trade=true and bias=NEUTRAL — do not force a signal.`,
              },
              { type: "image_url", image_url: { url: imageData } },
            ],
          },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "report_chart_analysis" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429 || resp.status === 402) {
        return new Response(
          JSON.stringify({ timeframe: "1h", bias: "NEUTRAL", confidence: 0, trend: "SIDEWAYS", structure: "rate_limited", last_candle_action: "n/a", supply_demand_zone: "mid-range", key_observations: [], no_trade: true, _rate_limited: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
      const t = await resp.text();
      throw new Error(`AI gateway error: ${resp.status} ${t}`);
    }
    const data = await resp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured response");
    const args = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ timeframe: "1h", bias: "NEUTRAL", confidence: 0, trend: "SIDEWAYS", structure: "unavailable", last_candle_action: "n/a", supply_demand_zone: "mid-range", key_observations: [], no_trade: true, error: (e as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
