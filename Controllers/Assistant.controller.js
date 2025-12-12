const {
  validateAssistant,
  validateAssistantChat,
} = require("../Models/Assistants.model");
const _ = require("lodash");
const {
  Assistants,
  Chats,
  ChatHistory,
  AssignAssistant,
} = require("../Models");
const openai = require("./../Startup/OpenAi");
const fs = require("fs");

exports.add = async (req, res) => {
  try {
    const { error } = validateAssistant(
      _.pick(req.body, ["assistantId", "name", "description"])
    );
    if (error)
      return res
        .status(400)
        .send({ message: error.details[0].message.replace(/"/g, "") });

    const { description, name, assistantId } = req.body;
    const checkName = await Assistants.findOne({
      where: {
        userId: req.user.id,
        name: name,
      },
    });
    if (checkName)
      return res.status(400).send({ message: "Enter unique name." });

    const existingAssistant = await Assistants.findOne({
      where: {
        userId: req.user.id,
        assistantId: assistantId,
      },
    });
    if (existingAssistant)
      return res.status(400).send({ message: "Assistant already added." });

    await Assistants.create({
      userId: req.user.id,
      assistantId,
      name,
      description,
    });
    return res
      .status(200)
      .send({ message: "Successfully new assistant added.." });
  } catch (error) {
    console.error("Error during conversation:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

exports.getAll = async (req, res) => {
  try {
    const list = await Assistants.findAll({
      where: { userId: req.user.id },
      attributes: {
        exclude: ["userId"],
      },
    });
    res.status(200).send({ assistants: list });
  } catch (error) {
    console.error("Error during :", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).send("Assistant Id is required.");
    const assistant = await Assistants.findByPk(id);
    if (!assistant) {
      return res.status(404).send({ message: "Assistant not found." });
    }
    await AssignAssistant.destroy({
      where: { assistantId: id },
    });
    await assistant.destroy();
    return res.status(200).send({ message: "Assistant deleted successfully." });
  } catch (error) {
    console.error("Error during deletion:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

exports.chat = async (req, res) => {
  try {
    const { error } = validateAssistantChat(
      _.pick(req.body, ["assistantId", "query"])
    );
    if (error)
      return res
        .status(400)
        .send({ message: error.details[0].message.replace(/"/g, "") });

    const { chatId, query, assistantId } = req.body;

    const assistantDetails = await Assistants.findByPk(assistantId);
    if (!assistantDetails)
      return res.status(400).send({ message: "Assistant not found." });

    let file = null;
    if (req.file) {
      // Upload file to OpenAI
      file = await openai.files.create({
        file: fs.createReadStream("./uploads/" + req.file.originalname),
        purpose: "assistants",
      });
    }
    // let history = [];
    // if (chatId) {
    //   const chatHistory = await ChatHistory.findAll({
    //     where: { chatId: chatId },
    //     limit: 8,
    //     order: [["id", "DESC"]],
    //   });
    //   history = chatHistory.map((chat) => {
    //     return {
    //       role: chat.role == "bot" ? "user" : "user",
    //       content: chat.content || "",
    //     };
    //   });
    // }

    // Create a Thread
    const threadResponse = await openai.beta.threads.create();
    const threadId = threadResponse.id;
    // history?.map(async (message) => {
    //   await openai.beta.threads.messages.create(threadId, message);
    // });
    // Add a Message to a Thread
    const messageData = {
      role: "user",
      content: query,
    };
    // Add file ID to the message if a file was uploaded
    if (file) {
      messageData.file_ids = [file.id];
    }

    await openai.beta.threads.messages.create(threadId, messageData);
    // Run the Assistant
    const runResponse = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantDetails.assistantId,
    });

    // Check the Run status
    let run = await openai.beta.threads.runs.retrieve(threadId, runResponse.id);
    while (run.status !== "completed") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      run = await openai.beta.threads.runs.retrieve(threadId, runResponse.id);
    }

    // Display the Assistant's Response
    const messagesResponse = await openai.beta.threads.messages.list(threadId);
    const assistantResponses = messagesResponse.data.filter(
      (msg) => msg.role === "assistant"
    );
    const response = assistantResponses
      .map((msg) =>
        msg.content
          .filter((contentItem) => contentItem.type === "text")
          .map((textContent) => textContent.text.value)
          .join("\n")
      )
      .join("\n");

    if (chatId) {
      let chatHistoryRecords = [
        { content: query, chatId: chatId, role: "user" },
        { content: response, chatId: chatId, role: "bot" },
      ];
      if (req.file?.originalname) {
        chatHistoryRecords = [
          {
            content: req.file.originalname,
            type: "image",
            chatId: chatId,
            role: "user",
          },
          ...chatHistoryRecords,
        ];
      }
      await ChatHistory.bulkCreate(chatHistoryRecords);
      return res.status(200).send({
        chatId: chatId,
        result: { role: "bot", content: response },
      });
    } else {
      let title = "";
      if (query.length > 10) title = query.substr(0, 10) + "...";
      else title = query;
      const chat = await Chats.create({
        title: title,
        userId: req.user.id,
        model: `a_${assistantId}`,
      });
      const chatHistoryRecords = [
        { content: query, chatId: chat.id, role: "user" },
        { content: response, chatId: chat.id, role: "bot" },
      ];
      await ChatHistory.bulkCreate(chatHistoryRecords);
      res.status(200).send({
        chatId: chat.id,
        result: { role: "bot", content: response },
      });
    }
  } catch (error) {
    console.error("Error during conversation:", error.message);
    res
      .status(500)
      .send({ message: error.message || "Incorrect assistant id." });
  }
};
