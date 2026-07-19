import { useState, useCallback } from 'react'
import { queryPapers } from '../utils/api.js'

export function useQuery(jobId) {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Ask me anything about the papers in your research job. I use hybrid RAG — dense embeddings + BM25 keyword search + cross-encoder reranking — to find the most relevant passages before answering.',
    },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const ask = useCallback(async (question) => {
    if (!question.trim() || !jobId || loading) return

    setMessages(prev => [...prev, { role: 'user', text: question }])
    setLoading(true)
    setError(null)

    try {
      const result = await queryPapers(jobId, question)
      setMessages(prev => [
        ...prev,
        { role: 'bot', text: result.answer, sources: result.sources || [] },
      ])
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Query failed. Make sure a research job is complete.'
      setError(msg)
      setMessages(prev => [...prev, { role: 'bot', text: `Error: ${msg}`, sources: [] }])
    } finally {
      setLoading(false)
    }
  }, [jobId, loading])

  const clear = useCallback(() => {
    setMessages([{
      role: 'bot',
      text: 'Conversation cleared. Ask me anything about the papers.',
    }])
    setError(null)
  }, [])

  return { messages, loading, error, ask, clear }
}
