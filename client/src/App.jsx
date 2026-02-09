import { useState, useEffect } from 'react'
import io from 'socket.io-client'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

const socket = io('https://vret-wash-backend.onrender.com')

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('vret-user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('vret-user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('vret-user')
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return <Dashboard user={user} socket={socket} onLogout={handleLogout} />
}

export default App
