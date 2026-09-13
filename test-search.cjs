async function run() {
  const query = 'author:craighckby';
  const res = await fetch(`https://api.github.com/search/commits?q=${encodeURIComponent(query)}&sort=author-date&order=desc&per_page=3`, {
    headers: {
      'Accept': 'application/vnd.github.cloak-preview+json',
      'User-Agent': 'test'
    }
  });
  const data = await res.json();
  console.log(JSON.stringify(data.items?.[0] || data, null, 2));
}
run();
