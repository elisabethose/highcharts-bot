const ollama = require('ollama').default;
const fs = require('fs');

// List of categories for Highcharts support questions, can be changed if needed, bot will choose the most appropriate one based on the question content
const CATEGORIES = [
  'Usage & Implementation',
  'Stocks',
  'Maps',
  'Gantt',
  'Dashboards',
  'Cloud',
  '.NET',
  'News',
  'Other'
];

// Function to categorize a message using the Ollama API, if sees fit later one could exchange for another type of LLM based on preference and licensing
async function categorizeMessage(content) {
  const response = await ollama.chat({
    model: 'llama3',
    messages: [{
      role: 'user',
      content: `Categorize this Highcharts support question into exactly one of these categories: ${CATEGORIES.join(', ')}. Reply with only the category name, nothing else. Question: "${content}"`
    }]
  });
  return response.message.content.trim();
}

//main function, reads messages_grouped.json and categorizes each message thread, then saves the result to categorized.json
async function main() {
  const data = JSON.parse(fs.readFileSync('messages_grouped.json'));

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

main();