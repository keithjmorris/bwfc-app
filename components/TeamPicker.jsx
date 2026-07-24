'use client';

import { useState, useEffect } from 'react';
import { ALL_TEAMS } from '@/lib/allTeams';
import { BOLTON } from '@/lib/teams';

const MAX_ADDITIONAL = 2;

export default function TeamPicker({ onSave }) {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('fc_favourites');
    if (saved) {
      // Filter out Bolton as it's always included
      const parsed = JSON.parse(saved).filter(t => t.id !== BOLTON.id);
      setSelected(parsed);
    }
  }, []);

  function toggleTeam(team) {
    if (team.id === BOLTON.id) return; // Can't toggle Bolton
    setSelected(prev => {
      if (prev.find(t => t.id === team.id)) {
        return prev.filter(t => t.id !== team.id);
      }
      if (prev.length >= MAX_ADDITIONAL) return prev;
      return [...prev, team];
    });
  }

  function handleSave() {
    // Always include Bolton first
    const teams = [BOLTON, ...selected];
    localStorage.setItem('fc_favourites', JSON.stringify(teams));
    onSave(teams);
  }

  const filtered = ALL_TEAMS.filter(t =>
    t.shortName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="picker-overlay">
      <div className="picker-modal">
        <div className="picker-header">
          <h2 className="picker-title">Choose Your Teams</h2>
          <p className="picker-subtitle">
            Bolton is always included. Pick up to {MAX_ADDITIONAL} more teams.
            {selected.length > 0 && ` ${selected.length}/${MAX_ADDITIONAL} selected.`}
          </p>
        </div>

        <input
          className="picker-search"
          type="text"
          placeholder="Search teams…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />

        <div className="picker-grid">
          {/* Bolton always shown first and locked */}
          <button className="picker-team picker-locked" disabled>
            <img src={BOLTON.crest} alt={BOLTON.shortName} className="picker-crest" />
            <span className="picker-name">{BOLTON.shortName}</span>
            <span className="picker-lock">🔒</span>
          </button>

          {filtered
            .filter(t => t.id !== BOLTON.id)
            .map(team => {
              const isSelected = selected.some(t => t.id === team.id);
              const isDisabled = !isSelected && selected.length >= MAX_ADDITIONAL;
              return (
                <button
                  key={team.id}
                  className={`picker-team ${isSelected ? 'picker-selected' : ''} ${isDisabled ? 'picker-disabled' : ''}`}
                  onClick={() => toggleTeam(team)}
                  disabled={isDisabled}
                >
                  <img src={team.crest} alt={team.shortName} className="picker-crest" />
                  <span className="picker-name">{team.shortName}</span>
                  {isSelected && <span className="picker-check">✓</span>}
                </button>
              );
            })}
        </div>

        <div className="picker-footer">
          <div className="picker-selected-crests">
            <img src={BOLTON.crest} alt={BOLTON.shortName} className="picker-selected-crest" />
            {selected.map(t => (
              <img key={t.id} src={t.crest} alt={t.shortName} className="picker-selected-crest" />
            ))}
          </div>
          <button className="picker-save" onClick={handleSave}>
            Follow Bolton{selected.length > 0 ? ` + ${selected.length} more` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}