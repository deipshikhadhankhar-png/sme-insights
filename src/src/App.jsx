import { useState } from 'react'

// ─── REPLACE THESE TWO VALUES ───────────────────────────────────────────────
const AIRTABLE_TOKEN   = 'YOUR_AIRTABLE_API_TOKEN'   // from airtable.com/create/tokens
const AIRTABLE_BASE_ID = 'YOUR_BASE_ID'               // from the URL: airtable.com/YOUR_BASE_ID/...
const AIRTABLE_TABLE   = 'Submissions'
// ────────────────────────────────────────────────────────────────────────────

const ACTIONS  = ['Draft article','Schedule interview','Request quote','Publish profile','Send for review','Archive']
const PRIORITIES = ['High','Medium','Low']
const STATUSES = ['To do','In progress','Done']
const TEAMS    = ['Content','Marketing','Product','Engineering','Sales','Design','Research','Operations']
const REGIONS  = ['UK','EMEA','North America','APAC','LATAM','Global']

const empty = () => ({
  smeName:'', role:'', company:'', linkedin:'',
  team:'', region:'', articleName:'',
  questions:[{ q:'', a:'' }],
  action:'', priority:'Medium', status:'To do'
})

async function saveToAirtable(entry) {
  const qaPairs = entry.questions
    .filter(q => q.q.trim())
    .map((q, i) => `Q${i+1}: ${q.q}\nA: ${q.a}`)
    .join('\n\n')

  const fields = {
    'SME Name':              entry.smeName,
    'Role':                  entry.role,
    'Company':               entry.company,
    'LinkedIn':              entry.linkedin,
    'Team':                  entry.team,
    'Region':                entry.region,
    'Article Name':          entry.articleName,
    'Questions & Answers':   qaPairs,
    'Action':                entry.action,
    'Priority':              entry.priority,
    'Status':                entry.status,
    'Submitted At':          new Date().toISOString(),
  }

  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ fields }),
    }
  )
  if (!res.ok) throw new Error(`Airtable error: ${res.status}`)
  return res.json()
}

