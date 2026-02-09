import { useState } from 'react'
import { format, startOfWeek, addWeeks } from 'date-fns'

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']
const STATUSES = ['Open', 'In Progress', 'Closed']

export default function WeeklyActions({ user, socket, weeklyActions }) {
  const [showModal, setShowModal] = useState(false)
  const [newAction, setNewAction] = useState({
    action: '',
    owner: user.name,
    dueDate: '',
    status: 'Open',
    priority: 'Medium'
  })

  const currentWeekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd')
  const lastWeekStart = format(addWeeks(startOfWeek(new Date()), -1), 'yyyy-MM-dd')

  const currentWeekActions = weeklyActions.filter(a => a.weekStart === currentWeekStart)
  const lastWeekActions = weeklyActions.filter(a => a.weekStart === lastWeekStart)

  const handleAddAction = (e) => {
    e.preventDefault()
    socket.emit('save-weekly-action', {
      ...newAction,
      weekStart: currentWeekStart,
      createdBy: user.name,
      team: user.team
    })
    setNewAction({
      action: '',
      owner: user.name,
      dueDate: '',
      status: 'Open',
      priority: 'Medium'
    })
    setShowModal(false)
  }

  const handleUpdateAction = (action, updates) => {
    socket.emit('save-weekly-action', { ...action, ...updates })
  }

  const getPriorityColor = (priority) => {
    const colors = {
      Low: 'bg-gray-100 text-gray-700',
      Medium: 'bg-blue-100 text-blue-700',
      High: 'bg-orange-100 text-orange-700',
      Critical: 'bg-red-100 text-red-700'
    }
    return colors[priority] || colors.Medium
  }

  const getStatusColor = (status) => {
    const colors = {
      Open: 'bg-yellow-100 text-yellow-700',
      'In Progress': 'bg-blue-100 text-blue-700',
      Closed: 'bg-green-100 text-green-700'
    }
    return colors[status] || colors.Open
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Weekly Actions</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          + Add Action
        </button>
      </div>

      {/* Last Week's Actions */}
      {lastWeekActions.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="text-orange-600">⚠️</span>
            Previous Week Actions (Carry Over)
          </h3>
          <div className="space-y-2">
            {lastWeekActions.map(action => (
              <ActionCard 
                key={action.id} 
                action={action} 
                onUpdate={handleUpdateAction}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>
        </div>
      )}

      {/* Current Week Actions */}
      <div>
        <h3 className="font-semibold text-gray-700 mb-3">This Week</h3>
        {currentWeekActions.length === 0 ? (
          <p className="text-gray-500 text-sm">No actions for this week yet.</p>
        ) : (
          <div className="space-y-2">
            {currentWeekActions.map(action => (
              <ActionCard 
                key={action.id} 
                action={action} 
                onUpdate={handleUpdateAction}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Action Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-4">Add Weekly Action</h3>
            <form onSubmit={handleAddAction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action Item *</label>
                <textarea
                  value={newAction.action}
                  onChange={(e) => setNewAction({ ...newAction, action: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows="3"
                  placeholder="Describe the action to be taken..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner *</label>
                  <input
                    type="text"
                    value={newAction.owner}
                    onChange={(e) => setNewAction({ ...newAction, owner: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Person responsible"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={newAction.dueDate}
                    onChange={(e) => setNewAction({ ...newAction, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newAction.priority}
                    onChange={(e) => setNewAction({ ...newAction, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={newAction.status}
                    onChange={(e) => setNewAction({ ...newAction, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  Add Action
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionCard({ action, onUpdate, getPriorityColor, getStatusColor }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm text-gray-800 mb-2 font-medium">{action.action}</p>
          {action.weeksPushed > 0 && (
            <div className="mb-2">
              <span className={`text-xs px-2 py-1 rounded font-semibold ${
                action.weeksPushed >= 3 ? 'bg-red-100 text-red-700' :
                action.weeksPushed >= 2 ? 'bg-orange-100 text-orange-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                ⚠️ Pushed {action.weeksPushed} week{action.weeksPushed > 1 ? 's' : ''}
              </span>
              {action.originalWeekStart && (
                <span className="text-xs text-gray-500 ml-2">
                  (Original: {format(new Date(action.originalWeekStart), 'MMM d')})
                </span>
              )}
            </div>
          )}
          <div className="flex gap-2 text-xs flex-wrap">
            <span className={`px-2 py-1 rounded ${getPriorityColor(action.priority)}`}>
              {action.priority}
            </span>
            <span className={`px-2 py-1 rounded ${getStatusColor(action.status)}`}>
              {action.status}
            </span>
            <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded">Owner: {action.owner}</span>
            {action.dueDate && <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded">Due: {format(new Date(action.dueDate), 'MMM d, yyyy')}</span>}
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 text-sm ml-2"
        >
          {isExpanded ? 'Hide' : 'Edit'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Status</label>
              <select
                value={action.status}
                onChange={(e) => onUpdate(action, { status: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Priority</label>
              <select
                value={action.priority}
                onChange={(e) => onUpdate(action, { priority: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Owner</label>
            <input
              type="text"
              value={action.owner}
              onChange={(e) => onUpdate(action, { owner: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Due Date</label>
            <input
              type="date"
              value={action.dueDate}
              onChange={(e) => onUpdate(action, { dueDate: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      )}
    </div>
  )
}
