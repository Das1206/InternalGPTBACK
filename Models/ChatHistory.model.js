module.exports = (sequelize, Sequelize) => {
  const ChatHistory = sequelize.define("ChatHistory", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      unique: true,
    },
    content: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    role: {
      type: Sequelize.STRING, // bot , user
      allowNull: false,
    },
    chatId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    type: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: "text",
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
  });
  return ChatHistory;
};
