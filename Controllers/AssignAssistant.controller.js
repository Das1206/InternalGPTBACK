const _ = require("lodash");
const { Users, AssignAssistant, Assistants, Department } = require("../Models");
const { validateAssignAssistant } = require("../Models/AssignAssistant.model");

// ASSIGN
exports.add = async (req, res) => {
  try {
    const { userId, assistantId, departmentId } = req.body;
    if (!assistantId) {
      return res.status(400).send({ message: "Assistant Id is required" });
    }

    if (userId === req.user.id)
      return res.status(400).send({ message: "You cannot assign to self." });
    if (userId) {
      const checkAssign = await AssignAssistant.findOne({
        where: { userId, assistantId },
      });
      if (checkAssign)
        return res
          .status(400)
          .send({ message: "Assistant is already assigned." });

      if (userId !== 0) {
        const userCheck = await Users.findByPk(userId);
        if (!userCheck)
          return res.status(400).send({ message: "User not found" });
      }
    } else if (departmentId) {
      const checkAssign = await AssignAssistant.findOne({
        where: { departmentId, assistantId },
      });
      if (checkAssign)
        return res
          .status(400)
          .send({ message: "Assistant is already assigned." });
    }
    const existingModel = await Assistants.findByPk(assistantId);
    if (!existingModel)
      return res.status(400).send({ message: "Assistant Not found." });

    await AssignAssistant.create({
      userId: userId ? userId : null,
      departmentId: departmentId ? departmentId : null,
      assistantId: assistantId,
    });
    res.status(201).send({ message: "Successfully Assigned." });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Internal server error." });
  }
};

// LIST ASSIGNED TO ME
exports.getMyAssign = async (req, res) => {
  try {
    var assignAssistants = [];
    const department = await Department.findOne({
      where: { title: req.user?.department },
    });
    if (department) {
      // use to get the model ids
      const modelIds = await AssignAssistant.findAll({
        where: { departmentId: department.dataValues?.id },
      });
      if (modelIds) {
        const modelData = modelIds.map(
          async (m) => (model = await GPTModels.findByPk(m.dataValues?.modelId))
        );
        assignAssistants = await Promise.all(modelData);
        assignAssistants = assignAssistants.map((a) => {
          return { ...a.dataValues, isEdit: false };
        });
      }
    }

    const list = await AssignAssistant.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Assistants,
          as: "Assistant",
          attributes: ["name"],
        },
      ],
    });
    const assList = list.map((m) => m.assistants);

    res.status(200).send({ assistants: [...assList, ...assignAssistants] });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Internal server error." });
  }
};

// CHECK ASSIGN WITH USER & MODEL DETAILS
exports.assignList = async (req, res) => {
  try {
    const models = await AssignAssistant.findAll({
      include: [
        {
          model: Users,
          as: "User",
          attributes: ["name", "department"],
        },
        {
          model: Department,
          as: "AssignAssitant",
          attributes: ["title"],
        },
        {
          model: Assistants,
          as: "Assistant",
          attributes: ["name"],
        },
      ],
    });
    const list = models.map((model) => {
      return {
        id: model.id,
        userId: model.userId,
        assistantId: model.assistantId,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
        username: model.User
          ? model.User.name
          : model.AssignAssitant
          ? model.AssignAssitant.title
          : "---",
        assistant: model.Assistant ? model.Assistant.name : null,
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
    const { error } = validateAssignAssistant(_.pick(req.body, ["assignId"]));
    if (error)
      return res
        .status(400)
        .send({ message: error.details[0].message.replace(/"/g, "") });

    const { assignId } = req.body;

    const checkAssign = await AssignAssistant.findByPk(assignId);
    if (!checkAssign)
      return res.status(400).send({ message: "Assigne not found." });

    await checkAssign.destroy();
    res.status(201).send({ message: "Successfully Deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Internal server error." });
  }
};
