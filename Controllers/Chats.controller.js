const OpenAI = require("openai");
const { GPTModels, Chats, ChatHistory, TokenHistory } = require("../Models");
const { validateChat } = require("../Models/Chats.model");
const openai = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const _ = require("lodash");
const fs = require("fs").promises;
const { Op } = require("sequelize");

async function saveImage(base64ImageData) {
  // Decode the Base64 image data
  const base64Image = base64ImageData.replace(/^data:image\/jpeg;base64,/, "");
  const imageBuffer = Buffer.from(base64Image, "base64");

  // Generate a unique filename for the image
  const imageFilename = `${uuidv4()}.jpg`;
  const imagePath = path.join("uploads", imageFilename);

  try {
    await fs.writeFile(imagePath, imageBuffer);
    console.log("Image saved successfully:", imagePath);
    return imageFilename;
  } catch (err) {
    console.error("Error saving image:", err);
    throw err;
  }
}
function removeLeadingGreaterThanSign(str) {
  if (str.startsWith(">")) {
    return str.slice(1); // Remove the first character (">")
  } else {
    return str;
  }
}

exports.create = async (req, res) => {
  const userId = req.user.id;
  try {
    const { error } = validateChat(_.pick(req.body, ["modelId", "query"]));
    if (error)
      return res
        .status(400)
        .send({ message: error.details[0].message.replace(/"/g, "") });

    const { modelId, query, chatId } = req.body;
    const modelData = await GPTModels.findByPk(modelId);

    let messages = [
      { role: "system", content: modelData.systemPrompt || "" },
      {
        role: "user",
        content: [
          { type: "text", text: query.trim() },
          ...(req.body.imageUrl
            ? [{ type: "image_url", image_url: req.body.imageUrl }]
            : []),
        ],
      },
    ];
    let history = [];
    if (chatId) {
      const chatHistory = await ChatHistory.findAll({
        where: { chatId: chatId },
        limit: 8,
        order: [["id", "DESC"]],
      });
      history = chatHistory.map((chat) => {
        return {
          role: chat.role == "bot" ? "assistant" : "user",
          content: chat.content || "",
        };
      });
    }
    const completion = await openai.chat.completions.create({
      messages: [...history, ...messages],
      model: removeLeadingGreaterThanSign(
        modelData.modelType.trim() || "gpt-3.5-turbo"
      ),
      max_tokens: 4096,
    });

    const resp = completion.choices[0].message.content;
    if (chatId) {
      const isChat = await Chats.findOne({
        where: { id: chatId, userId: req.user.id },
      });
      if (isChat) {
        let chatHistoryRecords = [
          { content: query.trim(), chatId: chatId, role: "user" },
          { content: resp, chatId: chatId, role: "bot" },
        ];
        if (req.body.imageUrl) {
          const fileName = await saveImage(req.body.imageUrl);
          chatHistoryRecords = [
            {
              content: fileName,
              type: "image",
              chatId: chatId,
              role: "user",
            },
            ...chatHistoryRecords,
          ];
        }
        await ChatHistory.bulkCreate(chatHistoryRecords);
        const chatMesg = {
          query: query.trim(),
          userId: userId,
          tokens: completion.usage.total_tokens || 0,
        };
        await TokenHistory.create(chatMesg);

        res
          .status(200)
          .send({ chatId: chatId, result: { role: "bot", content: resp } });
      } else {
        let title = "";

        if (query.length > 10) title = query.substr(0, 10) + "...";
        else title = query;
        const chat = await Chats.create({
          title: title,
          userId,
          model: modelId,
        });

        await ChatHistory.create({
          content: query,
          chatId: chat.id,
          role: "user",
        });

        await ChatHistory.create({
          content: resp,
          chatId: chat.id,
          role: "bot",
        });
        const chatMesg = {
          query: query,
          userId: userId,
          tokens: completion.usage.total_tokens || 0,
          department: req.user.department || "Not mentioned",
        };
        await TokenHistory.create(chatMesg);
        res
          .status(200)
          .send({ chatId: chat.id, result: { role: "bot", content: resp } });
      }
    } else {
      let title = "";

      if (query.length > 10) title = query.substr(0, 10) + "...";
      else title = query;

      const chat = await Chats.create({
        title: title,
        userId,
        model: modelId,
      });
      await ChatHistory.create({
        content: query,
        chatId: chat.id,
        role: "user",
      });

      await ChatHistory.create({
        content: resp,
        chatId: chat.id,
        role: "bot",
      });
      const chatMesg = {
        query: query,
        userId: userId,
        tokens: completion.usage.total_tokens || 0,
        department: req.user.department || "Not mentioned",
      };
      await TokenHistory.create(chatMesg);
      res
        .status(200)
        .send({ chatId: chat.id, result: { role: "bot", content: resp } });
    }
  } catch (err) {
    // console.error(err);
    res.status(500).send({ message: err.message || "Internal server error." });
  }
};

exports.getChats = async (req, res) => {
  try {
    const userId = req.user.id;
    const chats = await Chats.findAll({
      where: { userId },
      order: [["id", "DESC"]],
      attributes: {
        exclude: ["userId"],
      },
    });
    res.status(200).send({ chats: chats });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Internal server error." });
  }
};
exports.getChatHistoryById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).send({ message: "Chat id is required." });
    const page = req.params.page || 1;

    const pageSize = 10;
    const offset = (page - 1) * pageSize;

    const chats = await ChatHistory.findAll({
      where: { chatId: id },
      limit: pageSize + 1, // one extra record to check if there are more pages
      offset: offset,
      order: [["id", "DESC"]],
    });

    // Check if there are more pages
    const hasNextPage = chats.length > pageSize;

    // Remove the extra record used for checking
    const trimmedChats = hasNextPage ? chats.slice(0, pageSize) : chats;

    res.status(200).send({
      chats: trimmedChats.reverse(),
      nextPage: hasNextPage ? page + 1 : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Internal server error." });
  }
};

exports.deleteById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).send({ messsage: "Id is required." });
    await Chats.destroy({
      where: { id: id },
    });

    await ChatHistory.destroy({
      where: { chatId: id },
    });
    res.status(200).send({ messsage: "Successfully Deleted.." });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Internal server error." });
  }
};

exports.updateTitle = async (req, res) => {
  try {
    const { chatId, title } = req.body;

    if (!chatId)
      return res.status(400).send({ message: "Chat Id is required." });

    if (!title || title.trim() === "")
      return res.status(400).send({ message: "Chat title is required." });

    await Chats.update({ title: title }, { where: { id: chatId } });

    res.status(200).send({ message: "Successfully Updated." });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Internal server error." });
  }
};
exports.clearHistory = async (req, res) => {
  try {
    // Step 1: Fetch chatId values for the specified user
    const chatIds = await Chats.findAll({
      attributes: ["id"],
      where: { userId: req.user.id },
    });

    if (chatIds.length === 0) {
      return res
        .status(200)
        .send({ message: "No chat records found for deletion." });
    }

    const chatIdValues = chatIds.map((chat) => chat.id);

    // Step 2: Delete records from ChatHistory
    await ChatHistory.destroy({
      where: { chatId: { [Op.in]: chatIdValues } },
    });

    // Step 3: Delete records from Chats
    await Chats.destroy({
      where: { userId: req.user.id },
    });

    res.status(200).send({ message: "Successfully Deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Internal server error." });
  }
};
