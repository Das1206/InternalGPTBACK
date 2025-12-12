const Joi = require("joi");

module.exports = (sequelize, Sequelize) => {
  const Chats = sequelize.define("Chats", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      unique: true,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    model: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
  });
  return Chats;
};

function validateChat(user) {
  const schema = Joi.object({
    modelId: Joi.required().label("Model Id"),
    query: Joi.string().min(1).required().label("Query"),
  });

  return schema.validate(user);
}

module.exports.validateChat = validateChat;
