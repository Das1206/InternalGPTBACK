const assistant = require("./../Controllers/Assistant.controller");
const router = require("express").Router();
const auth = require("./../Middlware/Auth");
const admin = require("./../Middlware/Admin");
const upload = require("./../Startup/multer");
module.exports = (app) => {
  router.post("/add", admin, assistant.add);
  router.get("/", admin, assistant.getAll);
  router.delete("/:id", admin, assistant.delete);

  router.post("/chat", upload.single("file"), assistant.chat);

  app.use("/api/assistant", auth, router);
};
