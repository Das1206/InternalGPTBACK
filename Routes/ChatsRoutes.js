const chat = require("./../Controllers/Chats.controller");
const router = require("express").Router();
const auth = require("./../Middlware/Auth");

module.exports = (app) => {
  router.post("/create", chat.create);
  router.get("/", chat.getChats);
  router.get("/history/:id/:page?", chat.getChatHistoryById);

  router.delete("/clear-history", chat.clearHistory);
  router.delete("/:id", chat.deleteById);
  router.post("/title-update", chat.updateTitle);

  app.use("/api/chats", auth, router);
};
