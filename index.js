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
  
  // Initialize database connection (non-blocking for serverless)
  // Don't let DB initialization crash the app - it will be lazy-loaded when needed
  try {
    require("./Startup/DB");
  } catch (dbError) {
    console.error("Database initialization error (non-fatal):", dbError.message);
    Log.error("Database initialization error (non-fatal):", dbError);
  }

  // Health check endpoint (before routes)
  app.get("/api", async (req, res) => {
    res.status(200).send({ message: "Welcome to the application." });
  });

  // Static file serving
  app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

  // Middleware to check database availability before routes that need it
  app.use((req, res, next) => {
    // Skip DB check for health check and static file endpoints
    if (req.path === "/api" || req.path === "/" || req.path.startsWith("/api/uploads")) {
      return next();
    }
    
    // Check if MYSQL_URI is set
    if (!process.env.MYSQL_URI) {
      return res.status(503).json({ 
        message: "Database configuration missing. Please set MYSQL_URI environment variable.",
        error: "MYSQL_URI is not configured"
      });
    }
    next();
  });

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

  // For local development, start the server
  if (require.main === module) {
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => Log.info("Server started..." + PORT));
  }
} catch (error) {
  Log.error("App initialization failed: " + error);
  console.error("Error during startup:", error);
}

// ALWAYS export app for Vercel serverless functions, even if initialization failed
// This must be outside the try-catch to ensure it's always executed
module.exports = app;
