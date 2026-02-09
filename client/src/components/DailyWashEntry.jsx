import { useState, useEffect } from 'react'
import { format } from 'date-fns'
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

export default function DailyWashEntry({ user, socket, selectedDate, setSelectedDate, washEntries }) {
  const [entry, setEntry] = useState(null)
  const [isLocked, setIsLocked] = useState(false)

  useEffect(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const existing = washEntries.find(e => 
      e.date === dateStr && e.team === user.team
    )
    
    if (existing) {
      setEntry(existing)
      setIsLocked(existing.locked || false)
    } else {
      setEntry(createEmptyEntry())
      setIsLocked(false)
    }
  }, [selectedDate, user.team, washEntries])

  const createEmptyEntry = () => ({
    date: format(selectedDate, 'yyyy-MM-dd'),
    team: user.team,
    author: user.name,
    vretMetrics: VRET_METRICS.reduce((acc, m) => ({
      ...acc,
      [m]: { achieved: '', goal: '' }
    }), {}),
    vretBridges: {},
    wriIncidents: [],
    handoffNotes: '',
    stationReadiness: '',
    leadershipCallouts: '',
    locked: false
  })

  const handleMetricChange = (metric, field, value) => {
    const updated = {
      ...entry,
      vretMetrics: {
        ...entry.vretMetrics,
        [metric]: { ...entry.vretMetrics[metric], [field]: value }
      }
    }
    setEntry(updated)
  }

  const handleBridgeChange = (metric, value) => {
    setEntry({
      ...entry,
      vretBridges: { ...entry.vretBridges, [metric]: value }
    })
  }

  const addWriIncident = () => {
    setEntry({
      ...entry,
      wriIncidents: [...(entry.wriIncidents || []), { summary: '', austinLink: '' }]
    })
  }

  const updateWriIncident = (index, field, value) => {
    const updated = [...(entry.wriIncidents || [])]
    updated[index] = { ...updated[index], [field]: value }
    setEntry({
      ...entry,
      wriIncidents: updated
    })
  }

  const removeWriIncident = (index) => {
    const updated = [...(entry.wriIncidents || [])]
    updated.splice(index, 1)
    setEntry({
      ...entry,
      wriIncidents: updated
    })
  }

  const handleCalloutsChange = (field, value) => {
    setEntry({
      ...entry,
      [field]: value
    })
  }

  const handleSave = () => {
    socket.emit('save-wash-entry', entry)
  }

  const toggleLock = () => {
    if (!isLocked && !confirm('Lock this entry and send to Slack? You can unlock it later if needed.')) {
      return
    }
    const updated = { ...entry, locked: !isLocked }
    setEntry(updated)
    setIsLocked(!isLocked)
    socket.emit('save-wash-entry', updated)
  }

  const handleUnlock = () => {
    if (!confirm('Unlock this entry for editing? Note: This will NOT unsend the Slack notification.')) {
      return
    }
    const updated = { ...entry, locked: false }
    setEntry(updated)
    setIsLocked(false)
    socket.emit('save-wash-entry', updated)
  }

  if (!entry) return <div>Loading...</div>

  return (
    <div className="flex gap-6">
      {/* Main Entry Form */}
      <div className="flex-1 bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Daily WASH Entry</h2>
            <p className="text-sm text-gray-600">{getTeamLabel(user.team)} - {format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <div className="flex gap-3">
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
              disabled={isLocked}
            />
            {isLocked && (
              <button
                onClick={handleUnlock}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
              >
                🔓 Unlock & Edit
              </button>
            )}
            <button
              onClick={toggleLock}
              className={`px-4 py-2 rounded-lg font-medium ${
                isLocked 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isLocked ? '🔒 Locked' : '🔓 Lock Entry'}
            </button>
            <button
              onClick={handleSave}
              disabled={isLocked}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              Save
            </button>
          </div>
        </div>

        {/* VRET Metrics Grid */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b">VRET Metrics</h3>
          <div className="space-y-4">
            {VRET_METRICS.map(metric => (
              <div key={metric} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-3">{metric}</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Achieved</label>
                    <input
                      type="number"
                      value={entry.vretMetrics[metric].achieved}
                      onChange={(e) => handleMetricChange(metric, 'achieved', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      disabled={isLocked}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      <a 
                        href="https://sliceit.corp.amazon.com/sliceit-v2?datasetName=ppr-slicer" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        LP Rate
                      </a>
                    </label>
                    <input
                      type="number"
                      value={entry.vretMetrics[metric].goal}
                      onChange={(e) => handleMetricChange(metric, 'goal', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      disabled={isLocked}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Bridge</label>
                    <textarea
                      value={entry.vretBridges[metric] || ''}
                      onChange={(e) => handleBridgeChange(metric, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      rows="1"
                      placeholder="Notes on misses..."
                      disabled={isLocked}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safety Section */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-700">Safety - Work Related Injuries</h3>
            <button
              onClick={addWriIncident}
              disabled={isLocked}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400"
            >
              + Add WRI
            </button>
          </div>

          {(!entry.wriIncidents || entry.wriIncidents.length === 0) ? (
            <p className="text-sm text-gray-500 italic">No WRI incidents reported</p>
          ) : (
            <div className="space-y-4">
              {entry.wriIncidents.map((incident, index) => (
                <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-red-700">WRI #{index + 1}</h4>
                    <button
                      onClick={() => removeWriIncident(index)}
                      disabled={isLocked}
                      className="text-red-600 hover:text-red-800 text-sm font-bold disabled:text-gray-400"
                    >
                      ✕ Remove
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Incident Summary</label>
                      <textarea
                        value={incident.summary}
                        onChange={(e) => updateWriIncident(index, 'summary', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                        rows="3"
                        placeholder="Describe the incident..."
                        disabled={isLocked}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Austin Link</label>
                      <input
                        type="url"
                        value={incident.austinLink}
                        onChange={(e) => updateWriIncident(index, 'austinLink', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                        placeholder="https://..."
                        disabled={isLocked}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Callouts */}
      <div className="w-80 bg-white rounded-lg shadow p-4 flex-shrink-0 space-y-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Shift Callouts</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Hand Off Notes</label>
          <textarea
            value={entry.handoffNotes || ''}
            onChange={(e) => handleCalloutsChange('handoffNotes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows="6"
            placeholder="Important information for the next shift..."
            disabled={isLocked}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Station Readiness Callouts</label>
          <textarea
            value={entry.stationReadiness || ''}
            onChange={(e) => handleCalloutsChange('stationReadiness', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows="6"
            placeholder="Station status, equipment issues, etc..."
            disabled={isLocked}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Leadership Callouts</label>
          <textarea
            value={entry.leadershipCallouts || ''}
            onChange={(e) => handleCalloutsChange('leadershipCallouts', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows="6"
            placeholder="Important updates for leadership..."
            disabled={isLocked}
          />
        </div>
      </div>
    </div>
  )
}
