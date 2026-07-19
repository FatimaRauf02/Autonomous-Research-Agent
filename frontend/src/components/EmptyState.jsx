import React from 'react'

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-64 text-center px-6 py-12">
      {Icon && (
        <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
          <Icon size={24} className="text-gray-600" />
        </div>
      )}
      <h3 className="text-sm font-medium text-gray-400 mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-gray-600 max-w-xs leading-relaxed mb-4">{description}</p>
      )}
      {action && (
        <button onClick={action.onClick} className="btn-primary text-sm">
          {action.label}
        </button>
      )}
    </div>
  )
}
