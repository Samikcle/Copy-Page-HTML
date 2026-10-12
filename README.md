# Copy Page HTML (Chromium Extension)

Copy the **live HTML** of the current webpage to your clipboard using a keyboard shortcut or the extension toolbar icon.

## Installation

1. Clone this repo.
2. Open `chrome://extensions` (or `edge://extensions` / `brave://extensions`).
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the `copy-page-html-extension` folder.
5. Open a regular webpage and press **Ctrl + Shift + Q** (macOS: **Command + Shift + Q**) or click the extension icon.
6. Paste into a text editor with **Ctrl + V** (macOS: **Command + V**).

## Change the shortcut

Open `chrome://extensions/shortcuts` (adjust the browser prefix for Edge or Brave), find **Copy Page HTML**, and assign your preferred shortcut.

## Notes and limitations

- Copies the current **live DOM HTML**.
- To also copy `<!DOCTYPE>` declaration, the setting 'const captureDoctype' can be adjusted to be 'true' in **background.js**.
- Does **not** include the contents of external JavaScript or CSS files, iframe documents, shadow roots, or the original HTTP response source.
- Browser internal pages, the Chrome Web Store, and certain protected tabs do not allow script injection. The extension displays an **ERR** badge if the operation fails.
- The HTML is copied locally to your clipboard; the extension does not upload it.
