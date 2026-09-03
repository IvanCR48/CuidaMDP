import { supabase } from '../supabaseClient'

/**
 * Servicio para gestión y persistencia de reportes cívicos.
 */
export const reportsService = {
  /**
   * Obtiene todos los reportes ordenados por fecha descendente.
   * @returns {Promise<Array>}
   */
  async fetchReports() {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Inserta un nuevo reporte en la base de datos.
   * @param {Object} reportData
   * @returns {Promise<Object>}
   */
  async createReport({
    category,
    description,
    address,
    neighborhood,
    latitude,
    longitude,
    images = [],
    ipAddress = null,
    clientId = null
  }) {
    const { data, error } = await supabase
      .from('reports')
      .insert([
        {
          category,
          description,
          address,
          neighborhood,
          latitude,
          longitude,
          images,
          status: 'pending',
          votes_count: 0,
          ip_address: ipAddress,
          client_id: clientId
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Actualiza el estado de un reporte (ej: in_progress, resolved).
   * @param {string} id
   * @param {string} status
   * @param {Object} [extraData]
   * @returns {Promise<Object>}
   */
  async updateReportStatus(id, status, extraData = {}) {
    const { data, error } = await supabase
      .from('reports')
      .update({
        status,
        ...extraData
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Elimina un reporte definitivamente (requiere permisos de empleado autenticado).
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deleteReport(id) {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Suscribe a cambios en tiempo real en la tabla de reportes.
   * @param {Function} onPayload - Callback que recibe el payload del evento (INSERT, UPDATE, DELETE)
   * @returns {Object} canal de suscripción con método unsubscribe()
   */
  subscribeToReports(onPayload) {
    try {
      const channel = supabase
        .channel('reports-realtime-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'reports' },
          (payload) => {
            if (onPayload) onPayload(payload)
          }
        )
        .subscribe()

      return {
        unsubscribe: () => {
          try {
            supabase.removeChannel(channel)
          } catch {
            // Ignorar errores al desuscribir si la conexión no se completó
          }
        }
      }
    } catch (err) {
      console.warn('No se pudo establecer conexión en tiempo real con Supabase:', err)
      return {
        unsubscribe: () => {}
      }
    }
  }
}
