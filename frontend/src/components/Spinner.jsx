import React from 'react'
import { Loader2 } from 'lucide-react'

export default function Spinner({ size = 20, text = '', className = '' }) {
  return (
    <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
      <Loader2 size={size} className="animate-spin" />
      {text && <span className="text-sm">{text}</span>}
    </div>
  )
}
