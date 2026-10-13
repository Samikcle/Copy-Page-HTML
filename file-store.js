const FileStore = {
  async openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('HTMLFileStorage', 1);

      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('settings')) {
          request.result.createObjectStore('settings');
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getHandle() {
    const db = await this.openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('settings', 'readonly');
      const request = transaction.objectStore('settings')
        .get('selectedFile');

      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);

      transaction.oncomplete = () => db.close();
      transaction.onerror = () => db.close();
    });
  },

  async saveHandle(fileHandle) {
    const db = await this.openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('settings', 'readwrite');

      transaction.objectStore('settings').put(
        fileHandle,
        'selectedFile'
      );

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };

      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  },

  async writeHTML(fileHandle, html) {
    const writable = await fileHandle.createWritable();

    try {
      await writable.write(html);
      await writable.close();
    } catch (error) {
      await writable.abort().catch(() => {});
      throw error;
    }
  }
};
