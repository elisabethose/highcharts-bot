
require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CATEGORIES = [
  'Installation',
  'Chart Types',
  'Styling & Theming',
  'Axis Configuration',
  'Data Formatting',
  'Performance',
  'Licensing',
  'Other'
];

async function categorizeMessage(content) {
  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 50,
    messages: [{
      role: 'user',
      content: `Categorize this Highcharts support question into exactly one of these categories: ${CATEGORIES.join(', ')}. Reply with only the category name, nothing else. Question: "${content}"`
    }]
  });
  return response.content[0].text.trim();
}

async function main() {
  const data = JSON.parse(fs.readFileSync('messages.json'));

  for (const message of data) {
    message.category = await categorizeMessage(message.content);
    console.log(`Categorized: "${message.content}" → ${message.category}`);

    if (message.replies) {
      for (const reply of message.replies) {
        reply.category = message.category;
      }
    }
  }

  fs.writeFileSync('categorized.json', JSON.stringify(data, null, 2));
  console.log('Done! Saved to categorized.json');
}