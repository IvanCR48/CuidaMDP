import React, { useState } from 'react'
import { Search, SlidersHorizontal, AlertTriangle, Lightbulb, Trash2, Footprints, Droplets, HelpCircle, ArrowUp, Calendar, MapPin } from 'lucide-react'

// Iconos por categoría
export const getCategoryIcon = (category, size = 18) => {
  switch (category) {
    case 'calles':
      return <AlertTriangle size={size} style={{ color: 'var(--text-muted)' }} />
    case 'alumbrado':
      return <Lightbulb size={size} style={{ color: '#eab308' }} />
    case 'limpieza':
      return <Trash2 size={size} style={{ color: '#22c55e' }} />
    case 'veredas':
      return <Footprints size={size} style={{ color: '#f97316' }} />
    case 'pluviales':
      return <Droplets size={size} style={{ color: '#3b82f6' }} />
    default:
      return <HelpCircle size={size} style={{ color: '#a855f7' }} />
  }
}

const NEIGHBORHOODS = [
  'Centro',
  'Stella Maris / Los Troncos',
  'Playa Grande / Alem',
  'La Perla / Constitución',
  'Puerto / Colinas de Peralta Ramos',
  'Punta Mogotes',
  'Chauvín / San José',
  'Caisamar / Grosellar',
  'Pompeya / Estación',
  'Batán',
  'Sierra de los Padres',
  'Parque Camet / Las Dalias',
  'Plaza Mitre',
  'Constitución',
  'Florencia Varela / Aeropuerto',
  'Alfar / Playas del Sur',
  'Otro'
].sort()

export default function ReportList({ reports, onSelectReport, selectedReportId, onVoteReport, votedReports }) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Filtrado de reportes
  const filteredReports = reports.filter((report) => {
    const matchesSearch = 
      report.description.toLowerCase().includes(search.toLowerCase()) ||
      report.address.toLowerCase().includes(search.toLowerCase())
      
    const matchesCategory = categoryFilter === '' || report.category === categoryFilter
    const matchesNeighborhood = neighborhoodFilter === '' || report.neighborhood === neighborhoodFilter
    const matchesStatus = statusFilter === '' || report.status === statusFilter

    return matchesSearch && matchesCategory && matchesNeighborhood && matchesStatus
  })

  // Traducir categoría para mostrar
  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'calles': return 'Calles / Baches'
      case 'alumbrado': return 'Luminarias'
      case 'limpieza': return 'Limpieza / Basura'
      case 'veredas': return 'Veredas rotas'
      case 'pluviales': return 'Pluviales'
      default: return 'Otros'
    }
  }

  // Formatear fecha
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' }
    return new Date(dateString).toLocaleDateString('es-AR', options)
  }

  return (
    <div className="report-list-container">
      <div className="filters-section">
        <div className="search-bar-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            className="form-control search-input"
            placeholder="Buscar por palabra o dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-selectors">
          <select
            className="form-control"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <option value="">Todas las Categorías</option>
            <option value="calles">Baches / Calles</option>
            <option value="alumbrado">Luminarias</option>
            <option value="limpieza">Limpieza / Basura</option>
            <option value="veredas">Veredas rotas</option>
            <option value="pluviales">Pluviales</option>
            <option value="otro">Otros</option>
          </select>

          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <option value="">Todos los Estados</option>
            <option value="pending">Pendiente</option>
            <option value="in_progress">En Proceso</option>
            <option value="resolved">Resuelto</option>
          </select>
        </div>

        <select
          className="form-control"
          value={neighborhoodFilter}
          onChange={(e) => setNeighborhoodFilter(e.target.value)}
          style={{ padding: '8px 12px', fontSize: '0.85rem' }}
        >
          <option value="">Todos los Barrios</option>
          {NEIGHBORHOODS.map((barrio) => (
            <option key={barrio} value={barrio}>{barrio}</option>
          ))}
        </select>
      </div>

      <div className="report-cards-list">
        {filteredReports.length === 0 ? (
          <div className="no-reports">
            <SlidersHorizontal size={36} />
            <p>No se encontraron reportes con los filtros seleccionados.</p>
          </div>
        ) : (
          filteredReports.map((report) => {
            const hasVoted = votedReports.includes(report.id)
            return (
              <div
                key={report.id}
                className={`report-card ${selectedReportId === report.id ? 'selected' : ''}`}
                onClick={() => onSelectReport(report)}
              >
                <div className="report-card-top">
                  <span className="report-card-category">
                    {getCategoryIcon(report.category)}
                    {getCategoryLabel(report.category)}
                  </span>
                  <span className={`badge badge-${report.status}`}>
                    {report.status === 'pending' && 'Pendiente'}
                    {report.status === 'in_progress' && 'En proceso'}
                    {report.status === 'resolved' && 'Resuelto'}
                  </span>
                </div>

                <div className="report-card-description">
                  {report.description}
                </div>

                <div className="report-card-address">
                  <MapPin size={12} />
                  <span>{report.address} ({report.neighborhood})</span>
                </div>

                <div className="report-card-bottom">
                  <span className="report-card-date">
                    <Calendar size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    {formatDate(report.created_at)}
                  </span>
                  
                  <button
                    type="button"
                    className={`vote-action-btn ${hasVoted ? 'voted' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation() // Evitar seleccionar la tarjeta al hacer clic en el botón de voto
                      onVoteReport(report.id)
                    }}
                  >
                    <ArrowUp size={14} />
                    <span>{report.votes_count} apoyos</span>
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
