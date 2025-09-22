// Offline Storage Manager - Handles IndexedDB for offline data storage
class OfflineStorageManager {
  constructor() {
    this.dbName = "CoffeeMastersDB";
    this.dbVersion = 1;
    this.db = null;
    this.init();
  }

  async init() {
    try {
      this.db = await this.openDatabase();
      console.log("OfflineStorage: Database initialized successfully");
    } catch (error) {
      console.error("OfflineStorage: Database initialization failed:", error);
    }
  }

  openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Orders store
        if (!db.objectStoreNames.contains("orders")) {
          const ordersStore = db.createObjectStore("orders", {
            keyPath: "id",
            autoIncrement: true,
          });
          ordersStore.createIndex("status", "status", { unique: false });
          ordersStore.createIndex("timestamp", "timestamp", { unique: false });
          ordersStore.createIndex("userId", "userId", { unique: false });
        }

        // Menu cache store
        if (!db.objectStoreNames.contains("menu")) {
          const menuStore = db.createObjectStore("menu", {
            keyPath: "id",
          });
          menuStore.createIndex("category", "category", { unique: false });
          menuStore.createIndex("lastUpdated", "lastUpdated", {
            unique: false,
          });
        }

        // Cart store for offline cart persistence
        if (!db.objectStoreNames.contains("cart")) {
          const cartStore = db.createObjectStore("cart", {
            keyPath: "productId",
          });
        }

        // User preferences store
        if (!db.objectStoreNames.contains("preferences")) {
          const prefsStore = db.createObjectStore("preferences", {
            keyPath: "key",
          });
        }

        // Sync queue for offline actions
        if (!db.objectStoreNames.contains("syncQueue")) {
          const syncStore = db.createObjectStore("syncQueue", {
            keyPath: "id",
            autoIncrement: true,
          });
          syncStore.createIndex("action", "action", { unique: false });
          syncStore.createIndex("timestamp", "timestamp", { unique: false });
        }

