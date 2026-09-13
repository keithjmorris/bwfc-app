const res = await fetch('https://soccer.highlightly.net/events/1330246540', {
  headers: { 'x-rapidapi-key': '38fc70e4-38e9-42af-96cc-f1566cdf2c1e' }
});
const data = await res.json();
const bolton = data.filter(e => e.team?.id === 58652);
console.log(JSON.stringify(bolton, null, 2));