const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = Number(process.env.PORT || 4000);
const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "change-this-admin-token";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
});

const seedProfile = {
  name: "Amirreza",
  tagline: "DS | ML | SWE",
  headline_line1: "BUILDING",
  headline_line2: "INTELLIGENT",
  headline_line3: "SYSTEMS",
  bio: "Operating at the intersection of data science, machine learning engineering, and software development.",
  email: "hi@amirreza.dev",
  github_url: "https://github.com",
  linkedin_url: "https://linkedin.com",
  twitter_url: "https://twitter.com",
  location: "Remote / Worldwide",
  status: "Available now",
  focus: "ML | Data | Full-stack",
  timezone: "Flexible (UTC+4)",
  cv_url: "#",
  open_to_work: true,
  stat_projects: 50,
  stat_years: 5,
  stat_models: 12
};

const seedProjects = [
  {
    sort_order: 1, visible: true, num: "01", title: "LLM Orchestration Platform",
    description: "Multi-provider LLM routing with real-time cost tracking and orchestration.",
    long_desc: "Production-grade platform routing LLM calls across multiple providers with fallback logic.",
    icon: "Lab", accent_class: "ab", status: "live", github_url: "https://github.com", demo_url: "#", case_study_url: "",
    stat1_val: "10k+", stat1_lbl: "Requests/day", stat2_val: "<120ms", stat2_lbl: "Avg latency",
    stat3_val: "4", stat3_lbl: "LLM providers", stat4_val: "99.9%", stat4_lbl: "Uptime",
    tech_tags: "Python,FastAPI,LangChain,Redis,Docker,PostgreSQL",
    key_details: "Weighted routing and latency-aware fallback."
  },
  {
    sort_order: 2, visible: true, num: "02", title: "Real-Time Fraud Detection",
    description: "Stream-based ML pipeline processing 50k+ events/sec.",
    long_desc: "High-throughput event scoring with low-latency inference.",
    icon: "Bolt", accent_class: "ap", status: "live", github_url: "https://github.com", demo_url: "#", case_study_url: "",
    stat1_val: "50k+", stat1_lbl: "Events/sec", stat2_val: "<10ms", stat2_lbl: "P99 latency",
    stat3_val: "-37%", stat3_lbl: "False positives", stat4_val: "99.95%", stat4_lbl: "Accuracy",
    tech_tags: "Kafka,Flink,ONNX,XGBoost,Python,PostgreSQL",
    key_details: "Shadow deployment before full rollout."
  }
];

const seedExperience = [
  { sort_order: 1, visible: true, date_range: "2023 - Present", role: "Senior ML Engineer", company: "Stealth AI Startup | Remote", description: "LLM orchestration, RAG pipelines, and MLOps infrastructure." },
  { sort_order: 2, visible: true, date_range: "2021 - 2023", role: "Data Scientist & ML Engineer", company: "Fintech Company | Berlin", description: "Real-time fraud detection and streaming ML systems." }
];

const seedSkills = [
  { sort_order: 1, visible: true, category: "core", name: "Machine Learning", pct: 96, color_class: "sf-b" },
  { sort_order: 2, visible: true, category: "core", name: "LLM & Agents", pct: 91, color_class: "sf-p" },
  { sort_order: 3, visible: true, category: "core", name: "Data Engineering", pct: 89, color_class: "sf-y" }
];

const seedStack = [
  { sort_order: 1, visible: true, category: "ML / AI", category_color: "b", item_name: "PyTorch" },
  { sort_order: 2, visible: true, category: "ML / AI", category_color: "b", item_name: "HuggingFace" },
  { sort_order: 3, visible: true, category: "Data & Pipelines", category_color: "p", item_name: "Kafka" },
  { sort_order: 4, visible: true, category: "Data & Pipelines", category_color: "p", item_name: "PostgreSQL" },
  { sort_order: 5, visible: true, category: "Software", category_color: "g", item_name: "React / Next.js" }
];

const seedTicker = [
  { sort_order: 1, visible: true, label: "Machine Learning", color: "var(--b1)" },
  { sort_order: 2, visible: true, label: "LLM Engineering", color: "var(--p1)" },
  { sort_order: 3, visible: true, label: "Data Science", color: "var(--y1)" }
];

app.use(cors({ origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN.split(",").map((value) => value.trim()) }));
app.use(express.json({ limit: "1mb" }));

function wrap(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function toBool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1" || value === "true") return true;
  if (value === 0 || value === "0" || value === "false") return false;
  return fallback;
}

function toInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function auth(req, res, next) {
  const incoming = String(req.headers["x-admin-token"] || req.query.token || "");
  const expected = String(ADMIN_TOKEN);
  if (!incoming || incoming.length !== expected.length) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const ok = crypto.timingSafeEqual(Buffer.from(incoming), Buffer.from(expected));
  if (!ok) return res.status(401).json({ error: "Unauthorized" });
  next();
}

async function q(sql, params = []) {
  return pool.query(sql, params);
}

async function one(sql, params = []) {
  const result = await q(sql, params);
  return result.rows[0] || null;
}

async function all(sql, params = []) {
  const result = await q(sql, params);
  return result.rows;
}

async function initDatabase() {
  await q(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL DEFAULT 'Amirreza',
      tagline TEXT NOT NULL DEFAULT 'DS | ML | SWE',
      headline_line1 TEXT DEFAULT 'BUILDING',
      headline_line2 TEXT DEFAULT 'INTELLIGENT',
      headline_line3 TEXT DEFAULT 'SYSTEMS',
      bio TEXT, email TEXT, github_url TEXT, linkedin_url TEXT, twitter_url TEXT,
      location TEXT DEFAULT 'Remote / Worldwide', status TEXT DEFAULT 'Available now',
      focus TEXT DEFAULT 'ML | Data | Full-stack', timezone TEXT DEFAULT 'Flexible (UTC+4)',
      cv_url TEXT, open_to_work BOOLEAN DEFAULT TRUE,
      stat_projects INTEGER DEFAULT 50, stat_years INTEGER DEFAULT 5, stat_models INTEGER DEFAULT 12,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      sort_order INTEGER DEFAULT 0,
      visible BOOLEAN DEFAULT TRUE,
      num TEXT, title TEXT NOT NULL, description TEXT, long_desc TEXT,
      icon TEXT DEFAULT 'Rocket', accent_class TEXT DEFAULT 'ab', status TEXT DEFAULT 'live',
      github_url TEXT, demo_url TEXT, case_study_url TEXT,
      stat1_val TEXT, stat1_lbl TEXT, stat2_val TEXT, stat2_lbl TEXT,
      stat3_val TEXT, stat3_lbl TEXT, stat4_val TEXT, stat4_lbl TEXT,
      tech_tags TEXT, key_details TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS experience (
      id SERIAL PRIMARY KEY,
      sort_order INTEGER DEFAULT 0,
      visible BOOLEAN DEFAULT TRUE,
      date_range TEXT NOT NULL, role TEXT NOT NULL, company TEXT NOT NULL, description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS skills (
      id SERIAL PRIMARY KEY,
      sort_order INTEGER DEFAULT 0,
      visible BOOLEAN DEFAULT TRUE,
      category TEXT NOT NULL, name TEXT NOT NULL, pct INTEGER DEFAULT 80, color_class TEXT DEFAULT 'sf-b'
    );

    CREATE TABLE IF NOT EXISTS stack (
      id SERIAL PRIMARY KEY,
      sort_order INTEGER DEFAULT 0,
      visible BOOLEAN DEFAULT TRUE,
      category TEXT NOT NULL, category_color TEXT DEFAULT 'b', item_name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      name TEXT, email TEXT, subject TEXT, message TEXT,
      read BOOLEAN DEFAULT FALSE, archived BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ticker_items (
      id SERIAL PRIMARY KEY,
      sort_order INTEGER DEFAULT 0,
      visible BOOLEAN DEFAULT TRUE,
      label TEXT NOT NULL, color TEXT DEFAULT 'var(--b1)'
    );
  `);

  const profileCount = await one("SELECT COUNT(*)::int AS count FROM profile");
  if (profileCount.count === 0) {
    await q(
      `INSERT INTO profile (id, name, tagline, headline_line1, headline_line2, headline_line3, bio, email, github_url, linkedin_url, twitter_url, location, status, focus, timezone, cv_url, open_to_work, stat_projects, stat_years, stat_models)
       VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      [seedProfile.name, seedProfile.tagline, seedProfile.headline_line1, seedProfile.headline_line2, seedProfile.headline_line3, seedProfile.bio, seedProfile.email, seedProfile.github_url, seedProfile.linkedin_url, seedProfile.twitter_url, seedProfile.location, seedProfile.status, seedProfile.focus, seedProfile.timezone, seedProfile.cv_url, seedProfile.open_to_work, seedProfile.stat_projects, seedProfile.stat_years, seedProfile.stat_models]
    );
  }

  async function seedTable(table, rows, insertSql, mapRow) {
    const count = await one(`SELECT COUNT(*)::int AS count FROM ${table}`);
    if (count.count !== 0) return;
    for (const row of rows) {
      await q(insertSql, mapRow(row));
    }
  }

  await seedTable("projects", seedProjects,
    `INSERT INTO projects (sort_order, visible, num, title, description, long_desc, icon, accent_class, status, github_url, demo_url, case_study_url, stat1_val, stat1_lbl, stat2_val, stat2_lbl, stat3_val, stat3_lbl, stat4_val, stat4_lbl, tech_tags, key_details)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
    (row) => [row.sort_order, row.visible, row.num, row.title, row.description, row.long_desc, row.icon, row.accent_class, row.status, row.github_url, row.demo_url, row.case_study_url, row.stat1_val, row.stat1_lbl, row.stat2_val, row.stat2_lbl, row.stat3_val, row.stat3_lbl, row.stat4_val, row.stat4_lbl, row.tech_tags, row.key_details]
  );

  await seedTable("experience", seedExperience,
    `INSERT INTO experience (sort_order, visible, date_range, role, company, description) VALUES ($1,$2,$3,$4,$5,$6)`,
    (row) => [row.sort_order, row.visible, row.date_range, row.role, row.company, row.description]
  );

  await seedTable("skills", seedSkills,
    `INSERT INTO skills (sort_order, visible, category, name, pct, color_class) VALUES ($1,$2,$3,$4,$5,$6)`,
    (row) => [row.sort_order, row.visible, row.category, row.name, row.pct, row.color_class]
  );

  await seedTable("stack", seedStack,
    `INSERT INTO stack (sort_order, visible, category, category_color, item_name) VALUES ($1,$2,$3,$4,$5)`,
    (row) => [row.sort_order, row.visible, row.category, row.category_color, row.item_name]
  );

  await seedTable("ticker_items", seedTicker,
    `INSERT INTO ticker_items (sort_order, visible, label, color) VALUES ($1,$2,$3,$4)`,
    (row) => [row.sort_order, row.visible, row.label, row.color]
  );
}

app.get("/health", wrap(async (_req, res) => {
  res.json({ ok: true, database: "connected" });
}));

app.get("/api/profile", wrap(async (_req, res) => res.json(await one("SELECT * FROM profile WHERE id = 1"))));
app.get("/api/projects", wrap(async (_req, res) => res.json(await all("SELECT * FROM projects WHERE visible = TRUE ORDER BY sort_order, id"))));
app.get("/api/experience", wrap(async (_req, res) => res.json(await all("SELECT * FROM experience WHERE visible = TRUE ORDER BY sort_order, id"))));
app.get("/api/skills", wrap(async (_req, res) => res.json(await all("SELECT * FROM skills WHERE visible = TRUE ORDER BY sort_order, id"))));
app.get("/api/stack", wrap(async (_req, res) => res.json(await all("SELECT * FROM stack WHERE visible = TRUE ORDER BY sort_order, id"))));
app.get("/api/ticker", wrap(async (_req, res) => res.json(await all("SELECT * FROM ticker_items WHERE visible = TRUE ORDER BY sort_order, id"))));

app.post("/api/contact", wrap(async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: "Missing fields" });
  const result = await q(
    `INSERT INTO messages (name, email, subject, message) VALUES ($1, $2, $3, $4) RETURNING id`,
    [name.trim(), email.trim(), (subject || "").trim(), message.trim()]
  );
  res.status(201).json({ ok: true, id: result.rows[0].id });
}));

app.get("/api/admin/profile", auth, wrap(async (_req, res) => res.json(await one("SELECT * FROM profile WHERE id = 1"))));
app.get("/api/admin/projects", auth, wrap(async (_req, res) => res.json(await all("SELECT * FROM projects ORDER BY sort_order, id"))));
app.get("/api/admin/experience", auth, wrap(async (_req, res) => res.json(await all("SELECT * FROM experience ORDER BY sort_order, id"))));
app.get("/api/admin/skills", auth, wrap(async (_req, res) => res.json(await all("SELECT * FROM skills ORDER BY sort_order, id"))));
app.get("/api/admin/stack", auth, wrap(async (_req, res) => res.json(await all("SELECT * FROM stack ORDER BY sort_order, id"))));
app.get("/api/admin/ticker", auth, wrap(async (_req, res) => res.json(await all("SELECT * FROM ticker_items ORDER BY sort_order, id"))));

app.put("/api/admin/profile", auth, wrap(async (req, res) => {
  const fields = ["name", "tagline", "headline_line1", "headline_line2", "headline_line3", "bio", "email", "github_url", "linkedin_url", "twitter_url", "location", "status", "focus", "timezone", "cv_url", "open_to_work", "stat_projects", "stat_years", "stat_models"];
  const updates = fields.filter((field) => req.body[field] !== undefined);
  if (!updates.length) return res.json({ ok: true });
  const values = updates.map((field) => {
    if (field === "open_to_work") return toBool(req.body[field], true);
    if (field.startsWith("stat_")) return toInt(req.body[field], 0);
    return req.body[field];
  });
  const setClause = updates.map((field, index) => `${field} = $${index + 1}`).join(", ");
  await q(`UPDATE profile SET ${setClause}, updated_at = NOW() WHERE id = 1`, values);
  res.json({ ok: true });
}));

function makeCrudRoutes(basePath, table, columns) {
  app.post(basePath, auth, wrap(async (req, res) => {
    const body = req.body;
    const values = columns.map((column) => {
      if (column === "sort_order") return toInt(body[column], 0);
      if (column === "visible") return toBool(body[column], true);
      if (column === "pct") return toInt(body[column], 80);
      return body[column] ?? "";
    });
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
    const result = await q(`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders}) RETURNING id`, values);
    res.status(201).json({ ok: true, id: result.rows[0].id });
  }));

  app.put(`${basePath}/:id`, auth, wrap(async (req, res) => {
    const body = req.body;
    const values = columns.map((column) => {
      if (column === "sort_order") return toInt(body[column], 0);
      if (column === "visible") return toBool(body[column], true);
      if (column === "pct") return toInt(body[column], 80);
      return body[column] ?? "";
    });
    const assignments = columns.map((column, index) => `${column} = $${index + 1}`).join(", ");
    await q(`UPDATE ${table} SET ${assignments}${table === "projects" ? ", updated_at = NOW()" : ""} WHERE id = $${columns.length + 1}`, [...values, req.params.id]);
    res.json({ ok: true });
  }));

  app.delete(`${basePath}/:id`, auth, wrap(async (req, res) => {
    await q(`DELETE FROM ${table} WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  }));
}

