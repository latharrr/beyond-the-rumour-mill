import Anthropic from "@anthropic-ai/sdk";
import { getSessionUser } from "@/lib/auth";
import { projectKnowledge } from "@/lib/ask/knowledge";
import { releaseAskSlot, takeAskSlot } from "@/lib/ask/rate-limit";
import { askSchema } from "@/lib/validation";

// POST /api/ask: answers one question about this project with Claude Haiku 5.5,
// streaming the answer back as plain text so it appears word by word.
// The API key stays on the server (ANTHROPIC_API_KEY, never NEXT_PUBLIC_).

const INSTRUCTIONS = `You help the team behind "Beyond the Rumour Mill" (LPU CA2 project P08, courses INT252 React and INT257 Next.js) answer questions about their own project, for example from a teacher in a viva.
The complete source code and docs follow. Answer only from them.
- Be short and plain: 2 to 6 sentences, or a few short bullet points, unless asked for more.
- Name the exact file for every claim, in backticks, e.g. \`lib/experiences/rumour.ts\`.
- When it fits, say which syllabus unit it covers (SYLLABUS.md maps them).
- If the code does not do something, say so plainly. Never invent files, features or numbers.
- Plain text only: no headings, no tables.
- Only answer questions about this project, its code or its syllabus mapping. For anything else, reply in one sentence that you only answer questions about Beyond the Rumour Mill.`;

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

export async function POST(request: Request) {
  // 1. Only signed-in users, so strangers can't spend the API key.
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Sign in to use Ask." }, { status: 401 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "Ask is not set up yet: add ANTHROPIC_API_KEY to the server environment." }, { status: 503 });
  }

  // 2. Validate the body with the same Zod schema style as the rest of the app.
  const parsed = askSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid question." }, { status: 400 });
  }

  // 3. Rate limits (per user and for the whole site), checked after validation so
  //    a malformed request never uses up a question.
  const slot = takeAskSlot(user.id);
  if (!slot.ok) {
    return Response.json({ error: slot.message }, { status: 429, headers: { "Retry-After": String(slot.retryAfterSec) } });
  }

  // 4. Ask Claude. The project files are the same on every request, so they are
  //    cached for an hour: later questions skip re-reading ~160k tokens (faster, ~10x cheaper).
  const stream = client.messages.stream({
    model: "claude-haiku-5-5",
    max_tokens: 1500, // answers are meant to be short; also caps the cost of one question
    output_config: { effort: "low" }, // quick factual answers, not deep reasoning
    system: [
      { type: "text", text: INSTRUCTIONS },
      { type: "text", text: projectKnowledge(), cache_control: { type: "ephemeral", ttl: "1h" } },
    ],
    messages: [{ role: "user", content: parsed.data.question }],
  });

  // 5. Forward only the answer text to the browser as it arrives.
  const encoder = new TextEncoder();
  let cancelled = false; // set when the user leaves; then there is no one left to write to
  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") controller.enqueue(encoder.encode("\n\n(The model declined to answer this one. Try rephrasing.)"));
        if (final.stop_reason === "max_tokens") controller.enqueue(encoder.encode("\n\n(Answer cut short. Ask a narrower question.)"));
      } catch (error) {
        if (cancelled) return; // aborted on purpose in cancel() below
        console.error("ask failed", error);
        controller.enqueue(encoder.encode("\n\n(Could not reach Claude. Please try again.)"));
      } finally {
        releaseAskSlot(user.id); // always free the user's slot, even on errors
      }
      controller.close();
    },
    // The user closed the page or navigated away: stop generating (and paying for) the answer.
    cancel() {
      cancelled = true;
      stream.abort();
      releaseAskSlot(user.id);
    },
  });

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
