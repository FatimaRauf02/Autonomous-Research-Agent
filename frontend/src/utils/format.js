/**
 * Shared formatting utilities for the frontend.
 */

/** Truncate a string to maxLen chars with ellipsis */
export function truncate(str = '', maxLen = 80) {
  if (!str) return ''
  return str.length <= maxLen ? str : str.slice(0, maxLen).trimEnd() + '…'
}

/** Format author list: first 3 authors + "et al." */
export function formatAuthors(authors = [], max = 3) {
  if (!Array.isArray(authors) || !authors.length) return 'Unknown authors'
  if (authors.length <= max) return authors.join(', ')
  return authors.slice(0, max).join(', ') + ` et al. (+${authors.length - max})`
}

/** Format ISO datetime string to readable local time */
export function formatDate(isoStr) {
  if (!isoStr) return ''
  try {
    return new Date(isoStr).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return isoStr
  }
}

/** Format a 0–1 float as a percentage string */
export function formatPct(val = 0, decimals = 0) {
  return `${(val * 100).toFixed(decimals)}%`
}

/** Format number with thousands separators */
export function formatNum(n = 0) {
  return Number(n).toLocaleString()
}

/** Return a short human-readable elapsed time since a date */
export function timeAgo(isoStr) {
  if (!isoStr) return ''
  const seconds = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000)
  if (seconds < 60)  return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

/** Capitalize first letter */
export function capitalize(str = '') {
  return str ? str[0].toUpperCase() + str.slice(1) : ''
}
