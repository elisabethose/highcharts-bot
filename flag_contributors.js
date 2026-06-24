const fs = require('fs');

const THRESHOLD = 10;

function countContributions(data) {
  const counts = {};
  const officialStatus = {};

  for (const message of data) {
    // Count top-level messages
    counts[message.author] = (counts[message.author] || 0) + 1;
    // Track if they are official (use the most recent value)
    officialStatus[message.author] = message.isOfficial;

    // Count replies
    if (message.replies) {
      for (const reply of message.replies) {
        counts[reply.author] = (counts[reply.author] || 0) + 1;
        officialStatus[reply.author] = reply.isOfficial;
      }
    }
  }

  return { counts, officialStatus };
}

function main() {
  const data = JSON.parse(fs.readFileSync('messages_grouped.json'));
  const { counts, officialStatus } = countContributions(data);

  const flagged = [];

  for (const [author, count] of Object.entries(counts)) {
    const isOfficial = officialStatus[author];

    if (!isOfficial && count >= THRESHOLD) {
      flagged.push({
        author,
        messageCount: count,
        status: 'consent_required',
        contacted: false,
        consentGiven: null,
      });
    }
  }

  // Sort by most active first
  flagged.sort((a, b) => b.messageCount - a.messageCount);

  fs.writeFileSync('flagged_contributors.json', JSON.stringify(flagged, null, 2));
  console.log(`Flagged ${flagged.length} contributors requiring consent.`);
  console.log('Saved to flagged_contributors.json');
}

main();