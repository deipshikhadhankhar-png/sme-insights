import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'

const AIRTABLE_TOKEN   = 'YOUR_AIRTABLE_API_TOKEN'
const AIRTABLE_BASE_ID = 'YOUR_BASE_ID'
const AIRTABLE_TABLE   = 'Submissions'

const ACTIONS   = ['Draft article','Schedule interview','Request quote','Publish profile','Send for review','Archive']
const PRIORITIES = ['High','Medium','Low']
const TEAMS     = ['Content','Marketing','Product','Engineering','Sales','Design','Research','Operations']
const REGIONS   = ['UK','EMEA','North America','APAC','LATAM','Global']

const empty = () => ({smeName:'',role:'',company:'',linkedin:'',team:'',region:'',articleName:'',questions:[{q:'',a:''}],action:'',priority:'Medium',status:'To do'})

async function save(entry) {
  const qa = entry.questions.filter(q=>q.q.trim()).map((q,i)=>`Q${i+1}: ${q.q}\nA: ${q.a}`).join('\n\n')
  const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`,{method:'POST',headers:{'Authorization':`Bearer ${AIRTABLE_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({fields:{'SME Name':entry.smeName,'Role':entry.role,'Company':entry.company,'LinkedIn':entry.linkedin,'Team':entry.team,'Region':entry.region,'Article Name':entry.articleName,'Questions & Answers':qa,'Action':entry.action,'Priority':entry.priority,'Status':entry.status,'Submitted At':new Date().toISOString()}})})
  if(!res.ok) throw new Error(res.status)
}

function App() {
  const [form,setForm] = useState(empty())
  const [locked,setLocked] = useState(false)
  const [errors,setErrors] = useState({})
  const [st,setSt] = useState('idle')
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const setQ = (i,f,v) => setForm(x=>({...x,questions:x.questions.map((q,j)=>j===i?{...q,[f]:v}:q)}))
  const validate = () => {
    const e={}
    if(!form.articleName.trim())e.articleName='Required'
    if(!form.smeName.trim())e.smeName='Required'
    if(!form.role?.trim())e.role='Required'
    if(!form.action)e.action='Required'
    if(!form.questions.some(q=>q.q.trim()&&q.a.trim()))e.questions='At least one question + answer required'
    return e
  }
  const submit = async () => {
    const e=validate();if(Object.keys(e).length){setErrors(e);return}
    setErrors({});setSt('saving')
    try{await save(form);setSt('success')}
    catch(err){console.error(err);setSt('error');setTimeout(()=>setSt('idle'),3000)}
  }
  const inp = (err) => ({style:{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${err?'#E24B4A':'#ddd'}`,fontSize:14,outline:'none',color:'#111',background:'#fff',boxSizing:'border-box'}})
  const lbl = {display:'block',fontSize:13,fontWeight:600,color:'#333',marginBottom:6}
  const err = {fontSize:12,color:'#E24B4A',marginTop:4}

  if(st==='success') return <div style={{textAlign:'center',padding:'4rem 2rem'}}><div style={{fontSize:48,marginBottom:16}}>✓</div><h2 style={{fontSize:20,fontWeight:600,marginBottom:8}}>Insight submitted</h2><p style={{color:'#666',fontSize:14}}>Thank you — your response has been recorded.</p></div>

  return (
    <div style={{fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',maxWidth:680,margin:'0 auto'}}>
      <h1 style={{fontSize:24,fontWeight:700,marginBottom:4}}>SME Input Tool</h1>
      <p style={{fontSize:14,color:'#666',marginBottom:24}}>Share your expert insight in 5 minutes.</p>

      <div style={{border:'1px solid #e5e5e5',borderRadius:12,padding:'14px 16px',marginBottom:20}}>
        <p style={{fontSize:13,color:'#888',marginBottom:10}}>🔒 Admin — set before sharing</p>
        <label style={lbl}>Topic / Article Name *</label>
        <div style={{display:'flex',gap:8}}>
          <input value={form.articleName} onChange={e=>set('articleName',e.target.value)} disabled={locked} placeholder="e.g. Content Marketing Strategy" {...inp(errors.articleName)} style={{...inp(errors.articleName).style,flex:1,opacity:locked?0.6:1}}/>
          <button onClick={()=>{if(!form.articleName.trim())return;setLocked(l=>!l)}} style={{padding:'0 20px',borderRadius:10,border:'none',fontWeight:600,fontSize:14,background:locked?'#f0f0f0':'#2563EB',color:locked?'#333':'#fff',cursor:'pointer'}}>{locked?'Unlock':'Lock'}</button>
        </div>
        {errors.articleName&&<p style={err}>{errors.articleName}</p>}
      </div>

      <div style={{borderTop:'1px solid #eee',margin:'20px 0 16px',paddingTop:16,fontSize:15,fontWeight:600}}>Context</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        <div><label style={lbl}>SME Name *</label><input value={form.smeName} onChange={e=>set('smeName',e.target.value)} placeholder="Jane Doe" {...inp(errors.smeName)}/>{errors.smeName&&<p style={err}>{errors.smeName}</p>}</div>
        <div><label style={lbl}>Role *</label><input value={form.role||''} onChange={e=>set('role',e.target.value)} placeholder="Senior Product Manager" {...inp(errors.role)}/>{errors.role&&<p style={err}>{errors.role}</p>}</div>
      </div>
      <div style={{marginBottom:14}}><label style={lbl}>LinkedIn Profile</label><input value={form.linkedin} onChange={e=>set('linkedin',e.target.value)} placeholder="https://linkedin.com/in/..." {...inp(false)}/></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        <div><label style={lbl}>Team / Pod</label><select value={form.team} onChange={e=>set('team',e.target.value)} {...inp(false)}><option value="">Select team</option>{TEAMS.map(t=><option key={t}>{t}</option>)}</select></div>
        <div><label style={lbl}>Region</label><select value={form.region} onChange={e=>set('region',e.target.value)} {...inp(false)}><option value="">Select region</option>{REGIONS.map(r=><option key={r}>{r}</option>)}</select></div>
      </div>

      <div style={{borderTop:'1px solid #eee',margin:'20px 0 16px',paddingTop:16,fontSize:15,fontWeight:600}}>Questions &amp; insights</div>
      {errors.questions&&<p style={{...err,marginBottom:12}}>{errors.questions}</p>}
      {form.questions.map((item,i)=>(
        <div key={i} style={{border:'1px solid #e5e5e5',borderRadius:12,padding:'14px 16px',marginBottom:12}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
            <span style={{fontSize:13,fontWeight:600,color:'#555'}}>Question {i+1}</span>
            {form.questions.length>1&&<button onClick={()=>setForm(f=>({...f,questions:f.questions.filter((_,j)=>j!==i)}))} style={{fontSize:12,color:'#888',background:'none',border:'none',cursor:'pointer'}}>Remove</button>}
          </div>
          <input value={item.q} onChange={e=>setQ(i,'q',e.target.value)} placeholder="e.g. What is your biggest challenge with…" {...inp(false)} style={{...inp(false).style,marginBottom:10}}/>
          <label style={lbl}>Answer / insight</labe
