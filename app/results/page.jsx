'use client';

import { useEffect, useState } from 'react';
import { useFavourites } from '@/lib/FavouritesContext';
import TeamSelector from '@/components/TeamSelector';
import MatchDetails from '@/components/MatchDetails';

function MatchCard({ match }) {
  const { favourites } = useFavourites();
  const trackedIds = new Set(favourites.map(t => t.id));
  const homeTracked = trackedIds.has(match.homeTeam?.id);
  const awayTracked = trackedIds.has(match.awayTeam?.id);

  const homeScore = match.score?.fullTime?.home;
  const awayScore = match.score?.fullTime?.away;

  return (
    <div className={`match-card ${homeTracked || awayTracked ? 'tracked' : ''}`}>
      <div className="team-home">
        {match.homeTeam?.crest && <img src={match.homeTeam.crest} alt="" className="team-crest" />}
        <span className={`team-name ${homeTracked ? 'tracked-name' : ''}`}>
          {match.homeTeam?.shortName || match.homeTeam?.name}
        </span>
      </div>
      <div className="match-centre">
        <div className="match-score">
          {homeScore ?? '—'} : {awayScore ?? '—'}
        </div>
        <div className="match-time">
          {new Date(match.utcDate).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short'
          })}
        </div>
        <div className="match-competition">{match.competition?.name}</div>
      </div>
      <div className="team-away">
        {match.awayTeam?.crest && <img src={match.awayTeam.crest} alt="" className="team-crest" />}
        <span className={`team-name ${awayTracked ? 'tracked-name' : ''}`}>
          {match.awayTeam?.shortName || match.awayTeam?.name}
        </span>
      </div>
    </div>
  );
}

function MatchSummary({ match }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function fetchSummary() {
    if (summary) { setOpen(!open); return; }
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(match),
      });
      const data = await res.json();
      setSummary(data.summary);
    } catch {
      setSummary('Could not generate summary.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="match-summary-wrapper">
      <button className="summary-btn" onClick={fetchSummary}>
        {open ? '▲ Hide report' : '▼ Match report'}
      </button>
      {open && (
        <div className="summary-box">
          {loading
            ? <p className="summary-loading">Generating report…</p>
            : <p className="summary-text">{summary}</p>
          }
        </div>
      )}
    </div>
  );
}

async function fetchBoltonHistoricResults() {
  const res = await fetch('https://raw.githubusercontent.com/keithjmorris/bwfc-web/refs/heads/main/src/data/fixtures.json');
  const fixtures = await res.json();
  
  // Convert to display format
  return fixtures.map(m => {
    const isHome = m.homeOrAway?.toLowerCase() === 'home';
    const homeScore = isHome ? m.BWFCScore : m.opponentScore;
    const awayScore = isHome ? m.opponentScore : m.BWFCScore;
    const homeTeam = isHome ? 'Bolton Wanderers' : m.opponent;
    const awayTeam = isHome ? m.opponent : 'Bolton Wanderers';

    // Get scorers
const goals = [];
for (let i = 1; i <= 8; i++) {
  const scorer = m[`scorer${i}`];
  const assist = m[`assist${i}`];
  if (scorer && scorer.trim()) {
    const match = scorer.match(/^(.+?)\s*\((.+?)\)/);
    if (match) {
      const assistMatch = assist?.match(/^(.+?)\s*\((.+?)\)/);
      goals.push({
        scorer: { name: match[1].trim() },
        assist: assistMatch ? { name: assistMatch[1].trim() } : null,
        minute: parseInt(match[2]) || 0,
        team: { id: 60, name: 'Bolton Wanderers' },
        type: scorer.includes('pen') ? 'PENALTY' : scorer.includes('og') ? 'OWN' : 'REGULAR',
      });
    }
  }


// Get bookings
const bookings = [];
for (let i = 1; i <= 6; i++) {
  const player = m[`yellowCard${i}`];
  const time = m[`yellowCardTime${i}`];
  if (player && player.trim()) {
    bookings.push({
      player: { name: player.trim() },
      minute: parseInt(time) || 0,
      card: 'YELLOW',
      team: { id: 60, name: 'Bolton Wanderers' },
    });
  }
}
for (let i = 1; i <= 2; i++) {
  const player = m[`redCard${i}`];
  const time = m[`redCardTime${i}`];
  if (player && player.trim()) {
    bookings.push({
      player: { name: player.trim() },
      minute: parseInt(time) || 0,
      card: 'RED',
      team: { id: 60, name: 'Bolton Wanderers' },
    });
  }
}

// Get substitutions
const substitutions = [];
for (let i = 1; i <= 5; i++) {
  const playerIn = m[`substitute${i}`];
  const playerOut = m[`substitutedPlayer${i}`];
  const time = m[`substituteTime${i}`];
  if (playerIn && playerIn.trim() && playerOut && playerOut.trim()) {
    substitutions.push({
      playerIn: { name: playerIn.trim() },
      playerOut: { name: playerOut.trim() },
      minute: parseInt(time) || 0,
      team: { id: 60, name: 'Bolton Wanderers' },
    });
  }
}
}

    // Get bookings
    const bookings = [];
    for (let i = 1; i <= 6; i++) {
      const player = m[`yellowCard${i}`];
      const time = m[`yellowCardTime${i}`];
      if (player && player.trim()) {
        bookings.push({
          player: { name: player.trim() },
          minute: parseInt(time) || 0,
          card: 'YELLOW',
          team: { name: 'Bolton Wanderers' },
        });
      }
    }
    for (let i = 1; i <= 2; i++) {
      const player = m[`redCard${i}`];
      const time = m[`redCardTime${i}`];
      if (player && player.trim()) {
        bookings.push({
          player: { name: player.trim() },
          minute: parseInt(time) || 0,
          card: 'RED',
          team: { name: 'Bolton Wanderers' },
        });
      }
    }

    // Get substitutions
    const substitutions = [];
    for (let i = 1; i <= 5; i++) {
      const playerIn = m[`substitute${i}`];
      const playerOut = m[`substitutedPlayer${i}`];
      const time = m[`substituteTime${i}`];
      if (playerIn && playerIn.trim() && playerOut && playerOut.trim()) {
        substitutions.push({
          playerIn: { name: playerIn.trim() },
          playerOut: { name: playerOut.trim() },
          minute: parseInt(time) || 0,
          team: { name: 'Bolton Wanderers' },
        });
      }
    }

    // Get lineup
    const lineup = [];
    for (let i = 1; i <= 11; i++) {
      const player = m[`starter${i}`];
      if (player && player.trim()) {
        lineup.push({ id: i, name: player.trim(), shirtNumber: i, position: i === 1 ? 'Goalkeeper' : 'Outfield' });
      }
    }

    return {
      id: m.id,
      utcDate: (() => {
  try {
    const cleaned = m.date
      .replace(/(\d+)(st|nd|rd|th)/i, '$1')
      .trim();
    const withYear = cleaned.includes('2025') || cleaned.includes('2026') 
      ? cleaned 
      : cleaned + ' 2025';
    const d = new Date(withYear);
    return isNaN(d.getTime()) ? new Date('2025-08-01').toISOString() : d.toISOString();
  } catch {
    return new Date('2025-08-01').toISOString();
  }
})(),
      status: 'FINISHED',
      competition: { name: m.competition, code: 'EL1' },
      homeTeam: {
        id: isHome ? 60 : 999,
        name: homeTeam,
        shortName: isHome ? 'Bolton' : m.opponent,
        crest: isHome ? 'https://crests.football-data.org/60.png' : null,
        lineup: isHome ? lineup : [],
        bench: [],
        formation: null,
        statistics: {
          ball_possession: m.possession || 0,
          shots_on_goal: m.shotsonTarget || 0,
          shots_off_goal: (m.shots || 0) - (m.shotsonTarget || 0),
          shots: m.shots || 0,
          saves: 0,
          corner_kicks: 0,
          fouls: 0,
          offsides: 0,
        },
      },
      awayTeam: {
        id: isHome ? 999 : 60,
        name: awayTeam,
        shortName: isHome ? m.opponent : 'Bolton',
        crest: isHome ? null : 'https://crests.football-data.org/60.png',
        lineup: isHome ? [] : lineup,
        bench: [],
        formation: null,
        statistics: {
          ball_possession: m.possession ? 100 - m.possession : 0,
          shots_on_goal: m.oppositionShotonTarget || 0,
          shots_off_goal: (m.oppositionShots || 0) - (m.oppositionShotonTarget || 0),
          shots: m.oppositionShots || 0,
          saves: 0,
          corner_kicks: 0,
          fouls: 0,
          offsides: 0,
        },
      },
      score: {
        fullTime: { home: homeScore, away: awayScore },
        halfTime: { home: null, away: null },
      },
      goals,
      bookings,
      substitutions,
      venue: isHome ? 'University of Bolton Stadium' : m.opponent,
      attendance: null,
      referees: [],
      _boltonHistoric: true,
    };
  });
}

