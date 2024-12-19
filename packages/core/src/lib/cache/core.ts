// Storage interfaces
interface StorageAdapter<T> {
  set(key: string, value: T, ttl?: number): Promise<void>;
  get(key: string): Promise<T | null>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Memory storage with size limits
class MemoryStorage<T> implements StorageAdapter<T> {
  private store: Map<string, { value: T; expires: number }>;
  private maxSize: number;
  private currentSize: number;

  constructor(maxSizeInBytes: number = 100 * 1024 * 1024) {
    // Default 100MB
    this.store = new Map();
    this.maxSize = maxSizeInBytes;
    this.currentSize = 0;
  }

  private getItemSize(value: T): number {
    return new TextEncoder().encode(JSON.stringify(value)).length;
  }

  async set(key: string, value: T, ttl: number = 0): Promise<void> {
    const size = this.getItemSize(value);

    if (size > this.maxSize) {
      throw new Error('Item too large for cache');
    }

    // Clear space if needed
    while (this.currentSize + size > this.maxSize) {
      const oldestKey = this.getOldestKey();
      if (!oldestKey) break;
      await this.delete(oldestKey);
    }

    const expires = ttl ? Date.now() + ttl : 0;
    this.store.set(key, { value, expires });
    this.currentSize += size;
  }

  async get(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;

    if (item.expires && item.expires < Date.now()) {
      await this.delete(key);
      return null;
    }

    return item.value;
  }

  async delete(key: string): Promise<void> {
    const item = this.store.get(key);
    if (item) {
      this.currentSize -= this.getItemSize(item.value);
      this.store.delete(key);
    }
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.currentSize = 0;
  }

  private getOldestKey(): string | undefined {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;

    for (const [key, item] of this.store.entries()) {
      if (!oldestKey || item.expires < oldestTime) {
        oldestKey = key;
        oldestTime = item.expires;
      }
    }

    return oldestKey;
  }
}

// LocalStorage adapter for browsers
class LocalStorageAdapter<T> implements StorageAdapter<T> {
  private prefix: string;

  constructor(prefix: string = 'cache:') {
    this.prefix = prefix;
  }

  async set(key: string, value: T, ttl: number = 0): Promise<void> {
    const item = {
      value,
      expires: ttl ? Date.now() + ttl : 0,
    };
    localStorage.setItem(this.prefix + key, JSON.stringify(item));
  }

  async get(key: string): Promise<T | null> {
    const data = localStorage.getItem(this.prefix + key);
    if (!data) return null;

    const item = JSON.parse(data);
    if (item.expires && item.expires < Date.now()) {
      await this.delete(key);
      return null;
    }

    return item.value;
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(this.prefix + key);
  }

  async clear(): Promise<void> {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    }
  }
}

// Cache Manager
class CacheManager<T> {
  private storage: StorageAdapter<T>;
  private prefix: string;

  constructor(storage: StorageAdapter<T>, prefix: string = '') {
    this.storage = storage;
    this.prefix = prefix;
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    await this.storage.set(this.prefix + key, value, ttl);
  }

  async get(key: string): Promise<T | null> {
    return await this.storage.get(this.prefix + key);
  }

  async delete(key: string): Promise<void> {
    await this.storage.delete(this.prefix + key);
  }

  async clear(): Promise<void> {
    await this.storage.clear();
  }
}

// Usage example
export const createCacheManager = <T>(maxSizeInBytes?: number) => {
  const storage =
    // @ts-expect-error this is only works in browser
    typeof window !== 'undefined'
      ? new LocalStorageAdapter<T>()
      : new MemoryStorage<T>(maxSizeInBytes);

  return new CacheManager<T>(storage);
};

// Example usage
// const cache = createCacheManager<any>(50 * 1024 * 1024); // 50MB max
// await cache.set('key', { large: 'data' }, 3600000); // 1 hour TTL
