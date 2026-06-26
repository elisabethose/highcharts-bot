require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
const fs = require('fs');

const FILE = 'messages.json';
const CHANNEL_ID = '1518584639709642842'; // Replace with your actual channel ID
const STAFF_ROLE_NAMES = ['Highsoft staff'];

// Create a new Discord client with the necessary intents
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMembers,
  ]
});

function loadData() {
  if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE));
  return [];
}

// Save the data back to messages.json
function saveData(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

//check if a user has an official role in the Discord server, this is used to determine if a user is official or not, so that we don't need to ask permission later for usage of content
async function isOfficialRole(guild, userId) {
  try {
    const member = await guild.members.fetch(userId);
    const roles = member.roles.cache.map(r => r.name);
    return roles.some(r => STAFF_ROLE_NAMES.includes(r));
  } catch (e) {
    return false;
  }
}

// gather messages from the specified channel, check if they are replies, and save them to messages.json
client.once('clientReady', async () => {
  console.log(`Bot online as ${client.user.tag}`);

  const channel = await client.channels.fetch(CHANNEL_ID);
  const guild = channel.guild;

  let allMessages = [];
  let lastId = null;

  // Fetch messages in batches of 100 (Discord API limit)
  while (true) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;

    const batch = await channel.messages.fetch(options);
    if (batch.size === 0) break;

    allMessages.push(...batch.values());
    lastId = batch.last().id;
    console.log(`Fetched ${allMessages.length} messages so far...`);

    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`Total messages fetched: ${allMessages.length}`);

  // Sort oldest first
  allMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

  const data = loadData();
  const existingIds = new Set(data.map(m => m.messageId));

  for (const message of allMessages) {
    if (message.author.bot) continue;
    if (existingIds.has(message.id)) continue;

    const official = await isOfficialRole(guild, message.author.id);
    const replyToId = message.reference?.messageId || null;

    // Create a new entry for the message
    const entry = {
      messageId: message.id,
      channel: channel.name,
      author: message.author.username,
      isOfficial: official,
      content: message.content,
      timestamp: message.createdAt,
      replyToId: replyToId,
      replies: [],
    };

    // If it's a reply, try to nest it
    if (replyToId) {
      const parent = data.find(m => m.messageId === replyToId);
      if (parent) {
        if (!parent.replies) parent.replies = [];
        parent.replies.push(entry);
        continue;
      }
    }

    data.push(entry);
  }

  saveData(data);
  console.log('Done! Saved to messages.json');
  process.exit();
});

client.login(process.env.DISCORD_TOKEN);