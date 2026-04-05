import { Link, useSearchParams } from "react-router-dom";

const API_FALLBACK =
  import.meta.env.VITE_API_URL ||
  `${window.location.hostname === "localhost"
    ? "http://localhost:4000"
    : "https://ai-developer-website-backend.onrender.com"}/api`;

const pageStyle = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(26,110,255,0.18), transparent 28%), radial-gradient(circle at top right, rgba(13,184,122,0.12), transparent 26%), #050816",
  color: "#eef2ff",
  fontFamily: "'JetBrains Mono', monospace",
};

const shellStyle = {
  width: "100%",
  minHeight: "calc(100vh - 88px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "20px",
  background: "rgba(8, 11, 25, 0.92)",
  boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
};

export default function AdminPage() {
  const [searchParams] = useSearchParams();
  const api = searchParams.get("api") || API_FALLBACK;
  const iframeSrc = `/admin-shell.html?api=${encodeURIComponent(api)}`;

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: 12, letterSpacing: "0.24em", color: "#7aa9ff", textTransform: "uppercase" }}>
              Portfolio CMS
            </div>
            <h1 style={{ margin: "8px 0 10px", fontSize: "clamp(24px, 4vw, 42px)", fontFamily: "'Syne', sans-serif" }}>
              Admin route moved into the React app
            </h1>
            <p style={{ margin: 0, maxWidth: 760, color: "rgba(238,242,255,0.72)", lineHeight: 1.6 }}>
              This route keeps the existing CMS working while giving you a cleaner deployed URL on Vercel.
              Change the API by adding `?api=...` if you want to point the admin UI at another backend.
            </p>
          </div>

          <Link
            to="/"
            style={{
              color: "#eef2ff",
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.14)",
              padding: "12px 16px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.04)",
            }}
          >
            Back to site
          </Link>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "16px",
            padding: "14px 18px",
            borderRadius: 14,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            fontSize: 13,
            overflow: "hidden",
          }}
        >
          <strong style={{ color: "#7ee2b8", whiteSpace: "nowrap" }}>API target</strong>
          <span style={{ color: "rgba(238,242,255,0.76)", textOverflow: "ellipsis", overflow: "hidden" }}>{api}</span>
        </div>

        <iframe title="Portfolio Admin" src={iframeSrc} style={shellStyle} />
      </div>
    </main>
  );
}
