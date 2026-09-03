import React, { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import MapComponent from './components/MapComponent'
import ReportForm from './components/ReportForm'
import ReportList from './components/ReportList'
import ReportDetail from './components/ReportDetail'
import LoginModal from './components/LoginModal'
import Dashboard from './components/Dashboard'
import { Map, List, AlertCircle } from 'lucide-react'
import { useReports } from './hooks/useReports'
import { useVotes } from './hooks/useVotes'

// Centrado inicial de Mar del Plata
const MDP_CENTER = [-38.005477, -57.542611]

export default function App() {
  const [activeTab, setActiveTab] = useState('map') // 'map' | 'list' | 'stats'
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [activeReport, setActiveReport] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [theme, setTheme] = useState('light')
  const [mapCenter, setMapCenter] = useState(MDP_CENTER)
  const [mobileDrawerCollapsed, setMobileDrawerCollapsed] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Capa de hooks de aplicación desacoplados
  const { reports, error, refetch: fetchReports, updateLocalReport, incrementLocalVotes } = useReports()
  const { votedReports, voteReport } = useVotes()

  // 1. Cargar preferencias locales de tema
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light'
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  // 2. Alternar tema
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
  }

  // 3. Manejar clic en el mapa para iniciar reporte
  const handleMapClick = (latlng) => {
    setActiveReport(null) // Cerrar detalles
    setSelectedLocation(latlng)
    setShowForm(true)
    setActiveTab('map') // Forzar tab de mapa para ver el pin
    setMobileDrawerCollapsed(false) // Expandir en mobile
  }

  // 4. Manejar selección de un reporte (pin del mapa o lista)
  const handleSelectReport = (report) => {
    setShowForm(false)
    setSelectedLocation(null)
    setActiveReport(report)
    setMapCenter([report.latitude, report.longitude])
    setMobileDrawerCollapsed(false) // Expandir en mobile
    
    if (window.innerWidth <= 768) {
      setActiveTab('map')
    }
  }

  // 5. Manejar voto de apoyo a un reporte
  const handleVoteReport = async (reportId) => {
    try {
      await voteReport(reportId)
      // Incremento optimista en el estado de reportes
      incrementLocalVotes(reportId)

      // Si el reporte activo es el votado, actualizar detalles activos
      if (activeReport && activeReport.id === reportId) {
        setActiveReport((prev) => ({ ...prev, votes_count: (prev.votes_count || 0) + 1 }))
      }
    } catch (err) {
      alert(err.message || 'No se pudo registrar tu apoyo. Intenta de nuevo.')
    }
  }

  // 6. Actualizar el estado del reporte una vez que cambia (ej: resuelto, en proceso)
  const handleStatusUpdated = (updatedReport) => {
    updateLocalReport(updatedReport)
    setActiveReport(updatedReport)
  }

  // Renderizar contenido del sidebar/drawer
  const renderSidebarContent = () => {
    if (showForm && selectedLocation) {
      return (
        <ReportForm
          location={selectedLocation}
          onCancel={() => {
            setShowForm(false)
            setSelectedLocation(null)
          }}
          onSubmitSuccess={() => {
            setShowForm(false)
            setSelectedLocation(null)
            fetchReports()
          }}
        />
      )
    }

    if (activeReport) {
      return (
        <ReportDetail
          report={activeReport}
          onBack={() => {
            setActiveReport(null)
            fetchReports()
          }}
          onVoteReport={handleVoteReport}
          votedReports={votedReports}
          onStatusUpdated={handleStatusUpdated}
        />
      )
    }

    // Basado en la pestaña seleccionada
    switch (activeTab) {
      case 'list':
        return (
          <div>
            <h3 style={{ marginBottom: '15px' }}>Reportes Ciudadanos</h3>
            <ReportList
              reports={reports}
              onSelectReport={handleSelectReport}
              selectedReportId={activeReport?.id}
              onVoteReport={handleVoteReport}
              votedReports={votedReports}
            />
          </div>
        )
      case 'stats':
        return <Dashboard reports={reports} />
      case 'map':
      default:
        return (
          <div style={{ textAlign: 'center', padding: '15px 0' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '8px' }}>¡Bienvenido a RobosMDP!</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
              Para reportar un problema, haz clic directamente en el mapa en el lugar correspondiente o presiona el botón de geolocalización.
            </p>
            <div className="geolocation-indicator" style={{ display: 'inline-flex', width: 'auto' }}>
              <AlertCircle size={16} />
              <span>Haz clic en el mapa para colocar un pin</span>
            </div>
            <button 
              className="btn btn-outline btn-block mt-4" 
              onClick={() => setActiveTab('list')}
            >
              <List size={16} style={{ marginRight: '6px' }} />
              Ver lista de reportes
            </button>
          </div>
        )
    }
  }

  const sidebarClassName = `sidebar ${mobileDrawerCollapsed ? 'collapsed' : ''}`

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab)
          setActiveReport(null)
          setShowForm(false)
          setSelectedLocation(null)
        }}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenLogin={() => setShowLoginModal(true)}
      />

      <div className={`main-content mobile-tab-${activeTab} ${activeReport || showForm ? 'has-panel' : ''}`}>
        <MapComponent
          reports={reports}
          onMapClick={handleMapClick}
          selectedLocation={selectedLocation}
          onSelectReport={handleSelectReport}
          mapCenter={mapCenter}
        />

        <div className={sidebarClassName}>
          <div 
            className="drawer-handle" 
            onClick={() => setMobileDrawerCollapsed(!mobileDrawerCollapsed)}
          ></div>
          
          <div className="sidebar-header">
            {(activeReport || showForm) && (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)' }}>
                {showForm ? 'Formulario de Reporte' : 'Información del Reporte'}
              </span>
            )}
            
            {!activeReport && !showForm && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {activeTab === 'map' && 'Mapa General'}
                  {activeTab === 'list' && 'Reportes Recientes'}
                  {activeTab === 'stats' && 'Dashboard de Estadísticas'}
                </span>
              </div>
            )}
          </div>

          <div className="sidebar-scrollable">
            {error && (
              <div className="geolocation-indicator" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.25)', marginBottom: '14px' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.78rem' }}>
                  <strong>Error de conexión con Supabase:</strong> Revisa si tu proyecto está pausado en el dashboard o si la URL en <code>.env</code> es correcta.
                </div>
              </div>
            )}
            {renderSidebarContent()}
          </div>
        </div>

        <button
          className="mobile-view-toggle"
          onClick={() => {
            if (activeTab === 'map') {
              setActiveTab('list')
            } else {
              setActiveTab('map')
              setActiveReport(null)
              setShowForm(false)
            }
          }}
        >
          {activeTab === 'map' ? (
            <>
              <List size={18} />
              <span>Ver Lista</span>
            </>
          ) : (
            <>
              <Map size={18} />
              <span>Ver Mapa</span>
            </>
          )}
        </button>
      </div>

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
  )
}
