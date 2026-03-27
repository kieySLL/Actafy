import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './components/AuthContext'
import AuthScreen, { ResetPasswordForm } from './components/AuthScreen'
import ActaEditor from './components/ActaEditor'
import Settings from './components/Settings'
import HistorialActas from './components/HistorialActas'
import ActafyLogo from './components/ActafyLogo'
import LandingPage from './components/LandingPage'
import { countActas } from './lib/actasDB'

const PLAN_LIMIT   = { gratis: 5 }   // pro y empresarial = sin límite
const PRO_PRICE    = 2990000          // $29,900 COP en centavos
const WA_NUMBER = '573002454640'
const WA_MSG    = encodeURIComponent('Hola, quiero actualizar mi cuenta de Actafy al plan Pro 🚀')

function UpgradeModal({ used, limit, onClose }) {
  const handleWhatsApp = () => {
    window.open(`https://wa.me/${WA_NUMBER}?text=${WA_MSG}`, '_blank')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 18, padding: '40px 32px',
        maxWidth: 440, width: '100%', textAlign: 'center',
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
      }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🚀</div>
        <h2 style={{ margin: '0 0 8px', color: '#17365D', fontSize: 22, fontWeight: 800 }}>
          Límite del plan Gratis
        </h2>
        <p style={{ color: '#555', margin: '0 0 6px', lineHeight: 1.6, fontSize: 14 }}>
          Has usado <strong>{used} de {limit} actas</strong> del plan Gratis.
        </p>
        <p style={{ color: '#555', margin: '0 0 24px', lineHeight: 1.6, fontSize: 14 }}>
          Actualiza a <strong>Pro</strong> y crea actas ilimitadas con logo y exportación completa.
        </p>

        {/* Precio destacado */}
        <div style={{
          background: 'linear-gradient(135deg,#1B3A5C,#2780C0)',
          borderRadius: 12, padding: '18px 24px', marginBottom: 20, color: '#fff',
        }}>
          <div style={{ fontSize: 28, fontWeight: 900 }}>$29.900 <span style={{ fontSize: 14, fontWeight: 400 }}>COP/mes</span></div>
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>
            ✅ Actas ilimitadas &nbsp;·&nbsp; ✅ PDF, Excel y Word &nbsp;·&nbsp; ✅ Logo incluido
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onClose} style={{
            padding: '11px 22px', borderRadius: 8, border: '1px solid #ddd',
            background: '#f5f5f5', cursor: 'pointer', fontWeight: 600, fontSize: 14,
          }}>
            Ahora no
          </button>
          <button onClick={handleWhatsApp} style={{
            padding: '11px 26px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg,#25D366,#128C7E)',
            color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 15,
            boxShadow: '0 4px 14px rgba(37,211,102,0.4)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Contactar por WhatsApp
          </button>
        </div>
        <p style={{ fontSize: 11, color: '#aaa', marginTop: 14 }}>
          Te respondemos en minutos y activamos tu plan manualmente
        </p>
      </div>
    </div>
  )
}

// Modal de éxito cuando regresa de Wompi
function PaymentSuccessModal({ onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 18, padding: '40px 32px',
        maxWidth: 400, width: '100%', textAlign: 'center',
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
      }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
        <h2 style={{ margin: '0 0 8px', color: '#17365D', fontSize: 22, fontWeight: 800 }}>
          ¡Pago recibido!
        </h2>
        <p style={{ color: '#555', lineHeight: 1.6, fontSize: 14, margin: '0 0 24px' }}>
          Tu plan <strong>Pro</strong> se está activando. En unos segundos tendrás actas ilimitadas.
        </p>
        <button onClick={onClose} style={{
          padding: '12px 28px', borderRadius: 8, border: 'none',
          background: 'linear-gradient(135deg,#1e5aab,#42ABDE)',
          color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 15,
        }}>
          Continuar →
        </button>
      </div>
    </div>
  )
}

function AppInner() {
  const { user, userId, logout, passwordRecovery, loading, refreshProfile } = useAuth()
  const [view, setView]               = useState('historial')
  const [editActa, setEditActa]       = useState(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [actasUsed, setActasUsed]     = useState(0)
  const [showPayOk, setShowPayOk]     = useState(false)
  // authMode: null = landing, 'login' | 'register' = formulario
  const [authMode, setAuthMode] = useState(null)

  // Detectar regreso desde Wompi con pago exitoso
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment') === 'success') {
      setShowPayOk(true)
      // Limpiar param de la URL sin recargar
      window.history.replaceState({}, '', window.location.pathname)
      // Refrescar perfil para obtener plan actualizado
      if (userId && refreshProfile) {
        setTimeout(() => refreshProfile(userId), 3000)
      }
    }
  }, [userId])

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
      {showPayOk && (
        <PaymentSuccessModal onClose={() => setShowPayOk(false)} />
      )}
      {showUpgrade && (
        <UpgradeModal
          used={actasUsed}
          limit={PLAN_LIMIT.gratis}
          userId={userId}
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
