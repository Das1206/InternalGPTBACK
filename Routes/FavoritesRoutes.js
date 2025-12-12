const router = require("express").Router();
const auth = require("./../Middlware/Auth");
const fav = require("./../Controllers/Favorites.controller");

module.exports = (app) => {
  router.post("/", fav.create);
  router.get("/", fav.getAll);

  app.use("/api/favorite", auth, router);
};
