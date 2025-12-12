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
  require("./Startup/Routes")(app);

  const PORT = process.env.PORT || 8000;

  app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));
  app.get("/api", async (req, res) => {
    res.status(200).send({ message: "Welcome to the application." });
  });

  app.listen(PORT, () => Log.info("Server started..." + PORT));
} catch (error) {
  Log.error("App is crashed: " + error);
  console.error("Error during startup:", error);
}
