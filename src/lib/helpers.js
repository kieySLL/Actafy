// ── Storage ──────────────────────────────────────────────────────────────────
const DB_KEY = 'actas_saas_v1'

export function loadDB() {
  try { return JSON.parse(localStorage.getItem(DB_KEY)) || { users: {} } }
  catch { return { users: {} } }
}

export function saveDB(db) {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)) } catch {}
}

// ── Format helpers ────────────────────────────────────────────────────────────
export const fmtCOP = (v) =>
  '$ ' + Math.round(parseFloat(v) || 0).toLocaleString('es-CO')

export const fmtNum = (v) =>
  (parseFloat(v) || 0).toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

export const today = () => new Date().toISOString().split('T')[0]

// ── Totals calculator ─────────────────────────────────────────────────────────
export function calcTotals(grupos, aiu, iva) {
  const bruto = grupos.reduce(
    (s, g) =>
      s +
      g.acts.reduce(
        (ss, a) => ss + (parseFloat(a.cant) || 0) * (parseFloat(a.vunit) || 0),
        0
      ),
    0
  )
  const admV  = Math.round(bruto * (aiu.admin       || 10) / 100)
  const impV  = Math.round(bruto * (aiu.imprevistos || 3)  / 100)
  const utiV  = Math.round(bruto * (aiu.utilidad    || 10) / 100)
  const baseIva = admV + impV + utiV
  const ivaV  = Math.round(baseIva * (iva || 19) / 100)
  return {
    bruto: Math.round(bruto),
    admV, impV, utiV, baseIva, ivaV,
    total: Math.round(bruto) + baseIva + ivaV,
  }
}

// ── Empty constructors ────────────────────────────────────────────────────────
export const emptyAct   = () => ({ item: '', desc: '', und: 'M2', cant: '', vunit: '', escat: false })
export const emptyGrupo = () => ({ nombre: '', acts: [emptyAct()] })

// ── Avatar colors ─────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ['#E6F1FB', '#0C447C'],
  ['#EAF3DE', '#27500A'],
  ['#FAEEDA', '#633806'],
  ['#EEEDFE', '#3C3489'],
]
export const avatarColor = (i) => AVATAR_COLORS[i % AVATAR_COLORS.length]

export const initials = (name = '') =>
  name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'
