require("dotenv").config();
var Log = require("./Startup/Logs");
const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path");

try {
  app.use(
    express.urlencoded({ extended: true, limit: "35mb", parameterLimit: 50000 })
  );
  app.use(express.json({ limit: "35mb" }));
  app.use(cors());
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Max-Age", "1800");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "PUT, POST, GET, DELETE, PATCH, OPTIONS"
    );

    next();
  });

  require("./Startup/Cors")(app);
  require("./Middlware/Log")(app);
  require("./Startup/DB");

  // Health check endpoint (before routes)
  app.get("/api", async (req, res) => {
    res.status(200).send({ message: "Welcome to the application." });
  });

  // Static file serving
  app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

  // Initialize routes - MUST be before error handling middleware
  require("./Startup/Routes")(app);

  // Error handling middleware MUST be after all routes
  // This catches errors thrown by route handlers
  app.use((error, req, res, next) => {
    console.error("Unhandled error:", error);
    Log.error("Unhandled error:", error);
    res.status(error.status || 500).json({ 
      message: error.message || "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  });

  // 404 handler for undefined routes (must be after all routes and error handler)
  app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
  });

  // For Vercel serverless functions, export the app
  module.exports = app;

  // For local development, start the server
  if (require.main === module) {
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => Log.info("Server started..." + PORT));
  }
} catch (error) {
  Log.error("App initialization failed: " + error);
  console.error("Error during startup:", error);
  // Still export app for serverless, but it will show errors
  module.exports = app;
}
