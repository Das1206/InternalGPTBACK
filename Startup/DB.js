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
// Drop the  table
const dropSubCategoriesTable = async () => {
  try {
    await db.AssignGPTModel.drop();
    console.log(" table dropped successfully.");
  } catch (error) {
    console.error("Error dropping S table:", error);
  }
};

db.sequelize
  .sync()
  .then(async () => {
    await initializeDefaultAdmin();
    Log.info("Database synchronized successfully.");
  })
  .catch((err) => {
    Log.error("Error synchronizing database:", err);
  });