import { useState, useCallback } from 'react'
import { getGraph } from '../utils/api.js'

export function useGraph() {
  const [graphData, setGraphData] = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  const fetchGraph = useCallback(async (jobId) => {
    if (!jobId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getGraph(jobId)
      setGraphData(data)
    } catch (e) {
      setError('Could not load knowledge graph. Complete a research job first.')
    } finally {
      setLoading(false)
    }
  }, [])

  const stats = graphData
    ? {
        papers:       (graphData.nodes || []).filter(n => n.type === 'paper').length,
        concepts:     (graphData.nodes || []).filter(n => n.type === 'concept').length,
        relationships: (graphData.edges || []).length,
      }
    : null

  return { graphData, loading, error, fetchGraph, stats }
}
