/**
 * AMR_ Portfolio — React Edition
 * Single-file React component. All data fetched from the Node.js API.
 *
 * Usage:
 *   1. Make sure server.js is running on port 4000
 *   2. Drop this file into a Vite/CRA project as src/App.jsx
 *   3. Import Google Fonts in index.html:
 *      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700;800&family=Syne:wght@400;600;700;800&family=Unbounded:wght@700;900&display=swap" rel="stylesheet"/>
 *
 * Or open portfolio-react.html (the standalone CDN build) directly in a browser.
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONFIG ─────────────────────────────────────────────
const API =
  import.meta.env.VITE_API_URL ||
  window.__PORTFOLIO_API_URL__ ||
  `${window.location.hostname === "localhost" ? "http://localhost:4000" : "https://your-render-service.onrender.com"}/api`;

// ─── HOOKS ──────────────────────────────────────────────
function useFetch(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${API}${path}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [path]);
  return { data, loading };
}

function useIntersect(ref, options = {}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.1, ...options });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return visible;
}

function useCountUp(target, active) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active || !target) return;
    let cur = 0;
    const step = Math.ceil(target / 40);
    const iv = setInterval(() => {
      cur = Math.min(cur + step, target);
      setVal(cur);
      if (cur >= target) clearInterval(iv);
    }, 32);
    return () => clearInterval(iv);
  }, [active, target]);
  return val;
}

// ─── CURSOR ─────────────────────────────────────────────
function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const pos = useRef({ mx: 0, my: 0, rx: 0, ry: 0 });
  const raf = useRef(null);

  useEffect(() => {
    const move = (e) => {
      pos.current.mx = e.clientX;
      pos.current.my = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.left = e.clientX + "px";
        dotRef.current.style.top = e.clientY + "px";
      }
    };
    const hover = (e) => {
      const t = e.type === "mouseenter";
      if (dotRef.current) dotRef.current.classList.toggle("hov", t);
      if (ringRef.current) ringRef.current.classList.toggle("hov", t);
    };
    document.addEventListener("mousemove", move);
    const els = document.querySelectorAll("a,button,[data-hover]");
    els.forEach((el) => { el.addEventListener("mouseenter", hover); el.addEventListener("mouseleave", hover); });

    const track = () => {
      const { mx, my, rx, ry } = pos.current;
      pos.current.rx = rx + (mx - rx) * 0.12;
      pos.current.ry = ry + (my - ry) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = pos.current.rx + "px";
        ringRef.current.style.top = pos.current.ry + "px";
      }
      raf.current = requestAnimationFrame(track);
    };
    raf.current = requestAnimationFrame(track);
    return () => { document.removeEventListener("mousemove", move); cancelAnimationFrame(raf.current); };
  }, []);

  return (
    <>
      <div ref={dotRef} className="c-dot" />
      <div ref={ringRef} className="c-ring" />
    </>
  );
}

// ─── CANVAS BACKGROUND ──────────────────────────────────
function BgCanvas({ theme }) {
  const ref = useRef(null);
  const frame = useRef(0);
  const pts = useRef([]);
  const raf = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const COLORS = ["#1A6EFF", "#8B3CF7", "#E8B800", "#0DB87A", "#0ABECC"];
    const ORBS = [
      { fx: 0.1, fy: 0.2, c: "#1A6EFF", r: 420 },
      { fx: 0.85, fy: 0.5, c: "#8B3CF7", r: 350 },
      { fx: 0.5, fy: 0.9, c: "#E8B800", r: 280 },
      { fx: 0.9, fy: 0.1, c: "#0ABECC", r: 220 },
    ];

    const resize = () => {
      canvas.width = innerWidth;
      canvas.height = innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    pts.current = Array.from({ length: 80 }, () => ({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.5 + 0.3,
      c: COLORS[Math.floor(Math.random() * COLORS.length)],
      a: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      const light = theme === "light";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ORBS.forEach((o, i) => {
        const ox = (o.fx + Math.sin(frame.current * 0.0022 + i) * 0.06) * canvas.width;
        const oy = (o.fy + Math.cos(frame.current * 0.0028 + i) * 0.05) * canvas.height;
        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, o.r);
        g.addColorStop(0, o.c + (light ? "0D" : "16"));
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(ox, oy, o.r, 0, Math.PI * 2); ctx.fill();
      });
      pts.current.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        const aa = Math.round(p.a * (light ? 0.18 : 0.55) * 255).toString(16).padStart(2, "0");
        ctx.fillStyle = p.c + aa; ctx.fill();
      });
      for (let i = 0; i < pts.current.length; i++) {
        for (let j = i + 1; j < pts.current.length; j++) {
          const dx = pts.current[i].x - pts.current[j].x;
          const dy = pts.current[i].y - pts.current[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 115) {
            ctx.beginPath();
            ctx.moveTo(pts.current[i].x, pts.current[i].y);
            ctx.lineTo(pts.current[j].x, pts.current[j].y);
            ctx.strokeStyle = `rgba(26,110,255,${(1 - d / 115) * (light ? 0.03 : 0.055)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      frame.current++;
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener("resize", resize); };
  }, [theme]);

  return <canvas ref={ref} className="bg-canvas" />;
}

// ─── NAV ────────────────────────────────────────────────
function Nav({ profile, theme, onTheme }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = ["about", "projects", "experience", "stack", "contact"];

  return (
    <nav className={`nav${scrolled ? " scrolled" : ""}`}>
      <a href="#" className="nav-logo">
        {profile?.name?.slice(0, 3).toUpperCase() || "AMR"}<span className="dot">_</span>
      </a>
      <ul className="nav-links">
        {links.map((l) => (
          <li key={l}><a href={`#${l}`}>{l}</a></li>
        ))}
      </ul>
      {profile?.open_to_work ? (
        <div className="nav-status"><div className="s-dot" />Open to work</div>
      ) : <div />}
      <a href={profile?.cv_url || "#"} className="nav-cv" target="_blank" rel="noreferrer">
        Download CV
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1h8M9 1v8M1 9l8-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
      </a>
      <div className="nav-theme">
        <div className="th-btn" onClick={onTheme} />
        <span className="th-icon">{theme === "dark" ? "🌙" : "☀️"}</span>
      </div>
    </nav>
  );
}

// ─── TERMINAL ───────────────────────────────────────────
function Terminal() {
  const lines = [
    { cls: "cmd", text: "docker compose up --build" },
    { cls: "g", text: "✓ kafka        :9092   ready" },
    { cls: "g", text: "✓ mlflow       :5000   ready" },
    { cls: "g", text: "✓ ollama       :11434  ready" },
    { cls: "g", text: "✓ grafana      :3000   ready" },
    { cls: "g", text: "✓ localstack   :4566   ready" },
    { cls: "cmd", text: "python train.py --model qwen2.5-7b --epochs 50" },
    { cls: "b", text: "→ Epoch  1/50  loss: 2.341  acc: 0.712" },
    { cls: "b", text: "→ Epoch 25/50  loss: 0.412  acc: 0.943" },
    { cls: "y", text: "→ Epoch 50/50  loss: 0.198  acc: 0.971 ✓" },
    { cls: "cmd", text: "git log --oneline -3" },
    { cls: "g", text: "a1b2c3d  feat: deploy RAG pipeline to prod" },
    { cls: "g", text: "e4f5g6h  fix: kafka JVM segfault (G1GC opts)" },
    { cls: "g", text: "i7j8k9l  perf: ONNX export → 4x latency drop" },
    { cls: "cmd", text: "python eval.py --model prod-transformer-v3" },
    { cls: "b", text: "accuracy:   0.971" },
    { cls: "b", text: "f1_score:   0.963" },
    { cls: "y", text: "✓ All checks passed. Pushing to prod..." },
    { cls: "g", text: "✓ Deployed. Monitoring dashboards live." },
  ];
  const [shown, setShown] = useState(lines.slice(0, 11));
  const idxRef = useRef(11);
  const bodyRef = useRef(null);

  useEffect(() => {
    const iv = setInterval(() => {
      const next = lines[idxRef.current % lines.length];
      setShown((prev) => {
        const updated = [...prev, next];
        return updated.length > 14 ? updated.slice(updated.length - 14) : updated;
      });
      idxRef.current++;
    }, 1300);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [shown]);

  return (
    <div className="terminal-glass">
      <div className="tbar">
        <div className="tdot" style={{ background: "#FF5F57" }} />
        <div className="tdot" style={{ background: "#FEBC2E" }} />
        <div className="tdot" style={{ background: "#28C840" }} />
        <span className="t-title">amirreza@dev — zsh — 120×38</span>
      </div>
      <div className="t-body" ref={bodyRef}>
        {shown.map((l, i) => (
          <span key={i} className={`tl tl-${l.cls}`}>{l.text}</span>
        ))}
        <span className="tl tl-cur" />
      </div>
      <div className="hero-tags">
        {["⚡ PyTorch", "◆ LangChain", "▲ Kafka", "✦ MLflow", "● Qdrant"].map((t, i) => (
          <span key={t} className="htag" style={{ animationDelay: `${i * 0.3}s` }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

// ─── STAT COUNTER ───────────────────────────────────────
function StatCount({ target, label, active }) {
  const val = useCountUp(Number(target), active);
  return (
    <div className="hstat">
      <div className="hstat-n">{val}+</div>
      <div className="hstat-l">{label}</div>
    </div>
  );
}

// ─── TICKER ─────────────────────────────────────────────
function Ticker({ items }) {
  if (!items?.length) return null;
  const doubled = [...items, ...items];
  return (
    <div className="ticker-wrap">
      <div className="ticker-inner">
        {doubled.map((t, i) => (
          <span key={i} className="tick-it">
            <span className="tick-dot" style={{ background: t.color }} />
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── SKILL BAR ──────────────────────────────────────────
function SkillBar({ name, pct, colorClass, active }) {
  return (
    <div className="sb">
      <div className="sb-meta">
        <span className="sb-name">{name}</span>
        <span className="sb-pct">{pct}%</span>
      </div>
      <div className="sb-track">
        <div
          className={`sb-fill ${colorClass}`}
          style={{ width: active ? `${pct}%` : "0%", transition: "width 1.4s cubic-bezier(.4,0,.2,1)" }}
        />
      </div>
    </div>
  );
}

// ─── REVEAL WRAPPER ─────────────────────────────────────
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const vis = useIntersect(ref);
  return (
    <div
      ref={ref}
      className={`reveal${vis ? " on" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ─── PROJECT MODAL ──────────────────────────────────────
function ProjectModal({ project: p, onClose }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const fn = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", fn); };
  }, []);

  const tags = (p.tech_tags || "").split(",").filter(Boolean).map((t) => t.trim());
  const stats = [
    { val: p.stat1_val, lbl: p.stat1_lbl },
    { val: p.stat2_val, lbl: p.stat2_lbl },
    { val: p.stat3_val, lbl: p.stat3_lbl },
    { val: p.stat4_val, lbl: p.stat4_lbl },
  ].filter((s) => s.val);

  const statusLabel = { live: "● Live", wip: "◐ WIP", open_source: "◎ Open Source" }[p.status] || p.status;

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-eyebrow">Project {p.num} / {String(p.sort_order).padStart(2, "0")}</div>
            <div className="modal-title">{p.title}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="modal-desc">{p.long_desc || p.description}</p>
          {stats.length > 0 && (
            <div className="modal-highlights">
              {stats.map((s, i) => (
                <div key={i} className="mh-item">
                  <div className="mh-val">{s.val}</div>
                  <div className="mh-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>
          )}
          {tags.length > 0 && (
            <div className="modal-section">
              <div className="modal-section-title">Tech Stack</div>
              <div className="modal-tags">
                {tags.map((t, i) => (
                  <span key={t} className={`modal-tag${i < 3 ? " highlight" : ""}`}>{t}</span>
                ))}
              </div>
            </div>
          )}
          {p.key_details && (
            <div className="modal-section">
              <div className="modal-section-title">Key Details</div>
              <p style={{ fontSize: ".73rem", color: "var(--fg2)", lineHeight: 1.9 }}>{p.key_details}</p>
            </div>
          )}
          <div className="modal-links">
            {p.github_url && <a href={p.github_url} target="_blank" rel="noreferrer" className="mlink mlink-primary">GitHub ↗</a>}
            {p.demo_url && p.demo_url !== "#" && <a href={p.demo_url} target="_blank" rel="noreferrer" className="mlink mlink-ghost">Live Demo</a>}
            {p.case_study_url && p.case_study_url !== "#" && <a href={p.case_study_url} target="_blank" rel="noreferrer" className="mlink mlink-ghost">Case Study</a>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PROJECT CARD ───────────────────────────────────────
function ProjectCard({ project: p, index, onOpen }) {
  const ref = useRef(null);
  const statusMap = { live: { cls: "ps-live", label: "● Live" }, wip: { cls: "ps-wip", label: "◐ WIP" }, open_source: { cls: "ps-arch", label: "◎ Open Source" } };
  const st = statusMap[p.status] || statusMap.live;
  const tags = (p.tech_tags || "").split(",").filter(Boolean).map((t) => t.trim()).slice(0, 5);

  const onMouseMove = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    ref.current.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
    ref.current.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
  };

  return (
    <Reveal delay={index * 80}>
      <div ref={ref} className={`proj-card ${p.accent_class || "ab"}`} onMouseMove={onMouseMove}>
        <div className="proj-top">
          <div className="proj-num">{String(index + 1).padStart(2, "0")} / {String(p.sort_order || index + 1).padStart(2, "0")}</div>
          <div className="proj-icon">{p.icon || "🚀"}</div>
        </div>
        <div className="proj-title">{p.title}</div>
        <div className="proj-desc">{p.description}</div>
        <div className="proj-tags">{tags.map((t) => <span key={t} className="ptag">{t}</span>)}</div>
        <div className="proj-footer">
          <button className="proj-open" onClick={() => onOpen(p)}>
            View details
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1h8M9 1v8M1 9l8-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
          </button>
          <span className={`proj-status ${st.cls}`}>{st.label}</span>
        </div>
      </div>
    </Reveal>
  );
}

// ─── CONTACT FORM ───────────────────────────────────────
function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch(`${API}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }).then((r) => r.json());
      if (r.ok) { setSent(true); setForm({ name: "", email: "", subject: "", message: "" }); }
    } catch { }
    setLoading(false);
  };

  return (
    <form className="cf" onSubmit={submit}>
      {sent && (
        <div style={{ background: "rgba(13,184,122,.1)", border: "1px solid rgba(13,184,122,.35)", borderRadius: "8px", padding: ".8rem 1rem", fontSize: ".7rem", color: "var(--g2)", marginBottom: "1rem" }}>
          ✓ Message sent! I'll get back to you within 24 hours.
        </div>
      )}
      <div className="cf-g"><label className="cf-lbl">Name</label><input className="cf-in" type="text" placeholder="Your name" required value={form.name} onChange={set("name")} /></div>
      <div className="cf-g"><label className="cf-lbl">Email</label><input className="cf-in" type="email" placeholder="you@example.com" required value={form.email} onChange={set("email")} /></div>
      <div className="cf-g"><label className="cf-lbl">Subject</label><input className="cf-in" type="text" placeholder="What's this about?" value={form.subject} onChange={set("subject")} /></div>
      <div className="cf-g"><label className="cf-lbl">Message</label><textarea className="cf-ta" placeholder="Tell me about your project or idea..." value={form.message} onChange={set("message")} /></div>
      <button className="cf-btn" type="submit" disabled={loading}>{loading ? "Sending..." : "Send Message →"}</button>
    </form>
  );
}

// ─── SECTION WRAPPER ────────────────────────────────────
function Section({ id, children, style }) {
  return <section className="sec" id={id} style={style}><div className="sec-inner">{children}</div></section>;
}

// ─── LOADING SKELETON ───────────────────────────────────
function Skeleton({ h = "1rem", w = "100%", mb = ".5rem" }) {
  return <div style={{ height: h, width: w, background: "var(--glass2)", borderRadius: "4px", marginBottom: mb, animation: "pulse 1.8s ease-in-out infinite" }} />;
}

// ─── STACK TABLE ────────────────────────────────────────
function StackTable({ items }) {
  if (!items) return null;
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = { color: item.category_color, items: [] };
    acc[item.category].items.push(item);
    return acc;
  }, {});

  return (
    <div className="stack-table">
      {Object.entries(grouped).map(([cat, { color, items: catItems }]) => (
        <div key={cat} className="stk-col">
          <div className={`stk-head ${color}`}>{cat}</div>
          {catItems.map((item) => (
            <div key={item.id} className="si">
              <div className="si-dot" style={{ background: `var(--${color}1)` }} />
              {item.item_name}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────
export default function App() {
  const [theme, setTheme] = useState("dark");
  const [modal, setModal] = useState(null);
  const heroStatsRef = useRef(null);
  const heroStatsVis = useIntersect(heroStatsRef);
  const skillsRef = useRef(null);
  const skillsVis = useIntersect(skillsRef);

  const { data: profile } = useFetch("/profile");
  const { data: projects } = useFetch("/projects");
  const { data: experience } = useFetch("/experience");
  const { data: skills } = useFetch("/skills");
  const { data: stack } = useFetch("/stack");
  const { data: ticker } = useFetch("/ticker");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Parallax on hero headline
  useEffect(() => {
    const fn = () => {
      const el = document.querySelector(".hero-h1");
      if (el) el.style.transform = `translateY(${window.scrollY * 0.12}px)`;
    };
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const skillCategories = [
    { icon: "🧠", name: "Machine Learning", desc: "Deep learning, classical ML, model training, evaluation & optimization pipelines at scale.", cls: "kb" },
    { icon: "🤖", name: "LLM & Agents", desc: "Fine-tuning, RAG, multi-agent orchestration, prompt engineering, evals & alignment.", cls: "kp" },
    { icon: "⚙️", name: "MLOps", desc: "Experiment tracking, CI/CD for ML, containerized & cloud deployments, monitoring.", cls: "ky" },
    { icon: "🖥️", name: "Software Eng.", desc: "Scalable backends, REST/gRPC APIs, React frontends, real-time streaming systems.", cls: "kg" },
  ];

  return (
    <>
      <style>{CSS}</style>
      <Cursor />
      <BgCanvas theme={theme} />

      <Nav profile={profile} theme={theme} onTheme={toggleTheme} />

      {/* ── HERO ── */}
      <section id="hero">
        <div className="hero-l">
          <div className="eyebrow">
            <span className="eyebrow-line" />
            <span className="eyebrow-pill">{profile?.tagline || "DS · ML · SWE"}</span>
            Available for new projects
          </div>

          <h1 className="hero-h1">
            <span className="ln">{profile?.headline_line1 || "BUILDING"}</span>
            <span className="ln grad-b hero-cursor">{profile?.headline_line2 || "INTELLIGENT"}</span>
            <span className="ln grad-y">{profile?.headline_line3 || "SYSTEMS"}</span>
          </h1>

          <p className="hero-desc">
            I'm <strong>{profile?.name || "Amirreza"}</strong> — I architect and ship{" "}
            <strong>end-to-end AI products</strong>. From streaming data pipelines and LLM fine-tuning
            to production MLOps infrastructure and polished front-ends. Fast iteration, zero excuses.
          </p>

          <div className="hero-btns">
            <a href="#projects" className="btn btn-primary">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="4" height="4" stroke="currentColor" strokeWidth="1.2" rx="1" /><rect x="7" y="1" width="4" height="4" stroke="currentColor" strokeWidth="1.2" rx="1" /><rect x="1" y="7" width="4" height="4" stroke="currentColor" strokeWidth="1.2" rx="1" /><rect x="7" y="7" width="4" height="4" stroke="currentColor" strokeWidth="1.2" rx="1" /></svg>
              View Projects
            </a>
            <a href="#contact" className="btn btn-ghost">Get in Touch →</a>
            {profile?.github_url && (
              <a href={profile.github_url} target="_blank" rel="noreferrer" className="btn btn-outline-b">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
                GitHub
              </a>
            )}
          </div>

          <div className="hero-stats" ref={heroStatsRef}>
            <StatCount target={profile?.stat_projects} label="Projects shipped" active={heroStatsVis} />
            <StatCount target={profile?.stat_years} label="Years exp." active={heroStatsVis} />
            <StatCount target={profile?.stat_models} label="Models in prod" active={heroStatsVis} />
          </div>
        </div>
        <div className="hero-r"><Terminal /></div>
      </section>

      <Ticker items={ticker} />

      {/* ── ABOUT ── */}
      <Section id="about">
        <Reveal><div className="sec-tag">// 01 — About</div></Reveal>
        <div className="about-grid">
          <Reveal>
            <h2 className="sec-h2">Where data<br />meets <em>craft.</em></h2>
            <p className="about-p">
              I'm <strong>{profile?.name || "Amirreza"}</strong> — operating at the intersection of data science,
              machine learning engineering, and software development. I don't just experiment: I architect
              systems that go to production and stay there.
            </p>
            <p className="about-p">
              My work spans <strong>LLM orchestration</strong>, real-time streaming pipelines, MLOps
              infrastructure, and full-stack applications. I've debugged JVM segfaults in Kafka,
              fine-tuned transformers, and shipped accessible React apps — often in the same week.
            </p>
            <p className="about-p">Strong opinions, clean code, zero excuses. Based anywhere — I work remotely.</p>

            <div className="about-links">
              {profile?.github_url && <a href={profile.github_url} target="_blank" rel="noreferrer" className="alink">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
                GitHub <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 1h6M7 1v6M1 7l6-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
              </a>}
              {profile?.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="alink">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                LinkedIn <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 1h6M7 1v6M1 7l6-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
              </a>}
              {profile?.email && <a href={`mailto:${profile.email}`} className="alink">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 7l10 7 10-7" /></svg>
                Email me <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 1h6M7 1v6M1 7l6-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
              </a>}
            </div>

            <div className="skill-bars" ref={skillsRef} style={{ marginTop: "2.5rem" }}>
              {skills ? skills.map((s) => (
                <SkillBar key={s.id} name={s.name} pct={s.pct} colorClass={s.color_class} active={skillsVis} />
              )) : [96, 91, 89, 87, 93].map((p, i) => <Skeleton key={i} h="2rem" mb=".8rem" />)}
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="sk-cards">
              {skillCategories.map((s) => (
                <div key={s.name} className={`sk-card ${s.cls}`}>
                  <div className="sk-icon">{s.icon}</div>
                  <div className="sk-name">{s.name}</div>
                  <div className="sk-desc">{s.desc}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ── PROJECTS ── */}
      <Section id="projects">
        <Reveal><div className="sec-tag">// 02 — Selected Work</div></Reveal>
        <Reveal delay={50}><h2 className="sec-h2">Projects that <em>ship.</em></h2></Reveal>
        <div className="proj-grid">
          {projects
            ? projects.map((p, i) => <ProjectCard key={p.id} project={p} index={i} onOpen={setModal} />)
            : Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="proj-card" style={{ minHeight: "280px" }}>
                  <Skeleton h="1rem" w="40%" mb=".8rem" />
                  <Skeleton h="1.4rem" w="80%" mb=".5rem" />
                  <Skeleton h=".8rem" mb=".3rem" />
                  <Skeleton h=".8rem" w="70%" mb="0" />
                </div>
              ))}
        </div>
      </Section>

      {/* ── EXPERIENCE ── */}
      <Section id="experience">
        <Reveal><div className="sec-tag">// 03 — Experience</div></Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "start" }}>
          <Reveal>
            <h2 className="sec-h2">Built in the<br /><em>trenches.</em></h2>
            <p className="about-p">I've shipped production ML systems across fintech, media, and developer tools. Every role taught me something about reliability, scale, and the art of making models behave.</p>
            {profile?.cv_url && <a href={profile.cv_url} className="alink" style={{ marginTop: "1rem", display: "inline-flex" }}>
              Download full CV <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 1h6M7 1v6M1 7l6-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
            </a>}
          </Reveal>
          <Reveal delay={120}>
            <div className="timeline">
              {experience ? experience.map((e) => (
                <div key={e.id} className="tl-item">
                  <div className="tl-date">{e.date_range}</div>
                  <div className="tl-role">{e.role}</div>
                  <div className="tl-company">{e.company}</div>
                  <div className="tl-body">{e.description}</div>
                </div>
              )) : Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="tl-item">
                  <Skeleton h=".7rem" w="40%" mb=".4rem" />
                  <Skeleton h="1rem" w="70%" mb=".2rem" />
                  <Skeleton h=".7rem" w="55%" mb=".6rem" />
                  <Skeleton h=".7rem" mb="0" />
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ── STACK ── */}
      <Section id="stack">
        <Reveal><div className="sec-tag">// 04 — Tech Stack</div></Reveal>
        <Reveal delay={50}><h2 className="sec-h2">Full-spectrum <em>arsenal.</em></h2></Reveal>
        <Reveal delay={100}><StackTable items={stack} /></Reveal>
      </Section>

      {/* ── CONTACT ── */}
      <Section id="contact">
        <Reveal><div className="sec-tag">// 05 — Contact</div></Reveal>
        <div className="contact-grid">
          <Reveal>
            <h2 className="contact-h">Have an idea?<br />Let's build it.</h2>
            <p className="contact-sub">Open to freelance contracts, founding engineer roles, and interesting ML/data projects. I respond within 24 hours.</p>
            <div className="contact-rows">
              <div className="crow"><span className="crow-l">location:</span><span className="crow-v">{profile?.location || "Remote / Worldwide"}</span></div>
              <div className="crow"><span className="crow-l">status:</span><span className="crow-v">{profile?.status || "Available now"}</span></div>
              <div className="crow"><span className="crow-l">focus:</span><span className="crow-v">{profile?.focus || "ML · Data · Full-stack"}</span></div>
              <div className="crow"><span className="crow-l">timezone:</span><span className="crow-v">{profile?.timezone || "Flexible (UTC±4)"}</span></div>
            </div>
            <div className="social-links">
              {profile?.github_url && <a href={profile.github_url} target="_blank" rel="noreferrer" className="sl">GitHub</a>}
              {profile?.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="sl">LinkedIn</a>}
              {profile?.twitter_url && <a href={profile.twitter_url} target="_blank" rel="noreferrer" className="sl">Twitter</a>}
              {profile?.email && <a href={`mailto:${profile.email}`} className="sl">Email</a>}
            </div>
          </Reveal>
          <Reveal delay={120}><ContactForm /></Reveal>
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="foot-brand">{profile?.name?.slice(0, 3).toUpperCase() || "AMR"}_</div>
        <div className="foot-center">© {new Date().getFullYear()} {profile?.name || "Amirreza"} · Built with obsession · All systems operational</div>
        <div className="foot-links">
          {profile?.github_url && <a href={profile.github_url} target="_blank" rel="noreferrer">GitHub</a>}
          {profile?.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noreferrer">LinkedIn</a>}
          {profile?.twitter_url && <a href={profile.twitter_url} target="_blank" rel="noreferrer">Twitter</a>}
          {profile?.email && <a href={`mailto:${profile.email}`}>Email</a>}
        </div>
      </footer>

      {modal && <ProjectModal project={modal} onClose={() => setModal(null)} />}
    </>
  );
}

