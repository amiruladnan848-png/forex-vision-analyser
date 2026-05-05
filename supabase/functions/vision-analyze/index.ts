// Deep AI vision analysis of a chart screenshot.
// Returns structured bias, confidence, zones, and key observations using Lovable AI vision.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageData, pair, timeframe } = await req.json();
    if (!imageData) throw new Error("imageData required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const tools = [
      {
        type: "function",
        function: {
          name: "report_chart_analysis",
          description:
            "Report deep technical analysis of the trading chart using Smart Money Concepts (SMC), ICT, Wyckoff, price action, supply/demand zones, FVG, order blocks, liquidity, and trend structure.",
          parameters: {
            type: "object",
            properties: {
              bias: {
                type: "string",
                enum: ["BUY", "SELL", "NEUTRAL"],
                description: "Final directional bias from the chart structure.",
              },
              confidence: {
                type: "number",
                description: "Confidence 0-100 in the bias based on how clean the structure is.",
              },
              trend: {
                type: "string",
                enum: ["BULLISH", "BEARISH", "SIDEWAYS"],
              },
              structure: {
                type: "string",
                description: "BOS, CHoCH, accumulation, distribution, range, etc. with context.",
              },
              key_observations: {
                type: "array",
                items: { type: "string" },
                description: "3-6 short bullet observations: FVG, order block, liquidity sweep, supply/demand, fib level, candle patterns, momentum, divergence.",
              },
              risk_warnings: {
                type: "array",
                items: { type: "string" },
                description: "0-3 warnings if signal quality is reduced (consolidation, news, weak structure).",
              },
            },
            required: ["bias", "confidence", "trend", "structure", "key_observations"],
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
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are an elite forex/crypto chart analyst with 20 years experience in Smart Money Concepts (SMC), ICT methodology, Wyckoff, supply/demand, and pure price action. You analyze the actual visible chart structure: swing highs/lows, BOS/CHoCH, fair value gaps, order blocks, liquidity pools, supply/demand zones, candle patterns, trend, and momentum. Be DECISIVE — only return NEUTRAL if structure is genuinely unclear. Otherwise commit to BUY or SELL with realistic confidence (60-92).",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this ${pair || "forex"} chart on ${timeframe || "auto"} timeframe. Identify the dominant trend, latest BOS/CHoCH, untapped FVG/order blocks, liquidity pools, supply/demand zones, and candle reaction. Return your verdict via the report_chart_analysis tool.`,
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
      const t = await resp.text();
      if (resp.status === 429 || resp.status === 402) {
        return new Response(JSON.stringify({ bias: "NEUTRAL", confidence: 0, error: "rate_limit" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      throw new Error(`AI gateway error: ${resp.status} ${t}`);
    }
    const data = await resp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured response from AI");
    const args = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ bias: "NEUTRAL", confidence: 0, trend: "SIDEWAYS", structure: "unavailable", key_observations: [], error: (e as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