makeCrudRoutes("/api/admin/projects", "projects", ["sort_order", "visible", "num", "title", "description", "long_desc", "icon", "accent_class", "status", "github_url", "demo_url", "case_study_url", "stat1_val", "stat1_lbl", "stat2_val", "stat2_lbl", "stat3_val", "stat3_lbl", "stat4_val", "stat4_lbl", "tech_tags", "key_details"]);
makeCrudRoutes("/api/admin/experience", "experience", ["sort_order", "visible", "date_range", "role", "company", "description"]);
makeCrudRoutes("/api/admin/skills", "skills", ["sort_order", "visible", "category", "name", "pct", "color_class"]);
makeCrudRoutes("/api/admin/stack", "stack", ["sort_order", "visible", "category", "category_color", "item_name"]);
makeCrudRoutes("/api/admin/ticker", "ticker_items", ["sort_order", "visible", "label", "color"]);

app.get("/api/admin/messages", auth, wrap(async (req, res) => {
  const filter = req.query.filter || "all";
  let sql = "SELECT * FROM messages WHERE archived = FALSE";
  if (filter === "unread") sql = "SELECT * FROM messages WHERE read = FALSE AND archived = FALSE";
  if (filter === "archived") sql = "SELECT * FROM messages WHERE archived = TRUE";
  res.json(await all(`${sql} ORDER BY created_at DESC`));
}));

