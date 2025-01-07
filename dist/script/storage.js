const storage = {
    dbName: 'LGAnalysisHistory',
    storeName: 'default',
    openDB: (storeName) => {
        return new Promise((resolve, reject) => {
        const request = indexedDB.open(storage.dbName, warList.length);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.versionchange = () => console.log;
        });
    },
    setItem: async (storeName, key, value) => {
        const db = await storage.openDB(storeName);
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        store.put(value, key);
    },
    getAll: async(storeName) => {
        const db = await storage.openDB(storeName);
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        });
    },
    getItem: async(storeName, key) => {
        const db = await storage.openDB(storeName);
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        });
    },
    deleteItem: async (storeName, key) => {
        const db = await storage.openDB(storeName);
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        store.delete(key);
    }
    }
