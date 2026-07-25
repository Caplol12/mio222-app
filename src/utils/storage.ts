export const setItem = async (key: string, value: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AppStorageDB', 1);
    request.onupgradeneeded = (e: any) => {
      e.target.result.createObjectStore('store');
    };
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      const transaction = db.transaction('store', 'readwrite');
      const store = transaction.objectStore('store');
      store.put(value, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
    request.onerror = () => reject(request.error);
  });
};

export const getItem = async (key: string): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AppStorageDB', 1);
    request.onupgradeneeded = (e: any) => {
      e.target.result.createObjectStore('store');
    };
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      const transaction = db.transaction('store', 'readonly');
      const store = transaction.objectStore('store');
      const getReq = store.get(key);
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => reject(getReq.error);
    };
    request.onerror = () => reject(request.error);
  });
};
