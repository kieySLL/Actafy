import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { loadDB, saveDB } from '../lib/helpers'

const AuthContext = createContext(null)

// Persiste sesión local entre recargas (sessionStorage = hasta que cierra la pestaña)
const SESSION_KEY = 'actafy_local_session'
const getLocalSession = () => { try { return sessionStorage.getItem(SESSION_KEY) } catch { return null } }
const setLocalSession = (v) => { try { v ? sessionStorage.setItem(SESSION_KEY, v) : sessionStorage.removeItem(SESSION_KEY) } catch {} }

export function AuthProvider({ children }) {
  // ── Supabase mode ──────────────────────────────────────────────────────────
  const [supaUser, setSupaUser]                 = useState(null)
  const [profile, setProfile]                   = useState(null)
  const [passwordRecovery, setPasswordRecovery] = useState(false)
  const [loading, setLoading]                   = useState(!!supabase)

  // ── localStorage mode ──────────────────────────────────────────────────────
  const [db, setDb]         = useState(() => loadDB())
  const [localUser, setLocalUser] = useState(() => getLocalSession())

  // ── Supabase auth listener ─────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) return

    // Seguridad: si onAuthStateChange nunca dispara (red caída, proyecto pausado,
    // credenciales inválidas) forzamos loading=false después de 8 segundos
    const safetyTimer = setTimeout(() => setLoading(false), 8000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // ⚠️  NO cancelar el timer aquí: fetchProfile puede colgarse si Supabase
      // está pausado. El timer sigue corriendo como red de seguridad.
      try {
        if (event === 'PASSWORD_RECOVERY') {
          setPasswordRecovery(true)
          return
        }
        if (session?.user) {
          setSupaUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setSupaUser(null)
          setProfile(null)
        }
      } catch (err) {
        console.error('Error en auth state change:', err)
        setSupaUser(null)
        setProfile(null)
      } finally {
        // Cancelar el timer solo cuando TODO terminó (incluyendo fetchProfile)
        clearTimeout(safetyTimer)
        setLoading(false)
      }
    })

    return () => {
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (uid) => {
    const { data, error } = await supabase.from('perfiles').select('*').eq('id', uid).single()
    if (error && error.code !== 'PGRST116') {
      console.error('Error cargando perfil:', error.message)
    }
    setProfile({
      nombre:        data?.nombre        || '',
      nit:           data?.nit           || '',
      representante: data?.representante || '',
      tel:           data?.tel           || '',
      direccion:     data?.direccion     || '',
      ciudad:        data?.ciudad        || '',
      tipo:          data?.tipo          || 'Obra civil',
      logo:          data?.logo_url      || null,
      clientes:      Array.isArray(data?.clientes) ? data.clientes : [],
      catalogo:      Array.isArray(data?.catalogo) ? data.catalogo : [],
      aiu: {
        admin:       data?.aiu_admin ?? 10,
        imprevistos: data?.aiu_imp   ?? 3,
        utilidad:    data?.aiu_util  ?? 10,
      },
      iva:  data?.iva  ?? 19,
      plan: data?.plan || 'gratis',
    })
  }

  // ── Auth actions ───────────────────────────────────────────────────────────
  const login = async (email, password) => {
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return error.message === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos'
        : error.message
      return null
    }
    const found = db.users[email]
    if (!found) return 'Usuario no encontrado'
    if (found.password !== password) return 'Contraseña incorrecta'
    setLocalUser(email)
    setLocalSession(email)
    return null
  }

  const register = async (email, password, nombre, nit) => {
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return error.message
      if (data.user) {
        await supabase.from('perfiles').upsert({ id: data.user.id, nombre, nit: nit || '' })
      }
      return null
    }
    if (!email || !password || !nombre) return 'Email, contraseña y nombre son obligatorios'
    if (db.users[email]) return 'Ese email ya está registrado'
    const newDb = {
      ...db,
      users: {
        ...db.users,
        [email]: {
          password, nombre, nit: nit || '',
          representante: '', tel: '', direccion: '', ciudad: '',
          tipo: 'Obra civil', logo: null,
          clientes: [], catalogo: [],
          aiu: { admin: 10, imprevistos: 3, utilidad: 10 }, iva: 19,
        },
      },
    }
    saveDB(newDb)
    setDb(newDb)
    setLocalUser(email)
    setLocalSession(email)
    return null
  }

  const logout = async () => {
    if (supabase) {
      setPasswordRecovery(false)
      await supabase.auth.signOut()
    } else {
      setLocalUser(null)
      setLocalSession(null)
    }
  }

  const resetPassword = async (email) => {
    if (!supabase) return 'Recuperación de contraseña no disponible en modo local'
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    return error ? error.message : null
  }

  const updatePassword = async (newPassword) => {
    if (!supabase) return 'Función no disponible'
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return error.message
    setPasswordRecovery(false)
    return null
  }

  const persist = useCallback((newDb) => { setDb(newDb); saveDB(newDb) }, [])

  // updateUser retorna { ok: true } o { ok: false, error: string }
  const updateUser = useCallback(async (data) => {
    if (supabase && supaUser) {
      const update = {}
      if ('nombre'        in data) update.nombre        = data.nombre
      if ('nit'           in data) update.nit           = data.nit
      if ('representante' in data) update.representante = data.representante
      if ('tel'           in data) update.tel           = data.tel
      if ('direccion'     in data) update.direccion     = data.direccion
      if ('ciudad'        in data) update.ciudad        = data.ciudad
      if ('tipo'          in data) update.tipo          = data.tipo
      if ('logo'          in data) update.logo_url      = data.logo
      if ('clientes'      in data) update.clientes      = data.clientes
      if ('catalogo'      in data) update.catalogo      = data.catalogo
      if ('aiu'           in data) {
        update.aiu_admin = data.aiu.admin
        update.aiu_imp   = data.aiu.imprevistos
        update.aiu_util  = data.aiu.utilidad
      }
      if ('iva' in data) update.iva = data.iva

      if (Object.keys(update).length > 0) {
        const { error } = await supabase.from('perfiles').upsert({ id: supaUser.id, ...update })
        if (error) {
          console.error('Error guardando perfil:', error)
          return { ok: false, error: `Error al guardar: ${error.message}` }
        }
      }
      setProfile(p => ({ ...p, ...data }))
      return { ok: true }
    }

    if (localUser) {
      const newDb = {
        ...db,
        users: { ...db.users, [localUser]: { ...db.users[localUser], ...data } },
      }
      persist(newDb)
      return { ok: true }
    }

    return { ok: false, error: 'No hay sesión activa' }
  }, [db, localUser, supaUser, persist])

  // ── Computed ───────────────────────────────────────────────────────────────
  const user     = supabase ? (supaUser ? profile : null) : (localUser ? db.users[localUser] : null)
  const userId   = supabase ? (supaUser?.id || null) : localUser
  const username = supabase ? (supaUser?.email || null) : localUser

  return (
    <AuthContext.Provider value={{
      user, userId, username,
      login, register, logout, updateUser,
      resetPassword, updatePassword, passwordRecovery,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
