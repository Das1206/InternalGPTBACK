const Joi = require("joi");

module.exports = (sequelize, Sequelize) => {
  const AssignModel = sequelize.define("AssignModel", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      unique: true,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    departmentId: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    modelId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
  });

  return AssignModel;
};

function validateAssignModel(fav) {
  const schema = Joi.object({
    modelId: Joi.number().integer().required().label("Model Id"),
    // userId: Joi.number().integer().required().label("User Id"),
  });
  return schema.validate(fav);
}

module.exports.validateAssignModel = validateAssignModel;
