// Combined chart vision: detects timeframe AND deep SMC/ICT structure in ONE AI call.
// Replaces detect-timeframe + vision-analyze. Uses cheap gemini-2.5-flash-lite to keep credits low.

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
            "Detect chart timeframe AND report SMC/ICT structure in one go.",
          parameters: {
            type: "object",
            properties: {
              timeframe: {
                type: "string",
                enum: ["1min", "5min", "15min", "30min", "1h", "4h", "1day", "1week"],
                description: "Detected chart timeframe.",
              },
              bias: { type: "string", enum: ["BUY", "SELL", "NEUTRAL"] },
              confidence: { type: "number", description: "0-100" },
              trend: { type: "string", enum: ["BULLISH", "BEARISH", "SIDEWAYS"] },
              structure: { type: "string", description: "BOS / CHoCH / accumulation / distribution / range." },
              key_observations: {
                type: "array",
                items: { type: "string" },
                description: "3-5 short observations: FVG, OB, liquidity, S/D, candle pattern.",
              },
              risk_warnings: { type: "array", items: { type: "string" } },
            },
            required: ["timeframe", "bias", "confidence", "trend", "structure", "key_observations"],
            additionalProperties: false,
          },
        },
      },
    ];

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content:
              "You are an elite SMC/ICT chart analyst. In ONE response: (1) detect timeframe from x-axis labels, (2) identify trend, BOS/CHoCH, FVG, order blocks, liquidity, supply/demand, candle reaction. Be DECISIVE — only NEUTRAL if structure is genuinely unclear; otherwise BUY/SELL with realistic 60-92 confidence.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this ${pair || "forex"} chart screenshot. Return verdict via report_chart_analysis tool.`,
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
          JSON.stringify({ timeframe: "1h", bias: "NEUTRAL", confidence: 0, trend: "SIDEWAYS", structure: "rate_limited", key_observations: [] }),
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
      JSON.stringify({ timeframe: "1h", bias: "NEUTRAL", confidence: 0, trend: "SIDEWAYS", structure: "unavailable", key_observations: [], error: (e as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
