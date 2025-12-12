const { TokenHistory, Users } = require("../Models");

exports.getAll = async (req, res) => {
  try {
    const history = await TokenHistory.findAll({
      include: [
        {
          model: Users,
          as: "User",
          attributes: ["name", "department"],
        },
      ],
    });
    const list = history.map((h) => ({
      id: h.id,
      query: h.query,
      userId: h.userId,
      department: h.User ? h.User.department : null,
      name: h.User ? h.User.name : null,
      tokens: h.tokens,
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
    }));

    res.status(200).send({ list });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Internal server error." });
  }
};
