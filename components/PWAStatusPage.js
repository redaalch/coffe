export class PWAStatusPage extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.loadCSS();
    this.render();
    this.setupEventListeners();
    this.updateStatus();

    // Update status every 5 seconds
    this.statusInterval = setInterval(() => {
      this.updateStatus();
    }, 5000);
  }

  disconnectedCallback() {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }
  }

  loadCSS() {
    if (!document.querySelector('link[href*="PWAStatusPage.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = window.getPath
        ? window.getPath("components/PWAStatusPage.css")
        : "components/PWAStatusPage.css";
      document.head.appendChild(link);
    }
  }

  render() {
    this.innerHTML = `
      <div class="pwa-status-container">
        <header class="pwa-header">
          <h1>PWA Status & Controls</h1>
          <p>Progressive Web App features and offline capabilities</p>
        </header>

        <div class="status-grid">
          <!-- Connection Status -->
          <div class="status-card">
            <div class="status-icon" id="connection-icon">🌐</div>
            <h3>Connection Status</h3>
            <div class="status-value" id="connection-status">Checking...</div>
            <div class="status-details" id="connection-details"></div>
          </div>

          <!-- Service Worker Status -->
          <div class="status-card">
            <div class="status-icon" id="sw-icon">⚙️</div>
            <h3>Service Worker</h3>
            <div class="status-value" id="sw-status">Checking...</div>
            <div class="status-details" id="sw-details"></div>
          </div>

          <!-- Install Status -->
          <div class="status-card">
            <div class="status-icon" id="install-icon">📱</div>
            <h3>Installation</h3>
            <div class="status-value" id="install-status">Checking...</div>
            <div class="status-details" id="install-details"></div>
          </div>

          <!-- Notifications -->
          <div class="status-card">
            <div class="status-icon" id="notifications-icon">🔔</div>
            <h3>Notifications</h3>
            <div class="status-value" id="notifications-status">Checking...</div>
            <div class="status-details" id="notifications-details"></div>
          </div>
        </div>

        <!-- Cache Status -->
        <div class="cache-section">
          <h2>Cache Status</h2>
          <div class="cache-grid">
            <div class="cache-item">
              <h4>Static Assets</h4>
              <div id="static-cache-status">Loading...</div>
              <button id="clear-static-cache" class="btn-secondary">Clear</button>
            </div>
            <div class="cache-item">
              <h4>Dynamic Content</h4>
              <div id="dynamic-cache-status">Loading...</div>
              <button id="clear-dynamic-cache" class="btn-secondary">Clear</button>
            </div>
            <div class="cache-item">
              <h4>API Cache</h4>
              <div id="api-cache-status">Loading...</div>
              <button id="clear-api-cache" class="btn-secondary">Clear</button>
            </div>
          </div>
        </div>

        <!-- Offline Storage -->
        <div class="storage-section">
          <h2>Offline Storage</h2>
          <div class="storage-grid">
            <div class="storage-item">
              <h4>Orders</h4>
              <div id="orders-count">0 orders</div>
              <div class="storage-details">
                <span id="offline-orders-count">0 offline</span>
              </div>
            </div>
            <div class="storage-item">
              <h4>Menu Cache</h4>
              <div id="menu-cache-status">Not cached</div>
              <div class="storage-details">
                <span id="menu-cache-age">-</span>
              </div>
            </div>
            <div class="storage-item">
              <h4>Cart</h4>
              <div id="cart-items-count">0 items</div>
              <div class="storage-details">
                <span>Persistent cart</span>
              </div>
            </div>
            <div class="storage-item">
              <h4>Sync Queue</h4>
              <div id="sync-queue-count">0 pending</div>
              <div class="storage-details">
                <button id="force-sync" class="btn-secondary">Force Sync</button>
              </div>
            </div>
          </div>
        </div>

        <!-- PWA Controls -->
        <div class="controls-section">
          <h2>PWA Controls</h2>
          <div class="controls-grid">
            <button id="test-notification" class="btn-primary">Test Notification</button>
            <button id="prompt-install" class="btn-primary">Prompt Install</button>
            <button id="force-update" class="btn-secondary">Force Update</button>
            <button id="clear-all-data" class="btn-danger">Clear All Data</button>
          </div>
        </div>

        <!-- Storage Quota -->
        <div class="quota-section">
          <h2>Storage Quota</h2>
          <div class="quota-bar-container">
            <div class="quota-bar">
              <div class="quota-used" id="quota-used-bar"></div>
            </div>
            <div class="quota-text">
              <span id="quota-used">0 MB</span> / <span id="quota-total">0 MB</span> used
            </div>
          </div>
        </div>

        <!-- Debug Info -->
        <div class="debug-section">
          <h2>Debug Information</h2>
          <div class="debug-grid">
            <div class="debug-item">
              <strong>User Agent:</strong>
              <span id="user-agent"></span>
            </div>
            <div class="debug-item">
              <strong>Base Path:</strong>
              <span id="base-path"></span>
            </div>
            <div class="debug-item">
              <strong>Environment:</strong>
              <span id="environment"></span>
            </div>
            <div class="debug-item">
              <strong>PWA Features:</strong>
              <span id="pwa-features"></span>
            </div>
          </div>
          
          <div class="logs-section">
            <h3>Recent Logs</h3>
            <div id="pwa-logs" class="logs-container"></div>
            <button id="clear-logs" class="btn-secondary">Clear Logs</button>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Cache controls
    this.querySelector("#clear-static-cache").addEventListener("click", () => {
      this.clearCache("coffee-masters-static-v2.0");
    });

    this.querySelector("#clear-dynamic-cache").addEventListener("click", () => {
      this.clearCache("coffee-masters-dynamic-v2.0");
    });

    this.querySelector("#clear-api-cache").addEventListener("click", () => {
      this.clearCache("coffee-masters-api-v2.0");
    });

    // PWA controls
    this.querySelector("#test-notification").addEventListener("click", () => {
      this.testNotification();
    });

    this.querySelector("#prompt-install").addEventListener("click", () => {
      this.promptInstall();
    });

    this.querySelector("#force-update").addEventListener("click", () => {
      this.forceUpdate();
    });

    this.querySelector("#clear-all-data").addEventListener("click", () => {
      this.clearAllData();
    });

    this.querySelector("#force-sync").addEventListener("click", () => {
      this.forceSync();
    });

    this.querySelector("#clear-logs").addEventListener("click", () => {
      this.clearLogs();
    });
  }

  async updateStatus() {
    await this.updateConnectionStatus();
    await this.updateServiceWorkerStatus();
    await this.updateInstallStatus();
    await this.updateNotificationStatus();
    await this.updateCacheStatus();
    await this.updateStorageStatus();
    await this.updateQuotaStatus();
    this.updateDebugInfo();
  }

  updateConnectionStatus() {
    const isOnline = navigator.onLine;
    const icon = this.querySelector("#connection-icon");
    const status = this.querySelector("#connection-status");
    const details = this.querySelector("#connection-details");

    if (isOnline) {
      icon.textContent = "🌐";
      status.textContent = "Online";
      status.className = "status-value online";
      details.textContent = "Connected to the internet";
    } else {
      icon.textContent = "📴";
      status.textContent = "Offline";
      status.className = "status-value offline";
      details.textContent = "Working in offline mode";
    }
  }

  async updateServiceWorkerStatus() {
    const icon = this.querySelector("#sw-icon");
    const status = this.querySelector("#sw-status");
    const details = this.querySelector("#sw-details");

    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          icon.textContent = "✅";
          status.textContent = "Active";
          status.className = "status-value online";
          details.textContent = `Scope: ${registration.scope}`;
        } else {
          icon.textContent = "❌";
          status.textContent = "Not Registered";
          status.className = "status-value offline";
          details.textContent = "Service worker not found";
        }
      } catch (error) {
        icon.textContent = "⚠️";
        status.textContent = "Error";
        status.className = "status-value warning";
        details.textContent = error.message;
      }
    } else {
      icon.textContent = "❌";
      status.textContent = "Not Supported";
      status.className = "status-value offline";
      details.textContent = "Service workers not supported";
    }
  }

  updateInstallStatus() {
    const icon = this.querySelector("#install-icon");
    const status = this.querySelector("#install-status");
    const details = this.querySelector("#install-details");

    if (app.pwa) {
      const pwaStatus = app.pwa.getStatus();

      if (pwaStatus.isInstalled) {
        icon.textContent = "📱";
        status.textContent = "Installed";
        status.className = "status-value online";
        details.textContent = "Running as installed app";
      } else if (pwaStatus.canInstall) {
        icon.textContent = "📲";
        status.textContent = "Can Install";
        status.className = "status-value warning";
        details.textContent = "Installation prompt available";
      } else {
        icon.textContent = "🌐";
        status.textContent = "Web App";
        status.className = "status-value neutral";
        details.textContent = "Running in browser";
      }
    } else {
      icon.textContent = "❌";
      status.textContent = "Not Available";
      status.className = "status-value offline";
      details.textContent = "PWA manager not loaded";
    }
  }

  updateNotificationStatus() {
    const icon = this.querySelector("#notifications-icon");
    const status = this.querySelector("#notifications-status");
    const details = this.querySelector("#notifications-details");

    if ("Notification" in window) {
      const permission = Notification.permission;

      switch (permission) {
        case "granted":
          icon.textContent = "🔔";
          status.textContent = "Enabled";
          status.className = "status-value online";
          details.textContent = "Notifications allowed";
          break;
        case "denied":
          icon.textContent = "🔕";
          status.textContent = "Blocked";
          status.className = "status-value offline";
          details.textContent = "Notifications blocked";
          break;
        default:
          icon.textContent = "❓";
          status.textContent = "Not Asked";
          status.className = "status-value warning";
          details.textContent = "Permission not requested";
      }
    } else {
      icon.textContent = "❌";
      status.textContent = "Not Supported";
      status.className = "status-value offline";
      details.textContent = "Notifications not supported";
    }
  }

  async updateCacheStatus() {
    try {
      const cacheNames = await caches.keys();

      const staticCaches = cacheNames.filter((name) => name.includes("static"));
      const dynamicCaches = cacheNames.filter((name) =>
        name.includes("dynamic")
      );
      const apiCaches = cacheNames.filter((name) => name.includes("api"));

      this.querySelector(
        "#static-cache-status"
      ).textContent = `${staticCaches.length} cache(s)`;
      this.querySelector(
        "#dynamic-cache-status"
      ).textContent = `${dynamicCaches.length} cache(s)`;
      this.querySelector(
        "#api-cache-status"
      ).textContent = `${apiCaches.length} cache(s)`;
    } catch (error) {
      this.querySelector("#static-cache-status").textContent = "Error";
      this.querySelector("#dynamic-cache-status").textContent = "Error";
      this.querySelector("#api-cache-status").textContent = "Error";
    }
  }

  async updateStorageStatus() {
    try {
      if (app.offline) {
        const storageInfo = await app.offline.getStorageInfo();

        this.querySelector(
          "#orders-count"
        ).textContent = `${storageInfo.ordersCount} orders`;

        const offlineOrders = await app.offline.getOfflineOrders();
        this.querySelector(
          "#offline-orders-count"
        ).textContent = `${offlineOrders.length} offline`;

        this.querySelector("#menu-cache-status").textContent =
          storageInfo.menuCached ? "Cached" : "Not cached";
        this.querySelector(
          "#cart-items-count"
        ).textContent = `${storageInfo.cartItems} items`;
        this.querySelector(
          "#sync-queue-count"
        ).textContent = `${storageInfo.syncQueueCount} pending`;
      }
    } catch (error) {
      console.error("PWA Status: Storage info error:", error);
    }
  }

  async updateQuotaStatus() {
    try {
      if ("storage" in navigator && "estimate" in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const total = estimate.quota || 0;

        const usedMB = (used / (1024 * 1024)).toFixed(2);
        const totalMB = (total / (1024 * 1024)).toFixed(2);
        const percentage = total > 0 ? (used / total) * 100 : 0;

        this.querySelector("#quota-used").textContent = `${usedMB} MB`;
        this.querySelector("#quota-total").textContent = `${totalMB} MB`;
        this.querySelector("#quota-used-bar").style.width = `${percentage}%`;
      } else {
        this.querySelector("#quota-used").textContent = "Unknown";
        this.querySelector("#quota-total").textContent = "Unknown";
      }
    } catch (error) {
      console.error("PWA Status: Quota error:", error);
    }
  }

  updateDebugInfo() {
    this.querySelector("#user-agent").textContent = navigator.userAgent;
    this.querySelector("#base-path").textContent =
      window.APP_CONFIG?.basePath || "/";

    const hostname = location.hostname;
    let environment = "Unknown";
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      environment = "Local Development";
    } else if (hostname.includes("github.io")) {
      environment = "GitHub Pages";
    } else {
      environment = "Production";
    }
    this.querySelector("#environment").textContent = environment;

    const features = [];
    if ("serviceWorker" in navigator) features.push("Service Worker");
    if ("Notification" in window) features.push("Notifications");
    if ("caches" in window) features.push("Cache API");
    if ("indexedDB" in window) features.push("IndexedDB");
    if ("storage" in navigator) features.push("Storage API");

    this.querySelector("#pwa-features").textContent = features.join(", ");
  }

  async clearCache(cacheName) {
    try {
      const deleted = await caches.delete(cacheName);
      if (deleted) {
        alert(`Cache "${cacheName}" cleared successfully`);
      } else {
        alert(`Cache "${cacheName}" not found`);
      }
      this.updateCacheStatus();
    } catch (error) {
      alert(`Error clearing cache: ${error.message}`);
    }
  }

  async testNotification() {
    if (app.pwa) {
      const success = await app.pwa.sendTestNotification();
      if (success) {
        alert("Test notification sent!");
      } else {
        alert("Failed to send notification. Please check permissions.");
      }
    } else {
      alert("PWA manager not available");
    }
  }

  async promptInstall() {
    if (app.pwa) {
      const installed = await app.pwa.promptInstall();
      if (installed) {
        alert("App installation started!");
      } else {
        alert("Installation not available or declined");
      }
    } else {
      alert("PWA manager not available");
    }
  }

  forceUpdate() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.update();
          alert(
            "Service worker update requested. Reload page to apply changes."
          );
        } else {
          alert("No service worker registration found");
        }
      });
    } else {
      alert("Service workers not supported");
    }
  }

  async clearAllData() {
    if (
      confirm(
        "This will clear ALL offline data including cart, orders, and cache. Continue?"
      )
    ) {
      try {
        // Clear caches
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));

        // Clear IndexedDB
        if (app.offline) {
          await app.offline.clearAllData();
        }

        // Clear localStorage
        localStorage.clear();

        alert("All data cleared successfully! Page will reload.");
        window.location.reload();
      } catch (error) {
        alert(`Error clearing data: ${error.message}`);
      }
    }
  }

  async forceSync() {
    try {
      if (app.store && app.store.syncOfflineData) {
        await app.store.syncOfflineData();
        alert("Offline data sync completed!");
        this.updateStorageStatus();
      } else {
        alert("Sync not available");
      }
    } catch (error) {
      alert(`Sync failed: ${error.message}`);
    }
  }

  clearLogs() {
    this.querySelector("#pwa-logs").innerHTML = "";
  }
}

customElements.define("pwa-status-page", PWAStatusPage);
