const gptModels = require("./../Controllers/GPTModels.controller");
const router = require("express").Router();
const auth = require("./../Middlware/Auth");

module.exports = (app) => {
  router.post("/", auth, gptModels.create);
  router.post("/update/:id", auth, gptModels.update);
  router.get("/", auth, gptModels.getAll);
  router.delete("/:id", auth, gptModels.delete);

  app.use("/api/models", router);
};
