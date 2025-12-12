const _ = require("lodash");
const { Users, AssignGPTModel, GPTModels, Department } = require("../Models");
const { validateAssignModel } = require("../Models/AssignGPT.model");
const { Op } = require("sequelize");
// CREATE MODEL
exports.add = async (req, res) => {
  try {
    const { error } = validateAssignModel(_.pick(req.body, ["modelId"]));
    if (error)
      return res
        .status(400)
        .send({ message: error.details[0].message.replace(/"/g, "") });

    const { userId, modelId, departmentId } = req.body;

    if (userId === req.user.id)
      return res.status(400).send({ message: "You cannot assign to self." });

    if (userId) {
      const checkAssign = await AssignGPTModel.findOne({
        where: { userId, modelId },
      });
      if (checkAssign)
        return res.status(400).send({ message: "Model is already assigned." });

      const userCheck = await Users.findByPk(userId);
      if (!userCheck)
        return res.status(400).send({ message: "User not found" });
    } else if (departmentId) {
      const checkAssign = await AssignGPTModel.findOne({
        where: { departmentId, modelId },
      });
      if (checkAssign)
        return res.status(400).send({ message: "Model is already assigned." });
    }
    const existingModel = await GPTModels.findByPk(modelId);
    if (!existingModel)
      return res.status(400).send({ message: "Model Not found." });

    await AssignGPTModel.create({
      userId: userId ? userId : null,
      departmentId: departmentId ? departmentId : null,
      modelId: modelId,
    });
    res.status(201).send({ message: "Successfully Assigned." });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Internal server error." });
  }
};

// MODELS LIST ASSIGNED TO ME
exports.getMyAssignModels = async (req, res) => {
  try {
    var assignModels = [];
    const department = await Department.findOne({
      where: { title: req.user.department },
    });
    if (department) {
      // use to get the model ids
      const modelIds = await AssignGPTModel.findAll({
        where: { departmentId: department.dataValues?.id },
      });
      if (modelIds) {
        const modelData = modelIds.map(
          async (m) => (model = await GPTModels.findByPk(m.dataValues?.modelId))
        );
        assignModels = await Promise.all(modelData);
        assignModels = assignModels.map((a) => {
          return { ...a.dataValues, isEdit: false };
        });
      }
    }
    const models = await AssignGPTModel.findAll({
      where: {
        userId: req.user.id,
        // [Op.or]: [{ departmentId: req.user.department }],
      },
      include: [
        {
          model: GPTModels,
          as: "GPTModel",
          attributes: {
            exclude: ["userId", "systemPrompt", "type", "modelType"],
          },
        },
      ],
    });
    const modelList = models.map((m) => m.GPTModel);
    res.status(200).send({ models: [...modelList, ...assignModels] });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Internal server error." });
  }
};

// CHECK ASSIGN WITH USER & MODEL DETAILS
exports.assignModelList = async (req, res) => {
  try {
    const models = await AssignGPTModel.findAll({
      include: [
        {
          model: Users,
          as: "User",
          attributes: ["name", "department"],
        },
        {
          model: Department,
          as: "AssignGPT",
          attributes: ["title"],
        },
        {
          model: GPTModels,
          as: "GPTModel",
          attributes: ["name"],
        },
      ],
    });

    const list = models.map((model) => {
      return {
        id: model.id,
        userId: model.userId,
        modelId: model.modelId,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
        username: model.User
          ? model.User.name
          : model.AssignGPT
          ? model.AssignGPT.title
          : "---",
        modelName: model.GPTModel ? model.GPTModel.name : null,
      };
    });

    res.status(201).send({ models: list });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Internal server error." });
  }
};

// DELETE ASSIGN MODEL
exports.delete = async (req, res) => {
  try {
    const { assignId } = req.body;
    if (!assignId)
      return res.status(400).send({ message: "Assign Id is required" });

    const checkAssign = await AssignGPTModel.findByPk(assignId);
    if (!checkAssign)
      return res.status(400).send({ message: "Assigne not found." });

    await checkAssign.destroy();
    res.status(201).send({ message: "Successfully Deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Internal server error." });
  }
};
