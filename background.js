importScripts('file-store.js');

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

// Show shortcut operation results.
async function setBadge(tabId, text, color) {
  await chrome.action.setBadgeText({ tabId, text });

  await chrome.action.setBadgeBackgroundColor({
    tabId,
    color
  });
}

// Open file manager for file selection or permission.
async function openFileManager(tabId, mode = 'save') {
  const url = new URL(chrome.runtime.getURL('file-manager.html'));

  url.searchParams.set('tabId', String(tabId));
  url.searchParams.set('mode', mode);

  await chrome.tabs.create({ url: url.href });
}

// Overwrite a previously selected file.
async function overwriteHTML(tabId) {
  const fileHandle = await FileStore.getHandle();

  if (!fileHandle) {
    return { status: 'no-file' };
  }

  const permission = await fileHandle.queryPermission({
    mode: 'readwrite'
  });

  if (permission !== 'granted') {
    return { status: 'permission-needed' };
  }

  const html = await handleCopyHTML(tabId, true);

  if (typeof html !== 'string') {
    throw new Error('Unable to capture HTML.');
  }

  await FileStore.writeHTML(fileHandle, html);

  return {
    status: 'saved',
    filename: fileHandle.name
  };
}

// Process overwrite requests from either trigger.
async function processOverwrite(tabId) {
  try {
    const result = await overwriteHTML(tabId);

    if (result.status === 'no-file') {
      await openFileManager(tabId, 'save');
      return { status: 'setup-needed' };
    }

    if (result.status === 'permission-needed') {
      await openFileManager(tabId, 'overwrite');
      return { status: 'permission-needed' };
    }

    await setBadge(tabId, 'OK', '#16803C');
    return result;

  } catch (error) {
    await setBadge(tabId, 'ERR', '#C62828');
    console.error('Overwrite failed:', error);

    return {
      status: 'error',
      error: error.message
    };
  }
}

// Keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (
    command !== 'copy-page-html' &&
    command !== 'overwrite-html'
  ) {
    return;
  }

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (!tab?.id) return;

  if (command === 'overwrite-html') {
    await processOverwrite(tab.id);
    return;
  }

  try {
    const copied = await handleCopyHTML(tab.id);
    await setBadge(
      tab.id,
      copied ? 'OK' : 'ERR',
      copied ? '#16803C' : '#C62828'
    );
    if (!copied) console.warn('Failed to copy HTML from this tab.');
  } catch (error) {
    console.error('Cannot access this page:', error);
    await setBadge(tab.id, 'ERR', '#C62828');
  }
});

// Receive requests from popup.js 
chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    if (message.type === 'GET_HTML') {
      handleCopyHTML(message.tabId, true)
        .then(html => sendResponse({ html: html }))
        .catch(error => {
          console.error('Cannot retrieve HTML:', error);
          sendResponse({ error: error.message });
        });

      return true;
    }

    if (message.type === 'OVERWRITE_HTML') {
      processOverwrite(message.tabId)
        .then(sendResponse)
        .catch(error =>
          sendResponse({
            status: 'error',
            error: error.message
          })
        );

      return true;
    }
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