// ─── CSS-IN-JS ──────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700;800&family=Syne:wght@400;600;700;800&family=Unbounded:wght@700;900&display=swap');

:root {
  --b1:#1A6EFF;--b2:#4D94FF;--b3:#8DC0FF;
  --p1:#8B3CF7;--p2:#B06EFF;--p3:#D4AAFF;
  --y1:#E8B800;--y2:#F5D000;--y3:#FFE87A;
  --g1:#0DB87A;--g2:#2DDBAA;--g3:#80F0CC;
  --c1:#0ABECC;--c2:#30D8E8;
  --r1:#FF3366;
  --bg:#05050E;--bg2:#09091A;--bg3:#0E0E24;
  --fg:#EEEEFF;--fg2:#8888AA;--fg3:#404060;
  --border:rgba(255,255,255,0.07);
  --border2:rgba(255,255,255,0.12);
  --glass:rgba(255,255,255,0.035);
  --glass2:rgba(255,255,255,0.065);
  --glass3:rgba(255,255,255,0.10);
}
[data-theme="light"] {
  --bg:#F0F1F5;--bg2:#E8EAF0;--bg3:#E0E3EC;
  --fg:#141420;--fg2:#505068;--fg3:#9090A8;
  --border:rgba(60,60,100,0.10);
  --border2:rgba(60,60,100,0.16);
  --glass:rgba(255,255,255,0.45);
  --glass2:rgba(255,255,255,0.60);
  --glass3:rgba(255,255,255,0.80);
  --b1:#2262CC;--b2:#3A7AE0;--b3:#5A96F0;
  --p1:#6B28D4;--p2:#8A4EE8;
  --y1:#C49500;--y2:#D4A800;
  --g1:#0A9060;--g2:#15B880;
  --c1:#0898A8;--c2:#12B0C0;
}

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;font-size:16px}
body{
  background:var(--bg);color:var(--fg);
  font-family:'JetBrains Mono',monospace;
  overflow-x:hidden;cursor:none;
  line-height:1.6;
  transition:background .45s,color .45s;
}
body::after{
  content:'';position:fixed;inset:0;z-index:7000;pointer-events:none;
  background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.04) 3px,rgba(0,0,0,.04) 4px);
}
[data-theme="light"] body::after{opacity:.18}
a{text-decoration:none;cursor:none;color:inherit}
button{cursor:none;font-family:inherit}

