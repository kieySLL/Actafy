import { useEffect, useRef } from 'react'
import ActafyLogo from './ActafyLogo'

// ── Hook: añade clase 'visible' cuando el elemento entra al viewport ──────────
function useReveal(threshold = 0.12) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return ref
}

const FEATURES = [
  { icon: '📄', title: 'PDF profesional',        desc: 'Genera actas listas para imprimir y firmar, con tu logo y membrete corporativo.' },
  { icon: '📊', title: 'Excel estructurado',      desc: 'Exporta con colores, totales automáticos y tabla de actividades lista para compartir.' },
  { icon: '📝', title: 'Word editable',           desc: 'Documento Word que puedes ajustar antes de enviar, con todas las firmas incluidas.' },
  { icon: '📋', title: 'Historial de actas',      desc: 'Lleva el registro de todas tus actas con estado, valor y filtros por fecha.' },
  { icon: '🏗️', title: 'Catálogo de actividades', desc: 'Guarda tus actividades con precio unitario para llenar actas en segundos.' },
  { icon: '🔒', title: 'Datos en la nube',        desc: 'Tu información segura y accesible desde cualquier dispositivo con tu cuenta.' },
]

export default function LandingPage({ onLogin, onRegister }) {
  // Refs para scroll reveal de cada sección
  const mockupRef   = useReveal(0.08)
  const featTitleRef = useReveal(0.1)
  const featGridRef  = useReveal(0.06)
  const pricTitleRef = useReveal(0.1)
  const pricGridRef  = useReveal(0.06)
  const ctaRef       = useReveal(0.15)

  return (
    <div className="ld-page" style={{ minHeight: '100vh', fontFamily: 'inherit', overflowX: 'hidden' }}>

      {/* ── Fondo animado: burbujas + olas ───────────────────────────────────── */}
      <div className="ld-bg" aria-hidden="true">

        {/* Burbujas que suben */}
        {[
          { w:50,  left:'5%',   dur:'11s', del:'0s'  },
          { w:28,  left:'14%',  dur:'16s', del:'3s'  },
          { w:70,  left:'26%',  dur:'13s', del:'6s'  },
          { w:22,  left:'38%',  dur:'9s',  del:'1s'  },
          { w:55,  left:'52%',  dur:'14s', del:'4s'  },
          { w:35,  left:'63%',  dur:'10s', del:'7s'  },
          { w:65,  left:'74%',  dur:'18s', del:'2s'  },
          { w:20,  left:'84%',  dur:'8s',  del:'5s'  },
          { w:42,  left:'92%',  dur:'12s', del:'9s'  },
        ].map(({ w, left, dur, del }, i) => (
          <div key={i} className="ld-bbl" style={{
            width: w, height: w, left,
            animationDuration: dur, animationDelay: del,
          }} />
        ))}

        {/* Olas en la parte inferior del viewport */}
        <svg className="ld-wave ld-wave-a" viewBox="0 0 2880 160" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path fill="rgba(66,171,222,0.28)" d="M0,80 C240,140 480,20 720,80 C960,140 1200,20 1440,80 C1680,140 1920,20 2160,80 C2400,140 2640,20 2880,80 L2880,160 L0,160 Z"/>
        </svg>
        <svg className="ld-wave ld-wave-b" viewBox="0 0 2880 160" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path fill="rgba(27,90,180,0.18)" d="M0,100 C360,40 720,130 1080,70 C1440,10 1800,110 2160,60 C2520,10 2700,90 2880,100 L2880,160 L0,160 Z"/>
        </svg>
        <svg className="ld-wave ld-wave-c" viewBox="0 0 2880 160" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path fill="rgba(120,200,240,0.20)" d="M0,50 C180,110 360,20 540,80 C720,140 900,30 1080,90 C1260,150 1440,40 1620,100 C1800,160 1980,50 2160,110 C2340,170 2640,60 2880,50 L2880,160 L0,160 Z"/>
        </svg>

      </div>

      {/* ── Navbar ───────────────────────────────────────────────────────────── */}
      <nav className="ld-nav" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px', maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 1,
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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a
            href="#precios"
            onClick={e => { e.preventDefault(); document.getElementById('precios')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
            style={{ fontSize: 13, color: '#1B3A5C', fontWeight: 500, textDecoration: 'none', padding: '8px 12px', cursor: 'pointer' }}
          >
            Precios
          </a>
          <button
            className="ld-btn"
            onClick={onLogin}
            style={{ fontSize: 13, padding: '8px 18px', borderRadius: 8, border: '1px solid #CBD5E0', background: '#fff', cursor: 'pointer', fontWeight: 500 }}
          >
            Iniciar sesión
          </button>
          <button
            className="ld-btn"
            onClick={onRegister}
            style={{ fontSize: 13, padding: '8px 18px', borderRadius: 8, border: 'none', background: '#42ABDE', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
          >
            Registrarse gratis
          </button>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section style={{ textAlign: 'center', padding: '60px 24px 50px', maxWidth: 680, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Logo flota suavemente */}
        <div className="ld-hero-0 ld-float" style={{ display: 'inline-block' }}>
          <ActafyLogo size={110} showText={true} showSub={false} />
        </div>

        <h1 className="ld-hero-1" style={{
          fontSize: 'clamp(26px, 5vw, 42px)', fontWeight: 800,
          color: '#1B3A5C', marginTop: 28, lineHeight: 1.2,
        }}>
          Genera actas de obra<br />
          <span style={{ color: '#42ABDE' }}>en segundos</span>
        </h1>

        <p className="ld-hero-1" style={{
          fontSize: 16, color: '#64748B', marginTop: 16, lineHeight: 1.6,
          maxWidth: 520, margin: '16px auto 0',
        }}>
          La herramienta para contratistas colombianos que necesitan crear actas de avance de obra
          profesionales en PDF, Excel y Word — con su logo, AIU e IVA incluidos.
        </p>

        <div className="ld-hero-2" style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
          <button
            className="ld-btn ld-pulse"
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
            className="ld-btn"
            onClick={onLogin}
            style={{
              padding: '14px 28px', fontSize: 15, fontWeight: 600, borderRadius: 10,
              border: '2px solid #CBD5E0', background: '#fff', color: '#1B3A5C', cursor: 'pointer',
            }}
          >
            Ya tengo cuenta
          </button>
        </div>

        <p className="ld-hero-2" style={{ fontSize: 12, color: '#94A3B8', marginTop: 14 }}>
          Sin tarjeta de crédito · Funciona desde el navegador
        </p>
      </section>

      {/* ── Preview mockup ───────────────────────────────────────────────────── */}
      <section
        ref={mockupRef}
        className="ld-reveal"
        style={{ maxWidth: 800, margin: '0 auto 60px', padding: '0 24px', position: 'relative', zIndex: 1 }}
      >
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
          {/* Mini topbar */}
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
          {/* Métricas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            {[['12','Total actas'],['$84.2M','Valor acumulado'],['5','Pagadas']].map(([v,l]) => (
              <div key={l} style={{ background: '#F4F7FB', borderRadius: 10, padding: '12px', textAlign: 'center', border: '1px solid #E2EAF4' }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: '#1B3A5C' }}>{v}</p>
                <p style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>{l}</p>
              </div>
            ))}
          </div>
          {/* Actas simuladas */}
          {[
            { n:'08', obra:'Construcción sede principal',   cliente:'Empresa XYZ S.A.S',    val:'$12.4M', est:'Firmada',  ec:'#FEF3E2', ef:'#9A5A0A' },
            { n:'07', obra:'Adecuación oficinas piso 3',    cliente:'Inmobiliaria ABC',      val:'$8.1M',  est:'Pagada',   ec:'#EAF3DE', ef:'#1A6B35' },
            { n:'06', obra:'Reforzamiento estructural',     cliente:'Constructora DEF',      val:'$5.6M',  est:'Generada', ec:'#EBF3FB', ef:'#2563A6' },
          ].map(a => (
            <div key={a.n} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#fff', borderRadius:10, border:'1px solid #E2EAF4', marginBottom:6 }}>
              <div style={{ width:36, height:36, background:'#1B3A5C', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:10, fontWeight:700, flexShrink:0, textAlign:'center', lineHeight:1.2 }}>
                No.<br/>{a.n}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontWeight:700, fontSize:12, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a.obra}</p>
                <p style={{ fontSize:10, color:'#64748B', marginTop:1 }}>{a.cliente}</p>
              </div>
              <p style={{ fontWeight:700, fontSize:12, color:'#1A6B35', flexShrink:0 }}>{a.val}</p>
              <span style={{ fontSize:10, fontWeight:600, padding:'3px 7px', borderRadius:5, background:a.ec, color:a.ef, flexShrink:0 }}>{a.est}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Características ──────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 900, margin: '0 auto 70px', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <h2
          ref={featTitleRef}
          className="ld-reveal"
          style={{ textAlign: 'center', fontSize: 24, fontWeight: 800, color: '#1B3A5C', marginBottom: 32 }}
        >
          Todo lo que necesitas para tus actas
        </h2>

        {/* Grid con stagger: cada card se revela en cascada */}
        <div
          ref={featGridRef}
          className="ld-stagger"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}
        >
          {FEATURES.map(f => (
            <div
              key={f.title}
              className="ld-item ld-feat"
              style={{
                background: '#fff', borderRadius: 14, padding: '20px',
                border: '1px solid #E2EAF4', boxShadow: '0 2px 8px rgba(27,58,92,0.06)',
              }}
            >
              <p style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</p>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#1B3A5C', marginBottom: 6 }}>{f.title}</p>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Precios ──────────────────────────────────────────────────────────── */}
      <section id="precios" style={{ maxWidth: 900, margin: '0 auto 80px', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <h2
          ref={pricTitleRef}
          className="ld-reveal"
          style={{ textAlign: 'center', fontSize: 24, fontWeight: 800, color: '#1B3A5C', marginBottom: 8 }}
        >
          Planes y precios
        </h2>
        <p
          className="ld-reveal"
          style={{ textAlign: 'center', fontSize: 14, color: '#64748B', marginBottom: 40 }}
        >
          Empieza gratis. Actualiza cuando necesites más.
        </p>

        <div
          ref={pricGridRef}
          className="ld-stagger"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, alignItems: 'start' }}
        >

          {/* Plan Gratis */}
          <div className="ld-item ld-plan" style={{
            background: '#fff', borderRadius: 16, padding: '28px 24px',
            border: '1px solid #E2EAF4', boxShadow: '0 2px 12px rgba(27,58,92,0.06)',
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Gratis</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 6 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: '#1B3A5C', lineHeight: 1 }}>$0</span>
            </div>
            <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 24 }}>Para siempre</p>
            <button
              className="ld-btn"
              onClick={onRegister}
              style={{ width: '100%', padding: '11px', borderRadius: 9, border: '2px solid #CBD5E0', background: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', marginBottom: 24 }}
            >
              Crear cuenta gratis
            </button>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                '✅ Hasta 5 actas en total',
                '✅ Exportar en PDF, Excel y Word',
                '✅ Catálogo de actividades',
                '✅ Historial de actas',
                '❌ Logo propio en documentos',
                '❌ Actas ilimitadas',
                '❌ Soporte prioritario',
              ].map(f => (
                <li key={f} style={{ fontSize: 13, color: f.startsWith('❌') ? '#94A3B8' : '#374151' }}>{f}</li>
              ))}
            </ul>
          </div>

          {/* Plan Pro — destacado */}
          <div className="ld-item ld-plan" style={{
            background: 'linear-gradient(145deg, #1B3A5C 0%, #1e5a8a 100%)',
            borderRadius: 16, padding: '28px 24px',
            border: '2px solid #42ABDE',
            boxShadow: '0 8px 32px rgba(27,58,92,0.25)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 16, right: 16,
              background: '#42ABDE', color: '#fff',
              fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              Más popular
            </div>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Pro</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 6 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1 }}>$49.900</span>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>COP / mes</p>
            <button
              className="ld-btn"
              onClick={() => window.open('https://wa.me/573002454640?text=' + encodeURIComponent('Hola, quiero contratar el plan Pro de Actafy 🚀'), '_blank')}
              style={{ width: '100%', padding: '11px', borderRadius: 9, border: 'none', background: '#25D366', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 24, boxShadow: '0 4px 12px rgba(37,211,102,0.35)' }}
            >
              💬 Contratar por WhatsApp →
            </button>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                '✅ Actas ilimitadas',
                '✅ Tu logo en todos los documentos',
                '✅ PDF, Excel y Word profesional',
                '✅ Catálogo y clientes ilimitados',
                '✅ Historial con filtros avanzados',
                '✅ Soporte por WhatsApp',
              ].map(f => (
                <li key={f} style={{ fontSize: 13, color: 'rgba(255,255,255,0.88)' }}>{f}</li>
              ))}
            </ul>
          </div>

          {/* Plan Empresarial */}
          <div className="ld-item ld-plan" style={{
            background: '#fff', borderRadius: 16, padding: '28px 24px',
            border: '1px solid #E2EAF4', boxShadow: '0 2px 12px rgba(27,58,92,0.06)',
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Empresarial</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 6 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: '#1B3A5C', lineHeight: 1 }}>$99.900</span>
            </div>
            <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 24 }}>COP / mes</p>
            <button
              disabled
              style={{ width: '100%', padding: '11px', borderRadius: 9, border: '2px solid #E2EAF4', background: '#F8FAFC', fontWeight: 600, fontSize: 13, cursor: 'not-allowed', marginBottom: 24, color: '#94A3B8' }}
            >
              Próximamente
            </button>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                '✅ Todo lo del plan Pro',
                '✅ Hasta 5 usuarios por empresa',
                '✅ Panel de administrador',
                '✅ Reportes consolidados',
                '✅ Soporte prioritario dedicado',
                '🔜 Disponible pronto',
              ].map(f => (
                <li key={f} style={{ fontSize: 13, color: f.startsWith('🔜') ? '#42ABDE' : '#374151' }}>{f}</li>
              ))}
            </ul>
          </div>

        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8', marginTop: 28 }}>
          💳 Sin tarjeta de crédito para el plan gratis · Cancela cuando quieras · Precios en pesos colombianos + IVA
        </p>
      </section>

      {/* ── CTA final ────────────────────────────────────────────────────────── */}
      <section
        ref={ctaRef}
        className="ld-reveal"
        style={{
          textAlign: 'center', padding: '50px 24px 70px',
          background: 'linear-gradient(135deg, #1B3A5C 0%, #1e5a8a 60%, #42ABDE 100%)',
        }}
      >
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
          Empieza a generar actas hoy
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>
          Crea tu cuenta gratis y genera tu primera acta en menos de 5 minutos.
        </p>
        <button
          className="ld-btn"
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

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer style={{ textAlign: 'center', padding: '20px 24px', background: '#1B3A5C' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          © {new Date().getFullYear()} Actafy · Hecho para contratistas colombianos
        </p>
      </footer>

    </div>
  )
}
