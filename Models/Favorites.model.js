const Joi = require("joi");

module.exports = (sequelize, Sequelize) => {
  const Favorites = sequelize.define("Favorites", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      unique: true,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    modelId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    isFavorite: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
  });

  return Favorites;
};

function validateFavorites(fav) {
  const schema = Joi.object({
    modelId: Joi.number().integer().required().label("Model Id"),
    isFavorite: Joi.boolean().required().label("isFavorite"),
  });
  return schema.validate(fav);
}

module.exports.validateFavorites = validateFavorites;