@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes gradFlow{0%{background-position:0%}100%{background-position:200%}}
@keyframes gradShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes tick{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes sPulse{0%,100%{box-shadow:0 0 0 0 rgba(13,184,122,.5)}50%{box-shadow:0 0 0 6px rgba(13,184,122,0)}}
@keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}

/* ── CURSOR ── */
.c-dot{
  width:9px;height:9px;background:var(--b1);border-radius:50%;
  position:fixed;top:0;left:0;z-index:9999;pointer-events:none;
  transform:translate(-50%,-50%);
  transition:background .2s,width .2s,height .2s;
  mix-blend-mode:screen;box-shadow:0 0 12px var(--b1);
}
.c-ring{
  width:36px;height:36px;border:1.5px solid rgba(77,148,255,.5);border-radius:50%;
  position:fixed;top:0;left:0;z-index:9998;pointer-events:none;
  transform:translate(-50%,-50%);
  transition:width .3s,height .3s,border-color .3s;
}
.c-dot.hov{width:20px;height:20px;background:var(--p1);box-shadow:0 0 20px var(--p1)}
.c-ring.hov{width:52px;height:52px;border-color:rgba(176,110,255,.6)}
[data-theme="light"] .c-dot{mix-blend-mode:multiply;box-shadow:0 0 6px rgba(34,98,204,.4)}
[data-theme="light"] .c-ring{border-color:rgba(34,98,204,.3)}

