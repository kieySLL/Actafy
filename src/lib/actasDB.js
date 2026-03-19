import { supabase } from './supabase'

const LOCAL_KEY = 'actafy_actas_v1'

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || [] }
  catch { return [] }
}

function saveLocal(actas) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(actas)) } catch {}
}

async function hasSession() {
  if (!supabase) return false
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}

export async function saveActa(userId, form, totals, existingId = null) {
  const record = {
    numero:        form.numero,
    fecha:         form.fecha || null,
    periodo:       form.periodo,
    contrato:      form.contrato,
    obra:          form.obra,
    ubicacion:     form.ubicacion,
    empresa_c:     form.empresa_c,
    nit_cl:        form.nit_cl,
    director:      form.director,
    cargo:         form.cargo,
    tel_cl:        form.tel_cl,
    observaciones: form.observaciones,
    grupos:        form.grupos,
    fotos:         form.fotos,
    total_bruto:   totals.bruto,
    total_final:   totals.total,
    updated_at:    new Date().toISOString(),
  }

  if (await hasSession()) {
    if (existingId) {
      const { data, error } = await supabase
        .from('actas').update(record).eq('id', existingId).select('id').single()
      if (error) throw error
      return data.id
    } else {
      const { data, error } = await supabase
        .from('actas').insert({ ...record, user_id: userId }).select('id').single()
      if (error) throw error
      return data.id
    }
  }

  // localStorage fallback
  const actas = loadLocal()
  if (existingId) {
    const idx = actas.findIndex(a => a.id === existingId)
    if (idx >= 0) actas[idx] = { ...actas[idx], ...record }
    saveLocal(actas)
    return existingId
  } else {
    const id = crypto.randomUUID()
    actas.unshift({ id, user_id: userId, ...record, created_at: new Date().toISOString() })
    saveLocal(actas)
    return id
  }
}

export async function loadActas(userId) {
  if (await hasSession()) {
    const { data, error } = await supabase
      .from('actas')
      .select('id, numero, fecha, obra, empresa_c, total_final, updated_at')
      .order('updated_at', { ascending: false })
    if (error) throw error
    return data
  }
  return loadLocal()
    .filter(a => a.user_id === userId)
    .map(({ id, numero, fecha, obra, empresa_c, total_final, updated_at }) =>
      ({ id, numero, fecha, obra, empresa_c, total_final, updated_at })
    )
}

export async function loadActaById(id) {
  if (await hasSession()) {
    const { data, error } = await supabase.from('actas').select('*').eq('id', id).single()
    if (error) throw error
    return data
  }
  return loadLocal().find(a => a.id === id) || null
}

export async function deleteActa(id) {
  if (await hasSession()) {
    const { error } = await supabase.from('actas').delete().eq('id', id)
    if (error) throw error
    return
  }
  saveLocal(loadLocal().filter(a => a.id !== id))
}
