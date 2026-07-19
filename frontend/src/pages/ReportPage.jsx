import React, { useState, useEffect, useRef } from 'react'
import { FileText, AlertTriangle, BookOpen, TrendingUp, Users, ChevronDown, ChevronUp, ExternalLink, Clock, Download, Sparkles, Calendar, Quote } from 'lucide-react'
import { listJobs, getReport } from '../utils/api.js'

// Typewriter-style markdown renderer
function FormattedReport({ text }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!text) return
    setDisplayed('')
    setDone(false)
    let i = 0
    const speed = text.length > 3000 ? 2 : 8
    intervalRef.current = setInterval(() => {
      i += speed
      if (i >= text.length) {
        setDisplayed(text)
        setDone(true)
        clearInterval(intervalRef.current)
      } else {
        setDisplayed(text.slice(0, i))
      }
    }, 16)
    return () => clearInterval(intervalRef.current)
  }, [text])

  const skipToEnd = () => {
    clearInterval(intervalRef.current)
    setDisplayed(text)
    setDone(true)
  }

  // Parse markdown-like text into styled elements
  const renderLine = (line, idx) => {
    if (!line.trim()) return <div key={idx} style={{ height: 12 }} />

    // H1 ##
    if (line.startsWith('# ')) return (
      <h1 key={idx} style={{ fontSize: 26, fontWeight: 800, color: 'white', margin: '24px 0 10px', fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif', lineHeight: 1.2 }}>
        {line.slice(2)}
      </h1>
    )
    // H2 ##
    if (line.startsWith('## ')) return (
      <h2 key={idx} style={{ fontSize: 20, fontWeight: 700, color: '#c4b5fd', margin: '20px 0 8px', fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 3, height: 20, background: 'linear-gradient(180deg,#7c3aed,#4f46e5)', borderRadius: 2, flexShrink: 0, display: 'inline-block' }}/>
        {line.slice(3)}
      </h2>
    )
    // H3 ###
    if (line.startsWith('### ')) return (
      <h3 key={idx} style={{ fontSize: 16, fontWeight: 600, color: '#a78bfa', margin: '16px 0 6px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        {line.slice(4)}
      </h3>
    )
    // Bold **text**
    const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:white;font-weight:700">$1</strong>')
    // Bullet
    if (line.startsWith('- ') || line.startsWith('• ')) {
      const content = line.slice(2)
      const boldContent = content.replace(/\*\*(.*?)\*\*/g, '<strong style="color:white;font-weight:600">$1</strong>')
      return (
        <div key={idx} style={{ display: 'flex', gap: 10, margin: '5px 0', alignItems: 'flex-start' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', flexShrink: 0, marginTop: 8 }}/>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.78)', lineHeight: 1.7, margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }} dangerouslySetInnerHTML={{ __html: boldContent }}/>
        </div>
      )
    }
    // Normal paragraph
    return (
      <p key={idx} style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, margin: '4px 0', fontFamily: 'Inter, system-ui, sans-serif' }} dangerouslySetInnerHTML={{ __html: boldLine }}/>
    )
  }

  const lines = displayed.split('\n')

  return (
    <div>
      {!done && (
        <button onClick={skipToEnd} style={{ float: 'right', fontSize: 11, color: '#a78bfa', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', marginBottom: 8, fontFamily: 'Inter, system-ui, sans-serif' }}>
          Skip animation
        </button>
      )}
      <div style={{ clear: 'both' }}>
        {lines.map((line, idx) => renderLine(line, idx))}
        {!done && <span style={{ display: 'inline-block', width: 2, height: 16, background: '#a78bfa', animation: 'blink-cursor 0.7s infinite', marginLeft: 2, verticalAlign: 'middle' }}/>}
      </div>
    </div>
  )
}

function PaperCard({ paper, index }) {
  const [expanded, setExpanded] = useState(false)
  const authors = Array.isArray(paper.authors) ? paper.authors.slice(0, 3).join(', ') + (paper.authors.length > 3 ? ' et al.' : '') : ''

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14,
      padding: '14px 16px',
      marginBottom: 10,
      transition: 'all 0.2s',
      cursor: paper.abstract ? 'pointer' : 'default',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
    onClick={() => paper.abstract && setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Index badge */}
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>{index + 1}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'white', lineHeight: 1.4, marginBottom: 5, fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif' }}>
            {paper.title}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {authors && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'Inter, system-ui, sans-serif' }}>{authors}</span>}
            {paper.year && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#818cf8', background: 'rgba(99,102,241,0.12)', padding: '2px 8px', borderRadius: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>
                <Calendar size={9}/> {paper.year}
              </span>
            )}
            {paper.venue && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, system-ui, sans-serif' }}>{paper.venue}</span>}
            {paper.citation_count > 0 && (
              <span style={{ fontSize: 11, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '2px 8px', borderRadius: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>
                ⭐ {paper.citation_count} citations
              </span>
            )}
          </div>
          {expanded && paper.abstract && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 12px', fontFamily: 'Inter, system-ui, sans-serif' }}>
              {paper.abstract}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {paper.arxiv_id && (
            <a href={`https://arxiv.org/abs/${paper.arxiv_id}`} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
            >
              <ExternalLink size={13}/>
            </a>
          )}
          {paper.abstract && (
            <span style={{ color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center' }}>
              {expanded ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function ContradictionCard({ c, index }) {
  return (
    <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={13} color="#f87171"/>
          <span style={{ fontSize: 12, color: '#f87171', fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif' }}>Contradiction #{index + 1}</span>
        </div>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'rgba(239,68,68,0.15)', padding: '2px 8px', borderRadius: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>
          NLI: {(c.nli_score * 100).toFixed(0)}% confident
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[{title: c.paper_a_title, year: c.paper_a_year, text: c.claim_a_text}, {title: c.paper_b_title, year: c.paper_b_year, text: c.claim_b_text}].map((side, i) => (
          <div key={i} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 500 }}>
              {side.title} {side.year && `(${side.year})`}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Quote size={10} color="#f87171" style={{ flexShrink: 0, marginTop: 3 }}/>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: 0, fontStyle: 'italic', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {(side.text || '').slice(0, 200)}{(side.text || '').length > 200 ? '…' : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Section({ title, icon: Icon, children, defaultOpen = true, badge, accent = '#7c3aed' }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, marginBottom: 14, overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: `${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={15} color={accent}/>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'white', fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif' }}>{title}</span>
          {badge !== undefined && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>{badge}</span>
          )}
        </div>
        {open ? <ChevronUp size={14} color="rgba(255,255,255,0.3)"/> : <ChevronDown size={14} color="rgba(255,255,255,0.3)"/>}
      </button>
      {open && <div style={{ padding: '0 20px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>{children}</div>}
    </div>
  )
}

function DownloadButtons({ report }) {
  const downloadMarkdown = () => {
    const content = `# ${report.topic}\n\n${report.report}`
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.topic.replace(/\s+/g, '_')}_report.md`
    a.click()
  }

  const downloadTxt = () => {
    const papers = (report.top_papers || []).map((p, i) => `${i+1}. ${p.title} (${p.year}) - ${Array.isArray(p.authors) ? p.authors.join(', ') : ''}`).join('\n')
    const content = `RESEARCH REPORT: ${report.topic}\nGenerated: ${report.generated_at}\n\n${report.report}\n\n---\nPAPERS REVIEWED\n${papers}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.topic.replace(/\s+/g, '_')}_report.txt`
    a.click()
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={downloadMarkdown} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
        borderRadius: 10, padding: '8px 14px', color: '#a78bfa',
        fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 500,
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.25)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.15)' }}
      >
        <Download size={13}/> Download MD
      </button>
      <button onClick={downloadTxt} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: 10, padding: '8px 14px', color: '#818cf8',
        fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 500,
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.25)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)' }}
      >
        <Download size={13}/> Download TXT
      </button>
    </div>
  )
}

export default function ReportPage({ research }) {
  const { report: activeReport } = research
  const [allReports, setAllReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [loadingReports, setLoadingReports] = useState(true)

  useEffect(() => { loadAllReports() }, [activeReport])

  const loadAllReports = async () => {
    setLoadingReports(true)
    try {
      const jobs = await listJobs()
      const doneJobs = jobs.filter(j => j.status === 'done')
      const reports = []
      for (const job of doneJobs) {
        try { reports.push(await getReport(job.id)) } catch {}
      }
      setAllReports(reports)
      if (reports.length > 0 && !selectedReport) setSelectedReport(reports[0])
    } catch {}
    finally { setLoadingReports(false) }
  }

  useEffect(() => { if (activeReport) setSelectedReport(activeReport) }, [activeReport])

  const report = selectedReport

  if (loadingReports && allReports.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#0f0a1e' }}>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, system-ui, sans-serif' }}>Loading reports...</div>
      </div>
    )
  }

  if (allReports.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#0f0a1e' }}>
        <FileText size={40} color="rgba(255,255,255,0.1)"/>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginTop: 12, fontFamily: 'Inter, system-ui, sans-serif' }}>No reports yet. Start a research job first.</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0533 50%, #0d1117 100%)', padding: '2rem 1.5rem' }}>
      <style>{`
        @keyframes blink-cursor { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .report-list-item {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 14px 16px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .report-list-item:hover { border-color: rgba(139,92,246,0.3); background: rgba(139,92,246,0.06); }
        .report-list-item.active { border-color: rgba(139,92,246,0.5); background: rgba(139,92,246,0.1); }
      `}</style>

      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Sparkles size={16} color="#a78bfa"/>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white', fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif' }}>Research Reports</h2>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, system-ui, sans-serif' }}>All generated research reports — click to view full details</p>
        </div>

        {}
        {allReports.length > 1 && (
          <div style={{ marginBottom: '1.5rem' }}>
            {allReports.map((r, i) => (
              <div key={r.job_id || i}
                className={`report-list-item ${selectedReport?.job_id === r.job_id ? 'active' : ''}`}
                onClick={() => setSelectedReport(r)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 5, fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif' }}>{r.topic}</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <span style={{ fontSize: 11, color: '#818cf8', fontFamily: 'Inter, system-ui, sans-serif' }}>{r.papers_count} papers</span>
                      <span style={{ fontSize: 11, color: '#4ade80', fontFamily: 'Inter, system-ui, sans-serif' }}>{r.claims_count} claims</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={9}/>{new Date(r.generated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <ChevronDown size={14} color="rgba(255,255,255,0.3)" style={{ transform: selectedReport?.job_id === r.job_id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {report && (
          <>
            {}
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 500 }}>Research Report</div>
                  <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif', lineHeight: 1.2, marginBottom: 6 }}>{report.topic}</h1>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, system-ui, sans-serif' }}>Generated {new Date(report.generated_at).toLocaleString()}</div>
                </div>
                <DownloadButtons report={report}/>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: '1.5rem' }}>
              {[
                { label: 'Papers', value: report.papers_count, color: '#818cf8', bg: 'rgba(99,102,241,0.1)' },
                { label: 'Claims', value: report.claims_count, color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
                { label: 'Contradictions', value: report.contradictions_count, color: '#f87171', bg: 'rgba(239,68,68,0.1)' },
                { label: 'Gaps Found', value: report.gaps_count, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}33`, borderRadius: 14, padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif' }}>{s.value ?? 0}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 3, fontFamily: 'Inter, system-ui, sans-serif' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {}
            <Section title="Full Research Report" icon={FileText} defaultOpen={true} accent="#7c3aed">
              <div style={{ paddingTop: 12 }}>
                <FormattedReport text={report.report}/>
              </div>
            </Section>

            {}
            <Section title="Papers Reviewed" icon={BookOpen} badge={report.papers_count} defaultOpen={false} accent="#4f46e5">
              <div style={{ paddingTop: 12 }}>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 12, fontFamily: 'Inter, system-ui, sans-serif' }}>Click any paper to expand the abstract</p>
                {(report.top_papers || []).map((p, i) => <PaperCard key={i} paper={p} index={i}/>)}
              </div>
            </Section>

            {/* Contradictions */}
            {(report.contradictions || []).length > 0 && (
              <Section title="Contradictions Detected" icon={AlertTriangle} badge={report.contradictions_count} defaultOpen={true} accent="#ef4444">
                <div style={{ paddingTop: 12 }}>
                  {report.contradictions.map((c, i) => <ContradictionCard key={i} c={c} index={i}/>)}
                </div>
              </Section>
            )}

            {}
            {(report.gaps || []).length > 0 && (
              <Section title="Research Gaps" icon={TrendingUp} badge={report.gaps_count} defaultOpen={false} accent="#f59e0b">
                <div style={{ paddingTop: 12 }}>
                  {report.gaps.map((g, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 500, background: g.gap_severity === 'high' ? 'rgba(239,68,68,0.15)' : 'rgba(251,191,36,0.12)', color: g.gap_severity === 'high' ? '#f87171' : '#fbbf24' }}>
                        {g.gap_severity}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: 'white', fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif', fontWeight: 500 }}>{g.topic_name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, system-ui, sans-serif' }}>{(g.keywords || []).join(', ')}</div>
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, system-ui, sans-serif' }}>{g.papers_count} papers</div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {}
            {(report.central_concepts || []).length > 0 && (
              <Section title="Key Concepts" icon={Users} defaultOpen={false} accent="#06b6d4">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, paddingTop: 12 }}>
                  {report.central_concepts.slice(0, 16).map((c, i) => (
                    <div key={i} style={{ background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: 10, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, system-ui, sans-serif', truncate: true }}>{c.concept}</span>
                      <span style={{ fontSize: 11, color: '#06b6d4', fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 600, marginLeft: 8, flexShrink: 0 }}>{c.degree}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  )
}