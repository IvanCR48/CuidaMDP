import React from 'react'
import { MapPin, List, BarChart3, Sun, Moon, Shield, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  theme, 
  toggleTheme, 
  onOpenLogin 
}) {
  const { isEmployee, user, logout } = useAuth()
  
  const handleLogout = async () => {
    if (window.confirm('¿Deseas cerrar tu sesión de empleado?')) {
      try {
        await logout()
      } catch (error) {
        console.error('Error cerrando sesión:', error)
      }
    }
  }

  return (
    <nav className="navbar">
      <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img 
          src="/logo.jpg" 
          alt="RobosMDP Logo" 
          style={{ 
            width: '38px', 
            height: '38px', 
            borderRadius: '50%', 
            objectFit: 'cover',
            border: '2px solid var(--border-color)',
            boxShadow: 'var(--shadow-btn-hover)'
          }} 
        />
        <span>Robos<strong>MDP</strong></span>
      </div>

      <div className="nav-tabs">
        <button
          className={`nav-tab-btn ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          <MapPin size={18} />
          Mapa
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <List size={18} />
          Reportes
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <BarChart3 size={18} />
          Estadísticas
        </button>
      </div>

      <div className="nav-actions">
        {/* Cambiar Tema */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
          aria-label="Cambiar tema de color"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Control de Acceso Empleados */}
        {isEmployee ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} title={`Sesión activa: ${user?.email}`}>
            <span style={{ 
              fontSize: '0.8rem', 
              color: 'var(--success)', 
              fontWeight: '700', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              padding: '6px 12px',
              background: 'var(--bg-app)',
              boxShadow: 'var(--shadow-in)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <Shield size={14} fill="var(--success)" />
              Muni
            </span>
            <button
              onClick={handleLogout}
              className="theme-toggle-btn"
              title="Cerrar Sesión de Empleado"
              aria-label="Cerrar sesión"
              style={{ color: 'var(--danger)' }}
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="theme-toggle-btn"
            title="Ingreso Empleados (Mantenimiento)"
            aria-label="Iniciar sesión como empleado"
          >
            <Shield size={18} />
          </button>
        )}
      </div>
    </nav>
  )
}
