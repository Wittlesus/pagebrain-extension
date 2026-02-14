// ============================================================
// PageBrain - content.js
// Content script injected into web pages.
// Listens for messages from the popup and extracts page content.
// ============================================================

(function () {
  "use strict";

  const MAX_TEXT_LENGTH = 50000;

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractPageContent") {
      try {
        const pageData = extractContent();
        sendResponse(pageData);
      } catch (err) {
        sendResponse({
          title: document.title || "",
          url: window.location.href,
          text: "",
          error: err.message,
        });
      }
    }
    // Return true to keep the message channel open for async response
    return true;
  });

  function extractContent() {
    // Get page title
    const title = document.title || "Untitled Page";

    // Get page URL
    const url = window.location.href;

    // Extract main text content
    let text = "";

    // Try to get text from article or main content areas first
    const mainSelectors = [
      "article",
      "main",
      '[role="main"]',
      ".post-content",
      ".article-content",
      ".entry-content",
      "#content",
    ];

    for (const selector of mainSelectors) {
      const el = document.querySelector(selector);
      if (el && el.innerText && el.innerText.trim().length > 200) {
        text = el.innerText.trim();
        break;
      }
    }

    // Fallback to body text
    if (!text) {
      text = document.body.innerText || "";
    }

    // Clean up the text
    text = text
      // Collapse multiple newlines
      .replace(/\n{3,}/g, "\n\n")
      // Collapse multiple spaces
      .replace(/ {2,}/g, " ")
      .trim();

    // Truncate to max length
    if (text.length > MAX_TEXT_LENGTH) {
      text = text.substring(0, MAX_TEXT_LENGTH) + "\n\n[Content truncated...]";
    }

    return {
      title: title,
      url: url,
      text: text,
    };
  }
})();
