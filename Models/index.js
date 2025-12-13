const Sequelize = require("sequelize");

// Check if mysql2 is available
let mysql2Available = false;
try {
  require("mysql2");
  mysql2Available = true;
} catch (e) {
  console.error("mysql2 package not found. Please ensure it's installed.");
}

// Validate MYSQL_URI is set
if (!process.env.MYSQL_URI) {
  const errorMsg = "ERROR: MYSQL_URI environment variable is not set! Please set it in Vercel environment variables.";
  console.error(errorMsg);
  // Create a dummy sequelize instance that will fail gracefully when used
  // This allows the app to start and show a proper error message
  const sequelize = {
    authenticate: async () => { 
      throw new Error(errorMsg); 
    },
    sync: async () => { 
      throw new Error(errorMsg); 
    },
  };
  const db = { Sequelize, sequelize };
  // Export empty models so the app doesn't crash
  db.Users = null;
  db.GPTModels = null;
  db.TokenHistory = null;
  db.Chats = null;
  db.Assistants = null;
  db.ChatHistory = null;
  db.Favorites = null;
  db.AssignGPTModel = null;
  db.AssignAssistant = null;
  db.Department = null;
  module.exports = db;
  // Don't throw - let the app start and show errors when DB is actually used
}

// TiDB connection configuration
// Note: Sequelize will automatically use mysql2 if available
// We don't need to explicitly specify dialectModule
let sequelize;
if (!mysql2Available) {
  const errorMsg = "mysql2 package is not installed. Please install it: npm install mysql2";
  console.error(errorMsg);
  sequelize = {
    authenticate: async () => { throw new Error(errorMsg); },
    sync: async () => { throw new Error(errorMsg); },
  };
} else {
  try {
    sequelize = new Sequelize(process.env.MYSQL_URI, {
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      ssl: process.env.DB_SSL === "true" ? {
        rejectUnauthorized: false,
      } : false,
      connectTimeout: 60000,
    },
      retry: {
        max: 3,
      },
    });
  } catch (error) {
    console.error("Failed to initialize Sequelize:", error.message);
    // Create a dummy sequelize that will fail gracefully
    sequelize = {
      authenticate: async () => { throw new Error("Sequelize initialization failed: " + error.message); },
      sync: async () => { throw new Error("Sequelize initialization failed: " + error.message); },
    };
  }
}
const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Users = require("./Users.model")(sequelize, Sequelize);
db.GPTModels = require("./GPTModels.model")(sequelize, Sequelize);

// 1 -> *
db.Users.hasMany(db.GPTModels, {
  foreignKey: "userId",
  as: "GPTModels",
});
db.GPTModels.belongsTo(db.Users, {
  foreignKey: "userId",
  as: "GPTModels",
});

db.TokenHistory = require("./TokenHistory.model")(sequelize, Sequelize);
// 1 -> *
db.Users.hasMany(db.TokenHistory, {
  foreignKey: "userId",
  as: "TokenHistory",
});
db.TokenHistory.belongsTo(db.Users, {
  foreignKey: "userId",
  as: "User",
});

db.Chats = require("./Chats.model")(sequelize, Sequelize);
// 1 -> *
db.Users.hasMany(db.Chats, {
  foreignKey: "userId",
  as: "chats",
});
db.Chats.belongsTo(db.Users, {
  foreignKey: "userId",
  as: "chats",
});

db.Assistants = require("./Assistants.model")(sequelize, Sequelize);
db.ChatHistory = require("./ChatHistory.model")(sequelize, Sequelize);

db.Favorites = require("./Favorites.model")(sequelize, Sequelize);
db.Favorites.belongsTo(db.GPTModels, {
  foreignKey: "modelId",
  as: "GPTModel",
  onDelete: "CASCADE",
});
db.GPTModels.hasMany(db.Favorites, {
  foreignKey: "modelId",
  as: "Favorite",
});

db.AssignGPTModel = require("./AssignGPT.model")(sequelize, Sequelize);
db.AssignGPTModel.belongsTo(db.GPTModels, {
  foreignKey: "modelId",
  as: "GPTModel",
});
db.GPTModels.hasMany(db.AssignGPTModel, {
  foreignKey: "modelId",
  as: "AssignGPTModel",
});
db.AssignGPTModel.belongsTo(db.Users, {
  foreignKey: "userId",
  as: "User",
});
db.Users.hasMany(db.AssignGPTModel, {
  foreignKey: "userId",
  as: "AssignGPTModel",
});

db.AssignAssistant = require("./AssignAssistant.model")(sequelize, Sequelize);
db.AssignAssistant.belongsTo(db.Assistants, {
  foreignKey: "assistantId",
  as: "Assistant",
});
db.GPTModels.hasMany(db.AssignAssistant, {
  foreignKey: "assistantId",
  as: "AssignAssistant",
});
db.AssignAssistant.belongsTo(db.Users, {
  foreignKey: "userId",
  as: "User",
});
db.Users.hasMany(db.AssignAssistant, {
  foreignKey: "userId",
  as: "AssignAssistant",
});

db.Department = require("./Department.model")(sequelize, Sequelize);
db.Department.hasMany(db.AssignAssistant, {
  foreignKey: "departmentId",
  as: "Department",
});
db.AssignAssistant.belongsTo(db.Department, {
  foreignKey: "departmentId",
  as: "AssignAssitant",
});

db.Department.hasMany(db.AssignGPTModel, {
  foreignKey: "departmentId",
  as: "GPTDepartment",
});
db.AssignGPTModel.belongsTo(db.Department, {
  foreignKey: "departmentId",
  as: "AssignGPT",
});

module.exports = db;
