const checkbox = document.getElementById('captureDoctype');
const copyButton = document.getElementById('copyButton');
const status = document.getElementById('status');
const saveButton = document.getElementById('saveButton');
const overwriteButton = document.getElementById('overwriteButton');
const selectedFile = document.getElementById('selectedFile');

// Restore the saved checkbox preference.
chrome.storage.local.get({ captureDoctype: true })
  .then(({ captureDoctype }) => {
    checkbox.checked = captureDoctype;
  });

// Save changes to the checkbox.
checkbox.addEventListener('change', async () => {
  await chrome.storage.local.set({
    captureDoctype: checkbox.checked
  });
});

// Identify the current webpage.
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (!tab?.id) {
    throw new Error('No active tab found.');
  }

  return tab;
}

// Display status messages.
function showStatus(message, success) {
  status.textContent = message;
  status.className = success ? 'success' : 'error';
}

// Get HTML using the background script.
async function getHTML(tabId) {
  await chrome.storage.local.set({
    captureDoctype: checkbox.checked
  });

  const response = await chrome.runtime.sendMessage({
    type: 'GET_HTML',
    tabId
  });

  if (response?.error) {
    throw new Error(response.error);
  }

  if (typeof response?.html !== 'string') {
    throw new Error('HTML could not be captured.');
  }

  return response.html;
}

// Copy HTML when the button is clicked.
copyButton.addEventListener('click', async () => {
  copyButton.disabled = true;

  try {
    const tab = await getActiveTab();
    const html = await getHTML(tab.id);

    await navigator.clipboard.writeText(html);

    showStatus(
      `Copied ${html.length.toLocaleString()} characters!`,
      true
    );

  } catch (error) {
    showStatus('Copy failed: ' + error.message, false);
  } finally {
    copyButton.disabled = false;
  }
});

// Save As button.
// Opens a dedicated extension page for selecting a file.
saveButton.addEventListener('click', async () => {
  try {
    await chrome.storage.local.set({
      captureDoctype: checkbox.checked
    });

    const tab = await getActiveTab();

    const url = new URL(
      chrome.runtime.getURL('file-manager.html')
    );

    url.searchParams.set('tabId', String(tab.id));
    url.searchParams.set('mode', 'save');

    await chrome.tabs.create({ url: url.href });

  } catch (error) {
    showStatus('Save failed: ' + error.message, false);
  }
});

// Overwrite button.
// Asks background.js to overwrite the remembered file.
overwriteButton.addEventListener('click', async () => {
  overwriteButton.disabled = true;

  try {
    await chrome.storage.local.set({
      captureDoctype: checkbox.checked
    });

    const tab = await getActiveTab();

    const result = await chrome.runtime.sendMessage({
      type: 'OVERWRITE_HTML',
      tabId: tab.id
    });

    if (result.status === 'saved') {
      showStatus(
        `Overwritten: ${result.filename}`,
        true
      );
    } else if (
      result.status === 'permission-needed' ||
      result.status === 'setup-needed'
    ) {
      showStatus(
        'Continue in the opened file manager tab.',
        true
      );
    } else {
      throw new Error(result.error || 'Overwrite failed.');
    }

  } catch (error) {
    showStatus('Overwrite failed: ' + error.message, false);
  } finally {
    overwriteButton.disabled = false;
  }
});
