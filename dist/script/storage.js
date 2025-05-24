const storage = {
    dbName: 'LGAnalysisHistory',
    storeName: 'default',
    openDB: (storeName, dbName = storage.dbName) => {
        return new Promise((resolve, reject) => {
            let request;
            if ((typeof warList !== 'undefined')) {
                request = indexedDB.open(dbName, warList.length);
            } else {
                request = indexedDB.open(dbName);
            }
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
    setItem: async (storeName, key, value, dbName = storage.dbName) => {
        const db = await storage.openDB(storeName, dbName);
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        store.put(value, key);
    },
    getAll: async(storeName, dbName = storage.dbName) => {
        const db = await storage.openDB(storeName, dbName);
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    getItem: async(storeName, key, dbName = storage.dbName) => {
        try {
            const db = await storage.openDB(storeName, dbName);
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            return new Promise((resolve, reject) => {
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            return null
        }
    },
    deleteItem: async (storeName, key, dbName = storage.dbName) => {
        const db = await storage.openDB(storeName, dbName);
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        store.delete(key);
    }
    }
