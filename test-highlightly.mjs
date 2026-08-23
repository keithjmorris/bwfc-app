const res = await fetch('https://soccer.highlightly.net/events/1330199735', {
  headers: { 'x-rapidapi-key': '38fc70e4-38e9-42af-96cc-f1566cdf2c1e' }
});
const data = await res.json();
const subs = data.filter(e => e.type === 'Substitution');
console.log(JSON.stringify(subs.map(s => ({
  team: s.team?.name,
  teamId: s.team?.id,
  player: s.player,
  substituted: s.substituted,
  time: s.time
})), null, 2));