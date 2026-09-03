import React, { useState } from 'react'
import { ArrowLeft, ArrowUp, Calendar, MapPin, CheckCircle, Image as ImageIcon, Loader2, X, AlertTriangle, ShieldCheck, ShieldAlert, Trash2, Ban } from 'lucide-react'
import { getCategoryIcon, getCategoryLabel } from '../constants/categories'
import { formatDate } from '../utils/formatters'
import { compressImage } from '../utils/imageCompressor'
import { reportsService } from '../services/reportsService'
import { storageService } from '../services/storageService'
import { moderationService } from '../services/moderationService'
import { useAuth } from '../hooks/useAuth'

export default function ReportDetail({ 
  report, 
  onBack, 
  onVoteReport, 
  votedReports, 
  onStatusUpdated 
}) {
  const { isEmployee } = useAuth()
  const [showResolveForm, setShowResolveForm] = useState(false)
  const [resolveImage, setResolveImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lightboxImage, setLightboxImage] = useState(null)

  const hasVoted = votedReports.includes(report.id)

  // Manejar cambio de imagen de resolución
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setResolveImage(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result)
    }
    reader.readAsDataURL(file)
  }

  // Guardar resolución del problema
  const handleResolve = async (e) => {
    e.preventDefault()
    if (!resolveImage) {
      setError('Por favor, selecciona una foto de prueba.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Comprimir imagen en el cliente antes de subir
      const compressedImage = await compressImage(resolveImage, { maxWidth: 1600, quality: 0.8 })

      // 2. Subir la imagen de prueba al bucket
      const publicUrl = await storageService.uploadResolutionPhoto(compressedImage)

      // 3. Actualizar el registro en la base de datos
      const resolvedAt = new Date().toISOString()
      const updated = await reportsService.updateReportStatus(report.id, 'resolved', {
        resolved_image: publicUrl,
        resolved_at: resolvedAt
      })

      // Actualizar vista local
      onStatusUpdated({
        ...report,
        ...updated,
        status: 'resolved',
        resolved_image: publicUrl,
        resolved_at: resolvedAt
      })
      
      setShowResolveForm(false)
      setResolveImage(null)
      setPreviewUrl(null)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Error al resolver el reporte.')
    } finally {
      setLoading(false)
    }
  }

  // Cambiar estado a "En Proceso"
  const handleSetInProgress = async () => {
    setLoading(true)
    try {
      const updated = await reportsService.updateReportStatus(report.id, 'in_progress')

      onStatusUpdated({
        ...report,
        ...updated,
        status: 'in_progress'
      })
    } catch (err) {
      alert('Error actualizando estado: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Moderación: Eliminar reporte
  const handleDeleteReport = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este reporte definitivamente? Esta acción no se puede deshacer.')) {
      return
    }

    setLoading(true)
    try {
      await reportsService.deleteReport(report.id)
      alert('Reporte eliminado con éxito.')
      onBack() // Regresa al listado
    } catch (err) {
      console.error('Error eliminando reporte:', err)
      alert('Error al eliminar el reporte: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Moderación: Banear IP
  const handleBanIp = async () => {
    if (!report.ip_address) {
      alert('No hay una dirección IP registrada para este reporte.')
      return
    }

    const reason = window.prompt(`¿Deseas bloquear la IP ${report.ip_address}? Ingresa el motivo:`, 'Spam / Reporte falso recurrente')
    if (reason === null) return // Cancelado por el usuario

    setLoading(true)
    try {
      await moderationService.banIp(report.ip_address, reason)
      alert(`La dirección IP ${report.ip_address} ha sido bloqueada. El usuario no podrá enviar más reportes.`)
    } catch (err) {
      console.error('Error al bloquear IP:', err)
      alert('Error al bloquear la IP: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="report-detail-container">
      <button className="detail-back-btn" onClick={onBack}>
        <ArrowLeft size={16} />
        Volver al listado
      </button>

      <div className="detail-header">
        <div className="detail-category-row">
          <span className="detail-category">
            {getCategoryIcon(report.category, 24)}
            {getCategoryLabel(report.category)}
          </span>
          <span className={`badge badge-${report.status}`}>
            {report.status === 'pending' && 'Pendiente'}
            {report.status === 'in_progress' && 'En proceso'}
            {report.status === 'resolved' && 'Resuelto'}
          </span>
        </div>
        
        <div className="detail-meta">
          <span className="detail-meta-item">
            <MapPin size={14} />
            <strong>{report.address}</strong>
          </span>
          <span className="detail-meta-item">
            <Calendar size={14} />
            <span>Reportado el {formatDate(report.created_at)}</span>
          </span>
          <span className="detail-meta-item">
            <ShieldCheck size={14} />
            <span>Barrio: {report.neighborhood}</span>
          </span>
        </div>
      </div>

      <div className="detail-section">
        <h4 className="detail-section-title">Descripción del Vecino</h4>
        <p className="detail-description">{report.description}</p>
      </div>

      {/* Fotos originales del reporte */}
      {report.images && report.images.length > 0 && (
        <div className="detail-section">
          <h4 className="detail-section-title">Fotos del Problema</h4>
          <div className="detail-photos-grid">
            {report.images.map((img, idx) => (
              <div key={idx} className="detail-photo-wrapper" onClick={() => setLightboxImage(img)}>
                <img src={img} alt={`reporte-${idx}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado: Resuelto - Mostrar prueba de resolución */}
      {report.status === 'resolved' && (
        <div className="resolve-panel" style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>
          <div className="resolve-panel-title">
            <CheckCircle size={18} />
            <span>¡PROBLEMA RESUELTO!</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Este reporte fue marcado como resuelto el <strong>{formatDate(report.resolved_at)}</strong>.
          </p>
          {report.resolved_image && (
            <div>
              <span className="detail-section-title">Prueba de la comunidad</span>
              <div 
                className="detail-photo-wrapper" 
                style={{ maxWidth: '200px', marginTop: '6px' }}
                onClick={() => setLightboxImage(report.resolved_image)}
              >
                <img src={report.resolved_image} alt="Prueba de resolución" />
                <span className="resolved-proof-badge">Resuelto</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Acciones del Ciudadano (Votar / Apoyar) si no está resuelto */}
      {report.status !== 'resolved' && (
        <div className="detail-actions">
          <button
            type="button"
            className={`btn ${hasVoted ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1 }}
            onClick={() => onVoteReport(report.id)}
            disabled={loading}
          >
            <ArrowUp size={16} />
            <span>{hasVoted ? 'Apoyado' : 'Apoyar'} ({report.votes_count})</span>
          </button>

          {isEmployee && report.status === 'pending' && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSetInProgress}
              disabled={loading}
            >
              <span>En Proceso</span>
            </button>
          )}

          {isEmployee && (
            <button
              type="button"
              className="btn btn-success"
              onClick={() => setShowResolveForm(!showResolveForm)}
              disabled={loading}
            >
              <span>Resolver</span>
            </button>
          )}
        </div>
      )}

      {/* PANEL DE MODERACIÓN (Exclusivo para Empleados) */}
      {isEmployee && (
        <div className="resolve-panel" style={{ marginTop: '24px', backgroundColor: 'rgba(96, 165, 250, 0.05)', border: '1px dashed var(--primary)' }}>
          <div className="resolve-panel-title" style={{ color: 'var(--primary)' }}>
            <ShieldAlert size={18} />
            <span>Panel de Moderación Municipal</span>
          </div>
          
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            <p><strong>IP del reporte:</strong> {report.ip_address || 'No registrada'}</p>
            <p><strong>ID Cliente:</strong> <span style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{report.client_id || 'No registrado'}</span></p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ flex: 1, borderColor: 'var(--danger)', color: 'var(--danger)', display: 'flex', gap: '6px', justifyContent: 'center' }}
              onClick={handleDeleteReport}
              disabled={loading}
            >
              <Trash2 size={14} />
              <span>Eliminar</span>
            </button>

            {report.ip_address && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ flex: 1, borderColor: 'var(--warning)', color: 'var(--warning)', display: 'flex', gap: '6px', justifyContent: 'center' }}
                onClick={handleBanIp}
                disabled={loading}
              >
                <Ban size={14} />
                <span>Banear IP</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Formulario para Resolver el Reporte */}
      {showResolveForm && report.status !== 'resolved' && (
        <div className="resolve-panel">
          <div className="resolve-panel-title">
            <CheckCircle size={16} />
            <span>Marcar como Resuelto</span>
          </div>
          
          {error && (
            <div className="geolocation-indicator" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: 'var(--danger)', marginBottom: '10px' }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleResolve}>
            <div className="form-group">
              <label className="form-label">Subir foto de prueba *</label>
              <div className="file-upload-wrapper" style={{ padding: '12px 10px' }}>
                <input
                  type="file"
                  className="file-upload-input"
                  accept="image/*"
                  onChange={handleImageChange}
                  required
                />
                <div className="file-upload-content" style={{ gap: '4px' }}>
                  <ImageIcon className="file-upload-icon" style={{ width: '24px', height: '24px' }} />
                  <span style={{ fontSize: '0.8rem' }}>Cargar foto del problema solucionado</span>
                </div>
              </div>

              {previewUrl && (
                <div className="image-previews" style={{ marginTop: '8px' }}>
                  <div className="image-preview-item" style={{ width: '80px', height: '80px' }}>
                    <img src={previewUrl} alt="preview resolución" />
                    <button
                      type="button"
                      className="image-preview-remove"
                      onClick={() => {
                        setResolveImage(null)
                        setPreviewUrl(null)
                      }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowResolveForm(false)
                  setResolveImage(null)
                  setPreviewUrl(null)
                }}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-success btn-sm"
                style={{ flex: 2 }}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" style={{ marginRight: '6px' }} />
                ) : (
                  'Confirmar Solución'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lightbox para ver fotos a tamaño completo */}
      {lightboxImage && (
        <div className="lightbox" onClick={() => setLightboxImage(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightboxImage(null)}>
              <X size={24} />
            </button>
            <img src={lightboxImage} alt="Foto ampliada" />
          </div>
        </div>
      )}
    </div>
  )
}
