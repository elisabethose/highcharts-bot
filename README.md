# Highcharts Discord Bot

This is a simple discord bot meant to capture and record messages sent in a Questions channel. 

## Setup

### Prerequisites
- need Node.js installed
- A Discord bot token (this is collected from discord.com/developers under bot upon creation of the bot)
- An Anthropic API key
- A Discord server to listen to

### Installation
1. Clone repository
2. Install dependencies
    - npm install
3. Create a .env file with the following 
    DISCORD_TOKEN=your_token
    ANTHROPIC_API_KEY=your_key


## Usage 

**Run the bot** (captures messages live):
   node bot.js

**Categorize captured messages:**
   node categorize.js


## Files

- `bot.js` — Discord bot, captures messages to messages.json
- `categorize.js` — sends messages to Claude API, outputs categorized.json
- `upload.js` — uploads categorized.json to Supabase
- `messages.json` — raw captured data (git ignored)
- `categorized.json` — categorized data (git ignored)


## Extra Info
To decide what channels to listen to, edit the CHANNELS_TO_CAPTURE in bot.js. 
The bot listens to the channel, records the message and adds it as a question to the messages.json, any use of the reply function will make the message be logged under it's parent, keeping the replies grouped together. Replies to replies will again be logged under the message they are replying to. 