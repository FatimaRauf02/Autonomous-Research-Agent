import React from 'react'

export default function ProgressBar({ value = 0, color = 'brand', label = '', showPercent = true }) {
  const colors = {
    brand: 'from-blue-600 to-indigo-500',
    green: 'from-green-600 to-emerald-500',
    red: 'from-red-600 to-rose-500',
    amber: 'from-amber-500 to-orange-400',
  }

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-gray-400">{label}</span>}
          {showPercent && <span className="text-xs text-gray-500">{Math.round(value)}%</span>}
        </div>
      )}
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${colors[color] || colors.brand} transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  )
}
