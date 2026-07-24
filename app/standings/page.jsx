'use client';

import { useEffect, useState } from 'react';
import { useFavourites } from '@/lib/FavouritesContext';

export default function StandingsPage() {
  const { favourites } = useFavourites();
  const [plStandings, setPlStandings] = useState([]);
  const [elcStandings, setElcStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStandings() {
      try {
        const [plRes, elcRes] = await Promise.all([
          fetch('/api/standings?competition=PL'),
          fetch('/api/standings?competition=ELC'),
        ]);

        if (!plRes.ok || !elcRes.ok) throw new Error('Failed to fetch standings');

        const plData = await plRes.json();
        const elcData = await elcRes.json();

        const trackedIds = new Set(favourites.map(t => t.id));

        const markTracked = standings =>
          standings?.map(group => ({
            ...group,
            table: group.table.map(row => ({
              ...row,
              tracked: trackedIds.has(row.team?.id),
            })),
          }));

        setPlStandings(markTracked(plData.standings)?.[0]?.table || []);
        setElcStandings(markTracked(elcData.standings)?.[0]?.table || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStandings();
  }, [favourites]);

  function StandingsTable({ title, rows, emblem }) {
    if (!rows || rows.length === 0) return null;
    return (
      <section className="standings-section">
        <div className="standings-header">
          {emblem && <img src={emblem} alt={title} className="competition-emblem" />}
          <h2 className="standings-title">{title}</h2>
        </div>
        <div className="standings-table-wrapper">
          <table className="standings-table">
            <thead>
              <tr>
                <th>#</th>
                <th className="team-col">Team</th>
                <th>P</th>
                <th>W</th>
                <th>D</th>
                <th>L</th>
                <th>GF</th>
                <th>GA</th>
                <th>GD</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.team.id} className={row.tracked ? 'tracked-team' : ''}>
                  <td className="pos-col">{row.position}</td>
                  <td className="team-col">
                    <img src={row.team.crest} alt="" className="table-crest" />
                    <span>{row.team.shortName || row.team.name}</span>
                  </td>
                  <td>{row.playedGames}</td>
                  <td>{row.won}</td>
                  <td>{row.draw}</td>
                  <td>{row.lost}</td>
                  <td>{row.goalsFor}</td>
                  <td>{row.goalsAgainst}</td>
                  <td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                  <td className="pts-col">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

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
            <h1 className="site-title">Tables</h1>
            <p className="site-subtitle">2026/27 Season</p>
          </div>
        </div>
      </header>

      <div className="content">
        {loading && <p className="state-msg">Loading tables…</p>}
        {error && <p className="state-msg error">Could not load tables: {error}</p>}
        {!loading && !error && (
          <>
            <StandingsTable
              title="Premier League"
              rows={plStandings}
              emblem="https://crests.football-data.org/PL.png"
            />
            <StandingsTable
              title="Championship"
              rows={elcStandings}
              emblem="https://crests.football-data.org/ELC.png"
            />
          </>
        )}
      </div>
    </main>
  );
}