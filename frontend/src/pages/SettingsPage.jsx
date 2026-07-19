import React, { useEffect, useState } from 'react'
import { Settings, HardDrive, Database, Cpu, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { healthCheck } from '../utils/api.js'
import Spinner from '../components/Spinner.jsx'

function HealthRow({ label, ok, detail }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-800 last:border-0">
      <div className="flex items-center gap-2.5">
        {ok
          ? <CheckCircle2 size={13} className="text-green-400" />
          : <XCircle size={13} className="text-red-400" />
        }
        <span className="text-sm text-gray-300">{label}</span>
      </div>
      {detail && <span className="text-xs text-gray-600 font-mono truncate max-w-xs">{detail}</span>}
    </div>
  )
}

function PathRow({ label, path }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-800 last:border-0">
      <HardDrive size={13} className="text-brand-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-500 mb-0.5">{label}</div>
        <div className="text-xs font-mono text-gray-300 break-all">{path}</div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await healthCheck()
      setHealth(data)
    } catch (e) {
      setError('Backend not reachable. Is the FastAPI server running?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Settings size={18} className="text-brand-400" /> Settings & Health
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Backend status and F drive data paths</p>
        </div>
        <button onClick={load} className="btn-ghost flex items-center gap-2 text-sm">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-sm text-red-300 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Spinner text="Checking backend..." /></div>
      ) : health ? (
        <>
          {/* API status */}
          <div className="card mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Cpu size={14} className="text-brand-400" />
              <span className="text-sm font-medium text-white">API Status</span>
            </div>
            <HealthRow label="Backend API" ok={health.status === 'ok'} detail="http://localhost:8000" />
            <HealthRow label="Frontend" ok={true} detail="http://localhost:5173" />
          </div>

          {/* Data paths on F drive */}
          <div className="card mb-4">
            <div className="flex items-center gap-2 mb-4">
              <HardDrive size={14} className="text-brand-400" />
              <span className="text-sm font-medium text-white">F Drive Data Paths</span>
            </div>
            <PathRow label="Base data directory" path={health.data_dir} />
            <PathRow label="ChromaDB vectors" path={health.chroma_dir} />
            <PathRow label="AI models cache" path={health.models_cache} />
          </div>

          {/* Stack info */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Database size={14} className="text-brand-400" />
              <span className="text-sm font-medium text-white">Tech Stack</span>
            </div>
            {[
              ['Agent framework', 'LangGraph + FastAPI'],
              ['LLM', 'Groq (LLaMA 3 8B)'],
              ['Vector DB', 'ChromaDB (F drive)'],
              ['Graph DB', 'Neo4j (Docker)'],
              ['Task queue', 'Celery + Redis'],
              ['NLP models', 'spaCy + SciBERT + NLI'],
              ['Retrieval', 'Dense + BM25 + Cross-encoder'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-gray-800 last:border-0">
                <span className="text-xs text-gray-500">{k}</span>
                <span className="text-xs text-gray-300 font-mono">{v}</span>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
