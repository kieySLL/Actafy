import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { loadActas, loadActaById, deleteActa, updateEstado } from '../lib/actasDB'
import { fmtCOP } from '../lib/helpers'
import { ActafyIcon } from './ActafyLogo'

const ESTADOS = ['Borrador', 'Generada', 'Firmada', 'Pagada']

const ESTADO_STYLE = {
  Borrador: { bg: '#F4F7FB', color: '#64748B', border: '#CBD5E0' },
  Generada: { bg: '#EBF3FB', color: '#2563A6', border: '#85B7EB' },
  Firmada:  { bg: '#FEF3E2', color: '#9A5A0A', border: '#F5CC85' },
  Pagada:   { bg: '#EAF3DE', color: '#1A6B35', border: '#97C459' },
}

export default function HistorialActas({ onNew, onEdit, onSettings, onLogout }) {
  const { user, userId } = useAuth()
  const [actas, setActas] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [opening, setOpening] = useState(null)
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('Todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  useEffect(() => {
    if (!userId) return
    loadActas(userId)
      .then(setActas)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false))
  }, [userId])

  const handleEdit = async (id) => {
    setOpening(id)
    try {
      const acta = await loadActaById(id)
      if (!acta) return
      onEdit({
        id: acta.id,
        form: {
          numero:        acta.numero        || '',
          fecha:         acta.fecha         || '',
          contrato:      acta.contrato      || '',
          obra:          acta.obra          || '',
          ubicacion:     acta.ubicacion     || '',
          empresa_c:     acta.empresa_c     || '',
          nit_cl:        acta.nit_cl        || '',
          director:      acta.director      || '',
          observaciones: acta.observaciones || '',
          grupos:        acta.grupos        || [],
          fotos:         acta.fotos         || [],
        },
      })
    } catch (e) {
      setErr(e.message)
    }
    setOpening(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta acta del historial? Esta acción no se puede deshacer.')) return
    try {
      await deleteActa(id)
      setActas(prev => prev.filter(a => a.id !== id))
    } catch (e) {
      setErr(e.message)
    }
  }

  const handleEstado = async (id, estado) => {
    setActas(prev => prev.map(a => a.id === id ? { ...a, estado } : a))
    try {
      await updateEstado(id, estado)
    } catch (e) {
      setErr(e.message)
    }
  }

  // ── Métricas ─────────────────────────────────────────────────────────────
  const totalValor   = actas.reduce((s, a) => s + (a.total_final || 0), 0)
  const totalPagadas = actas.filter(a => a.estado === 'Pagada').length
  const valorPagado  = actas.filter(a => a.estado === 'Pagada').reduce((s, a) => s + (a.total_final || 0), 0)

  // ── Filtrado ──────────────────────────────────────────────────────────────
  const hayFiltros = search || filterEstado !== 'Todos' || fechaDesde || fechaHasta
  const actasFiltradas = actas.filter(a => {
    const matchEstado = filterEstado === 'Todos' || (a.estado || 'Borrador') === filterEstado
    const q = search.trim().toLowerCase()
    const matchSearch = !q ||
      (a.obra      || '').toLowerCase().includes(q) ||
      (a.empresa_c || '').toLowerCase().includes(q) ||
      String(a.numero || '').toLowerCase().includes(q)
    const fecha = a.fecha || ''
    const matchDesde = !fechaDesde || fecha >= fechaDesde
    const matchHasta = !fechaHasta || fecha <= fechaHasta
    return matchEstado && matchSearch && matchDesde && matchHasta
  })

  return (
    <div className="page">
      {/* Topbar */}
      <div className="topbar" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <ActafyIcon size={30} />
          <div>
            <p style={{ fontFamily: "'Pacifico', cursive", color: '#fff', fontWeight: 400, fontSize: 15, letterSpacing: '-0.3px' }}>Actafy</p>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>{user?.nombre || 'Mi empresa'}</p>
          </div>
        </div>
        <button
          className="btn-primary btn-sm"
          onClick={onNew}
          style={{ background: '#fff', color: 'var(--azul)', border: 'none', fontWeight: 700, fontSize: 12, padding: '7px 14px' }}
        >
          + Nueva acta
        </button>
        <button onClick={onSettings} style={{ borderColor: 'rgba(255,255,255,0.35)', color: 'rgba(255,255,255,0.85)', fontSize: 12, padding: '6px 12px' }}>⚙ Perfil</button>
        <button onClick={onLogout}   style={{ borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.65)', fontSize: 12, padding: '6px 12px' }}>Salir</button>
      </div>

      {err && <div className="alert alert-err" style={{ marginBottom: 14 }}>{err}</div>}

      {/* Métricas */}
      <div className="grid3" style={{ marginBottom: 20 }}>
        <div className="card" style={{ textAlign: 'center', padding: '14px 10px' }}>
          <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--azul)', lineHeight: 1 }}>{actas.length}</p>
          <p style={{ fontSize: 11, color: 'var(--sub)', marginTop: 4 }}>Total actas</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '14px 10px' }}>
          <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--verde)', lineHeight: 1 }}>{fmtCOP(totalValor)}</p>
          <p style={{ fontSize: 11, color: 'var(--sub)', marginTop: 4 }}>Valor acumulado</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '14px 10px' }}>
          <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--verde)', lineHeight: 1 }}>{totalPagadas}</p>
          <p style={{ fontSize: 11, color: 'var(--sub)', marginTop: 4 }}>Pagadas · {fmtCOP(valorPagado)}</p>
        </div>
      </div>

      {/* Buscador y filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        {/* Búsqueda libre */}
        <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="13" height="13" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="#64748B" strokeWidth="2"/>
            <path d="M20 20l-3.5-3.5" stroke="#64748B" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            placeholder="Buscar por obra, cliente o número…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 28, fontSize: 12 }}
          />
        </div>
        {/* Estado */}
        <select
          value={filterEstado}
          onChange={e => setFilterEstado(e.target.value)}
          style={{ width: 130, fontSize: 12, flexShrink: 0 }}
        >
          <option>Todos</option>
          {ESTADOS.map(st => <option key={st}>{st}</option>)}
        </select>
      </div>

      {/* Filtros de fecha en segunda fila */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: 'var(--sub)', whiteSpace: 'nowrap' }}>Desde</span>
          <input
            type="date"
            value={fechaDesde}
            onChange={e => setFechaDesde(e.target.value)}
            style={{ fontSize: 12, width: 140 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: 'var(--sub)', whiteSpace: 'nowrap' }}>Hasta</span>
          <input
            type="date"
            value={fechaHasta}
            onChange={e => setFechaHasta(e.target.value)}
            style={{ fontSize: 12, width: 140 }}
          />
        </div>
        {hayFiltros && (
          <button
            onClick={() => { setSearch(''); setFilterEstado('Todos'); setFechaDesde(''); setFechaHasta('') }}
            style={{ fontSize: 12, padding: '6px 12px', flexShrink: 0 }}
          >
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <p style={{ fontSize: 12, color: 'var(--sub)' }}>
          {actasFiltradas.length} de {actas.length} acta{actas.length !== 1 ? 's' : ''}
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--sub)' }}>
          <span className="spinner" style={{ borderTopColor: 'var(--azul)' }} />Cargando…
        </div>
      ) : actas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--sub)' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>📋</p>
          <p style={{ fontWeight: 700, marginBottom: 8 }}>Aún no tienes actas guardadas</p>
          <p style={{ fontSize: 12, marginBottom: 20 }}>Crea tu primera acta y guárdala para verla aquí.</p>
          <button className="btn-primary" onClick={onNew}>+ Crear primera acta</button>
        </div>
      ) : actasFiltradas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--sub)' }}>
          <p style={{ fontSize: 28, marginBottom: 10 }}>🔍</p>
          <p style={{ fontWeight: 700, marginBottom: 6 }}>Sin resultados</p>
          <p style={{ fontSize: 12 }}>Intenta con otro término o limpia los filtros.</p>
        </div>
      ) : (
        actasFiltradas.map(a => {
          const est = a.estado || 'Borrador'
          const s = ESTADO_STYLE[est] || ESTADO_STYLE.Borrador
          return (
            <div key={a.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '12px 14px', flexWrap: 'nowrap' }}>
              {/* Badge número */}
              <div style={{ width: 42, height: 42, background: 'var(--azul)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0, textAlign: 'center', lineHeight: 1.2 }}>
                No.<br />{a.numero || '?'}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <p style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1a1a1a' }}>
                  {a.obra || 'Sin nombre de obra'}
                </p>
                <p style={{ fontSize: 11, color: 'var(--sub)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.fecha}{a.empresa_c ? ' · ' + a.empresa_c : ''}
                </p>
              </div>

              {/* Total */}
              <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 90 }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--verde)', whiteSpace: 'nowrap' }}>{fmtCOP(a.total_final)}</p>
                <p style={{ fontSize: 10, color: 'var(--sub)', marginTop: 2, whiteSpace: 'nowrap' }}>
                  {a.updated_at ? new Date(a.updated_at).toLocaleDateString('es-CO') : ''}
                </p>
              </div>

              {/* Selector de estado */}
              <select
                value={est}
                onChange={e => handleEstado(a.id, e.target.value)}
                style={{
                  fontSize: 11, fontWeight: 600, padding: '4px 6px',
                  background: s.bg, color: s.color,
                  border: `1px solid ${s.border}`, borderRadius: 6,
                  cursor: 'pointer', flexShrink: 0,
                  width: 100,
                }}
              >
                {ESTADOS.map(st => <option key={st}>{st}</option>)}
              </select>

              {/* Acciones */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  className="btn-primary btn-sm"
                  onClick={() => handleEdit(a.id)}
                  disabled={opening === a.id}
                >
                  {opening === a.id ? '…' : 'Abrir'}
                </button>
                <button className="btn-danger btn-sm" onClick={() => handleDelete(a.id)}>×</button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