export default function ResultsPage() {
  const { favourites } = useFavourites();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState('all');

  useEffect(() => {
    async function fetchResults() {
       setError(null);
      setMatches([]);
      try {
        const url = selectedTeam === 'all'
          ? `/api/matches?teamIds=${favourites.map(t => t.id).join(',')}&status=FINISHED`
          : `/api/matches?teamId=${selectedTeam}&status=FINISHED`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch results');
        const data = await res.json();
        let matches = data.matches || [];

        // Bolton has no API data for 2025/26 — use historic JSON
        if (matches.length === 0 && String(selectedTeam) === '60') {
          matches = await fetchBoltonHistoricResults();
        }

        setMatches(matches);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [selectedTeam, favourites]);

  const grouped = matches.reduce((acc, match) => {
    const date = match.utcDate.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(match);
    return acc;
  }, {});

  return (
    <main>
      <header className="site-header">
        <div className="header-inner">
          <div className="header-crests">
            {favourites.map(t => (
              <img key={t.id} src={t.crest} alt={t.shortName} className="header-crest" />
            ))}
          </div>
          <div>
            <h1 className="site-title">Results</h1>
            <p className="site-subtitle">2026/27 Season</p>
          </div>
        </div>
      </header>

      <TeamSelector
        selectedTeam={selectedTeam}
        onChange={val => {
          setSelectedTeam(val);
          setLoading(true);
          setMatches([]);
        }}
      />

      <div className="content">
        {loading && <p className="state-msg">Loading results…</p>}
        {error && <p className="state-msg error">Could not load results: {error}</p>}
        {!loading && !error && matches.length === 0 && (
          <p className="state-msg">No results yet — the season hasn't started!</p>
        )}
        {!loading && !error && Object.entries(grouped)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([date, dayMatches]) => (
            <section key={date} className="day-group">
              <h2 className="day-label">
                {new Date(date + 'T12:00:00').toLocaleDateString('en-GB', {
                  weekday: 'long', day: 'numeric', month: 'long'
                })}
              </h2>
              <div className="match-list">
                {dayMatches.map(match => (
                  <div key={match.id} className="match-block">
                    <MatchCard match={match} />
                    <MatchSummary match={match} />
                    <MatchDetails match={match} />
                  </div>
                ))}
              </div>
            </section>
          ))}
      </div>
    </main>
  );
}