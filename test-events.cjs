async function run() {
  const username = 'craighckby';
  const res = await fetch(`https://api.github.com/users/${username}/events`, {
    headers: { 'User-Agent': 'test' }
  });
  const data = await res.json();
  const pushEvents = data.filter(e => e.type === 'PushEvent');
  console.log(JSON.stringify(pushEvents.slice(0, 1), null, 2));
}
run();
