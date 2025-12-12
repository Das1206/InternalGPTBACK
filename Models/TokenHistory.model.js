const Joi = require("joi");

module.exports = (sequelize, Sequelize) => {
  const TokenHistory = sequelize.define("TokenHistory", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      unique: true,
    },
    query: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    department: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: "null",
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    tokens: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
  });
  return TokenHistory;
};
function validateTokens(user) {
  const schema = Joi.object({
    userId: Joi.required().label("User Id"),
    tokens: Joi.required().label("Tokens"),
    query: Joi.string().min(1).required().label("Query"),
  });

  return schema.validate(user);
}

module.exports.validateTokens = validateTokens;
