import React from 'react'
import { CheckCircle2, Loader2, XCircle, Clock, AlertTriangle } from 'lucide-react'

const STATUS_MAP = {
  done:    { icon: CheckCircle2, label: 'Done',    cls: 'bg-green-900/40 text-green-400 border-green-800' },
  running: { icon: Loader2,      label: 'Running', cls: 'bg-blue-900/40  text-blue-400  border-blue-800',  spin: true },
  failed:  { icon: XCircle,      label: 'Failed',  cls: 'bg-red-900/40   text-red-400   border-red-800' },
  pending: { icon: Clock,        label: 'Pending', cls: 'bg-gray-800     text-gray-400  border-gray-700' },
  warning: { icon: AlertTriangle,label: 'Warning', cls: 'bg-amber-900/40 text-amber-400 border-amber-800' },
}

export default function StatusBadge({ status = 'pending', label, size = 'sm' }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP.pending
  const Icon = cfg.icon
  const text = label || cfg.label
  const iconSize = size === 'sm' ? 11 : 13

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${cfg.cls}`}>
      <Icon size={iconSize} className={cfg.spin ? 'animate-spin' : ''} />
      {text}
    </span>
  )
}
