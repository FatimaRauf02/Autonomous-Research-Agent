import React, { useEffect, useState } from 'react'
import { Network, RefreshCw, Zap, BookOpen, Tag } from 'lucide-react'
import { listJobs, getReport } from '../utils/api.js'

// Extract keywords from text using simple NLP
function extractKeywords(text, topN = 6) {
  if (!text) return []
  const stopwords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','shall','can','that','this','these','those','it','its','which','who','whom','what','when','where','why','how','as','if','then','than','so','yet','both','either','neither','each','few','more','most','other','some','such','no','not','only','own','same','too','very','just','about','above','after','before','between','into','through','during','without','within','along','following','across','behind','beyond','plus','except','up','out','around','down','off','over','under','again','further','once','here','there','while','although','because','since','unless','until','whenever','wherever','whether','though','even','also','however','therefore','thus','hence','consequently','nevertheless','meanwhile','otherwise','indeed','instead','moreover','furthermore','additionally','subsequently','previously','finally','already','still','yet','now','then'])

  const words = text.toLowerCase()
    .replace(/[^a-z\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4 && !stopwords.has(w))

  const freq = {}
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1 })
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1))
}

function buildGraphFromReport(report) {
  const nodes = [], edges = []
  const nodeIds = new Set()

  const addNode = (id, label, type, meta = {}) => {
    if (!nodeIds.has(id)) { nodeIds.add(id); nodes.push({ id, label, type, ...meta }) }
  }

  const papers = report.top_papers || []

 
  papers.forEach((p, i) => {
    const pid = p.arxiv_id || `paper_${i}`
    addNode(pid, (p.title || 'Unknown').slice(0, 36), 'paper', {
      year: p.year,
      citations: p.citation_count || 0,
      full_title: p.title,
      authors: Array.isArray(p.authors) ? p.authors.slice(0, 2).join(', ') : '',
    })
  })

  
  const centralConcepts = report.central_concepts || []
  const conceptMap = {} 

  if (centralConcepts.length > 0) {

    centralConcepts.slice(0, 20).forEach((c, i) => {
      if (!c.concept) return
      const cid = `concept_${i}`
      conceptMap[c.concept.toLowerCase()] = cid
      addNode(cid, c.concept.slice(0, 28), 'concept', { degree: c.degree })
    })
    
    papers.forEach((p, pi) => {
      const pid = p.arxiv_id || `paper_${pi}`
      const text = `${p.title || ''} ${p.abstract || ''}`.toLowerCase()
      Object.entries(conceptMap).forEach(([concept, cid]) => {
        if (text.includes(concept.slice(0, 8).toLowerCase())) {
          edges.push({ source: pid, target: cid })
        }
      })
    })
  } else {
    
    const allKeywords = {}
    papers.forEach((p, pi) => {
      const text = `${p.title || ''} ${p.abstract || ''}`
      const keywords = extractKeywords(text, 5)
      keywords.forEach(kw => {
        const key = kw.toLowerCase()
        if (!allKeywords[key]) allKeywords[key] = { word: kw, papers: [], count: 0 }
        allKeywords[key].papers.push(pi)
        allKeywords[key].count++
      })
    })

    
    const sharedKeywords = Object.entries(allKeywords)
      .filter(([, v]) => v.count >= 2)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 15)

   
    const topKeywords = sharedKeywords.length > 0
      ? sharedKeywords
      : Object.entries(allKeywords).sort((a, b) => b[1].count - a[1].count).slice(0, 12)

    topKeywords.forEach(([key, val], i) => {
      const cid = `concept_${i}`
      addNode(cid, val.word.slice(0, 26), 'concept', { degree: val.count })
      
      const papersWithKeyword = val.papers.length > 0 ? val.papers : papers.slice(0, 3).map((_, j) => j)
      papersWithKeyword.forEach(pi => {
        const pid = papers[pi]?.arxiv_id || `paper_${pi}`
        if (nodeIds.has(pid)) edges.push({ source: pid, target: cid })
      })
    })
  }

 
  if (edges.length === 0 && nodes.length > 1) {
    const paperNodes = nodes.filter(n => n.type === 'paper')
    paperNodes.forEach((n, i) => {
      if (i < paperNodes.length - 1) edges.push({ source: n.id, target: paperNodes[i + 1].id })
    })
  }

 
  const contradictions = report.contradictions || []
  contradictions.forEach(c => {
    const aId = papers.find(p => p.title === c.paper_a_title)?.arxiv_id
    const bId = papers.find(p => p.title === c.paper_b_title)?.arxiv_id
    if (aId && bId) edges.push({ source: aId, target: bId, type: 'contradiction' })
  })

  return { nodes, edges }
}

