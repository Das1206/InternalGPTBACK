const Joi = require("joi");

module.exports = (sequelize, Sequelize) => {
  const GPTModels = sequelize.define("GPTModels", {
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
    modelType: {
      type: Sequelize.STRING, // gpt-3, gpt-4
      allowNull: false,
    },
    systemPrompt: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    type: {
      type: Sequelize.STRING, // public , priv
      defaultValue: "private",
    },
    allowFile: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
  });
  return GPTModels;
};

function validateGPTModel(model) {
  const schema = Joi.object({
    name: Joi.string().min(2).required().label("Name"),
    systemPrompt: Joi.string().min(8).required().label("System Prompt"),
    description: Joi.string().min(8).required().label("Description"),
    modelType: Joi.string()
      .min(3)
      .max(100)
      .required()
      .label("Model Type (GPT-3)"),
  });

  return schema.validate(model);
}

module.exports.validateGPTModel = validateGPTModel;
