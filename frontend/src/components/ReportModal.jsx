import React, { useState, useEffect } from 'react'
import { X, FileText, AlertTriangle, BookOpen, TrendingUp, Users, ChevronDown, ChevronUp, ExternalLink, Download, Calendar, Quote } from 'lucide-react'

const PST = { timeZone: 'Asia/Karachi', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }

function formatPST(iso) {
  try { return new Date(iso).toLocaleString('en-US', PST) + ' PKT' } catch { return iso }
}

function downloadPDF(report) {
  const win = window.open('', '_blank')
  const papers = (report.top_papers || []).map((p, i) =>
    `<tr><td>${i+1}</td><td>${p.title}</td><td>${Array.isArray(p.authors)?p.authors.slice(0,2).join(', ')+(p.authors.length>2?' et al.':''):''}</td><td>${p.year||''}</td><td>${p.citation_count||0}</td></tr>`
  ).join('')

  const body = (report.report||'')
    .replace(/^# (.+)$/gm,'<h1>$1</h1>')
    .replace(/^## (.+)$/gm,'<h2>$1</h2>')
    .replace(/^### (.+)$/gm,'<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/^- (.+)$/gm,'<li>$1</li>')
    .replace(/\n\n/g,'</p><p>')

  win.document.write(`<!DOCTYPE html><html><head><title>${report.topic}</title>
  <style>
    body{font-family:Georgia,serif;max-width:820px;margin:0 auto;padding:48px;color:#111827;line-height:1.7}
    h1{font-size:24px;font-weight:700;margin:24px 0 10px;color:#111827}
    h2{font-size:18px;font-weight:600;margin:20px 0 8px;color:#1e1b4b;border-left:3px solid #7c3aed;padding-left:10px}
    h3{font-size:14px;font-weight:600;margin:14px 0 6px;color:#374151}
    p{margin:8px 0;font-size:13px}li{margin:4px 0;font-size:13px}
    table{width:100%;border-collapse:collapse;margin:16px 0;font-size:12px}
    th{background:#f3f4f6;padding:8px;text-align:left;border-bottom:2px solid #d1d5db;font-weight:600}
    td{padding:7px 8px;border-bottom:1px solid #e5e7eb}
    .header{text-align:center;border-bottom:2px solid #7c3aed;padding-bottom:24px;margin-bottom:32px}
    .meta{display:flex;justify-content:center;gap:24px;margin-top:12px;font-size:12px;color:#6b7280}
    @media print{body{padding:24px}}
  </style></head><body>
  <div class="header">
    <div style="font-size:10px;color:#7c3aed;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">Research Report</div>
    <h1 style="margin:0 0 8px">${report.topic}</h1>
    <div style="font-size:12px;color:#6b7280">Generated: ${formatPST(report.generated_at)}</div>
    <div class="meta"><span><strong>${report.papers_count}</strong> papers</span><span><strong>${report.claims_count}</strong> claims</span><span><strong>${report.contradictions_count}</strong> contradictions</span></div>
  </div>
  <p>${body}</p>
  ${papers?`<h2>Papers Reviewed</h2><table><thead><tr><th>#</th><th>Title</th><th>Authors</th><th>Year</th><th>Citations</th></tr></thead><tbody>${papers}</tbody></table>`:''}
  </body></html>`)
  win.document.close()
  setTimeout(()=>win.print(),500)
}

function downloadWord(report) {
  const papers = (report.top_papers||[]).map((p,i)=>
    `<tr><td>${i+1}</td><td>${p.title}</td><td>${Array.isArray(p.authors)?p.authors.slice(0,3).join(', ')+(p.authors.length>3?' et al.':''):''}</td><td>${p.year||''}</td><td>${p.citation_count||0}</td></tr>`
  ).join('')
  const body = (report.report||'')
    .replace(/^# (.+)$/gm,'<h1>$1</h1>')
    .replace(/^## (.+)$/gm,'<h2>$1</h2>')
    .replace(/^### (.+)$/gm,'<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g,'<b>$1</b>')
    .replace(/^- (.+)$/gm,'<li>$1</li>')
    .replace(/\n\n/g,'</p><p>')
  const html=`<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
  <head><meta charset='utf-8'><title>${report.topic}</title>
  <style>body{font-family:Calibri,sans-serif;font-size:11pt;margin:1in}h1{font-size:18pt;color:#111827;margin-top:18pt}h2{font-size:14pt;color:#4a1d96;margin-top:14pt;padding-left:8pt;border-left:3pt solid #7c3aed}h3{font-size:12pt;margin-top:10pt}p{line-height:1.6;margin:6pt 0}li{margin:3pt 0}table{border-collapse:collapse;width:100%;margin:12pt 0}td,th{border:1px solid #d1d5db;padding:4pt 6pt;font-size:9pt}th{background:#f3f4f6;font-weight:bold}</style>
  </head><body>
  <h1>${report.topic}</h1>
  <p><em>Generated: ${formatPST(report.generated_at)}</em><br/>Papers: ${report.papers_count} | Claims: ${report.claims_count} | Contradictions: ${report.contradictions_count}</p><hr/>
  <p>${body}</p>
  ${papers?`<h2>Papers Reviewed</h2><table><tr><th>#</th><th>Title</th><th>Authors</th><th>Year</th><th>Citations</th></tr>${papers}</table>`:''}
  </body></html>`
  const blob=new Blob(['\ufeff',html],{type:'application/msword'})
  const url=URL.createObjectURL(blob)
  const a=document.createElement('a');a.href=url;a.download=`${report.topic.replace(/[^a-z0-9]/gi,'_').slice(0,60)}_report.doc`;a.click()
  URL.revokeObjectURL(url)
}

function FormattedReport({ text }) {
  if (!text) return null
  return (
    <div>
      {text.split('\n').map((line, idx) => {
        if (!line.trim()) return <div key={idx} style={{height:10}}/>
        if (line.startsWith('# ')) return <h1 key={idx} style={{fontSize:22,fontWeight:800,color:'#111827',margin:'22px 0 8px',fontFamily:'"Space Grotesk",Inter,system-ui,sans-serif',lineHeight:1.2}}>{line.slice(2)}</h1>
        if (line.startsWith('## ')) return (
          <h2 key={idx} style={{fontSize:17,fontWeight:700,color:'#4338ca',margin:'18px 0 7px',fontFamily:'"Space Grotesk",Inter,system-ui,sans-serif',display:'flex',alignItems:'center',gap:8}}>
            <span style={{width:3,height:18,background:'linear-gradient(180deg,#7c3aed,#4f46e5)',borderRadius:2,flexShrink:0,display:'inline-block'}}/>
            {line.slice(3)}
          </h2>
        )
        if (line.startsWith('### ')) return <h3 key={idx} style={{fontSize:14,fontWeight:600,color:'#6d28d9',margin:'14px 0 5px',fontFamily:'Inter,system-ui,sans-serif'}}>{line.slice(4)}</h3>
        if (line.startsWith('- ')||line.startsWith('• ')) {
          const c=line.slice(2).replace(/\*\*(.*?)\*\*/g,'<strong style="color:#111827;font-weight:600">$1</strong>')
          return (
            <div key={idx} style={{display:'flex',gap:8,margin:'4px 0',alignItems:'flex-start'}}>
              <div style={{width:5,height:5,borderRadius:'50%',background:'#7c3aed',flexShrink:0,marginTop:9}}/>
              <p style={{fontSize:13,color:'#374151',lineHeight:1.8,margin:0,fontFamily:'Inter,system-ui,sans-serif'}} dangerouslySetInnerHTML={{__html:c}}/>
            </div>
          )
        }
        const h=line.replace(/\*\*(.*?)\*\*/g,'<strong style="color:#111827;font-weight:600">$1</strong>')
        return <p key={idx} style={{fontSize:13,color:'#4b5563',lineHeight:1.8,margin:'3px 0',fontFamily:'Inter,system-ui,sans-serif'}} dangerouslySetInnerHTML={{__html:h}}/>
      })}
    </div>
  )
}

function PaperCard({ paper, index }) {
  const [expanded, setExpanded] = useState(false)
  const authors = Array.isArray(paper.authors) ? paper.authors.slice(0,3).join(', ')+(paper.authors.length>3?' et al.':'') : ''
  return (
    <div onClick={()=>paper.abstract&&setExpanded(!expanded)}
      style={{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:12,padding:'12px 14px',marginBottom:8,cursor:paper.abstract?'pointer':'default',transition:'all 0.2s'}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='#7c3aed';e.currentTarget.style.background='#f5f3ff'}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='#e5e7eb';e.currentTarget.style.background='#f9fafb'}}
    >
      <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
        <div style={{width:26,height:26,borderRadius:7,background:'linear-gradient(135deg,#4f46e5,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'white',flexShrink:0,fontFamily:'Inter,system-ui,sans-serif'}}>{index+1}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,fontWeight:600,color:'#111827',lineHeight:1.4,marginBottom:4,fontFamily:'"Space Grotesk",Inter,system-ui,sans-serif'}}>{paper.title}</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {authors&&<span style={{fontSize:11,color:'#6b7280',fontFamily:'Inter,system-ui,sans-serif'}}>{authors}</span>}
            {paper.year&&<span style={{fontSize:11,color:'#4f46e5',background:'#eef2ff',padding:'1px 7px',borderRadius:20,fontFamily:'Inter,system-ui,sans-serif',display:'flex',alignItems:'center',gap:3}}><Calendar size={8}/>{paper.year}</span>}
            {paper.citation_count>0&&<span style={{fontSize:11,color:'#b45309',background:'#fef3c7',padding:'1px 7px',borderRadius:20,fontFamily:'Inter,system-ui,sans-serif'}}>⭐ {paper.citation_count}</span>}
          </div>
          {expanded&&paper.abstract&&<div style={{marginTop:8,fontSize:11,color:'#6b7280',lineHeight:1.65,background:'white',border:'1px solid #e5e7eb',borderRadius:7,padding:'8px 10px',fontFamily:'Inter,system-ui,sans-serif'}}>{paper.abstract}</div>}
        </div>
        <div style={{display:'flex',gap:6,flexShrink:0}}>
          {paper.arxiv_id&&<a href={`https://arxiv.org/abs/${paper.arxiv_id}`} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{color:'#9ca3af',transition:'color 0.15s'}} onMouseEnter={e=>e.currentTarget.style.color='#7c3aed'} onMouseLeave={e=>e.currentTarget.style.color='#9ca3af'}><ExternalLink size={12}/></a>}
          {paper.abstract&&<span style={{color:'#9ca3af'}}>{expanded?<ChevronUp size={12}/>:<ChevronDown size={12}/>}</span>}
        </div>
      </div>
    </div>
  )
}

function Section({ title, icon: Icon, children, defaultOpen=true, badge, accent='#7c3aed' }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{background:'white',border:'1px solid #e5e7eb',borderRadius:14,marginBottom:12,overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
      <button onClick={()=>setOpen(!open)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',background:'none',border:'none',cursor:'pointer'}}>
        <div style={{display:'flex',alignItems:'center',gap:9}}>
          <div style={{width:28,height:28,borderRadius:8,background:`${accent}15`,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon size={14} color={accent}/></div>
          <span style={{fontSize:13,fontWeight:600,color:'#111827',fontFamily:'"Space Grotesk",Inter,system-ui,sans-serif'}}>{title}</span>
          {badge!==undefined&&<span style={{fontSize:11,color:'#6b7280',background:'#f3f4f6',padding:'1px 8px',borderRadius:20,fontFamily:'Inter,system-ui,sans-serif'}}>{badge}</span>}
        </div>
        {open?<ChevronUp size={13} color="#9ca3af"/>:<ChevronDown size={13} color="#9ca3af"/>}
      </button>
      {open&&<div style={{padding:'0 18px 14px',borderTop:'1px solid #f3f4f6'}}>{children}</div>}
    </div>
  )
}

export default function ReportModal({ report, onClose }) {
  useEffect(() => {
    const h=(e)=>{ if(e.key==='Escape') onClose() }
    document.addEventListener('keydown',h)
    return ()=>document.removeEventListener('keydown',h)
  },[onClose])

  return (
    <div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.5)',backdropFilter:'blur(4px)',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'20px',overflowY:'auto'}}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}
    >
      <style>{`@keyframes modal-in{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{width:'100%',maxWidth:820,background:'white',border:'1px solid #e5e7eb',borderRadius:20,padding:'28px',position:'relative',animation:'modal-in 0.22s ease',marginBottom:20,boxShadow:'0 20px 60px rgba(0,0,0,0.15)'}}>

        {/* Close */}
        <button onClick={onClose} style={{position:'absolute',top:16,right:16,width:32,height:32,borderRadius:10,background:'#f3f4f6',border:'1px solid #e5e7eb',color:'#6b7280',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all 0.15s'}}
          onMouseEnter={e=>{e.currentTarget.style.background='#fee2e2';e.currentTarget.style.color='#dc2626'}}
          onMouseLeave={e=>{e.currentTarget.style.background='#f3f4f6';e.currentTarget.style.color='#6b7280'}}
        ><X size={15}/></button>

        {/* Header */}
        <div style={{marginBottom:'1.5rem',paddingRight:44}}>
          <div style={{fontSize:10,color:'#7c3aed',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:5,fontFamily:'Inter,system-ui,sans-serif',fontWeight:600}}>Research Report</div>
          <h1 style={{fontSize:24,fontWeight:800,color:'#111827',fontFamily:'"Space Grotesk",Inter,system-ui,sans-serif',lineHeight:1.25,marginBottom:6}}>{report.topic}</h1>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
            <div style={{fontSize:11,color:'#9ca3af',fontFamily:'Inter,system-ui,sans-serif'}}>Generated {formatPST(report.generated_at)}</div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>downloadPDF(report)} style={{display:'flex',alignItems:'center',gap:5,background:'#fef2f2',border:'1px solid #fecaca',borderRadius:9,padding:'7px 13px',color:'#dc2626',fontSize:12,cursor:'pointer',fontFamily:'Inter,system-ui,sans-serif',fontWeight:500,transition:'all 0.2s'}}
                onMouseEnter={e=>e.currentTarget.style.background='#fee2e2'} onMouseLeave={e=>e.currentTarget.style.background='#fef2f2'}
              ><Download size={12}/> PDF</button>
              <button onClick={()=>downloadWord(report)} style={{display:'flex',alignItems:'center',gap:5,background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:9,padding:'7px 13px',color:'#2563eb',fontSize:12,cursor:'pointer',fontFamily:'Inter,system-ui,sans-serif',fontWeight:500,transition:'all 0.2s'}}
                onMouseEnter={e=>e.currentTarget.style.background='#dbeafe'} onMouseLeave={e=>e.currentTarget.style.background='#eff6ff'}
              ><Download size={12}/> Word</button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:'1.25rem'}}>
          {[
            {label:'Papers',value:report.papers_count,color:'#4f46e5',bg:'#eef2ff',border:'#c7d2fe'},
            {label:'Claims',value:report.claims_count,color:'#059669',bg:'#ecfdf5',border:'#a7f3d0'},
            {label:'Contradictions',value:report.contradictions_count,color:'#dc2626',bg:'#fef2f2',border:'#fecaca'},
            {label:'Gaps',value:report.gaps_count,color:'#d97706',bg:'#fffbeb',border:'#fde68a'},
          ].map(s=>(
            <div key={s.label} style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:12,padding:'12px',textAlign:'center'}}>
              <div style={{fontSize:22,fontWeight:800,color:s.color,fontFamily:'"Space Grotesk",Inter,system-ui,sans-serif'}}>{s.value??0}</div>
              <div style={{fontSize:11,color:'#6b7280',marginTop:2,fontFamily:'Inter,system-ui,sans-serif'}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Report */}
        <Section title="Full Research Report" icon={FileText} defaultOpen={true} accent="#7c3aed">
          <div style={{paddingTop:10}}><FormattedReport text={report.report}/></div>
        </Section>

        {/* Papers */}
        <Section title="Papers Reviewed" icon={BookOpen} badge={report.papers_count} defaultOpen={false} accent="#4f46e5">
          <div style={{paddingTop:10}}>
            <p style={{fontSize:11,color:'#9ca3af',marginBottom:10,fontFamily:'Inter,system-ui,sans-serif'}}>Click any paper to expand the abstract</p>
            {(report.top_papers||[]).map((p,i)=><PaperCard key={i} paper={p} index={i}/>)}
          </div>
        </Section>

        {/* Contradictions */}
        {(report.contradictions||[]).length>0&&(
          <Section title="Contradictions Detected" icon={AlertTriangle} badge={report.contradictions_count} defaultOpen={true} accent="#dc2626">
            <div style={{paddingTop:10}}>
              {report.contradictions.map((c,i)=>(
                <div key={i} style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:12,padding:'12px 14px',marginBottom:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                    <div style={{display:'flex',alignItems:'center',gap:5}}><AlertTriangle size={12} color="#dc2626"/><span style={{fontSize:11,color:'#dc2626',fontWeight:600,fontFamily:'Inter,system-ui,sans-serif'}}>Contradiction #{i+1}</span></div>
                    <span style={{fontSize:10,color:'#6b7280',background:'#fee2e2',padding:'2px 8px',borderRadius:20,fontFamily:'Inter,system-ui,sans-serif'}}>NLI: {(c.nli_score*100).toFixed(0)}%</span>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    {[{t:c.paper_a_title,y:c.paper_a_year,text:c.claim_a_text},{t:c.paper_b_title,y:c.paper_b_year,text:c.claim_b_text}].map((s,si)=>(
                      <div key={si} style={{background:'white',border:'1px solid #fecaca',borderRadius:9,padding:'9px 11px'}}>
                        <div style={{fontSize:10,color:'#6b7280',marginBottom:5,fontFamily:'Inter,system-ui,sans-serif',fontWeight:500}}>{s.t} {s.y&&`(${s.y})`}</div>
                        <div style={{display:'flex',gap:5}}>
                          <Quote size={9} color="#dc2626" style={{flexShrink:0,marginTop:2}}/>
                          <p style={{fontSize:11,color:'#374151',lineHeight:1.6,margin:0,fontStyle:'italic',fontFamily:'Inter,system-ui,sans-serif'}}>{(s.text||'').slice(0,200)}{(s.text||'').length>200?'…':''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Gaps */}
        {(report.gaps||[]).length>0&&(
          <Section title="Research Gaps" icon={TrendingUp} badge={report.gaps_count} defaultOpen={false} accent="#d97706">
            <div style={{paddingTop:10}}>
              {report.gaps.map((g,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:'1px solid #f3f4f6'}}>
                  <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,fontFamily:'Inter,system-ui,sans-serif',fontWeight:500,background:g.gap_severity==='high'?'#fef2f2':'#fffbeb',color:g.gap_severity==='high'?'#dc2626':'#d97706',border:`1px solid ${g.gap_severity==='high'?'#fecaca':'#fde68a'}`}}>{g.gap_severity}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,color:'#111827',fontFamily:'"Space Grotesk",Inter,system-ui,sans-serif',fontWeight:500}}>{g.topic_name}</div>
                    <div style={{fontSize:10,color:'#9ca3af',fontFamily:'Inter,system-ui,sans-serif'}}>{(g.keywords||[]).join(', ')}</div>
                  </div>
                  <div style={{fontSize:10,color:'#9ca3af',fontFamily:'Inter,system-ui,sans-serif'}}>{g.papers_count} papers</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Concepts */}
        {(report.central_concepts||[]).length>0&&(
          <Section title="Key Concepts" icon={Users} defaultOpen={false} accent="#0891b2">
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:7,paddingTop:10}}>
              {report.central_concepts.slice(0,16).map((c,i)=>(
                <div key={i} style={{background:'#ecfeff',border:'1px solid #a5f3fc',borderRadius:9,padding:'8px 11px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:11,color:'#164e63',fontFamily:'Inter,system-ui,sans-serif',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{c.concept}</span>
                  <span style={{fontSize:10,color:'#0891b2',fontFamily:'Inter,system-ui,sans-serif',fontWeight:600,marginLeft:8,flexShrink:0}}>{c.degree}</span>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}