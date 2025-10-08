document.addEventListener("DOMContentLoaded", async () => {
    const blogPostsContainer = document.getElementById("blog-posts");

    try {
        const response = await fetch("/api/top-blog-posts", { cache: "no-store" });
        if (!response.ok) {
            throw new Error("Non-200 response: " + response.status);
        }
        const posts = await response.json();

        // Clear the container to ensure no extra elements are present
        blogPostsContainer.innerHTML = "";

        posts.forEach(post => {
            const card = document.createElement("a");
            card.className = "blog-card";
            card.href = post.url;
            card.target = "_blank"; // Opens in a new tab
            card.innerHTML = `
                <img src="${post.imageUrl}" alt="${post.title}" class="blog-card-img">
                <h4 class="blog-card-title">${post.title}</h4>
            `;
            blogPostsContainer.appendChild(card);
        });
    } catch (error) {
        console.error("Failed to fetch blog posts:", error);
        if (blogPostsContainer) {
            blogPostsContainer.innerHTML = "<div class=\"blog-card-error\">Couldn’t load posts right now. <a href=\"https://manojarachige.substack.com/\" target=\"_blank\">View on Substack</a></div>";
        }
    }
});
