import { useState } from 'react'
import { useAuth } from './AuthContext'

export default function AuthScreen() {
  const [mode, setMode] = useState('login')
  return mode === 'login'
    ? <LoginForm onSwitch={() => setMode('register')} />
    : <RegisterForm onSwitch={() => setMode('login')} />
}

function LoginForm({ onSwitch }) {
  const { login } = useAuth()
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [err, setErr] = useState('')

  const submit = () => {
    const e = login(u.trim().toLowerCase(), p)
    if (e) setErr(e)
  }

  return (
    <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <div style={{ width: 340 }}>
        <Logo />
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, color: 'var(--azul)' }}>
            Iniciar sesión
          </h2>
          {err && <div className="alert alert-err">{err}</div>}
          <Field label="Usuario">
            <input value={u} onChange={e => setU(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
          </Field>
          <Field label="Contraseña" style={{ marginBottom: 18 }}>
            <input type="password" value={p} onChange={e => setP(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
          </Field>
          <button className="btn-primary" style={{ width: '100%', marginBottom: 12 }} onClick={submit}>
            Entrar
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

function RegisterForm({ onSwitch }) {
  const { register } = useAuth()
  const [f, setF] = useState({ u: '', p: '', nombre: '', nit: '' })
  const [err, setErr] = useState('')
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))

  const submit = () => {
    const e = register(f.u.trim().toLowerCase(), f.p, f.nombre.trim(), f.nit.trim())
    if (e) setErr(e)
  }

  return (
    <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
      <div style={{ width: 380 }}>
        <Logo />
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: 'var(--azul)' }}>Crear cuenta</h2>
          <p style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 18 }}>Configura tu empresa contratista</p>
          {err && <div className="alert alert-err">{err}</div>}
          <div className="sect-title">Acceso</div>
          <div className="grid2" style={{ marginBottom: 12 }}>
            <Field label="Usuario"><input value={f.u} onChange={e => set('u', e.target.value)} /></Field>
            <Field label="Contraseña"><input type="password" value={f.p} onChange={e => set('p', e.target.value)} /></Field>
          </div>
          <div className="sect-title">Datos de la empresa</div>
          <Field label="Nombre / Razón social" style={{ marginBottom: 10 }}>
            <input value={f.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Empresa Constructora S.A.S" />
          </Field>
          <Field label="NIT" style={{ marginBottom: 20 }}>
            <input value={f.nit} onChange={e => set('nit', e.target.value)} placeholder="900.000.000-0" />
          </Field>
          <button className="btn-primary" style={{ width: '100%', marginBottom: 10 }} onClick={submit}>
            Crear cuenta
          </button>
          <button style={{ width: '100%' }} onClick={onSwitch}>← Volver al login</button>
        </div>
      </div>
    </div>
  )
}

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
      <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--azul)' }}>Actafy</h1>
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
