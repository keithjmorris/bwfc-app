const res = await fetch('https://soccer.highlightly.net/lineups/1330199735', {
  headers: { 'x-rapidapi-key': '38fc70e4-38e9-42af-96cc-f1566cdf2c1e' }
});
const data = await res.json();
console.log('Away team (Bolton) starters:', (data.awayTeam?.initialLineup || []).flat().map(p => p.name));
console.log('Away team (Bolton) bench:', (data.awayTeam?.substitutes || []).map(p => p.name));