        console.log("OfflineStorage: Database schema created");
      };
    });
  }

  // Generic database operations
  async performTransaction(storeName, mode, operation) {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], mode);
      const store = transaction.objectStore(storeName);

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();

      const request = operation(store);

      if (request) {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }
    });
  }

  // Orders Management
  async saveOfflineOrder(order) {
    const orderWithMetadata = {
      ...order,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "offline_pending",
      timestamp: new Date().toISOString(),
      isOffline: true,
    };

    await this.performTransaction("orders", "readwrite", (store) => {
      return store.add(orderWithMetadata);
    });

    console.log("OfflineStorage: Order saved offline:", orderWithMetadata.id);
    return orderWithMetadata;
  }

  async getOfflineOrders() {
    return await this.performTransaction("orders", "readonly", (store) => {
      return store.index("status").getAll("offline_pending");
    });
  }

  async removeOfflineOrder(orderId) {
    await this.performTransaction("orders", "readwrite", (store) => {
      return store.delete(orderId);
    });
    console.log("OfflineStorage: Offline order removed:", orderId);
  }

  async getAllOrders() {
    return await this.performTransaction("orders", "readonly", (store) => {
      return store.getAll();
    });
  }

  // Menu Caching
  async cacheMenuData(menuData) {
    const menuWithTimestamp = menuData.map((category) => ({
      ...category,
      id: category.name,
      lastUpdated: new Date().toISOString(),
    }));

    await this.performTransaction("menu", "readwrite", (store) => {
      // Clear existing menu data
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => {
        // Add new menu data
        menuWithTimestamp.forEach((category) => {
          store.add(category);
        });
      };
      return clearRequest;
    });

    console.log("OfflineStorage: Menu data cached");
  }

  async getCachedMenu() {
    const cachedMenu = await this.performTransaction(
      "menu",
      "readonly",
      (store) => {
        return store.getAll();
      }
    );

    // Remove metadata before returning
    return cachedMenu.map((category) => {
      const { lastUpdated, ...categoryData } = category;
      return categoryData;
    });
  }

  async isMenuCacheValid(maxAge = 3600000) {
    // 1 hour default
    try {
      const menuItems = await this.performTransaction(
        "menu",
        "readonly",
        (store) => {
          return store.getAll();
        }
      );

      if (menuItems.length === 0) return false;

      const oldestItem = menuItems.reduce((oldest, item) => {
        const itemTime = new Date(item.lastUpdated).getTime();
        const oldestTime = new Date(oldest.lastUpdated).getTime();
        return itemTime < oldestTime ? item : oldest;
      });

      const age = Date.now() - new Date(oldestItem.lastUpdated).getTime();
      return age < maxAge;
    } catch (error) {
      console.error(
        "OfflineStorage: Error checking menu cache validity:",
        error
      );
      return false;
    }
  }

  // Cart Persistence
  async saveCart(cartItems) {
    await this.performTransaction("cart", "readwrite", (store) => {
      // Clear existing cart
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => {
        // Add new cart items
        cartItems.forEach((item) => {
          store.add({
            productId: item.product.id,
            product: item.product,
            quantity: item.quantity,
          });
        });
      };
      return clearRequest;
    });

    console.log("OfflineStorage: Cart saved offline");
  }

  async loadCart() {
    try {
      const cartItems = await this.performTransaction(
        "cart",
        "readonly",
        (store) => {
          return store.getAll();
        }
      );

      return cartItems.map((item) => ({
        product: item.product,
        quantity: item.quantity,
      }));
    } catch (error) {
      console.error("OfflineStorage: Error loading cart:", error);
      return [];
    }
  }

  async clearCart() {
    await this.performTransaction("cart", "readwrite", (store) => {
      return store.clear();
    });
    console.log("OfflineStorage: Cart cleared");
  }

  // User Preferences
  async savePreference(key, value) {
    await this.performTransaction("preferences", "readwrite", (store) => {
      return store.put({
        key: key,
        value: value,
        timestamp: new Date().toISOString(),
      });
    });
  }

  async getPreference(key, defaultValue = null) {
    try {
      const result = await this.performTransaction(
        "preferences",
        "readonly",
        (store) => {
          return store.get(key);
        }
      );
      return result ? result.value : defaultValue;
    } catch (error) {
      console.error("OfflineStorage: Error getting preference:", error);
      return defaultValue;
    }
  }

  // Sync Queue Management
  async addToSyncQueue(action, data) {
    const queueItem = {
      action: action,
      data: data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    await this.performTransaction("syncQueue", "readwrite", (store) => {
      return store.add(queueItem);
    });

    console.log("OfflineStorage: Action added to sync queue:", action);
  }

  async getSyncQueue() {
    return await this.performTransaction("syncQueue", "readonly", (store) => {
      return store.getAll();
    });
  }

  async removeFromSyncQueue(id) {
    await this.performTransaction("syncQueue", "readwrite", (store) => {
      return store.delete(id);
    });
  }

  async incrementRetryCount(id) {
    const item = await this.performTransaction(
      "syncQueue",
      "readonly",
      (store) => {
        return store.get(id);
      }
    );

    if (item) {
      item.retryCount++;
      await this.performTransaction("syncQueue", "readwrite", (store) => {
        return store.put(item);
      });
    }
  }

  // Data Export/Import for backup
  async exportData() {
    const data = {
      orders: await this.getAllOrders(),
      cart: await this.loadCart(),
      preferences: await this.performTransaction(
        "preferences",
        "readonly",
        (store) => {
          return store.getAll();
        }
      ),
      exportDate: new Date().toISOString(),
    };

    return data;
  }

  async importData(data) {
    if (data.orders) {
      await this.performTransaction("orders", "readwrite", (store) => {
        data.orders.forEach((order) => {
          store.put(order);
        });
      });
    }

    if (data.cart) {
      await this.saveCart(data.cart);
    }

    if (data.preferences) {
      await this.performTransaction("preferences", "readwrite", (store) => {
        data.preferences.forEach((pref) => {
          store.put(pref);
        });
      });
    }

    console.log("OfflineStorage: Data imported successfully");
  }

  // Database maintenance
  async clearAllData() {
    const storeNames = ["orders", "menu", "cart", "preferences", "syncQueue"];

    for (const storeName of storeNames) {
      await this.performTransaction(storeName, "readwrite", (store) => {
        return store.clear();
      });
    }

    console.log("OfflineStorage: All data cleared");
  }

  async getStorageInfo() {
    const info = {
      ordersCount: 0,
      menuCached: false,
      cartItems: 0,
      preferencesCount: 0,
      syncQueueCount: 0,
    };

    try {
      info.ordersCount = (await this.getAllOrders()).length;
      info.menuCached = (await this.getCachedMenu()).length > 0;
      info.cartItems = (await this.loadCart()).length;
      info.preferencesCount = await this.performTransaction(
        "preferences",
        "readonly",
        (store) => {
          return store.count();
        }
      );
      info.syncQueueCount = (await this.getSyncQueue()).length;
    } catch (error) {
      console.error("OfflineStorage: Error getting storage info:", error);
    }

    return info;
  }
}

// Create and export storage manager instance
const OfflineStorage = new OfflineStorageManager();
export default OfflineStorage;