/* ── CANVAS ── */
.bg-canvas{position:fixed;inset:0;z-index:0;pointer-events:none}

/* ── NAV ── */
.nav{
  position:fixed;top:0;left:0;right:0;z-index:500;height:56px;
  display:grid;grid-template-columns:auto 1fr auto auto auto;
  align-items:stretch;
  background:var(--glass2);backdrop-filter:blur(28px);
  border-bottom:1px solid var(--border);
  transition:background .45s,border-color .45s;
}
[data-theme="light"] .nav{background:rgba(240,241,245,0.88);box-shadow:0 1px 0 var(--border),0 2px 16px rgba(26,30,80,0.06)}
.nav.scrolled{background:var(--glass3)}
.nav-logo{
  padding:0 2rem;display:flex;align-items:center;gap:.4rem;
  font-family:'Unbounded',sans-serif;font-size:.78rem;font-weight:900;
  color:var(--b2);border-right:1px solid var(--border);transition:color .2s;
}
.nav-logo .dot{color:var(--y2)}
.nav-logo:hover{color:var(--b3)}
.nav-links{display:flex;align-items:stretch;list-style:none;padding:0 .5rem}
.nav-links a{
  display:flex;align-items:center;padding:0 1.1rem;
  font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;
  color:var(--fg2);border-bottom:2px solid transparent;transition:color .2s,border-color .2s;
}
.nav-links a:hover{color:var(--b2);border-bottom-color:var(--b1)}
.nav-status{
  display:flex;align-items:center;gap:.5rem;padding:0 1.5rem;
  border-left:1px solid var(--border);
  font-size:.58rem;letter-spacing:.14em;text-transform:uppercase;color:var(--g2);
}
[data-theme="light"] .nav-status{color:var(--g1)}
.s-dot{width:6px;height:6px;border-radius:50%;background:var(--g1);animation:sPulse 2.2s ease-in-out infinite}
.nav-cv{
  display:flex;align-items:center;padding:0 1.3rem;border-left:1px solid var(--border);
  font-size:.6rem;letter-spacing:.12em;text-transform:uppercase;color:var(--b2);
  transition:color .2s,background .2s;gap:.4rem;
}
.nav-cv:hover{background:rgba(26,110,255,.06);color:var(--b1)}
.nav-theme{display:flex;align-items:center;gap:.6rem;padding:0 1.3rem;border-left:1px solid var(--border)}
.th-btn{
  width:46px;height:25px;border-radius:100px;
  background:var(--glass3);border:1px solid var(--border2);
  position:relative;cursor:pointer;transition:background .3s;
}
.th-btn::after{
  content:'';position:absolute;top:3px;left:3px;
  width:17px;height:17px;border-radius:50%;background:var(--b1);
  transition:transform .35s cubic-bezier(.34,1.56,.64,1),background .3s;
  box-shadow:0 0 10px rgba(26,110,255,.7);
}
[data-theme="light"] .th-btn::after{transform:translateX(21px);background:var(--y1);box-shadow:0 0 8px rgba(196,149,0,.5)}
.th-icon{font-size:.85rem;user-select:none}

