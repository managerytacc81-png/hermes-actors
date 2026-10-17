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
Pay per item returned — no monthly fee. Works with schedulers for periodic briefings.

## Usage
```
node src/main.js  # or run on Apify with the input above
```

MIT-licensed source: https://github.com/managerytacc81-png/hermes-actors
