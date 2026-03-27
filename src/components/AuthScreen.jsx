import { useState } from 'react'
import { useAuth } from './AuthContext'
import ActafyLogo from './ActafyLogo'

// ── AuthScreen ─────────────────────────────────────────────────────────────
export default function AuthScreen({ initialMode = 'login', onBack }) {
  const [mode, setMode] = useState(initialMode) // 'login' | 'register' | 'forgot'

  if (mode === 'forgot')    return <ForgotPasswordForm onBack={() => setMode('login')} />
  if (mode === 'register')  return <RegisterForm onSwitch={() => setMode('login')} onBack={onBack} />
  return <LoginForm onSwitch={() => setMode('register')} onForgot={() => setMode('forgot')} onBack={onBack} />
}

// ── Login ──────────────────────────────────────────────────────────────────
function LoginForm({ onSwitch, onForgot, onBack }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [pass, setPass]   = useState('')
  const [err, setErr]     = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!email || !pass) return
    setLoading(true)
    setErr('')

    // Si tarda más de 10s, mostrar error y liberar botón
    const guard = setTimeout(() => {
      setLoading(false)
      setErr('La conexión tardó demasiado. Verifica tu internet e intenta de nuevo.')
    }, 10000)

    const e = await login(email.trim().toLowerCase(), pass)
    clearTimeout(guard)

    if (e) {
      // Solo resetear loading si hay error — si fue exitoso el componente
      // se desmonta solo cuando AuthContext setea el usuario
      setErr(e)
      setLoading(false)
    }
    // Sin error: "Entrando…" se mantiene hasta que App.jsx cambia de vista
  }

  return (
    <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <div style={{ width: 340 }}>
        {onBack && (
          <button onClick={onBack} style={{ marginBottom: 16, fontSize: 12, color: 'var(--sub)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            ← Volver al inicio
          </button>
        )}
        <Logo />
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, color: 'var(--azul)' }}>
            Iniciar sesión
          </h2>
          {err && <div className="alert alert-err">{err}</div>}
          <Field label="Email">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="tu@email.com" />
          </Field>
          <Field label="Contraseña" style={{ marginBottom: 6 }}>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
          </Field>
          <div style={{ textAlign: 'right', marginBottom: 18 }}>
            <span onClick={onForgot} style={{ fontSize: 12, color: 'var(--azul2)', cursor: 'pointer', fontWeight: 500 }}>
              ¿Olvidaste tu contraseña?
            </span>
          </div>
          <button className="btn-primary" style={{ width: '100%', marginBottom: 12 }} onClick={submit} disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--sub)' }}>
            ¿No tienes cuenta?{' '}
            <span style={{ color: 'var(--azul2)', cursor: 'pointer', fontWeight: 600 }} onClick={onSwitch}>
              Regístrate
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Register ───────────────────────────────────────────────────────────────
function RegisterForm({ onSwitch }) {
  const { register } = useAuth()
  const [f, setF]       = useState({ email: '', pass: '', nombre: '', nit: '' })
  const [err, setErr]   = useState('')
  const [msg, setMsg]   = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))

  const submit = async () => {
    setErr('')
    if (!f.email.trim())    { setErr('El email es obligatorio'); return }
    if (f.pass.length < 8)  { setErr('La contraseña debe tener al menos 8 caracteres'); return }
    if (!/[A-Za-z]/.test(f.pass) || !/[0-9]/.test(f.pass)) {
      setErr('La contraseña debe tener al menos una letra y un número'); return
    }
    if (!f.nombre.trim())   { setErr('El nombre de tu empresa es obligatorio'); return }
    setLoading(true)
    setMsg('')
    const e = await register(f.email.trim().toLowerCase(), f.pass, f.nombre.trim(), f.nit.trim())
    if (e) {
      setErr(e)
    } else {
      setMsg('¡Cuenta creada! Si recibes un email de confirmación, ábrelo antes de entrar.')
    }
    setLoading(false)
  }

  return (
    <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
      <div style={{ width: 380 }}>
        <Logo />
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: 'var(--azul)' }}>Crear cuenta</h2>
          <p style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 18 }}>Configura tu empresa contratista</p>
          {err && <div className="alert alert-err">{err}</div>}
          {msg && <div className="alert alert-ok">{msg}</div>}
          <div className="sect-title">Acceso</div>
          <div className="grid2" style={{ marginBottom: 12 }}>
            <Field label="Email">
              <input type="email" value={f.email} onChange={e => set('email', e.target.value)} placeholder="tu@email.com" />
            </Field>
            <Field label="Contraseña">
              <input
                type="password" value={f.pass}
                onChange={e => set('pass', e.target.value)}
                placeholder="Mín. 8 caracteres"
                style={{ borderColor: f.pass && f.pass.length < 8 ? 'var(--rojo)' : undefined }}
              />
              {f.pass.length > 0 && (
                <PasswordStrength pass={f.pass} />
              )}
            </Field>
          </div>
          <div className="sect-title">Datos de la empresa</div>
          <Field label="Nombre / Razón social" style={{ marginBottom: 10 }}>
            <input value={f.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Empresa Constructora S.A.S" />
          </Field>
          <Field label="NIT" style={{ marginBottom: 20 }}>
            <input value={f.nit} onChange={e => set('nit', e.target.value)} placeholder="900.000.000-0" />
          </Field>
          <button className="btn-primary" style={{ width: '100%', marginBottom: 10 }} onClick={submit} disabled={loading}>
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
          <button style={{ width: '100%' }} onClick={onSwitch}>← Volver al login</button>
        </div>
      </div>
    </div>
  )
}

