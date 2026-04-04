# AMR_ Portfolio — Full Stack Setup

## Architecture

```
portfolio/
├── server/
│   ├── server.js        ← Node.js + Express + SQLite API
│   ├── package.json
│   └── portfolio.db     ← auto-created on first run
├── admin/
│   └── admin.html       ← React Admin CMS (open in browser)
└── portfolio.html       ← Your existing portfolio site
```

---

## 1. Start the API Server

```bash
cd server
npm install
node server.js
```

Server runs at **http://localhost:4000**

Default admin token: `amr_admin_secret_2025`  
Change it: `ADMIN_TOKEN=mytoken node server.js`

---

## 2. Open the Admin Panel

Open `admin/admin.html` in your browser.  
Enter the admin token to log in.

**What you can manage:**
- Profile & hero headline
- Projects (full CRUD, show/hide, reorder)
- Experience timeline
- Skills & percentages
- Tech stack table
- Ticker banner items
- Contact form messages (read/archive/reply)

---

## 3. Connect Portfolio to API

Add this script to `portfolio.html` — it replaces all hardcoded data with live API data:

```html
<script>
const API = 'http://localhost:4000/api';

async function loadPortfolioData() {
  const [profile, projects, experience, skills, stack, ticker] = await Promise.all([
    fetch(`${API}/profile`).then(r => r.json()),
    fetch(`${API}/projects`).then(r => r.json()),
    fetch(`${API}/experience`).then(r => r.json()),
    fetch(`${API}/skills`).then(r => r.json()),
    fetch(`${API}/stack`).then(r => r.json()),
    fetch(`${API}/ticker`).then(r => r.json()),
  ]);

  // Profile
  document.querySelector('.hero-h1 .ln:nth-child(1)').textContent = profile.headline_line1;
  document.querySelector('.grad-b').textContent = profile.headline_line2;
  document.querySelector('.grad-y').textContent = profile.headline_line3;
  document.querySelector('.hero-desc strong:first-child').textContent = profile.name;
  document.querySelector('.nav-status').innerHTML = 
    profile.open_to_work ? `<div class="s-dot"></div>Open to work` : '';

  // Stats
  document.querySelectorAll('[data-count]').forEach((el, i) => {
    const vals = [profile.stat_projects, profile.stat_years, profile.stat_models];
    if (vals[i]) el.dataset.count = vals[i];
  });

  // Contact section
  document.querySelectorAll('.crow-v').forEach((el, i) => {
    const vals = [profile.location, profile.status, profile.focus, profile.timezone];
    if (vals[i]) el.textContent = vals[i];
  });
}

loadPortfolioData();
</script>
```

---

## Public API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/profile | Hero text, stats, social links |
| GET | /api/projects | All visible projects |
| GET | /api/experience | Timeline entries |
| GET | /api/skills | Skill bars |
| GET | /api/stack | Tech stack table |
| GET | /api/ticker | Ticker banner items |
| POST | /api/contact | Submit contact form |

## Admin API Endpoints (require `x-admin-token` header)

| Method | Path |
|--------|------|
| GET/PUT | /api/admin/profile |
| GET/POST | /api/admin/projects |
| PUT/DELETE | /api/admin/projects/:id |
| GET/POST | /api/admin/experience |
| PUT/DELETE | /api/admin/experience/:id |
| GET/POST | /api/admin/skills |
| PUT/DELETE | /api/admin/skills/:id |
| GET/POST | /api/admin/stack |
| PUT/DELETE | /api/admin/stack/:id |
| GET | /api/admin/messages |
| PUT | /api/admin/messages/:id/read |
| PUT | /api/admin/messages/:id/archive |
| DELETE | /api/admin/messages/:id |
| GET | /api/admin/stats |
| GET/POST | /api/admin/ticker |
| PUT/DELETE | /api/admin/ticker/:id |

---

## Production Deployment

```bash
# Set a strong token
export ADMIN_TOKEN="your_secret_here"
export PORT=4000

# Use PM2 to keep it running
npm install -g pm2
pm2 start server.js --name amr-api
pm2 save
```

Reverse proxy with nginx:
```nginx
location /api {
  proxy_pass http://localhost:4000;
  proxy_set_header Host $host;
}
```

Change `const API = 'http://localhost:4000/api'` in both admin.html and portfolio.html to your domain.
