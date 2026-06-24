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

**Run all other files:**
   node run.js

## Files

- `bot.js` — Discord bot, captures messages to messages.json
- `group.js`- groups messages that most likely are connected within the last 24   hours
- `categorize.js` — sends messages to Claude API, outputs categorized.json
- `flagged_contributors.js`- flaggs people who are high contributors but not official staff
- `run.js`- runs: group.js, categorize.js and flagged_contributors.js
- `messages.json` — raw captured data (git ignored)
- `messages_grouped.json` — grouped messages who did not use reply function (git ignored)
- `categorized.json` — categorized data (git ignored)
- `flagged_contributors.json` — list of people who are high contributors (git ignored)


## Extra Info
To decide what channels to listen to, edit the CHANNELS_TO_CAPTURE in bot.js. 
The bot listens to the channel, records the message and adds it as a question to the messages.json, any use of the reply function will make the message be logged under it's parent, keeping the replies grouped together. Replies to replies will again be logged under the message they are replying to. 