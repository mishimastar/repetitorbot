import TelegramBot from "node-telegram-bot-api";

// replace the value below with the Telegram token you receive from @BotFather
const token = "7038133529:AAFmIj2-uJDAJIAhAQlJUDUW6KfsyKx954M";

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });
const whitelist = new Set([857880458]);
// const chatwhitelist = new Set([-4166982055, 857880458]);

// Matches "/echo [whatever]"
// eslint-disable-next-line @typescript-eslint/no-misused-promises
bot.onText(/\/start (.+)/, async (msg, match) => {
  if (!msg.from?.id || !whitelist.has(msg.from?.id)) return;
  //   if (!msg.chat.id || !chatwhitelist.has(msg.chat.id)) return;
  console.log(msg);
  if (!match) return;
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]!; // the captured "whatever"

  // send back the matched "whatever" to the chat
  await bot.sendMessage(chatId, resp);
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on("message", async (msg) => {
  if (!msg.from?.id || !whitelist.has(msg.from?.id)) return;
  //   if (!msg.chat.id || !chatwhitelist.has(msg.chat.id)) return;

  const chatId = msg.chat.id;

  // send a message to the chat acknowledging receipt of their message
  await bot.sendMessage(chatId, "че ты хочишь");
});
