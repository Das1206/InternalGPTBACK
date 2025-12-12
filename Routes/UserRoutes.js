const user = require("./../Controllers/Users.controller");
const router = require("express").Router();
const auth = require("./../Middlware/Auth");
const admin = require("./../Middlware/Admin");

module.exports = (app) => {
  router.post("/auth", user.login);

  router.post("/add", auth, admin, user.register);
  router.get("/memebers", auth, admin, user.getAll);
  router.delete("/:id", auth, admin, user.deleteUser);
  router.post("/update-user", auth, admin, user.updateUser);

  router.get("/whoami", auth, user.whoami);

  app.use("/api/user", router);
};
