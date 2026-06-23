require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
const fs = require('fs');

const CHANNELS_TO_CAPTURE = ['questions'];
const FILE = 'messages.json';

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ]
});

client.once('clientReady', () => {
  console.log(`Bot is online as ${client.user.tag}`);
});

function loadData() {
  if (fs.existsSync(FILE)) {
    return JSON.parse(fs.readFileSync(FILE));
  }
  return [];
}

function saveData(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function findMessage(data, messageId) {
  for (const entry of data) {
    if (entry.messageId === messageId) return entry;
    const inReplies = entry.replies.find(r => r.messageId === messageId);
    if (inReplies) return inReplies;
  }
  return null;
}

client.on('messageCreate', (message) => {
  if (message.author.bot) return;
  if (!CHANNELS_TO_CAPTURE.includes(message.channel.name)) return;

  const data = loadData();
  const replyToId = message.reference?.messageId || null;

  if (replyToId) {
    const parent = findMessage(data, replyToId);
    if (parent) {
      if (!parent.replies) parent.replies = [];
      parent.replies.push({
        messageId: message.id,
        author: message.author.username,
        content: message.content,
        timestamp: message.createdAt,
      });
      console.log('Reply captured under:', parent.content);
    }
  } else {
    data.push({
      messageId: message.id,
      author: message.author.username,
      content: message.content,
      timestamp: message.createdAt,
      replies: [],
    });
    console.log('New question captured:', message.content);
  }

  saveData(data);
});

client.login(process.env.DISCORD_TOKEN);