app.put("/api/admin/messages/:id/read", auth, wrap(async (req, res) => {
  await q("UPDATE messages SET read = TRUE WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
}));

app.put("/api/admin/messages/:id/archive", auth, wrap(async (req, res) => {
  await q("UPDATE messages SET archived = TRUE WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
}));

app.delete("/api/admin/messages/:id", auth, wrap(async (req, res) => {
  await q("DELETE FROM messages WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
}));

app.get("/api/admin/stats", auth, wrap(async (_req, res) => {
  const [projects, messages, unread, skills, stack, experience] = await Promise.all([
    one("SELECT COUNT(*)::int AS count FROM projects"),
    one("SELECT COUNT(*)::int AS count FROM messages WHERE archived = FALSE"),
    one("SELECT COUNT(*)::int AS count FROM messages WHERE read = FALSE AND archived = FALSE"),
    one("SELECT COUNT(*)::int AS count FROM skills"),
    one("SELECT COUNT(*)::int AS count FROM stack"),
    one("SELECT COUNT(*)::int AS count FROM experience")
  ]);
  res.json({ projects: projects.count, messages: messages.count, unread: unread.count, skills: skills.count, stack: stack.count, experience: experience.count });
}));

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Portfolio API running on http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server");
  console.error(error);
  process.exit(1);
});
