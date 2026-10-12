chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: copyCurrentPageHTML
    });

    const copied = results[0]?.result === true;
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

function copyCurrentPageHTML() {
  // Capture the html, including changes made after page load.
  const captureDoctype = false; // set to true if you want to include the doctype in the copied HTML
  let html;
  if(captureDoctype) {
    const doctype = document.doctype
      ? new XMLSerializer().serializeToString(document.doctype) + '\n'
      : '';
    html = doctype + document.documentElement.outerHTML;
  } else {
    html = document.documentElement.outerHTML;
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
