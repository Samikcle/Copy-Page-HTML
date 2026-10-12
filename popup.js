const checkbox = document.getElementById('captureDoctype');
const copyButton = document.getElementById('copyButton');
const status = document.getElementById('status');

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

// Copy HTML when the button is clicked.
copyButton.addEventListener('click', async () => {
  copyButton.disabled = true;
  status.textContent = '';
  status.className = '';

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!tab?.id) {
      throw new Error('No active tab found.');
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (captureDoctype) => {
        const prefix = captureDoctype && document.doctype
          ? new XMLSerializer()
              .serializeToString(document.doctype) + '\n'
          : '';

        return prefix + document.documentElement.outerHTML;
      },
      args: [checkbox.checked]
    });

    const html = results[0]?.result;

    if (typeof html !== 'string') {
      throw new Error('HTML could not be captured.');
    }

    await navigator.clipboard.writeText(html);

    status.textContent =
      `Copied ${html.length.toLocaleString()} characters!`;
    status.className = 'success';

  } catch (error) {
    status.textContent =
      'Copy failed. Try a normal website tab.';
    status.className = 'error';

    console.error('Copy HTML failed:', error);

  } finally {
    copyButton.disabled = false;
  }
});
