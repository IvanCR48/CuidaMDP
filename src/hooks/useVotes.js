import { useState, useEffect, useCallback } from 'react'
import { votesService } from '../services/votesService'

/**
 * Hook de aplicación para gestión de votos y apoyos de los vecinos.
 */
export function useVotes() {
  const [votedReports, setVotedReports] = useState([])

  useEffect(() => {
    // Inicializar ID de votante y cargar votos guardados
    votesService.getVoterId()
    const saved = votesService.getLocalVotes()
    setVotedReports(saved)
  }, [])

  const hasVoted = useCallback(
    (reportId) => votedReports.includes(reportId),
    [votedReports]
  )

  const voteReport = useCallback(
    async (reportId) => {
      if (hasVoted(reportId)) {
        throw new Error('Ya has apoyado este reporte.')
      }

      const voterId = votesService.getVoterId()

      try {
        await votesService.registerVote(reportId, voterId)
        const updated = votesService.saveLocalVote(reportId)
        setVotedReports(updated)
      } catch (error) {
        // Manejar código de duplicado PostgreSQL (23505)
        if (error.code === '23505') {
          const updated = votesService.saveLocalVote(reportId)
          setVotedReports(updated)
          throw new Error('Ya has apoyado este reporte.')
        }
        throw error
      }
    },
    [hasVoted]
  )

  return {
    votedReports,
    hasVoted,
    voteReport
  }
}
