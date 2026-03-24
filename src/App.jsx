import { useState } from 'react'
import { AuthProvider, useAuth } from './components/AuthContext'
import AuthScreen, { ResetPasswordForm } from './components/AuthScreen'
import ActaEditor from './components/ActaEditor'
import Settings from './components/Settings'
import HistorialActas from './components/HistorialActas'
import ActafyLogo from './components/ActafyLogo'
import LandingPage from './components/LandingPage'

function AppInner() {
  const { user, logout, passwordRecovery, loading } = useAuth()
  const [view, setView]       = useState('historial')
  const [editActa, setEditActa] = useState(null)
  // authMode: null = landing, 'login' | 'register' = formulario
  const [authMode, setAuthMode] = useState(null)

  // Pantalla de carga mientras Supabase verifica la sesión
  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        height: '100vh', gap: 20,
      }}>
        <ActafyLogo size={100} showText={true} showSub={false} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--sub)', fontSize: 13 }}>
          <span className="spinner" style={{ borderTopColor: '#42ABDE', borderColor: '#c8e4f4' }} />
          Cargando…
        </div>
      </div>
    )
  }

  // El usuario llegó desde el email de recuperación
  if (passwordRecovery) return <ResetPasswordForm />

  // Sin sesión: mostrar landing o formulario de auth
  if (!user) {
    if (!authMode) {
      return (
        <LandingPage
          onLogin={() => setAuthMode('login')}
          onRegister={() => setAuthMode('register')}
        />
      )
    }
    return <AuthScreen initialMode={authMode} onBack={() => setAuthMode(null)} />
  }

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
