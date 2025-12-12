const Joi = require("joi");

module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("User", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      unique: true,
    },
    name: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    role: {
      type: Sequelize.STRING,
      defaultValue: "member",
    },
    department: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
  });
  return User;
};

function validateUser(user) {
  const schema = Joi.object({
    name: Joi.string().min(5).max(50).required().label("Name"),
    email: Joi.string().min(5).max(255).required().email().label("Email"),
    department: Joi.string().min(1).max(255).required().label("Department"),
    password: Joi.string().min(8).max(255).required().label("Password"),
  });

  return schema.validate(user);
}
function validateLogin(user) {
  const schema = Joi.object({
    email: Joi.string().max(255).required().email().label("Email"),
    password: Joi.string().min(8).max(255).required().label("Password"),
  });

  return schema.validate(user);
}
const validateUpdateUser = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
  });

  return schema.validate(data);
};

module.exports.validateUpdateUser = validateUpdateUser;
module.exports.validateLogin = validateLogin;
module.exports.validateUser = validateUser;
