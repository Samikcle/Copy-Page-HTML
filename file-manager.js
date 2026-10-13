const saveButton = document.getElementById('saveButton');
const overwriteButton = document.getElementById('overwriteButton');
const selectedFile = document.getElementById('selectedFile');
const status = document.getElementById('status');

const params = new URLSearchParams(window.location.search);

const sourceTabId = Number(params.get('tabId'));
const mode = params.get('mode');

let currentFileHandle = null;

// 1. Display messages.
function showStatus(message, success) {
  status.textContent = message;
  status.className = success ? 'success' : 'error';
}

// 2. Restore the remembered file.
async function restoreFile() {
  try {
    currentFileHandle = await FileStore.getHandle();

    if (currentFileHandle) {
      selectedFile.textContent =
        'Selected file: ' + currentFileHandle.name;

      overwriteButton.disabled = false;
    }

    if (mode === 'overwrite') {
      showStatus(
        'Click Overwrite Selected File to grant permission and save.',
        true
      );
    }

  } catch (error) {
    showStatus('Could not load saved file: ' + error.message, false);
  }
}

restoreFile();

// 3. Capture the HTML from the original webpage.
async function getHTML() {
  if (!Number.isInteger(sourceTabId) || sourceTabId <= 0) {
    throw new Error('Invalid source tab ID.');
  }

  const response = await chrome.runtime.sendMessage({
    type: 'GET_HTML',
    tabId: sourceTabId
  });

  if (response?.error) {
    throw new Error(response.error);
  }

  if (typeof response?.html !== 'string') {
    throw new Error('HTML could not be captured.');
  }

  return response.html;
}

// 4. Save HTML As.
saveButton.addEventListener('click', async () => {
  saveButton.disabled = true;

  try {
    // This must run directly after the user click.
    const fileHandle = await window.showSaveFilePicker({
      suggestedName: 'page.html',
      types: [{
        description: 'HTML Files',
        accept: {
          'text/html': ['.html']
        }
      }]
    });

    const html = await getHTML();

    await FileStore.writeHTML(fileHandle, html);

    // Remember only after successfully writing.
    await FileStore.saveHandle(fileHandle);

    currentFileHandle = fileHandle;

    selectedFile.textContent =
      'Selected file: ' + fileHandle.name;

    overwriteButton.disabled = false;

    showStatus('HTML saved successfully!', true);

  } catch (error) {
    if (error.name !== 'AbortError') {
      showStatus('Save failed: ' + error.message, false);
    }
  } finally {
    saveButton.disabled = false;
  }
});

// 5. Overwrite the remembered file.
overwriteButton.addEventListener('click', async () => {
  if (!currentFileHandle) return;

  overwriteButton.disabled = true;

  try {
    const options = { mode: 'readwrite' };

    let permission =
      await currentFileHandle.queryPermission(options);

    if (permission !== 'granted') {
      permission =
        await currentFileHandle.requestPermission(options);
    }

    if (permission !== 'granted') {
      throw new Error('Write permission was not granted.');
    }

    const html = await getHTML();

    await FileStore.writeHTML(currentFileHandle, html);

    showStatus(
      'HTML file overwritten successfully!',
      true
    );

  } catch (error) {
    showStatus('Overwrite failed: ' + error.message, false);
  } finally {
    overwriteButton.disabled = false;
  }
});
