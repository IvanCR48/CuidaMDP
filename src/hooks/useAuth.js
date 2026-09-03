import { useContext } from 'react'
import { AuthContext } from '../context/authContextInstance'

/**
 * Hook para acceder al contexto global de autenticación de personal municipal.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider')
  }
  return context
}
