# Meal Prep App

Plan, prep, and improve your weekly meals. Track recipes with structured ingredients and cooking steps, schedule meals across the week, and use AI to analyze and improve your recipes.

## Features

- **Recipe Management** — Add recipes with structured ingredients, cooking methods/durations, and portion yields
- **3-Tier Rating** — Rate recipes as "will eat again", "need to modify", or "not recommended"
- **Commentary & Notes** — Annotate recipes with improvement ideas for future iterations
- **Version History** — Track changes over time with full revert support
- **Weekly Schedule** — Assign meals and snacks to Mon–Fri slots (breakfast through evening snack)
- **Portion Math** — See how many portions you need vs. what each recipe yields
- **AI Recipe Analysis** — Ask questions about a recipe and get suggestions with rationale; approve changes to apply them directly
- **Weekly Plan Analysis** — AI flags empty slots and nutritional gaps
- **Uncommon Ingredient Flagging** — AI identifies ingredients that may need advance ordering

## Setup

```bash
# Clone and install
git clone <your-repo>
cd meal-prep-app
npm install

# Configure AI provider
cp .env.example .env.local
# Edit .env.local with your API key

# Run locally
npm run dev
```

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables (`AI_PROVIDER`, `AI_API_KEY`, optionally `AI_MODEL`)
4. Deploy

## Switching AI Providers

Set `AI_PROVIDER` in your environment:
- `anthropic` (default) — uses Claude
- `openai` — uses GPT-4o

Set `AI_API_KEY` to the corresponding API key. Optionally override the model with `AI_MODEL`.

## Data Storage

v1 uses localStorage — your data stays in the browser. To migrate to Supabase or another backend, implement the `StorageProvider` interface in `lib/storage/types.ts` and swap the provider in `lib/storage/index.tsx`.
