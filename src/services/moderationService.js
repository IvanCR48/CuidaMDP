import { supabase } from '../supabaseClient'

/**
 * Servicio de moderación administrativa para personal municipal.
 */
export const moderationService = {
  /**
   * Bloquea una dirección IP para impedir reportes spam o maliciosos.
   * @param {string} ipAddress 
   * @param {string} reason 
   * @returns {Promise<void>}
   */
  async banIp(ipAddress, reason) {
    const { error } = await supabase
      .from('banned_ips')
      .insert([{ ip_address: ipAddress, reason }])

    if (error) {
      if (error.code === '23505') {
        throw new Error('Esta IP ya se encuentra bloqueada.')
      }
      throw error
    }
  }
}
