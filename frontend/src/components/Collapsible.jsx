import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function Collapsible({ title, icon: Icon, children, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="card mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={15} className="text-brand-400" />}
          <span className="text-sm font-medium text-white">{title}</span>
          {badge !== undefined && (
            <span className="badge badge-gray text-xs">{badge}</span>
          )}
        </div>
        <div className="text-gray-600 group-hover:text-gray-400 transition-colors">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {open && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          {children}
        </div>
      )}
    </div>
  )
}
