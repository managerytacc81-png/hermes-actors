# RSS & Atom Feed Reader — Clean JSON for AI Pipelines

Pull any RSS, Atom, or JSON feed into clean, structured JSON — built for LLM pipelines, agents, and monitoring.

## Why
Most feed tools give you raw XML or dumps with no filtering. This actor returns tidy records (title, link, date, author, categories, optional full text) with a **date-window filter**, so you get exactly the items in your reporting period — ideal for news digests, trend monitoring, RAG ingestion, and agent tool-calls.

## Input
- `feedUrls` — array of RSS/Atom/JSON feed URLs
- `maxItemsPerFeed` — cap per feed (0 = unlimited)
- `sinceDate` / `untilDate` — ISO date window filter
- `includeContent` — include cleaned full text (default off for cheap payloads)

## Output
Dataset of normalized items: `feedUrl, title, link, publishedAt, author, categories [, contentText, contentHtml, guid]`.

## Pricing
Pay per item returned (from $0.50 per 1,000 results) — no monthly fee. Works with schedulers for periodic briefings.

## For AI agents
Callable over **x402 agentic payments** (USDC on Base): POST the run endpoint with header `X-APIFY-PAYMENT-PROTOCOL: X402`, receive a 402 payment challenge, sign it with an agent wallet (e.g. Coinbase `awal`) — no API key, no account needed.

## Usage
```
node src/main.js  # or run on Apify with the input above
```

Run it on Apify (paid per result): https://apify.com/crescentic_osmosis/feed-reader

MIT-licensed source: https://github.com/managerytacc81-png/hermes-actors
