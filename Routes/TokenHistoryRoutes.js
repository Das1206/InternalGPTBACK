const token = require("./../Controllers/TokenHistory.controller");
const router = require("express").Router();
const auth = require("./../Middlware/Auth");
const admin = require("./../Middlware/Admin");

module.exports = (app) => {
  router.get("/", admin, token.getAll);

  app.use("/api/token-history", auth, router);
};
