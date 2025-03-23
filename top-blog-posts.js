const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async (req, res) => {
    try {
        const { data } = await axios.get(process.env.SUBSTACK_ARCHIVE_URL, {
            headers: { "User-Agent": "Mozilla/5.0" } // Pretend to be a browser
        });

        const $ = cheerio.load(data);
        const elements = $(".pc-display-flex.pc-flexDirection-column.pc-gap-4");
        const posts = [];

        elements.slice(0, 3).each((_, element) => {
            const linkElement = $(element).find("a[data-testid='post-preview-title']");
            const imageElement = $(element).find("img.postImage-L4FlO9");

            const title = linkElement.text().trim();
            const url = linkElement.attr("href");
            const imageUrl = imageElement.attr("src");

            if (title && imageUrl && url) {
                posts.push({ title, imageUrl, url });
            }
        });

        if (posts.length === 0) {
            console.warn("No blog posts found. Check selectors or Substack DOM.");
        }

        res.status(200).json(posts);
    } catch (error) {
        console.error("Error scraping blog posts:", error);
        res.status(500).json({ error: "Failed to fetch blog posts" });
    }
};