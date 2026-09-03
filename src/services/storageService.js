import { supabase } from '../supabaseClient'

const BUCKET_NAME = 'report-photos'

/**
 * Servicio de almacenamiento multimedia en Supabase Storage.
 */
export const storageService = {
  /**
   * Sube una foto de reporte al bucket.
   * @param {File} file 
   * @returns {Promise<string>} URL pública de la imagen
   */
  async uploadReportPhoto(file) {
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const filePath = `reports/${fileName}`

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file)

    if (error) throw new Error(`Error al subir imagen: ${error.message}`)

    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    return data.publicUrl
  },

  /**
   * Sube una foto de prueba de resolución al bucket.
   * @param {File} file 
   * @returns {Promise<string>} URL pública de la imagen
   */
  async uploadResolutionPhoto(file) {
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const filePath = `resolutions/${fileName}`

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file)

    if (error) throw new Error(`Error subiendo foto de prueba: ${error.message}`)

    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    return data.publicUrl
  }
}
