
const res = await fetch('https://soccer.highlightly.net/box-score/1330246540', {
  headers: { 'x-rapidapi-key': '38fc70e4-38e9-42af-96cc-f1566cdf2c1e' }
});
const data = await res.json();
const bolton = data.find(t => t.team?.id === 58652);
const gale = bolton?.players?.find(p => p.name?.includes('Gale'));
console.log(JSON.stringify(gale, null, 2));