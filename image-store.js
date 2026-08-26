(function () {
    "use strict";

    const DB_NAME = "article-summary-image-store";
    const DB_VERSION = 1;
    const STORE_NAME = "cardImages";

    let dbPromise = null;

    function isAvailable() {
        return typeof window.indexedDB !== "undefined";
    }

    function openDatabase() {
        if (!isAvailable()) {
            return Promise.reject(new Error("当前浏览器不支持 IndexedDB。"));
        }

        if (dbPromise) return dbPromise;

        dbPromise = new Promise((resolve, reject) => {
            const request = window.indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: "id" });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error("IndexedDB 打开失败。"));
            request.onblocked = () => reject(new Error("IndexedDB 被旧页面占用，请关闭其他页面后重试。"));
        }).catch((error) => {
            dbPromise = null;
            throw error;
        });

        return dbPromise;
    }

    async function withStore(mode, callback) {
        const db = await openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, mode);
            const store = transaction.objectStore(STORE_NAME);
            let settled = false;

            transaction.oncomplete = () => {
                if (!settled) resolve();
            };
            transaction.onerror = () => reject(transaction.error || new Error("IndexedDB 操作失败。"));
            transaction.onabort = () => reject(transaction.error || new Error("IndexedDB 操作已取消。"));

            try {
                callback(store, (value) => {
                    settled = true;
                    resolve(value);
                }, reject);
            } catch (error) {
                transaction.abort();
                reject(error);
            }
        });
    }

    function requestToPromise(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error("IndexedDB 请求失败。"));
        });
    }

    async function putImage(record) {
        if (!record || typeof record.id !== "string" || !record.id || typeof record.dataUrl !== "string" || !record.dataUrl) {
            throw new Error("图片存储记录无效。");
        }

        await withStore("readwrite", (store) => {
            store.put({
                ...record,
                updatedAt: Date.now()
            });
        });
    }

    async function getImage(id) {
        if (typeof id !== "string" || !id) return null;

        return withStore("readonly", async (store, resolve, reject) => {
            try {
                resolve(await requestToPromise(store.get(id)));
            } catch (error) {
                reject(error);
            }
        });
    }

    async function deleteImages(ids) {
        const normalizedIds = Array.from(new Set((ids || []).filter((id) => typeof id === "string" && id)));
        if (!normalizedIds.length) return;

        await withStore("readwrite", (store) => {
            normalizedIds.forEach((id) => store.delete(id));
        });
    }

    window.ArticleImageStore = {
        isAvailable,
        putImage,
        getImage,
        deleteImages
    };
})();
