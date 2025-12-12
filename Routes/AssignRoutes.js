const assignModel = require("./../Controllers/AssignGPT.controller");
const assignAssistant = require("./../Controllers/AssignAssistant.controller");
const router = require("express").Router();
const auth = require("./../Middlware/Auth");
const admin = require("./../Middlware/Admin");

module.exports = (app) => {
  // Assign Model
  router.post("/model", admin, assignModel.add);
  router.get("/assign-models", admin, assignModel.assignModelList);
  router.post("/model/remove", admin, assignModel.delete);

  router.get("/model/my-models", assignModel.getMyAssignModels);

  // Assign Assistant
  router.post("/assistant", admin, assignAssistant.add);
  router.post("/assistant/remove", admin, assignAssistant.delete);
  router.get("/assistant/my-assistant", assignAssistant.getMyAssign);
  router.get("/assign-assistant", admin, assignAssistant.assignList);

  app.use("/api/assign", auth, router);
};