const s = {
  inp: (err) => ({
    style: {
      width:'100%', padding:'10px 14px', borderRadius:10,
      border: `1px solid ${err ? '#E24B4A' : '#ddd'}`,
      fontSize:14, outline:'none', color:'#111', background:'#fff'
    }
  }),
  sel: () => ({ style:{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid #ddd', fontSize:14, color:'#111', background:'#fff' }}),
  lbl: { display:'block', fontSize:13, fontWeight:600, color:'#333', marginBottom:6 },
  err: { fontSize:12, color:'#E24B4A', marginTop:4 },
  row: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 },
  card: { border:'1px solid #e5e5e5', borderRadius:12, padding:'14px 16px', marginBottom:12 },
  div: { borderTop:'1px solid #eee', margin:'22px 0 16px', paddingTop:16, fontSize:15, fontWeight:600, color:'#111' },
}

export default function App() {
  const [form, setForm]       = useState(empty())
  const [locked, setLocked]   = useState(false)
  const [errors, setErrors]   = useState({})
  const [status, setStatus]   = useState('idle') // idle | saving | success | error

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setQ = (i, field, v) => setForm(f => ({ ...f, questions: f.questions.map((q,j) => j===i ? {...q,[field]:v} : q) }))

  const validate = () => {
    const e = {}
    if (!form.articleName.trim()) e.articleName = 'Required'
    if (!form.smeName.trim())     e.smeName     = 'Required'
    if (!form.role?.trim())       e.role        = 'Required'
    if (!form.action)             e.action      = 'Required'
    if (!form.questions.some(q => q.q.trim() && q.a.trim())) e.questions = 'At least one question + answer required'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setStatus('saving')
    try {
      await saveToAirtable(form)
      setStatus('success')
      setTimeout(() => { setStatus('idle'); setForm(empty()); setLocked(false) }, 2500)
    } catch (err) {
      console.error(err)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  if (status === 'success') return (
    <div style={{ textAlign:'center', padding:'4rem 2rem' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>✓</div>
      <h2 style={{ fontSize:20, fontWeight:600, marginBottom:8 }}>Insight submitted</h2>
      <p style={{ color:'#666', fontSize:14 }}>Thank you — your response has been recorded.</p>
    </div>
  )

  return (
    <div style={{ fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', maxWidth:680, margin:'0 auto' }}>
      <h1 style={{ fontSize:24, fontWeight:700, marginBottom:4 }}>SME Input Tool</h1>
      <p style={{ fontSize:14, color:'#666', marginBottom:24 }}>Share your expert insight for this topic in 5 minutes.</p>

      {/* Admin lock */}
      <div style={s.card}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, color:'#888', fontSize:13 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="6" width="10" height="7" rx="2" stroke="#888" strokeWidth="1.2"/><path d="M4 6V4.5a3 3 0 016 0V6" stroke="#888" strokeWidth="1.2"/></svg>
          Admin — set before sharing
        </div>
        <label style={s.lbl}>Topic / Article Name <span style={{color:'#E24B4A'}}>*</span></label>
        <div style={{ display:'flex', gap:8 }}>
          <input value={form.articleName} onChange={e=>set('articleName',e.target.value)} disabled={locked}
            placeholder="e.g. Content Marketing Strategy"
            {...s.inp(errors.articleName)} style={{...s.inp(errors.articleName).style, flex:1, opacity:locked?0.6:1}} />
          <button onClick={()=>{ if(!form.articleName.trim()) return; setLocked(l=>!l) }}
            style={{ padding:'0 20px', borderRadius:10, border:'none', fontWeight:600, fontSize:14,
              background: locked ? '#f0f0f0' : '#2563EB', color: locked ? '#333' : '#fff' }}>
            {locked ? 'Unlock' : 'Lock'}
          </button>
        </div>
        {errors.articleName && <p style={s.err}>{errors.articleName}</p>}
      </div>

      <div style={s.div}>Context</div>
      <div style={s.row}>
        <div>
          <label style={s.lbl}>SME Name <span style={{color:'#E24B4A'}}>*</span></label>
          <input value={form.smeName} onChange={e=>set('smeName',e.target.value)} placeholder="Jane Doe" {...s.inp(errors.smeName)} />
          {errors.smeName && <p style={s.err}>{errors.smeName}</p>}
        </div>
        <div>
          <label style={s.lbl}>Role <span style={{color:'#E24B4A'}}>*</span></label>
          <input value={form.role||''} onChange={e=>set('role',e.target.value)} placeholder="Senior Product Manager" {...s.inp(errors.role)} />
          {errors.role && <p style={s.err}>{errors.role}</p>}
        </div>
      </div>
      <div style={{ marginBottom:14 }}>
        <label style={s.lbl}>LinkedIn Profile</label>
        <input value={form.linkedin} onChange={e=>set('linkedin',e.target.value)} placeholder="https://linkedin.com/in/..." {...s.inp(false)} />
      </div>
      <div style={s.row}>
        <div>
          <label style={s.lbl}>Team / Pod</label>
          <select value={form.team} onChange={e=>set('team',e.target.value)} {...s.sel()}>
            <option value="">Select team</option>
            {TEAMS.map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={s.lbl}>Region</label>
          <select value={form.region} onChange={e=>set('region',e.target.value)} {...s.sel()}>
            <option value="">Select region</option>
            {REGIONS.map(r=><option key={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div style={s.div}>Questions &amp; insights</div>
      {errors.questions && <p style={{...s.err, marginBottom:12}}>{errors.questions}</p>}
      {form.questions.map((item,i) => (
        <div key={i} style={s.card}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:13, fontWeight:600, color:'#555' }}>Question {i+1}</span>
            {form.questions.length > 1 &&
              <button onClick={()=>setForm(f=>({...f,questions:f.questions.filter((_,j)=>j!==i)}))}
                style={{ fontSize:12, color:'#888', background:'none', border:'none', padding:0 }}>Remove</button>}
          </div>
          <input value={item.q} onChange={e=>setQ(i,'q',e.target.value)}
            placeholder="e.g. What is your biggest challenge with…"
            {...s.inp(false)} style={{...s.inp(false).style, marginBottom:10}} />
          <label style={s.lbl}>Answer / insight</label>
          <textarea value={item.a} onChange={e=>setQ(i,'a',e.target.value)}
            placeholder="Your response here…" rows={3}
            style={{...s.inp(false).style, resize:'vertical', lineHeight:1.6}} />
        </div>
      ))}
      <button onClick={()=>setForm(f=>({...f,questions:[...f.questions,{q:'',a:''}]}))}
        style={{ fontSize:13, color:'#2563EB', background:'none', border:'none', padding:'0 0 20px', display:'block' }}>
        + Add question
      </button>

      <div style={s.div}>Action</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:24 }}>
        <div>
          <label style={s.lbl}>Action for content manager <span style={{color:'#E24B4A'}}>*</span></label>
          <select value={form.action} onChange={e=>set('action',e.target.value)}
            style={{...s.sel().style, borderColor: errors.action ? '#E24B4A' : '#ddd'}}>
            <option value="">Select…</option>
            {ACTIONS.map(a=><option key={a}>{a}</option>)}
          </select>
          {errors.action && <p style={s.err}>{errors.action}</p>}
        </div>
        <div>
          <label style={s.lbl}>Priority</label>
          <select value={form.priority} onChange={e=>set('priority',e.target.value)} {...s.sel()}>
            {PRIORITIES.map(p=><option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label style={s.lbl}>Status</label>
          <select value={form.status} onChange={e=>set('status',e.target.value)} {...s.sel()}>
            {STATUSES.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {status === 'error' && (
        <p style={{ color:'#E24B4A', fontSize:13, marginBottom:12 }}>
          Something went wrong — check your Airtable credentials and try again.
        </p>
      )}

      <button onClick={handleSubmit} disabled={status==='saving'}
        style={{ padding:'12px 32px', fontSize:14, fontWeight:600, borderRadius:10, border:'none',
          background: status==='saving' ? '#93c5fd' : '#2563EB', color:'#fff',
          opacity: status==='saving' ? 0.8 : 1, width:'100%' }}>
        {status === 'saving' ? 'Submitting…' : 'Submit insight →'}
      </button>
    </div>
  )
}
