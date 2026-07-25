import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAdELg_f_XTTRISr3D-ROZjChuzLeDjzjo",
  authDomain: "football-tracker-c9dae.firebaseapp.com",
  projectId: "football-tracker-c9dae",
  storageBucket: "football-tracker-c9dae.firebasestorage.app",
  messagingSenderId: "512352975737",
  appId: "1:512352975737:web:7cd68dad3b3e9aec54cda8",
};

const BOLTON_ID = 60;

// Map competition names to codes
function mapCompetition(comp) {
  if (!comp) return 'UNKNOWN';
  const c = comp.toLowerCase();
  if (c.includes('league one')) return 'EL1';
  if (c.includes('fa cup')) return 'FAC';
  if (c.includes('carabao') || c.includes('league cup')) return 'EFL';
  if (c.includes('trophy') || c.includes('vertu')) return 'EFT';
  return 'OTHER';
}

// Parse "M. Burstow (60')" into name and minute
function parseScorer(str) {
  if (!str || str.trim() === '') return null;
  const match = str.match(/^(.+?)\s*\((.+?)\)/);
  if (match) {
    return { name: match[1].trim(), minute: match[2].trim() };
  }
  return { name: str.trim(), minute: null };
}

// Parse substitute time "76'" into number
function parseMinute(str) {
  if (!str) return 90;
  const m = str.replace("'", '').replace('+', '').trim();
  return parseInt(m) || 90;
}

