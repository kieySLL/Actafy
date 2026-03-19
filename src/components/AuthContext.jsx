import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { loadDB, saveDB } from '../lib/helpers'

const AuthContext = createContext(null)
const MODE = supabase ? 'supabase' : 'local'

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [sbUser, setSbUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (MODE !== 'supabase') { setLoading(false); return }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setSbUser(session.user); loadPerfil(session.user.id) }
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) { setSbUser(session.user); loadPerfil(session.user.id) }
      else { setSbUser(null); setUser(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadPerfil = async (uid) => {
    const [{ data: p }, { data: cl }, { data: cat }] = await Promise.all([
      supabase.from('perfiles').select('*').eq('id', uid).single(),
      supabase.from('clientes').select('*').eq('user_id', uid).order('created_at'),
      supabase.from('catalogo').select('*').eq('user_id', uid).order('created_at'),
    ])
    setUser({
      ...(p || {}),
      clientes: cl || [],
      catalogo: cat || [],
      aiu: { admin: p?.aiu_admin ?? 10, imprevistos: p?.aiu_imp ?? 3, utilidad: p?.aiu_util ?? 10 },
      iva: p?.iva ?? 19,
    })
    setLoading(false)
  }

  const login = async (email, password) => {
    if (MODE === 'supabase') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (!error) return null
      return error.message.includes('Invalid') ? 'Email o contraseña incorrectos' : error.message
    }
    const db = loadDB()
    const u = db.users?.[email.toLowerCase()]
    if (!u) return 'Usuario no encontrado'
    if (u.password !== password) return 'Contraseña incorrecta'
    setUser({ ...u, _username: email.toLowerCase() })
    setLoading(false)
    return null
  }

  const register = async (email, password, nombre, nit) => {
    if (!email || !password || !nombre) return 'Todos los campos son obligatorios'
    if (MODE === 'supabase') {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return error.message
      if (data.user) {
        await supabase.from('perfiles').upsert({
          id: data.user.id, nombre, nit: nit || '',
          aiu_admin: 10, aiu_imp: 3, aiu_util: 10, iva: 19,
        })
      }
      return null
    }
    const db = loadDB()
    const key = email.trim().toLowerCase()
    if (db.users?.[key]) return 'Ese usuario ya existe'
    db.users = {
      ...(db.users || {}),
      [key]: {
        password, nombre, nit: nit || '', representante: '', tel: '',
        direccion: '', ciudad: '', tipo: 'Obra civil', logo: null,
        clientes: [], catalogo: [],
        aiu: { admin: 10, imprevistos: 3, utilidad: 10 }, iva: 19,
      },
    }
    saveDB(db)
    setUser({ ...db.users[key], _username: key })
    setLoading(false)
    return null
  }

  const logout = async () => {
    if (MODE === 'supabase') await supabase.auth.signOut()
    setUser(null); setSbUser(null)
  }

  const updateUser = useCallback(async (data) => {
    if (MODE === 'supabase' && sbUser) {
      const pf = {}
      if ('nombre'        in data) pf.nombre        = data.nombre
      if ('nit'           in data) pf.nit            = data.nit
      if ('representante' in data) pf.representante  = data.representante
      if ('tel'           in data) pf.tel            = data.tel
      if ('direccion'     in data) pf.direccion      = data.direccion
      if ('ciudad'        in data) pf.ciudad         = data.ciudad
      if ('tipo'          in data) pf.tipo           = data.tipo
      if ('logo_url'      in data) pf.logo_url       = data.logo_url
      if ('aiu'           in data) {
        pf.aiu_admin = data.aiu.admin
        pf.aiu_imp   = data.aiu.imprevistos
        pf.aiu_util  = data.aiu.utilidad
      }
      if ('iva' in data) pf.iva = data.iva

      if (Object.keys(pf).length) await supabase.from('perfiles').update(pf).eq('id', sbUser.id)

      if ('clientes' in data) {
        await supabase.from('clientes').delete().eq('user_id', sbUser.id)
        if (data.clientes.length) {
          await supabase.from('clientes').insert(
            data.clientes.map(({ id, created_at, user_id, ...c }) => ({ ...c, user_id: sbUser.id }))
          )
        }
      }
      if ('catalogo' in data) {
        await supabase.from('catalogo').delete().eq('user_id', sbUser.id)
        if (data.catalogo.length) {
          await supabase.from('catalogo').insert(
            data.catalogo.map(({ id, created_at, user_id, ...c }) => ({ ...c, user_id: sbUser.id }))
          )
        }
      }
      await loadPerfil(sbUser.id)
    } else {
      const db = loadDB()
      const key = user?._username
      if (!key) return
      db.users[key] = { ...db.users[key], ...data }
      saveDB(db)
      setUser(prev => ({ ...prev, ...data }))
    }
  }, [sbUser, user])

  const uploadLogo = useCallback(async (file) => {
    if (MODE === 'supabase' && sbUser) {
      const ext  = file.name.split('.').pop()
      const path = `${sbUser.id}/logo.${ext}`
      const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('logos').getPublicUrl(path)
      const url = `${data.publicUrl}?t=${Date.now()}`
      await updateUser({ logo_url: url })
      return url
    }
    return new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = e => { updateUser({ logo: e.target.result }); resolve(e.target.result) }
      r.onerror = reject
      r.readAsDataURL(file)
    })
  }, [sbUser, updateUser])

  const removeLogo = useCallback(async () => {
    if (MODE === 'supabase' && sbUser) {
      await supabase.storage.from('logos').remove(
        ['png','jpg','jpeg'].map(ext => `${sbUser.id}/logo.${ext}`)
      )
      await updateUser({ logo_url: null })
    } else {
      updateUser({ logo: null })
    }
  }, [sbUser, updateUser])

  const logoUrl = user?.logo_url || user?.logo || null

  return (
    <AuthContext.Provider value={{
      user, sbUser, loading, mode: MODE,
      login, register, logout,
      updateUser, uploadLogo, removeLogo, logoUrl,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
