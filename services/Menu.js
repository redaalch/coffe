import API from "./API.js";

export async function loadData() {
  try {
    // Check if we have valid cached data when offline
    if (!navigator.onLine && window.app && window.app.offline) {
      const isValid = await window.app.offline.isMenuCacheValid();
      if (isValid) {
        console.log("Menu: Loading from offline cache");
        app.store.menu = await window.app.offline.getCachedMenu();
        return;
      }
    }

    // Try to load from network
    if (navigator.onLine) {
      app.store.menu = await API.fetchMenu();

      // Cache the data for offline use
      if (window.app && window.app.offline) {
        await window.app.offline.cacheMenuData(app.store.menu);
      }
    } else {
      // Offline and no valid cache - try to load any cached data
      if (window.app && window.app.offline) {
        const cachedMenu = await window.app.offline.getCachedMenu();
        if (cachedMenu.length > 0) {
          console.log("Menu: Loading stale cache (offline)");
          app.store.menu = cachedMenu;
        } else {
          throw new Error("No offline menu data available");
        }
      } else {
        throw new Error("Offline and no cache available");
      }
    }
  } catch (error) {
    console.error("Failed to load menu data:", error);

    // Try to load from cache as fallback
    if (window.app && window.app.offline) {
      try {
        const cachedMenu = await window.app.offline.getCachedMenu();
        if (cachedMenu.length > 0) {
          console.log("Menu: Using cached data as fallback");
          app.store.menu = cachedMenu;
          return;
        }
      } catch (cacheError) {
        console.error("Failed to load cached menu:", cacheError);
      }
    }

    // If all else fails, show error
    throw error;
  }
}
export async function getProductById(id) {
  if (app.store.menu == null) {
    await loadData();
  }
  for (let c of app.store.menu) {
    for (let p of c.products) {
      if (p.id == id) {
        return p;
      }
    }
  }
  return null;
}
