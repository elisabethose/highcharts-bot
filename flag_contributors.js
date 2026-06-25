const fs = require('fs');

//how many messages a user must have sent to be flagged for consent, this could also be changed to precentage of total messages if desired
const THRESHOLD = 10;

// Function to count contributions and track official status, a user is considered an official if they have a specified role in the Discord server, this is determined by bot.js. 
function countContributions(data) {
  const counts = {};
  const officialStatus = {};

  for (const message of data) {
    counts[message.author] = (counts[message.author] || 0) + 1;
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

//flag contributors who have sent more than THRESHOLD messages and are not official, save to flagged_contributors.json
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
        //not required but one should ask, hence the consent status, this could be used to track if a user has been contacted for consent and if they have given it or not
        status: 'consent_required',
        contacted: false,
        consentGiven: null,
      });
    }
  }

  flagged.sort((a, b) => b.messageCount - a.messageCount);

  fs.writeFileSync('flagged_contributors.json', JSON.stringify(flagged, null, 2));
  console.log(`Flagged ${flagged.length} contributors requiring consent.`);
  console.log('Saved to flagged_contributors.json');
}

main();