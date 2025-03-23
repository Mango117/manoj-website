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

        const { data } = await axios.get(archiveUrl);
        const $ = cheerio.load(data);
        console.log('SUBSTACK_ARCHIVE_URL:', archiveUrl);

        // Update selectors based on the current DOM structure of the Substack archive page
        const elements = $(".pc-display-flex.pc-flexDirection-column.pc-gap-4"); // Parent container of each post
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

                // Convert relative URLs to absolute URLs
                if (url && !url.startsWith("http")) {
                    url = new URL(url, archiveUrl).href;
                }

                if (title && imageUrl && url) {
                    console.log("Scraped post:", { title, url, imageUrl });
                    posts.push({ title, imageUrl, url });
                }
            });

            if (process.env.NODE_ENV !== "production") {
                console.log("Scraped posts:", posts); // Debug log to verify scraped data
            }
        }

        if (posts.length === 0) {
            console.error(`No posts found. Check the selectors or the structure of the URL '${archiveUrl}'.`);
        }

        res.json(posts);
    } catch (error) {
        console.error("Error scraping blog posts:", error);
        res.status(500).json({ error: "Failed to fetch blog posts" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
