const Joi = require("joi");

module.exports = (sequelize, Sequelize) => {
  const Department = sequelize.define("Department", {
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
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
  });
  return Department;
};

function validateDepartment(user) {
  const schema = Joi.object({ 
    title: Joi.string().min(1).required().label("Title"),
  });

  return schema.validate(user);
}

module.exports.validateDepartment = validateDepartment;
