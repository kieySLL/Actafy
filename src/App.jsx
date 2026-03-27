import { useState } from 'react'
import { AuthProvider, useAuth } from './components/AuthContext'
import AuthScreen, { ResetPasswordForm } from './components/AuthScreen'
import ActaEditor from './components/ActaEditor'
import Settings from './components/Settings'
import HistorialActas from './components/HistorialActas'
import ActafyLogo from './components/ActafyLogo'
import LandingPage from './components/LandingPage'
import { countActas } from './lib/actasDB'

const PLAN_LIMIT = { gratis: 5 }   // pro y empresarial = sin límite

function UpgradeModal({ used, limit, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '36px 32px',
        maxWidth: 420, width: '100%', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
        <h2 style={{ margin: '0 0 8px', color: '#17365D', fontSize: 22 }}>
          Límite del plan Gratis
        </h2>
        <p style={{ color: '#555', margin: '0 0 20px', lineHeight: 1.6 }}>
          Has usado <strong>{used} de {limit} actas</strong> disponibles en el plan Gratis.
          Actualiza a <strong>Pro</strong> para crear actas ilimitadas.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onClose} style={{
            padding: '10px 22px', borderRadius: 8, border: '1px solid #ddd',
            background: '#f5f5f5', cursor: 'pointer', fontWeight: 600,
          }}>
            Cerrar
          </button>
          <button onClick={() => { window.location.href = '/#precios'; onClose() }} style={{
            padding: '10px 22px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg,#1e5aab,#42ABDE)',
            color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 15,
          }}>
            Ver planes Pro →
          </button>
        </div>
      </div>
    </div>
  )
}

function AppInner() {
  const { user, userId, logout, passwordRecovery, loading } = useAuth()
  const [view, setView]         = useState('historial')
  const [editActa, setEditActa] = useState(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [actasUsed, setActasUsed]     = useState(0)
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

  const handleNew = async () => {
    const plan  = user?.plan || 'gratis'
    const limit = PLAN_LIMIT[plan]          // undefined = sin límite
    if (limit !== undefined) {
      try {
        const count = await countActas(userId)
        if (count >= limit) {
          setActasUsed(count)
          setShowUpgrade(true)
          return
        }
      } catch { /* si falla el conteo, dejamos pasar */ }
    }
    setEditActa(null)
    setView('editor')
  }

  const handleEdit = (actaData) => {
    setEditActa(actaData)
    setView('editor')
  }

  const handleLogout = () => { logout(); setAuthMode(null) }

  if (view === 'settings') return <Settings onBack={goHistorial} />

  if (view === 'editor') return (
    <ActaEditor
      key={editActa?.id || 'new'}
      initialForm={editActa?.form}
      actaId={editActa?.id}
      onBack={goHistorial}
      onNew={handleNew}
      onSettings={() => setView('settings')}
      onLogout={handleLogout}
    />
  )

  const plan  = user?.plan || 'gratis'
  const limit = PLAN_LIMIT[plan]

  return (
    <>
      {showUpgrade && (
        <UpgradeModal
          used={actasUsed}
          limit={PLAN_LIMIT.gratis}
          onClose={() => setShowUpgrade(false)}
        />
      )}
      <HistorialActas
        onNew={handleNew}
        onEdit={handleEdit}
        onSettings={() => setView('settings')}
        onLogout={handleLogout}
        planLimit={limit}
        userId={userId}
      />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