// ── Forgot password ────────────────────────────────────────────────────────
function ForgotPasswordForm({ onBack }) {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]   = useState(false)
  const [err, setErr]     = useState('')

  const submit = async () => {
    if (!email) return
    setLoading(true)
    setErr('')
    const e = await resetPassword(email.trim().toLowerCase())
    if (e) {
      setErr(e)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <div style={{ width: 340 }}>
        <Logo />
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: 'var(--azul)' }}>
            Recuperar contraseña
          </h2>
          {!sent ? (
            <>
              <p style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 18 }}>
                Escribe tu email y te enviamos un enlace para crear una nueva contraseña.
              </p>
              {err && <div className="alert alert-err">{err}</div>}
              <Field label="Email" style={{ marginBottom: 18 }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  placeholder="tu@email.com"
                  autoFocus
                />
              </Field>
              <button className="btn-primary" style={{ width: '100%', marginBottom: 10 }} onClick={submit} disabled={loading}>
                {loading ? 'Enviando…' : 'Enviar enlace'}
              </button>
              <button style={{ width: '100%' }} onClick={onBack}>← Volver al login</button>
            </>
          ) : (
            <>
              <div className="alert alert-ok" style={{ marginBottom: 18 }}>
                ¡Listo! Revisa tu bandeja de entrada — te enviamos el enlace de recuperación a <strong>{email}</strong>.
              </div>
              <p style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 18 }}>
                Haz clic en el enlace del email para crear tu nueva contraseña. Si no lo ves, revisa spam.
              </p>
              <button style={{ width: '100%' }} onClick={onBack}>← Volver al login</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Reset password (se muestra cuando el usuario llega desde el email) ─────
export function ResetPasswordForm() {
  const { updatePassword, logout } = useAuth()
  const [pass, setPass]       = useState('')
  const [pass2, setPass2]     = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState('')
  const [done, setDone]       = useState(false)

  const submit = async () => {
    if (!pass || pass.length < 8)  { setErr('La contraseña debe tener al menos 8 caracteres'); return }
    if (!/[A-Za-z]/.test(pass) || !/[0-9]/.test(pass)) { setErr('Debe tener al menos una letra y un número'); return }
    if (pass !== pass2) { setErr('Las contraseñas no coinciden'); return }
    setLoading(true)
    setErr('')
    const e = await updatePassword(pass)
    if (e) {
      setErr(e)
    } else {
      setDone(true)
    }
    setLoading(false)
  }

  return (
    <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <div style={{ width: 340 }}>
        <Logo />
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: 'var(--azul)' }}>
            Nueva contraseña
          </h2>
          {!done ? (
            <>
              <p style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 18 }}>
                Escribe tu nueva contraseña para acceder a Actafy.
              </p>
              {err && <div className="alert alert-err">{err}</div>}
              <Field label="Nueva contraseña" style={{ marginBottom: 10 }}>
                <input type="password" value={pass} onChange={e => setPass(e.target.value)} autoFocus placeholder="Mín. 8 caracteres con letras y números"
                  style={{ borderColor: pass && pass.length < 8 ? 'var(--rojo)' : undefined }} />
                {pass.length > 0 && <PasswordStrength pass={pass} />}
              </Field>
              <Field label="Confirmar contraseña" style={{ marginBottom: 18 }}>
                <input type="password" value={pass2} onChange={e => setPass2(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
              </Field>
              <button className="btn-primary" style={{ width: '100%' }} onClick={submit} disabled={loading}>
                {loading ? 'Guardando…' : 'Guardar contraseña'}
              </button>
            </>
          ) : (
            <>
              <div className="alert alert-ok" style={{ marginBottom: 18 }}>
                ¡Contraseña actualizada! Ya puedes usar tu cuenta normalmente.
              </div>
              <p style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 18 }}>
                Quedaste con la sesión iniciada automáticamente.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Indicador de fortaleza de contraseña ───────────────────────────────────
function PasswordStrength({ pass }) {
  const hasLen    = pass.length >= 8
  const hasLetter = /[A-Za-z]/.test(pass)
  const hasNumber = /[0-9]/.test(pass)
  const hasSpec   = /[^A-Za-z0-9]/.test(pass)
  const score     = [hasLen, hasLetter, hasNumber, hasSpec].filter(Boolean).length

  const [color, label] =
    score <= 1 ? ['var(--rojo)',  'Débil']
  : score === 2 ? ['#E59B00',    'Regular']
  : score === 3 ? ['#42ABDE',    'Buena']
  :               ['var(--verde)','Fuerte']

  return (
    <div style={{ marginTop: 5 }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= score ? color : 'var(--borde)', transition: 'background 0.2s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--sub)' }}>
        <span style={{ color }}>Contraseña {label}</span>
        <span>{!hasLen && '8+ chars · '}{!hasLetter && 'letras · '}{!hasNumber && 'números'}</span>
      </div>
    </div>
  )
}

// ── Shared ─────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div style={{ marginBottom: 28 }}>
      <ActafyLogo size={96} showText={true} showSub={true} />
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
