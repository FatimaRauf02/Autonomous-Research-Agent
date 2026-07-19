import React, { useState, useEffect } from 'react'
import { Search, Loader2, AlertCircle, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'

const EXAMPLE_TOPICS = [
  'Transformer attention mechanisms in NLP',
  'Diffusion models for image generation',
  'Graph neural networks for drug discovery',
  'Large language model alignment and safety',
  'Self-supervised learning in computer vision',
  'Retrieval-augmented generation for QA',
]

const STEPS = [
  { label: 'Decompose topic into queries',    range: [0,  15], emoji: '🧠' },
  { label: 'Search arXiv & Semantic Scholar', range: [15, 30], emoji: '🔍' },
  { label: 'Download & parse PDFs',           range: [30, 50], emoji: '📄' },
  { label: 'Extract claims with NLP',         range: [50, 65], emoji: '⚗️' },
  { label: 'Detect contradictions (NLI)',     range: [65, 75], emoji: '⚡' },
  { label: 'Cluster topics & find gaps',      range: [75, 85], emoji: '🗂️' },
  { label: 'Generate structured report',      range: [85,100], emoji: '✨' },
]

function getStepStatus(idx, progress) {
  const [min, max] = STEPS[idx].range
  if (progress >= max) return 'done'
  if (progress >= min) return 'active'
  return 'pending'
}

function RobotAnimation({ isThinking }) {
  const [blink, setBlink] = useState(false)
  const [bounce, setBounce] = useState(false)
  useEffect(() => {
    const t = setInterval(() => { setBlink(true); setTimeout(() => setBlink(false), 150) }, 3000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    if (!isThinking) { setBounce(false); return }
    const t = setInterval(() => setBounce(v => !v), 700)
    return () => clearInterval(t)
  }, [isThinking])

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:'1.5rem', transition:'transform 0.4s ease', transform: bounce ? 'translateY(-10px)' : 'translateY(0)' }}>
      <div style={{ position:'relative', width:150, height:150, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ position:'absolute', inset:-10, borderRadius:'50%', background: isThinking ? 'radial-gradient(circle,rgba(124,58,237,0.2) 0%,transparent 70%)' : 'radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)', transition:'background 0.5s', animation:'glow-pulse 2.5s ease-in-out infinite' }}/>
        <svg width="140" height="140" viewBox="0 0 148 148" fill="none">
          <line x1="74" y1="6" x2="74" y2="24" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="74" cy="5" r="5" fill="#a78bfa">
            <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="fill" values="#a78bfa;#7c3aed;#a78bfa" dur="2s" repeatCount="indefinite"/>
          </circle>
          <rect x="26" y="22" width="96" height="44" rx="18" fill="url(#hg2)"/>
          <rect x="30" y="54" width="88" height="72" rx="18" fill="url(#bg2)"/>
          <defs>
            <linearGradient id="hg2" x1="26" y1="22" x2="122" y2="66" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6d28d9"/><stop offset="100%" stopColor="#4338ca"/>
            </linearGradient>
            <linearGradient id="bg2" x1="30" y1="54" x2="118" y2="126" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4f46e5"/><stop offset="100%" stopColor="#7c3aed"/>
            </linearGradient>
          </defs>
          <ellipse cx="52" cy="44" rx="11" ry={blink?1.5:11} fill="white" style={{transition:'ry 0.1s'}}/>
          <ellipse cx="96" cy="44" rx="11" ry={blink?1.5:11} fill="white" style={{transition:'ry 0.1s'}}/>
          <circle cx="54" cy="44" r="5.5" fill="#1e1b4b"/>
          <circle cx="98" cy="44" r="5.5" fill="#1e1b4b"/>
          <circle cx="56" cy="42" r="2" fill="white"/>
          <circle cx="100" cy="42" r="2" fill="white"/>
          <path d={isThinking?"M 58 60 Q 74 66 90 60":"M 58 60 Q 74 70 90 60"} stroke="#a78bfa" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <rect x="52" y="72" width="44" height="30" rx="9" fill="rgba(0,0,0,0.25)"/>
          <circle cx="64" cy="87" r="5.5" fill={isThinking?'#818cf8':'#4ade80'}>
            {isThinking&&<animate attributeName="fill" values="#818cf8;#c4b5fd;#818cf8" dur="0.9s" repeatCount="indefinite"/>}
          </circle>
          <circle cx="84" cy="87" r="5.5" fill={isThinking?'#c4b5fd':'#818cf8'}>
            {isThinking&&<animate attributeName="fill" values="#c4b5fd;#818cf8;#c4b5fd" dur="0.9s" repeatCount="indefinite"/>}
          </circle>
          <rect x="8" y="58" width="20" height="42" rx="10" fill="#4338ca"/>
          <rect x="120" y="58" width="20" height="42" rx="10" fill="#4338ca"/>
          <circle cx="18" cy="103" r="9" fill="#5b21b6"/>
          <circle cx="130" cy="103" r="9" fill="#5b21b6"/>
          <rect x="43" y="122" width="24" height="20" rx="9" fill="#4338ca"/>
          <rect x="81" y="122" width="24" height="20" rx="9" fill="#4338ca"/>
        </svg>
      </div>
      {isThinking && (
        <div style={{ display:'flex', gap:6, marginTop:8 }}>
          {[0,1,2].map(i=><div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'#7c3aed', animation:`dot-bounce 1s ease-in-out ${i*0.2}s infinite` }}/>)}
        </div>
      )}
    </div>
  )
}

