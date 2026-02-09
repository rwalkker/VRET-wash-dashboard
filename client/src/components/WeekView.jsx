import { useState, useEffect } from 'react'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { getTeamLabel } from '../utils/teams'

const VRET_METRICS = [
  'Transfer Out',
  'Transfer Out Dock',
  'Pick - Total',
  'Pick - Support',
  'OB Total',
  'C-Return Stow Total',
  'V-Return Pick Total',
  'V-Return Pack - Total',
  'V-Return Support',
  'Vendor Returns - Total'
]

export default function WeekView({ user, washEntries, weeklyActions }) {
  const [isWeekLocked, setIsWeekLocked] = useState(false)
  
  const weekStart = startOfWeek(new Date())
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const teamEntries = washEntries.filter(e => e.team === user.team)
  
  useEffect(() => {
    const weekKey = `week-locked-${user.team}-${format(weekStart, 'yyyy-MM-dd')}`
    const locked = localStorage.getItem(weekKey) === 'true'
    setIsWeekLocked(locked)
  }, [user.team, weekStart])
  
  const getEntryForDate = (date) => {
    return teamEntries.find(e => isSameDay(new Date(e.date), date))
  }

  const handleLockWeek = async () => {
    if (!confirm('Lock this week and send summary to Slack? Incomplete actions will be carried to next week.')) {
      return
    }

    const weekKey = `week-locked-${user.team}-${format(weekStart, 'yyyy-MM-dd')}`
    localStorage.setItem(weekKey, 'true')
    setIsWeekLocked(true)

    const nextWeekStart = addDays(weekStart, 7)
    const incompleteActions = currentWeekActions.filter(a => a.status !== 'Closed')
    
    incompleteActions.forEach(action => {
      const carriedAction = {
        ...action,
        id: undefined,
        weekStart: format(nextWeekStart, 'yyyy-MM-dd'),
        weeksPushed: (action.weeksPushed || 0) + 1,
        originalWeekStart: action.originalWeekStart || action.weekStart
      }
      
      fetch('https://vret-wash-backend.onrender.com/api/weekly-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(carriedAction)
      }).catch(err => console.error('Failed to carry over action:', err))
    })

    const weekData = {
      team: user.team,
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      weekEnd: format(addDays(weekStart, 6), 'yyyy-MM-dd'),
      entries: weekDays.map(day => getEntryForDate(day)).filter(e => e),
      actions: currentWeekActions,
      lockedBy: user.name
    }

    try {
      await fetch('https://vret-wash-backend.onrender.com/api/lock-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(weekData)
      })
      
      if (incompleteActions.length > 0) {
        alert(`Week locked! ${incompleteActions.length} incomplete action(s) carried to next week.`)
      } else {
        alert('Week locked and summary sent to Slack!')
      }
    } catch (err) {
      console.error('Failed to send week summary:', err)
      alert('Week locked locally, but failed to send Slack notification.')
    }
  }

  const handleUnlockWeek = () => {
    if (!confirm('Unlock this week for editing? Note: This will NOT unsend the Slack notification.')) {
      return
    }
    const weekKey = `week-locked-${user.team}-${format(weekStart, 'yyyy-MM-dd')}`
    localStorage.removeItem(weekKey)
    setIsWeekLocked(false)
  }

  const calculatePerformance = (achieved, goal) => {
    if (!achieved || !goal) return null
    const pct = (parseFloat(achieved) / parseFloat(goal)) * 100
    return pct.toFixed(1)
  }

  const getPerformanceColor = (pct) => {
    if (!pct) return 'bg-gray-100'
    if (pct >= 100) return 'bg-green-100 text-green-800'
    if (pct >= 90) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const currentWeekStart = format(weekStart, 'yyyy-MM-dd')
  const currentWeekActions = weeklyActions.filter(a => 
    a.weekStart === currentWeekStart && a.team === user.team
  )

  return (
    <div className="space-y-6">
      {/* Week Header with Lock Button */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Week of {format(weekStart, 'MMMM d, yyyy')} - {getTeamLabel(user.team)}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex gap-3">
            {isWeekLocked && (
              <button
                onClick={handleUnlockWeek}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
              >
                🔓 Unlock Week
              </button>
            )}
            <button
              onClick={handleLockWeek}
              disabled={isWeekLocked}
              className={`px-6 py-3 rounded-lg font-medium text-lg ${
                isWeekLocked 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {isWeekLocked ? '🔒 Week Locked' : '🔓 Lock Week & Send Summary'}
            </button>
          </div>
        </div>
        {isWeekLocked && (
          <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded">
            <p className="text-sm text-purple-800">
              ✓ This week has been locked and the summary was sent to Slack. Click "Unlock Week" to make changes.
            </p>
          </div>
        )}
      </div>

      {/* VRET Week Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">VRET Metrics - Daily Performance</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Metric</th>
                {weekDays.map(day => (
                  <th key={day.toString()} className="text-center py-2 px-2">
                    <div className="font-semibold">{format(day, 'EEE')}</div>
                    <div className="text-xs text-gray-500">{format(day, 'M/d')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VRET_METRICS.map(metric => (
                <tr key={metric} className="border-b">
                  <td className="py-3 px-3 font-medium">{metric}</td>
                  {weekDays.map(day => {
                    const entry = getEntryForDate(day)
                    const metricData = entry?.vretMetrics?.[metric]
                    const pct = metricData ? calculatePerformance(metricData.achieved, metricData.goal) : null
                    const bridge = entry?.vretBridges?.[metric]
                    
                    return (
                      <td key={day.toString()} className="text-center py-2 px-2">
                        {metricData ? (
                          <div className="space-y-1">
                            <div className="text-xs text-gray-600">
                              {metricData.achieved}/{metricData.goal}
                            </div>
                            {pct && (
                              <div className={`text-xs font-semibold px-2 py-1 rounded ${getPerformanceColor(pct)}`}>
                                {pct}%
                              </div>
                            )}
                            {bridge && (
                              <div className="text-xs text-gray-700 bg-blue-50 border border-blue-200 rounded px-2 py-1 mt-1 text-left">
                                {bridge}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-400 text-xs">-</div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Details */}
      <div className="grid grid-cols-1 gap-4">
        {weekDays.map(day => {
          const entry = getEntryForDate(day)
          if (!entry) return null

          return (
            <div key={day.toString()} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-800">
                  {format(day, 'EEEE, MMMM d')}
                </h3>
                {entry.locked && <span className="text-sm text-gray-600">🔒 Locked</span>}
              </div>

              {/* VRET Bridges */}
              {entry.vretBridges && Object.keys(entry.vretBridges).length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-blue-600 mb-2">VRET Bridges</h4>
                  {Object.entries(entry.vretBridges).map(([metric, bridge]) => (
                    bridge && (
                      <div key={metric} className="text-sm mb-1">
                        <span className="font-medium">{metric}:</span> {bridge}
                      </div>
                    )
                  ))}
                </div>
              )}

              {/* Safety */}
              {entry.wriIncidents && entry.wriIncidents.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <h4 className="text-sm font-semibold text-red-700 mb-2">⚠️ WRI Incidents Reported ({entry.wriIncidents.length})</h4>
                  {entry.wriIncidents.map((incident, idx) => (
                    <div key={idx} className="mb-3 last:mb-0">
                      <p className="text-xs font-semibold text-red-600 mb-1">Incident #{idx + 1}</p>
                      <p className="text-sm text-gray-700 mb-1">{incident.summary}</p>
                      {incident.austinLink && (
                        <a 
                          href={incident.austinLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View in Austin →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Weekly Actions Summary */}
      {currentWeekActions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-3 text-lg">Weekly Actions</h3>
          <div className="space-y-3">
            {currentWeekActions.map(action => (
              <div key={action.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{action.action}</p>
                    {action.weeksPushed > 0 && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded font-semibold ${
                          action.weeksPushed >= 3 ? 'bg-red-100 text-red-700' :
                          action.weeksPushed >= 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          ⚠️ Pushed {action.weeksPushed} week{action.weeksPushed > 1 ? 's' : ''}
                        </span>
                        {action.originalWeekStart && (
                          <span className="text-xs text-gray-500">
                            (Original: {format(new Date(action.originalWeekStart), 'MMM d')})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    action.status === 'Closed' ? 'bg-green-100 text-green-700' :
                    action.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {action.status}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>👤 {action.owner}</span>
                  {action.dueDate && <span>📅 Due: {format(new Date(action.dueDate), 'MMM d, yyyy')}</span>}
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    action.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                    action.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                    action.priority === 'Medium' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {action.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
