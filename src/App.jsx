import { useState } from 'react'
import { AuthProvider, useAuth } from './components/AuthContext'
import AuthScreen from './components/AuthScreen'
import ActaEditor from './components/ActaEditor'
import Settings from './components/Settings'
import HistorialActas from './components/HistorialActas'

function AppInner() {
  const { user, logout } = useAuth()
  const [view, setView] = useState('historial') // historial es la pantalla principal
  const [editActa, setEditActa] = useState(null) // null = nueva | { id, form } = existente

  if (!user) return <AuthScreen />

  const goHistorial = () => setView('historial')

  const handleNew = () => {
    setEditActa(null)
    setView('editor')
  }

  const handleEdit = (actaData) => {
    setEditActa(actaData)
    setView('editor')
  }

  if (view === 'settings') return <Settings onBack={goHistorial} />

  if (view === 'editor') return (
    <ActaEditor
      key={editActa?.id || 'new'}
      initialForm={editActa?.form}
      actaId={editActa?.id}
      onBack={goHistorial}
      onNew={handleNew}
      onSettings={() => setView('settings')}
      onLogout={logout}
    />
  )

  // view === 'historial' (default)
  return (
    <HistorialActas
      onNew={handleNew}
      onEdit={handleEdit}
      onSettings={() => setView('settings')}
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
