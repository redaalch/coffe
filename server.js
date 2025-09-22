const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from the current directory
app.use(
  express.static(".", {
    setHeaders: (res, path) => {
      // Set proper MIME types
      if (path.endsWith(".js")) {
        res.set("Content-Type", "application/javascript");
      } else if (path.endsWith(".css")) {
        res.set("Content-Type", "text/css");
      } else if (path.endsWith(".json")) {
        res.set("Content-Type", "application/json");
      }
    },
  })
);

// API routes (if you want to add any in the future)
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Handle SPA routing - serve index.html for all non-static routes
app.get("*", (req, res) => {
  // Don't redirect if it's a file request (has an extension)
  if (path.extname(req.url)) {
    res.status(404).send("File not found");
    return;
  }

  console.log(`SPA Route: ${req.url} -> serving index.html`);
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log("🚀 Coffee Shop App Server Started!");
  console.log(`📍 Server running at http://localhost:${port}`);
  console.log(`🔄 SPA routing enabled - refresh any page safely!`);
  console.log("📱 Try these routes:");
  console.log(`   • http://localhost:${port}/`);
  console.log(`   • http://localhost:${port}/order`);
  console.log(`   • http://localhost:${port}/auth`);
  console.log(`   • http://localhost:${port}/profile`);
  console.log("⏹️  Press Ctrl+C to stop the server");
});
