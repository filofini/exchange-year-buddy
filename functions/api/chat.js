export async function onRequestPost(context) {
  const { request, env } = context;

  // Basic CORS (adjust origin if you want to lock it down)
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const body = await request.json();
    const user = (body && body.user) ? String(body.user) : "";
    const history = Array.isArray(body?.history) ? body.history : [];

    if (!user) {
      return new Response(JSON.stringify({ error: "Missing 'user' field" }), {
        status: 400, headers: { "Content-Type": "application/json", ...cors }
      });
    }

    // Load knowledge file hosted as a static asset on Pages
    const origin = new URL(request.url).origin;
    const knowledgeUrl = `${origin}/knowledge/filo.json`;
    const kr = await fetch(knowledgeUrl, { headers: { "Cache-Control": "no-cache" } });
    if (!kr.ok) throw new Error(`Failed to load knowledge: ${kr.status}`);
    const filo = await kr.json();

    const system = `
You are "Exchange Buddy", a chat partner for exchange students.
Speak in the user's language (detect from input). Persona: ${filo.persona.voice}
When the user makes a mistake, correct briefly in parentheses (once per message).
Prefer practical, real-life phrasing. Avoid textbook tone.

Weave in relevant items from these resources when helpful:
- Scenarios: ${filo.scenarios.slice(0, 12).map(s => s.title).join("; ")}
- IT slang: ${filo.slang.it.slice(0,5).join(", ")}
- EN slang: ${filo.slang.en.slice(0,5).join(", ")}
- Cultural do/don'ts are available.

When the user asks for tips or seems unsure, add a short "Filo tip:" line with 1 actionable suggestion.
Offer short roleplays for common situations.
`;

    const messages = [
      { role: "system", content: system },
      ...history,
      { role: "user", content: user }
    ];

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7
      })
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return new Response(JSON.stringify({ error: errText }), {
        status: 500, headers: { "Content-Type": "application/json", ...cors }
      });
    }

    const data = await openaiRes.json();
    const reply = data.choices?.[0]?.message?.content ?? "(no reply)";
    const newHistory = [...history, { role: "user", content: user }, { role: "assistant", content: reply }];

    return new Response(JSON.stringify({ reply, history: newHistory }), {
      headers: { "Content-Type": "application/json", ...cors }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || String(e) }), {
      status: 500, headers: { "Content-Type": "application/json", ...cors }
    });
  }
}
