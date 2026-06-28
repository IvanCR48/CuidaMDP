import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Navbar from './components/Navbar'
import MapComponent from './components/MapComponent'
import ReportForm from './components/ReportForm'
import ReportList from './components/ReportList'
import ReportDetail from './components/ReportDetail'
import LoginModal from './components/LoginModal'
import Dashboard from './components/Dashboard'
import { Map, List, BarChart3, AlertCircle } from 'lucide-react'

// Centrado inicial de Mar del Plata
const MDP_CENTER = [-38.005477, -57.542611]

export default function App() {
  const [activeTab, setActiveTab] = useState('map') // 'map' | 'list' | 'stats'
  const [reports, setReports] = useState([])
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [activeReport, setActiveReport] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [votedReports, setVotedReports] = useState([])
  const [theme, setTheme] = useState('light')
  const [mapCenter, setMapCenter] = useState(MDP_CENTER)
  const [mobileDrawerCollapsed, setMobileDrawerCollapsed] = useState(false)

  // Estados de autenticación de empleado
  const [employeeSession, setEmployeeSession] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // 1. Cargar preferencias locales y configurar tema, ID de votante y sesión de Supabase
  useEffect(() => {
    // Cargar votos del local storage
    const savedVotes = localStorage.getItem('voted_reports')
    if (savedVotes) {
      try {
        setVotedReports(JSON.parse(savedVotes))
      } catch (e) {
        console.error('Error cargando votos locales:', e)
      }
    }

    // Configurar tema
    const savedTheme = localStorage.getItem('theme') || 'light'
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)

    // Crear voter_id si no existe
    let voterId = localStorage.getItem('voter_id')
    if (!voterId) {
      voterId = crypto.randomUUID()
      localStorage.setItem('voter_id', voterId)
    }

    // Obtener sesión activa de Supabase para empleados
    supabase.auth.getSession().then(({ data: { session } }) => {
      setEmployeeSession(session)
    })

    // Escuchar cambios de estado en la autenticación (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmployeeSession(session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // 2. Cargar reportes desde Supabase
  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setReports(data || [])
    } catch (err) {
      console.error('Error cargando reportes:', err.message)
    }
  }

  useEffect(() => {
    fetchReports()
    
    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        (payload) => {
          // Recargar todos los reportes para mantener estados correctos
          fetchReports()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // 3. Cambiar tema
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
  }

  // 4. Manejar clic en el mapa para iniciar reporte
  const handleMapClick = (latlng) => {
    setActiveReport(null) // Cerrar detalles
    setSelectedLocation(latlng)
    setShowForm(true)
    setActiveTab('map') // Forzar tab de mapa para ver el pin
    setMobileDrawerCollapsed(false) // Expandir en mobile
  }

  // 5. Manejar selección de un reporte (pin del mapa o lista)
  const handleSelectReport = (report) => {
    setShowForm(false)
    setSelectedLocation(null)
    setActiveReport(report)
    setMapCenter([report.latitude, report.longitude])
    setMobileDrawerCollapsed(false) // Expandir en mobile
    
    // Si estamos en la pestaña estadísticas o lista, en mobile queremos mostrar el mapa
    // para ver el pin y los detalles del reporte flotando encima
    if (window.innerWidth <= 768) {
      setActiveTab('map')
    }
  }

  // 6. Manejar voto de apoyo a un reporte
  const handleVoteReport = async (reportId) => {
    if (votedReports.includes(reportId)) {
      alert('Ya apoyaste este reporte.')
      return
    }

    const voterId = localStorage.getItem('voter_id')
    
    try {
      // Registrar el voto en Supabase (el trigger incrementa el contador automáticamente)
      const { error } = await supabase
        .from('votes')
        .insert([{ report_id: reportId, voter_id: voterId }])

      if (error) {
        if (error.code === '23505') {
          alert('Ya apoyaste este reporte.')
        } else {
          throw error
        }
        return
      }

      // Actualizar estado local de votos
      const nextVotes = [...votedReports, reportId]
      setVotedReports(nextVotes)
      localStorage.setItem('voted_reports', JSON.stringify(nextVotes))

      // Incrementar contador localmente rápido
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, votes_count: r.votes_count + 1 } : r))
      )
      
      // Si el reporte activo es el votado, actualizar detalles activos
      if (activeReport && activeReport.id === reportId) {
        setActiveReport((prev) => ({ ...prev, votes_count: prev.votes_count + 1 }))
      }
    } catch (err) {
      console.error('Error votando:', err.message)
      alert('No se pudo registrar tu apoyo. Intenta de nuevo.')
    }
  }

  // 7. Actualizar el estado del reporte una vez que cambia (ej: resuelto, eliminado)
  const handleStatusUpdated = (updatedReport) => {
    setReports((prev) =>
      prev.map((r) => (r.id === updatedReport.id ? updatedReport : r))
    )
    setActiveReport(updatedReport)
  }

  // Determinar si debemos renderizar el panel lateral (sidebar) en escritorio o drawer en móvil
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
            fetchReports() // Recargar por si se eliminó o actualizó
          }}
          onVoteReport={handleVoteReport}
          votedReports={votedReports}
          onStatusUpdated={handleStatusUpdated}
          employeeSession={employeeSession}
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
            <h3 style={{ color: 'var(--primary)', marginBottom: '8px' }}>¡Bienvenido a CuidaMDP!</h3>
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
          setActiveReport(null) // Limpiar reporte activo al navegar
          setShowForm(false)    // Limpiar formulario al navegar
          setSelectedLocation(null)
        }}
        theme={theme}
        toggleTheme={toggleTheme}
        employeeSession={employeeSession}
        onOpenLogin={() => setShowLoginModal(true)}
      />

      <div className={`main-content mobile-tab-${activeTab} ${activeReport || showForm ? 'has-panel' : ''}`}>
        {/* Renderiza siempre el mapa en el fondo o pantalla completa */}
        <MapComponent
          reports={reports}
          onMapClick={handleMapClick}
          selectedLocation={selectedLocation}
          onSelectReport={handleSelectReport}
          activeReport={activeReport}
          mapCenter={mapCenter}
        />

        {/* Panel lateral / Drawer móvil */}
        <div className={sidebarClassName}>
          {/* Manija táctil para móvil */}
          <div 
            className="drawer-handle" 
            onClick={() => setMobileDrawerCollapsed(!mobileDrawerCollapsed)}
          ></div>
          
          <div className="sidebar-header">
            {/* Si hay un reporte activo o formulario, muestra tipo de panel */}
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
            {renderSidebarContent()}
          </div>
        </div>

        {/* Botón flotante rápido para alternar vistas en dispositivos móviles */}
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

      {/* Modal de inicio de sesión de Empleado */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
  )
}
