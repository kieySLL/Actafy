import { useState, useRef } from 'react'
import ExcelJS from 'exceljs'
import { useAuth } from './AuthContext'
import { Field } from './AuthScreen'
import { fmtCOP, avatarColor, initials } from '../lib/helpers'

export default function Settings({ onBack }) {
  const [tab, setTab] = useState(0)
  const tabs = ['Mi empresa', 'Clientes', 'Catálogo', 'AIU e IVA']

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack}>← Historial</button>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--azul)' }}>Configuración</h1>
      </div>
      <div className="tab-bar">
        {tabs.map((t, i) => (
          <button key={i} className={`tab-btn${tab === i ? ' active' : ''}`} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>
      {tab === 0 && <EmpresaTab />}
      {tab === 1 && <ClientesTab />}
      {tab === 2 && <CatalogoTab />}
      {tab === 3 && <AiuTab />}
    </div>
  )
}

// ── Mi Empresa ────────────────────────────────────────────────────────────────
function EmpresaTab() {
  const { user, updateUser } = useAuth()
  const [f, setF] = useState({
    nombre:        user?.nombre        || '',
    nit:           user?.nit           || '',
    representante: user?.representante || '',
    tel:           user?.tel           || '',
    direccion:     user?.direccion     || '',
    ciudad:        user?.ciudad        || '',
    tipo:          user?.tipo          || 'Obra civil',
  })
  const [saving, setSaving] = useState(false)
  const [ok, setOk]         = useState(false)
  const [err, setErr]       = useState('')
  const logoRef = useRef()

  const set = (k, v) => setF(x => ({ ...x, [k]: v }))

  const save = async () => {
    setSaving(true); setErr('')
    const res = await updateUser(f)
    setSaving(false)
    if (res.ok) { setOk(true); setTimeout(() => setOk(false), 2500) }
    else setErr(res.error || 'Error al guardar')
  }

  const handleLogo = (e) => {
    const file = e.target.files[0]; if (!file) return
    setErr('')
    const reader = new FileReader()
    reader.onload = async ev => {
      const res = await updateUser({ logo: ev.target.result })
      if (!res.ok) setErr(res.error || 'Error al guardar logo')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="card">
      <div className="sect-title">Logo</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        {user?.logo
          ? <img src={user.logo} alt="logo" style={{ height: 56, maxWidth: 160, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--borde)' }} />
          : <div style={{ width: 80, height: 56, background: 'var(--gris)', borderRadius: 8, border: '1px dashed var(--borde)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sub)', fontSize: 11 }}>Sin logo</div>
        }
        <div>
          <label style={{ cursor: 'pointer' }}>
            <span style={{ border: '1px solid var(--azul2)', color: 'var(--azul2)', background: 'var(--azul-bg)', padding: '6px 14px', borderRadius: 'var(--radio)', fontSize: 12, fontWeight: 600 }}>
              {user?.logo ? 'Cambiar logo' : 'Subir logo'}
            </span>
            <input ref={logoRef} type="file" accept="image/*" onChange={handleLogo} style={{ display: 'none' }} />
          </label>
          {user?.logo && (
            <button className="btn-danger btn-sm" style={{ marginLeft: 8 }} onClick={async () => {
              const res = await updateUser({ logo: null })
              if (!res.ok) setErr(res.error)
            }}>Quitar</button>
          )}
          <p style={{ fontSize: 11, color: 'var(--sub)', marginTop: 6 }}>PNG o JPG · aparece en el encabezado del acta</p>
        </div>
      </div>

      <div className="sep" />
      <div className="sect-title">Información de la empresa</div>
      <div className="grid2" style={{ marginBottom: 10 }}>
        <Field label="Nombre / Razón social"><input value={f.nombre} onChange={e => set('nombre', e.target.value)} /></Field>
        <Field label="NIT"><input value={f.nit} onChange={e => set('nit', e.target.value)} /></Field>
      </div>
      <div className="grid2" style={{ marginBottom: 10 }}>
        <Field label="Representante legal"><input value={f.representante} onChange={e => set('representante', e.target.value)} /></Field>
        <Field label="Teléfono"><input value={f.tel} onChange={e => set('tel', e.target.value)} /></Field>
      </div>
      <div className="grid2" style={{ marginBottom: 10 }}>
        <Field label="Dirección"><input value={f.direccion} onChange={e => set('direccion', e.target.value)} /></Field>
        <Field label="Ciudad"><input value={f.ciudad} onChange={e => set('ciudad', e.target.value)} /></Field>
      </div>
      <Field label="Tipo de actividad principal" style={{ marginBottom: 18 }}>
        <select value={f.tipo} onChange={e => set('tipo', e.target.value)}>
          {['Obra civil', 'Acabados', 'Eléctrico', 'Hidráulico', 'Estructural', 'Otro'].map(t => <option key={t}>{t}</option>)}
        </select>
      </Field>

      {err && <div className="alert alert-err" style={{ marginBottom: 10 }}>{err}</div>}
      {ok  && <div className="alert alert-ok"  style={{ marginBottom: 10 }}>Cambios guardados correctamente</div>}
      <button className="btn-primary" onClick={save} disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </div>
  )
}

// ── Clientes ──────────────────────────────────────────────────────────────────
const CLIENTE_VACIO = { nombre: '', nit: '', director: '', cargo: 'Director de Obra', tel: '', ciudad: '' }

function ClientesTab() {
  const { user, updateUser } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [editIdx, setEditIdx]   = useState(null)   // null = nuevo, número = editar índice
  const [f, setF]       = useState(CLIENTE_VACIO)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState('')          // éxito
  const [err, setErr]       = useState('')
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))

  const openNew = () => {
    setEditIdx(null)
    setF(CLIENTE_VACIO)
    setErr(''); setMsg('')
    setShowForm(true)
  }

  const openEdit = (i) => {
    setEditIdx(i)
    setF({ ...CLIENTE_VACIO, ...(user?.clientes || [])[i] })
    setErr(''); setMsg('')
    setShowForm(true)
  }

  const cancel = () => { setShowForm(false); setEditIdx(null); setErr('') }

  const save = async () => {
    if (!f.nombre.trim()) { setErr('El nombre de la empresa es obligatorio'); return }
    setSaving(true); setErr('')
    const lista = [...(user?.clientes || [])]
    if (editIdx !== null) {
      lista[editIdx] = { ...f }                         // reemplaza el existente
    } else {
      lista.push({ ...f })                              // agrega nuevo
    }
    const res = await updateUser({ clientes: lista })
    setSaving(false)
    if (res.ok) {
      setMsg(editIdx !== null ? 'Cliente actualizado ✓' : 'Cliente agregado ✓')
      setTimeout(() => setMsg(''), 2500)
      cancel()
    } else {
      setErr(res.error || 'Error al guardar cliente')
    }
  }

  const del = async (i) => {
    if (!confirm('¿Eliminar este cliente?')) return
    const res = await updateUser({ clientes: (user?.clientes || []).filter((_, j) => j !== i) })
    if (!res.ok) setErr(res.error || 'Error al eliminar')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{(user?.clientes || []).length} cliente(s) guardado(s)</span>
        {!showForm && (
          <button className="btn-primary btn-sm" onClick={openNew}>+ Agregar cliente</button>
        )}
      </div>

      {err && <div className="alert alert-err" style={{ marginBottom: 10 }}>{err}</div>}
      {msg && <div className="alert alert-ok"  style={{ marginBottom: 10 }}>{msg}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 14, border: '2px solid var(--azul2)' }}>
          <div className="sect-title">{editIdx !== null ? '✏️ Editar cliente' : 'Nuevo cliente'}</div>
          <div className="grid2" style={{ marginBottom: 10 }}>
            <Field label="Empresa / Razón social *">
              <input value={f.nombre} onChange={e => set('nombre', e.target.value)} autoFocus />
            </Field>
            <Field label="NIT">
              <input value={f.nit} onChange={e => set('nit', e.target.value)} />
            </Field>
          </div>
          <div className="grid3" style={{ marginBottom: 10 }}>
            <Field label="Director de obra">
              <input value={f.director} onChange={e => set('director', e.target.value)} />
            </Field>
            <Field label="Cargo">
              <input value={f.cargo} onChange={e => set('cargo', e.target.value)} />
            </Field>
            <Field label="Teléfono">
              <input value={f.tel} onChange={e => set('tel', e.target.value)} />
            </Field>
          </div>
          <Field label="Ciudad" style={{ marginBottom: 14 }}>
            <input value={f.ciudad} onChange={e => set('ciudad', e.target.value)} />
          </Field>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Guardando…' : editIdx !== null ? 'Guardar cambios' : 'Guardar cliente'}
            </button>
            <button onClick={cancel}>Cancelar</button>
          </div>
        </div>
      )}

      {(user?.clientes || []).length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--sub)' }}>
          <p style={{ fontSize: 24, marginBottom: 8 }}>🏢</p>
          <p style={{ marginBottom: 6 }}>Aún no tienes clientes guardados.</p>
          <p style={{ fontSize: 12 }}>Agrégalos para no escribirlos en cada acta.</p>
        </div>
      ) : (
        (user?.clientes || []).map((c, i) => {
          const [bg, fg] = avatarColor(i)
          return (
            <div key={i} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
              <div className="avatar" style={{ background: bg, color: fg }}>{initials(c.nombre)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 13 }}>{c.nombre}</p>
                <p style={{ fontSize: 12, color: 'var(--sub)' }}>
                  {c.nit}{c.ciudad ? ' · ' + c.ciudad : ''}
                </p>
                {c.director && (
                  <p style={{ fontSize: 11, color: 'var(--sub)', marginTop: 2 }}>
                    {c.director}{c.cargo ? ' · ' + c.cargo : ''}
                    {c.tel ? ' · ' + c.tel : ''}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  className="btn-sm"
                  style={{ color: 'var(--azul2)', borderColor: 'var(--azul2)', fontSize: 12 }}
                  onClick={() => openEdit(i)}
                >
                  ✏️ Editar
                </button>
                <button className="btn-danger btn-sm" onClick={() => del(i)}>Eliminar</button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

// ── Catálogo ──────────────────────────────────────────────────────────────────
function CatalogoTab() {
  const { user, updateUser } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [f, setF]       = useState({ codigo: '', actividad: '', und: 'M2', valor: '' })
  const [importing, setImporting] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [err, setErr]             = useState('')
  const [msg, setMsg]             = useState('')
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))

  const save = async () => {
    if (!f.actividad.trim()) { setErr('La descripción es obligatoria'); return }
    setSaving(true); setErr('')
    const res = await updateUser({ catalogo: [...(user?.catalogo || []), { ...f, valor: parseFloat(f.valor) || 0 }] })
    setSaving(false)
    if (res.ok) {
      setF({ codigo: '', actividad: '', und: 'M2', valor: '' })
      setShowForm(false)
      setMsg('Actividad guardada')
      setTimeout(() => setMsg(''), 2000)
    } else {
      setErr(res.error || 'Error al guardar')
    }
  }

  const del = async (i) => {
    const res = await updateUser({ catalogo: (user?.catalogo || []).filter((_, j) => j !== i) })
    if (!res.ok) setErr(res.error || 'Error al eliminar')
  }

  const clearAll = async () => {
    if (!window.confirm('¿Eliminar todo el catálogo?')) return
    const res = await updateUser({ catalogo: [] })
    if (!res.ok) setErr(res.error || 'Error al limpiar')
  }

  const importExcel = (e) => {
    const file = e.target.files[0]; if (!file) return
    setImporting(true); setErr(''); setMsg('')
    const reader = new FileReader()

    reader.onload = async (ev) => {
      try {
        // Leer con ExcelJS (ya instalado, reemplaza xlsx)
        const wb = new ExcelJS.Workbook()
        await wb.xlsx.load(ev.target.result)
        const ws   = wb.worksheets[0]
        const rows = []
        ws.eachRow((row) => {
          // row.values es 1-based, slice(1) lo convierte a 0-based
          rows.push(row.values.slice(1).map(v => (v == null ? '' : String(v))))
        })

        if (rows.length < 2) {
          setErr('El archivo está vacío o no tiene datos')
          setImporting(false)
          return
        }

        // Busca la fila de encabezado en las primeras 6 filas
        // (por si el Excel tiene título o filas en blanco al inicio)
        let hIdx = 0
        for (let ri = 0; ri < Math.min(6, rows.length); ri++) {
          const row = rows[ri].map(h => String(h || '').toLowerCase().trim())
          if (row.some(h =>
            h.includes('activ') || h.includes('desc') || h.includes('nombre') ||
            h.includes('cod')   || h.includes('precio') || h.includes('valor') ||
            h === 'item' || h === 'und' || h === 'unidad'
          )) {
            hIdx = ri
            break
          }
        }

        const header    = rows[hIdx].map(h => String(h || '').toLowerCase().trim())
        const dataRows  = rows.slice(hIdx + 1)

        // Detección de columnas por nombre, con fallback posicional
        const iCod = (() => {
          const i = header.findIndex(h => h.includes('cod') || h === 'item' || h.includes('ref'))
          return i >= 0 ? i : 0
        })()
        const iAct = (() => {
          const i = header.findIndex(h => h.includes('activ') || h.includes('desc') || h.includes('nombre') || h.includes('concepto'))
          return i >= 0 ? i : 1
        })()
        const iUnd = (() => {
          const i = header.findIndex(h => h === 'und' || h === 'unidad' || h.includes('unid') || h === 'unit')
          return i >= 0 ? i : 2
        })()
        const iVal = (() => {
          const i = header.findIndex(h => h.includes('valor') || h.includes('precio') || h.includes('vunit') || h.includes('unit') && h.includes('prec'))
          return i >= 0 ? i : 3
        })()

        const items = dataRows
          .map(cols => ({
            codigo:    String(cols[iCod] || '').trim(),
            actividad: String(cols[iAct] || '').trim(),
            und:       String(cols[iUnd] || 'UND').trim() || 'UND',
            valor:     parseFloat(String(cols[iVal] || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          }))
          .filter(it => it.actividad && it.actividad.length > 1)

        if (items.length === 0) {
          setErr('No se encontraron actividades. Revisa que el archivo tenga columnas: Código, Actividad, Und, Valor')
          setImporting(false)
          return
        }

        const res = await updateUser({ catalogo: [...(user?.catalogo || []), ...items] })
        if (res.ok) {
          setMsg(`✓ ${items.length} actividades importadas correctamente`)
          setTimeout(() => setMsg(''), 4000)
        } else {
          setErr(res.error || 'Error al importar')
        }
      } catch (ex) {
        setErr(`Error leyendo el archivo: ${ex.message}`)
      }
      setImporting(false)
    }

    reader.onerror = () => {
      setErr('No se pudo leer el archivo')
      setImporting(false)
    }

    reader.readAsArrayBuffer(file)
    e.target.value = '' // permite volver a seleccionar el mismo archivo
  }

  const cat = user?.catalogo || []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{cat.length} actividad(es) en el catálogo</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {cat.length > 0 && (
            <button className="btn-danger btn-sm" onClick={clearAll}>🗑 Limpiar todo</button>
          )}
          <label style={{ cursor: 'pointer' }}>
            <span style={{
              border: '1px solid var(--azul2)', color: 'var(--azul2)', background: 'var(--azul-bg)',
              padding: '5px 12px', borderRadius: 'var(--radio)', fontSize: 12, fontWeight: 600,
              opacity: importing ? 0.6 : 1,
            }}>
              {importing ? 'Importando…' : '📥 Importar Excel'}
            </span>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={importExcel} disabled={importing} style={{ display: 'none' }} />
          </label>
          <button className="btn-sm" onClick={() => { setShowForm(s => !s); setErr('') }}>
            {showForm ? 'Cancelar' : '+ Agregar'}
          </button>
        </div>
      </div>

      {err && <div className="alert alert-err" style={{ marginBottom: 10 }}>{err}</div>}
      {msg && <div className="alert alert-ok"  style={{ marginBottom: 10 }}>{msg}</div>}

      <div className="alert" style={{ fontSize: 11, color: 'var(--sub)', marginBottom: 12, padding: '8px 12px', background: 'var(--gris)', borderRadius: 'var(--radio)' }}>
        El Excel debe tener columnas: <strong>Código · Actividad / Descripción · Und · Valor</strong>. El encabezado puede estar en cualquier fila de las primeras 6.
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="grid3" style={{ marginBottom: 10 }}>
            <Field label="Código"><input value={f.codigo} onChange={e => set('codigo', e.target.value)} placeholder="P1" /></Field>
            <div style={{ gridColumn: 'span 2' }}>
              <Field label="Descripción *"><input value={f.actividad} onChange={e => set('actividad', e.target.value)} placeholder="Pañete allanado 1:4" autoFocus /></Field>
            </div>
          </div>
          <div className="grid3" style={{ marginBottom: 12 }}>
            <Field label="Unidad">
              <select value={f.und} onChange={e => set('und', e.target.value)}>
                {['M2','ML','M3','KG','TON','UND','GLB','DIA','HR','MES'].map(u => <option key={u}>{u}</option>)}
              </select>
            </Field>
            <Field label="Valor unitario">
              <input type="number" value={f.valor} onChange={e => set('valor', e.target.value)} placeholder="0" />
            </Field>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn-primary" style={{ width: '100%' }} onClick={save} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {cat.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--sub)' }}>
          <p style={{ marginBottom: 6 }}>Sin actividades en el catálogo.</p>
          <p style={{ fontSize: 12 }}>Importa un Excel con columnas: <code style={{ background: 'var(--gris)', padding: '1px 5px', borderRadius: 3 }}>Código · Actividad · Und · Valor</code></p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="act-table" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ width: 60 }}>Código</th>
                <th className="left">Descripción</th>
                <th style={{ width: 50 }}>Und</th>
                <th style={{ width: 110 }}>Valor unitario</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {cat.map((c, i) => (
                <tr key={i}>
                  <td style={{ textAlign: 'center' }}>{c.codigo ? <span className="tag tag-blue">{c.codigo}</span> : '—'}</td>
                  <td>{c.actividad}</td>
                  <td style={{ textAlign: 'center', color: 'var(--sub)' }}>{c.und}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--verde)' }}>{fmtCOP(c.valor)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-danger btn-sm" onClick={() => del(i)}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── AIU e IVA ─────────────────────────────────────────────────────────────────
function AiuTab() {
  const { user, updateUser } = useAuth()
  const [aiu, setAiu]   = useState({ ...(user?.aiu || { admin: 10, imprevistos: 3, utilidad: 10 }) })
  const [iva, setIva]   = useState(user?.iva ?? 19)
  const [saving, setSaving] = useState(false)
  const [ok, setOk]     = useState(false)
  const [err, setErr]   = useState('')

  const setA = (k, v) => setAiu(x => ({ ...x, [k]: v === '' ? '' : parseFloat(v) ?? 0 }))

  const save = async () => {
    setErr('')
    const checks = [
      ['Administración', aiu.admin],
      ['Imprevistos',    aiu.imprevistos],
      ['Utilidad',       aiu.utilidad],
      ['IVA',            iva],
    ]
    for (const [nombre, val] of checks) {
      const n = parseFloat(val)
      if (isNaN(n) || n < 0 || n > 100) {
        setErr(`${nombre} debe ser un número entre 0 y 100`)
        return
      }
    }
    const aiuClean = {
      admin:       parseFloat(aiu.admin),
      imprevistos: parseFloat(aiu.imprevistos),
      utilidad:    parseFloat(aiu.utilidad),
    }
    setSaving(true)
    const res = await updateUser({ aiu: aiuClean, iva: parseFloat(iva) })
    setSaving(false)
    if (res.ok) { setOk(true); setTimeout(() => setOk(false), 2500) }
    else setErr(res.error || 'Error al guardar')
  }

  const base    = 1000000
  const admV    = Math.round(base * aiu.admin / 100)
  const impV    = Math.round(base * aiu.imprevistos / 100)
  const utiV    = Math.round(base * aiu.utilidad / 100)
  const baseIva = admV + impV + utiV
  const ivaV    = Math.round(baseIva * iva / 100)
  const total   = base + baseIva + ivaV

  return (
    <div className="card">
      <div className="sect-title">Configuración AIU</div>
      <div className="alert alert-warn" style={{ marginBottom: 14 }}>
        El IVA aplica sobre la suma del AIU (Administración + Imprevistos + Utilidad).
      </div>
      <div className="grid4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Administración %', val: aiu.admin,       key: 'admin' },
          { label: 'Imprevistos %',    val: aiu.imprevistos, key: 'imprevistos' },
          { label: 'Utilidad %',       val: aiu.utilidad,    key: 'utilidad' },
        ].map(({ label, val, key }) => {
          const n = parseFloat(val)
          const invalid = !isNaN(n) && (n < 0 || n > 100)
          return (
            <Field key={key} label={label}>
              <input
                type="number" value={val} min="0" max="100"
                onChange={e => setA(key, e.target.value)}
                style={{ borderColor: invalid ? 'var(--rojo)' : undefined }}
              />
              {invalid && <p style={{ fontSize: 10, color: 'var(--rojo)', marginTop: 2 }}>0 – 100</p>}
            </Field>
          )
        })}
        <Field label="IVA %">
          {(() => {
            const n = parseFloat(iva)
            const invalid = !isNaN(n) && (n < 0 || n > 100)
            return <>
              <input type="number" value={iva} min="0" max="100"
                onChange={e => setIva(e.target.value)}
                style={{ borderColor: invalid ? 'var(--rojo)' : undefined }} />
              {invalid && <p style={{ fontSize: 10, color: 'var(--rojo)', marginTop: 2 }}>0 – 100</p>}
            </>
          })()}
        </Field>
      </div>

      <div className="sect-title">Vista previa (sobre $ 1.000.000 de actividades)</div>
      {[
        ['Total bruto',              base,  false],
        [`Administración ${aiu.admin}%`, admV, false],
        [`Imprevistos ${aiu.imprevistos}%`, impV, false],
        [`Utilidad ${aiu.utilidad}%`, utiV, false],
        [`IVA ${iva}%`,              ivaV,  false],
        ['Total final',              total, true],
      ].map(([l, v, bold]) => (
        <div key={l} className={`summary-row${bold ? ' total' : ''}`}>
          <span style={{ fontSize: 12, color: bold ? 'var(--azul)' : 'var(--sub)', fontWeight: bold ? 700 : 400 }}>{l}</span>
          <span style={{ fontSize: bold ? 15 : 12, fontWeight: bold ? 700 : 400, color: bold ? 'var(--verde)' : '#1a1a1a' }}>{fmtCOP(v)}</span>
        </div>
      ))}

      <div style={{ marginTop: 18 }}>
        {err && <div className="alert alert-err" style={{ marginBottom: 10 }}>{err}</div>}
        {ok  && <div className="alert alert-ok"  style={{ marginBottom: 10 }}>Configuración guardada</div>}
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar configuración'}
        </button>
      </div>
    </div>
  )
}