/* ── HERO ── */
#hero{
  min-height:100vh;padding-top:56px;
  display:grid;grid-template-columns:1fr 430px;
  position:relative;z-index:1;border-bottom:1px solid var(--border);
}
.hero-l{
  padding:6rem 4.5rem;display:flex;flex-direction:column;
  justify-content:center;border-right:1px solid var(--border);
}
.eyebrow{
  display:inline-flex;align-items:center;gap:.7rem;
  font-size:.6rem;letter-spacing:.2em;text-transform:uppercase;
  color:var(--b2);margin-bottom:2.5rem;
  animation:fadeUp .7s .1s both;
}
.eyebrow-line{width:24px;height:1px;background:linear-gradient(90deg,var(--b1),transparent)}
.eyebrow-pill{
  padding:.2rem .75rem;border-radius:4px;
  border:1px solid rgba(77,148,255,.35);background:rgba(26,110,255,.06);color:var(--b2);
}
[data-theme="light"] .eyebrow-pill{border-color:rgba(34,98,204,.25);background:rgba(34,98,204,.06)}
.hero-h1{
  font-family:'Unbounded',sans-serif;
  font-size:clamp(2.6rem,6vw,5.6rem);font-weight:900;
  line-height:.98;letter-spacing:-.03em;margin-bottom:2rem;
  animation:fadeUp .85s .3s both;
}
.ln{display:block}
.grad-b{
  background:linear-gradient(90deg,var(--b1),var(--b2),var(--c1));
  background-size:200% auto;
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  animation:gradFlow 4s linear infinite;
}
.grad-y{
  background:linear-gradient(90deg,var(--y1),var(--y2),var(--y3));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
[data-theme="light"] .grad-y{
  background:linear-gradient(90deg,#8B6800,#A07800,#C49500);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.hero-cursor::after{content:'_';animation:blink .9s step-end infinite;color:var(--b2);-webkit-text-fill-color:var(--b2)}
.hero-desc{
  font-size:.79rem;color:var(--fg2);line-height:1.95;max-width:500px;
  margin-bottom:2.8rem;padding-left:1rem;border-left:2px solid var(--border2);
  animation:fadeUp .85s .5s both;
}
.hero-desc strong{color:var(--b2);font-weight:500}
.hero-btns{display:flex;gap:.9rem;flex-wrap:wrap;animation:fadeUp .85s .7s both}
.btn{
  font-family:'JetBrains Mono',monospace;font-size:.68rem;letter-spacing:.09em;
  text-transform:uppercase;padding:.8rem 1.8rem;border-radius:7px;
  display:inline-flex;align-items:center;gap:.5rem;
  transition:all .22s;position:relative;overflow:hidden;border:none;cursor:pointer;
}
.btn::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.08),transparent);opacity:0;transition:opacity .2s}
.btn:hover::before{opacity:1}
.btn-primary{background:linear-gradient(135deg,var(--b1),var(--b2));color:#fff;border:1px solid rgba(77,148,255,.4);box-shadow:0 0 30px rgba(26,110,255,.2),inset 0 1px 0 rgba(255,255,255,.12)}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 0 40px rgba(26,110,255,.3)}
[data-theme="light"] .btn-primary{box-shadow:0 4px 16px rgba(34,98,204,.25)}
.btn-ghost{background:var(--glass);color:var(--fg2);border:1px solid var(--border2);backdrop-filter:blur(10px)}
.btn-ghost:hover{border-color:var(--p2);color:var(--p2);background:rgba(139,60,247,.06)}
[data-theme="light"] .btn-ghost{background:rgba(255,255,255,.7)}
.btn-outline-b{background:transparent;color:var(--b2);border:1px solid rgba(77,148,255,.4)}
.btn-outline-b:hover{background:rgba(26,110,255,.06);border-color:var(--b2)}
.hero-stats{
  display:flex;gap:0;margin-top:3.5rem;
  padding-top:2rem;border-top:1px solid var(--border);
  animation:fadeUp .85s .9s both;
}
.hstat{padding-right:2.5rem;margin-right:2.5rem;border-right:1px solid var(--border)}
.hstat:last-child{border-right:none;margin-right:0;padding-right:0}
.hstat-n{
  font-family:'Unbounded',sans-serif;font-size:2rem;font-weight:900;line-height:1;
  background:linear-gradient(135deg,var(--b1),var(--b2));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.hstat-l{font-size:.58rem;letter-spacing:.1em;text-transform:uppercase;color:var(--fg3);margin-top:.35rem}
.hero-r{display:flex;flex-direction:column}

/* ── TERMINAL ── */
.terminal-glass{
  margin:1.2rem;border-radius:14px;
  border:1px solid var(--border2);background:var(--glass);
  backdrop-filter:blur(22px);
  box-shadow:0 24px 70px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.08);
  overflow:hidden;flex:1;display:flex;flex-direction:column;
  animation:fadeIn 1s .8s both;
}
[data-theme="light"] .terminal-glass{background:rgba(250,251,255,0.75);box-shadow:0 8px 32px rgba(26,30,80,.1),inset 0 1px 0 rgba(255,255,255,.9);border-color:rgba(60,60,100,.14)}
.tbar{display:flex;align-items:center;gap:.5rem;padding:.8rem 1rem;border-bottom:1px solid var(--border);background:var(--glass2);flex-shrink:0}
[data-theme="light"] .tbar{background:rgba(232,234,242,.7)}
.tdot{width:11px;height:11px;border-radius:50%}
.t-title{margin-left:.5rem;font-size:.58rem;letter-spacing:.1em;color:var(--fg3)}
.t-body{padding:1.1rem 1.2rem;font-size:.66rem;line-height:1.9;flex:1;overflow:hidden;display:flex;flex-direction:column;gap:0}
.tl{display:block}
.tl-cmd{color:var(--g2)}
.tl-cmd::before{content:'❯ ';color:var(--b2)}
[data-theme="light"] .tl-cmd{color:var(--g1)}
.tl-b{color:var(--b2);padding-left:1em}
.tl-g{color:var(--g1);padding-left:1em}
.tl-y{color:var(--y1);padding-left:1em}
[data-theme="light"] .tl-b{color:var(--b1)}
.tl-cur::before{content:'❯ ';color:var(--b2)}
.tl-cur::after{content:'█';animation:blink 1s step-end infinite;color:var(--g2)}
.hero-tags{padding:.8rem 1.2rem 1.2rem;display:flex;flex-wrap:wrap;gap:.45rem;border-top:1px solid var(--border);flex-shrink:0}
.htag{
  font-size:.58rem;letter-spacing:.06em;padding:.28rem .7rem;
  border-radius:100px;border:1px solid var(--border2);
  background:var(--glass2);color:var(--fg2);
  animation:floatY 3s ease-in-out infinite;transition:border-color .2s,color .2s;
}
[data-theme="light"] .htag{background:rgba(255,255,255,.8)}
.htag:nth-child(1){color:var(--b2);border-color:rgba(77,148,255,.3)}
.htag:nth-child(2){color:var(--p2);border-color:rgba(176,110,255,.3)}
.htag:nth-child(3){color:var(--y2);border-color:rgba(245,208,0,.3)}
[data-theme="light"] .htag:nth-child(3){color:var(--y1);border-color:rgba(196,149,0,.3)}
.htag:nth-child(4){color:var(--g2);border-color:rgba(45,219,170,.3)}
[data-theme="light"] .htag:nth-child(4){color:var(--g1)}
.htag:nth-child(5){color:var(--c2);border-color:rgba(48,216,232,.3)}
[data-theme="light"] .htag:nth-child(5){color:var(--c1)}

/* ── TICKER ── */
.ticker-wrap{position:relative;z-index:1;overflow:hidden;border-bottom:1px solid var(--border);background:var(--glass);backdrop-filter:blur(12px);padding:.85rem 0}
[data-theme="light"] .ticker-wrap{background:rgba(232,234,242,.5)}
.ticker-inner{display:flex;gap:3rem;animation:tick 30s linear infinite;width:max-content}
.tick-it{display:flex;align-items:center;gap:.5rem;font-size:.6rem;letter-spacing:.12em;text-transform:uppercase;color:var(--fg3);white-space:nowrap}
.tick-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}

