import React, { useState } from 'react'
import { ChevronDown, ChevronUp, ExternalLink, BookOpen, Users, Calendar, Star } from 'lucide-react'

export default function PaperCard({ paper, index, showAbstract = false }) {
  const [expanded, setExpanded] = useState(showAbstract)

  const authors = Array.isArray(paper.authors)
    ? paper.authors.slice(0, 3).join(', ') + (paper.authors.length > 3 ? ' et al.' : '')
    : paper.authors || 'Unknown'

  const sourceColors = {
    arxiv: 'badge-blue',
    semantic_scholar: 'badge-green',
    pubmed: 'badge-amber',
    web: 'badge-gray',
  }

  return (
    <div className="card hover:border-gray-700 transition-colors">
      <div className="flex items-start gap-3">
        {/* Index number */}
        {index !== undefined && (
          <div className="w-6 h-6 rounded-md bg-gray-800 flex items-center justify-center text-xs text-gray-500 shrink-0 mt-0.5">
            {index + 1}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-sm font-medium text-white leading-snug">{paper.title}</h3>
            {paper.arxiv_id && (
              <a
                href={`https://arxiv.org/abs/${paper.arxiv_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-gray-600 hover:text-brand-400 transition-colors"
              >
                <ExternalLink size={13} />
              </a>
            )}
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-2">
            <span className="flex items-center gap-1">
              <Users size={11} /> {authors}
            </span>
            {paper.year && (
              <span className="flex items-center gap-1">
                <Calendar size={11} /> {paper.year}
              </span>
            )}
            {paper.venue && (
              <span className="flex items-center gap-1">
                <BookOpen size={11} /> {paper.venue}
              </span>
            )}
            {paper.citation_count > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <Star size={11} /> {paper.citation_count} citations
              </span>
            )}
            <span className={`badge ${sourceColors[paper.source] || 'badge-gray'}`}>
              {paper.source || 'arxiv'}
            </span>
          </div>

          {/* Abstract toggle */}
          {paper.abstract && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors mb-1"
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {expanded ? 'Hide abstract' : 'Show abstract'}
              </button>
              {expanded && (
                <p className="text-xs text-gray-400 leading-relaxed bg-gray-800/50 rounded-lg p-3">
                  {paper.abstract}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
