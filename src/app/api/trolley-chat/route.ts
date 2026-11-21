import { ANSWER_LIMIT, validConversation } from "@/features/trolley-chat/conversation";
import { site } from "@/lib/config";

const guide = [
  { topic: /report|feedback|draft|photo|coach/i, text: "Open a station with a mission and choose a problem. Describe what you personally saw, including the station, time and how it affected your trip. The AI coach can help you revise. Finishing a mission records it in Tada. To reach the MBTA, use its official feedback channel." },
  { topic: /token|stamp|reward|journey|collection/i, text: "Complete a station mission to earn its reward. Open My Journey to revisit your activity, or Collection to see your rewards." },
  { topic: /map|explore|start|quest|station|mission/i, text: "On Explore, choose a starting place or select “Just show the map.” Tap a problem marker to read the station’s ticket and see what riders are being asked to check." },
];

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const messages = payload?.messages;
  if (!validConversation(messages)) {
    return Response.json({ error: "Please send a short question." }, { status: 400 });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    const question = messages[messages.length - 1].content;
    const answer = guide.find(({ topic }) => topic.test(question))?.text
      ?? "I can help with exploring the map, writing a report and collecting rewards. Which would you like to try?";
    return Response.json({ answer, source: "guide" });
  }

  const navigation = [...site.nav, ...site.moreNav].map(({ label }) => label).join(", ");
  const model = process.env.GEMINI_MODELS?.split(",").map(s => s.trim()).find(Boolean) || "gemini-flash-lite-latest";
  const instruction = [
    `You are Trolley, the rider's guide in ${site.name}. ${site.description}`,
    `Navigation: ${navigation}. ${guide.map(item => item.text).join(" ")}`,
    "Give a short plain-text answer in the rider's language. You have no live data or access to the rider's location, submissions or account. For current service or accessibility conditions, direct riders to mbta.com/alerts. Never claim to verify an observation or send a report. Ask for clarification if the conversation does not give enough context.",
  ].join("\n");

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      signal: AbortSignal.timeout(18000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instruction }] },
        contents: messages.map(({ role, content }) => ({
          role: role === "assistant" ? "model" : "user", parts: [{ text: content }],
        })),
        generationConfig: { maxOutputTokens: 450 },
      }),
    });
    if (res.ok) {
      const body = await res.json();
      const parts: { text?: string; thought?: boolean }[] = body.candidates?.[0]?.content?.parts ?? [];
      const answer = parts.filter(part => !part.thought && typeof part.text === "string").map(part => part.text).join("").trim();
      if (answer) return Response.json({ answer: answer.slice(0, ANSWER_LIMIT), source: "ai" });
    }
  } catch {
    // Return the same retryable message for network, timeout and malformed provider responses.
  }
  return Response.json({ error: "Trolley couldn’t connect. Please try again." }, { status: 503 });
}
