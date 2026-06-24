const ollama = require('ollama').default;
const fs = require('fs');

function groupByDay(messages) {
  const days = {};
  for (const msg of messages) {
    const day = new Date(msg.timestamp).toISOString().split('T')[0];
    if (!days[day]) days[day] = [];
    days[day].push(msg);
  }
  return days;
}

async function groupMessages(messages) {
  const formatted = messages.map((m, i) =>
    `[${i}] ${m.author}: ${m.content}`
  ).join('\n');

  const response = await ollama.chat({
    model: 'llama3',
    messages: [{
      role: 'user',
      content: `Here are messages from a Highcharts support channel posted within the same day. Group them into Q&A conversations based on content — which messages are questions and which are answers to those questions? Ignore time, focus only on whether messages are topically related.

Return ONLY valid JSON in this format, no explanation:
[
  {
    "question_index": 0,
    "answer_indices": [2, 3]
  }
]

Only include messages you are confident belong together. Leave out standalone messages.

Messages:
${formatted}`
    }]
  });

  try {
    // Strip any markdown code blocks if llama3 adds them
    const raw = response.message.content.trim().replace(/```json|```/g, '').trim();
    return JSON.parse(raw);
  } catch (e) {
    console.log('Could not parse response for this batch, skipping.');
    return [];
  }
}

async function main() {
  const raw = JSON.parse(fs.readFileSync('messages.json'));

  // Separate already-threaded messages from ungrouped ones
  const threaded = raw.filter(m => m.replies && m.replies.length > 0);
  const ungrouped = raw.filter(m => !m.replies || m.replies.length === 0);

  console.log(`${threaded.length} already threaded, ${ungrouped.length} ungrouped`);

  const byDay = groupByDay(ungrouped);
  const newlyGrouped = [];
  const stillUngrouped = [];

  for (const [day, messages] of Object.entries(byDay)) {
    console.log(`Processing ${messages.length} messages from ${day}...`);

    if (messages.length === 1) {
      stillUngrouped.push(messages[0]);
      continue;
    }

    const groups = await groupMessages(messages);
    const usedIndices = new Set();

    for (const group of groups) {
      const question = messages[group.question_index];
      const answers = group.answer_indices.map(i => messages[i]);

      question.replies = [
        ...(question.replies || []),
        ...answers.map(a => ({
          messageId: a.messageId,
          author: a.author,
          isOfficial: a.isOfficial,
          content: a.content,
          timestamp: a.timestamp,
          groupedByAI: true
        }))
      ];

      newlyGrouped.push(question);
      usedIndices.add(group.question_index);
      group.answer_indices.forEach(i => usedIndices.add(i));
    }

    messages.forEach((m, i) => {
      if (!usedIndices.has(i)) stillUngrouped.push(m);
    });
  }

  const result = [...threaded, ...newlyGrouped, ...stillUngrouped];
  fs.writeFileSync('messages_grouped.json', JSON.stringify(result, null, 2));
  console.log(`Done! ${newlyGrouped.length} new groups, ${stillUngrouped.length} still ungrouped.`);
  console.log('Saved to messages_grouped.json');
}

main();