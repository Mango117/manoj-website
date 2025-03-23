const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");

const app = express();
const PORT = 3000;
require("dotenv").config();

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve the index.html file for the root route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/api/top-blog-posts", async (req, res) => {
    try {
        const archiveUrl = process.env.SUBSTACK_ARCHIVE_URL;
        if (!archiveUrl) {
            console.error("SUBSTACK_ARCHIVE_URL is not set in the environment variables.");
            return res.status(500).json({ error: "Server configuration error: SUBSTACK_ARCHIVE_URL is missing." });
        }

        const { data } = await axios.get(archiveUrl).catch((err) => {
            console.error("Error fetching Substack archive URL:", err.message);
            throw new Error("Failed to fetch Substack archive page.");
        });

        const $ = cheerio.load(data);
        console.log('SUBSTACK_ARCHIVE_URL:', archiveUrl);

        const elements = $(".pc-display-flex.pc-flexDirection-column.pc-gap-4");
        const posts = [];

        if (elements.length === 0) {
            console.error("No matching elements found. The DOM structure might have changed.");
        } else {
            elements.slice(0, 3).each((_, element) => {
                const linkElement = $(element).find("a[data-testid='post-preview-title']");
                const imageElement = $(element).find("img.postImage-L4FlO9");

                const title = linkElement.text().trim();
                let url = linkElement.attr("href");
                const imageUrl = imageElement.attr("src");

                if (url && !url.startsWith("http")) {
                    url = new URL(url, archiveUrl).href;
                }

                if (title && imageUrl && url) {
                    posts.push({ title, imageUrl, url });
                }
            });
        }

        if (posts.length === 0) {
            console.error(`No posts found. Check the selectors or the structure of the URL '${archiveUrl}'.`);
        }

        res.json(posts);
    } catch (error) {
        console.error("Error scraping blog posts:", error.message);
        res.status(500).json({ error: "Failed to fetch blog posts. Please try again later." });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
