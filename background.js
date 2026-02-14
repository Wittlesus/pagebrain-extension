// ============================================================
// PageBrain - background.js
// Minimal service worker for extension lifecycle management.
// ============================================================

// Log extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("PageBrain installed successfully.");
    // Set default preferences
    chrome.storage.sync.set({ summaryLength: "medium" });
  } else if (details.reason === "update") {
    console.log("PageBrain updated to version", chrome.runtime.getManifest().version);
  }
});

// Keep service worker alive during active summarization (not strictly needed,
// but included for robustness in case future features route through background)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "ping") {
    sendResponse({ status: "alive" });
  }
  return true;
});
