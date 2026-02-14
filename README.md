# PageBrain - AI Page Summarizer

A Chrome extension that summarizes any webpage instantly using AI. Get key points, action items, and insights in seconds with a single click.

## What It Does

PageBrain extracts the text content of the current webpage and sends it to the Anthropic Claude API to generate a structured summary containing:

- **Key Points** - The most important facts and information from the page
- **Action Items** - Practical next steps you can take based on the content
- **Main Takeaway** - The single most important insight from the page

You can configure summary length (short, medium, or detailed) to control how much detail you receive.

## Installation

1. Download or clone this repository to your local machine.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked** and select the `ai-page-summarizer-extension` folder.
5. The PageBrain icon will appear in your Chrome toolbar.

## How to Use

1. Click the PageBrain icon in your Chrome toolbar.
2. On first use, enter your Anthropic API key and click **Save**. You can get an API key at [console.anthropic.com](https://console.anthropic.com/).
3. Navigate to any webpage you want to summarize.
4. Click **Summarize This Page** and wait a few seconds.
5. Read your structured summary with key points, action items, and the main takeaway.

### Settings

Click the gear icon in the top-right corner to:

- View or remove your saved API key
- Change the summary length preference (Short, Medium, or Detailed)

## Privacy

- **API key**: Your Anthropic API key is stored locally in Chrome's sync storage. It is never sent anywhere except directly to the Anthropic API.
- **Page content**: The text content of the page you are summarizing is sent to the Anthropic API (`api.anthropic.com`) for processing. No page content is stored or sent anywhere else.
- **No analytics**: PageBrain does not collect any analytics, telemetry, or usage data.
- **No third parties**: The extension communicates only with the Anthropic API. No other third-party services are involved.

## Icons

The `icons/` directory should contain extension icons in three sizes:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

You can generate these icons with any image editor or use a placeholder. The extension will work without icons but Chrome will show a default puzzle-piece icon.

## Tech Stack

- **Manifest V3** Chrome Extension
- Vanilla JavaScript (no frameworks or build tools)
- Anthropic Claude API (claude-sonnet-4-5-20250929)

## More Developer Tools

| Product | Description | Price |
|---------|-------------|-------|
| [LaunchFast SaaS Starter](https://github.com/Wittlesus/launchfast-starter) | Next.js 16 boilerplate with auth, payments, AI, email | $79 |
| [SEO Blog Engine](https://github.com/Wittlesus/seo-blog-engine) | CLI for generating SEO blog posts | $29 |
| [Indie Hacker Toolkit](https://github.com/Wittlesus/indie-hacker-toolkit) | 5 planning templates for solo founders | $19 |
| [PromptVault](https://github.com/Wittlesus/prompt-vault) | 64 production-ready AI prompts | $19 |
| [CursorRules Pro](https://github.com/Wittlesus/cursorrules-pro) | .cursorrules for 8 popular stacks | $14 |
| [Complete Bundle](https://buy.stripe.com/5kQeVceTj0P8enGe7U08g06) | All products above | $99 |
