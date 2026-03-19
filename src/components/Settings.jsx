import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useAuth } from './AuthContext'
import { Field } from './AuthScreen'
import { fmtCOP, avatarColor, initials } from '../lib/helpers'

export default function Settings({ onBack }) {
  const [tab, setTab] = useState(0)
  const tabs = ['Mi empresa', 'Clientes', 'Catálogo', 'AIU e IVA']
  const { user } = useAuth()

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack}>← Crear acta</button>
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
  const [f, setF] = useState({ nombre: user.nombre || '', nit: user.nit || '', representante: user.representante || '', tel: user.tel || '', direccion: user.direccion || '', ciudad: user.ciudad || '', tipo: user.tipo || 'Obra civil' })
  const [ok, setOk] = useState(false)
  const logoRef = useRef()

  const set = (k, v) => setF(x => ({ ...x, [k]: v }))

  const save = () => {
    updateUser(f)
    setOk(true)
    setTimeout(() => setOk(false), 2500)
  }

  const handleLogo = (e) => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => updateUser({ logo: ev.target.result })
    reader.readAsDataURL(file)
  }

  return (
    <div className="card">
      <div className="sect-title">Logo</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        {user.logo
          ? <img src={user.logo} alt="logo" style={{ height: 56, maxWidth: 160, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--borde)' }} />
          : <div style={{ width: 80, height: 56, background: 'var(--gris)', borderRadius: 8, border: '1px dashed var(--borde)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sub)', fontSize: 11 }}>Sin logo</div>
        }
        <div>
          <label style={{ cursor: 'pointer' }}>
            <span style={{ border: '1px solid var(--azul2)', color: 'var(--azul2)', background: 'var(--azul-bg)', padding: '6px 14px', borderRadius: 'var(--radio)', fontSize: 12, fontWeight: 600 }}>
              {user.logo ? 'Cambiar logo' : 'Subir logo'}
            </span>
            <input ref={logoRef} type="file" accept="image/*" onChange={handleLogo} style={{ display: 'none' }} />
          </label>
          {user.logo && (
            <button className="btn-danger btn-sm" style={{ marginLeft: 8 }} onClick={() => updateUser({ logo: null })}>Quitar</button>
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
      {ok && <div className="alert alert-ok">Cambios guardados</div>}
      <button className="btn-primary" onClick={save}>Guardar cambios</button>
    </div>
  )
}

// ── Clientes ──────────────────────────────────────────────────────────────────
function ClientesTab() {
  const { user, updateUser } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [f, setF] = useState({ nombre: '', nit: '', director: '', cargo: 'Director de Obra', tel: '', ciudad: '' })
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))

  const save = () => {
    if (!f.nombre.trim()) return
    updateUser({ clientes: [...(user.clientes || []), { ...f }] })
    setF({ nombre: '', nit: '', director: '', cargo: 'Director de Obra', tel: '', ciudad: '' })
    setShowForm(false)
  }

  const del = (i) => updateUser({ clientes: user.clientes.filter((_, j) => j !== i) })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{(user.clientes || []).length} cliente(s) guardado(s)</span>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(s => !s)}>
          {showForm ? 'Cancelar' : '+ Agregar cliente'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="sect-title">Nuevo cliente</div>
          <div className="grid2" style={{ marginBottom: 10 }}>
            <Field label="Empresa / Razón social"><input value={f.nombre} onChange={e => set('nombre', e.target.value)} /></Field>
            <Field label="NIT"><input value={f.nit} onChange={e => set('nit', e.target.value)} /></Field>
          </div>
          <div className="grid3" style={{ marginBottom: 10 }}>
            <Field label="Director de obra"><input value={f.director} onChange={e => set('director', e.target.value)} /></Field>
            <Field label="Cargo"><input value={f.cargo} onChange={e => set('cargo', e.target.value)} /></Field>
            <Field label="Teléfono"><input value={f.tel} onChange={e => set('tel', e.target.value)} /></Field>
          </div>
          <Field label="Ciudad" style={{ marginBottom: 14 }}>
            <input value={f.ciudad} onChange={e => set('ciudad', e.target.value)} />
          </Field>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={save}>Guardar cliente</button>
            <button onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {(user.clientes || []).length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--sub)' }}>
          <p style={{ marginBottom: 6 }}>Aún no tienes clientes guardados.</p>
          <p style={{ fontSize: 12 }}>Agrégalos para no escribirlos en cada acta.</p>
        </div>
      ) : (
        (user.clientes || []).map((c, i) => {
          const [bg, fg] = avatarColor(i)
          return (
            <div key={i} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
              <div className="avatar" style={{ background: bg, color: fg }}>{initials(c.nombre)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 13 }}>{c.nombre}</p>
                <p style={{ fontSize: 12, color: 'var(--sub)' }}>{c.nit}{c.ciudad ? ' · ' + c.ciudad : ''}</p>
                {c.director && <p style={{ fontSize: 11, color: 'var(--sub)', marginTop: 2 }}>{c.director} · {c.cargo}</p>}
              </div>
              <button className="btn-danger btn-sm" onClick={() => del(i)}>Eliminar</button>
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
  const [f, setF] = useState({ codigo: '', actividad: '', und: 'M2', valor: '' })
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))

  const save = () => {
    if (!f.actividad.trim()) return
    updateUser({ catalogo: [...(user.catalogo || []), { ...f, valor: parseFloat(f.valor) || 0 }] })
    setF({ codigo: '', actividad: '', und: 'M2', valor: '' })
    setShowForm(false)
  }

  const del = (i) => updateUser({ catalogo: user.catalogo.filter((_, j) => j !== i) })

  const importExcel = (e) => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const wb = XLSX.read(ev.target.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
      if (rows.length < 2) return
      const header = rows[0].map(h => String(h).toLowerCase().trim())
      const iCod = header.findIndex(h => h.includes('cod') || h === 'item')
      const iAct = header.findIndex(h => h.includes('activ') || h.includes('desc'))
      const iUnd = header.findIndex(h => h.includes('und') || h.includes('unit'))
      const iVal = header.findIndex(h => h.includes('val') || h.includes('prec'))
      const items = rows.slice(1).map(row => ({
        codigo:    iCod >= 0 ? String(row[iCod] ?? '').trim() : String(row[0] ?? '').trim(),
        actividad: iAct >= 0 ? String(row[iAct] ?? '').trim() : String(row[1] ?? '').trim(),
        und:       iUnd >= 0 ? String(row[iUnd] ?? '').trim() || 'UND' : String(row[2] ?? '').trim() || 'UND',
        valor:     parseFloat(iVal >= 0 ? row[iVal] : row[3]) || 0,
      })).filter(it => it.actividad)
      updateUser({ catalogo: [...(user.catalogo || []), ...items] })
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  const cat = user.catalogo || []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{cat.length} actividad(es)</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <label style={{ cursor: 'pointer' }}>
            <span style={{ border: '1px solid var(--azul2)', color: 'var(--azul2)', background: 'var(--azul-bg)', padding: '5px 12px', borderRadius: 'var(--radio)', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              📥 Importar Excel
            </span>
            <input type="file" accept=".xlsx,.xls" onChange={importExcel} style={{ display: 'none' }} />
          </label>
          <button className="btn-sm" onClick={() => setShowForm(s => !s)}>{showForm ? 'Cancelar' : '+ Agregar'}</button>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="grid3" style={{ marginBottom: 10 }}>
            <Field label="Código"><input value={f.codigo} onChange={e => set('codigo', e.target.value)} placeholder="P1" /></Field>
            <div style={{ gridColumn: 'span 2' }}>
              <Field label="Descripción"><input value={f.actividad} onChange={e => set('actividad', e.target.value)} placeholder="Pañete allanado 1:4" /></Field>
            </div>
          </div>
          <div className="grid3" style={{ marginBottom: 12 }}>
            <Field label="Unidad">
              <select value={f.und} onChange={e => set('und', e.target.value)}>
                {['M2','ML','M3','KG','TON','UND','GLB','DIA','HR','MES'].map(u => <option key={u}>{u}</option>)}
              </select>
            </Field>
            <Field label="Valor unitario"><input type="number" value={f.valor} onChange={e => set('valor', e.target.value)} placeholder="0" /></Field>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={save}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {cat.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--sub)' }}>
          <p style={{ marginBottom: 6 }}>Sin actividades en el catálogo.</p>
          <p style={{ fontSize: 12 }}>Importa un Excel (.xlsx) con columnas: <code style={{ background: 'var(--gris)', padding: '1px 5px', borderRadius: 3 }}>Codigo · Actividad · Und · Valor</code></p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="act-table" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ width: 70 }}>Código</th>
                <th className="left">Actividad</th>
                <th style={{ width: 60 }}>Und</th>
                <th style={{ width: 110 }}>Valor</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {cat.map((c, i) => (
                <tr key={i}>
                  <td style={{ textAlign: 'center' }}>{c.codigo ? <span className="tag tag-blue">{c.codigo}</span> : '—'}</td>
                  <td style={{ color: '#1a1a1a' }}>{c.actividad}</td>
                  <td style={{ textAlign: 'center', color: 'var(--sub)', fontWeight: 500 }}>{c.und || '—'}</td>
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
  const [aiu, setAiu] = useState({ ...user.aiu })
  const [iva, setIva] = useState(user.iva ?? 19)
  const [ok, setOk] = useState(false)

  const setA = (k, v) => setAiu(x => ({ ...x, [k]: parseFloat(v) || 0 }))

  const save = () => {
    updateUser({ aiu, iva })
    setOk(true)
    setTimeout(() => setOk(false), 2500)
  }

  const base = 1000000
  const admV = Math.round(base * aiu.admin / 100)
  const impV = Math.round(base * aiu.imprevistos / 100)
  const utiV = Math.round(base * aiu.utilidad / 100)
  const baseIva = admV + impV + utiV
  const ivaV = Math.round(baseIva * iva / 100)
  const total = base + baseIva + ivaV

  return (
    <div className="card">
      <div className="sect-title">Configuración AIU</div>
      <div className="alert alert-warn" style={{ marginBottom: 14 }}>
        El IVA aplica sobre la suma del AIU (Administración + Imprevistos + Utilidad).
      </div>
      <div className="grid4" style={{ marginBottom: 20 }}>
        <Field label="Administración %"><input type="number" value={aiu.admin} onChange={e => setA('admin', e.target.value)} min="0" max="100" /></Field>
        <Field label="Imprevistos %"><input type="number" value={aiu.imprevistos} onChange={e => setA('imprevistos', e.target.value)} min="0" max="100" /></Field>
        <Field label="Utilidad %"><input type="number" value={aiu.utilidad} onChange={e => setA('utilidad', e.target.value)} min="0" max="100" /></Field>
        <Field label="IVA %"><input type="number" value={iva} onChange={e => setIva(parseFloat(e.target.value) || 0)} min="0" max="100" /></Field>
      </div>

      <div className="sect-title">Vista previa (sobre $ 1.000.000 de actividades)</div>
      {[['Total bruto', base, false], [`Administración ${aiu.admin}%`, admV, false], [`Imprevistos ${aiu.imprevistos}%`, impV, false], [`Utilidad ${aiu.utilidad}%`, utiV, false], [`IVA ${iva}%`, ivaV, false], ['Total final', total, true]].map(([l, v, bold]) => (
        <div key={l} className={`summary-row${bold ? ' total' : ''}`}>
          <span style={{ fontSize: 12, color: bold ? 'var(--azul)' : 'var(--sub)', fontWeight: bold ? 700 : 400 }}>{l}</span>
          <span style={{ fontSize: bold ? 15 : 12, fontWeight: bold ? 700 : 400, color: bold ? 'var(--verde)' : '#1a1a1a' }}>{fmtCOP(v)}</span>
        </div>
      ))}

      <div style={{ marginTop: 18 }}>
        {ok && <div className="alert alert-ok">Configuración guardada</div>}
        <button className="btn-primary" onClick={save}>Guardar configuración</button>
      </div>
    </div>
  )
}
