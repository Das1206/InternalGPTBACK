const _ = require("lodash");
const {
  GPTModels,
  sequelize,
  Favorites,
  AssignGPTModel,
  Department,
} = require("../Models");
const { validateGPTModel } = require("../Models/GPTModels.model");

// CREATE MODEL
exports.create = async (req, res) => {
  try {
    const { error } = validateGPTModel(
      _.pick(req.body, ["name", "modelType", "description", "systemPrompt"])
    );
    if (error)
      return res
        .status(400)
        .send({ message: error.details[0].message.replace(/"/g, "") });

    const userId = req.user ? req.user.id : 0;

    const existingModel = await GPTModels.findOne({
      where: { userId: userId, name: req.body.name },
    });
    if (existingModel)
      return res.status(400).send({ message: "Enter unique name." });

    const newModel = await GPTModels.create({
      name: req.body.name,
      userId: req.user.id,
      modelType: req.body.modelType,
      description: req.body.description,
      systemPrompt: req.body.systemPrompt,
      allowFile: req.body.allowFile ? req.body.allowFile : false,
    });
    res
      .status(201)
      .send({ message: "Successfully new model is created.", model: newModel });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Internal server error." });
  }
};

// UPDATE MODEL
exports.update = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).send({ message: "ID is required." });
    }
    const { error } = validateGPTModel(
      _.pick(req.body, ["name", "modelType", "description", "systemPrompt"])
    );

    if (error) {
      return res
        .status(400)
        .send({ message: error.details[0].message.replace(/"/g, "") });
    }

    const userId = req.user.id;

    // Find the existing model to update
    const existingModel = await GPTModels.findOne({
      where: { userId: userId, id: req.params.id },
    });

    if (!existingModel) {
      return res.status(404).send({ message: "Model not found." });
    }
    // Update the existing model
    await existingModel.update({
      name: req.body.name,
      modelType: req.body.modelType,
      description: req.body.description,
      systemPrompt: req.body.systemPrompt,
      allowFile: req.body.allowFile || false,
    });

    res.status(200).send({
      message: "Successfully updated the model.",
      model: existingModel,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Internal server error." });
  }
};

// GET LIST OF MODELS
exports.getAll = async (req, res) => {
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
        async (m) => (model = await GPTModels.findByPk(m.dataValues.modelId))
      );
      assignModels = await Promise.all(modelData);
    }
  }

  try {
    var myModels = await GPTModels.findAll({
      where: { userId: req.user.id },
      attributes: {
        exclude: ["userId", "modelType"],
        include: [
          [
            sequelize.literal(
              `(SELECT COUNT(*) FROM Favorites WHERE Favorites.modelId = GPTModels.id AND Favorites.userId = ${req.user.id}) > 0`
            ),
            "isFavorite",
          ],
        ],
      },
    });

    const modelsWithFavorites = myModels.map((model) => ({
      ...model.dataValues,
      isFavorite: model.dataValues.isFavorite
        ? model.dataValues.isFavorite
        : false,
    }));

    const publicModels = await GPTModels.findAll({ where: { type: "public" } });
    const allModels = [
      ...modelsWithFavorites,
      ...publicModels.filter(
        (publicModel) =>
          !myModels.some((myModel) => myModel.id === publicModel.id)
      ),
    ];
    const companyModels = await GPTModels.findAll();
    res.status(200).send({
      models: [...allModels, ...assignModels],
      companyModels: companyModels || [],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Something went wrong." });
  }
};

// DELETE MODEL
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).send("Id is required.");

    const model = await GPTModels.findByPk(id, {
      where: { userId: req.user.id },
    });
    if (!model) {
      return res.status(404).send({ message: "Model not found." });
    }
    await Favorites.destroy({
      where: { modelId: id },
    });
    await AssignGPTModel.destroy({
      where: { modelId: id },
    });

    await model.destroy();
    return res.status(200).send({ message: "Model deleted successfully." });
  } catch (error) {
    console.error("Error during deletion:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};
