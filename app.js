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
    setupMobileNavigation();
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
  const mobileBadge = document.getElementById("mobile-badge");
  const qty = app.store.cart.reduce((acc, item) => acc + item.quantity, 0);

  if (badge) {
    badge.textContent = qty;
    badge.hidden = qty == 0;
  }

  if (mobileBadge) {
    mobileBadge.textContent = qty;
    mobileBadge.hidden = qty == 0;
  }
}

window.addEventListener("authchange", () => {
  updateAuthUI();
  updateMobileAuthUI();
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
  const mobileThemeToggle = document.getElementById("mobile-theme-toggle");

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      app.theme.toggleTheme();
    });
  }

  if (mobileThemeToggle) {
    mobileThemeToggle.addEventListener("click", () => {
      app.theme.toggleTheme();
    });
  }
}

function setupMobileNavigation() {
  const hamburgerToggle = document.getElementById("hamburger-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  const mobileNavOverlay = document.getElementById("mobile-nav-overlay");
  const mobileNavLinks = document.querySelectorAll(".mobile-nav .nav-item");

  function toggleMobileNav() {
    hamburgerToggle.classList.toggle("active");
    mobileNav.classList.toggle("active");
    mobileNavOverlay.classList.toggle("active");

    // Prevent body scroll when menu is open
    if (mobileNav.classList.contains("active")) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }

  function closeMobileNav() {
    hamburgerToggle.classList.remove("active");
    mobileNav.classList.remove("active");
    mobileNavOverlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (hamburgerToggle) {
    hamburgerToggle.addEventListener("click", toggleMobileNav);
  }

  if (mobileNavOverlay) {
    mobileNavOverlay.addEventListener("click", closeMobileNav);
  }

  // Close mobile nav when clicking on links (except theme toggle)
  mobileNavLinks.forEach((link) => {
    if (!link.id.includes("theme-toggle")) {
      link.addEventListener("click", (e) => {
        if (link.tagName === "A") {
          closeMobileNav();
          // Handle navigation
          e.preventDefault();
          const href = link.getAttribute("href");
          app.router.go(href);
        }
      });
    }
  });

  // Handle window resize
  window.addEventListener("resize", () => {
    if (window.innerWidth > 460) {
      closeMobileNav();
    }
  });
}

function updateMobileAuthUI() {
  const mobileAuthLink = document.getElementById("mobile-linkAuth");
  const mobileProfileLink = document.getElementById("mobile-linkProfile");
  const mobileAdminLink = document.getElementById("mobile-linkAdmin");

  if (app.auth.isAuthenticated()) {
    if (mobileAuthLink) mobileAuthLink.style.display = "none";
    if (mobileProfileLink) mobileProfileLink.style.display = "flex";

    // Show admin link only for admin users
    if (app.auth.isAdmin()) {
      if (mobileAdminLink) mobileAdminLink.style.display = "flex";
    } else {
      if (mobileAdminLink) mobileAdminLink.style.display = "none";
    }
  } else {
    if (mobileAuthLink) mobileAuthLink.style.display = "flex";
    if (mobileProfileLink) mobileProfileLink.style.display = "none";
    if (mobileAdminLink) mobileAdminLink.style.display = "none";
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
