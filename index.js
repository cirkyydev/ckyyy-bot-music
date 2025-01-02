const express = require('express');
const app = express();
const port = 1643;

app.get('/', (req, res) => res.send('Bot Is Working Well!'));

let config = require('./config.json');


app.listen(port, () => console.log(`listening at http://localhost:${port}`));

//Bot
const {
       Client,
       Collection
      } = require('discord.js-selfbot-v13');
const client = new Client({
  checkUpdate : false
});
const fs = require('fs')
const { 
  Manager
 } = require("erela.js");
 const Spotify = require("erela.js-spotify");
const { token,
        ownerid,
        nodes,
        SpotifyID,
        SpotifySecret
     } = require('./config.json');
    if (!token || !ownerid) {
        console.log('Please Fill Out Config file')
        process.exit()
      }

    
      client.manager = new Manager({
        nodes: nodes,
        plugins: [
          new Spotify({
            clientID: SpotifyID,
            clientSecret: SpotifySecret
          }),
        ],
        send(id, payload) {
          const guild = client.guilds.cache.get(id);
          if (guild) guild.shard.send(payload);
        },
      })

client.commands = new Collection();
this.aliases = new Collection();

const commandFiles = fs.readdirSync('./Commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./Commands/${file}`);
	client.commands.set(command.name, command);
}

fs.readdirSync("./events/Client/").forEach(file => {
    const event = require(`./events/Client/${file}`);
    client.on(event.name, (...args) => event.execute(client, ...args));
});

fs.readdirSync("./events/Lavalink/").forEach(file => {
  const event = require(`./events/Lavalink/${file}`);
  let eventName = file.split(".")[0];
  client.manager.on(eventName, event.execute(null, this));
});
process.on("unhandledRejection", (reason, promise) => {
  try {
    console.error(
      "Unhandled Rejection at: ",
      promise,
      "reason: ",
      reason.stack || reason
    );
  } catch {
    console.error(reason);
  }
});

// Command to set which emoji the bot should react to a user's messages
client.on('message', async (message) => {
  if (message.author.bot) return;

  // Command: .setreact <user> <emoji>
  if (message.content.startsWith('.setreact') && config.ownerid.includes(message.author.id)) {
      const args = message.content.slice('.setreact'.length).trim().split(' ');
      const user = message.mentions.users.first() || client.users.cache.get(args[0]);
      const emoji = args[1];

      if (!user || !emoji) {
          return message.reply("Please mention a user and provide an emoji.");
      }

      // Check if emoji is valid
      const emojiRegex = /<a?:\w+:\d+>|[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B50}\u{2B06}\u{1F004}-\u{1F0CF}\u{2B06}\u{1F91D}\u{2764}\u{1F44D}\u{1F44F}\u{1F91D}\u{1F389}\u{1F680}-\u{1F6FF}\u{1F99B}-\u{1F9FF}\u{1F99D}-\u{1F9FF}\u{1F440}\u{1F44F}\u{1F44D}\u{1F62A}]/gu;
      const isValidEmoji = emojiRegex.test(emoji);

      if (!isValidEmoji) {
          return message.reply("Invalid emoji.");
      }

      // Store user and emoji in config.json
      if (!config.reactions) config.reactions = {};
      config.reactions[user.id] = emoji;

      // Save the updated config.json
      fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

      message.reply(`Bot will now react to ${user.tag}'s messages with ${emoji}.`);
  }

  // React to messages from the user specified in setreact
  if (config.reactions && config.reactions[message.author.id]) {
      const emoji = config.reactions[message.author.id];
      try {
          await message.react(emoji);
          console.log(`Reacted to ${message.author.tag}'s message with ${emoji}.`);
      } catch (error) {
          console.error("Error reacting to message:", error);
      }
  }
});

// Command to set the reply message for mentions of the owner
client.on('message', async (message) => {
  if (message.author.bot) return; // Avoid bot-to-bot interactions

  // Command: .setreplyme 'message'
  if (message.content.startsWith('.setreplyme') && config.ownerid.includes(message.author.id)) {
      const args = message.content.slice('.setreplyme'.length).trim();
      if (!args) {
          return message.reply("Please provide a message to set as the reply.");
      }

      // Store the reply message in config.json
      config.replyMessage = args;
      fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

      message.reply(`Bot will now reply with: "${args}" when the owner is mentioned.`);
  }

  // Skip if the bot sent the message itself
  if (message.author.id === client.user.id) return;

  // Check if the owner's ID is mentioned and send the stored reply message
  if (message.mentions.users.has(config.ownerid[0]) && config.replyMessage) {
      try {
          await message.reply(config.replyMessage);
          console.log(`Replied to mention of the owner with: "${config.replyMessage}"`);
      } catch (error) {
          console.error("Error replying to mention:", error);
      }
  }
});

// Command: .removereact user
// Command: .removereact user
client.on('message', async (message) => {
  // Skip bot messages
  if (message.author.bot) return;

  // Check if the message starts with .removereact and if the author is the bot owner
  if (message.content.startsWith('.removereact') && config.ownerid.includes(message.author.id)) {
      const args = message.content.slice('.removereact'.length).trim();
      const userID = args;

      // Ensure the user ID is provided
      if (!userID) {
          return message.reply("Please provide a user ID to remove reactions.");
      }

      // Check if the user has a reaction stored in the config
      if (!config.reactions || !config.reactions[userID]) {
          return message.reply("No reaction found for this user.");
      }

      // Remove the stored reaction for the user
      delete config.reactions[userID];

      // Save the updated config to the config.json file
      fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

      // Confirm the action
      message.reply(`Removed reactions for user with ID ${userID}.`);
  }
});

// Command: .setreply 'message' 'message to reply with'
client.on('message', async (message) => {
    // Skip the bot's own messages (bot is the selfbot)
    if (message.author.id === client.user.id) return; // This skips messages from the bot itself

    // Check if the message starts with .setreply and if the author is the bot owner
    if (message.content.startsWith('.setreply') && config.ownerid.includes(message.author.id)) {
        const args = message.content.slice('.setreply'.length).trim().split(' ');

        // Ensure correct format
        if (args.length < 2) {
            return message.reply("Please provide both a message to detect and the message to reply with.");
        }

        const messageToDetect = args[0]; // The message to detect
        const replyMessage = args.slice(1).join(' '); // The reply message to send

        // Store the message to detect and the reply message in config.json
        config.replyMessage = {
            detect: messageToDetect.toLowerCase(),  // Store as lowercase for case-insensitive matching
            reply: replyMessage
        };

        // Save the updated config to config.json
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

        // Respond with confirmation
        message.reply(`I will now reply with "${replyMessage}" to messages that match "${messageToDetect}".`);
    }

    // Check if the message contains the configured reply text
    if (config.replyMessage) {
        const messageToDetect = config.replyMessage.detect;
        const replyMessage = config.replyMessage.reply;

        // Case-insensitive matching, skip if it's a message from the bot itself
        if (message.content.toLowerCase().includes(messageToDetect) && message.author.id !== client.user.id) {
            message.reply(replyMessage);
        }
    }
});

client.login("");
