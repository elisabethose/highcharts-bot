const { execSync } = require('child_process');

function run(script) {
  console.log(`\n--- Running ${script} ---`);
  execSync(`node ${script}`, { stdio: 'inherit' });
}

run('group.js');
run('flag_contributors.js');
run('categorize.js');
run('upload.js');