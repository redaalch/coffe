// PWA Manager - Handles Progressive Web App features
class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isOnline = navigator.onLine;
    this.isInstalled = false;
    this.notificationPermission = "default";

    this.init();
  }

  async init() {
    await this.registerServiceWorker();
    this.setupInstallPrompt();
    this.setupNetworkDetection();
    this.setupNotifications();
    this.checkInstallStatus();
    this.setupBackgroundSync();
  }

  // Service Worker Registration
  async registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        const basePath = window.APP_CONFIG ? window.APP_CONFIG.basePath : "";
        const swPath = basePath + "/serviceworker.js";

        const registration = await navigator.serviceWorker.register(swPath, {
          scope: basePath + "/",
        });

        console.log("PWA: Service Worker registered successfully");

        // Listen for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              this.showUpdateAvailable();
            }
          });
        });

        // Listen for cache update messages from service worker
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data && event.data.type === "CACHE_UPDATED") {
            console.log("PWA: Cache updated, refreshing page...");
            // Small delay to allow service worker to finish cleanup
            setTimeout(() => {
              window.location.reload(true);
            }, 100);
          }
        });

        // Store registration for push notifications
        this.swRegistration = registration;

        return registration;
      } catch (error) {
        console.error("PWA: Service Worker registration failed:", error);
      }
    } else {
      console.log("PWA: Service Worker not supported");
    }
  }

  // Install Prompt Management
  setupInstallPrompt() {
    window.addEventListener("beforeinstallprompt", (e) => {
      console.log("PWA: Install prompt available");
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallBanner();
    });

    window.addEventListener("appinstalled", () => {
      console.log("PWA: App installed successfully");
      this.isInstalled = true;
      this.hideInstallBanner();
      this.showInstalledMessage();
    });
  }

  async promptInstall() {
    if (!this.deferredPrompt) {
      console.log("PWA: Install prompt not available");
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const result = await this.deferredPrompt.userChoice;

      console.log("PWA: Install prompt result:", result.outcome);

      if (result.outcome === "accepted") {
        this.hideInstallBanner();
      }

      this.deferredPrompt = null;
      return result.outcome === "accepted";
    } catch (error) {
      console.error("PWA: Install prompt error:", error);
      return false;
    }
  }

  // Network Detection
  setupNetworkDetection() {
    const updateOnlineStatus = () => {
      this.isOnline = navigator.onLine;
      this.updateNetworkIndicator();

      if (this.isOnline) {
        this.onOnline();
      } else {
        this.onOffline();
      }
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Initial status
    updateOnlineStatus();
  }

  onOnline() {
    console.log("PWA: Back online");
    this.hideOfflineIndicator();
    this.syncOfflineData();
  }

  onOffline() {
    console.log("PWA: Gone offline");
    this.showOfflineIndicator();
  }

  // Push Notifications
  async setupNotifications() {
    if (!("Notification" in window)) {
      console.log("PWA: Notifications not supported");
      return;
    }

    this.notificationPermission = Notification.permission;

    if (this.notificationPermission === "default") {
      this.showNotificationPrompt();
    }
  }

  async requestNotificationPermission() {
    try {
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission;

      if (permission === "granted") {
        console.log("PWA: Notification permission granted");
        await this.subscribeToPush();
        this.hideNotificationPrompt();
      } else {
        console.log("PWA: Notification permission denied");
      }

      return permission;
    } catch (error) {
      console.error("PWA: Notification permission error:", error);
    }
  }

  async subscribeToPush() {
    if (!this.swRegistration) {
      console.log("PWA: Service Worker not available for push");
      return;
    }

    try {
      // Generate VAPID keys for production use
      const vapidPublicKey =
        "BMqXVdcjDg_NhbMp8HWlBqJw6RHxvT2R5yQZftfP-3FdQHpNJ4x7kI8rBnK9bRhzWf2J3yOmNf1HdMqNQKfNc4s";

      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
      });

      console.log("PWA: Push subscription successful");

      // Send subscription to server (in a real app)
      // await this.sendSubscriptionToServer(subscription);

      // Store locally for demo
      localStorage.setItem("pushSubscription", JSON.stringify(subscription));

      return subscription;
    } catch (error) {
      console.error("PWA: Push subscription failed:", error);
    }
  }

  // Background Sync
  setupBackgroundSync() {
    if (
      "serviceWorker" in navigator &&
      "sync" in window.ServiceWorkerRegistration.prototype
    ) {
      console.log("PWA: Background sync supported");
    } else {
      console.log("PWA: Background sync not supported");
    }
  }

  async syncOfflineData() {
    if (!navigator.serviceWorker || !navigator.serviceWorker.ready) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register("background-sync-orders");
      console.log("PWA: Background sync registered");
    } catch (error) {
      console.error("PWA: Background sync registration failed:", error);
    }
  }

  // UI Methods
  showInstallBanner() {
    if (this.isInstalled) return;

    const banner = document.createElement("div");
    banner.id = "install-banner";
    banner.className = "pwa-banner";
    banner.innerHTML = `
      <div class="banner-content">
        <div class="banner-text">
          <h3>Install Coffee Masters</h3>
          <p>Get the full app experience with offline support!</p>
        </div>
        <div class="banner-actions">
          <button id="install-app" class="btn-primary">Install</button>
          <button id="dismiss-install" class="btn-secondary">Later</button>
        </div>
      </div>
    `;

    // Add styles
    banner.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--primaryColor);
      color: white;
      padding: 1rem;
      z-index: 1000;
      transform: translateY(100%);
      transition: transform 0.3s ease;
    `;

    document.body.appendChild(banner);

    // Show with animation
    setTimeout(() => {
      banner.style.transform = "translateY(0)";
    }, 100);

    // Event listeners
    banner.querySelector("#install-app").addEventListener("click", () => {
      this.promptInstall();
    });

    banner.querySelector("#dismiss-install").addEventListener("click", () => {
      this.hideInstallBanner();
    });
  }

  hideInstallBanner() {
    const banner = document.getElementById("install-banner");
    if (banner) {
      banner.style.transform = "translateY(100%)";
      setTimeout(() => banner.remove(), 300);
    }
  }

  showNotificationPrompt() {
    const prompt = document.createElement("div");
    prompt.id = "notification-prompt";
    prompt.className = "pwa-banner";
    prompt.innerHTML = `
      <div class="banner-content">
        <div class="banner-text">
          <h3>Stay Updated</h3>
          <p>Get notified when your order is ready!</p>
        </div>
        <div class="banner-actions">
          <button id="enable-notifications" class="btn-primary">Enable</button>
          <button id="dismiss-notifications" class="btn-secondary">Not now</button>
        </div>
      </div>
    `;

    prompt.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: var(--color1);
      color: white;
      padding: 1rem;
      z-index: 1000;
      transform: translateY(-100%);
      transition: transform 0.3s ease;
    `;

    document.body.appendChild(prompt);

    setTimeout(() => {
      prompt.style.transform = "translateY(0)";
    }, 100);

    prompt
      .querySelector("#enable-notifications")
      .addEventListener("click", () => {
        this.requestNotificationPermission();
      });

    prompt
      .querySelector("#dismiss-notifications")
      .addEventListener("click", () => {
        this.hideNotificationPrompt();
      });
  }

  hideNotificationPrompt() {
    const prompt = document.getElementById("notification-prompt");
    if (prompt) {
      prompt.style.transform = "translateY(-100%)";
      setTimeout(() => prompt.remove(), 300);
    }
  }

  showOfflineIndicator() {
    let indicator = document.getElementById("offline-indicator");

    if (!indicator) {
      indicator = document.createElement("div");
      indicator.id = "offline-indicator";
      indicator.textContent = "Offline - Some features may be limited";
      indicator.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ff6b6b;
        color: white;
        text-align: center;
        padding: 0.5rem;
        z-index: 1001;
        font-size: 0.9rem;
      `;
      document.body.appendChild(indicator);
    }
  }

  hideOfflineIndicator() {
    const indicator = document.getElementById("offline-indicator");
    if (indicator) {
      indicator.remove();
    }
  }

  updateNetworkIndicator() {
    // Update any network status indicators in the UI
    const statusElements = document.querySelectorAll(".network-status");
    statusElements.forEach((el) => {
      el.textContent = this.isOnline ? "Online" : "Offline";
      el.className = `network-status ${this.isOnline ? "online" : "offline"}`;
    });
  }

  showUpdateAvailable() {
    const updateBanner = document.createElement("div");
    updateBanner.id = "update-banner";
    updateBanner.className = "pwa-banner";
    updateBanner.innerHTML = `
      <div class="banner-content">
        <div class="banner-text">
          <h3>Update Available</h3>
          <p>A new version of Coffee Masters is ready!</p>
        </div>
        <div class="banner-actions">
          <button id="update-app" class="btn-primary">Update</button>
          <button id="dismiss-update" class="btn-secondary">Later</button>
        </div>
      </div>
    `;

    updateBanner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: var(--color2);
      color: white;
      padding: 1rem;
      z-index: 1000;
      transform: translateY(-100%);
      transition: transform 0.3s ease;
    `;

    document.body.appendChild(updateBanner);

    setTimeout(() => {
      updateBanner.style.transform = "translateY(0)";
    }, 100);

    updateBanner.querySelector("#update-app").addEventListener("click", () => {
      window.location.reload();
    });

    updateBanner
      .querySelector("#dismiss-update")
      .addEventListener("click", () => {
        updateBanner.style.transform = "translateY(-100%)";
        setTimeout(() => updateBanner.remove(), 300);
      });
  }

  showInstalledMessage() {
    const message = document.createElement("div");
    message.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--bg-color);
      border: 2px solid var(--primaryColor);
      border-radius: 10px;
      padding: 2rem;
      text-align: center;
      z-index: 1002;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    message.innerHTML = `
      <h3 style="color: var(--primaryColor); margin: 0 0 1rem 0;">🎉 App Installed!</h3>
      <p style="margin: 0; color: var(--text-color);">Coffee Masters is now installed on your device!</p>
    `;

    document.body.appendChild(message);

    setTimeout(() => {
      message.remove();
    }, 3000);
  }

  checkInstallStatus() {
    // Check if running in standalone mode (installed)
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    ) {
      this.isInstalled = true;
      console.log("PWA: Running in standalone mode (installed)");
    }
  }

  // Utility Methods
  urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Public API
  async sendTestNotification() {
    if (this.notificationPermission !== "granted") {
      const permission = await this.requestNotificationPermission();
      if (permission !== "granted") return false;
    }

    try {
      // For demo purposes, show a local notification
      const notification = new Notification("Coffee Masters", {
        body: "Your order is ready for pickup!",
        icon: window.getPath
          ? window.getPath("images/icons/icon.png")
          : "images/icons/icon.png",
        tag: "order-ready",
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    } catch (error) {
      console.error("PWA: Test notification failed:", error);
      return false;
    }
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      isInstalled: this.isInstalled,
      notificationPermission: this.notificationPermission,
      canInstall: !!this.deferredPrompt,
      serviceWorkerRegistered: !!this.swRegistration,
    };
  }
}

// Create and export PWA manager instance
const PWA = new PWAManager();
export default PWA;
