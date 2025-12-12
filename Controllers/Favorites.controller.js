const { Favorites, GPTModels } = require("../Models");
const { validateFavorites } = require("../Models/Favorites.model");

exports.create = async (req, res) => {
  try {
    const { error } = validateFavorites(req.body);
    if (error)
      return send({ message: error.details[0].message.replace(/"/g, "") });

    const existingFavorite = await Favorites.findOne({
      where: { userId: req.user.id, modelId: req.body.modelId },
    });

    if (existingFavorite) {
      await existingFavorite.destroy();
      return res.status(200).send({ message: "Successfully updated." });
    }

    await Favorites.create({
      userId: req.user.id,
      modelId: req.body.modelId,
      isFavorite: req.body.isFavorite,
    });

    res.status(200).send({ message: "Successfully added to favorite." });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Internal server error." });
  }
};

exports.getAll = async (req, res) => {
  try {
    const list = await Favorites.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: GPTModels,
          as: "GPTModel",
          attributes: {
            exclude: ["userId"],
          },
        },
      ],
    });

    const models = list.map((favorite) => favorite.GPTModel);
    res.status(200).send({ models });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Internal server error." });
  }
};
