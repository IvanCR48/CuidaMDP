import React, { useEffect, useState } from 'react'
import { authService } from '../services/authService'
import { AuthContext } from './authContextInstance'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Obtener la sesión inicial
    authService.getSession()
      .then((activeSession) => {
        setSession(activeSession)
      })
      .catch((err) => {
        console.error('Error obteniendo sesión:', err)
      })
      .finally(() => {
        setLoading(false)
      })

    // 2. Suscribirse a cambios en la autenticación
    const subscription = authService.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email, password) => {
    const data = await authService.signIn(email, password)
    setSession(data.session)
    return data
  }

  const logout = async () => {
    await authService.signOut()
    setSession(null)
  }

  const value = {
    session,
    user: session?.user || null,
    isEmployee: !!session,
    loading,
    login,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
