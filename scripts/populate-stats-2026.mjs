import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAdELg_f_XTTRISr3D-ROZjChuzLeDjzjo",
  authDomain: "football-tracker-c9dae.firebaseapp.com",
  projectId: "football-tracker-c9dae",
  storageBucket: "football-tracker-c9dae.firebasestorage.app",
  messagingSenderId: "512352975737",
  appId: "1:512352975737:web:7cd68dad3b3e9aec54cda8",
};

const HIGHLIGHTLY_KEY = '38fc70e4-38e9-42af-96cc-f1566cdf2c1e';
const SEASON = 2026;
const SEASON_START = '2026-08-08'; // Filter out preseason

// Team mapping: football-data ID → Highlightly ID
const TEAMS = [
  // Bolton (fixed team)
  { fdId: 60,   hlId: 58652,   name: 'Bolton',            competition: 'ELC' },
  // Championship
  { fdId: 332,  hlId: 46738,   name: 'Birmingham',        competition: 'ELC' },
  { fdId: 59,   hlId: 57801,   name: 'Blackburn',         competition: 'ELC' },
  { fdId: 387,  hlId: 48440,   name: 'Bristol City',      competition: 'ELC' },
  { fdId: 328,  hlId: 38228,   name: 'Burnley',           competition: 'ELC' },
  { fdId: 715,  hlId: 37377,   name: 'Cardiff',           competition: 'ELC' },
  { fdId: 348,  hlId: 1136869, name: 'Charlton',          competition: 'ELC' },
  { fdId: 342,  hlId: 59503,   name: 'Derby',             competition: 'ELC' },
  { fdId: 1126, hlId: 1174313, name: 'Lincoln',           competition: 'ELC' },
  { fdId: 343,  hlId: 60354,   name: 'Middlesbrough',     competition: 'ELC' },
  { fdId: 384,  hlId: 50142,   name: 'Millwall',          competition: 'ELC' },
  { fdId: 68,   hlId: 61205,   name: 'Norwich',           competition: 'ELC' },
  { fdId: 325,  hlId: 1153889, name: 'Portsmouth',        competition: 'ELC' },
  { fdId: 1081, hlId: 50993,   name: 'Preston',           competition: 'ELC' },
  { fdId: 69,   hlId: 62056,   name: 'QPR',               competition: 'ELC' },
  { fdId: 356,  hlId: 53546,   name: 'Sheffield United',  competition: 'ELC' },
  { fdId: 340,  hlId: 35675,   name: 'Southampton',       competition: 'ELC' },
  { fdId: 70,   hlId: 64609,   name: 'Stoke',             competition: 'ELC' },
  { fdId: 72,   hlId: 65460,   name: 'Swansea',           competition: 'ELC' },
  { fdId: 346,  hlId: 33122,   name: 'Watford',           competition: 'ELC' },
  { fdId: 74,   hlId: 51844,   name: 'West Brom',         competition: 'ELC' },
  { fdId: 563,  hlId: 41632,   name: 'West Ham',          competition: 'ELC' },
  { fdId: 76,   hlId: 33973,   name: 'Wolves',            competition: 'ELC' },
  { fdId: 404,  hlId: 1564071, name: 'Wrexham',           competition: 'ELC' },
  // Premier League
  { fdId: 57,   hlId: 36526,   name: 'Arsenal',           competition: 'PL' },
  { fdId: 58,   hlId: 56950,   name: 'Aston Villa',       competition: 'PL' },
  { fdId: 1044, hlId: 30569,   name: 'Bournemouth',       competition: 'PL' },
  { fdId: 402,  hlId: 47589,   name: 'Brentford',         competition: 'PL' },
  { fdId: 397,  hlId: 44185,   name: 'Brighton',          competition: 'PL' },
  { fdId: 61,   hlId: 42483,   name: 'Chelsea',           competition: 'PL' },
  { fdId: 1076, hlId: 1146230, name: 'Coventry',          competition: 'PL' },
  { fdId: 354,  hlId: 45036,   name: 'Crystal Palace',    competition: 'PL' },
  { fdId: 62,   hlId: 39079,   name: 'Everton',           competition: 'PL' },
  { fdId: 63,   hlId: 31420,   name: 'Fulham',            competition: 'PL' },
  { fdId: 322,  hlId: 55248,   name: 'Hull City',         competition: 'PL' },
  { fdId: 349,  hlId: 49291,   name: 'Ipswich',           competition: 'PL' },
  { fdId: 341,  hlId: 54397,   name: 'Leeds United',      competition: 'PL' },
  { fdId: 64,   hlId: 34824,   name: 'Liverpool',         competition: 'PL' },
  { fdId: 65,   hlId: 43334,   name: 'Man City',          competition: 'PL' },
  { fdId: 66,   hlId: 28867,   name: 'Man United',        competition: 'PL' },
  { fdId: 67,   hlId: 29718,   name: 'Newcastle',         competition: 'PL' },
  { fdId: 351,  hlId: 56099,   name: 'Nottm Forest',      competition: 'PL' },
  { fdId: 71,   hlId: 635630,  name: 'Sunderland',        competition: 'PL' },
  { fdId: 73,   hlId: 40781,   name: 'Tottenham',         competition: 'PL' },
];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchHL(path) {
  const res = await fetch(`https://soccer.highlightly.net${path}`, {
    headers: { 'x-rapidapi-key': HIGHLIGHTLY_KEY },
  });
  if (!res.ok) {
    console.warn(`Failed to fetch ${path}: ${res.status}`);
    return null;
  }
  return res.json();
}

