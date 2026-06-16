import { useState, useEffect, useRef } from "react"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

const AI_PROVIDERS = [
  { id:"gemini",  name:"Gemini",  badge:"FREE", desc:"Google AI · Free tier",   link:"https://aistudio.google.com/app/apikey" },
  { id:"groq",    name:"Groq",    badge:"FREE", desc:"Ultra fast · Free tier",  link:"https://console.groq.com/keys" },
  { id:"mistral", name:"Mistral", badge:"FREE", desc:"European AI · Free tier", link:"https://console.mistral.ai/api-keys" },
  { id:"cohere",  name:"Cohere",  badge:"FREE", desc:"Free tier",               link:"https://dashboard.cohere.com/api-keys" },
  { id:"claude",  name:"Claude",  badge:"PAID", desc:"Best quality",            link:"https://console.anthropic.com" },
  { id:"openai",  name:"OpenAI",  badge:"PAID", desc:"GPT-4o mini",             link:"https://platform.openai.com/api-keys" },
]

const QUALITY_OPTIONS = [
  { id:"turbo",    icon:"⚡", label:"Turbo",    res:"480p",  time:"~45s",  badge:"FASTEST"     },
  { id:"fast",     icon:"🚀", label:"Fast",     res:"720p",  time:"~1.5m", badge:"RECOMMENDED" },
  { id:"balanced", icon:"⚖️", label:"Balanced", res:"720p",  time:"~2.5m", badge:""            },
  { id:"hd",       icon:"🎥", label:"HD",       res:"1080p", time:"~4m",   badge:""            },
  { id:"ultra",    icon:"💎", label:"Ultra HD", res:"1440p", time:"~8m",   badge:""            },
]

const CLIP_LENGTHS = [
  { value:30, label:"30s", desc:"Very short" },
  { value:45, label:"45s", desc:"Quick"      },
  { value:60, label:"60s", desc:"Standard"   },
  { value:90, label:"90s", desc:"Long form"  },
]

function CookiesPanel() {
  const [status,    setStatus]    = useState(null)
  const [uploading, setUploading] = useState(false)
  const [msg,       setMsg]       = useState("")
  const fileRef = useRef(null)

  useEffect(() => {
    fetch(`${API}/api/cookies-status`).then(r=>r.json()).then(setStatus).catch(()=>{})
  }, [])

  async function upload(e) {
    const file = e.target.files[0]; if (!file) return
    setUploading(true); setMsg("")
    const fd = new FormData(); fd.append("file", file)
    try {
      await fetch(`${API}/api/upload-cookies`, {method:"POST", body:fd})
      setMsg("✅ Cookies uploaded! YouTube downloads will now work reliably.")
      setStatus({has_cookies:true})
    } catch { setMsg("❌ Upload failed") }
    setUploading(false)
  }

  async function removeCookies() {
    await fetch(`${API}/api/cookies`, {method:"DELETE"})
    setStatus({has_cookies:false}); setMsg("Cookies removed.")
  }

  return (
    <div className={`cookies-panel ${status?.has_cookies ? "active" : ""}`}>
      <div className="cookies-header">
        <span className="cookies-icon">{status?.has_cookies ? "🔓" : "🔒"}</span>
        <div className="cookies-text">
          <strong>{status?.has_cookies ? "YouTube cookies loaded ✓" : "YouTube Bot Protection Fix"}</strong>
          <span>{status?.has_cookies ? "All YouTube videos will download reliably" : "Upload cookies.txt to fix bot detection errors"}</span>
        </div>
        {status?.has_cookies
          ? <button className="cookies-remove-btn" onClick={removeCookies}>Remove</button>
          : <button className="cookies-upload-btn" onClick={() => fileRef.current?.click()}>
              {uploading ? "Uploading..." : "Upload cookies.txt"}
            </button>
        }
        <input ref={fileRef} type="file" accept=".txt" style={{display:"none"}} onChange={upload}/>
      </div>
      {!status?.has_cookies && (
        <div className="cookies-steps">
          <p className="cookies-how">How to get cookies.txt:</p>
          <ol>
            <li>Install Chrome extension: <a href="https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc" target="_blank" rel="noreferrer">"Get cookies.txt LOCALLY"</a></li>
            <li>Go to <a href="https://youtube.com" target="_blank" rel="noreferrer">youtube.com</a> while logged in</li>
            <li>Click the extension → "Export" → save as <strong>cookies.txt</strong></li>
            <li>Upload it here ↑</li>
          </ol>
        </div>
      )}
      {msg && <p className="cookies-msg">{msg}</p>}
    </div>
  )
}


