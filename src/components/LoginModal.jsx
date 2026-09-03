import React, { useState } from 'react'
import { X, Lock, Mail, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function LoginModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const { login } = useAuth()

  if (!isOpen) return null

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await login(email, password)
      onClose() // Cerrar modal al loguearse con éxito
    } catch (err) {
      console.error('Error al iniciar sesión:', err)
      setError(err.message || 'Credenciales inválidas o error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="lightbox" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div 
        className="lightbox-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          width: '100%', 
          maxWidth: '400px', 
          background: 'var(--bg-card)', 
          padding: '30px', 
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-out)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={20} style={{ color: 'var(--primary)' }} />
            Ingreso Empleados
          </h3>
          <button type="button" className="close-btn" style={{ width: '30px', height: '30px' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="geolocation-indicator" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: 'var(--danger)', marginBottom: '16px' }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: '0.85rem' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                id="login-email"
                type="email"
                className="form-control"
                style={{ paddingLeft: '40px' }}
                placeholder="nombre@municipio.gov.ar"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                id="login-password"
                type="password"
                className="form-control"
                style={{ paddingLeft: '40px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            style={{ marginTop: '24px' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Verificando...</span>
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '16px' }}>
          Acceso exclusivo para personal de mantenimiento de General Pueyrredón.
        </p>
      </div>
    </div>
  )
}