function useForceLayout(nodes, edges, width, height) {
  const [positions, setPositions] = useState({})

  useEffect(() => {
    if (!nodes.length) return
    const pos = {}
    nodes.forEach((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2
      const r = n.type === 'paper' ? 165 : 90
      pos[n.id] = {
        x: width/2 + Math.cos(angle)*r + (Math.random()-0.5)*30,
        y: height/2 + Math.sin(angle)*r + (Math.random()-0.5)*30,
        vx: 0, vy: 0,
      }
    })
    for (let iter = 0; iter < 120; iter++) {
      nodes.forEach(a => {
        nodes.forEach(b => {
          if (a.id === b.id) return
          const dx = pos[a.id].x-pos[b.id].x, dy = pos[a.id].y-pos[b.id].y
          const dist = Math.sqrt(dx*dx+dy*dy) || 1
          const f = 1600/(dist*dist)
          pos[a.id].vx += (dx/dist)*f; pos[a.id].vy += (dy/dist)*f
        })
      })
      edges.forEach(e => {
        const a = pos[e.source], b = pos[e.target]
        if (!a||!b) return
        const dx = b.x-a.x, dy = b.y-a.y
        const dist = Math.sqrt(dx*dx+dy*dy) || 1
        const f = (dist-100)*0.04
        const fx = (dx/dist)*f, fy = (dy/dist)*f
        a.vx+=fx; a.vy+=fy; b.vx-=fx; b.vy-=fy
      })
      nodes.forEach(n => {
        pos[n.id].vx += (width/2-pos[n.id].x)*0.007
        pos[n.id].vy += (height/2-pos[n.id].y)*0.007
        pos[n.id].x += pos[n.id].vx*0.4; pos[n.id].y += pos[n.id].vy*0.4
        pos[n.id].vx *= 0.7; pos[n.id].vy *= 0.7
        pos[n.id].x = Math.max(50,Math.min(width-50,pos[n.id].x))
        pos[n.id].y = Math.max(50,Math.min(height-50,pos[n.id].y))
      })
    }
    setPositions({...pos})
  }, [nodes.length, edges.length])

  return positions
}

