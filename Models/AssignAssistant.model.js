const Joi = require("joi");

module.exports = (sequelize, Sequelize) => {
  const AssignAssistant = sequelize.define("AssignAssistant", {
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
    assistantId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
  });

  return AssignAssistant;
};

function validateAssignAssistant(fav) {
  const schema = Joi.object({
    assignId: Joi.number().integer().required().label("Assign Id"),
    // userId: Joi.number().integer().label("User Id"),
    // departmentId: Joi.number().integer().label("Department Id"),
  });
  return schema.validate(fav);
}

module.exports.validateAssignAssistant = validateAssignAssistant;
