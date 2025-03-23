document.addEventListener("DOMContentLoaded", async () => {
    const blogPostsContainer = document.getElementById("blog-posts");

    try {
        const response = await fetch("/api/top-blog-posts"); // Fetch from your server-side API
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
    }
});
