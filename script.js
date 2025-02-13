window.addEventListener('load', function() { // Wait for the page to load
    setTimeout(function() { // Add a small delay (e.g., 1 second)
        console.log(gtag);  // Check gtag again
        if (typeof gtag === 'function') {
            console.log("gtag is available!");
            // Now you can safely use gtag()
            gtag('event', 'page_view'); // Example: send a pageview event
        } else {
            console.log("gtag is still not available.");
        }
    }, 1000);
});