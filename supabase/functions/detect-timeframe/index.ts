// Detects the timeframe from a chart screenshot using Lovable AI vision.
// Returns { timeframe: "1min"|"5min"|"15min"|"30min"|"1h"|"4h"|"1day"|"1week" }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID = ["1min", "5min", "15min", "30min", "1h", "4h", "1day", "1week"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageData } = await req.json();
    if (!imageData) throw new Error("imageData required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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
              "You read trading chart screenshots and identify their timeframe. Reply ONLY with one of: 1min, 5min, 15min, 30min, 1h, 4h, 1day, 1week. No other text.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "What is the chart timeframe? Reply with one token only." },
              { type: "image_url", image_url: { url: imageData } },
            ],
          },
        ],
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`AI gateway error: ${resp.status} ${t}`);
    }
    const data = await resp.json();
    const raw: string = (data?.choices?.[0]?.message?.content || "").trim().toLowerCase();
    const match = VALID.find((v) => raw.includes(v)) || "1h";

    return new Response(JSON.stringify({ timeframe: match }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ timeframe: "1h", error: (e as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
