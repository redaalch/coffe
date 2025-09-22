// Coffee Masters PWA Service Worker
// Version 2.0 - Enhanced with offline support, caching, and push notifications

const CACHE_NAME = "coffee-masters-v2.0";
const STATIC_CACHE = "coffee-masters-static-v2.0";
const DYNAMIC_CACHE = "coffee-masters-dynamic-v2.0";
const API_CACHE = "coffee-masters-api-v2.0";

// Assets to cache immediately
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/app.webmanifest",

  // Services
  "/services/Store.js",
  "/services/API.js",
  "/services/Auth.js",
  "/services/ThemeManager.js",
  "/services/Menu.js",
  "/services/Router.js",
  "/services/AdminData.js",

  // Components
  "/components/MenuPage.js",
  "/components/DetailsPage.js",
  "/components/OrderPage.js",
  "/components/AuthPage.js",
  "/components/ProfilePage.js",
  "/components/AdminPage.js",
  "/components/ProductItem.js",
  "/components/CartItem.js",
  "/components/MenuPage.css",
  "/components/DetailsPage.css",
  "/components/OrderPage.css",
  "/components/AdminPage.css",

  // Data
  "/data/menu.json",

  // Images - Core icons
  "/images/logo.svg",
  "/images/logo.png",
  "/images/icons/icon.png",
  "/images/icons/icon-maskable.png",

  // Product images
  "/data/images/blackamericano.png",
  "/data/images/cappuccino.png",
  "/data/images/flatwhite.png",
  "/data/images/macchiato.png",
  "/data/images/frappuccino.png",
  "/data/images/coldbrew.png",
  "/data/images/icedcoffee.png",
  "/data/images/blacktea.png",
  "/data/images/greentea.png",
  "/data/images/croissant.png",
  "/data/images/muffin.png",
];

// Network-first resources (always try network first)
const NETWORK_FIRST = ["/data/menu.json"];

// Cache-first resources (serve from cache, fallback to network)
const CACHE_FIRST = ["/data/images/", "/images/", ".css", ".js"];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");

  event.waitUntil(
    (async () => {
      try {
        // Open static cache
        const staticCache = await caches.open(STATIC_CACHE);

        // Add base path for GitHub Pages compatibility
        const basePath = self.location.pathname.includes("/coffe")
          ? "/coffe"
          : "";
        const assetsToCache = STATIC_ASSETS.map((asset) => basePath + asset);

        console.log(
          "Service Worker: Caching static assets...",
          assetsToCache.length,
          "files"
        );

        // Cache static assets
        await staticCache.addAll(assetsToCache);

        console.log("Service Worker: Static assets cached successfully");

        // Skip waiting to activate immediately
        self.skipWaiting();
      } catch (error) {
        console.error("Service Worker: Error during install:", error);
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");

  event.waitUntil(
    (async () => {
      try {
        // Get all cache names
        const cacheNames = await caches.keys();

        // Delete old caches
        const deletePromises = cacheNames
          .filter(
            (name) =>
              name.startsWith("coffee-masters") && !name.includes("v2.0")
          )
          .map((name) => {
            console.log("Service Worker: Deleting old cache:", name);
            return caches.delete(name);
          });

        await Promise.all(deletePromises);

        // Claim clients immediately
        await self.clients.claim();

        console.log("Service Worker: Activated successfully");
      } catch (error) {
        console.error("Service Worker: Error during activation:", error);
      }
    })()
  );
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(handleFetch(event.request));
});

async function handleFetch(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    // Network-first strategy for API data
    if (NETWORK_FIRST.some((pattern) => pathname.includes(pattern))) {
      return await networkFirst(request);
    }

    // Cache-first strategy for static assets
    if (CACHE_FIRST.some((pattern) => pathname.includes(pattern))) {
      return await cacheFirst(request);
    }

    // Stale-while-revalidate for HTML pages
    if (
      pathname.endsWith("/") ||
      pathname.endsWith(".html") ||
      !pathname.includes(".")
    ) {
      return await staleWhileRevalidate(request);
    }

    // Default: cache-first
    return await cacheFirst(request);
  } catch (error) {
    console.error("Service Worker: Fetch error:", error);

    // Return offline fallback
    return await getOfflineFallback(request);
  }
}

// Network-first strategy
async function networkFirst(request) {
  const dynamicCache = await caches.open(DYNAMIC_CACHE);

  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      dynamicCache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await dynamicCache.match(request);

    if (cachedResponse) {
      console.log(
        "Service Worker: Serving from cache (network failed):",
        request.url
      );
      return cachedResponse;
    }

    throw error;
  }
}