function findPlayer(players, name) {
  if (!name) return null;
  const simplify = str => str
    .replace(/[ØøÒÓÔÕÖ]/g, 'o')
    .replace(/[ÀÁÂÃÄÅàáâãäå]/g, 'a')
    .replace(/[ÈÉÊËèéêë]/g, 'e')
    .replace(/[ÌÍÎÏìíîï]/g, 'i')
    .replace(/[ÙÚÛÜùúûü]/g, 'u')
    .replace(/[ÝýÿŸ]/g, 'y')
    .replace(/[Ññ]/g, 'n')
    .replace(/[Çç]/g, 'c')
    .toLowerCase();

  return Object.values(players).find(p => {
    if (p.name === name) return true;
    const parts = name.split(' ');
    if (parts.length >= 2 && parts[0].endsWith('.')) {
      const initial = parts[0][0].toUpperCase();
      const lastName = simplify(parts.slice(1).join(' '));
      return p.name.startsWith(initial) && simplify(p.name).includes(lastName);
    }
    return false;
  });
}

function processMatch(match, events, lineups, statistics, boxScore, teamHlId, teamFdId) {
  const isHome = match.homeTeam?.id === teamHlId;
  const opponent = isHome ? match.awayTeam : match.homeTeam;
  const teamLineup = isHome ? lineups?.homeTeam : lineups?.awayTeam;

  const compCode = match.league?.id === 33973 ? 'PL' :
    match.league?.id === 34824 ? 'ELC' :
    match.league?.id === 41632 ? 'EFL' :
    match.league?.id === 146305 ? 'FAC' : 'OTHER';

  const scoreStr = match.state?.score?.current;
  const scoreParts = scoreStr ? scoreStr.split(' - ') : [null, null];
  const homeScore = scoreParts[0] !== null ? parseInt(scoreParts[0]) : null;
  const awayScore = scoreParts[1] !== null ? parseInt(scoreParts[1]) : null;
  const teamScore = isHome ? homeScore : awayScore;
  const oppScore = isHome ? awayScore : homeScore;

  const baseMatchInfo = {
    id: match.id,
    date: match.date,
    opponent: opponent?.name,
    homeAway: isHome ? 'H' : 'A',
    score: `${homeScore}-${awayScore}`,
    competition: compCode,
    goals: 0, assists: 0, yellowCards: 0, redCards: 0,
    xg: 0, passes: 0, passAccuracy: 0, tackles: 0,
  };

  const players = {};

  

  // Process starting lineup
  const startingXI = (teamLineup?.initialLineup || []).flat();
  for (const p of startingXI) {
    players[p.id] = {
      id: p.id, name: p.name, position: p.position, shirtNumber: p.number,
      starts: 1, subApps: 0, minutesPlayed: 90,
      goals: 0, assists: 0, yellowCards: 0, redCards: 0,
      xg: 0, passes: 0, tackles: 0,
      matches: [{ ...baseMatchInfo, started: true, minutesPlayed: 90 }],
    };
  }

  // Process bench
  for (const p of teamLineup?.substitutes || []) {
    if (!players[p.id]) {
      players[p.id] = {
        id: p.id, name: p.name, position: p.position, shirtNumber: p.number,
        starts: 0, subApps: 0, minutesPlayed: 0,
        goals: 0, assists: 0, yellowCards: 0, redCards: 0,
        xg: 0, passes: 0, tackles: 0,
        matches: [],
      };
    }
  }

  // Process events
  for (const e of events || []) {
  if (!e.team || e.team.id !== teamHlId) continue;
  
  // just check once
    const minute = parseInt(e.time) || 0;

    
      if (e.type === 'Substitution') {
  const outPlayer = findPlayer(players, e.player);
  const inPlayer = findPlayer(players, e.substituted);

      if (outPlayer) {
  outPlayer.minutesPlayed = minute;
  const last = outPlayer.matches.at(-1);
  if (last) last.minutesPlayed = minute;
}
if (inPlayer) {
  inPlayer.subApps += 1;
  inPlayer.minutesPlayed += 90 - minute;
  inPlayer.matches.push({
    ...baseMatchInfo,
    started: false,
    minutesPlayed: 90 - minute,
    cameOnMinute: minute,
  });
}
    } else if (e.type === 'Goal' || e.type === 'Penalty') {
     
  const scorer = findPlayer(players, e.player);
  
      if (scorer) {
        scorer.goals += 1;
        const last = scorer.matches.at(-1);
        if (last) last.goals = (last.goals || 0) + 1;
      }
      if (e.assist) {
        const assister = findPlayer(e.assist);
        if (assister) {
          assister.assists += 1;
          const last = assister.matches.at(-1);
          if (last) last.assists = (last.assists || 0) + 1;
        }
      }
    } else if (e.type === 'Yellow Card') {
      const player = findPlayer(e.player);
      if (player) {
        player.yellowCards += 1;
        const last = player.matches.at(-1);
        if (last) last.yellowCards = (last.yellowCards || 0) + 1;
      }
    } else if (e.type === 'Red Card' || e.type === 'Yellow Card/Red Card') {
      const player = findPlayer(e.player);
      if (player) {
        player.redCards += 1;
        const last = player.matches.at(-1);
        if (last) last.redCards = (last.redCards || 0) + 1;
      }
    }
  }

  // Add player box score stats
  for (const teamData of Array.isArray(boxScore) ? boxScore : []) {
    if (teamData.team?.id !== teamHlId) continue;
    for (const bsPlayer of teamData.players || []) {
      const ps = bsPlayer.statistics || {};
      const player = findPlayer(bsPlayer.name);
      if (player && player.matches.length > 0) {
        const lastMatch = player.matches.at(-1);
        lastMatch.xg = ps.expectedGoals || 0;
        lastMatch.passes = ps.passesTotal || 0;
        lastMatch.passAccuracy = ps.passesAccuracy ? parseFloat(ps.passesAccuracy) : 0;
        lastMatch.tackles = ps.tacklesTotal || 0;
        player.xg = (player.xg || 0) + (ps.expectedGoals || 0);
        player.passes = (player.passes || 0) + (ps.passesTotal || 0);
        player.tackles = (player.tackles || 0) + (ps.tacklesTotal || 0);
      }
    }
  }

  // Extract team statistics
  const statsArr = Array.isArray(statistics) ? statistics : [];
  const teamStatData = statsArr.find(t => t.team?.id === teamHlId);
  const s = {};
  for (const stat of teamStatData?.statistics || []) {
    s[stat.displayName] = stat.value;
  }

  // Extract box score aggregates for team
  const teamBoxScore = Array.isArray(boxScore)
    ? boxScore.find(t => t.team?.id === teamHlId)
    : null;

  let totalPasses = 0, successfulPasses = 0, totalTackles = 0, totalXg = 0;
  for (const player of teamBoxScore?.players || []) {
    const ps = player.statistics || {};
    totalPasses += ps.passesTotal || 0;
    successfulPasses += ps.passesSuccessful || 0;
    totalTackles += ps.tacklesTotal || 0;
    totalXg += ps.expectedGoals || 0;
  }

  const passAccuracy = totalPasses > 0
    ? Math.round((successfulPasses / totalPasses) * 100)
    : 0;

  const teamStats = {
    competition: compCode,
    date: match.date,
    opponent: opponent?.name,
    homeAway: isHome ? 'H' : 'A',
    result: teamScore > oppScore ? 'W' : teamScore < oppScore ? 'L' : 'D',
    goalsFor: teamScore || 0,
    goalsAgainst: oppScore || 0,
    cleanSheet: oppScore === 0,
    possession: (() => { const p = s['Possession'] || 0; return p < 1 ? Math.round(p * 100) : p; })(),
    shotsOnGoal: s['Shots on target'] || 0,
    shotsOffGoal: s['Shots off target'] || 0,
    shots: (s['Shots on target'] || 0) + (s['Shots off target'] || 0) + (s['Blocked shots'] || 0),
    saves: s['Goalkeeper saves'] || 0,
    corners: s['Corners'] || 0,
    fouls: s['Fouls'] || 0,
    yellowCards: s['Yellow cards'] || 0,
    redCards: s['Red cards'] || 0,
    xg: totalXg,
    totalPasses,
    passAccuracy,
    tackles: totalTackles,
  };

  return {
    players: Object.values(players).filter(p => p.starts > 0 || p.subApps > 0),
    teamStats,
  };
}
async function processTeam(team) {
  const docKey = `raw_${team.fdId}_${SEASON}`;
  const docRef = doc(db, 'player_stats', docKey);
  const existing = await getDoc(docRef);

  let playerStats = {};
  let teamMatchStats = [];
  const processedMatchIds = new Set();

  if (existing.exists()) {
    const data = existing.data();
    playerStats = data.playerStats || {};
    teamMatchStats = data.teamMatchStats || [];
    teamMatchStats.forEach(m => processedMatchIds.add(m.id));
  }

  const [homeData, awayData] = await Promise.all([
    fetchHL(`/matches?homeTeamId=${team.hlId}&season=${SEASON}&limit=100`),
    fetchHL(`/matches?awayTeamId=${team.hlId}&season=${SEASON}&limit=100`),
  ]);

  const COMPETITIVE_LEAGUE_IDS = [33973, 34824, 41632, 146305];

  const seen = new Set();
  const allMatches = [
    ...(homeData?.data || []),
    ...(awayData?.data || []),
  ].filter(m => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return (
      (m.state?.description === 'Finished' ||
       m.state?.description === 'Finished after penalties' ||
       m.state?.description === 'Finished after extra time') &&
      COMPETITIVE_LEAGUE_IDS.includes(m.league?.id) &&
      new Date(m.date) >= new Date(SEASON_START)
    );
  });

  const newMatches = allMatches.filter(m => !processedMatchIds.has(String(m.id)));

  if (newMatches.length === 0) return;

  for (const match of newMatches) {
    await sleep(500);

    const [events, lineups, statistics, boxScore] = await Promise.all([
      fetchHL(`/events/${match.id}`),
      fetchHL(`/lineups/${match.id}`),
      fetchHL(`/statistics/${match.id}`),
      fetchHL(`/box-score/${match.id}`),
    ]);

    const { players, teamStats } = processMatch(
      match, events, lineups, statistics, boxScore, team.hlId, team.fdId
    );

    teamStats.id = String(match.id);

    for (const p of players) {
      if (!playerStats[p.id]) {
        playerStats[p.id] = { ...p, matches: [...p.matches] };
      } else {
        playerStats[p.id].starts += p.starts;
        playerStats[p.id].subApps += p.subApps;
        playerStats[p.id].minutesPlayed += p.minutesPlayed;
        playerStats[p.id].goals += p.goals;
        playerStats[p.id].assists += p.assists;
        playerStats[p.id].yellowCards += p.yellowCards;
        playerStats[p.id].redCards += p.redCards;
        playerStats[p.id].xg = (playerStats[p.id].xg || 0) + (p.xg || 0);
        playerStats[p.id].passes = (playerStats[p.id].passes || 0) + (p.passes || 0);
        playerStats[p.id].tackles = (playerStats[p.id].tackles || 0) + (p.tackles || 0);
        playerStats[p.id].matches.push(...p.matches);
      }
    }
    teamMatchStats.push(teamStats);
  }

  await setDoc(docRef, {
    playerStats,
    teamMatchStats,
    updatedAt: new Date().toISOString(),
  });
}

async function main() {
  
  for (const team of TEAMS) {
    try {
      const result = await processTeam(team);
    } catch (err) {
    }
  }
  process.exit(0);
}
main().catch(console.error);