/* ── SECTIONS ── */
.sec{position:relative;z-index:1;border-top:1px solid var(--border)}
.sec-inner{max-width:1240px;margin:0 auto;padding:7rem 3rem}
.sec-tag{font-size:.58rem;letter-spacing:.22em;text-transform:uppercase;color:var(--b2);margin-bottom:.7rem}
.sec-h2{font-family:'Unbounded',sans-serif;font-size:clamp(1.7rem,3.5vw,2.9rem);font-weight:900;line-height:1.1;letter-spacing:-.025em;margin-bottom:3rem}
.sec-h2 em{font-style:normal;color:var(--b2)}

/* ── ABOUT ── */
.about-grid{display:grid;grid-template-columns:1fr 1fr;gap:5rem;align-items:start}
.about-p{font-size:.77rem;color:var(--fg2);line-height:1.95;margin-bottom:1rem}
.about-p strong{color:var(--b2);font-weight:500}
.about-links{display:flex;gap:.8rem;flex-wrap:wrap;margin-top:1.8rem}
.alink{display:inline-flex;align-items:center;gap:.45rem;font-size:.65rem;letter-spacing:.08em;text-transform:uppercase;padding:.5rem 1.1rem;border-radius:6px;border:1px solid var(--border2);background:var(--glass);color:var(--fg2);transition:all .2s;backdrop-filter:blur(8px)}
.alink:hover{border-color:var(--b2);color:var(--b2);background:rgba(26,110,255,.06)}
[data-theme="light"] .alink{background:rgba(255,255,255,.7)}
.skill-bars{display:flex;flex-direction:column;gap:1.1rem}
.sb-meta{display:flex;justify-content:space-between;font-size:.62rem;margin-bottom:.35rem}
.sb-name{color:var(--fg)}.sb-pct{color:var(--fg3)}
.sb-track{height:2px;background:var(--border2);border-radius:1px;position:relative;overflow:hidden}
.sb-fill{position:absolute;left:0;top:0;height:100%;width:0;border-radius:1px}
.sf-b{background:linear-gradient(90deg,var(--b1),var(--b2));box-shadow:0 0 8px rgba(26,110,255,.4)}
.sf-p{background:linear-gradient(90deg,var(--p1),var(--p2));box-shadow:0 0 8px rgba(139,60,247,.4)}
.sf-y{background:linear-gradient(90deg,var(--y1),var(--y2));box-shadow:0 0 8px rgba(232,184,0,.4)}
.sf-g{background:linear-gradient(90deg,var(--g1),var(--g2));box-shadow:0 0 8px rgba(13,184,122,.4)}
[data-theme="light"] .sf-b,[data-theme="light"] .sf-p,[data-theme="light"] .sf-y,[data-theme="light"] .sf-g{box-shadow:none}
.sk-cards{display:grid;grid-template-columns:1fr 1fr;gap:.9rem}
.sk-card{padding:1.3rem;border-radius:12px;border:1px solid var(--border);background:var(--glass);backdrop-filter:blur(16px);transition:transform .25s,box-shadow .25s,border-color .25s}
[data-theme="light"] .sk-card{background:rgba(255,255,255,.65)}
.sk-card:hover{transform:translateY(-4px)}
.sk-card.kb:hover{border-color:rgba(77,148,255,.5);box-shadow:0 12px 40px rgba(26,110,255,.12)}
.sk-card.kp:hover{border-color:rgba(176,110,255,.5);box-shadow:0 12px 40px rgba(139,60,247,.12)}
.sk-card.ky:hover{border-color:rgba(245,208,0,.5);box-shadow:0 12px 40px rgba(232,184,0,.12)}
.sk-card.kg:hover{border-color:rgba(45,219,170,.5);box-shadow:0 12px 40px rgba(13,184,122,.12)}
[data-theme="light"] .sk-card.kb:hover{border-color:rgba(34,98,204,.35);box-shadow:0 8px 28px rgba(34,98,204,.08)}
[data-theme="light"] .sk-card.kp:hover{border-color:rgba(107,40,212,.35);box-shadow:0 8px 28px rgba(107,40,212,.08)}
[data-theme="light"] .sk-card.ky:hover{border-color:rgba(196,149,0,.35);box-shadow:0 8px 28px rgba(196,149,0,.08)}
[data-theme="light"] .sk-card.kg:hover{border-color:rgba(10,144,96,.35);box-shadow:0 8px 28px rgba(10,144,96,.08)}
.sk-icon{font-size:1.4rem;margin-bottom:.6rem}
.sk-name{font-size:.72rem;font-weight:700;margin-bottom:.25rem;letter-spacing:.03em}
.sk-desc{font-size:.62rem;color:var(--fg3);line-height:1.65}

