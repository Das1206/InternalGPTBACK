const Joi = require("joi");

module.exports = (sequelize, Sequelize) => {
  const Assistants = sequelize.define("Assistants", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      unique: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    assistantId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
  });
  return Assistants;
};

function validateAssistant(user) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(255).required().label("Name"),
    assistantId: Joi.string().min(1).max(255).required().label("Assistant Id"),
    description: Joi.string().min(8).required().label("Description"),

  });

  return schema.validate(user);
}

function validateAssistantChat(user) {
  const schema = Joi.object({
    assistantId: Joi.number().min(1).max(255).required().label("Assistant Id"),
    query: Joi.string().min(2).required().label("Query"),
  });

  return schema.validate(user);
}

module.exports.validateAssistantChat = validateAssistantChat;
module.exports.validateAssistant = validateAssistant;
