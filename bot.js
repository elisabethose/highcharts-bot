require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
const fs = require('fs');

const FILE = 'messages.json';

const STAFF_ROLE_NAMES = ['Highsoft staff'];

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMembers,
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

async function isOfficialRole(message) {
  try {
    const member = await message.guild.members.fetch(message.author.id);
    const roles = member.roles.cache.map(r => r.name);
    console.log(`Roles for ${message.author.username}:`, roles);
    return roles.some(r => STAFF_ROLE_NAMES.includes(r));
  } catch (e) {
    console.log('Could not fetch roles for', message.author.username);
    return false;
  }
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const official = await isOfficialRole(message);
  const data = loadData();
  const replyToId = message.reference?.messageId || null;

  const entry = {
    messageId: message.id,
    channel: message.channel.name,
    author: message.author.username,
    isOfficial: official,
    content: message.content,
    timestamp: message.createdAt,
  };

  if (replyToId) {
    const parent = findMessage(data, replyToId);
    if (parent) {
      if (!parent.replies) parent.replies = [];
      parent.replies.push(entry);
      console.log(`Reply captured (official: ${official}):`, message.content);
    }
  } else {
    data.push({ ...entry, replies: [] });
    console.log(`New message captured (official: ${official}):`, message.content);
  }

  saveData(data);
});

client.login(process.env.DISCORD_TOKEN);