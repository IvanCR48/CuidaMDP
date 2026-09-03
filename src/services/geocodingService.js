import { NEIGHBORHOODS } from '../constants/neighborhoods'

/**
 * Servicio para geocodificación inversa y servicios de red.
 */
export const geocodingService = {
  /**
   * Obtiene la dirección aproximada y barrio a partir de coordenadas GPS.
   * @param {number} lat 
   * @param {number} lng 
   * @returns {Promise<{ address: string, neighborhood: string }>}
   */
  async reverseGeocode(lat, lng) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`
      )
      if (!response.ok) throw new Error('Error al conectar con el servicio de geocodificación')

      const data = await response.json()
      if (!data || !data.address) {
        return { address: '', neighborhood: 'Otro' }
      }

      const road = data.address.road || ''
      const houseNumber = data.address.house_number || ''
      const suburb = data.address.suburb || data.address.neighbourhood || ''

      const approxAddress = road
        ? `${road}${houseNumber ? ' ' + houseNumber : ''}`
        : (data.display_name ? data.display_name.split(',').slice(0, 2).join(',') : '')

      // Intentar coincidir con el listado oficial de barrios
      let matchedNeighborhood = 'Otro'
      if (suburb) {
        const found = NEIGHBORHOODS.find((b) =>
          b.toLowerCase().includes(suburb.toLowerCase()) ||
          suburb.toLowerCase().includes(b.toLowerCase())
        )
        if (found) {
          matchedNeighborhood = found
        }
      }

      return {
        address: approxAddress,
        neighborhood: matchedNeighborhood
      }
    } catch (error) {
      console.warn('Geocoding falló o fue bloqueado:', error)
      return { address: '', neighborhood: 'Otro' }
    }
  },

  /**
   * Obtiene la IP pública del cliente para el control de tasa / spam.
   * @returns {Promise<string>}
   */
  async getClientIp() {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      if (!response.ok) throw new Error('Error en ipify')
      const data = await response.json()
      return data.ip || '127.0.0.1'
    } catch (error) {
      console.warn('No se pudo determinar la IP del cliente:', error)
      return '127.0.0.1'
    }
  }
}
