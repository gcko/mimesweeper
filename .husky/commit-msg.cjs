const fs = require('fs');
console.log('INFO: Validating git commit message.......');

const msg = fs.readFileSync(process.argv[2] || process.env.GIT_PARAMS ||
  process.env.HUSKY_GIT_PARAMS, 'utf8').replace(/\n/g, " ").substring(0, 50);
if (msg.includes('Merge branch')) {
  console.log('SUCCESS: Merge branch commit message ACCEPTED.');
  process.exit(0);
}
const matchTest =
  /^(((Close|Closes|Closed|Fix|Fixes|Fixed|Resolve|Resolves|Resolved)\s)?(#\d+|Adhoc): (Added|Removed|BugFix|Modified|Feature|Merged|Refactored|Release): (.+){15,})$/g
    .test(msg);

if (matchTest || /^Merge remote-tracking(.+)/g.test(msg)) {
  console.log('SUCCESS: Commit ACCEPTED.');
} else {
  console.log('ERROR: Commit REJECTED. REASON: Your commit message: \'' + msg + '\' does not follow the commit message convention.');
  console.log(`Convention: '[Issue or PR ID|Adhoc]: [One Primary Change Type: Added|Removed|BugFix|Modified|Feature|Merged|Refactored|Release]: [Message describing the change. If absolutely necessary, you can add multiple Change types here.]`);
  console.log('Sample: IT-123: Added: git hook to validate commit message.');
}
process.exit(matchTest ? 0 : 1);