/* ── PROJECTS ── */
.proj-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.1rem}
.proj-card{
  border-radius:14px;border:1px solid var(--border);background:var(--glass);
  backdrop-filter:blur(18px);padding:1.9rem 1.7rem;position:relative;overflow:hidden;
  transition:transform .28s,box-shadow .28s,border-color .28s;display:flex;flex-direction:column;
}
[data-theme="light"] .proj-card{background:rgba(255,255,255,.6)}
.proj-card::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at var(--mx,50%) var(--my,50%),rgba(26,110,255,.05) 0%,transparent 60%);opacity:0;transition:opacity .3s;pointer-events:none}
[data-theme="light"] .proj-card::before{background:radial-gradient(circle at var(--mx,50%) var(--my,50%),rgba(34,98,204,.04) 0%,transparent 60%)}
.proj-card:hover::before{opacity:1}
.proj-card:hover{transform:translateY(-5px)}
.proj-card.ab:hover{border-color:rgba(77,148,255,.45);box-shadow:0 24px 70px rgba(26,110,255,.14)}
.proj-card.ap:hover{border-color:rgba(176,110,255,.45);box-shadow:0 24px 70px rgba(139,60,247,.14)}
.proj-card.ay:hover{border-color:rgba(245,208,0,.45);box-shadow:0 24px 70px rgba(232,184,0,.14)}
.proj-card.ag:hover{border-color:rgba(45,219,170,.45);box-shadow:0 24px 70px rgba(13,184,122,.14)}
.proj-card.ac:hover{border-color:rgba(48,216,232,.45);box-shadow:0 24px 70px rgba(10,190,204,.14)}
[data-theme="light"] .proj-card.ab:hover{border-color:rgba(34,98,204,.3);box-shadow:0 16px 48px rgba(34,98,204,.08)}
[data-theme="light"] .proj-card.ap:hover{border-color:rgba(107,40,212,.3);box-shadow:0 16px 48px rgba(107,40,212,.08)}
[data-theme="light"] .proj-card.ay:hover{border-color:rgba(196,149,0,.3);box-shadow:0 16px 48px rgba(196,149,0,.08)}
[data-theme="light"] .proj-card.ag:hover{border-color:rgba(10,144,96,.3);box-shadow:0 16px 48px rgba(10,144,96,.08)}
.proj-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1rem}
.proj-num{font-size:.55rem;letter-spacing:.16em;color:var(--fg3)}
.proj-icon{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1rem;border:1px solid var(--border);background:var(--glass2)}
[data-theme="light"] .proj-icon{background:rgba(255,255,255,.8)}
.proj-title{font-family:'Syne',sans-serif;font-size:.95rem;font-weight:700;margin-bottom:.6rem;line-height:1.3}
.proj-desc{font-size:.67rem;color:var(--fg2);line-height:1.8;margin-bottom:1.2rem;flex:1}
.proj-tags{display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:1.2rem}
.ptag{font-size:.56rem;letter-spacing:.05em;padding:.2rem .55rem;border-radius:4px;border:1px solid var(--border);color:var(--fg3);background:var(--glass2)}
[data-theme="light"] .ptag{background:rgba(232,234,242,.7)}
.proj-footer{display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--border);padding-top:1rem;margin-top:auto}
.proj-open{display:inline-flex;align-items:center;gap:.4rem;font-size:.6rem;letter-spacing:.1em;text-transform:uppercase;color:var(--b2);transition:gap .2s,color .2s;background:none;border:none;padding:0}
.proj-open:hover{gap:.7rem;color:var(--b1)}
.proj-status{font-size:.55rem;letter-spacing:.08em;padding:.2rem .6rem;border-radius:100px}
.ps-live{color:var(--g1);border:1px solid rgba(13,184,122,.3);background:rgba(13,184,122,.06)}
.ps-wip{color:var(--y1);border:1px solid rgba(232,184,0,.3);background:rgba(232,184,0,.06)}
.ps-arch{color:var(--fg3);border:1px solid var(--border);background:var(--glass)}

/* ── MODAL ── */
.modal-overlay{position:fixed;inset:0;z-index:2000;background:rgba(5,5,14,.85);backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:opacity .3s,visibility .3s;padding:2rem}
[data-theme="light"] .modal-overlay{background:rgba(20,20,40,.55)}
.modal-overlay.open{opacity:1;visibility:visible}
.modal{width:100%;max-width:720px;max-height:85vh;border-radius:18px;border:1px solid var(--border2);background:var(--bg2);box-shadow:0 40px 120px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.07);overflow:hidden;display:flex;flex-direction:column;transform:translateY(0) scale(1);animation:fadeUp .35s ease}
[data-theme="light"] .modal{background:#F0F1F5;box-shadow:0 20px 60px rgba(26,30,80,.2)}
.modal-header{padding:1.5rem 2rem;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;flex-shrink:0;background:var(--glass2)}
[data-theme="light"] .modal-header{background:rgba(232,234,242,.6)}
.modal-eyebrow{font-size:.56rem;letter-spacing:.18em;text-transform:uppercase;color:var(--b2);margin-bottom:.4rem}
.modal-title{font-family:'Unbounded',sans-serif;font-size:1.2rem;font-weight:900;line-height:1.2}
.modal-close{width:32px;height:32px;border-radius:8px;border:1px solid var(--border);background:var(--glass);display:flex;align-items:center;justify-content:center;font-size:1rem;color:var(--fg2);flex-shrink:0;margin-left:1rem;cursor:pointer;transition:all .2s}
.modal-close:hover{background:rgba(255,51,102,.12);border-color:rgba(255,51,102,.4);color:var(--r1)}
.modal-body{padding:2rem;overflow-y:auto;flex:1}
.modal-body::-webkit-scrollbar{width:4px}
.modal-body::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}
.modal-desc{font-size:.77rem;color:var(--fg2);line-height:1.95;margin-bottom:1.8rem}
.modal-highlights{display:grid;grid-template-columns:1fr 1fr;gap:.8rem;margin-bottom:1.8rem}
.mh-item{padding:1rem;border-radius:10px;border:1px solid var(--border);background:var(--glass)}
[data-theme="light"] .mh-item{background:rgba(255,255,255,.6)}
.mh-val{font-family:'Unbounded',sans-serif;font-size:1.2rem;font-weight:900;color:var(--b2)}
.mh-lbl{font-size:.6rem;color:var(--fg3);margin-top:.2rem;letter-spacing:.06em}
.modal-section{margin-bottom:1.8rem}
.modal-section-title{font-size:.6rem;letter-spacing:.18em;text-transform:uppercase;color:var(--b2);margin-bottom:.9rem;padding-bottom:.5rem;border-bottom:1px solid var(--border)}
.modal-tags{display:flex;flex-wrap:wrap;gap:.5rem}
.modal-tag{font-size:.65rem;padding:.35rem .9rem;border-radius:6px;border:1px solid var(--border2);background:var(--glass2);color:var(--fg2)}
[data-theme="light"] .modal-tag{background:rgba(255,255,255,.7)}
.modal-tag.highlight{background:rgba(34,98,204,.08);border-color:rgba(34,98,204,.25);color:var(--b2)}
[data-theme="dark"] .modal-tag.highlight{background:rgba(26,110,255,.1);border-color:rgba(77,148,255,.35)}
.modal-links{display:flex;gap:.8rem;flex-wrap:wrap;margin-top:1.5rem}
.mlink{display:inline-flex;align-items:center;gap:.5rem;font-size:.67rem;letter-spacing:.1em;text-transform:uppercase;padding:.7rem 1.4rem;border-radius:7px;transition:all .2s}
.mlink-primary{background:linear-gradient(135deg,var(--b1),var(--b2));color:#fff;border:1px solid rgba(77,148,255,.3);box-shadow:0 4px 16px rgba(26,110,255,.2)}
.mlink-primary:hover{box-shadow:0 6px 24px rgba(26,110,255,.3);transform:translateY(-2px)}
.mlink-ghost{background:var(--glass);color:var(--fg2);border:1px solid var(--border2);backdrop-filter:blur(8px)}
[data-theme="light"] .mlink-ghost{background:rgba(255,255,255,.7)}
.mlink-ghost:hover{border-color:var(--p2);color:var(--p2)}

/* ── TIMELINE ── */
.timeline{position:relative;padding-left:2rem}
.timeline::before{content:'';position:absolute;left:0;top:0;bottom:0;width:1px;background:linear-gradient(to bottom,var(--b1),var(--p1),transparent)}
.tl-item{position:relative;padding:0 0 2.5rem 2rem}
.tl-item::before{content:'';position:absolute;left:-2rem;top:.2rem;width:9px;height:9px;border-radius:50%;background:var(--b1);border:2px solid var(--bg);box-shadow:0 0 0 3px rgba(26,110,255,.2);margin-left:-4px}
[data-theme="light"] .tl-item::before{border-color:var(--bg);box-shadow:0 0 0 3px rgba(34,98,204,.12)}
.tl-item:last-child{padding-bottom:0}
.tl-date{font-size:.58rem;letter-spacing:.14em;text-transform:uppercase;color:var(--b2);margin-bottom:.4rem}
.tl-role{font-family:'Syne',sans-serif;font-size:.92rem;font-weight:700;margin-bottom:.2rem}
.tl-company{font-size:.7rem;color:var(--fg2);margin-bottom:.6rem}
.tl-body{font-size:.7rem;color:var(--fg3);line-height:1.8}

/* ── STACK TABLE ── */
.stack-table{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--border);border-radius:14px;overflow:hidden;background:var(--glass);backdrop-filter:blur(16px)}
[data-theme="light"] .stack-table{background:rgba(255,255,255,.55)}
.stk-col{border-right:1px solid var(--border)}
.stk-col:last-child{border-right:none}
.stk-head{padding:.85rem 1.2rem;font-size:.56rem;letter-spacing:.18em;text-transform:uppercase;border-bottom:1px solid var(--border);background:var(--glass2)}
[data-theme="light"] .stk-head{background:rgba(232,234,242,.6)}
.stk-head.b{color:var(--b2)}.stk-head.p{color:var(--p2)}.stk-head.y{color:var(--y1)}.stk-head.g{color:var(--g1)}
[data-theme="light"] .stk-head.b{color:var(--b1)}.[data-theme="light"] .stk-head.p{color:var(--p1)}
.si{display:flex;align-items:center;gap:.6rem;padding:.65rem 1.2rem;font-size:.67rem;color:var(--fg2);border-bottom:1px solid var(--border);transition:background .15s,color .15s}
.si:last-child{border-bottom:none}
.si:hover{background:var(--glass2);color:var(--fg)}
[data-theme="light"] .si:hover{background:rgba(232,234,242,.5)}
.si-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}

