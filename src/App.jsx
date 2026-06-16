import { useState, useEffect, useRef } from "react"
import Dashboard from "./pages/Dashboard"
import History from "./pages/History"
import "./index.css"

// ── Ad Slot Component ────────────────────────────────────
// Once AdSense is approved:
// 1. Uncomment the script tag in index.html
// 2. Replace data-ad-client and data-ad-slot below with your real IDs
// 3. Uncomment the <ins> tag and remove the placeholder div
export function AdSlot({ type = "banner" }) {
  const sizes = {
    banner:  { width: "100%", height: "90px", label: "Banner Ad (728x90)" },
    sidebar: { width: "100%", height: "250px", label: "Sidebar Ad (300x250)" },
  }
  const s = sizes[type]

  return (
    <div className={`ad-slot ad-slot-${type}`} style={{ minHeight: s.height }}>
      {/* Placeholder — remove this div once AdSense is live */}
      <div className="ad-placeholder">
        <span>{s.label}</span>
        <small>Ad space — AdSense pending approval</small>
      </div>

      {/* Uncomment once AdSense is approved:
      <ins className="adsbygoogle"
        style={{ display: "block", width: s.width, height: s.height }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot="YOUR_AD_SLOT_ID"
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
      */}
    </div>
  )
}

// Particle background
function ParticleCanvas() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    let W = canvas.width = window.innerWidth
    let H = canvas.height = window.innerHeight
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight }
    window.addEventListener("resize", resize)

    const particles = Array.from({length: 60}, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.2 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      o: Math.random() * 0.5 + 0.1,
    }))

    let raf
    function draw() {
      ctx.clearRect(0, 0, W, H)
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${p.o})`
        ctx.fill()
      })
      // Draw lines between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx*dx + dy*dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(255,255,255,${0.04 * (1 - dist/100)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(raf) }
  }, [])
  return <canvas ref={canvasRef} className="particle-canvas" />
}

export default function App() {
  const [page, setPage]   = useState("dashboard")
  const [jobs, setJobs]   = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => { setTimeout(() => setLoaded(true), 100) }, [])

  return (
    <div className={`app ${loaded ? "app-loaded" : ""}`}>
      <ParticleCanvas />
      <Sidebar page={page} setPage={setPage} />
      <main className="main-content">
        {page === "dashboard" && <Dashboard jobs={jobs} setJobs={setJobs} />}
        {page === "history"   && <History   jobs={jobs} setJobs={setJobs} />}
      </main>
    </div>
  )
}

function Sidebar({ page, setPage }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-glow"/>
        <img src="/logo.svg" alt="Clippio" className="logo-icon-img"/>
        <span className="logo-text">Clippio</span>
      </div>
      <nav className="sidebar-nav">
        {[
          { id:"dashboard", icon:"⚡", label:"Create Shorts" },
          { id:"history",   icon:"🎬", label:"My Clips" },
        ].map(item => (
          <button key={item.id}
            className={`nav-item ${page === item.id ? "active" : ""}`}
            onClick={() => setPage(item.id)}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {page === item.id && <span className="nav-active-dot"/>}
          </button>
        ))}
      </nav>
      <AdSlot type="sidebar"/>
      <div className="sidebar-footer">
        <div className="badge">Beta</div>
        <p>Powered by Claude AI</p>
        <p style={{marginTop:4}}>© {new Date().getFullYear()} Clippio</p>
        <p>All rights reserved</p>
      </div>
    </aside>
  )
}
