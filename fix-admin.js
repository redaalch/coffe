// Admin Fix Script - Run this in browser console if admin status is missing
// This will manually set the current user as admin

if (
  app.auth.currentUser &&
  app.auth.currentUser.email === "admin@coffeemasters.com"
) {
  // Set admin flag
  app.auth.currentUser.isAdmin = true;

  // Save updated user
  localStorage.setItem("coffee_user", JSON.stringify(app.auth.currentUser));

  // Update in users list too
  const users = JSON.parse(localStorage.getItem("coffee_users") || "[]");
  const userIndex = users.findIndex(
    (u) => u.email === "admin@coffeemasters.com"
  );
  if (userIndex > -1) {
    users[userIndex].isAdmin = true;
    localStorage.setItem("coffee_users", JSON.stringify(users));
  }

  // Trigger UI update
  window.dispatchEvent(new Event("authchange"));

  console.log("✅ Admin status fixed! The admin link should now appear.");
  console.log("Updated user:", app.auth.currentUser);
} else {
  console.log(
    "❌ Current user is not admin@coffeemasters.com or not logged in"
  );
  console.log("Current user:", app.auth.currentUser);
}