/* ── CONTACT ── */
.contact-grid{display:grid;grid-template-columns:1fr 1.1fr;gap:5rem;align-items:start}
.contact-h{font-family:'Unbounded',sans-serif;font-size:clamp(1.9rem,4vw,3.3rem);font-weight:900;line-height:1.05;letter-spacing:-.03em;margin-bottom:1.5rem;background:linear-gradient(135deg,var(--b1),var(--p1),var(--y1));background-size:200% 200%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:gradShift 5s ease infinite}
[data-theme="light"] .contact-h{background:linear-gradient(135deg,#2262CC,#6B28D4,#8B6800);background-size:200% 200%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.contact-sub{font-size:.74rem;color:var(--fg2);line-height:1.95;margin-bottom:2rem}
.contact-rows{display:flex;flex-direction:column;gap:.6rem;margin-bottom:2rem}
.crow{font-size:.67rem;display:flex;gap:1rem}
.crow-l{color:var(--b2);min-width:75px}
.crow-v{color:var(--fg2)}
.social-links{display:flex;gap:.6rem;flex-wrap:wrap}
.sl{display:inline-flex;align-items:center;gap:.45rem;font-size:.6rem;letter-spacing:.1em;text-transform:uppercase;padding:.5rem 1rem;border-radius:6px;border:1px solid var(--border2);background:var(--glass);color:var(--fg2);transition:all .2s}
[data-theme="light"] .sl{background:rgba(255,255,255,.7)}
.sl:hover{border-color:var(--b2);color:var(--b2);background:rgba(26,110,255,.06);transform:translateY(-2px)}
.cf{display:flex;flex-direction:column;gap:0}
.cf-g{border:1px solid var(--border);border-bottom:none;background:var(--glass);backdrop-filter:blur(12px);transition:border-color .2s}
[data-theme="light"] .cf-g{background:rgba(255,255,255,.7)}
.cf-g:first-child{border-radius:10px 10px 0 0}
.cf-g:last-of-type{border-bottom:1px solid var(--border);border-radius:0 0 10px 10px}
.cf-g:focus-within{border-color:var(--b1);box-shadow:0 0 0 3px rgba(34,98,204,.08);z-index:1}
.cf-lbl{font-size:.54rem;letter-spacing:.15em;text-transform:uppercase;color:var(--fg3);padding:.7rem 1rem 0;display:block}
.cf-in,.cf-ta{display:block;width:100%;background:transparent;border:none;outline:none;font-family:'JetBrains Mono',monospace;font-size:.78rem;color:var(--fg);padding:.3rem 1rem .8rem}
.cf-ta{resize:vertical;min-height:110px}
.cf-in::placeholder,.cf-ta::placeholder{color:var(--fg3)}
.cf-btn{margin-top:1rem;width:100%;font-family:'JetBrains Mono',monospace;font-size:.73rem;letter-spacing:.1em;text-transform:uppercase;font-weight:700;padding:1rem;border-radius:8px;border:none;background:linear-gradient(135deg,var(--b1),var(--p1));color:#fff;box-shadow:0 4px 16px rgba(26,110,255,.2);cursor:pointer;transition:all .2s}
.cf-btn:hover:not(:disabled){opacity:.92;transform:translateY(-2px);box-shadow:0 6px 24px rgba(26,110,255,.3)}
.cf-btn:disabled{opacity:.6}
[data-theme="light"] .cf-btn{background:linear-gradient(135deg,#2262CC,#6B28D4);box-shadow:0 4px 16px rgba(34,98,204,.18)}

/* ── FOOTER ── */
footer{position:relative;z-index:1;border-top:1px solid var(--border);background:var(--glass2);backdrop-filter:blur(16px);display:grid;grid-template-columns:auto 1fr auto;align-items:center;padding:0}
[data-theme="light"] footer{background:rgba(232,234,242,.6)}
.foot-brand{padding:1.4rem 2rem;border-right:1px solid var(--border);font-family:'Unbounded',sans-serif;font-size:.72rem;font-weight:900;color:var(--b2)}
.foot-center{padding:1.4rem 2rem;font-size:.58rem;color:var(--fg3);letter-spacing:.06em}
.foot-links{padding:1.4rem 2rem;border-left:1px solid var(--border);display:flex;gap:1.5rem}
.foot-links a{font-size:.6rem;color:var(--fg3);letter-spacing:.1em;text-transform:uppercase;transition:color .2s}
.foot-links a:hover{color:var(--b2)}

/* ── REVEAL ── */
.reveal{opacity:0;transform:translateY(26px);transition:opacity .7s ease,transform .7s ease}
.reveal.on{opacity:1;transform:translateY(0)}

/* ── RESPONSIVE ── */
@media(max-width:1050px){
  #hero{grid-template-columns:1fr}
  .hero-r{display:none}
  .about-grid,.contact-grid{grid-template-columns:1fr}
  .proj-grid{grid-template-columns:1fr 1fr}
  .stack-table{grid-template-columns:1fr 1fr}
  .nav{grid-template-columns:auto 1fr auto auto}
  .nav-links{display:none}
  #experience > .sec-inner > div{grid-template-columns:1fr}
}
@media(max-width:650px){
  .hero-l{padding:4rem 1.5rem}
  .sec-inner{padding:5rem 1.5rem}
  .proj-grid,.sk-cards{grid-template-columns:1fr}
  .modal-highlights{grid-template-columns:1fr}
  footer{grid-template-columns:1fr}
  .foot-brand,.foot-center,.foot-links{border:none;border-bottom:1px solid var(--border)}
  .hstat{padding-right:1.5rem;margin-right:1.5rem}
}
`;
