// Logo oficial de Actafy — replica el diseño original (círculo azul + clipboard + checkmark)
export default function ActafyLogo({ size = 90, showText = true, showSub = true }) {
  const s = size
  return (
    <div style={{ textAlign: 'center', userSelect: 'none' }}>
      {/* Ícono SVG */}
      <svg width={s} height={s} viewBox="0 0 100 100" style={{ display: 'block', margin: '0 auto' }}>
        {/* Sombra suave */}
        <circle cx="50" cy="53" r="44" fill="rgba(66,171,222,0.18)" />

        {/* Círculo principal */}
        <circle cx="50" cy="50" r="44" fill="#42ABDE" />

        {/* Arcos laterales (reflejo / brillo) */}
        <path d="M 20 74 Q 4 50 20 26" stroke="#A8D8F0" strokeWidth="5.5" fill="none"
              strokeLinecap="round" opacity="0.85" />
        <path d="M 80 74 Q 96 50 80 26" stroke="#A8D8F0" strokeWidth="5.5" fill="none"
              strokeLinecap="round" opacity="0.85" />

        {/* Cuerpo del portapapeles */}
        <rect x="26" y="33" width="48" height="42" rx="5" fill="white" />

        {/* Clip superior del portapapeles */}
        <rect x="37" y="27" width="26" height="13" rx="5" fill="white" />

        {/* Agujero del clip */}
        <circle cx="50" cy="30" r="3.8" fill="#42ABDE" />

        {/* Checkmark */}
        <path d="M 35 55 L 46 66 L 65 44"
              stroke="#42ABDE" strokeWidth="5.5" fill="none"
              strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* Nombre en fuente script */}
      {showText && (
        <p style={{
          fontFamily: "'Pacifico', 'Dancing Script', cursive",
          fontSize: s * 0.36,
          fontWeight: 400,
          color: '#1a1a1a',
          marginTop: s * 0.12,
          lineHeight: 1,
          letterSpacing: '-0.5px',
        }}>
          Actafy
        </p>
      )}

      {/* Subtítulo */}
      {showSub && (
        <p style={{
          fontSize: Math.max(10, s * 0.13),
          color: '#64748B',
          marginTop: 6,
          fontWeight: 400,
          letterSpacing: '0.01em',
        }}>
          Genera actas de obra en PDF, Word y Excel
        </p>
      )}
    </div>
  )
}

// Versión compacta para topbar (solo ícono pequeño)
export function ActafyIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="46" fill="#42ABDE" />
      <rect x="26" y="33" width="48" height="42" rx="5" fill="white" />
      <rect x="37" y="27" width="26" height="13" rx="5" fill="white" />
      <circle cx="50" cy="30" r="3.8" fill="#42ABDE" />
      <path d="M 35 55 L 46 66 L 65 44"
            stroke="#42ABDE" strokeWidth="5.5" fill="none"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
