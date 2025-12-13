const db = require("./../Models");
const Log = require("./Logs");
const bcrypt = require("bcrypt");

const initializeDefaultAdmin = async () => {
  try {
    const adminCount = await db.Users.count({ where: { role: "admin" } });
    if (adminCount === 0) {
      await db.Users.create({
        name: "Default Admin",
        email: "admin@admin.com",
        password: bcrypt.hashSync("admin@admin.com", 10),
        role: "admin",
      });
      console.log("Default User Added");
    }
  } catch (error) {
    console.error("Error adding default admin user:", error);
  }
};

// Test database connection
const testConnection = async () => {
  try {
    await db.sequelize.authenticate();
    Log.info("Database connection has been established successfully.");
    return true;
  } catch (error) {
    Log.error("Unable to connect to the database:", error);
    return false;
  }
};

// Initialize database (sync only in non-production or first run)
const initializeDatabase = async () => {
  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      Log.error("Database connection failed. Retrying...");
      // Retry once after a short delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      const retryConnected = await testConnection();
      if (!retryConnected) {
        throw new Error("Database connection failed after retry");
      }
    }

    // Sync database schema
    // In production, don't sync - assume tables already exist
    // Only sync in development or if explicitly enabled
    if (process.env.NODE_ENV !== "production" || process.env.DB_SYNC === "true") {
      const syncOptions = process.env.NODE_ENV === "production" 
        ? { alter: false } // Don't alter tables in production
        : { alter: true }; // Allow alterations in development

      await db.sequelize.sync(syncOptions);
      Log.info("Database synchronized successfully.");
    } else {
      Log.info("Database sync skipped in production mode.");
    }

    // Initialize default admin
    await initializeDefaultAdmin();
  } catch (error) {
    Log.error("Error initializing database:", error);
    console.error("Database initialization error:", error);
    throw error; // Re-throw to allow retry logic
  }
};

// Initialize database connection and sync
// Use a promise to handle async initialization
let dbInitialized = false;
let dbInitPromise = null;

const getDbInitPromise = () => {
  if (!dbInitPromise) {
    dbInitPromise = initializeDatabase();
  }
  return dbInitPromise;
};

// For serverless environments, we need to ensure DB is ready before handling requests
// This will be called when the module is loaded
getDbInitPromise();

// Export function to ensure DB is ready
module.exports.ensureDbReady = async () => {
  if (!dbInitialized) {
    try {
      await getDbInitPromise();
      dbInitialized = true;
    } catch (error) {
      Log.error("Failed to initialize database:", error);
      throw error;
    }
  }
  // Verify connection is still active
  try {
    await db.sequelize.authenticate();
  } catch (error) {
    Log.error("Database connection lost, reconnecting...", error);
    dbInitialized = false;
    dbInitPromise = null;
    await getDbInitPromise();
    dbInitialized = true;
  }
  return db.sequelize;
};
