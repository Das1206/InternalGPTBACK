const _ = require("lodash");
const { Department, Users } = require("../Models");
const { validateDepartment } = require("../Models/Department.model");
const { Sequelize } = require("sequelize");

// Register a new user
exports.create = async (req, res) => {
  const { error } = validateDepartment(_.pick(req.body, ["title"]));
  if (error)
    return res
      .status(400)
      .send({ message: error.details[0].message.replace(/"/g, "") });
  try {
    const isExist = await Department.findOne({
      where: { title: req.body.title },
    });

    if (isExist) {
      return res.status(400).send({ message: "Enter unique name." });
    }
    await Department.create({
      title: req.body.title.trim(),
    });
    res.status(200).send({ message: "Successfully Created. " });
  } catch (error) {
    console.error("Error during conversation:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

exports.getAll = async (req, res) => {
  try {
    const list = await Department.findAll({
      attributes: [
        "id",
        "title",
        [
          Sequelize.literal(
            "(SELECT COUNT(*) FROM Users WHERE Users.department = Department.title AND Users.isActive = true)"
          ),
          "userCount",
        ],
      ],
    });

    res.status(200).send({ list });
  } catch (error) {
    console.error("Error during conversation:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).send("Id is required.");

    const dep = await Department.findByPk(id);
    if (!dep) {
      return res.status(404).send({ message: "Department not found." });
    }
    await dep.destroy();
    return res
      .status(200)
      .send({ message: "Department deleted successfully." });
  } catch (error) {
    console.error("Error during user deletion:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};
