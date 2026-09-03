import { useState, useEffect, useCallback } from 'react'
import { reportsService } from '../services/reportsService'

/**
 * Hook de aplicación para gestión y sincronización reactiva de reportes.
 */
export function useReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Carga inicial o manual de reportes
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reportsService.fetchReports()
      setReports(data)
    } catch (err) {
      console.error('Error cargando reportes:', err)
      setError(err.message || 'Error al cargar los reportes')
    } finally {
      setLoading(false)
    }
  }, [])

  // Actualización optimista de un reporte individual en el estado local
  const updateLocalReport = useCallback((updatedReport) => {
    setReports((prev) =>
      prev.map((r) => (r.id === updatedReport.id ? { ...r, ...updatedReport } : r))
    )
  }, [])

  // Eliminación optimista de un reporte en el estado local
  const removeLocalReport = useCallback((reportId) => {
    setReports((prev) => prev.filter((r) => r.id !== reportId))
  }, [])

  // Incrementar votos en el estado local
  const incrementLocalVotes = useCallback((reportId) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, votes_count: (r.votes_count || 0) + 1 } : r
      )
    )
  }, [])

  // Cargar datos y suscribirse a cambios incrementales en tiempo real
  useEffect(() => {
    fetchReports()

    const subscription = reportsService.subscribeToReports((payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload

      if (eventType === 'INSERT') {
        setReports((prev) => {
          if (prev.some((r) => r.id === newRecord.id)) return prev
          return [newRecord, ...prev]
        })
      } else if (eventType === 'UPDATE') {
        setReports((prev) =>
          prev.map((r) => (r.id === newRecord.id ? { ...r, ...newRecord } : r))
        )
      } else if (eventType === 'DELETE') {
        setReports((prev) => prev.filter((r) => r.id !== oldRecord.id))
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchReports])

  return {
    reports,
    loading,
    error,
    refetch: fetchReports,
    updateLocalReport,
    removeLocalReport,
    incrementLocalVotes
  }
}
