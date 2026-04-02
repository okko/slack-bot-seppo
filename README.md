# Seppo — Slack Bot on Cloudflare Workers

Seppo is a Slack bot powered by Claude AI, deployed as a Cloudflare Worker. When mentioned in a Slack channel, Seppo responds in character as a helpful 60-year-old Finnish caretaker.

## Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up) with Workers enabled
- [Anthropic API key](https://console.anthropic.com/)
- [Slack workspace](https://slack.com/) with permission to create apps
- Node.js 18+ and npm

## 1. Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and click **Create New App > From scratch**.
2. Give it a name (e.g. *Seppo*) and select your workspace.
3. Under **OAuth & Permissions**, add the following **Bot Token Scopes**:
   - `app_mentions:read`
   - `chat:write`
4. Under **Event Subscriptions**, enable events and add the bot event `app_mention`.
   The Request URL will be set after deployment — come back to this step.
5. Install the app to your workspace and copy the **Bot User OAuth Token** (`xoxb-...`).
6. From **Basic Information**, copy the **Signing Secret**.

## 2. Set Up the Project

```bash
git clone <repo-url>
cd slack-bot-seppo
npm install
```

## 3. Configure `wrangler.toml`

Edit `wrangler.toml` and set your Cloudflare account ID:

```toml
name = "350fi-seppo"
main = "src/index.ts"
compatibility_date = "2025-02-14"
account_id = "<your-cloudflare-account-id>"
workers_dev = true
```

Your account ID is found in the Cloudflare dashboard URL or under **Workers & Pages > Overview**.

## 4. Add Secrets

Store sensitive values as Cloudflare Worker secrets (they are never stored in code or `wrangler.toml`):

```bash
# Slack bot token (xoxb-...)
npx wrangler secret put SLACK_BOT_TOKEN

# Slack signing secret
npx wrangler secret put SLACK_SIGNING_SECRET

# Anthropic API key
npx wrangler secret put ANTHROPIC_API_KEY
```

Each command will prompt you to paste the value.

## 5. Deploy

```bash
npm run deploy
```

Wrangler will output the Worker URL, e.g.:

```
https://350fi-seppo.<your-subdomain>.workers.dev
```

## 6. Finish Slack App Configuration

1. Go back to your Slack app's **Event Subscriptions** page.
2. Set the **Request URL** to your Worker URL.
   Slack will send a challenge request — the Worker handles it automatically.
3. Save changes and reinstall the app if prompted.

## Local Development

Run the Worker locally with a tunnel for Slack events:

```bash
npm run dev
```

Wrangler starts a local server and can expose it via `--remote` or you can use a tunnel tool (e.g. [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)) to expose the local port to the internet for Slack's event delivery.

## How It Works

| Component | Role |
|---|---|
| `slack-cloudflare-workers` | Handles Slack request verification and event routing |
| Cloudflare Workers | Serverless runtime — no server to manage |
| Anthropic API | Generates Seppo's responses via `claude-sonnet-4-5` |

When Seppo is @mentioned in a channel, the Worker:
1. Verifies the request signature from Slack
2. Strips the mention tag from the message text
3. Sends the text to Claude with Seppo's Finnish caretaker system prompt
4. Posts the reply in the same thread

## Environment Variables

| Variable | Source | Description |
|---|---|---|
| `SLACK_BOT_TOKEN` | Slack app | Bot User OAuth Token (`xoxb-...`) |
| `SLACK_SIGNING_SECRET` | Slack app | Used to verify request signatures |
| `ANTHROPIC_API_KEY` | Anthropic console | API key for Claude |
