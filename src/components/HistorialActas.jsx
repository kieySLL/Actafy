import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { loadActas, loadActaById, deleteActa } from '../lib/actasDB'
import { fmtCOP } from '../lib/helpers'

export default function HistorialActas({ onBack, onEdit }) {
  const { username } = useAuth()
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

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack}>← Crear acta</button>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--azul)' }}>Historial de actas</h1>
      </div>

      {err && <div className="alert alert-err" style={{ marginBottom: 14 }}>{err}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--sub)' }}>Cargando…</div>
      ) : actas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--sub)' }}>
          <p style={{ fontWeight: 700, marginBottom: 6 }}>Sin actas guardadas</p>
          <p style={{ fontSize: 12 }}>Crea y guarda tu primera acta desde el editor.</p>
        </div>
      ) : (
        actas.map(a => (
          <div key={a.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 42, height: 42, background: 'var(--azul)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0, textAlign: 'center', lineHeight: 1.1 }}>
              No.<br />{a.numero || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {a.obra || 'Sin nombre de obra'}
              </p>
              <p style={{ fontSize: 11, color: 'var(--sub)', marginTop: 2 }}>
                {a.fecha}{a.empresa_c ? ' · ' + a.empresa_c : ''}
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--verde)' }}>{fmtCOP(a.total_final)}</p>
              <p style={{ fontSize: 10, color: 'var(--sub)', marginTop: 2 }}>
                {a.updated_at ? new Date(a.updated_at).toLocaleDateString('es-CO') : ''}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button
                className="btn-primary btn-sm"
                onClick={() => handleEdit(a.id)}
                disabled={opening === a.id}
              >
                {opening === a.id ? '…' : 'Reabrir'}
              </button>
              <button className="btn-danger btn-sm" onClick={() => handleDelete(a.id)}>×</button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
