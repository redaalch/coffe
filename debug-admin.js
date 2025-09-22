// Debug script to check user data and admin status
// Run this in the browser console

console.log("=== Admin Debug Information ===");
console.log("Current User:", app.auth.currentUser);
console.log("Is Authenticated:", app.auth.isAuthenticated());
console.log("Is Admin:", app.auth.isAdmin());

// Check localStorage for user data
const userData = localStorage.getItem("coffee_user");
console.log(
  "User Data from localStorage:",
  userData ? JSON.parse(userData) : "No user data"
);

// Check all users
const allUsers = localStorage.getItem("coffee_users");
console.log("All Users:", allUsers ? JSON.parse(allUsers) : "No users data");

// Check admin link visibility
const adminLink = document.getElementById("linkAdmin");
console.log("Admin Link Element:", adminLink);
console.log(
  "Admin Link Display:",
  adminLink ? adminLink.style.display : "Element not found"
);

// Force UI update
if (window.app && window.app.auth) {
  console.log("Triggering auth UI update...");
  window.dispatchEvent(new Event("authchange"));
}
