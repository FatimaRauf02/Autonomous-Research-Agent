import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, FileText, Loader2, MessageSquare } from 'lucide-react'
import { queryPapers } from '../utils/api.js'

const SUGGESTIONS = [
  'What are the main findings?',
  'What methods are most commonly used?',
  'What contradictions exist in the literature?',
  'What are the open research problems?',
  'Which papers are most influential?',
]

function MessageBubble({ msg }) {
  const isBot = msg.role === 'bot'
  return (
    <div style={{ display:'flex', gap:10, justifyContent:isBot?'flex-start':'flex-end', marginBottom:14 }}>
      {isBot&&(
        <div style={{ width:30,height:30,borderRadius:10,background:'linear-gradient(135deg,#7c3aed,#4f46e5)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2 }}>
          <Bot size={14} color="white"/>
        </div>
      )}
      <div style={{ maxWidth:'72%' }}>
        <div style={{ borderRadius:isBot?'4px 16px 16px 16px':'16px 4px 16px 16px', padding:'12px 16px', background:isBot?'#f9fafb':'linear-gradient(135deg,#7c3aed,#4f46e5)', border:isBot?'1px solid #e5e7eb':'none', fontSize:13, color:isBot?'#374151':'white', lineHeight:1.7, fontFamily:'Inter,system-ui,sans-serif', whiteSpace:'pre-wrap' }}>
          {msg.text}
        </div>
        {msg.sources?.length>0&&(
          <div style={{ marginTop:6,padding:'8px 12px',background:'#f5f3ff',border:'1px solid #ddd6fe',borderRadius:10 }}>
            <div style={{ fontSize:10,color:'#9ca3af',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.06em',fontFamily:'Inter,system-ui,sans-serif' }}>Sources</div>
            {msg.sources.map((s,i)=>(
              <div key={i} style={{ display:'flex',alignItems:'center',gap:6,marginBottom:3 }}>
                <FileText size={10} color="#9ca3af"/>
                <span style={{ fontSize:11,color:'#6b7280',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',fontFamily:'Inter,system-ui,sans-serif' }}>{s.paper}</span>
                <span style={{ fontSize:10,color:'#4f46e5',flexShrink:0,fontFamily:'Inter,system-ui,sans-serif' }}>p.{s.page}</span>
                <span style={{ fontSize:10,color:'#7c3aed',flexShrink:0,fontFamily:'Inter,system-ui,sans-serif' }}>{(s.score*100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {!isBot&&(
        <div style={{ width:30,height:30,borderRadius:10,background:'#f3f4f6',border:'1px solid #e5e7eb',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2 }}>
          <User size={14} color="#6b7280"/>
        </div>
      )}
    </div>
  )
}

export default function QueryPage({ research }) {
  const{activeJob,report}=research
  const[messages,setMessages]=useState([{ role:'bot', text:'Ask me anything about the papers in your research job.' }])
  const[input,setInput]=useState('')
  const[loading,setLoading]=useState(false)
  const bottomRef=useRef(null)
  const jobId=activeJob?.job_id
  const hasJob=!!report

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[messages])

  const send=async(text)=>{
    const q=text||input.trim()
    if(!q||!jobId||loading)return
    setInput('')
    setMessages(prev=>[...prev,{role:'user',text:q}])
    setLoading(true)
    try{
      const result=await queryPapers(jobId,q)
      setMessages(prev=>[...prev,{role:'bot',text:result.answer,sources:result.sources||[]}])
    }catch{
      setMessages(prev=>[...prev,{role:'bot',text:'Error querying papers. Make sure a research job is complete.'}])
    }finally{setLoading(false)}
  }

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:'white'}}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes bounce-dot{0%,100%{transform:translateY(0);opacity:0.4}50%{transform:translateY(-5px);opacity:1}}
        .send-btn{background:linear-gradient(135deg,#7c3aed,#4f46e5);border:none;border-radius:12px;padding:10px 14px;color:white;cursor:pointer;display:flex;align-items:center;transition:all 0.2s;box-shadow:0 2px 8px rgba(124,58,237,0.3)}
        .send-btn:hover:not(:disabled){transform:scale(1.05);box-shadow:0 4px 12px rgba(124,58,237,0.4)}
        .send-btn:disabled{opacity:0.4;cursor:not-allowed;transform:none}
        .chat-input{flex:1;background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:14px;padding:11px 16px;color:#111827;font-size:13px;outline:none;font-family:'Inter',system-ui,sans-serif;transition:all 0.2s;resize:none}
        .chat-input::placeholder{color:#9ca3af}
        .chat-input:focus{border-color:#7c3aed;background:white;box-shadow:0 0 0 3px rgba(124,58,237,0.08)}
        .sug-chip{background:#f5f3ff;border:1px solid #ddd6fe;border-radius:20px;padding:5px 12px;font-size:11px;color:#5b21b6;cursor:pointer;font-family:'Inter',system-ui,sans-serif;font-weight:500;transition:all 0.15s}
        .sug-chip:hover{background:#ede9fe;border-color:#a78bfa}
      `}</style>

      {/* Header */}
      <div style={{padding:'14px 20px',borderBottom:'1px solid #f3f4f6',display:'flex',alignItems:'center',gap:10,background:'white'}}>
        <div style={{width:34,height:34,borderRadius:10,background:'linear-gradient(135deg,#7c3aed,#4f46e5)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <MessageSquare size={16} color="white"/>
        </div>
        <div>
          <div style={{fontSize:14,fontWeight:600,color:'#111827',fontFamily:'"Space Grotesk",Inter,system-ui,sans-serif'}}>Ask the Papers</div>
          <div style={{fontSize:11,color:'#9ca3af',fontFamily:'Inter,system-ui,sans-serif'}}>Hybrid RAG: Dense + BM25 + Cross-encoder reranking</div>
        </div>
        {!hasJob&&(
          <div style={{marginLeft:'auto',fontSize:11,color:'#d97706',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:20,padding:'4px 12px',fontFamily:'Inter,system-ui,sans-serif'}}>
            Complete a research job first
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:'auto',padding:'20px',background:'#fafafa'}}>
        {messages.map((m,i)=><MessageBubble key={i} msg={m}/>)}
        {loading&&(
          <div style={{display:'flex',gap:10,marginBottom:14}}>
            <div style={{width:30,height:30,borderRadius:10,background:'linear-gradient(135deg,#7c3aed,#4f46e5)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <Bot size={14} color="white"/>
            </div>
            <div style={{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:'4px 16px 16px 16px',padding:'14px 18px'}}>
              <div style={{display:'flex',gap:5}}>
                {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:'#7c3aed',animation:`bounce-dot 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Suggestions */}
      {messages.length<=1&&hasJob&&(
        <div style={{padding:'0 20px 10px',display:'flex',flexWrap:'wrap',gap:6,background:'#fafafa'}}>
          {SUGGESTIONS.map(s=><button key={s} className="sug-chip" onClick={()=>send(s)}>{s}</button>)}
        </div>
      )}

      {/* Input */}
      <div style={{padding:'12px 20px 20px',borderTop:'1px solid #f3f4f6',background:'white'}}>
        <div style={{display:'flex',gap:8,alignItems:'flex-end'}}>
          <textarea className="chat-input" rows={1} value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}}
            placeholder={hasJob?'Ask anything about the research...':'Complete a research job first'}
            disabled={!hasJob||loading}
          />
          <button className="send-btn" onClick={()=>send()} disabled={!input.trim()||!hasJob||loading}>
            {loading?<Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/>:<Send size={16}/>}
          </button>
        </div>
        <div style={{fontSize:10,color:'#9ca3af',marginTop:5,textAlign:'center',fontFamily:'Inter,system-ui,sans-serif'}}>
          Enter to send · Shift+Enter for new line
        </div>
      </div>
    </div>
  )
}