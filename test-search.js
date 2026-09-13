const fetch = require('node-fetch'); // actually we can use global fetch in Node 18+
async function run() {
  const query = 'author:craighckby';
  const res = await fetch(`https://api.github.com/search/commits?q=${encodeURIComponent(query)}&sort=author-date&order=desc&per_page=3`, {
    headers: {
      'Accept': 'application/vnd.github.cloak-preview+json',
      'User-Agent': 'test'
    }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