export default function SearchPage({ research, onDone }) {
  const [topic, setTopic] = useState('')
  const { activeJob, error, startJob, setError } = research
  const running = activeJob?.status === 'running'
  const done    = activeJob?.status === 'done'

  useEffect(() => { setTopic(''); setError(null) }, [])
  useEffect(() => { if (done) setTimeout(onDone, 600) }, [done])

  const handleStart = async (e) => {
    e.preventDefault()
    if (!topic.trim() || running) return
    await startJob(topic.trim())
  }

  return (
    <div style={{ minHeight:'100vh', background:'#ffffff', padding:'2rem 1.5rem' }}>
      <style>{`
        @keyframes glow-pulse{0%,100%{opacity:0.6;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}
        @keyframes dot-bounce{0%,100%{transform:translateY(0);opacity:0.4}50%{transform:translateY(-7px);opacity:1}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .s-input{width:100%;background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:14px;padding:14px 20px 14px 44px;color:#111827;font-size:15px;outline:none;transition:all 0.2s;font-family:'Inter',system-ui,sans-serif}
        .s-input::placeholder{color:#9ca3af}
        .s-input:focus{border-color:#7c3aed;background:white;box-shadow:0 0 0 3px rgba(124,58,237,0.1)}
        .s-btn{background:linear-gradient(135deg,#7c3aed,#4f46e5);border:none;border-radius:13px;padding:14px 26px;color:white;font-weight:600;font-size:14px;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:7px;font-family:'Inter',system-ui,sans-serif;box-shadow:0 4px 14px rgba(124,58,237,0.3);transition:all 0.2s}
        .s-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 7px 22px rgba(124,58,237,0.45)}
        .s-btn:disabled{opacity:0.45;cursor:not-allowed;transform:none}
        .t-chip{background:#f5f3ff;border:1px solid #ddd6fe;border-radius:20px;padding:6px 14px;color:#5b21b6;font-size:12px;cursor:pointer;transition:all 0.18s;font-family:'Inter',system-ui,sans-serif;font-weight:500}
        .t-chip:hover{background:#ede9fe;border-color:#a78bfa;transform:translateY(-1px)}
        .step-row{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:9px;margin-bottom:5px;transition:all 0.2s}
        .step-active{background:#f5f3ff;border:1px solid #ddd6fe}
        .step-done{background:#f0fdf4}
        .step-pending{opacity:0.45}
      `}</style>

      <div style={{ maxWidth:600, margin:'0 auto' }}>
        <div style={{ textAlign:'center', paddingTop:'1rem' }}>
        

          <RobotAnimation isThinking={running}/>

          <h1 style={{ fontSize:38, fontWeight:800, color:'#111827', marginBottom:10, fontFamily:'"Space Grotesk",Inter,system-ui,sans-serif', letterSpacing:'-0.5px', lineHeight:1.15 }}>
            Autonomous Research<br/>
            <span style={{ background:'linear-gradient(135deg,#7c3aed,#4f46e5)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Agent</span>
          </h1>
          <p style={{ color:'#6b7280', fontSize:15, lineHeight:1.7, marginBottom:'2rem', fontFamily:'Inter,system-ui,sans-serif', maxWidth:480, margin:'0 auto 2rem' }}>
            Input a research topic and the agent autonomously retrieves academic papers, synthesises findings, identifies contradictions and delivers a structured literature review — in minutes.
          </p>
        </div>

        {/* Form */}
        {!running && !activeJob && (
          <>
            <form onSubmit={handleStart} style={{ display:'flex', gap:10, marginBottom:'1.5rem' }}>
              <div style={{ position:'relative', flex:1 }}>
                <Search size={16} style={{ position:'absolute', left:15, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
                <input className="s-input" value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Transformer attention mechanisms in NLP..."/>
              </div>
              <button type="submit" className="s-btn" disabled={!topic.trim()}>
                <ArrowRight size={15}/> Research
              </button>
            </form>
            <div style={{ marginBottom:'1.5rem' }}>
              <div style={{ fontSize:10, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10, fontFamily:'Inter,system-ui,sans-serif' }}>Try an example</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {EXAMPLE_TOPICS.map(t=><button key={t} className="t-chip" onClick={()=>setTopic(t)}>{t}</button>)}
              </div>
            </div>
          </>
        )}

        {error && (
          <div style={{ display:'flex', alignItems:'flex-start', gap:9, background:'#fef2f2', border:'1px solid #fecaca', borderRadius:12, padding:'11px 15px', marginBottom:'1rem' }}>
            <AlertCircle size={14} color="#dc2626" style={{ marginTop:1, flexShrink:0 }}/>
            <span style={{ fontSize:13, color:'#dc2626', fontFamily:'Inter,system-ui,sans-serif' }}>{error}</span>
          </div>
        )}

        {activeJob && (
          <div style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:18, padding:'1.5rem', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
            {running && (
              <form onSubmit={handleStart} style={{ display:'flex', gap:10, marginBottom:'1.25rem' }}>
                <div style={{ position:'relative', flex:1 }}>
                  <Search size={16} style={{ position:'absolute', left:15, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
                  <input className="s-input" style={{ opacity:0.5 }} value={topic} disabled placeholder="Research in progress..."/>
                </div>
                <button type="submit" className="s-btn" disabled>
                  <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Running
                </button>
              </form>
            )}

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'#111827', fontFamily:'Inter,system-ui,sans-serif' }}>
                  {done ? '✅ Research complete!' : '🔬 Running research pipeline...'}
                </div>
                <div style={{ fontSize:11, color:'#9ca3af', marginTop:3, fontFamily:'Inter,system-ui,sans-serif' }}>{activeJob.current_step||'Starting...'}</div>
              </div>
              <div style={{ fontSize:26, fontWeight:800, color:'#7c3aed', fontFamily:'Inter,system-ui,sans-serif' }}>{activeJob.progress||0}%</div>
            </div>

            <div style={{ width:'100%', height:6, background:'#f3f4f6', borderRadius:3, marginBottom:'1.1rem', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:3, background:'linear-gradient(90deg,#7c3aed,#4f46e5)', width:`${activeJob.progress||0}%`, transition:'width 0.7s ease', boxShadow:'0 0 8px rgba(124,58,237,0.4)' }}/>
            </div>

            <div>
              {STEPS.map((step,idx)=>{
                const status=getStepStatus(idx,activeJob.progress||0)
                return (
                  <div key={idx} className={`step-row step-${status}`}>
                    <span style={{ fontSize:14, flexShrink:0 }}>{step.emoji}</span>
                    {status==='done'    && <CheckCircle2 size={13} color="#059669" style={{ flexShrink:0 }}/>}
                    {status==='active'  && <Loader2 size={13} color="#7c3aed" style={{ flexShrink:0, animation:'spin 1s linear infinite' }}/>}
                    {status==='pending' && <div style={{ width:13, height:13, borderRadius:'50%', border:'1.5px solid #d1d5db', flexShrink:0 }}/>}
                    <span style={{ fontSize:12, fontFamily:'Inter,system-ui,sans-serif', color:status==='done'?'#9ca3af':status==='active'?'#111827':'#9ca3af', textDecoration:status==='done'?'line-through':'none', fontWeight:status==='active'?600:400 }}>{step.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}