export const TEAMS = [
  { id: 'A', label: 'Team A - Front Half Days', fullName: 'Front Half Days (Sun-Wed 6a-6p)' },
  { id: 'B', label: 'Team B - Front Half Nights', fullName: 'Front Half Nights (Sun-Wed 6p-6a)' },
  { id: 'C', label: 'Team C - Back Half Days', fullName: 'Back Half Days (Wed-Sat 6a-6p)' },
  { id: 'D', label: 'Team D - Back Half Nights', fullName: 'Back Half Nights (Wed-Sat 6p-6a)' }
]

export const getTeamLabel = (teamId) => {
  const team = TEAMS.find(t => t.id === teamId)
  return team ? team.label : `Team ${teamId}`
}

export const getTeamFullName = (teamId) => {
  const team = TEAMS.find(t => t.id === teamId)
  return team ? team.fullName : `Team ${teamId}`
}
