const OpenAI = require("openai");
module.exports = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });
