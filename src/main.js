import { Actor, log } from 'apify';
import got from 'got';
import { XMLParser } from 'fast-xml-parser';

await Actor.init();

const input = await Actor.getInput() ?? {};
const feedUrls = input.feedUrls ?? [];
const maxItems = Number(input.maxItemsPerFeed ?? 100);
const since = input.sinceDate ? new Date(input.sinceDate) : null;
const until = input.untilDate ? new Date(input.untilDate) : null;
const includeContent = !!input.includeContent;

if (!Array.isArray(feedUrls) || feedUrls.length === 0) {
    throw new Error('Input "feedUrls" must be a non-empty array of feed URLs.');
    await Actor.exit();
}
for (const d of [since, until]) {
    if (d && Number.isNaN(d.getTime())) throw new Error('Invalid date filter.');
}

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) => ['item', 'entry', 'category', 'enclosure'].includes(name),
});

const first = (v) => (Array.isArray(v) ? v[0] : v);
const textOf = (v) => {
    if (v == null) return null;
    if (typeof v === 'string') return v;
    if (typeof v === 'object') {
        if (typeof v['#text'] === 'string') return v['#text'];
        if (v['@_href'] && typeof v['@_href'] === 'string') return v['@_href'];
    }
    return String(v);
};

const stripHtml = (s) => (s ? s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : null);

const pickDate = (it) => {
    const raw = it.pubDate || it.published || it.updated || it['dc:date'];
    const s = textOf(raw);
    if (!s) return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const dataset = await Actor.openDataset();
let totalPushed = 0;

for (const url of feedUrls) {
    log.info(`Fetching ${url}`);
    let body;
    try {
        body = await got(url, {
            timeout: { request: 30000 },
            followRedirect: true,
            headers: { 'user-agent': 'ApifyFeedReader/0.1 (+https://apify.com/crescentic_osmosis)' },
            responseType: 'text',
            retry: 2,
        }).text();
    } catch (err) {
        log.warning(`Failed to fetch ${url}: ${err.message}`);
        continue;
    }

    let items = [];
    try {
        const trimmed = body.trim();
        if (trimmed.startsWith('{')) {
            // JSON Feed 1.x
            const j = JSON.parse(trimmed);
            items = (j.items || []).map((it) => ({
                title: it.title ?? null,
                link: it.url ?? it.external_url ?? null,
                author: textOf(first(it.authors)?.name) ?? textOf(it.author?.name) ?? null,
                categories: (it.tags || []).filter(Boolean),
                publishedAt: it.date_published ?? null,
                contentHtml: includeContent ? (it.content_html ?? null) : null,
                contentText: includeContent ? stripHtml(it.content_text ?? it.content_html) : null,
            }));
        } else {
            const doc = parser.parse(body);
            if (doc.rss?.channel) {
                items = (first(doc.rss.channel)?.item ?? doc.rss.channel.item ?? []).map((it) => ({
                    title: textOf(it.title),
                    link: textOf(it.link) ?? textOf(it['guid']?.['#text']) ?? null,
                    author: textOf(it.author) ?? textOf(it['dc:creator']),
                    categories: (it.category ?? []).map((c) => textOf(c)).filter(Boolean),
                    publishedAt: pickDate(it),
                    guid: textOf(it.guid),
                    contentHtml: includeContent ? textOf(it['content:encoded'] ?? it.description) ?? null : null,
                    contentText: includeContent ? stripHtml(textOf(it['content:encoded'] ?? it.description)) : null,
                }));
            } else if (doc.feed) {
                items = (doc.feed.entry ?? []).map((it) => {
                    const links = it.link ?? [];
                    const alt = [].concat(links).find((l) => l?.['@_rel'] === 'alternate' || !l?.['@_rel']) ?? links;
                    return {
                        title: textOf(it.title),
                        link: textOf(alt),
                        author: textOf(first(it.author)?.name),
                        categories: (it.category ?? []).map((c) => c?.['@_term']).filter(Boolean),
                        publishedAt: pickDate(it),
                        guid: textOf(it.id),
                        contentHtml: includeContent ? textOf(it.content ?? it.summary) ?? null : null,
                        contentText: includeContent ? stripHtml(textOf(it.content ?? it.summary)) : null,
                    };
                });
            } else {
                log.warning(`${url}: unrecognized feed shape, skipping.`);
                continue;
            }
        }
    } catch (err) {
        log.warning(`${url}: parse error ${err.message}`);
        continue;
    }

    let out = items
        .filter((it) => it && (it.title || it.link))
        .map((it) => ({ feedUrl: url, ...it }));

    if (since) out = out.filter((it) => !it.publishedAt || new Date(it.publishedAt) >= since);
    if (until) out = out.filter((it) => !it.publishedAt || new Date(it.publishedAt) <= until);
    if (maxItems > 0) out = out.slice(0, maxItems);

    if (out.length) {
        await dataset.pushData(out);
        totalPushed += out.length;
    }
    log.info(`${url}: ${out.length} items kept.`);
}

await Actor.setValue('OUTPUT_SUMMARY', { feeds: feedUrls.length, items: totalPushed });
log.info(`Done. ${totalPushed} items from ${feedUrls.length} feeds.`);
await Actor.exit();
