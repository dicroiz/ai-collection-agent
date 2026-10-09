# AI Collection Agent — MVP

> Automated debt collection system for the Brazilian market (pt-BR).
> Sends WhatsApp messages and makes AI-powered voice calls with human-like negotiation skills.

---

## Architecture

```
[Operator Dashboard]
        |
        ├──► WhatsApp Cloud API (Meta) ──► Debtor's Phone (WhatsApp)
        |         ▲                              |
        |         └── GPT-4o "Ana" Agent ◄───────┘
        |
        └──► Vapi.ai ──► Twilio (+55 BR) ──► Debtor's Phone (Call)
                  |
                  ├─ ElevenLabs PT-BR Voice (TTS)
                  ├─ Deepgram STT
                  └─ GPT-4o (same negotiation agent)
                            |
                            ▼
                    PostgreSQL Database
              (all messages + call transcripts)
```

**Stack:** Next.js 14 · TypeScript · Prisma · PostgreSQL · GPT-4o · Vapi.ai · Meta WhatsApp Cloud API

---

## Prerequisites

- [Node.js 20+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local PostgreSQL)
- [VS Code](https://code.visualstudio.com) (recommended)

---

## Local Setup (VS Code + Docker)

### 1. Clone the repository
```bash
git clone https://github.com/dicroiz/ai-collection-agent.git
cd ai-collection-agent
```

### 2. Configure environment variables
```bash
cp .env.local.example .env.local
```
Open `.env.local` and fill in your API keys (see [API Keys](#api-keys) section below).

### 3. Start local PostgreSQL
```bash
docker-compose up -d
```
This starts a PostgreSQL 16 instance on `localhost:5432`.

### 4. Install dependencies
```bash
npm install
```

### 5. Run database migrations
```bash
npx prisma migrate dev --name init
```

### 6. Start the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the operator dashboard is live.

---

## API Keys

You need accounts and keys from these 5 services:

| Service | Purpose | Get Key |
|---|---|---|
| **Meta / WhatsApp** | Send & receive WhatsApp messages | [developers.facebook.com](https://developers.facebook.com) → My Apps → WhatsApp → API Setup |
| **OpenAI** | GPT-4o negotiation agent ("Ana") | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **Vapi.ai** | Voice call orchestration | [app.vapi.ai](https://app.vapi.ai) → Account → API Keys |
| **Twilio** | Brazilian +55 phone number (PSTN) | [console.twilio.com](https://console.twilio.com) |
| **ElevenLabs** | PT-BR human-like voice (TTS) | [elevenlabs.io](https://elevenlabs.io) → Profile → API Key |

> **For the demo/MVP:** You can run the app with missing keys — a yellow warning banner will show which keys are missing. The UI is fully functional for testing without real API calls.

---

## Vapi.ai Assistant Setup

Before making voice calls, create an assistant in the Vapi dashboard:

1. Go to [app.vapi.ai](https://app.vapi.ai) → Assistants → Create Assistant
2. Set **Model**: OpenAI → GPT-4o
3. Set **Voice**: ElevenLabs → select a Brazilian Portuguese voice (e.g. Mateus)
4. Set **System Prompt**:
```
Você é Ana, especialista em negociação de cobranças da nossa empresa. 
Seu objetivo é contatar o cliente de forma profissional e empática para resolver um débito em aberto.
Seja firme mas respeitosa. Ofereça opções de pagamento: à vista, 2x ou 3x.
Sempre fale em português brasileiro.
```
5. Connect your Twilio +55 number in Vapi → Phone Numbers
6. Copy the **Assistant ID** to your `.env.local` as `VAPI_ASSISTANT_ID`

---

## WhatsApp Webhook Setup

After starting the app (locally via ngrok, or deployed), configure the webhook in Meta:

1. Go to [developers.facebook.com](https://developers.facebook.com) → Your App → WhatsApp → Configuration
2. Set Webhook URL: `https://your-domain.com/api/webhook/whatsapp`
3. Set Verify Token: same value as `META_WHATSAPP_VERIFY_TOKEN` in your `.env.local`
4. Subscribe to: `messages`

For local development, use [ngrok](https://ngrok.com):
```bash
ngrok http 3000
# Copy the https URL and use it as the webhook URL in Meta
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Operator dashboard — add debtors, send WhatsApp, trigger calls |
| `/interactions` | Full interaction log — all messages and call transcripts |
| `/api/webhook/whatsapp` | Meta webhook (GET: verification, POST: incoming messages) |
| `/api/webhook/vapi` | Vapi webhook — receives call transcripts when call ends |
| `/api/whatsapp/send` | POST — sends initial WhatsApp message to a debtor |
| `/api/calls/trigger` | POST — triggers outbound AI voice call via Vapi |
| `/api/debtors` | CRUD — manage debtor records |

---

## Deployment

This project is deployed on **Abacus AI infrastructure** (hosted Next.js + managed PostgreSQL).

For self-hosted deployment, use the standard Next.js deployment guide:
```bash
npm run build
npm start
```

Or deploy to Vercel, Railway, or any Node.js-compatible host. Set all `.env.local` variables as environment variables in your hosting platform.

---

## Monthly Cost Estimate (4,000 accounts)

| Service | Monthly Cost |
|---|---|
| Meta WhatsApp Cloud API | $174.00 |
| Vapi.ai | $156.00 |
| Twilio (+55 BR) | $114.32 |
| ElevenLabs Scale plan | $99.00 |
| OpenAI GPT-4o | $78.45 |
| Deepgram STT | $0 (free tier) |
| **Total** | **~$623/month** |

---

## License

Private — all rights reserved.
