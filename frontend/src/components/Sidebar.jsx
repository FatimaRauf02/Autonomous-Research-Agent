import React from 'react'
import { Search, Network, MessageSquare, List, Microscope } from 'lucide-react'

const navItems = [
  { id: 'search', icon: Search,        label: 'New Research' },
  { id: 'graph',  icon: Network,       label: 'Knowledge Graph' },
  { id: 'query',  icon: MessageSquare, label: 'Ask Papers' },
  { id: 'jobs',   icon: List,          label: 'All Jobs' },
]

export default function Sidebar({ page, setPage, jobs, activeJob }) {
  const running = activeJob?.status === 'running'

  return (
    <aside style={{
      width: 220,
      background: '#0f0a1e',
      borderRight: '1px solid rgba(139,92,246,0.15)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      <style>{`
        .nav-item {
          width:100%;display:flex;align-items:center;gap:10px;
          padding:9px 12px;border-radius:10px;font-size:13px;
          font-family:'Inter',system-ui,sans-serif;font-weight:500;
          cursor:pointer;border:none;background:none;
          transition:all 0.15s;color:rgba(255,255,255,0.45);margin-bottom:2px;
        }
        .nav-item:hover{background:rgba(139,92,246,0.12);color:rgba(255,255,255,0.85)}
        .nav-item.active{background:rgba(139,92,246,0.2);color:#c4b5fd;border:1px solid rgba(139,92,246,0.28)}
        @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>

      {/* Logo */}
      <div style={{ padding:'20px 16px', borderBottom:'1px solid rgba(139,92,246,0.12)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#7c3aed,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(124,58,237,0.4)' }}>
            <Microscope size={16} color="white"/>
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'white', fontFamily:'"Space Grotesk",Inter,system-ui,sans-serif' }}>Research Agent</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontFamily:'Inter,system-ui,sans-serif' }}>AI Literature Review</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'12px 8px' }}>
        {navItems.map(({ id, icon: Icon, label }) => (
          <button key={id} className={`nav-item ${page===id?'active':''}`} onClick={() => setPage(id)}>
            <Icon size={15}/>{label}
          </button>
        ))}
      </nav>

      {/* Active job */}
      {activeJob && (
        <div style={{ padding:'12px', borderTop:'1px solid rgba(139,92,246,0.12)' }}>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8, fontFamily:'Inter,system-ui,sans-serif' }}>Active Job</div>
          <div style={{ background:'rgba(139,92,246,0.12)', border:'1px solid rgba(139,92,246,0.22)', borderRadius:10, padding:'10px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:running?'#4ade80':'#a78bfa', animation:running?'pulse-dot 1.5s ease-in-out infinite':'none' }}/>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.55)', fontFamily:'Inter,system-ui,sans-serif', textTransform:'capitalize' }}>{activeJob.status}</span>
              </div>
              <span style={{ fontSize:11, fontWeight:600, color:'#a78bfa', fontFamily:'Inter,system-ui,sans-serif' }}>{activeJob.progress||0}%</span>
            </div>
            {running && (
              <div style={{ width:'100%', height:3, background:'rgba(255,255,255,0.08)', borderRadius:2, marginBottom:5, overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:2, background:'linear-gradient(90deg,#7c3aed,#818cf8)', width:`${activeJob.progress||0}%`, transition:'width 0.5s ease' }}/>
              </div>
            )}
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)', fontFamily:'Inter,system-ui,sans-serif', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{activeJob.current_step||'Waiting...'}</div>
          </div>
        </div>
      )}

      {/* Recent jobs */}
      {jobs.length > 0 && (
        <div style={{ padding:'0 12px 14px', maxHeight:140, overflowY:'auto' }}>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.22)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6, fontFamily:'Inter,system-ui,sans-serif' }}>Recent</div>
          {jobs.slice(0,5).map(j => (
            <div key={j.id} style={{ display:'flex', alignItems:'center', gap:7, padding:'4px 0' }}>
              <div style={{ width:5, height:5, borderRadius:'50%', flexShrink:0, background:j.status==='done'?'#4ade80':j.status==='running'?'#818cf8':j.status==='failed'?'#f87171':'#6b7280' }}/>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.28)', fontFamily:'Inter,system-ui,sans-serif', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{j.topic}</span>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}