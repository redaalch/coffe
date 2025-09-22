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

      // Check if user dismissed install prompt recently
      const dismissedTime = localStorage.getItem("pwa-install-dismissed");
      const twoDaysInMs = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds

      if (dismissedTime && Date.now() - parseInt(dismissedTime) < twoDaysInMs) {
        console.log("PWA: Install prompt was dismissed recently, not showing");
        return;
      }

      this.showInstallBanner();
    });

    window.addEventListener("appinstalled", () => {
      console.log("PWA: App installed successfully");
      this.isInstalled = true;
      this.hideInstallBanner();
      localStorage.removeItem("pwa-install-dismissed"); // Clear dismissed flag
      this.showInstalledMessage();
    });
  }

  async promptInstall() {
    console.log(
      "PWA: promptInstall called, deferredPrompt:",
      !!this.deferredPrompt
    );

    if (!this.deferredPrompt) {
      console.log("PWA: Install prompt not available, hiding banner");
      this.hideInstallBanner();
      // Show a message to user
      this.showInstallInstructions();
      return false;
    }

    try {
      console.log("PWA: Showing install prompt");
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
      this.hideInstallBanner();
      return false;
    }
  }

  showInstallInstructions() {
    // Show instructions for manual installation
    const instructions = document.createElement("div");
    instructions.id = "install-instructions";
    instructions.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #43281c 0%, #7f4f24 100%);
      color: #ede0d4;
      padding: 1rem;
      z-index: 1000;
      text-align: center;
    `;

    instructions.innerHTML = `
      <p>To install: Tap the browser menu (⋮) and select "Add to Home Screen" or "Install App"</p>
      <button onclick="this.parentElement.remove()" style="background: rgba(237,224,212,0.2); border: 1px solid rgba(237,224,212,0.4); color: #ede0d4; padding: 0.5rem 1rem; border-radius: 15px; margin-top: 0.5rem;">Got it</button>
    `;

    document.body.appendChild(instructions);

    setTimeout(() => {
      if (instructions.parentElement) {
        instructions.remove();
      }
    }, 5000);
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
    banner.className = "pwa-banner install-banner";
    banner.innerHTML = `
      <div class="banner-content">
        <div class="install-icon">
          <svg viewBox="0 0 24 24" width="32" height="32">
            <path fill="currentColor" d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
          </svg>
        </div>
        <div class="banner-text">
          <h3>📱 Install Coffee Masters</h3>
          <p>Get the full app experience with offline support!</p>
        </div>
        <div class="banner-actions">
          <button id="install-app" class="btn-install">
            <span class="btn-icon">⬇️</span>
            <span class="btn-text">Install</span>
            <div class="btn-shine"></div>
          </button>
          <button id="dismiss-install" class="btn-dismiss-install">
            <span class="btn-text">Later</span>
          </button>
        </div>
      </div>
      <div class="banner-background"></div>
    `;

    // Add cool styles
    banner.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      transform: translateY(100%);
      transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      overflow: hidden;
    `;

    // Add comprehensive styles
    const style = document.createElement("style");
    style.textContent = `
      .install-banner {
        background: linear-gradient(135deg, #43281c 0%, #7f4f24 50%, #b08968 100%);
        position: relative;
      }

      .install-banner .banner-background {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: 
          radial-gradient(circle at 20% 50%, rgba(221, 184, 146, 0.2) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(237, 224, 212, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(176, 137, 104, 0.2) 0%, transparent 50%);
        opacity: 0.8;
      }

      .install-banner .banner-content {
        position: relative;
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
        max-width: 1200px;
        margin: 0 auto;
        backdrop-filter: blur(10px);
      }

      .install-banner .install-icon {
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(251, 242, 198, 0.2);
        border-radius: 50%;
        animation: float 3s ease-in-out infinite;
        box-shadow: 0 4px 20px rgba(67, 40, 28, 0.3);
        border: 2px solid rgba(251, 242, 198, 0.4);
      }

      .install-banner .install-icon svg {
        color: var(--highlight, #fbf2c6);
        filter: drop-shadow(0 2px 4px rgba(67, 40, 28, 0.4));
      }

      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-8px); }
      }

      .install-banner .banner-text {
        flex: 1;
        color: white;
      }

      .install-banner .banner-text h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.3rem;
        font-weight: 700;
        text-shadow: 0 2px 4px rgba(67, 40, 28, 0.5);
        background: linear-gradient(45deg, #fbf2c6, #ede0d4);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .install-banner .banner-text p {
        margin: 0;
        opacity: 0.95;
        font-size: 1rem;
        text-shadow: 0 1px 2px rgba(67, 40, 28, 0.3);
        color: #ede0d4;
      }

      .install-banner .banner-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
      }

      .install-banner .btn-install {
        background: linear-gradient(135deg, #7f4f24 0%, #b08968 50%, #ddb892 100%);
        border: none;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 30px;
        font-weight: 700;
        font-size: 1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.3s ease;
        box-shadow: 
          0 6px 20px rgba(127, 79, 36, 0.4),
          inset 0 1px 0 rgba(251, 242, 198, 0.3);
        position: relative;
        overflow: hidden;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        text-shadow: 0 1px 2px rgba(67, 40, 28, 0.3);
      }

      .install-banner .btn-install::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(251, 242, 198, 0.4), transparent);
        transition: left 0.6s;
      }

      .install-banner .btn-install:hover::before {
        left: 100%;
      }

      .install-banner .btn-install:hover {
        transform: translateY(-3px) scale(1.05);
        box-shadow: 
          0 8px 25px rgba(127, 79, 36, 0.6),
          inset 0 1px 0 rgba(251, 242, 198, 0.4);
      }

      .install-banner .btn-install:active {
        transform: translateY(-1px) scale(1.02);
      }

      .install-banner .btn-install .btn-icon {
        font-size: 1.2rem;
        animation: bounce 2s infinite;
      }

      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        25% { transform: translateY(-4px); }
        75% { transform: translateY(-2px); }
      }

      .install-banner .btn-dismiss-install {
        background: rgba(237, 224, 212, 0.15);
        border: 2px solid rgba(237, 224, 212, 0.4);
        color: #ede0d4;
        padding: 0.8rem 1.2rem;
        border-radius: 25px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 600;
        backdrop-filter: blur(10px);
        text-transform: uppercase;
        letter-spacing: 0.3px;
        font-size: 0.9rem;
        text-shadow: 0 1px 2px rgba(67, 40, 28, 0.3);
      }

      .install-banner .btn-dismiss-install:hover {
        background: rgba(237, 224, 212, 0.25);
        border-color: rgba(251, 242, 198, 0.6);
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(67, 40, 28, 0.3);
      }

      .install-banner .btn-dismiss-install:active {
        transform: translateY(0);
      }

      /* Mobile responsive */
      @media (max-width: 480px) {
        .install-banner .banner-content {
          flex-direction: column;
          text-align: center;
          gap: 1rem;
          padding: 1.5rem 1rem;
        }

        .install-banner .banner-text h3 {
          font-size: 1.2rem;
        }

        .install-banner .banner-text p {
          font-size: 0.9rem;
        }

        .install-banner .banner-actions {
          justify-content: center;
          width: 100%;
          gap: 0.75rem;
        }

        .install-banner .btn-install,
        .install-banner .btn-dismiss-install {
          flex: 1;
          justify-content: center;
          min-width: 120px;
        }

        .install-banner .btn-install {
          padding: 1rem 1.2rem;
        }

        .install-banner .btn-dismiss-install {
          padding: 0.8rem 1rem;
        }
      }

      /* Animation for showing banner */
      .install-banner.show {
        transform: translateY(0) !important;
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(banner);

    // Show with animation
    setTimeout(() => {
      banner.classList.add("show");
    }, 100);

    // Event listeners with more robust approach
    const installBtn = banner.querySelector("#install-app");
    const dismissBtn = banner.querySelector("#dismiss-install");

    if (installBtn) {
      installBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Install button clicked");
        this.promptInstall();
      });
      console.log("PWA: Install button event listener attached");
    } else {
      console.error("PWA: Install button not found!");
    }

    if (dismissBtn) {
      dismissBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Dismiss button clicked");
        // Save dismiss time to localStorage
        localStorage.setItem("pwa-install-dismissed", Date.now().toString());
        this.hideInstallBanner();
      });
      console.log("PWA: Dismiss button event listener attached");
    } else {
      console.error("PWA: Dismiss button not found!");
    }
  }

  hideInstallBanner() {
    console.log("PWA: hideInstallBanner called");
    const banner = document.getElementById("install-banner");
    if (banner) {
      console.log("PWA: Hiding install banner");
      banner.style.transform = "translateY(100%)";
      setTimeout(() => {
        banner.remove();
        // Clean up the styles
        const styles = document.querySelectorAll("style");
        styles.forEach((style) => {
          if (style.textContent.includes(".install-banner")) {
            style.remove();
          }
        });
        console.log("PWA: Install banner removed");
      }, 400);
    } else {
      console.log("PWA: Install banner not found");
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
    updateBanner.className = "pwa-banner update-banner";
    updateBanner.innerHTML = `
      <div class="banner-content">
        <div class="update-icon">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M12,18A6,6 0 0,1 6,12C6,10.24 6.7,8.63 7.8,7.5L9,8.7C8.1,9.5 7.5,10.7 7.5,12A4.5,4.5 0 0,0 12,16.5A4.5,4.5 0 0,0 16.5,12C16.5,10.7 15.9,9.5 15,8.7L16.2,7.5C17.3,8.63 18,10.24 18,12A6,6 0 0,1 12,18M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,6A6,6 0 0,0 6,12H2L6,16L10,12H6A6,6 0 0,1 12,6V2L8,6L12,10V6Z"/>
          </svg>
        </div>
        <div class="banner-text">
          <h3>🚀 Update Available!</h3>
          <p>New features and improvements are ready</p>
        </div>
        <div class="banner-actions">
          <button id="update-app" class="btn-update">
            <span class="btn-icon">⚡</span>
            <span class="btn-text">Update Now</span>
          </button>
          <button id="dismiss-update" class="btn-dismiss">
            <span class="btn-text">Later</span>
          </button>
        </div>
      </div>
    `;

    updateBanner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0;
      z-index: 1000;
      transform: translateY(-100%);
      transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255,255,255,0.1);
    `;

    // Add cool styles for the banner content
    const style = document.createElement("style");
    style.textContent = `
      .update-banner .banner-content {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem 1.5rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      .update-banner .update-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255,255,255,0.2);
        border-radius: 50%;
        animation: pulse 2s infinite;
      }

      .update-banner .update-icon svg {
        animation: rotate 3s linear infinite;
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }

      @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .update-banner .banner-text {
        flex: 1;
      }

      .update-banner .banner-text h3 {
        margin: 0 0 0.25rem 0;
        font-size: 1.1rem;
        font-weight: 600;
        text-shadow: 0 1px 2px rgba(0,0,0,0.2);
      }

      .update-banner .banner-text p {
        margin: 0;
        opacity: 0.9;
        font-size: 0.9rem;
      }

      .update-banner .banner-actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }

      .update-banner .btn-update {
        background: linear-gradient(45deg, #ff6b6b, #ff8e53);
        border: none;
        color: white;
        padding: 0.75rem 1.25rem;
        border-radius: 25px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
        position: relative;
        overflow: hidden;
      }

      .update-banner .btn-update::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        transition: left 0.6s;
      }

      .update-banner .btn-update:hover::before {
        left: 100%;
      }

      .update-banner .btn-update:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(255, 107, 107, 0.6);
      }

      .update-banner .btn-update:active {
        transform: translateY(0);
      }

      .update-banner .btn-update .btn-icon {
        font-size: 1.1rem;
        animation: bounce 1s infinite;
      }

      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
      }

      .update-banner .btn-dismiss {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 0.75rem 1rem;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 500;
        backdrop-filter: blur(10px);
      }

      .update-banner .btn-dismiss:hover {
        background: rgba(255,255,255,0.2);
        transform: translateY(-1px);
      }

      @media (max-width: 480px) {
        .update-banner .banner-content {
          flex-direction: column;
          text-align: center;
          gap: 0.75rem;
          padding: 1rem;
        }

        .update-banner .banner-actions {
          justify-content: center;
          width: 100%;
        }

        .update-banner .btn-update,
        .update-banner .btn-dismiss {
          flex: 1;
          justify-content: center;
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(updateBanner);

    setTimeout(() => {
      updateBanner.style.transform = "translateY(0)";
    }, 100);

    updateBanner.querySelector("#update-app").addEventListener("click", () => {
      const btn = updateBanner.querySelector("#update-app");
      btn.innerHTML = `
        <span class="btn-icon">⏳</span>
        <span class="btn-text">Updating...</span>
      `;
      btn.style.pointerEvents = "none";
      setTimeout(() => {
        window.location.reload();
      }, 500);
    });

    updateBanner
      .querySelector("#dismiss-update")
      .addEventListener("click", () => {
        updateBanner.style.transform = "translateY(-100%)";
        setTimeout(() => {
          updateBanner.remove();
          // Clean up the style element
          style.remove();
        }, 400);
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
