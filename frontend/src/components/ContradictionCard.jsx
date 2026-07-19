import React from 'react'
import { AlertTriangle, ArrowLeftRight } from 'lucide-react'

export default function ContradictionCard({ contradiction, index }) {
  const score = contradiction.nli_score || 0
  const scorePercent = Math.round(score * 100)

  const scoreColor =
    scorePercent >= 90 ? 'text-red-400' :
    scorePercent >= 75 ? 'text-orange-400' :
    'text-amber-400'

  return (
    <div className="border border-red-900/40 bg-red-950/20 rounded-xl p-4 hover:border-red-800/60 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={13} className="text-red-400" />
          <span className="text-xs font-medium text-red-300">Contradiction #{(index ?? 0) + 1}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="text-xs text-gray-500">NLI confidence</div>
          <div className={`text-xs font-semibold ${scoreColor}`}>{scorePercent}%</div>
        </div>
      </div>

      {/* Two claims side by side */}
      <div className="grid grid-cols-2 gap-3">
        {/* Claim A */}
        <div className="bg-gray-900 rounded-lg p-3">
          <div className="text-xs font-medium text-gray-400 mb-1 truncate">
            {contradiction.paper_a_title}
            {contradiction.paper_a_year && (
              <span className="text-gray-600 ml-1">({contradiction.paper_a_year})</span>
            )}
          </div>
          <p className="text-xs text-gray-300 leading-relaxed italic">
            "{(contradiction.claim_a_text || '').slice(0, 220)}{(contradiction.claim_a_text || '').length > 220 ? '…' : ''}"
          </p>
        </div>

        {/* VS divider */}
        <div className="relative col-span-2 flex items-center justify-center -my-1">
          <div className="absolute inset-x-0 h-px bg-red-900/30" />
          <div className="relative bg-red-950/50 border border-red-900/40 rounded-full px-2 py-0.5 flex items-center gap-1">
            <ArrowLeftRight size={10} className="text-red-400" />
            <span className="text-xs text-red-400 font-medium">contradicts</span>
          </div>
        </div>

        {/* Claim B */}
        <div className="bg-gray-900 rounded-lg p-3 col-span-2">
          <div className="text-xs font-medium text-gray-400 mb-1 truncate">
            {contradiction.paper_b_title}
            {contradiction.paper_b_year && (
              <span className="text-gray-600 ml-1">({contradiction.paper_b_year})</span>
            )}
          </div>
          <p className="text-xs text-gray-300 leading-relaxed italic">
            "{(contradiction.claim_b_text || '').slice(0, 220)}{(contradiction.claim_b_text || '').length > 220 ? '…' : ''}"
          </p>
        </div>
      </div>
    </div>
  )
}
