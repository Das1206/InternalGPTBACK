const dep = require("./../Controllers/Department.controller");
const router = require("express").Router();
const auth = require("./../Middlware/Auth");
const admin = require("./../Middlware/Admin");

module.exports = (app) => {
  router.get("/", dep.getAll);
  router.post("/add", auth, admin, dep.create);
  router.delete("/:id", auth, admin, dep.delete);

  app.use("/api/department", router);
};
