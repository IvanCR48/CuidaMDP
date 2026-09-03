import React, { useState } from 'react'
import { Search, SlidersHorizontal, ArrowUp, Calendar, MapPin } from 'lucide-react'
import { getCategoryIcon, getCategoryLabel } from '../constants/categories'
import { NEIGHBORHOODS } from '../constants/neighborhoods'
import { formatDate } from '../utils/formatters'

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
