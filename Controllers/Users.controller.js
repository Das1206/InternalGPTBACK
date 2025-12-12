const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { Users, GPTModels, AssignGPTModel, Chats } = require("./../Models");
const {
  validateLogin,
  validateUser,
  validateUpdateUser,
} = require("../Models/Users.model");
const _ = require("lodash");

// LOGIN USER
exports.login = (req, res) => {
  const { error } = validateLogin(req.body);
  if (error)
    return res
      .status(400)
      .send({ message: error.details[0].message.replace(/"/g, "") });

  Users.findOne({ where: { email: req.body.email } })
    .then((user) => {
      if (!user)
        return res.status(404).send({ message: "Invalid email & password." });

      const passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );
      if (!passwordIsValid) {
        return res.status(401).send({
          message: "Incorrent email & password.",
        });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role, department: user.department },
        process.env.JWT_SECRET
      );
      res.status(200).send({
        token: token,
        user: {
          name: user.name,
          email: user.email,
          department: user.department,
          role: user.role,
        },
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({ message: "Internal server error." });
    });
};

// Register a new user
exports.register = async (req, res) => {
  const { error } = validateUser(req.body);
  if (error)
    return res
      .status(400)
      .send({ message: error.details[0].message.replace(/"/g, "") });
  try {
    const existingUser = await Users.findOne({
      where: { email: req.body.email },
    });

    if (existingUser) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    const newUser = {
      name: req.body.name,
      email: req.body.email,
      department: req.body.department,
      password: bcrypt.hashSync(req.body.password, 10),
    };

    await Users.create(newUser);
    res.status(200).send({ message: "Successfully Registered. " });
  } catch (error) {
    console.error("Error during conversation:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

exports.updateUser = async (req, res) => {
  const { error } = validateUpdateUser(_.pick(req.body, ["id"]));
  if (error) {
    return res
      .status(400)
      .send({ message: error.details[0].message.replace(/"/g, "") });
  }
  const { id, name, department, role } = req.body;
  try {
    const existingUser = await Users.findByPk(id);

    if (!existingUser) {
      return res.status(404).send({ message: "User not found." });
    }
    if (name) {
      existingUser.name = name;
    }
    if (department) {
      existingUser.department = department;
    }
    if (role) {
      existingUser.role = role;
    }
    await existingUser.save();
    res.status(200).send({ message: "User information successfully updated." });
  } catch (error) {
    console.error("Error during user update:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

exports.whoami = async (req, res) => {
  try {
    const user = await Users.findByPk(req.user.id, {
      attributes: { exclude: ["password", "isActive"] },
    });
    res.status(200).send({ user });
  } catch (error) {
    console.error("Error during conversation:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

async function getModelsCount(id) {
  const total = await GPTModels.count({
    where: { userId: id },
  });
  return total;
}
async function getChatsCount(id) {
  const total = await Chats.count({
    where: { userId: id },
  });
  return total;
}
async function getAssignCount(id) {
  const total = await AssignGPTModel.count({
    where: { userId: id },
  });
  return total;
}
exports.getAll = async (req, res) => {
  try {
    const list = await Users.findAll({
      where: { isActive: true },
      attributes: { exclude: ["password", "isActive"] },
    });

    for (const user of list) {
      const modelCount = await getModelsCount(user.id);
      const assignCount = await getAssignCount(user.id);
      const noOfChats = await getChatsCount(user.id);
      user.dataValues.noOfChats = noOfChats;
      user.dataValues.createdModels = modelCount;
      user.dataValues.assignCount = assignCount;
    }

    res.status(200).send({ list });
  } catch (error) {
    console.error("Error during conversation:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(400).send("User Id is required.");

    const user = await Users.findByPk(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }
    await user.destroy();
    return res.status(200).send({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error during user deletion:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};
