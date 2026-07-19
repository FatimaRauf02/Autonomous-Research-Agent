import { useState, useRef, useCallback } from 'react'
import { startResearch, getStatus, getReport } from '../utils/api'

export function useResearch() {
  const [jobs, setJobs] = useState([])
  const [activeJob, setActiveJob] = useState(null)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const pollRef = useRef(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const pollStatus = useCallback((jobId) => {
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const status = await getStatus(jobId)
        setActiveJob(status)
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...status } : j))

        if (status.status === 'done') {
          stopPolling()
          const report = await getReport(jobId)
          setReport(report)
        } else if (status.status === 'failed') {
          stopPolling()
          setError(status.error || 'Research job failed')
        }
      } catch (e) {
        console.error('Poll error:', e)
      }
    }, 2000)
  }, [stopPolling])

  const startJob = useCallback(async (topic) => {
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      const result = await startResearch(topic)
      const newJob = { id: result.job_id, topic, status: 'running', progress: 0 }
      setJobs(prev => [newJob, ...prev])
      setActiveJob({ job_id: result.job_id, status: 'running', progress: 0, current_step: 'Starting...' })
      pollStatus(result.job_id)
      return result.job_id
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to start research')
    } finally {
      setLoading(false)
    }
  }, [pollStatus])

  const loadReport = useCallback(async (jobId) => {
    try {
      const data = await getReport(jobId)
      setReport(data)
      const status = await getStatus(jobId)
      setActiveJob(status)
    } catch (e) {
      setError('Could not load report')
    }
  }, [])

  return { jobs, activeJob, report, loading, error, startJob, loadReport, setActiveJob, setError }
}
