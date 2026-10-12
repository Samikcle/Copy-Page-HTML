// Shared handler
async function handleCopyHTML(tabId, returnHtml = false) {
  const { captureDoctype = true } =
    await chrome.storage.local.get('captureDoctype');

  const results = await chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: copyCurrentPageHTML,
    args: [captureDoctype, returnHtml]
  });

  return results[0]?.result;
}

// Keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'copy-page-html') return;

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (!tab?.id) return;

  try {
    const copied = await handleCopyHTML(tab.id);
    await chrome.action.setBadgeText({ tabId: tab.id, text: copied ? 'OK' : 'ERR' });
    await chrome.action.setBadgeBackgroundColor({
      tabId: tab.id,
      color: copied ? '#16803C' : '#C62828'
    });
    if (!copied) console.warn('Failed to copy HTML from this tab.');
  } catch (error) {
    console.error('Cannot access this page:', error);
    await chrome.action.setBadgeText({ tabId: tab.id, text: 'ERR' });
    await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#C62828' });
  }
});

// Receive requests from popup.js 
chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    if (message.type !== 'GET_HTML') return;

    handleCopyHTML(message.tabId, true)
      .then((html) => {
        sendResponse({ html: html });
      })
      .catch((error) => {
        console.error('Cannot retrieve HTML:', error);
        sendResponse({ error: error.message });
      });

    // Keep the message channel open for the async result.
    return true;
  }
);

// HTML copying function
function copyCurrentPageHTML(captureDoctype, returnHtml = false) {
  // Capture the html, including changes made after page load.
  let html = document.documentElement.outerHTML;

  if (captureDoctype && document.doctype) {
    const doctype = new XMLSerializer().serializeToString(document.doctype);
    html = doctype + '\n' + html;
  }

  // Return HTML if requested by the popup.
  if (returnHtml) {
    return html;
  }

  // The clipboardWrite extension permission permits this fallback on pages
  // where navigator.clipboard.writeText needs a user activation.
  const textarea = document.createElement('textarea');
  textarea.value = html;
  textarea.setAttribute('readonly', '');
  textarea.style.cssText = 'position:fixed;left:-99999px;top:0;opacity:0;';

  const previousFocus = document.activeElement;
  const selection = window.getSelection();
  const oldRanges = [];
  if (selection) {
    for (let i = 0; i < selection.rangeCount; i++) {
      oldRanges.push(selection.getRangeAt(i).cloneRange());
    }
  }

  (document.body || document.documentElement).appendChild(textarea);
  textarea.focus();
  textarea.select();
  let success = false;
  try {
    success = document.execCommand('copy');
  } finally {
    textarea.remove();
    if (selection) {
      selection.removeAllRanges();
      for (const range of oldRanges) selection.addRange(range);
    }
    if (previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus({ preventScroll: true });
    }
  }
  return success;
}
