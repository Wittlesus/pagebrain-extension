// ============================================================
// PageBrain - popup.js
// Handles UI logic, API key management, content extraction
// via messaging, and Anthropic API calls for summarization.
// ============================================================

(function () {
  "use strict";

  // --- DOM References ---
  const settingsToggle = document.getElementById("settingsToggle");
  const mainView = document.getElementById("mainView");
  const settingsPanel = document.getElementById("settingsPanel");
  const settingsBack = document.getElementById("settingsBack");

  const apiSetup = document.getElementById("apiSetup");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const saveKeyBtn = document.getElementById("saveKeyBtn");

  const summarizeBtn = document.getElementById("summarizeBtn");
  const loading = document.getElementById("loading");
  const errorMsg = document.getElementById("errorMsg");
  const summaryOutput = document.getElementById("summaryOutput");
  const newSummaryBtn = document.getElementById("newSummaryBtn");

  const keyPointsContent = document.getElementById("keyPointsContent");
  const actionItemsContent = document.getElementById("actionItemsContent");
  const takeawayContent = document.getElementById("takeawayContent");

  // Settings elements
  const settingsKeyExists = document.getElementById("settingsKeyExists");
  const settingsKeyMissing = document.getElementById("settingsKeyMissing");
  const maskedKey = document.getElementById("maskedKey");
  const removeKeyBtn = document.getElementById("removeKeyBtn");
  const settingsApiKeyInput = document.getElementById("settingsApiKeyInput");
  const settingsSaveKeyBtn = document.getElementById("settingsSaveKeyBtn");
  const lengthOptions = document.querySelectorAll(".length-option");

  // --- State ---
  let apiKey = null;
  let summaryLength = "medium";

  // --- Initialization ---
  init();

  async function init() {
    const data = await chrome.storage.sync.get(["apiKey", "summaryLength"]);

    if (data.apiKey) {
      apiKey = data.apiKey;
      apiSetup.classList.remove("visible");
      summarizeBtn.disabled = false;
      updateSettingsKeyDisplay(true);
    } else {
      apiSetup.classList.add("visible");
      summarizeBtn.disabled = true;
      updateSettingsKeyDisplay(false);
    }

    if (data.summaryLength) {
      summaryLength = data.summaryLength;
    }

    // Update length option buttons
    lengthOptions.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.length === summaryLength);
    });
  }

  // --- API Key Management ---

  function maskApiKey(key) {
    if (!key || key.length < 12) return "****";
    return key.substring(0, 7) + "..." + key.substring(key.length - 4);
  }

  function updateSettingsKeyDisplay(hasKey) {
    if (hasKey) {
      settingsKeyExists.style.display = "block";
      settingsKeyMissing.style.display = "none";
      maskedKey.textContent = maskApiKey(apiKey);
    } else {
      settingsKeyExists.style.display = "none";
      settingsKeyMissing.style.display = "block";
    }
  }

  async function saveApiKey(key) {
    key = key.trim();
    if (!key) {
      showError("Please enter a valid API key.");
      return;
    }
    apiKey = key;
    await chrome.storage.sync.set({ apiKey: key });
    apiSetup.classList.remove("visible");
    summarizeBtn.disabled = false;
    updateSettingsKeyDisplay(true);
    hideError();
  }

  saveKeyBtn.addEventListener("click", () => {
    saveApiKey(apiKeyInput.value);
  });

  apiKeyInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveApiKey(apiKeyInput.value);
  });

  settingsSaveKeyBtn.addEventListener("click", () => {
    saveApiKey(settingsApiKeyInput.value);
  });

  settingsApiKeyInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveApiKey(settingsApiKeyInput.value);
  });

  removeKeyBtn.addEventListener("click", async () => {
    apiKey = null;
    await chrome.storage.sync.remove("apiKey");
    apiSetup.classList.add("visible");
    summarizeBtn.disabled = true;
    updateSettingsKeyDisplay(false);
    // Switch back to main view
    settingsPanel.classList.remove("visible");
    mainView.style.display = "block";
  });

  // --- Settings Toggle ---

  settingsToggle.addEventListener("click", () => {
    const isSettings = settingsPanel.classList.contains("visible");
    if (isSettings) {
      settingsPanel.classList.remove("visible");
      mainView.style.display = "block";
    } else {
      settingsPanel.classList.add("visible");
      mainView.style.display = "none";
    }
  });

  settingsBack.addEventListener("click", () => {
    settingsPanel.classList.remove("visible");
    mainView.style.display = "block";
  });

  // --- Summary Length Preference ---

  lengthOptions.forEach((btn) => {
    btn.addEventListener("click", async () => {
      summaryLength = btn.dataset.length;
      lengthOptions.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      await chrome.storage.sync.set({ summaryLength });
    });
  });

  // --- Summarize ---

  summarizeBtn.addEventListener("click", handleSummarize);
  newSummaryBtn.addEventListener("click", () => {
    summaryOutput.classList.remove("visible");
    handleSummarize();
  });

  async function handleSummarize() {
    if (!apiKey) {
      showError("Please save your API key first.");
      return;
    }

    hideError();
    summaryOutput.classList.remove("visible");
    summarizeBtn.style.display = "none";
    loading.classList.add("visible");

    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab) {
        throw new Error("No active tab found.");
      }

      // Check for restricted URLs
      if (
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("chrome-extension://") ||
        tab.url.startsWith("about:")
      ) {
        throw new Error(
          "Cannot summarize browser internal pages. Navigate to a website first."
        );
      }

      // Send message to content script to extract page text
      let pageData;
      try {
        pageData = await chrome.tabs.sendMessage(tab.id, {
          action: "extractPageContent",
        });
      } catch (err) {
        // Content script might not be injected yet; try programmatic injection
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        });
        pageData = await chrome.tabs.sendMessage(tab.id, {
          action: "extractPageContent",
        });
      }

      if (!pageData || !pageData.text) {
        throw new Error(
          "Could not extract page content. The page may be empty or restricted."
        );
      }

      // Call Anthropic API
      const summary = await callAnthropicAPI(pageData);
      renderSummary(summary);
    } catch (err) {
      showError(err.message || "An unexpected error occurred.");
      summarizeBtn.style.display = "block";
    } finally {
      loading.classList.remove("visible");
    }
  }

  // --- Anthropic API Call ---

  async function callAnthropicAPI(pageData) {
    const lengthInstructions = {
      short:
        "Provide a very concise summary. Key Points: 3 bullet points max. Action Items: 1-2 items. Main Takeaway: 1-2 sentences.",
      medium:
        "Provide a balanced summary. Key Points: 4-6 bullet points. Action Items: 2-4 items. Main Takeaway: 2-3 sentences.",
      detailed:
        "Provide a thorough and detailed summary. Key Points: 6-10 bullet points covering all major topics. Action Items: 3-6 items. Main Takeaway: 3-5 sentences with nuance.",
    };

    const systemPrompt = `You are PageBrain, an expert webpage summarizer. Analyze the provided webpage content and produce a structured summary.

Your output MUST be in the following exact format with these three sections. Use plain text, not markdown headers:

KEY POINTS:
- Point 1
- Point 2
- Point 3

ACTION ITEMS:
- Action 1
- Action 2

MAIN TAKEAWAY:
Your main takeaway text here.

Rules:
- ${lengthInstructions[summaryLength]}
- Be specific and informative, not vague
- Action items should be practical things the reader can do based on the content
- If the page has no clear action items, suggest relevant next steps (e.g. "Research X further", "Bookmark for reference")
- The main takeaway should capture the single most important insight
- Do not include any other sections or formatting`;

    const userMessage = `Summarize this webpage:

Title: ${pageData.title}
URL: ${pageData.url}

Content:
${pageData.text}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => null);
      if (response.status === 401) {
        throw new Error(
          "Invalid API key. Please check your key in settings."
        );
      }
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please wait a moment and try again.");
      }
      const detail =
        errBody?.error?.message || `API error (${response.status})`;
      throw new Error(detail);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;

    if (!text) {
      throw new Error("Empty response from API.");
    }

    return text;
  }

  // --- Render Summary ---

  function renderSummary(rawText) {
    // Parse the structured response
    const sections = parseSummary(rawText);

    keyPointsContent.innerHTML = formatList(sections.keyPoints);
    actionItemsContent.innerHTML = formatList(sections.actionItems);
    takeawayContent.innerHTML = formatParagraph(sections.takeaway);

    summaryOutput.classList.add("visible");
    summarizeBtn.style.display = "block";
    summarizeBtn.textContent = "Summarize Again";
  }

  function parseSummary(text) {
    const result = {
      keyPoints: [],
      actionItems: [],
      takeaway: "",
    };

    // Split into sections
    const keyPointsMatch = text.match(
      /KEY POINTS:\s*([\s\S]*?)(?=ACTION ITEMS:|MAIN TAKEAWAY:|$)/i
    );
    const actionItemsMatch = text.match(
      /ACTION ITEMS:\s*([\s\S]*?)(?=MAIN TAKEAWAY:|$)/i
    );
    const takeawayMatch = text.match(/MAIN TAKEAWAY:\s*([\s\S]*?)$/i);

    if (keyPointsMatch) {
      result.keyPoints = extractBullets(keyPointsMatch[1]);
    }

    if (actionItemsMatch) {
      result.actionItems = extractBullets(actionItemsMatch[1]);
    }

    if (takeawayMatch) {
      result.takeaway = takeawayMatch[1].trim();
    }

    // Fallback: if parsing failed, put everything in key points
    if (
      result.keyPoints.length === 0 &&
      result.actionItems.length === 0 &&
      !result.takeaway
    ) {
      result.keyPoints = text
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => line.replace(/^[-*]\s*/, "").trim());
      result.takeaway = "See key points above for the full summary.";
    }

    return result;
  }

  function extractBullets(text) {
    return text
      .split("\n")
      .map((line) => line.replace(/^[-*]\s*/, "").trim())
      .filter((line) => line.length > 0);
  }

  function formatList(items) {
    if (!items || items.length === 0)
      return '<p style="color:#999; font-style:italic;">None identified.</p>';
    return (
      "<ul>" + items.map((item) => `<li>${escapeHtml(item)}</li>`).join("") + "</ul>"
    );
  }

  function formatParagraph(text) {
    if (!text) return '<p style="color:#999; font-style:italic;">None identified.</p>';
    return `<p>${escapeHtml(text)}</p>`;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Error / UI Helpers ---

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.add("visible");
  }

  function hideError() {
    errorMsg.textContent = "";
    errorMsg.classList.remove("visible");
  }
})();
