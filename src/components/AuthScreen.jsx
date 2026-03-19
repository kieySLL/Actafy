import { useState } from 'react'
import { useAuth } from './AuthContext'

export default function AuthScreen() {
  const [mode, setMode] = useState('login')
  return mode === 'login'
    ? <LoginForm onSwitch={() => setMode('register')} />
    : <RegisterForm onSwitch={() => setMode('login')} />
}

function LoginForm({ onSwitch }) {
  const { login, mode } = useAuth()
  const [email, setEmail]   = useState('')
  const [pass,  setPass]    = useState('')
  const [err,   setErr]     = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!email || !pass) return setErr('Completa todos los campos')
    setLoading(true); setErr('')
    const e = await login(email.trim(), pass)
    if (e) setErr(e)
    setLoading(false)
  }

  return (
    <div style={pageStyle}>
      <div style={{ width: 340 }}>
        <Logo />
        <div className="card">
          <h2 style={h2}>Iniciar sesión</h2>
          {err && <div className="alert alert-err">{err}</div>}
          <Field label={mode === 'supabase' ? 'Email' : 'Email o usuario'}>
            <input
              type={mode === 'supabase' ? 'email' : 'text'}
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              autoComplete="email"
            />
          </Field>
          <Field label="Contraseña" style={{ marginBottom: 18 }}>
            <input
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              autoComplete="current-password"
            />
          </Field>
          <button
            className="btn-primary"
            style={{ width: '100%', marginBottom: 12, opacity: loading ? 0.7 : 1 }}
            onClick={submit}
            disabled={loading}
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
          <p style={linkRow}>
            ¿No tienes cuenta?{' '}
            <span style={link} onClick={onSwitch}>Regístrate</span>
          </p>
        </div>
        {mode === 'local' && (
          <div className="alert alert-warn" style={{ marginTop: 12, fontSize: 11 }}>
            Modo offline — datos guardados en este navegador. Configura Supabase para la nube.
          </div>
        )}
      </div>
    </div>
  )
}

function RegisterForm({ onSwitch }) {
  const { register, mode } = useAuth()
  const [f, setF]         = useState({ email: '', pass: '', nombre: '', nit: '' })
  const [err, setErr]     = useState('')
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))

  const submit = async () => {
    setLoading(true); setErr('')
    const e = await register(f.email.trim(), f.pass, f.nombre.trim(), f.nit.trim())
    if (e) { setErr(e); setLoading(false); return }
    if (mode === 'supabase') setConfirm(true)
    setLoading(false)
  }

  if (confirm) return (
    <div style={pageStyle}>
      <div style={{ width: 360, textAlign: 'center' }}>
        <Logo />
        <div className="card">
          <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
          <h2 style={{ ...h2, marginBottom: 8 }}>Revisa tu email</h2>
          <p style={{ fontSize: 13, color: 'var(--sub)', marginBottom: 18 }}>
            Te enviamos un enlace de confirmación a <strong>{f.email}</strong>.
            Haz clic en el enlace y luego inicia sesión.
          </p>
          <button onClick={onSwitch} style={{ width: '100%' }}>← Volver al login</button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={pageStyle}>
      <div style={{ width: 380 }}>
        <Logo />
        <div className="card">
          <h2 style={h2}>Crear cuenta</h2>
          <p style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 18 }}>Configura tu empresa contratista</p>
          {err && <div className="alert alert-err">{err}</div>}
          <div className="sect-title">Acceso</div>
          <div className="grid2" style={{ marginBottom: 10 }}>
            <Field label={mode === 'supabase' ? 'Email' : 'Email o usuario'}>
              <input type={mode === 'supabase' ? 'email' : 'text'} value={f.email} onChange={e => set('email', e.target.value)} autoComplete="email" />
            </Field>
            <Field label="Contraseña">
              <input type="password" value={f.pass} onChange={e => set('pass', e.target.value)} autoComplete="new-password" />
            </Field>
          </div>
          <div className="sect-title">Datos de la empresa</div>
          <Field label="Nombre / Razón social" style={{ marginBottom: 10 }}>
            <input value={f.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Constructora XYZ S.A.S" />
          </Field>
          <Field label="NIT" style={{ marginBottom: 20 }}>
            <input value={f.nit} onChange={e => set('nit', e.target.value)} placeholder="900.000.000-0" />
          </Field>
          <button
            className="btn-primary"
            style={{ width: '100%', marginBottom: 10, opacity: loading ? 0.7 : 1 }}
            onClick={submit}
            disabled={loading}
          >
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
          <button style={{ width: '100%' }} onClick={onSwitch}>← Volver al login</button>
        </div>
      </div>
    </div>
  )
}

// ── Shared ────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 24 }}>
      <div style={{ width: 52, height: 52, background: 'var(--azul)', borderRadius: 14, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="7" width="18" height="13" rx="2" fill="white" fillOpacity="0.9"/>
          <path d="M7 7V5a5 5 0 0 1 10 0v2" stroke="white" strokeWidth="1.5" fill="none"/>
          <circle cx="12" cy="13" r="2" fill="#1B3A5C"/>
        </svg>
      </div>
      <h1 style={{ fontSize: 19, fontWeight: 700, color: 'var(--azul)' }}>Actas de Obra</h1>
      <p style={{ fontSize: 12, color: 'var(--sub)', marginTop: 4 }}>Plataforma para contratistas · Colombia</p>
    </div>
  )
}

export function Field({ label, children, style }) {
  return (
    <div style={{ marginBottom: 10, ...style }}>
      <div className="label">{label}</div>
      {children}
    </div>
  )
}

const pageStyle = { display: 'flex', justifyContent: 'center', paddingTop: 48, minHeight: '100vh' }
const h2        = { fontSize: 15, fontWeight: 700, marginBottom: 18, color: 'var(--azul)' }
const linkRow   = { textAlign: 'center', fontSize: 12, color: 'var(--sub)' }
const link      = { color: 'var(--azul2)', cursor: 'pointer', fontWeight: 600 }
