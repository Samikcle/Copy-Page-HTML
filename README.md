# Copy Page HTML (Chromium Extension)

Copy or Download the **live HTML** of the current webpage using a keyboard shortcut or the extension toolbar icon.

## Installation

1. Clone this repo.
2. Open `chrome://extensions` (or `edge://extensions` / `brave://extensions`).
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the `copy-page-html-extension` folder.
5. Open a regular webpage and press **Ctrl + Shift + Q** (macOS: **Command + Shift + Q**) or click the 'Copy HTML' button to copy it into your clipboard.
6. Additionally, press **Ctrl + Shift + D** (macOS: **Command + Shift + D**) or click the 'Save or Overwrite' button to save it to your selected folder.

## Change the shortcut

Open `chrome://extensions/shortcuts` (adjust the browser prefix for Edge or Brave), find **Copy Page HTML**, and assign your preferred shortcut.

## Notes and limitations

- Copies the current **live DOM HTML**.
- Clicking the 'Save HTML As' button will always launch a new page that will prompt you to select your desired file location.
- The 'Overwrite HTML File' will overwrite the previously saved HTML file.
- If the 'Save HTML As' button has not been pressed, the 'Overwrite HTML File' will launch the same page as 'Save HTML As'.
- Does **not** include the contents of external JavaScript or CSS files, iframe documents, shadow roots, or the original HTTP response source.
- Browser internal pages, the Chrome Web Store, and certain protected tabs do not allow script injection. The extension displays an **ERR** badge if the operation fails.
- The HTML is copied locally to your clipboard; the extension does not upload it.