function processFixtures(fixtures) {
  const playerStats = {};
  const teamMatchStats = [];

  for (const match of fixtures) {
    const competition = mapCompetition(match.competition);
    const isHome = match.homeOrAway?.toLowerCase() === 'home';
    
    // Determine scores
    const bwfcScore = match.BWFCScore ?? 0;
    const oppScore = match.opponentScore ?? 0;
    const homeScore = isHome ? bwfcScore : oppScore;
    const awayScore = isHome ? oppScore : bwfcScore;

    // Determine result
    const result = bwfcScore > oppScore ? 'W' : bwfcScore < oppScore ? 'L' : 'D';
    const cleanSheet = oppScore === 0;

    // Build match info base
    const matchInfo = {
      id: match.id,
      date: match.date,
      opponent: match.opponent,
      homeAway: isHome ? 'H' : 'A',
      score: `${homeScore}-${awayScore}`,
      competition,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
    };

    // Get starters
    const starters = [];
    for (let i = 1; i <= 11; i++) {
      const name = match[`starter${i}`];
      if (name && name.trim()) starters.push(name.trim());
    }

    // Get substitutions
    const subs = [];
    for (let i = 1; i <= 5; i++) {
      const playerIn = match[`substitute${i}`];
      const playerOut = match[`substitutedPlayer${i}`];
      const time = match[`substituteTime${i}`];
      if (playerIn && playerIn.trim() && playerOut && playerOut.trim()) {
        subs.push({
          playerIn: playerIn.trim(),
          playerOut: playerOut.trim(),
          minute: parseMinute(time),
        });
      }
    }

    // Get yellow cards
    const yellowCards = [];
    for (let i = 1; i <= 6; i++) {
      const player = match[`yellowCard${i}`];
      if (player && player.trim()) yellowCards.push(player.trim());
    }

    // Get red cards
    const redCards = [];
    for (let i = 1; i <= 2; i++) {
      const player = match[`redCard${i}`];
      if (player && player.trim()) redCards.push(player.trim());
    }

    // Get goals (Bolton scorers only)
    const goals = [];
    for (let i = 1; i <= 8; i++) {
      const scorer = parseScorer(match[`scorer${i}`]);
      const assist = parseScorer(match[`assist${i}`]);
      if (scorer) goals.push({ scorer: scorer.name, assist: assist?.name || null });
    }

    // Process starters
    for (const name of starters) {
      if (!playerStats[name]) {
        playerStats[name] = {
          id: name,
          name,
          position: null,
          shirtNumber: null,
          starts: 0, subApps: 0, minutesPlayed: 0,
          goals: 0, assists: 0, yellowCards: 0, redCards: 0,
          matches: [],
        };
      }
      
      // Find if subbed off
      const subbedOff = subs.find(s => s.playerOut === name);
      const minutesPlayed = subbedOff ? subbedOff.minute : 90;

      playerStats[name].starts += 1;
      playerStats[name].minutesPlayed += minutesPlayed;
      playerStats[name].matches.push({
        ...matchInfo,
        started: true,
        minutesPlayed,
      });
    }

    // Process subs coming on
    for (const sub of subs) {
      const name = sub.playerIn;
      if (!playerStats[name]) {
        playerStats[name] = {
          id: name,
          name,
          position: null,
          shirtNumber: null,
          starts: 0, subApps: 0, minutesPlayed: 0,
          goals: 0, assists: 0, yellowCards: 0, redCards: 0,
          matches: [],
        };
      }
      const minutesPlayed = 90 - sub.minute;
      playerStats[name].subApps += 1;
      playerStats[name].minutesPlayed += minutesPlayed;
      playerStats[name].matches.push({
        ...matchInfo,
        started: false,
        minutesPlayed,
        cameOnMinute: sub.minute,
      });
    }

    // Process goals
    for (const goal of goals) {
      if (playerStats[goal.scorer]) {
        playerStats[goal.scorer].goals += 1;
        const lastMatch = playerStats[goal.scorer].matches.at(-1);
        if (lastMatch) lastMatch.goals = (lastMatch.goals || 0) + 1;
      }
      if (goal.assist && playerStats[goal.assist]) {
        playerStats[goal.assist].assists += 1;
        const lastMatch = playerStats[goal.assist].matches.at(-1);
        if (lastMatch) lastMatch.assists = (lastMatch.assists || 0) + 1;
      }
    }

    // Process yellow cards
    for (const name of yellowCards) {
      if (playerStats[name]) {
        playerStats[name].yellowCards += 1;
        const lastMatch = playerStats[name].matches.at(-1);
        if (lastMatch) lastMatch.yellowCards = (lastMatch.yellowCards || 0) + 1;
      }
    }

    // Process red cards
    for (const name of redCards) {
      if (playerStats[name]) {
        playerStats[name].redCards += 1;
        const lastMatch = playerStats[name].matches.at(-1);
        if (lastMatch) lastMatch.redCards = (lastMatch.redCards || 0) + 1;
      }
    }

    // Team match stats
    teamMatchStats.push({
      competition,
      date: match.date,
      opponent: match.opponent,
      homeAway: isHome ? 'H' : 'A',
      result,
      goalsFor: bwfcScore,
      goalsAgainst: oppScore,
      cleanSheet,
      possession: match.possession || 0,
      shotsOnGoal: match.shotsonTarget || 0,
      shotsOffGoal: (match.shots || 0) - (match.shotsonTarget || 0),
      shots: match.shots || 0,
      saves: 0, // not in the data
      corners: 0, // not in the data
      fouls: 0, // not in the data
      yellowCards: yellowCards.length,
      redCards: redCards.length,
      // Bonus stats not available in football-data.org!
      xg: match.xg || 0,
      xga: match.xga || 0,
      touchesOppositionBox: match.touchesOppositionBox || 0,
      touchesOurBox: match.touchesOurBox || 0,
    });
  }

  return { playerStats, teamMatchStats };
}

async function main() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log('Fetching Bolton fixtures from GitHub...');
  const res = await fetch('https://raw.githubusercontent.com/keithjmorris/bwfc-web/refs/heads/main/src/data/fixtures.json');
  const fixtures = await res.json();
  console.log(`Found ${fixtures.length} matches`);

  console.log('Processing stats...');
  const { playerStats, teamMatchStats } = processFixtures(fixtures);

  console.log(`Processed ${Object.keys(playerStats).length} players and ${teamMatchStats.length} matches`);

  console.log('Saving to Firestore...');
  await setDoc(doc(db, 'player_stats', `raw_${BOLTON_ID}`), {
    playerStats,
    teamMatchStats,
    updatedAt: new Date().toISOString(),
  });

  console.log('✅ Bolton stats saved successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});