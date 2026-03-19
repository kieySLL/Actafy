import { useState } from 'react'
import { AuthProvider, useAuth } from './components/AuthContext'
import AuthScreen from './components/AuthScreen'
import ActaEditor from './components/ActaEditor'
import Settings   from './components/Settings'

function AppInner() {
  const { user, loading, logout } = useAuth()
  const [view, setView] = useState('acta')

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, border: '3px solid #CBD5E0', borderTopColor: '#1B3A5C', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <p style={{ color: '#64748B', fontSize: 13 }}>Cargando…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!user) return <AuthScreen />

  if (view === 'settings') return <Settings onBack={() => setView('acta')} />

  return <ActaEditor onSettings={() => setView('settings')} onLogout={logout} />
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
