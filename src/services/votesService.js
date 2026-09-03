import { supabase } from '../supabaseClient'

const VOTED_REPORTS_KEY = 'voted_reports'
const VOTER_ID_KEY = 'voter_id'

/**
 * Servicio para gestión de votos y persistencia de identidad anónima cívica.
 */
export const votesService = {
  /**
   * Obtiene o genera un ID de votante persistente en el navegador.
   * @returns {string}
   */
  getVoterId() {
    let voterId = localStorage.getItem(VOTER_ID_KEY)
    if (!voterId) {
      voterId = crypto.randomUUID()
      localStorage.setItem(VOTER_ID_KEY, voterId)
    }
    return voterId
  },

  /**
   * Obtiene los IDs de los reportes que el usuario ha votado localmente.
   * @returns {string[]}
   */
  getLocalVotes() {
    const saved = localStorage.getItem(VOTED_REPORTS_KEY)
    if (!saved) return []
    try {
      return JSON.parse(saved)
    } catch {
      return []
    }
  },

  /**
   * Guarda un ID de reporte en el historial local de votos.
   * @param {string} reportId 
   * @returns {string[]}
   */
  saveLocalVote(reportId) {
    const current = this.getLocalVotes()
    if (!current.includes(reportId)) {
      const updated = [...current, reportId]
      localStorage.setItem(VOTED_REPORTS_KEY, JSON.stringify(updated))
      return updated
    }
    return current
  },

  /**
   * Registra un voto de apoyo en Supabase (el trigger incrementa el contador de votos).
   * @param {string} reportId 
   * @param {string} voterId 
   * @returns {Promise<void>}
   */
  async registerVote(reportId, voterId) {
    const { error } = await supabase
      .from('votes')
      .insert([{ report_id: reportId, voter_id: voterId }])

    if (error) throw error
  }
}