// Cache-first strategy
async function cacheFirst(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    console.log("Service Worker: Serving from cache:", request.url);
    return cachedResponse;
  }

  // Cache miss, try network
  const dynamicCache = await caches.open(DYNAMIC_CACHE);
  const networkResponse = await fetch(request);

  // Cache successful responses
  if (networkResponse.ok) {
    dynamicCache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const staticCache = await caches.open(STATIC_CACHE);
  const dynamicCache = await caches.open(DYNAMIC_CACHE);

  // Serve from cache immediately if available
  const cachedResponse = await caches.match(request);

  // Always try to update in background
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        // Determine which cache to use
        const cache = STATIC_ASSETS.some((asset) => request.url.includes(asset))
          ? staticCache
          : dynamicCache;

        cache.put(request, response.clone());
      }
      return response;
    })
    .catch((error) => {
      console.log("Service Worker: Network update failed:", error.message);
    });

  // Return cached version immediately, or wait for network
  return cachedResponse || (await networkPromise);
}

// Offline fallback
async function getOfflineFallback(request) {
  const url = new URL(request.url);

  // For HTML pages, return cached index.html
  if (request.headers.get("accept")?.includes("text/html")) {
    const fallback =
      (await caches.match("/")) || (await caches.match("/index.html"));
    if (fallback) return fallback;
  }

  // For images, return cached placeholder if available
  if (request.headers.get("accept")?.includes("image/")) {
    const placeholder = await caches.match("/images/logo.png");
    if (placeholder) return placeholder;
  }

  // Return generic offline response
  return new Response(
    JSON.stringify({
      error: "Offline",
      message: "This content is not available offline",
    }),
    {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "application/json" },
    }
  );
}

// Push notification handling
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push notification received");

  const options = {
    body: "Your order is ready for pickup!",
    icon: "/images/icons/icon.png",
    badge: "/images/icons/icon.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "View Order",
        icon: "/images/icons/icon.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/images/icons/icon.png",
      },
    ],
  };

  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.title = data.title || "Coffee Masters";
  }

  event.waitUntil(
    self.registration.showNotification("Coffee Masters", options)
  );
});

// Notification click handling
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked");

  event.notification.close();

  if (event.action === "explore") {
    // Open the order page
    event.waitUntil(clients.openWindow("/order"));
  } else if (event.action === "close") {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(clients.openWindow("/"));
  }
});

// Background sync for offline orders
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync triggered");

  if (event.tag === "background-sync-orders") {
    event.waitUntil(syncOfflineOrders());
  }
});

async function syncOfflineOrders() {
  try {
    // Get offline orders from IndexedDB
    const offlineOrders = await getOfflineOrders();

    for (const order of offlineOrders) {
      try {
        // Try to submit order to server
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order),
        });

        if (response.ok) {
          // Remove from offline storage
          await removeOfflineOrder(order.id);
          console.log("Service Worker: Synced offline order:", order.id);
        }
      } catch (error) {
        console.error("Service Worker: Failed to sync order:", order.id, error);
      }
    }
  } catch (error) {
    console.error("Service Worker: Background sync failed:", error);
  }
}

// Placeholder functions for IndexedDB operations (to be implemented)
async function getOfflineOrders() {
  // Implementation would use IndexedDB
  return [];
}

async function removeOfflineOrder(orderId) {
  // Implementation would use IndexedDB
  console.log("Removing offline order:", orderId);
}