function InteractiveGraph({ nodes, edges }) {
  const width=720, height=460
  const positions = useForceLayout(nodes, edges, width, height)
  const [hovered, setHovered] = useState(null)

  if (!Object.keys(positions).length) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:200,color:'#9ca3af',fontSize:13,fontFamily:'Inter,system-ui,sans-serif' }}>
      Building graph layout...
    </div>
  )

  return (
    <div style={{ position:'relative' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width:'100%',borderRadius:16,background:'#f9fafb',border:'1px solid #e5e7eb' }}>
        {/* Edges */}
        {edges.map((e, i) => {
          const s=positions[e.source], t=positions[e.target]
          if (!s||!t) return null
          return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y}
            stroke={e.type==='contradiction'?'rgba(220,38,38,0.45)':'rgba(124,58,237,0.2)'}
            strokeWidth={e.type==='contradiction'?2:1}
            strokeDasharray={e.type==='contradiction'?'5,3':'none'}/>
        })}
        {}
        {nodes.map(n => {
          const p=positions[n.id]
          if (!p) return null
          const isPaper=n.type==='paper', isH=hovered===n.id
          return (
            <g key={n.id} onMouseEnter={()=>setHovered(n.id)} onMouseLeave={()=>setHovered(null)} style={{cursor:'pointer'}}>
              {isPaper ? (
                <>
                  <circle cx={p.x} cy={p.y} r={isH?13:9} fill={isH?'#4f46e5':'rgba(79,70,229,0.12)'} stroke="#4f46e5" strokeWidth="1.5" style={{transition:'all 0.18s'}}/>
                  <circle cx={p.x} cy={p.y} r={isH?5:4} fill="#4f46e5"/>
                </>
              ) : (
                <>
                  <circle cx={p.x} cy={p.y} r={isH?10:7} fill={isH?'#059669':'rgba(5,150,105,0.12)'} stroke="#059669" strokeWidth="1.5" style={{transition:'all 0.18s'}}/>
                  <circle cx={p.x} cy={p.y} r={isH?4:3} fill="#059669"/>
                </>
              )}
              <text x={p.x} y={p.y-(isH?16:13)} textAnchor="middle" fontSize={isH?'9':'7.5'}
                fill={isH?'#111827':'#6b7280'} fontFamily="Inter,system-ui,sans-serif" fontWeight={isH?'600':'400'}
                style={{transition:'all 0.18s',pointerEvents:'none'}}>
                {n.label}
              </text>
            </g>
          )
        })}
      </svg>
      {}
      {hovered && (() => {
        const n=nodes.find(x=>x.id===hovered)
        if (!n) return null
        return (
          <div style={{ position:'absolute',bottom:12,left:12,background:'white',border:'1px solid #e5e7eb',borderRadius:10,padding:'10px 14px',maxWidth:280,boxShadow:'0 4px 14px rgba(0,0,0,0.1)',pointerEvents:'none',zIndex:10 }}>
            <div style={{ fontSize:10,fontWeight:600,color:n.type==='paper'?'#4f46e5':'#059669',marginBottom:3,fontFamily:'Inter,system-ui,sans-serif',textTransform:'uppercase',letterSpacing:'0.05em' }}>{n.type}</div>
            <div style={{ fontSize:12,fontWeight:600,color:'#111827',fontFamily:'"Space Grotesk",Inter,system-ui,sans-serif',marginBottom:3,lineHeight:1.4 }}>{n.full_title||n.label}</div>
            {n.authors&&<div style={{ fontSize:11,color:'#6b7280',fontFamily:'Inter,system-ui,sans-serif' }}>{n.authors}</div>}
            {n.year&&<div style={{ fontSize:11,color:'#9ca3af',fontFamily:'Inter,system-ui,sans-serif' }}>Year: {n.year}</div>}
            {n.citations>0&&<div style={{ fontSize:11,color:'#d97706',fontFamily:'Inter,system-ui,sans-serif',marginTop:2 }}>⭐ {n.citations} citations</div>}
            {n.degree!==undefined&&<div style={{ fontSize:11,color:'#059669',fontFamily:'Inter,system-ui,sans-serif',marginTop:2 }}>Frequency: {n.degree} papers</div>}
          </div>
        )
      })()}
    </div>
  )
}

