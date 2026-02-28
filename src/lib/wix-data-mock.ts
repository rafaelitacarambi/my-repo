/**
 * Mock implementation of @wix/data using IndexedDB (replacing LocalStorage)
 * This allows storing larger datasets (like images/imports) locally.
 */

interface WixDataItem {
    _id: string;
    [key: string]: any;
}

const DB_NAME = 'WixDataMockDB';
const STORE_NAME = 'collections';

// IndexedDB Helper
function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new Error('IndexedDB not supported environment'));
            return;
        }
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getCollectionAsync(collectionId: string): Promise<WixDataItem[]> {
    if (typeof window === 'undefined') return [];
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(collectionId);
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.warn('IDB Read Error', e);
        return [];
    }
}

async function saveCollectionAsync(collectionId: string, items: WixDataItem[]) {
    if (typeof window === 'undefined') return;
    try {
        const db = await openDB();
        return new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.put(items, collectionId);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.error('IDB Write Error', e);
        throw e;
    }
}


class WixDataQuery {
    private collectionId: string;
    private filters: any[] = [];
    private sortOrder: any[] = [];
    private limitVal: number = 50;
    private skipVal: number = 0;
    private includes: string[] = [];

    constructor(collectionId: string) {
        this.collectionId = collectionId;
    }

    eq(field: string, value: any) {
        this.filters.push((item: any) => item[field] === value);
        return this;
    }

    ne(field: string, value: any) {
        this.filters.push((item: any) => item[field] !== value);
        return this;
    }

    gt(field: string, value: any) {
        this.filters.push((item: any) => item[field] > value);
        return this;
    }

    ge(field: string, value: any) {
        this.filters.push((item: any) => item[field] >= value);
        return this;
    }

    lt(field: string, value: any) {
        this.filters.push((item: any) => item[field] < value);
        return this;
    }

    le(field: string, value: any) {
        this.filters.push((item: any) => item[field] <= value);
        return this;
    }

    contains(field: string, value: any) {
        this.filters.push((item: any) => String(item[field]).includes(value));
        return this;
    }

    ascending(field: string) {
        this.sortOrder.push({ field, dir: 'asc' });
        return this;
    }

    descending(field: string) {
        this.sortOrder.push({ field, dir: 'desc' });
        return this;
    }

    limit(limit: number) {
        this.limitVal = limit;
        return this;
    }

    skip(skip: number) {
        this.skipVal = skip;
        return this;
    }

    include(...fields: string[]) {
        this.includes.push(...fields);
        return this;
    }

    async find(options?: any) {
        let items = await getCollectionAsync(this.collectionId);

        // Apply filters
        for (const filter of this.filters) {
            items = items.filter(filter);
        }

        // Apply sorting
        for (const sort of this.sortOrder) {
            items.sort((a, b) => {
                if (a[sort.field] < b[sort.field]) return sort.dir === 'asc' ? -1 : 1;
                if (a[sort.field] > b[sort.field]) return sort.dir === 'asc' ? 1 : -1;
                return 0;
            });
        }

        const totalCount = items.length;

        // Apply pagination
        items = items.slice(this.skipVal, this.skipVal + this.limitVal);

        return {
            items,
            totalCount,
            hasNext: () => this.skipVal + this.limitVal < totalCount,
            hasPrev: () => this.skipVal > 0,
            length: items.length,
            currentPage: Math.floor(this.skipVal / this.limitVal),
            totalPages: Math.ceil(totalCount / this.limitVal)
        };
    }

    async count() {
        let items = await getCollectionAsync(this.collectionId);
        for (const filter of this.filters) {
            items = items.filter(filter);
        }
        return items.length;
    }
}

export const items = {
    query(collectionId: string) {
        return new WixDataQuery(collectionId);
    },

    async get(collectionId: string, itemId: string) {
        const items = await getCollectionAsync(collectionId);
        return items.find(i => i._id === itemId) || null;
    },

    async insert(collectionId: string, item: any) {
        const items = await getCollectionAsync(collectionId);
        if (!item._id) item._id = crypto.randomUUID();
        // Check if ID exists
        if (items.find(i => i._id === item._id)) {
            throw new Error(`Item with ID ${item._id} already exists in ${collectionId}`);
        }
        items.push(item);
        await saveCollectionAsync(collectionId, items);
        return item;
    },

    async bulkInsert(collectionId: string, newItems: any[]) {
        const items = await getCollectionAsync(collectionId);
        let added = 0;
        for (const item of newItems) {
            if (!item._id) item._id = crypto.randomUUID();
            if (!items.find(i => i._id === item._id)) {
                items.push(item);
                added++;
            }
        }
        await saveCollectionAsync(collectionId, items);
        return added;
    },

    async update(collectionId: string, item: any) {
        const items = await getCollectionAsync(collectionId);
        const index = items.findIndex(i => i._id === item._id);
        if (index === -1) throw new Error(`Item [${item._id}] not found in [${collectionId}]`);

        items[index] = { ...items[index], ...item };
        await saveCollectionAsync(collectionId, items);
        return items[index];
    },

    async remove(collectionId: string, itemId: string) {
        let items = await getCollectionAsync(collectionId);
        const item = items.find(i => i._id === itemId);
        if (!item) throw new Error(`Item [${itemId}] not found in [${collectionId}]`);

        items = items.filter(i => i._id !== itemId);
        await saveCollectionAsync(collectionId, items);
        return item;
    },

    async save(collectionId: string, item: any) {
        // Upsert
        const items = await getCollectionAsync(collectionId);
        const index = items.findIndex(i => i._id === item._id);
        if (index > -1) {
            items[index] = { ...items[index], ...item };
        } else {
            if (!item._id) item._id = crypto.randomUUID();
            items.push(item);
        }
        await saveCollectionAsync(collectionId, items);
        return item;
    },

    async queryReferenced(collectionId: string, itemId: string, propertyName: string, options?: any) {
        return {
            items: [],
            totalCount: 0,
            hasNext: () => false
        };
    },

    async insertReference(collectionId: string, propertyName: string, referringItem: string | any, referencedItem: string | any | string[] | any[]) {
        return;
    },

    async removeReference(collectionId: string, propertyName: string, referringItem: string | any, referencedItem: string | any | string[] | any[]) {
        return;
    }
};

export default { items };
