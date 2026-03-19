import { useState } from 'react'
import { AuthProvider, useAuth } from './components/AuthContext'
import AuthScreen from './components/AuthScreen'
import ActaEditor from './components/ActaEditor'
import Settings from './components/Settings'
import HistorialActas from './components/HistorialActas'

function AppInner() {
  const { user, logout } = useAuth()
  const [view, setView] = useState('acta') // 'acta' | 'settings' | 'historial'
  const [editActa, setEditActa] = useState(null) // null | { id, form }

  if (!user) return <AuthScreen />

  const handleEdit = (actaData) => {
    setEditActa(actaData)
    setView('acta')
  }

  const handleNew = () => {
    setEditActa(null)
  }

  if (view === 'settings')   return <Settings onBack={() => setView('acta')} />
  if (view === 'historial')  return <HistorialActas onBack={() => setView('acta')} onEdit={handleEdit} />

  return (
    <ActaEditor
      key={editActa?.id || 'new'}
      initialForm={editActa?.form}
      actaId={editActa?.id}
      onNew={handleNew}
      onSettings={() => setView('settings')}
      onHistorial={() => setView('historial')}
      onLogout={logout}
    />
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
