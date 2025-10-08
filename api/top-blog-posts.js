const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async (req, res) => {
    try {
        const archiveUrl = process.env.SUBSTACK_ARCHIVE_URL || "https://manojarachige.substack.com/archive";
        const origin = new URL(archiveUrl).origin;
        const feedUrl = process.env.SUBSTACK_FEED_URL || `${origin}/feed`;

        const headers = {
            // Pretend to be a browser to avoid potential bot blocks
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        };

        const debug = req && req.query && (req.query.debug === '1' || req.query.debug === 'true');
        const debugLogs = [];
        const log = (msg, obj) => {
            const line = obj ? `${msg} ${JSON.stringify(obj)}` : String(msg);
            debugLogs.push(line);
            console.log(line);
        };
        const posts = [];

        // Try RSS first (more stable than DOM selectors)
        try {
            log('Fetching RSS', { feedUrl });
            const { data: feedXml } = await axios.get(feedUrl, { headers });
            const $rss = cheerio.load(feedXml, { xmlMode: true });
            const items = $rss("item");

            items.slice(0, 3).each((_, el) => {
                const $el = $rss(el);
                const title = $el.find("title").first().text().trim();
                let url = $el.find("link").first().text().trim();

                let imageUrl = null;
                const contentEncoded = $el.find("content\\:encoded").first().text();
                if (contentEncoded) {
                    const imgMatch = contentEncoded.match(/<img[^>]+src=[\"']([^\"']+)[\"']/i);
                    if (imgMatch) imageUrl = imgMatch[1];
                }

                if (!imageUrl) {
                    const enclosureUrl = $el.find("enclosure").attr("url");
                    if (enclosureUrl) imageUrl = enclosureUrl;
                }

                if (url && !url.startsWith("http")) {
                    url = new URL(url, origin).href;
                }

                if (title && url) {
                    posts.push({ title, imageUrl, url });
                }
            });
            log('RSS parsed posts', { count: posts.length });
        } catch (rssErr) {
            log("RSS fetch/parse failed:", { error: rssErr.message });
        }

        // Fallback to archive page scraping if RSS produced nothing
        if (posts.length === 0) {
            log('Falling back to Archive scraping', { archiveUrl });
            const { data } = await axios.get(archiveUrl, { headers }).catch((err) => {
                log("Error fetching Substack archive URL:", { error: err.message });
                throw new Error("Failed to fetch Substack archive page.");
            });

            const $ = cheerio.load(data);

            const candidateSelectors = [
                ".pc-display-flex.pc-flexDirection-column.pc-gap-4",
                "div[data-testid='post-preview']",
                "article"
            ];

            let matched = false;
            for (const selector of candidateSelectors) {
                const elements = $(selector);
                if (elements.length === 0) continue;
                matched = true;

                elements.slice(0, 3).each((_, element) => {
                    const linkElement = $(element)
                        .find("a[data-testid='post-preview-title'], a.post-preview-title, a[href*='/p/']")
                        .first();
                    const imageElement = $(element)
                        .find("img.postImage-L4FlO9, img[src*='images'], img")
                        .first();

                    const derivedTitle = linkElement.text().trim() || $(element).find("h2, h3").first().text().trim();
                    let url = linkElement.attr("href");
                    const imageUrl = imageElement.attr("src");

                    if (url && !url.startsWith("http")) {
                        url = new URL(url, origin).href;
                    }

                    if (derivedTitle && url) {
                        posts.push({ title: derivedTitle, imageUrl, url });
                    }
                });

                // Stop after first selector that yields results
                if (posts.length > 0) break;
            }

            if (!matched) {
                log("Archive selectors matched no elements", { archiveUrl });
            }
        }

        if (posts.length === 0) {
            log(`No posts found from RSS or archive for '${archiveUrl}'.`);
        }

        if (debug) {
            try {
                res.setHeader('x-debug-logs', encodeURIComponent(debugLogs.join('\n')));
            } catch (_) {
                // ignore header set failure
            }
        }

        res.json(posts);
    } catch (error) {
        console.error("Error scraping blog posts:", error.message);
        res.status(500).json({ error: "Failed to fetch blog posts. Please try again later." });
    }
};
