// PWA Testing Script
// Run this in browser console to test PWA features

async function testPWAFeatures() {
  console.log("🧪 Starting PWA Feature Tests...\n");

  // Test 1: Service Worker Registration
  console.log("1️⃣ Testing Service Worker Registration...");
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        console.log("✅ Service Worker is registered:", registration.scope);
      } else {
        console.log("❌ Service Worker is not registered");
      }
    } catch (error) {
      console.log("❌ Service Worker error:", error.message);
    }
  } else {
    console.log("❌ Service Worker not supported");
  }

  // Test 2: Cache API
  console.log("\n2️⃣ Testing Cache API...");
  if ("caches" in window) {
    try {
      const cacheNames = await caches.keys();
      console.log("✅ Cache API available. Caches found:", cacheNames);
    } catch (error) {
      console.log("❌ Cache API error:", error.message);
    }
  } else {
    console.log("❌ Cache API not supported");
  }

  // Test 3: IndexedDB
  console.log("\n3️⃣ Testing IndexedDB...");
  if ("indexedDB" in window) {
    try {
      if (app.offline) {
        await app.offline.init();
        console.log("✅ IndexedDB initialized successfully");
      } else {
        console.log("❌ OfflineStorage service not available");
      }
    } catch (error) {
      console.log("❌ IndexedDB error:", error.message);
    }
  } else {
    console.log("❌ IndexedDB not supported");
  }

  // Test 4: PWA Manager
  console.log("\n4️⃣ Testing PWA Manager...");
  if (app.pwa) {
    try {
      const status = app.pwa.getStatus();
      console.log("✅ PWA Manager available. Status:", status);
    } catch (error) {
      console.log("❌ PWA Manager error:", error.message);
    }
  } else {
    console.log("❌ PWA Manager not available");
  }

  // Test 5: Notifications
  console.log("\n5️⃣ Testing Notifications...");
  if ("Notification" in window) {
    console.log(
      "✅ Notifications API available. Permission:",
      Notification.permission
    );
  } else {
    console.log("❌ Notifications not supported");
  }

  // Test 6: Storage Quota
  console.log("\n6️⃣ Testing Storage Quota...");
  if ("storage" in navigator && "estimate" in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const usedMB = (estimate.usage / (1024 * 1024)).toFixed(2);
      const totalMB = (estimate.quota / (1024 * 1024)).toFixed(2);
      console.log(`✅ Storage: ${usedMB}MB / ${totalMB}MB used`);
    } catch (error) {
      console.log("❌ Storage quota error:", error.message);
    }
  } else {
    console.log("❌ Storage quota API not supported");
  }

  // Test 7: Network Status
  console.log("\n7️⃣ Testing Network Status...");
  console.log("✅ Online status:", navigator.onLine);

  // Test 8: App Manifest
  console.log("\n8️⃣ Testing App Manifest...");
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink) {
    console.log("✅ Manifest link found:", manifestLink.href);
  } else {
    console.log("❌ Manifest link not found");
  }

  console.log("\n🎉 PWA Feature Tests Complete!");

  // Summary
  const features = [];
  if ("serviceWorker" in navigator) features.push("Service Worker");
  if ("caches" in window) features.push("Cache API");
  if ("indexedDB" in window) features.push("IndexedDB");
  if ("Notification" in window) features.push("Notifications");
  if ("storage" in navigator) features.push("Storage API");

  console.log("\n📊 PWA Features Supported:", features.join(", "));
}

// Auto-run test when page loads
window.addEventListener("load", () => {
  setTimeout(testPWAFeatures, 2000); // Wait 2 seconds for app to initialize
});

console.log(
  "PWA Testing Script Loaded! Run testPWAFeatures() in console or wait for auto-test."
);
