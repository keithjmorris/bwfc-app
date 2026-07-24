// Bolton is the fixed primary team
export const BOLTON = {
  id: 60,
  name: 'Bolton Wanderers FC',
  shortName: 'Bolton',
  tla: 'BOL',
  crest: 'https://crests.football-data.org/60.png',
  competition: 'ELC',
  competitionName: 'Championship',
  competitionId: 2016,
  color: '#263c7e',
};

// For compatibility with existing components
export const TEAMS = [BOLTON];

export function getTeamById(id) {
  return id === BOLTON.id ? BOLTON : null;
}