import { supabase } from '../supabaseClient'

/**
 * Servicio de autenticación para personal municipal.
 */
export const authService = {
  /**
   * Obtiene la sesión activa actual.
   * @returns {Promise<Object|null>}
   */
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },

  /**
   * Escucha cambios en el estado de autenticación (login, logout, token refresh).
   * @param {Function} callback 
   * @returns {Object} Suscripción con método unsubscribe()
   */
  onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (callback) callback(event, session)
    })
    return subscription
  },

  /**
   * Inicia sesión con correo y contraseña.
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>}
   */
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  },

  /**
   * Cierra la sesión activa.
   * @returns {Promise<void>}
   */
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }
}
