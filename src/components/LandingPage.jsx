import ActafyLogo from './ActafyLogo'

const FEATURES = [
  {
    icon: '📄',
    title: 'PDF profesional',
    desc: 'Genera actas listas para imprimir y firmar, con tu logo y membrete corporativo.',
  },
  {
    icon: '📊',
    title: 'Excel estructurado',
    desc: 'Exporta con colores, totales automáticos y tabla de actividades lista para compartir.',
  },
  {
    icon: '📝',
    title: 'Word editable',
    desc: 'Documento Word que puedes ajustar antes de enviar, con todas las firmas incluidas.',
  },
  {
    icon: '📋',
    title: 'Historial de actas',
    desc: 'Lleva el registro de todas tus actas con estado, valor y filtros por fecha.',
  },
  {
    icon: '🏗️',
    title: 'Catálogo de actividades',
    desc: 'Guarda tus actividades con precio unitario para llenar actas en segundos.',
  },
  {
    icon: '🔒',
    title: 'Datos en la nube',
    desc: 'Tu información segura y accesible desde cualquier dispositivo con tu cuenta.',
  },
]

export default function LandingPage({ onLogin, onRegister }) {
  return (
    <div style={{ minHeight: '100vh', fontFamily: 'inherit' }}>

      {/* ── Navbar ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px', maxWidth: 960, margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="32" height="32" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="#42ABDE"/>
            <rect x="26" y="33" width="48" height="42" rx="5" fill="white"/>
            <rect x="37" y="27" width="26" height="13" rx="5" fill="white"/>
            <circle cx="50" cy="30" r="3.8" fill="#42ABDE"/>
            <path d="M 35 55 L 46 66 L 65 44" stroke="#42ABDE" strokeWidth="5.5"
                  fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily: "'Pacifico', cursive", fontSize: 20, color: '#1B3A5C', letterSpacing: '-0.3px' }}>
            Actafy
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onLogin}
            style={{ fontSize: 13, padding: '8px 18px', borderRadius: 8, border: '1px solid #CBD5E0', background: '#fff', cursor: 'pointer', fontWeight: 500 }}
          >
            Iniciar sesión
          </button>
          <button
            onClick={onRegister}
            style={{ fontSize: 13, padding: '8px 18px', borderRadius: 8, border: 'none', background: '#42ABDE', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
          >
            Registrarse gratis
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ textAlign: 'center', padding: '60px 24px 50px', maxWidth: 680, margin: '0 auto' }}>
        <ActafyLogo size={110} showText={true} showSub={false} />

        <h1 style={{
          fontSize: 'clamp(26px, 5vw, 42px)', fontWeight: 800,
          color: '#1B3A5C', marginTop: 28, lineHeight: 1.2,
        }}>
          Genera actas de obra<br />
          <span style={{ color: '#42ABDE' }}>en segundos</span>
        </h1>

        <p style={{ fontSize: 16, color: '#64748B', marginTop: 16, lineHeight: 1.6, maxWidth: 520, margin: '16px auto 0' }}>
          La herramienta para contratistas colombianos que necesitan crear actas de avance de obra
          profesionales en PDF, Excel y Word — con su logo, AIU e IVA incluidos.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
          <button
            onClick={onRegister}
            style={{
              padding: '14px 32px', fontSize: 15, fontWeight: 700, borderRadius: 10,
              border: 'none', background: '#42ABDE', color: '#fff', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(66,171,222,0.4)',
            }}
          >
            Crear cuenta gratis →
          </button>
          <button
            onClick={onLogin}
            style={{
              padding: '14px 28px', fontSize: 15, fontWeight: 600, borderRadius: 10,
              border: '2px solid #CBD5E0', background: '#fff', color: '#1B3A5C', cursor: 'pointer',
            }}
          >
            Ya tengo cuenta
          </button>
        </div>

        <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 14 }}>
          Sin tarjeta de crédito · Funciona desde el navegador
        </p>
      </section>

      {/* ── Preview mockup ── */}
      <section style={{ maxWidth: 800, margin: '0 auto 60px', padding: '0 24px' }}>
        <div style={{
          background: 'white', borderRadius: 16, padding: '24px',
          boxShadow: '0 8px 40px rgba(27,58,92,0.12)',
          border: '1px solid #E2EAF4',
        }}>
          {/* Barra simulada */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {['#FF5F57','#FFBD2E','#28C840'].map(c => (
              <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
            ))}
          </div>
          {/* Mini topbar simulado */}
          <div style={{
            background: 'linear-gradient(90deg, #1B3A5C, #2e8ec0)',
            borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
          }}>
            <svg width="24" height="24" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="#42ABDE"/>
              <rect x="26" y="33" width="48" height="42" rx="5" fill="white"/>
              <rect x="37" y="27" width="26" height="13" rx="5" fill="white"/>
              <circle cx="50" cy="30" r="3.8" fill="#42ABDE"/>
              <path d="M 35 55 L 46 66 L 65 44" stroke="#42ABDE" strokeWidth="5.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.7)', borderRadius: 4, width: 120, marginBottom: 4 }} />
              <div style={{ height: 6, background: 'rgba(255,255,255,0.3)', borderRadius: 4, width: 80 }} />
            </div>
            <div style={{ height: 28, width: 80, background: 'rgba(255,255,255,0.15)', borderRadius: 6 }} />
          </div>
          {/* Métricas simuladas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            {[['12', 'Total actas'], ['$84.2M', 'Valor acumulado'], ['5', 'Pagadas']].map(([v, l]) => (
              <div key={l} style={{ background: '#F4F7FB', borderRadius: 10, padding: '12px', textAlign: 'center', border: '1px solid #E2EAF4' }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: '#1B3A5C' }}>{v}</p>
                <p style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>{l}</p>
              </div>
            ))}
          </div>
          {/* Actas simuladas */}
          {[
            { n: '08', obra: 'Construcción sede principal', cliente: 'Empresa XYZ S.A.S', val: '$12.4M', est: 'Firmada', ec: '#FEF3E2', ef: '#9A5A0A' },
            { n: '07', obra: 'Adecuación oficinas piso 3', cliente: 'Inmobiliaria ABC', val: '$8.1M', est: 'Pagada', ec: '#EAF3DE', ef: '#1A6B35' },
            { n: '06', obra: 'Reforzamiento estructural', cliente: 'Constructora DEF', val: '$5.6M', est: 'Generada', ec: '#EBF3FB', ef: '#2563A6' },
          ].map(a => (
            <div key={a.n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#fff', borderRadius: 10, border: '1px solid #E2EAF4', marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, background: '#1B3A5C', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0, textAlign: 'center', lineHeight: 1.2 }}>
                No.<br/>{a.n}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.obra}</p>
                <p style={{ fontSize: 10, color: '#64748B', marginTop: 1 }}>{a.cliente}</p>
              </div>
              <p style={{ fontWeight: 700, fontSize: 12, color: '#1A6B35', flexShrink: 0 }}>{a.val}</p>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 7px', borderRadius: 5, background: a.ec, color: a.ef, flexShrink: 0 }}>{a.est}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Características ── */}
      <section style={{ maxWidth: 900, margin: '0 auto 70px', padding: '0 24px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 24, fontWeight: 800, color: '#1B3A5C', marginBottom: 32 }}>
          Todo lo que necesitas para tus actas
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{
              background: '#fff', borderRadius: 14, padding: '20px',
              border: '1px solid #E2EAF4', boxShadow: '0 2px 8px rgba(27,58,92,0.06)',
            }}>
              <p style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</p>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#1B3A5C', marginBottom: 6 }}>{f.title}</p>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA final ── */}
      <section style={{
        textAlign: 'center', padding: '50px 24px 70px',
        background: 'linear-gradient(135deg, #1B3A5C 0%, #1e5a8a 60%, #42ABDE 100%)',
      }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
          Empieza a generar actas hoy
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>
          Crea tu cuenta gratis y genera tu primera acta en menos de 5 minutos.
        </p>
        <button
          onClick={onRegister}
          style={{
            padding: '14px 36px', fontSize: 15, fontWeight: 700, borderRadius: 10,
            border: 'none', background: '#fff', color: '#1B3A5C', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}
        >
          Crear cuenta gratis →
        </button>
      </section>

      {/* ── Footer ── */}
      <footer style={{ textAlign: 'center', padding: '20px 24px', background: '#1B3A5C' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          © {new Date().getFullYear()} Actafy · Hecho para contratistas colombianos
        </p>
      </footer>
    </div>
  )
}
