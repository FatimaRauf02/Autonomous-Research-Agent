import React from 'react'
import { FileText, Lightbulb, AlertTriangle, TrendingUp } from 'lucide-react'

const STATS = [
  { key: 'papers_count',        label: 'Papers',         icon: FileText,     color: 'text-blue-400' },
  { key: 'claims_count',        label: 'Claims',         icon: Lightbulb,    color: 'text-green-400' },
  { key: 'contradictions_count',label: 'Contradictions', icon: AlertTriangle, color: 'text-red-400' },
  { key: 'gaps_count',          label: 'Gaps Found',     icon: TrendingUp,   color: 'text-amber-400' },
]

export default function StatsBar({ report }) {
  if (!report) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {STATS.map(({ key, label, icon: Icon, color }) => (
        <div key={key} className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Icon size={13} className={color} />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
          <div className={`text-2xl font-bold ${color}`}>
            {report[key] ?? 0}
          </div>
        </div>
      ))}
    </div>
  )
}
