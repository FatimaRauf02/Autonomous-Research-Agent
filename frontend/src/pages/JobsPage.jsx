import React, { useEffect, useState } from 'react'
import { Trash2, FileText, RefreshCw, Clock, ChevronRight, AlertCircle, Loader2, CheckCircle2, XCircle, Circle } from 'lucide-react'
import { listJobs, deleteJob } from '../utils/api.js'

const STATUS_CONFIG = {
  done:    { icon: CheckCircle2, label: 'Done',    color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  running: { icon: Loader2,      label: 'Running', color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe', spin: true },
  failed:  { icon: XCircle,      label: 'Failed',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  pending: { icon: Circle,       label: 'Pending', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const Icon = cfg.icon
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, background:cfg.bg, border:`1px solid ${cfg.border}`, fontSize:11, fontWeight:500, color:cfg.color, fontFamily:'Inter,system-ui,sans-serif' }}>
      <Icon size={10} style={{ animation:cfg.spin?'spin 1s linear infinite':'none' }}/>{cfg.label}
    </span>
  )
}

export default function JobsPage({ research, onOpenReport }) {
  const [jobs, setJobs]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  const load = async () => {
    setLoading(true)
    try { const data = await listJobs(); setJobs(Array.isArray(data)?data:[]) }
    catch { setJobs([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    setDeletingId(id)
    try { await deleteJob(id); setJobs(prev=>prev.filter(j=>j.id!==id)) }
    catch {}
    finally { setDeletingId(null) }
  }

  const grouped = {
    running: jobs.filter(j=>j.status==='running'),
    pending: jobs.filter(j=>j.status==='pending'),
    done:    jobs.filter(j=>j.status==='done'),
    failed:  jobs.filter(j=>j.status==='failed'),
  }

  return (
    <div style={{ minHeight:'100vh', background:'#ffffff', padding:'2rem 1.5rem' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .job-card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;padding:14px 16px;margin-bottom:8px;display:flex;align-items:center;gap:14px;transition:all 0.2s}
        .job-card.clickable{cursor:pointer}
        .job-card.clickable:hover{border-color:#7c3aed;background:#faf5ff;box-shadow:0 2px 8px rgba(124,58,237,0.1)}
        .del-btn{padding:7px;border-radius:8px;color:#9ca3af;background:none;border:none;cursor:pointer;transition:all 0.15s;display:flex;align-items:center}
        .del-btn:hover{color:#dc2626;background:#fef2f2}
        .refresh-btn{display:flex;align-items:center;gap:6px;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;padding:8px 14px;color:#7c3aed;font-size:12px;cursor:pointer;font-family:'Inter',system-ui,sans-serif;font-weight:500;transition:all 0.2s}
        .refresh-btn:hover{background:#ede9fe}
      `}</style>

      <div style={{ maxWidth:680, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem' }}>
          <div>
            <h2 style={{ fontSize:22, fontWeight:700, color:'#111827', fontFamily:'"Space Grotesk",Inter,system-ui,sans-serif', marginBottom:4 }}>All Research Jobs</h2>
            <p style={{ fontSize:12, color:'#9ca3af', fontFamily:'Inter,system-ui,sans-serif' }}>Click any completed job to view its full report</p>
          </div>
          <button className="refresh-btn" onClick={load}>
            <RefreshCw size={13} style={{ animation:loading?'spin 1s linear infinite':'none' }}/> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:160, gap:10, color:'#9ca3af', fontSize:14, fontFamily:'Inter,system-ui,sans-serif' }}>
            <Loader2 size={18} style={{ animation:'spin 1s linear infinite' }}/> Loading jobs...
          </div>
        ) : jobs.length===0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:200, gap:12 }}>
            <FileText size={40} color="#e5e7eb"/>
            <p style={{ fontSize:14, color:'#9ca3af', fontFamily:'Inter,system-ui,sans-serif' }}>No jobs yet. Start one from New Research.</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:'1.5rem' }}>
              {Object.entries(grouped).map(([status,items])=>{
                const cfg=STATUS_CONFIG[status]||STATUS_CONFIG.pending
                return (
                  <div key={status} style={{ background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:14, padding:'14px', textAlign:'center' }}>
                    <div style={{ fontSize:24, fontWeight:800, color:cfg.color, fontFamily:'"Space Grotesk",Inter,system-ui,sans-serif' }}>{items.length}</div>
                    <div style={{ fontSize:11, color:'#6b7280', marginTop:3, textTransform:'capitalize', fontFamily:'Inter,system-ui,sans-serif' }}>{status}</div>
                  </div>
                )
              })}
            </div>

            {/* Jobs by group */}
            {Object.entries(grouped).map(([status,items])=>{
              if(items.length===0) return null
              const cfg=STATUS_CONFIG[status]||STATUS_CONFIG.pending
              return (
                <div key={status} style={{ marginBottom:'1.25rem' }}>
                  <div style={{ fontSize:11, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8, fontFamily:'Inter,system-ui,sans-serif', display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:cfg.color }}/>{status} ({items.length})
                  </div>
                  {items.map(job=>(
                    <div key={job.id} className={`job-card ${job.status==='done'?'clickable':''}`} onClick={()=>{ if(job.status==='done') onOpenReport(job.id) }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:cfg.color, flexShrink:0 }}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'#111827', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', marginBottom:5, fontFamily:'"Space Grotesk",Inter,system-ui,sans-serif' }}>{job.topic}</div>
                        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                          <StatusBadge status={job.status}/>
                          <span style={{ fontSize:11, color:'#9ca3af', display:'flex', alignItems:'center', gap:4, fontFamily:'Inter,system-ui,sans-serif' }}>
                            <Clock size={9}/>{job.created_at?new Date(job.created_at).toLocaleString('en-US',{timeZone:'Asia/Karachi',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:true}):'—'}
                          </span>
                          {job.status==='running'&&<span style={{ fontSize:11, color:'#4f46e5', fontFamily:'Inter,system-ui,sans-serif', fontWeight:500 }}>{job.progress||0}%</span>}
                        </div>
                        {job.status==='running'&&(
                          <div style={{ marginTop:7, width:'100%', height:3, background:'#e5e7eb', borderRadius:2, overflow:'hidden' }}>
                            <div style={{ height:'100%', borderRadius:2, background:'linear-gradient(90deg,#7c3aed,#4f46e5)', width:`${job.progress||0}%`, transition:'width 0.5s ease' }}/>
                          </div>
                        )}
                        {job.status==='failed'&&job.error_message&&(
                          <div style={{ marginTop:4, display:'flex', alignItems:'center', gap:5 }}>
                            <AlertCircle size={10} color="#dc2626"/>
                            <span style={{ fontSize:11, color:'#dc2626', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', fontFamily:'Inter,system-ui,sans-serif' }}>{job.error_message}</span>
                          </div>
                        )}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                        {job.status==='done'&&<span style={{ fontSize:11, color:'#9ca3af', fontFamily:'Inter,system-ui,sans-serif', display:'flex', alignItems:'center', gap:3 }}>View<ChevronRight size={13}/></span>}
                        <button className="del-btn" onClick={(e)=>handleDelete(job.id,e)} disabled={deletingId===job.id}>
                          {deletingId===job.id?<Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/>:<Trash2 size={13}/>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}