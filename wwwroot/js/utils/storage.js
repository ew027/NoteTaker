// File: js/utils/storage.js
export class StorageManager {
    static save(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }
    }

    static load(key, defaultValue) {
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : defaultValue;
        } catch (e) {
            console.warn('Failed to load from localStorage:', e);
            return defaultValue;
        }
    }
}