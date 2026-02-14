import { SlackApp, SlackEdgeAppEnv } from "slack-cloudflare-workers";

interface Env extends SlackEdgeAppEnv {
  ANTHROPIC_API_KEY: string;
}

async function callClaude(env: Env, userMessage: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system:
        "You are Seppo, a helpful and friendly bot in a Slack workspace. Keep your replies concise and useful. Use Slack markdown formatting when appropriate.",
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error (${response.status}): ${error}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  return data.content[0].text;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const app = new SlackApp({ env });

    app.event("app_mention", async ({ context, payload }) => {
      const text = payload.text.replace(/<@[A-Z0-9]+>/g, "").trim();
      if (!text) return;

      try {
        const reply = await callClaude(env, text);
        await context.say({
          text: reply,
          thread_ts: payload.thread_ts ?? payload.ts,
        });
      } catch (error) {
        console.error("Error calling Claude:", error);
        await context.say({
          text: "Sorry, I encountered an error. Please try again.",
          thread_ts: payload.thread_ts ?? payload.ts,
        });
      }
    });

    return await app.run(request, ctx);
  },
};
