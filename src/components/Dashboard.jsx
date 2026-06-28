import React, { useMemo } from 'react'
import { getCategoryIcon } from './ReportList'
import { BarChart3, PieChart, TrendingUp, CheckCircle, Clock, AlertTriangle, Star } from 'lucide-react'

export default function Dashboard({ reports }) {
  // 1. Calcular KPIs (Indicadores Clave)
  const stats = useMemo(() => {
    const total = reports.length
    const resolved = reports.filter((r) => r.status === 'resolved').length
    const inProgress = reports.filter((r) => r.status === 'in_progress').length
    const pending = reports.filter((r) => r.status === 'pending').length

    const pctResolved = total > 0 ? Math.round((resolved / total) * 100) : 0

    // Encontrar reporte más apoyado
    let mostSupported = null
    if (total > 0) {
      mostSupported = [...reports].sort((a, b) => b.votes_count - a.votes_count)[0]
    }

    return { total, resolved, inProgress, pending, pctResolved, mostSupported }
  }, [reports])

  // 2. Agrupar datos por Barrio (Top 5 barrios con más reportes)
  const neighborhoodData = useMemo(() => {
    const counts = {}
    reports.forEach((r) => {
      counts[r.neighborhood] = (counts[r.neighborhood] || 0) + 1
    })

    // Convertir a array y ordenar
    const sorted = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    // Encontrar el valor máximo para calcular los anchos porcentuales de las barras
    const maxVal = sorted.length > 0 ? sorted[0].count : 1

    return sorted.slice(0, 5).map((item) => ({
      ...item,
      percentage: Math.round((item.count / maxVal) * 100)
    }))
  }, [reports])

  // 3. Agrupar datos por Categoría
  const categoryData = useMemo(() => {
    const counts = {
      calles: 0,
      alumbrado: 0,
      limpieza: 0,
      veredas: 0,
      pluviales: 0,
      otro: 0
    }

    reports.forEach((r) => {
      if (counts[r.category] !== undefined) {
        counts[r.category]++
      } else {
        counts.otro++
      }
    })

    const total = reports.length || 1

    return Object.entries(counts)
      .map(([key, count]) => {
        let label = 'Otro'
        let color = '#a855f7'
        if (key === 'calles') { label = 'Calles / Baches'; color = '#6b7280'; }
        if (key === 'alumbrado') { label = 'Luminarias'; color = '#eab308'; }
        if (key === 'limpieza') { label = 'Limpieza'; color = '#22c55e'; }
        if (key === 'veredas') { label = 'Veredas rotas'; color = '#f97316'; }
        if (key === 'pluviales') { label = 'Pluviales'; color = '#3b82f6'; }

        return {
          key,
          label,
          count,
          color,
          percentage: Math.round((count / total) * 100)
        }
      })
      .sort((a, b) => b.count - a.count)
  }, [reports])

  return (
    <div className="dashboard-container">
      <div className="stats-header">
        <h3>Estadísticas de la Ciudad</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Resumen en tiempo real del estado de los reportes en General Pueyrredón.
        </p>
      </div>

      {/* Grid de KPIs */}
      <div className="stats-grid">
        <div className="stat-box">
          <div className="stat-icon">
            <BarChart3 size={20} />
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Reportes Totales</div>
        </div>

        <div className="stat-box success-box">
          <div className="stat-icon">
            <CheckCircle size={20} />
          </div>
          <div className="stat-value">{stats.pctResolved}%</div>
          <div className="stat-label">Resueltos ({stats.resolved})</div>
        </div>
      </div>

      {/* Distribución por Estado */}
      <div className="chart-container">
        <div className="chart-title">
          <TrendingUp size={16} />
          <span>Distribución de Estados</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-around', padding: '10px 0' }}>
          <div className="text-center" style={{ flex: 1 }}>
            <div style={{ color: 'var(--danger)', fontWeight: 800, fontSize: '1.2rem' }}>{stats.pending}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <AlertTriangle size={10} /> Pendientes
            </div>
          </div>
          <div className="text-center" style={{ flex: 1, borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
            <div style={{ color: 'var(--warning)', fontWeight: 800, fontSize: '1.2rem' }}>{stats.inProgress}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Clock size={10} /> En Proceso
            </div>
          </div>
          <div className="text-center" style={{ flex: 1 }}>
            <div style={{ color: 'var(--success)', fontWeight: 800, fontSize: '1.2rem' }}>{stats.resolved}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <CheckCircle size={10} /> Resueltos
            </div>
          </div>
        </div>
      </div>

      {/* Reportes por Barrio */}
      <div className="chart-container">
        <div className="chart-title">
          <BarChart3 size={16} />
          <span>Barrios con Más Reportes</span>
        </div>

        {neighborhoodData.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '10px' }}>
            No hay suficientes datos.
          </p>
        ) : (
          <div className="bar-chart">
            {neighborhoodData.map((item, idx) => (
              <div key={idx} className="bar-row">
                <div className="bar-label" title={item.name}>{item.name}</div>
                <div className="bar-wrapper">
                  <div 
                    className="bar-fill" 
                    style={{ 
                      width: `${item.percentage}%`,
                      backgroundColor: idx === 0 ? 'var(--primary)' : 'var(--text-muted)' 
                    }}
                  ></div>
                </div>
                <div className="bar-value">{item.count}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Problemas por Categoría */}
      <div className="chart-container">
        <div className="chart-title">
          <PieChart size={16} />
          <span>Categorías Más Reportadas</span>
        </div>

        {reports.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '10px' }}>
            Aún no se crearon reportes.
          </p>
        ) : (
          <div className="pie-legend">
            {categoryData.map((item) => (
              <div key={item.key} className="legend-item">
                <div className="legend-left">
                  <div className="legend-dot" style={{ backgroundColor: item.color }}></div>
                  <span className="legend-name">{item.label}</span>
                </div>
                <div>
                  <span className="legend-count">{item.count}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginLeft: '6px' }}>
                    ({item.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reporte Destacado / Más Apoyado */}
      {stats.mostSupported && stats.mostSupported.votes_count > 0 && (
        <div className="chart-container" style={{ border: '1px dashed var(--primary)', backgroundColor: 'rgba(59, 130, 246, 0.03)' }}>
          <div className="chart-title" style={{ color: 'var(--primary-hover)' }}>
            <Star size={16} fill="var(--primary)" />
            <span>Reporte con Más Apoyo</span>
          </div>
          <div style={{ fontSize: '0.85rem' }}>
            <p style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
              {getCategoryIcon(stats.mostSupported.category, 14)} {stats.mostSupported.category} en {stats.mostSupported.neighborhood}
            </p>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              "{stats.mostSupported.description}"
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold' }}>
              Tiene {stats.mostSupported.votes_count} apoyos de los vecinos
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
