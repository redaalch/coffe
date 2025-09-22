import API from "./API.js";

const Store = {
  menu: null,
  cart: [],
  isOffline: !navigator.onLine,

  // Load cart from localStorage and IndexedDB
  async loadCart() {
    // Try localStorage first for quick loading
    const savedCart = localStorage.getItem("coffee_cart");
    const localCart = savedCart ? JSON.parse(savedCart) : [];

    // Try to load from IndexedDB if available and different
    try {
      if (window.app && window.app.offline) {
        const offlineCart = await window.app.offline.loadCart();

        // Use offline cart if it's more recent or localStorage is empty
        if (offlineCart.length > 0 && localCart.length === 0) {
          this.saveCart(offlineCart);
          return offlineCart;
        }
      }
    } catch (error) {
      console.log("Store: IndexedDB cart loading failed, using localStorage");
    }

    return localCart;
  },

  // Save cart to both localStorage and IndexedDB
  async saveCart(cart) {
    // Save to localStorage for quick access
    localStorage.setItem("coffee_cart", JSON.stringify(cart));

    // Save to IndexedDB for offline persistence
    try {
      if (window.app && window.app.offline) {
        await window.app.offline.saveCart(cart);
      }
    } catch (error) {
      console.log("Store: IndexedDB cart saving failed");
    }
  },

  // Add item to cart with offline support
  async addToCart(product, quantity = 1) {
    const existingItem = this.cart.find(
      (item) => item.product.id === product.id
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.cart.push({ product, quantity });
    }

    // Save and trigger updates
    await this.saveCart(this.cart);
    window.dispatchEvent(new Event("appcartchange"));

    // Add to sync queue if offline
    if (!navigator.onLine && window.app && window.app.offline) {
      await window.app.offline.addToSyncQueue("cart_update", {
        cart: this.cart,
      });
    }
  },

  // Remove item from cart
  async removeFromCart(productId) {
    this.cart = this.cart.filter((item) => item.product.id !== productId);
    await this.saveCart(this.cart);
    window.dispatchEvent(new Event("appcartchange"));
  },

  // Update item quantity
  async updateCartQuantity(productId, quantity) {
    const item = this.cart.find((item) => item.product.id === productId);
    if (item) {
      if (quantity <= 0) {
        await this.removeFromCart(productId);
      } else {
        item.quantity = quantity;
        await this.saveCart(this.cart);
        window.dispatchEvent(new Event("appcartchange"));
      }
    }
  },

  // Clear cart
  async clearCart() {
    this.cart = [];
    await this.saveCart(this.cart);

    // Clear from IndexedDB too
    try {
      if (window.app && window.app.offline) {
        await window.app.offline.clearCart();
      }
    } catch (error) {
      console.log("Store: IndexedDB cart clearing failed");
    }

    window.dispatchEvent(new Event("appcartchange"));
  },

  // Get cart total
  getCartTotal() {
    return this.cart.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);
  },

  // Get cart item count
  getCartItemCount() {
    return this.cart.reduce((count, item) => count + item.quantity, 0);
  },

  // Initialize store with offline support
  async init() {
    // Load cart
    this.cart = await this.loadCart();

    // Set up online/offline listeners
    window.addEventListener("online", () => {
      this.isOffline = false;
      this.syncOfflineData();
    });

    window.addEventListener("offline", () => {
      this.isOffline = true;
    });
  },

  // Sync offline data when coming back online
  async syncOfflineData() {
    try {
      if (window.app && window.app.offline) {
        const syncQueue = await window.app.offline.getSyncQueue();

        for (const item of syncQueue) {
          try {
            // Process sync queue items
            await this.processSyncItem(item);
            await window.app.offline.removeFromSyncQueue(item.id);
          } catch (error) {
            console.error("Store: Sync item failed:", error);
            await window.app.offline.incrementRetryCount(item.id);
          }
        }
      }
    } catch (error) {
      console.error("Store: Offline data sync failed:", error);
    }
  },

  // Process individual sync queue items
  async processSyncItem(item) {
    switch (item.action) {
      case "cart_update":
        // Cart updates are already handled locally
        break;
      case "order_submit":
        // Resubmit offline orders
        await this.submitOrder(item.data.order, true);
        break;
      default:
        console.log("Store: Unknown sync action:", item.action);
    }
  },

  // Submit order with offline support
  async submitOrder(orderData, isRetry = false) {
    try {
      if (navigator.onLine) {
        // Online: submit immediately
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });

        if (response.ok) {
          return await response.json();
        } else {
          throw new Error("Order submission failed");
        }
      } else {
        // Offline: save for later sync
        if (!isRetry && window.app && window.app.offline) {
          const offlineOrder = await window.app.offline.saveOfflineOrder(
            orderData
          );
          await window.app.offline.addToSyncQueue("order_submit", {
            order: orderData,
          });
          return offlineOrder;
        }
      }
    } catch (error) {
      // Save offline if submission fails
      if (!isRetry && window.app && window.app.offline) {
        const offlineOrder = await window.app.offline.saveOfflineOrder(
          orderData
        );
        await window.app.offline.addToSyncQueue("order_submit", {
          order: orderData,
        });
        return offlineOrder;
      }
      throw error;
    }
  },
};

// Initialize store
Store.init();

const proxiedStore = new Proxy(Store, {
  set(target, property, value) {
    target[property] = value;
    if (property == "menu") {
      window.dispatchEvent(new Event("appmenuchange"));

      // Cache menu data offline
      if (window.app && window.app.offline && value) {
        window.app.offline.cacheMenuData(value).catch((error) => {
          console.log("Store: Menu caching failed:", error);
        });
      }
    }
    if (property == "cart") {
      // Handle cart updates through the async methods
      // to ensure proper offline storage
    }
    return true;
  },
});

export default proxiedStore;
