import Store from "./services/Store.js";
import API from "./services/API.js";
import Auth from "./services/Auth.js";
import ThemeManager from "./services/ThemeManager.js";
import PWAManager from "./services/PWAManager.js";
import OfflineStorage from "./services/OfflineStorage.js";
import { loadData } from "./services/Menu.js";
import Router from "./services/Router.js";

import { MenuPage } from "./components/MenuPage.js";
import { DetailsPage } from "./components/DetailsPage.js";
import { OrderPage } from "./components/OrderPage.js";
import { AuthPage } from "./components/AuthPage.js";
import { ProfilePage } from "./components/ProfilePage.js";
import { AdminPage } from "./components/AdminPage.js";
import { PWAStatusPage } from "./components/PWAStatusPage.js";
import ProductItem from "./components/ProductItem.js";
import CartItem from "./components/CartItem.js";

window.app = {};
app.store = Store;
app.router = Router;
app.auth = Auth;
app.theme = ThemeManager;
app.pwa = PWAManager;
app.offline = OfflineStorage;

async function initializeApp() {
  try {
    // Initialize PWA features first
    await app.pwa.init();
    await app.offline.init();

    await loadData();
    app.router.init();
    updateAuthUI();
    setupThemeToggle();
    // Initialize cart counter with current cart items
    updateCartCounter();

    // Setup PWA event listeners
    setupPWAEventListeners();
  } catch (error) {
    console.error("Error during app initialization:", error);
  }
}

// Check if DOM is already loaded or wait for it
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initializeApp);
} else {
  // DOM is already loaded, initialize immediately
  initializeApp();
}

window.addEventListener("appcartchange", (event) => {
  updateCartCounter();
});

function updateCartCounter() {
  const badge = document.getElementById("badge");
  const qty = app.store.cart.reduce((acc, item) => acc + item.quantity, 0);
  badge.textContent = qty;
  badge.hidden = qty == 0;
}

window.addEventListener("authchange", () => {
  updateAuthUI();
});

function updateAuthUI() {
  const authLink = document.getElementById("linkAuth");
  const profileLink = document.getElementById("linkProfile");
  const adminLink = document.getElementById("linkAdmin");

  if (app.auth.isAuthenticated()) {
    authLink.style.display = "none";
    profileLink.style.display = "block";

    // Show admin link only for admin users
    if (app.auth.isAdmin()) {
      adminLink.style.display = "block";
    } else {
      adminLink.style.display = "none";
    }
  } else {
    authLink.style.display = "block";
    profileLink.style.display = "none";
    adminLink.style.display = "none";
  }
}

function setupThemeToggle() {
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      app.theme.toggleTheme();
    });
  }
}

function setupPWAEventListeners() {
  // Handle online/offline events
  window.addEventListener("online", () => {
    console.log("App came online");
    app.pwa.handleNetworkChange(true);
  });

  window.addEventListener("offline", () => {
    console.log("App went offline");
    app.pwa.handleNetworkChange(false);
  });

  // Handle app install events
  window.addEventListener("beforeinstallprompt", (e) => {
    app.pwa.handleInstallPrompt(e);
  });

  // Handle app installation
  window.addEventListener("appinstalled", () => {
    console.log("PWA was installed");
    app.pwa.handleAppInstalled();
  });
}
