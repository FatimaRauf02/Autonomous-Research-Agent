import React, { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ICONS = {
  success: { icon: CheckCircle2, cls: 'text-green-400 bg-green-900/30 border-green-800' },
  error:   { icon: XCircle,      cls: 'text-red-400   bg-red-900/30   border-red-800' },
  warning: { icon: AlertTriangle,cls: 'text-amber-400 bg-amber-900/30 border-amber-800' },
  info:    { icon: Info,         cls: 'text-blue-400  bg-blue-900/30  border-blue-800' },
}

function Toast({ id, type = 'info', message, onDismiss }) {
  const cfg = ICONS[type] || ICONS.info
  const Icon = cfg.icon

  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), 4000)
    return () => clearTimeout(t)
  }, [id, onDismiss])

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm max-w-sm ${cfg.cls}`}>
      <Icon size={15} className="shrink-0 mt-0.5" />
      <span className="text-gray-200 flex-1">{message}</span>
      <button onClick={() => onDismiss(id)} className="text-gray-500 hover:text-gray-300 shrink-0">
        <X size={13} />
      </button>
    </div>
  )
}

// Simple global toast store
let _addToast = null

export function useToast() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((type, message) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, type, message }])
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => { _addToast = addToast }, [addToast])

  return { toasts, dismiss, toast: addToast }
}

export function toast(type, message) {
  if (_addToast) _addToast(type, message)
}

export function ToastContainer({ toasts, dismiss }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <Toast key={t.id} {...t} onDismiss={dismiss} />
      ))}
    </div>
  )
}