function AdSlot({ type = "banner" }) {
  const sizes = {
    banner:  { height: "90px",  label: "Banner Ad (728x90)" },
    sidebar: { height: "250px", label: "Sidebar Ad (300x250)" },
  }
  const s = sizes[type]
  return (
    <div className={`ad-slot ad-slot-${type}`} style={{minHeight: s.height}}>
      <div className="ad-placeholder">
        <span>{s.label}</span>
        <small>Ad space — AdSense pending approval</small>
      </div>
    </div>
  )
}

export default function Dashboard({ jobs, setJobs }) {
  const [url,        setUrl]        = useState("")
  const [provider,   setProvider]   = useState("groq")
  const [quality,    setQuality]    = useState("fast")
  const [clipLength, setClipLength] = useState(60)
  const [zoomCrop,   setZoomCrop]   = useState(true)
  const [numShorts,  setNumShorts]  = useState(3)
  const [activeJob,  setActiveJob]  = useState(null)
  const [polling,    setPolling]    = useState(false)
  const [showKey,    setShowKey]    = useState(false)
  const [apiKey,     setApiKey]     = useState(() => {
    try { return JSON.parse(localStorage.getItem("clippio_keys") || "{}") } catch { return {} }
  })
  const pollRef  = useRef(null)
  const clipsRef = useRef(null)

  const curProvider = AI_PROVIDERS.find(p => p.id === provider)
  const curQuality  = QUALITY_OPTIONS.find(q => q.id === quality)

  function saveKey(val) {
    const u = { ...apiKey, [provider]: val }
    setApiKey(u)
    localStorage.setItem("clippio_keys", JSON.stringify(u))
  }

  useEffect(() => {
    if (!activeJob || !polling) return
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${API}/api/jobs/${activeJob}`)
        const data = await res.json()
        setJobs(prev => {
          const idx = prev.findIndex(j => j.job_id === data.job_id)
          if (idx >= 0) { const n = [...prev]; n[idx] = data; return n }
          return [data, ...prev]
        })
        if (data.status === "done" || data.status === "error") {
          setPolling(false)
          clearInterval(pollRef.current)
          if (data.status === "done")
            setTimeout(() => clipsRef.current?.scrollIntoView({behavior:"smooth", block:"start"}), 400)
        }
      } catch(e) { console.error(e) }
    }, 1200)
    return () => clearInterval(pollRef.current)
  }, [activeJob, polling])

  const currentJob = jobs.find(j => j.job_id === activeJob)

  async function handleSubmit() {
    if (!url.trim())               return alert("Please enter a YouTube URL")
    if (!apiKey[provider]?.trim()) return alert(`Please enter your ${curProvider.name} API key`)
    try {
      const res = await fetch(`${API}/api/jobs`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          youtube_url:  url,
          num_shorts:   numShorts,
          ai_provider:  provider,
          api_key:      apiKey[provider],
          quality,
          zoom_crop:    zoomCrop,
          clip_length:  clipLength,
        })
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Failed") }
      const { job_id } = await res.json()
      setActiveJob(job_id); setPolling(true); setUrl("")
    } catch(e) { alert(e.message) }
  }

  return (
    <div className="dashboard">

      <div className="page-header">
        <h1>Create Shorts <span className="accent">✦</span></h1>
        <p>AI finds the best moments and auto-cuts vertical 9:16 clips ready to upload</p>
      </div>

      <AdSlot type="banner"/>

      <div className="capcut-banner">
        <span className="capcut-icon">✏️</span>
        <span>
          <strong>Want captions?</strong> Open clips in&nbsp;
          <a href="https://www.capcut.com" target="_blank" rel="noreferrer" className="capcut-link">CapCut</a>
          &nbsp;→ <strong>Text → Auto Captions</strong> for free trending subtitles!
        </span>
      </div>

      <CookiesPanel/>

      <div className="card input-card">

        {/* AI Provider */}
        <div className="card-section">
          <label className="field-label">AI Provider</label>
          <div className="provider-grid">
            {AI_PROVIDERS.map(p => (
              <button key={p.id}
                className={`provider-btn ${provider === p.id ? "selected" : ""}`}
                onClick={() => setProvider(p.id)}>
                <span className="provider-name">{p.name}</span>
                <span className={`provider-badge ${p.badge === "FREE" ? "free" : "paid"}`}>{p.badge}</span>
              </button>
            ))}
          </div>
          <p className="provider-desc">
            {curProvider.desc} —&nbsp;
            <a href={curProvider.link} target="_blank" rel="noreferrer" className="get-key-link">Get key →</a>
          </p>
        </div>

        {/* Quality + Clip Length */}
        <div className="card-row">
          <div className="card-section" style={{flex:2}}>
            <label className="field-label">
              Output Quality
              <span className="quality-hint">{curQuality.icon} {curQuality.res} · {curQuality.time}</span>
            </label>
            <div className="quality-grid">
              {QUALITY_OPTIONS.map(q => (
                <button key={q.id}
                  className={`quality-btn ${quality === q.id ? "selected" : ""}`}
                  onClick={() => setQuality(q.id)}>
                  <div className="quality-top">
                    <span className="quality-icon">{q.icon}</span>
                    {q.badge && <span className="quality-badge">{q.badge}</span>}
                  </div>
                  <span className="quality-label">{q.label}</span>
                  <span className="quality-res">{q.res}</span>
                  <span className="quality-time">{q.time}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="card-section" style={{flex:1}}>
            <label className="field-label">Clip Length</label>
            <div className="clip-length-grid">
              {CLIP_LENGTHS.map(c => (
                <button key={c.value}
                  className={`clip-len-btn ${clipLength === c.value ? "selected" : ""}`}
                  onClick={() => setClipLength(c.value)}>
                  <span className="cl-label">{c.label}</span>
                  <span className="cl-desc">{c.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* URL */}
        <div className="card-section">
          <label className="field-label">YouTube URL</label>
          <input className="field-input"
            placeholder="https://youtube.com/watch?v=..."
            value={url} onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}/>
        </div>

        {/* Zoom toggle */}
        <div className="toggles-row">
          <ToggleSwitch icon="🔍" label="Zoom & Crop to Fill"
            sublabel="No black bars, fills 9:16"
            checked={zoomCrop} onChange={setZoomCrop}/>
        </div>

        {/* API Key + Num Shorts */}
        <div className="card-row">
          <div className="card-section half">
            <label className="field-label">{curProvider.name} API Key</label>
            <div className="key-input-row">
              <input className="field-input"
                type={showKey ? "text" : "password"}
                placeholder={`Paste your ${curProvider.name} key...`}
                value={apiKey[provider] || ""}
                onChange={e => saveKey(e.target.value)}/>
              <button className="icon-btn" onClick={() => setShowKey(!showKey)}>
                {showKey ? "🙈" : "👁"}
              </button>
            </div>
          </div>
          <div className="card-section half">
            <label className="field-label">Number of Shorts</label>
            <div className="num-selector">
              {[1,2,3,4,5].map(n => (
                <button key={n}
                  className={`num-btn ${numShorts === n ? "selected" : ""}`}
                  onClick={() => setNumShorts(n)}>{n}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="summary-banner">
          <span>{curQuality.icon} <strong>{curQuality.res}</strong></span>
          <span className="sum-dot">·</span>
          <span>⏱ <strong>{clipLength}s</strong> clips</span>
          <span className="sum-dot">·</span>
          <span>{zoomCrop ? "🔍 Zoom Crop" : "📦 Letterbox"}</span>
          <span className="sum-dot">·</span>
          <span className="sum-time">Est. {curQuality.time}</span>
        </div>

        <button className={`submit-btn ${polling ? "loading" : ""}`}
          onClick={handleSubmit} disabled={polling}>
          {polling
            ? <><span className="spinner"/> Processing...</>
            : <><span>⚡</span> Generate {numShorts} Short{numShorts > 1 ? "s" : ""}</>}
        </button>

      </div>

      {/* Job Progress */}
      {currentJob && (
        <div className={`card job-card ${currentJob.status}`}>
          <div className="job-header">
            <div className="job-info">
              <span className={`status-dot ${currentJob.status}`}/>
              <span className="job-title">{currentJob.video_title || "Processing video..."}</span>
            </div>
            <span className="job-pct">{currentJob.progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{width:`${currentJob.progress}%`}}/>
          </div>
          <p className="job-step">
            {currentJob.status === "error" ? `❌ ${currentJob.error}` : `⚙ ${currentJob.step}`}
          </p>
        </div>
      )}

      {/* Clips */}
      {currentJob?.clips?.length > 0 && (
        <div className="clips-section-outer" ref={clipsRef}>
          <div className="clips-heading-row">
            <h3 className="clips-heading">🎉 Your Shorts are Ready!</h3>
            <div style={{display:"flex", gap:8, alignItems:"center"}}>
              <span className="clips-count">{currentJob.clips.length} clip{currentJob.clips.length > 1 ? "s" : ""}</span>
              <a href={`${API}/api/jobs/${currentJob.job_id}/download-all`}
                className="download-all-btn" download>
                ⬇ Download All ZIP
              </a>
            </div>
          </div>
          <div className="capcut-inline-tip">
            ✏️ <strong>Add captions free:</strong> Open in&nbsp;
            <a href="https://www.capcut.com" target="_blank" rel="noreferrer"
              style={{color:"#00e676", textDecoration:"none", fontWeight:600}}>CapCut</a>
            &nbsp;→ Text → Auto Captions. SRT subtitle file included in ZIP!
          </div>
          <div className="clips-grid">
            {currentJob.clips.map((clip, i) => (
              <ClipCard key={i} clip={clip} index={i}
                jobId={currentJob.job_id} setJobs={setJobs}/>
            ))}
          </div>
        </div>
      )}

      {/* How it works */}
      {!currentJob && (
        <div className="how-it-works">
          <h3>How it works</h3>
          <div className="steps-row">
            {[
              {icon:"🔗", title:"Paste URL",    desc:"Any YouTube link"},
              {icon:"🤖", title:"AI Picks",     desc:"Finds viral moments"},
              {icon:"✂️",  title:"Auto Cut",     desc:"9:16 clips in parallel"},
              {icon:"📱", title:"Upload Ready", desc:"Direct to YouTube Shorts"},
            ].map((s, i) => (
              <div key={i} className="step-item">
                <span className="step-icon">{s.icon}</span>
                <strong>{s.title}</strong>
                <span>{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

function ToggleSwitch({ icon, label, sublabel, checked, onChange }) {
  return (
    <div className={`toggle-item ${checked ? "on" : ""}`} onClick={() => onChange(!checked)}>
      <span className="toggle-icon">{icon}</span>
      <div className="toggle-text">
        <span className="toggle-label">{label}</span>
        <span className="toggle-sub">{sublabel}</span>
      </div>
      <div className={`toggle-switch ${checked ? "on" : ""}`}>
        <div className="toggle-knob"/>
      </div>
    </div>
  )
}

function ClipCard({ clip, index, jobId, setJobs }) {
  const videoRef = useRef(null)
  const [playing,  setPlaying]  = useState(false)
  const [loaded,   setLoaded]   = useState(false)
  const [videoErr, setVideoErr] = useState(false)
  const [editing,  setEditing]  = useState(false)
  const [title,    setTitle]    = useState(clip.title)
  const [copied,   setCopied]   = useState(false)
  const src = `${API}${clip.url}`

  function togglePlay() {
    if (!videoRef.current) return
    if (playing) { videoRef.current.pause(); setPlaying(false) }
    else         { videoRef.current.play().catch(()=>{}); setPlaying(true) }
  }

  async function saveTitle() {
    try {
      await fetch(`${API}/api/jobs/${jobId}/clips/${index}/rename`, {
        method: "PATCH",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({new_title: title})
      })
      setJobs(prev => prev.map(j => {
        if (j.job_id !== jobId) return j
        const clips = [...j.clips]
        clips[index] = {...clips[index], title}
        return {...j, clips}
      }))
      setEditing(false)
    } catch { alert("Failed to rename") }
  }

  function copyLink() {
    navigator.clipboard.writeText(src)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const score = clip.virality_score || 7
  const scoreColor = score >= 9 ? "#c8f135" : score >= 7 ? "#7ef2c8" : "#8a8fa8"

  if (clip.status === "error") return (
    <div className="clip-card error">
      <p>⚠ {clip.title}</p>
      <small>{clip.error}</small>
    </div>
  )

  return (
    <div className="clip-card">
      <div className="clip-video-wrap" onClick={loaded ? togglePlay : undefined}>
        {!loaded && !videoErr && (
          <div className="clip-loading">
            <span className="spinner" style={{borderTopColor:"var(--accent)"}}/>
          </div>
        )}
        {videoErr && (
          <div className="clip-loading">
            <span style={{fontSize:12, color:"var(--text3)", textAlign:"center", padding:"0 12px"}}>
              Restart backend to preview
            </span>
          </div>
        )}
        <video ref={videoRef} src={src} className="clip-video"
          onCanPlay={() => setLoaded(true)}
          onError={() => setVideoErr(true)}
          onEnded={() => setPlaying(false)}
          style={{opacity: loaded ? 1 : 0}}
          playsInline preload="metadata"/>
        {loaded && (
          <div className={`play-overlay ${playing ? "hidden" : ""}`}>
            <span className="play-icon">▶</span>
          </div>
        )}
        <div className="clip-duration">{clip.duration}s</div>
        <div className="clip-virality" style={{color: scoreColor}}>🔥{score}/10</div>
      </div>

      <div className="clip-meta">
        {editing ? (
          <div className="title-edit-row">
            <input className="title-edit-input" value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveTitle()} autoFocus/>
            <button className="title-save-btn" onClick={saveTitle}>✓</button>
            <button className="title-cancel-btn" onClick={() => { setEditing(false); setTitle(clip.title) }}>✕</button>
          </div>
        ) : (
          <div className="title-row">
            <p className="clip-title">{title}</p>
            <button className="edit-btn" onClick={() => setEditing(true)} title="Rename">✏️</button>
          </div>
        )}
        <p className="clip-hook">"{clip.hook}"</p>
        <div className="clip-actions-row">
          <a href={src} download={clip.filename} className="download-btn" style={{flex:1}}>
            ⬇ Download <span className="size">{clip.size_mb} MB</span>
          </a>
          <button className={`icon-action-btn ${copied ? "copied" : ""}`} onClick={copyLink} title="Copy link">
            {copied ? "✓" : "🔗"}
          </button>
          {clip.srt_url && (
            <a href={`${API}${clip.srt_url}`} download className="icon-action-btn" title="Download SRT">
              💬
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
