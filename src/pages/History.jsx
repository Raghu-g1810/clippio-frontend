const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

export default function History({ jobs, setJobs }) {
  async function deleteJob(job_id) {
    try {
      await fetch(`${API}/api/jobs/${job_id}`, { method:"DELETE" })
      setJobs(prev => prev.filter(j => j.job_id !== job_id))
    } catch(e) { alert("Failed to delete") }
  }

  const done    = jobs.filter(j => j.status === "done")
  const other   = jobs.filter(j => j.status !== "done")
  const allJobs = [...other, ...done]

  if (allJobs.length === 0) return (
    <div className="dashboard">
      <div className="page-header">
        <h1>My Clips <span className="accent">🎬</span></h1>
        <p>Your processed shorts appear here</p>
      </div>
      <div className="empty-state">
        <span className="empty-icon">🎞️</span>
        <p>No clips yet — go create your first shorts!</p>
      </div>
    </div>
  )

  const totalClips = done.reduce((s,j) => s + (j.clips?.length||0), 0)
  const totalMB    = done.reduce((s,j) => s + (j.clips||[]).reduce((a,c) => a+(c.size_mb||0),0), 0)

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>My Clips <span className="accent">🎬</span></h1>
        <p>{allJobs.length} job{allJobs.length!==1?"s":""} · {totalClips} clips · {totalMB.toFixed(1)} MB total</p>
      </div>

      {/* Stats row */}
      {totalClips > 0 && (
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-num">{done.length}</span>
            <span className="stat-label">Jobs Done</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{totalClips}</span>
            <span className="stat-label">Clips Generated</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{totalMB.toFixed(0)}MB</span>
            <span className="stat-label">Total Size</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{done.reduce((s,j)=>s+(j.video_duration||0),0) > 0 ? Math.round(done.reduce((s,j)=>s+(j.video_duration||0),0)/60)+"m" : "—"}</span>
            <span className="stat-label">Video Processed</span>
          </div>
        </div>
      )}

      <div className="history-list">
        {allJobs.map(job => (
          <div key={job.job_id} className={`card history-card ${job.status}`}>
            <div className="history-header">
              <div style={{flex:1,minWidth:0}}>
                <p className="history-title">{job.video_title || "Processing..."}</p>
                <div className="history-meta">
                  <span className={`status-pill ${job.status}`}>{job.status}</span>
                  <span>{new Date(job.created_at).toLocaleString()}</span>
                  {job.video_duration && <span>{Math.round(job.video_duration/60)}m video</span>}
                  {job.quality && <span>🎥 {job.quality}</span>}
                  {job.clip_length && <span>⏱ {job.clip_length}s clips</span>}
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                {job.status==="done" && job.clips?.length > 0 && (
                  <a href={`${API}/api/jobs/${job.job_id}/download-all`}
                    className="zip-btn" download title="Download all as ZIP">
                    ⬇ ZIP
                  </a>
                )}
                <button className="delete-btn" onClick={() => deleteJob(job.job_id)} title="Delete">🗑</button>
              </div>
            </div>

            {job.clips?.length > 0 && (
              <div className="history-clips">
                {job.clips.map((clip,i) => (
                  <div key={i} className="history-clip-row">
                    <span className="clip-num">#{clip.short_number}</span>
                    <span className="clip-name">{clip.title}</span>
                    <span className="clip-dur">{clip.duration}s</span>
                    {clip.virality_score && (
                      <span className="clip-score">🔥{clip.virality_score}/10</span>
                    )}
                    <div style={{display:"flex",gap:6,marginLeft:"auto"}}>
                      <a href={`http://localhost:8000${clip.url}`}
                        download={clip.filename} className="mini-download">
                        ⬇ {clip.size_mb}MB
                      </a>
                      {clip.srt_url && (
                        <a href={`http://localhost:8000${clip.srt_url}`}
                          download className="mini-download" style={{padding:"4px 8px"}}>
                          💬 SRT
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {job.status==="error" && (
              <p className="error-msg">❌ {job.error}</p>
            )}
            {(job.status==="processing"||job.status==="queued") && (
              <div style={{marginTop:10}}>
                <div className="progress-bar">
                  <div className="progress-fill" style={{width:`${job.progress}%`}}/>
                </div>
                <p style={{fontSize:12,color:"var(--text3)",marginTop:4}}>{job.step}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
