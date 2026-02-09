import { useState, useEffect } from 'react'
import { format, startOfWeek, addDays } from 'date-fns'
import DailyWashEntry from './DailyWashEntry'
import WeeklyActions from './WeeklyActions'
import WeekView from './WeekView'
import { getTeamLabel } from '../utils/teams'

export default function Dashboard({ user, socket, onLogout }) {
  const [currentView, setCurrentView] = useState('entry')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [washEntries, setWashEntries] = useState([])
  const [weeklyActions, setWeeklyActions] = useState([])

  useEffect(() => {
    loadData()

    socket.on('wash-entry-updated', (entry) => {
      setWashEntries(prev => {
        const index = prev.findIndex(e => e.id === entry.id)
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = entry
          return updated
        }
        return [entry, ...prev]
      })
    })

    socket.on('weekly-action-updated', (action) => {
      setWeeklyActions(prev => {
        const index = prev.findIndex(a => a.id === action.id)
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = action
          return updated
        }
        return [action, ...prev]
      })
    })

    return () => {
      socket.off('wash-entry-updated')
      socket.off('weekly-action-updated')
    }
  }, [socket])

  const loadData = async () => {
    try {
      const [entriesRes, actionsRes] = await Promise.all([
        fetch('https://vret-wash-backend.onrender.com/api/wash-entries'),
        fetch('https://vret-wash-backend.onrender.com/api/weekly-actions')
      ])
      setWashEntries(await entriesRes.json())
      setWeeklyActions(await actionsRes.json())
    } catch (err) {
      console.error('Failed to load data:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="VRET WASH Logo" className="h-12 w-auto" />
            <div>
              <h1 className="text-2xl font-bold text-white">VRET WASH Dashboard</h1>
              <p className="text-sm text-orange-100">{getTeamLabel(user.team)} - {user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView('entry')}
              className={`px-4 py-2 rounded-lg transition font-medium ${
                currentView === 'entry' 
                  ? 'bg-white text-orange-600 shadow-md' 
                  : 'bg-orange-400 text-white hover:bg-orange-300'
              }`}
            >
              Daily Entry
            </button>
            <button
              onClick={() => setCurrentView('week')}
              className={`px-4 py-2 rounded-lg transition font-medium ${
                currentView === 'week' 
                  ? 'bg-white text-orange-600 shadow-md' 
                  : 'bg-orange-400 text-white hover:bg-orange-300'
              }`}
            >
              Week View
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {currentView === 'entry' ? (
          <>
            <DailyWashEntry 
              user={user} 
              socket={socket} 
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              washEntries={washEntries}
            />
            <div className="mt-6">
              <WeeklyActions 
                user={user} 
                socket={socket} 
                weeklyActions={weeklyActions}
              />
            </div>
          </>
        ) : (
          <WeekView 
            user={user} 
            washEntries={washEntries}
            weeklyActions={weeklyActions}
          />
        )}
      </main>
    </div>
  )
}
