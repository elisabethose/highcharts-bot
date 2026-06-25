require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
const fs = require('fs');

const FILE = 'messages.json';

//Name should match exacy role name in Discord server, this is used to determine if a user is official or not, can be changed if needed
//one could add a role for high contributors you have persmission to use content from, this way they won't be flagged if we already have
//permission for usage of content
const STAFF_ROLE_NAMES = ['Highsoft staff'];

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMembers,
  ]
});

// Log when the bot is ready
client.once('clientReady', () => {
  console.log(`Bot is online as ${client.user.tag}`);
});

function loadData() {
  if (fs.existsSync(FILE)) {
    return JSON.parse(fs.readFileSync(FILE));
  }
  return [];
}

// Save the data back to messages.json
function saveData(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// Find a message by its ID in the data, including replies to determine if a message is a reply to another message, this is used to group messages into threads 
// and if message is already in the data, it will be updated with new information, otherwise it will be added as a new entry
function findMessage(data, messageId) {
  for (const entry of data) {
    if (entry.messageId === messageId) return entry;
    const inReplies = entry.replies.find(r => r.messageId === messageId);
    if (inReplies) return inReplies;
  }
  return null;
}

// Function to check if a user has an official role in the Discord server, this is used to determine if a user is official or not, so that we don't need to ask permission later for usage of content
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

// Listen for new messages in the Discord server, capture them, and save to messages.json
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