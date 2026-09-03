/**
 * Formatea una cadena de fecha a formato localizado en español de Argentina.
 * @param {string|Date} dateString 
 * @param {Intl.DateTimeFormatOptions} [customOptions]
 * @returns {string}
 */
export const formatDate = (dateString, customOptions) => {
  if (!dateString) return ''
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
  const options = customOptions || defaultOptions
  return new Date(dateString).toLocaleDateString('es-AR', options)
}

/**
 * Formatea fecha y hora completa.
 * @param {string|Date} dateString 
 * @returns {string}
 */
export const formatDateTime = (dateString) => {
  return formatDate(dateString, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
