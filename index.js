require("dotenv").config();
var Log = require("./Startup/Logs");
const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path");

// Initialize middleware
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
const dbInit = require("./Startup/DB");

// Health check endpoint (before database middleware)
app.get("/api", async (req, res) => {
  res.status(200).send({ message: "Welcome to the application." });
});

// Static file serving (before database middleware)
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

// Middleware to ensure database is ready
app.use(async (req, res, next) => {
  try {
    // Skip database check for health check and static file endpoints
    if (req.path === "/api" || req.path === "/" || req.path.startsWith("/api/uploads")) {
      return next();
    }
    
    // Ensure database is ready
    await dbInit.ensureDbReady();
    next();
  } catch (error) {
    console.error("Database not ready:", error);
    res.status(503).json({ 
      message: "Database connection unavailable. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Initialize routes
require("./Startup/Routes")(app);

// For Vercel serverless functions, export the app
module.exports = app;

// For local development, start the server
if (require.main === module) {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => Log.info("Server started..." + PORT));
}
