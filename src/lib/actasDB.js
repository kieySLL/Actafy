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

// Construye el record solo con los campos actuales del formulario
function buildRecord(form, totals) {
  return {
    numero:        form.numero        || null,
    fecha:         form.fecha         || null,
    contrato:      form.contrato      || null,
    obra:          form.obra          || null,
    ubicacion:     form.ubicacion     || null,
    empresa_c:     form.empresa_c     || null,
    nit_cl:        form.nit_cl        || null,
    director:      form.director      || null,
    observaciones: form.observaciones || null,
    grupos:        form.grupos        || [],
    fotos:         form.fotos         || [],
    total_bruto:   totals.bruto       || 0,
    total_final:   totals.total       || 0,
    updated_at:    new Date().toISOString(),
  }
}

export async function saveActa(userId, form, totals, existingId = null) {
  const record = buildRecord(form, totals)

  if (await hasSession()) {
    if (existingId) {
      const { data, error } = await supabase
        .from('actas').update(record).eq('id', existingId).select('id').single()
      if (error) throw new Error(error.message)
      return data.id
    } else {
      const { data, error } = await supabase
        .from('actas')
        .insert({ ...record, user_id: userId, estado: 'Borrador' })
        .select('id').single()
      if (error) throw new Error(error.message)
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
    actas.unshift({ id, user_id: userId, ...record, estado: 'Borrador', created_at: new Date().toISOString() })
    saveLocal(actas)
    return id
  }
}

export async function updateEstado(id, estado) {
  if (await hasSession()) {
    const { error } = await supabase
      .from('actas').update({ estado, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw new Error(error.message)
    return
  }
  const actas = loadLocal()
  const idx = actas.findIndex(a => a.id === id)
  if (idx >= 0) {
    actas[idx] = { ...actas[idx], estado, updated_at: new Date().toISOString() }
    saveLocal(actas)
  }
}

export async function loadActas(userId) {
  if (await hasSession()) {
    const { data, error } = await supabase
      .from('actas')
      .select('id, numero, fecha, obra, empresa_c, total_final, estado, updated_at')
      .eq('user_id', userId)                      // ← filtro explícito por usuario
      .order('updated_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data || []
  }
  return loadLocal()
    .filter(a => a.user_id === userId)
    .map(({ id, numero, fecha, obra, empresa_c, total_final, estado, updated_at }) =>
      ({ id, numero, fecha, obra, empresa_c, total_final, estado: estado || 'Borrador', updated_at })
    )
}

export async function loadActaById(id) {
  if (await hasSession()) {
    const { data, error } = await supabase.from('actas').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    return data
  }
  return loadLocal().find(a => a.id === id) || null
}

export async function countActas(userId) {
  if (await hasSession()) {
    const { count, error } = await supabase
      .from('actas')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
    return count ?? 0
  }
  return loadLocal().filter(a => a.user_id === userId).length
}

export async function deleteActa(id) {
  if (await hasSession()) {
    const { error } = await supabase.from('actas').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return
  }
  saveLocal(loadLocal().filter(a => a.id !== id))
}