export default function GraphPage({ research }) {
  const { activeJob } = research
  const [graphData, setGraphData]   = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [allJobs, setAllJobs]       = useState([])
  const [selectedId, setSelectedId] = useState(null)

  const loadJobs = async () => {
    setLoading(true); setError(null)
    try {
      const jobs = await listJobs()
      const done = jobs.filter(j=>j.status==='done')
      if (!done.length) { setError('No completed research jobs yet.'); setLoading(false); return }
      setAllJobs(done)
      const target = done.find(j=>j.id===activeJob?.job_id) || done[0]
      setSelectedId(target.id)
      await loadGraph(target.id)
    } catch { setError('Could not load jobs.') }
    finally { setLoading(false) }
  }

  const loadGraph = async (jobId) => {
    setLoading(true); setError(null)
    try {
      const report = await getReport(jobId)
      const data = buildGraphFromReport(report)
      if (!data.nodes.length) setError('No paper data found for this job.')
      else setGraphData({ ...data, report })
    } catch { setError('Could not load report.') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadJobs() }, [activeJob?.job_id])

  const nodes = graphData?.nodes || []
  const edges = graphData?.edges || []
  const report = graphData?.report

  return (
    <div style={{ minHeight:'100vh', background:'#ffffff', padding:'2rem 1.5rem' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ maxWidth:780, margin:'0 auto' }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:4 }}>
              <div style={{ width:34,height:34,borderRadius:10,background:'#f5f3ff',border:'1px solid #ddd6fe',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <Network size={16} color="#7c3aed"/>
              </div>
              <h2 style={{ fontSize:20,fontWeight:700,color:'#111827',fontFamily:'"Space Grotesk",Inter,system-ui,sans-serif' }}>Knowledge Graph</h2>
            </div>
            <p style={{ fontSize:12,color:'#9ca3af',fontFamily:'Inter,system-ui,sans-serif' }}>Papers, extracted concepts, and their relationships — built from report data</p>
          </div>
          <button onClick={()=>selectedId?loadGraph(selectedId):loadJobs()} disabled={loading}
            style={{ display:'flex',alignItems:'center',gap:6,background:'#f5f3ff',border:'1px solid #ddd6fe',borderRadius:10,padding:'8px 14px',color:'#7c3aed',fontSize:12,cursor:loading?'not-allowed':'pointer',fontFamily:'Inter,system-ui,sans-serif',fontWeight:500,opacity:loading?0.5:1 }}>
            <RefreshCw size={13} style={{ animation:loading?'spin 1s linear infinite':'none' }}/> Refresh
          </button>
        </div>

        {}
        {allJobs.length > 1 && (
          <div style={{ marginBottom:'1rem', display:'flex', gap:8, flexWrap:'wrap' }}>
            {allJobs.map(j=>(
              <button key={j.id} onClick={()=>{ setSelectedId(j.id); loadGraph(j.id) }}
                style={{ fontSize:11,padding:'5px 12px',borderRadius:20,cursor:'pointer',fontFamily:'Inter,system-ui,sans-serif',fontWeight:500,transition:'all 0.15s',
                  background:selectedId===j.id?'#f5f3ff':'#f9fafb',
                  border:selectedId===j.id?'1px solid #7c3aed':'1px solid #e5e7eb',
                  color:selectedId===j.id?'#7c3aed':'#6b7280' }}>
                {(j.topic||'').slice(0,34)}{(j.topic||'').length>34?'…':''}
              </button>
            ))}
          </div>
        )}

        {error&&<div style={{ background:'#fffbeb',border:'1px solid #fde68a',borderRadius:14,padding:'12px 16px',marginBottom:'1.25rem' }}><p style={{ fontSize:13,color:'#92400e',margin:0,fontFamily:'Inter,system-ui,sans-serif' }}>{error}</p></div>}

        {loading&&<div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:200,gap:10,color:'#9ca3af',fontSize:13,fontFamily:'Inter,system-ui,sans-serif' }}><RefreshCw size={16} style={{ animation:'spin 1s linear infinite' }}/> Building knowledge graph...</div>}

        {graphData && !loading && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:'1rem' }}>
              {[
                { label:'Paper nodes',   value:nodes.filter(n=>n.type==='paper').length,   color:'#4f46e5', bg:'#eef2ff', border:'#c7d2fe', Icon:BookOpen },
                { label:'Concept nodes', value:nodes.filter(n=>n.type==='concept').length, color:'#059669', bg:'#ecfdf5', border:'#a7f3d0', Icon:Tag },
                { label:'Relationships', value:edges.length,                               color:'#7c3aed', bg:'#f5f3ff', border:'#ddd6fe', Icon:Network },
              ].map(s=>(
                <div key={s.label} style={{ background:s.bg,border:`1px solid ${s.border}`,borderRadius:13,padding:'12px 16px',display:'flex',alignItems:'center',gap:12 }}>
                  <div style={{ width:32,height:32,borderRadius:8,background:'white',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 1px 3px rgba(0,0,0,0.07)' }}>
                    <s.Icon size={15} color={s.color}/>
                  </div>
                  <div>
                    <div style={{ fontSize:20,fontWeight:800,color:s.color,fontFamily:'"Space Grotesk",Inter,system-ui,sans-serif',lineHeight:1 }}>{s.value}</div>
                    <div style={{ fontSize:11,color:'#6b7280',marginTop:2,fontFamily:'Inter,system-ui,sans-serif' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:18, marginBottom:'0.6rem' }}>
              {[
                {c:'#4f46e5',l:'Paper node'},{c:'#059669',l:'Concept node'},
                {c:'rgba(124,58,237,0.35)',l:'Mentions',line:true},
                {c:'rgba(220,38,38,0.5)',l:'Contradicts',line:true,dashed:true},
              ].map(l=>(
                <div key={l.l} style={{ display:'flex',alignItems:'center',gap:5 }}>
                  {l.line?<svg width="18" height="8"><line x1="0" y1="4" x2="18" y2="4" stroke={l.c} strokeWidth="1.5" strokeDasharray={l.dashed?'4,2':'none'}/></svg>:<div style={{ width:9,height:9,borderRadius:'50%',background:l.c }}/>}
                  <span style={{ fontSize:11,color:'#6b7280',fontFamily:'Inter,system-ui,sans-serif' }}>{l.l}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize:11,color:'#9ca3af',marginBottom:'0.75rem',fontFamily:'Inter,system-ui,sans-serif' }}>Hover any node for details</p>

            <InteractiveGraph nodes={nodes} edges={edges}/>

            {/* Concepts list */}
            {nodes.filter(n=>n.type==='concept').length > 0 && (
              <div style={{ marginTop:'1.25rem',background:'white',border:'1px solid #e5e7eb',borderRadius:14,padding:'16px 18px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:12 }}>
                  <Zap size={14} color="#7c3aed"/>
                  <span style={{ fontSize:13,fontWeight:600,color:'#111827',fontFamily:'"Space Grotesk",Inter,system-ui,sans-serif' }}>Key Concepts Extracted</span>
                </div>
                {nodes.filter(n=>n.type==='concept').sort((a,b)=>(b.degree||0)-(a.degree||0)).slice(0,12).map((c,i)=>(
                  <div key={i} style={{ display:'flex',alignItems:'center',gap:10,marginBottom:7 }}>
                    <span style={{ fontSize:11,color:'#9ca3af',width:18,textAlign:'right',fontFamily:'Inter,system-ui,sans-serif' }}>{i+1}</span>
                    <div style={{ flex:1,height:22,background:'#f3f4f6',borderRadius:5,overflow:'hidden' }}>
                      <div style={{ height:'100%',background:'linear-gradient(90deg,rgba(124,58,237,0.22),rgba(99,102,241,0.12))',borderRadius:5,width:`${Math.min(100,((c.degree||1)/Math.max(1,...nodes.filter(n=>n.type==='concept').map(n=>n.degree||1)))*100)}%`,display:'flex',alignItems:'center',paddingLeft:8,transition:'width 0.5s',minWidth:60 }}>
                        <span style={{ fontSize:11,color:'#374151',fontFamily:'Inter,system-ui,sans-serif',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{c.label}</span>
                      </div>
                    </div>
                    <span style={{ fontSize:11,color:'#7c3aed',width:28,textAlign:'right',fontFamily:'Inter,system-ui,sans-serif',fontWeight:600 }}>{c.degree||1}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!graphData && !error && !loading && (
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:260,gap:12 }}>
            <div style={{ width:62,height:62,borderRadius:20,background:'#f5f3ff',border:'1px solid #ddd6fe',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <Network size={28} color="#a78bfa"/>
            </div>
            <p style={{ fontSize:14,color:'#9ca3af',fontFamily:'Inter,system-ui,sans-serif',textAlign:'center' }}>Complete a research job to see the knowledge graph</p>
          </div>
        )}
      </div>
    </div>
  )
}