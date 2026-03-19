import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { loadActas, loadActaById, deleteActa, updateEstado } from '../lib/actasDB'
import { fmtCOP } from '../lib/helpers'

const ESTADOS = ['Borrador', 'Generada', 'Firmada', 'Pagada']

const ESTADO_STYLE = {
  Borrador: { bg: '#F4F7FB', color: '#64748B', border: '#CBD5E0' },
  Generada: { bg: '#EBF3FB', color: '#2563A6', border: '#85B7EB' },
  Firmada:  { bg: '#FEF3E2', color: '#9A5A0A', border: '#F5CC85' },
  Pagada:   { bg: '#EAF3DE', color: '#1A6B35', border: '#97C459' },
}

export default function HistorialActas({ onNew, onEdit, onSettings, onLogout }) {
  const { user, username } = useAuth()
  const [actas, setActas] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [opening, setOpening] = useState(null)

  useEffect(() => {
    loadActas(username)
      .then(setActas)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false))
  }, [username])

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
          periodo:       acta.periodo       || '',
          contrato:      acta.contrato      || '',
          obra:          acta.obra          || '',
          ubicacion:     acta.ubicacion     || '',
          empresa_c:     acta.empresa_c     || '',
          nit_cl:        acta.nit_cl        || '',
          director:      acta.director      || '',
          cargo:         acta.cargo         || 'Director de Obra',
          tel_cl:        acta.tel_cl        || '',
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

  return (
    <div className="page">
      {/* Topbar */}
      <div className="topbar" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.15)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="white" strokeWidth="1.8"/><path d="M8 7V5a4 4 0 0 1 8 0v2" stroke="white" strokeWidth="1.8"/></svg>
          </div>
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Actafy</p>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--azul)' }}>Mis actas</h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--sub)' }}>Cargando…</div>
      ) : actas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--sub)' }}>
          <p style={{ fontWeight: 700, marginBottom: 8 }}>Aún no tienes actas guardadas</p>
          <p style={{ fontSize: 12, marginBottom: 20 }}>Crea tu primera acta y guárdala para verla aquí.</p>
          <button className="btn-primary" onClick={onNew}>+ Crear primera acta</button>
        </div>
      ) : (
        actas.map(a => {
          const est = a.estado || 'Borrador'
          const s = ESTADO_STYLE[est] || ESTADO_STYLE.Borrador
          return (
            <div key={a.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '12px 14px' }}>
              {/* Badge número */}
              <div style={{ width: 42, height: 42, background: 'var(--azul)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0, textAlign: 'center', lineHeight: 1.2 }}>
                No.<br />{a.numero || '?'}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.obra || 'Sin nombre de obra'}
                </p>
                <p style={{ fontSize: 11, color: 'var(--sub)', marginTop: 2 }}>
                  {a.fecha}{a.empresa_c ? ' · ' + a.empresa_c : ''}
                </p>
              </div>

              {/* Total */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--verde)', whiteSpace: 'nowrap' }}>{fmtCOP(a.total_final)}</p>
                <p style={{ fontSize: 10, color: 'var(--sub)', marginTop: 2 }}>
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
