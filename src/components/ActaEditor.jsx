import { useState, useRef, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { Field } from './AuthScreen'
import { fmtCOP, calcTotals, emptyAct, emptyGrupo, today, avatarColor, initials } from '../lib/helpers'
import { exportPDF, exportWord, exportExcel } from '../lib/exporters'
import { saveActa } from '../lib/actasDB'
import { ActafyIcon } from './ActafyLogo'

export default function ActaEditor({ onSettings, onLogout, onBack, onNew, initialForm, actaId }) {
  const { user, userId } = useAuth()
  const [tab, setTab] = useState(0)
  const [modal, setModal] = useState(null) // null | 'cliente' | { type:'catalogo', gi }
  const [catalogSearch, setCatalogSearch] = useState('')
  const [exporting, setExporting] = useState(null)
  const [exportMsg, setExportMsg] = useState(null)
  // Auto-save state: null | 'pending' | 'saving' | 'saved' | 'error'
  const [saveStatus, setSaveStatus] = useState(null)
  const [currentActaId, setCurrentActaId] = useState(actaId || null)
  const fotoRef    = useRef()
  const actaIdRef  = useRef(actaId || null)   // ref para evitar stale closure en auto-save
  const timerRef   = useRef(null)
  const mountedRef = useRef(false)            // skip first render

  const [form, setForm] = useState(() => initialForm ? { ...initialForm } : {
    numero: '1', fecha: today(), contrato: '',
    obra: '', ubicacion: '',
    empresa_c: '', nit_cl: '', director: '',
    observaciones: '',
    grupos: [emptyGrupo()],
    fotos: [],
  })

  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ── Auto-save (debounced 2.5 s tras cada cambio en el formulario) ──────────
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return }
    setSaveStatus('pending')
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        const freshT = calcTotals(form.grupos, user.aiu || {}, user.iva ?? 19)
        const newId  = await saveActa(userId, form, freshT, actaIdRef.current)
        if (!actaIdRef.current) { actaIdRef.current = newId; setCurrentActaId(newId) }
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus(null), 3000)
      } catch (e) {
        console.error('Auto-save:', e.message)
        setSaveStatus('error')
      }
    }, 2500)
    return () => clearTimeout(timerRef.current)
  }, [form]) // eslint-disable-line react-hooks/exhaustive-deps

  const T = calcTotals(form.grupos, user.aiu || {}, user.iva ?? 19)
  const TABS = ['Obra y cliente', 'Actividades', 'Exportar']

  // ── Grupo / actividad actions ──────────────────────────────────────────────
  const addGrupo = () => setForm(f => ({ ...f, grupos: [...f.grupos, emptyGrupo()] }))
  const removeGrupo = (gi) => setForm(f => ({ ...f, grupos: f.grupos.filter((_, i) => i !== gi) }))

  const setGrupoNombre = (gi, v) => setForm(f => ({
    ...f,
    grupos: f.grupos.map((g, i) => i !== gi ? g : { ...g, nombre: v }),
  }))

  const addAct = (gi) => setForm(f => ({
    ...f,
    grupos: f.grupos.map((g, i) => i !== gi ? g : { ...g, acts: [...g.acts, emptyAct()] }),
  }))

  const removeAct = (gi, ai) => setForm(f => ({
    ...f,
    grupos: f.grupos.map((g, i) => {
      if (i !== gi) return g
      const acts = g.acts.filter((_, j) => j !== ai)
      return { ...g, acts: acts.length ? acts : [emptyAct()] }
    }),
  }))

  const setAct = (gi, ai, k, v) => setForm(f => ({
    ...f,
    grupos: f.grupos.map((g, i) => i !== gi ? g : {
      ...g,
      acts: g.acts.map((a, j) => j !== ai ? a : { ...a, [k]: v }),
    }),
  }))

  const addFromCatalog = (item) => {
    const gi = modal.gi
    setForm(f => ({
      ...f,
      grupos: f.grupos.map((g, i) => i !== gi ? g : {
        ...g,
        acts: [...g.acts, { item: item.codigo || '', desc: item.actividad || '', und: item.und || 'M2', cant: '', vunit: String(item.valor || 0), escat: true }],
      }),
    }))
    setModal(null)
    setCatalogSearch('')
  }

  const selectCliente = (c) => {
    setForm(f => ({ ...f, empresa_c: c.nombre || '', nit_cl: c.nit || '', director: c.director || '', cargo: c.cargo || 'Director de Obra', tel_cl: c.tel || '' }))
    setModal(null)
  }

  // ── Fotos ──────────────────────────────────────────────────────────────────
  const MAX_FOTO_MB = 2
  const addFotos = (e) => {
    const rechazadas = []
    Array.from(e.target.files).forEach(file => {
      if (file.size > MAX_FOTO_MB * 1024 * 1024) {
        rechazadas.push(file.name)
        return
      }
      const r = new FileReader()
      r.onload = ev => setForm(f => ({ ...f, fotos: [...f.fotos, { data: ev.target.result, cap: file.name.replace(/\.[^.]+$/, '') }] }))
      r.readAsDataURL(file)
    })
    if (rechazadas.length) {
      setExportMsg({ type: 'warn', text: `${rechazadas.length} foto(s) superan ${MAX_FOTO_MB}MB y no fueron agregadas: ${rechazadas.join(', ')}` })
    }
    e.target.value = ''  // reset input para poder subir el mismo archivo de nuevo
  }
  const removeFoto = (i) => setForm(f => ({ ...f, fotos: f.fotos.filter((_, j) => j !== i) }))
  const setFotoCap = (i, v) => setForm(f => ({ ...f, fotos: f.fotos.map((x, j) => j !== i ? x : { ...x, cap: v }) }))

  // ── Export data builder ────────────────────────────────────────────────────
  const buildExportData = () => ({
    numero: form.numero, fecha: form.fecha, periodo: form.periodo, contrato: form.contrato,
    obra: form.obra, ubicacion: form.ubicacion,
    contratista: user.nombre || '', nit_c: user.nit || '',
    representante: user.representante || '', tel_c: user.tel || '',
    tipo: user.tipo || 'Obra civil', logo: user.logo || null,
    cliente: form.empresa_c, nit_cl: form.nit_cl,
    director: form.director, cargo: form.cargo, tel_cl: form.tel_cl,
    observaciones: form.observaciones,
    grupos: form.grupos, fotos: form.fotos,
    aiu: user.aiu || { admin: 10, imprevistos: 3, utilidad: 10 },
    iva: user.iva ?? 19,
    totals: T,
  })

  // ── Validación antes de exportar ───────────────────────────────────────────
  const validateExport = () => {
    const errors = []
    if (!form.numero?.trim())   errors.push('Número de acta')
    if (!form.fecha)            errors.push('Fecha')
    if (!form.empresa_c?.trim()) errors.push('Cliente / empresa contratante')
    const tieneActividades = form.grupos.some(g => g.acts.some(a => a.desc?.trim()))
    if (!tieneActividades)      errors.push('Al menos una actividad con descripción')
    return errors
  }

  const doExport = async (fmt) => {
    setExportMsg(null)
    const errors = validateExport()
    if (errors.length) {
      setExportMsg({ type: 'warn', text: `Completa antes de exportar: ${errors.join(' · ')}` })
      return
    }
    setExporting(fmt)
    try {
      const d = buildExportData()
      if (fmt === 'PDF') await exportPDF(d)
      else if (fmt === 'Word') await exportWord(d)
      else await exportExcel(d)
      setExportMsg({ type: 'ok', text: `${fmt} generado y descargado correctamente ✓` })
      // auto-guardar al exportar
      const newId = await saveActa(userId, form, T, actaIdRef.current)
      if (!actaIdRef.current) { actaIdRef.current = newId; setCurrentActaId(newId) }
    } catch (e) {
      setExportMsg({ type: 'err', text: `Error al generar ${fmt}: ${e.message}` })
    }
    setExporting(null)
  }


  // ── Render tabs ────────────────────────────────────────────────────────────
  const catFiltered = (user.catalogo || []).filter(c =>
    !catalogSearch ||
    (c.actividad || '').toLowerCase().includes(catalogSearch.toLowerCase()) ||
    (c.codigo || '').toLowerCase().includes(catalogSearch.toLowerCase())
  )

  return (
    <div className="page">
      {/* Topbar */}
      <div className="topbar">
        {user.logo
          ? <img src={user.logo} alt="logo" style={{ height: 30, maxWidth: 80, objectFit: 'contain', borderRadius: 4 }} />
          : <ActafyIcon size={30} />
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.nombre || 'Mi empresa'}</p>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>Acta No. {form.numero}</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '5px 12px', textAlign: 'right', flexShrink: 0 }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>Total</p>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{T.total > 0 ? fmtCOP(T.total) : '—'}</p>
        </div>
        {/* Indicador de auto-guardado */}
        {saveStatus && (
          <span style={{
            fontSize: 11, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
            background: saveStatus === 'saved'  ? 'rgba(50,200,100,0.18)'
                      : saveStatus === 'error'  ? 'rgba(255,80,80,0.18)'
                      : saveStatus === 'saving' ? 'rgba(255,255,255,0.08)'
                      : 'rgba(255,190,50,0.18)',
            color: saveStatus === 'saved'  ? 'rgba(120,240,150,1)'
                 : saveStatus === 'error'  ? 'rgba(255,140,140,1)'
                 : saveStatus === 'saving' ? 'rgba(255,255,255,0.65)'
                 : 'rgba(255,210,80,1)',
            borderRadius: 6, padding: '4px 9px',
          }}>
            {saveStatus === 'saving'
              ? <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5, marginRight: 0 }} />
              : <span style={{ fontSize: 8 }}>●</span>
            }
            {saveStatus === 'saved'  ? 'Guardado'
           : saveStatus === 'error'  ? 'Error al guardar'
           : saveStatus === 'saving' ? 'Guardando…'
           : 'Sin guardar'}
          </span>
        )}
        <button onClick={onBack} style={{ borderColor: 'rgba(255,255,255,0.35)', color: 'rgba(255,255,255,0.85)', fontSize: 12, padding: '6px 12px' }}>← Historial</button>
        {currentActaId && onNew && (
          <button onClick={onNew} style={{ borderColor: 'rgba(255,255,255,0.35)', color: 'rgba(255,255,255,0.85)', fontSize: 12, padding: '6px 12px' }}>+ Nueva</button>
        )}
        <button onClick={onSettings} style={{ borderColor: 'rgba(255,255,255,0.35)', color: 'rgba(255,255,255,0.85)', fontSize: 12, padding: '6px 12px' }}>⚙ Perfil</button>
        <button onClick={onLogout} style={{ borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.65)', fontSize: 12, padding: '6px 12px' }}>Salir</button>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {TABS.map((t, i) => (
          <button key={i} className={`tab-btn${tab === i ? ' active' : ''}`} onClick={() => setTab(i)}>
            {tab > i ? '✓ ' : ''}{t}
          </button>
        ))}
      </div>

      {/* ── Tab 0: Obra y cliente ── */}
      {tab === 0 && (
        <div>
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="sect-title">Datos del acta</div>
            <div className="grid3" style={{ marginBottom: 10 }}>
              <Field label="Número de acta"><input value={form.numero} onChange={e => sf('numero', e.target.value)} /></Field>
              <Field label="Fecha"><input type="date" value={form.fecha} onChange={e => sf('fecha', e.target.value)} /></Field>
              <Field label="No. de contrato"><input value={form.contrato} onChange={e => sf('contrato', e.target.value)} /></Field>
            </div>
            <div className="grid2">
              <Field label="Actividad"><input value={form.obra} onChange={e => sf('obra', e.target.value)} /></Field>
              <Field label="Ubicación"><input value={form.ubicacion} onChange={e => sf('ubicacion', e.target.value)} /></Field>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="sect-title" style={{ marginBottom: 0, flex: 1 }}>Cliente / Contratante</span>
              {(user.clientes || []).length > 0 && (
                <button className="btn-sm" onClick={() => setModal('cliente')} style={{ borderColor: 'var(--azul2)', color: 'var(--azul2)', background: 'var(--azul-bg)', fontSize: 12 }}>
                  Seleccionar guardado
                </button>
              )}
            </div>
            <div className="grid2" style={{ marginBottom: 10 }}>
              <Field label="Empresa / Razón social"><input value={form.empresa_c} onChange={e => sf('empresa_c', e.target.value)} /></Field>
              <Field label="NIT"><input value={form.nit_cl} onChange={e => sf('nit_cl', e.target.value)} /></Field>
            </div>
            <Field label="Director de obra">
              <input value={form.director} onChange={e => sf('director', e.target.value)} />
            </Field>
          </div>

          <div className="card">
            <Field label="Observaciones">
              <textarea rows={3} value={form.observaciones} onChange={e => sf('observaciones', e.target.value)} />
            </Field>
          </div>
        </div>
      )}

      {/* ── Tab 1: Actividades ── */}
      {tab === 1 && (
        <div>
          {form.grupos.map((grupo, gi) => (
            <div key={gi} className="grupo-box">
              <div className="grupo-head">
                <div className="num-badge">{gi + 1}</div>
                <input
                  value={grupo.nombre}
                  onChange={e => setGrupoNombre(gi, e.target.value)}
                  placeholder="Nombre del grupo"
                  style={{ border: 'none', background: 'transparent', fontWeight: 700, fontSize: 13, flex: 1, padding: '0 4px', outline: 'none' }}
                />
                {form.grupos.length > 1 && (
                  <button className="btn-danger btn-sm" onClick={() => removeGrupo(gi)}>Eliminar grupo</button>
                )}
              </div>

              <div className="act-table-wrap">
                <table className="act-table">
                  <thead>
                    <tr>
                      <th style={{ width: 46 }}>Item</th>
                      <th className="left" style={{ minWidth: 200 }}>Descripción</th>
                      <th style={{ width: 52 }}>Und</th>
                      <th style={{ width: 82 }}>Cantidad</th>
                      <th style={{ width: 112 }}>V. unitario</th>
                      <th style={{ width: 112 }}>V. total</th>
                      <th style={{ width: 28 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.acts.map((act, ai) => {
                      const vt = Math.round((parseFloat(act.cant) || 0) * (parseFloat(act.vunit) || 0))
                      return (
                        <tr key={ai}>
                          <td><input value={act.item} onChange={e => setAct(gi, ai, 'item', e.target.value)} style={{ textAlign: 'center', padding: '4px 5px', fontSize: 11 }} /></td>
                          <td><input value={act.desc} onChange={e => setAct(gi, ai, 'desc', e.target.value)} style={{ padding: '4px 6px' }} /></td>
                          <td><input value={act.und} onChange={e => setAct(gi, ai, 'und', e.target.value)} style={{ textAlign: 'center', padding: '4px 4px', fontSize: 11 }} /></td>
                          <td><input type="number" value={act.cant} onChange={e => setAct(gi, ai, 'cant', e.target.value)} style={{ textAlign: 'right', padding: '4px 5px' }} /></td>
                          <td><input type="number" value={act.vunit} onChange={e => setAct(gi, ai, 'vunit', e.target.value)} style={{ textAlign: 'right', padding: '4px 5px' }} /></td>
                          <td style={{ textAlign: 'right', padding: '4px 8px', fontWeight: 700, color: vt > 0 ? 'var(--verde)' : 'var(--sub)', whiteSpace: 'nowrap' }}>
                            {vt > 0 ? fmtCOP(vt) : '—'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button onClick={() => removeAct(gi, ai)} style={{ border: 'none', background: 'none', color: '#CBD5E0', fontSize: 18, padding: 0, cursor: 'pointer', lineHeight: 1 }}>×</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grupo-footer">
                <button className="btn-sm" onClick={() => addAct(gi)}>+ Actividad</button>
                {(user.catalogo || []).length > 0 && (
                  <button className="btn-sm" onClick={() => { setModal({ type: 'catalogo', gi }); setCatalogSearch('') }}
                    style={{ borderColor: 'var(--azul2)', color: 'var(--azul2)', background: 'var(--azul-bg)' }}>
                    Desde catálogo
                  </button>
                )}
              </div>
            </div>
          ))}

          <button onClick={addGrupo} style={{ width: '100%', border: '2px dashed var(--borde)', borderRadius: 'var(--radio-lg)', padding: 10, color: 'var(--sub)', marginBottom: 16 }}>
            + Agregar grupo de actividades
          </button>

          <div className="card">
            <div className="sect-title">Resumen económico</div>
            {[
              ['Total bruto actividades', T.bruto, false],
              [`Administración ${user.aiu?.admin || 10}%`, T.admV, false],
              [`Imprevistos ${user.aiu?.imprevistos || 3}%`, T.impV, false],
              [`Utilidad ${user.aiu?.utilidad || 10}%`, T.utiV, false],
              [`IVA ${user.iva || 19}% (sobre AIU)`, T.ivaV, false],
              ['Total final', T.total, true],
            ].map(([l, v, bold]) => (
              <div key={l} className={`summary-row${bold ? ' total' : ''}`}>
                <span style={{ fontSize: 12, color: bold ? 'var(--azul)' : 'var(--sub)', fontWeight: bold ? 700 : 400 }}>{l}</span>
                <span style={{ fontSize: bold ? 16 : 12, fontWeight: bold ? 700 : 400, color: bold ? 'var(--verde)' : '#1a1a1a' }}>{fmtCOP(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab 2: Exportar ── */}
      {tab === 2 && (
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="sect-title">Resumen del acta</div>
            {[
              ['Contratista', user.nombre || '—'],
              ['Acta No.', form.numero],
              ['Fecha', form.fecha],
              ['Período', form.periodo || '—'],
              ['Obra', form.obra || '—'],
              ['Cliente', form.empresa_c || '—'],
              ['Director de obra', form.director || '—'],
              ['Actividades', form.grupos.reduce((s, g) => s + g.acts.filter(a => a.desc).length, 0)],
              ['Total final', fmtCOP(T.total)],
            ].map(([k, v], i, arr) => (
              <div key={k} className={`summary-row${i === arr.length - 1 ? ' total' : ''}`}>
                <span style={{ fontSize: 12, color: 'var(--sub)' }}>{k}</span>
                <span style={{ fontSize: i === arr.length - 1 ? 15 : 12, fontWeight: i === arr.length - 1 ? 700 : 400, color: i === arr.length - 1 ? 'var(--verde)' : '#1a1a1a' }}>{v}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="sect-title">Exportar</div>
            <div className="grid3 export-grid" style={{ marginBottom: 14 }}>
              {[
                { fmt: 'PDF',  bg: 'var(--rojo-bg)',  fg: 'var(--rojo)',  border: '#F09595', desc: 'Listo para imprimir' },
                { fmt: 'Word', bg: 'var(--azul-bg)',  fg: 'var(--azul2)', border: '#85B7EB', desc: 'Editable en Word' },
                { fmt: 'Excel',bg: 'var(--verde-bg)', fg: 'var(--verde)',  border: '#97C459', desc: 'Tabla de actividades' },
              ].map(({ fmt, bg, fg, border, desc }) => (
                <div key={fmt} className="export-card" style={{ background: bg, borderColor: border, opacity: exporting && exporting !== fmt ? 0.6 : 1, pointerEvents: exporting ? 'none' : 'auto' }} onClick={() => doExport(fmt)}>
                  {exporting === fmt
                    ? <><span className="spinner" style={{ borderTopColor: fg, borderColor: `${border}66` }} /><span style={{ fontSize: 12, color: fg }}>Generando…</span></>
                    : <>
                        <p style={{ fontWeight: 700, fontSize: 16, color: fg, marginBottom: 4 }}>{fmt}</p>
                        <p style={{ fontSize: 11, color: fg, opacity: 0.75 }}>{desc}</p>
                      </>
                  }
                </div>
              ))}
            </div>
            {exportMsg && (
              <div className={`alert alert-${exportMsg.type}`}>{exportMsg.text}</div>
            )}
          </div>
        </div>
      )}

      {/* Nav */}
      <div className="nav-bottom">
        <button onClick={() => setTab(t => Math.max(0, t - 1))} disabled={tab === 0}>← Anterior</button>
        <button className="btn-primary" onClick={() => setTab(t => Math.min(3, t + 1))} disabled={tab === 3}>Siguiente →</button>
      </div>

      {/* ── Modals ── */}
      {modal === 'cliente' && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-head">
              <span style={{ fontWeight: 700, fontSize: 14 }}>Seleccionar cliente</span>
              <button onClick={() => setModal(null)} style={{ border: 'none', background: 'none', fontSize: 22, color: 'var(--sub)', padding: 0, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div className="modal-body">
              {(user.clientes || []).map((c, i) => {
                const [bg, fg] = avatarColor(i)
                return (
                  <div key={i} onClick={() => selectCliente(c)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', cursor: 'pointer', borderBottom: '1px solid var(--borde)' }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--gris)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <div className="avatar" style={{ background: bg, color: fg }}>{initials(c.nombre)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 13 }}>{c.nombre}</p>
                      <p style={{ fontSize: 11, color: 'var(--sub)' }}>{c.nit}{c.director ? ' · ' + c.director : ''}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {modal?.type === 'catalogo' && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-head">
              <span style={{ fontWeight: 700, fontSize: 14 }}>Catálogo de actividades</span>
              <button onClick={() => setModal(null)} style={{ border: 'none', background: 'none', fontSize: 22, color: 'var(--sub)', padding: 0, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--borde)' }}>
              <input value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} placeholder="Buscar por nombre o código..." autoFocus />
            </div>
            <div className="modal-body">
              {catFiltered.length === 0
                ? <p style={{ padding: '24px', textAlign: 'center', fontSize: 12, color: 'var(--sub)' }}>Sin resultados</p>
                : catFiltered.map((c, i) => (
                    <div key={i} onClick={() => addFromCatalog(c)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', cursor: 'pointer', borderBottom: '1px solid var(--borde)' }}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--gris)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      {c.codigo && <span className="tag tag-blue" style={{ flexShrink: 0 }}>{c.codigo}</span>}
                      <span style={{ flex: 1, fontSize: 12 }}>{c.actividad}</span>
                      <span style={{ fontSize: 11, color: 'var(--sub)', flexShrink: 0 }}>{c.und}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--verde)', flexShrink: 0, minWidth: 80, textAlign: 'right' }}>{fmtCOP(c.valor)}</span>
                    </div>
                  ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
