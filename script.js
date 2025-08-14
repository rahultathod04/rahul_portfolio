// Utility helpers
const $ = (q, root=document) => root.querySelector(q);
const $$ = (q, root=document) => [...root.querySelectorAll(q)];

// Year
const yearEl = $("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Theme toggle
const themeToggle = $("#theme-toggle");
if (localStorage.getItem("theme") === "light") document.body.classList.add("light");
themeToggle?.addEventListener("click", () => {
  document.body.classList.toggle("light");
  localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
});

// Particle background with bright colors for both themes
(function heroAnimation(){
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;

  function resize(){
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
  }
  resize();
  window.addEventListener("resize", resize);

  // Color palette: violet, sky blue, white
  const colors = ["#8A2BE2", "#00BFFF", "#FFFFFF", "#9370DB"];
  const dots = Array.from({ length: 90 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 1, // faster movement
    vy: (Math.random() - 0.5) * 1,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));

  function tick(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw particles
    ctx.globalAlpha = 1;
    for (const d of dots){
      d.x += d.vx;
      d.y += d.vy;
      if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
      if (d.y < 0 || d.y > canvas.height) d.vy *= -1;

      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 2.5, 0, Math.PI * 2); // bigger dots
      ctx.fill();
    }

    // Draw connecting lines
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < dots.length; i++){
      for (let j = i + 1; j < dots.length; j++){
        const dx = dots[i].x - dots[j].x;
        const dy = dots[i].y - dots[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < 130){
          ctx.strokeStyle = "#8A2BE2"; // violet lines
          ctx.beginPath();
          ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(dots[j].x, dots[j].y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(tick);
  }
  tick();
})();

// JSON loader
async function loadJSON(path){ const r = await fetch(path); if(!r.ok) throw new Error(`Failed ${path}`); return r.json(); }

// Projects & skills (static JSON)
function createProjectCard(p){
  const card = document.createElement("article");
  card.className = "card project-card";
  card.dataset.kind = p.kind || "data";
  card.innerHTML = `
    <div class="badge">${(p.kind||"data").toUpperCase()}</div>
    <h3>${p.title}</h3>
    <p class="muted">${p.description}</p>
    <div class="project-meta">${(p.tags||[]).map(t=>`<span class="badge">${t}</span>`).join("")}</div>
    <div class="project-actions">
      ${p.demo ? `<a class="btn btn-sm" href="${p.demo}" target="_blank" rel="noopener">Live Demo</a>` : ""}
      ${p.repo ? `<a class="btn btn-sm btn-ghost" href="${p.repo}" target="_blank" rel="noopener">Code</a>` : ""}
      ${p.notebook ? `<a class="btn btn-sm btn-ghost" href="${p.notebook}" target="_blank" rel="noopener">Notebook</a>` : ""}
      ${p.post ? `<a class="btn btn-sm btn-ghost" href="${p.post}" target="_blank" rel="noopener">Write-up</a>` : ""}
    </div>`;
  return card;
}
function renderProjects(projects){
  const grid = $("#project-grid"); grid.innerHTML = "";
  projects.forEach(p => grid.appendChild(createProjectCard(p)));
  const filterBtns = $$(".filter-btn");
  filterBtns.forEach(btn => btn.addEventListener("click", () => {
    filterBtns.forEach(b=>{ b.classList.remove("active"); b.setAttribute("aria-selected","false"); });
    btn.classList.add("active"); btn.setAttribute("aria-selected","true");
    const f = btn.dataset.filter;
    $$("#project-grid .project-card").forEach(card => {
      card.style.display = (f==="all" || card.dataset.kind===f) ? "" : "none";
    });
  }));
}
function createSkillCard(s){
  const card = document.createElement("div");
  card.className = "card skill-card";
  card.innerHTML = `<h4>${s.title}</h4><div class="skill-list">${s.items.map(i=>`<span class="badge">${i}</span>`).join("")}</div>`;
  return card;
}
function renderSkills(skills){
  const grid = $("#skills-grid"); grid.innerHTML = "";
  skills.forEach(s => grid.appendChild(createSkillCard(s)));
}

// --- LIVE INTEGRATIONS ---

// LeetCode live fetch (community API). Falls back to /data/leetcode.json if unreachable.
async function fetchLeetCode(username){
  const url = `https://leetcode-stats-api.herokuapp.com/${encodeURIComponent(username)}`;
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error("LeetCode API failed");
    const data = await r.json();
    // Expected fields: totalSolved, easySolved, mediumSolved, hardSolved, recentSubmissions (array)
    return {
      total: data.totalSolved ?? data.totalSolvedCount ?? null,
      easy: data.easySolved ?? null,
      medium: data.mediumSolved ?? null,
      hard: data.hardSolved ?? null,
      recent: (data.recentSubmissions || []).map(x => ({
        name: x.title || x.titleSlug || "Problem",
        url: x.titleSlug ? `https://leetcode.com/problems/${x.titleSlug}/` : "https://leetcode.com/problemset/"
      }))
    };
  } catch(e){
    try {
      // fallback to local static json if exists
      const lc = await loadJSON("./data/leetcode.json");
      return {
        total: lc.stats?.total ?? null,
        easy: lc.stats?.easy ?? null,
        medium: lc.stats?.medium ?? null,
        hard: lc.stats?.hard ?? null,
        recent: (lc.recent || []).map(r => ({name:r.name, url:r.url}))
      };
    } catch(_){ return null; }
  }
}

function renderLeetCodeLive(lc, username){
  $("#lc-total-live").textContent = lc?.total ?? "—";
  // Update big total solved circle
    const bigCircle = document.getElementById('total-solved-circle-live');
    if (bigCircle && lc?.total != null) {
        bigCircle.textContent = lc.total + " Solved";
    }

  $("#lc-easy-live").textContent = lc?.easy ?? "—";
  $("#lc-medium-live").textContent = lc?.medium ?? "—";
  $("#lc-hard-live").textContent = lc?.hard ?? "—";
  const list = $("#lc-recent-live");
  list.innerHTML = (lc?.recent||[]).slice(0,5).map(r => `
    <li class="card" style="padding:8px 10px; display:flex; justify-content:space-between; align-items:center;">
      <span>${r.name}</span>
      <a class="btn btn-sm btn-ghost" href="${r.url}" target="_blank" rel="noopener">View</a>
    </li>`).join("");
  $("#lc-profile-live").href = `https://leetcode.com/${encodeURIComponent(username)}`;
}

// GitHub live fetch (official API, no token needed for public repos; rate-limited by IP)
async function fetchGitHubRepos(username, n=5){
  const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=${n}`;
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) return [];
  const repos = await r.json();
  return repos.map(repo => ({
    name: repo.name,
    html_url: repo.html_url,
    description: repo.description || "",
    stars: repo.stargazers_count || 0,
    lang: repo.language || "",
    updated: repo.pushed_at || repo.updated_at
  }));
}
function renderGitHubRepos(repos, username){
  const ul = $("#gh-repos");
  ul.innerHTML = repos.map(r => `
    <li class="card" style="padding:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
        <div>
          <strong>${r.name}</strong>
          <div class="muted tiny">${r.lang || "—"} • ⭐ ${r.stars} • Updated ${new Date(r.updated).toLocaleDateString()}</div>
          <div class="muted small">${r.description || ""}</div>
        </div>
        <div><a class="btn btn-sm" href="${r.html_url}" target="_blank" rel="noopener">Code ↗</a></div>
      </div>
    </li>`).join("");
  $("#gh-profile-link").href = `https://github.com/${encodeURIComponent(username)}`;
}

async function setupLeetCodeHover(username){
  const link = $("#leetcode-link");
  const card = $(".hover-card");
  const unameEl = $("#lc-username");
  const titleEl = $("#lc-title");
  const profileEl = $("#lc-profile-link");

  const easyEl = $("#lc-easy");
  const medEl  = $("#lc-medium");
  const hardEl = $("#lc-hard");
  const totalVennEl = $("#lc-total-venn");
  const listEl = $("#lc-recent-list");

  unameEl.textContent = username;
  titleEl.textContent = "Algorithm & DSA progress";
  profileEl.href = `https://leetcode.com/${encodeURIComponent(username)}`;

  const lc = await fetchLeetCode(username);
  if (lc){
    if (totalVennEl) totalVennEl.textContent = lc.total ?? "—";
    easyEl.textContent = lc.easy ?? "—";
    medEl.textContent  = lc.medium ?? "—";
    hardEl.textContent = lc.hard ?? "—";
    listEl.innerHTML = (lc.recent || []).slice(0,5).map(r => `
      <li>
        <span>${r.name}</span>
        <a class="btn btn-sm btn-ghost" href="${r.url}" target="_blank" rel="noopener">View</a>
      </li>`).join("");
  }

  // accessibility
  link?.addEventListener("focus", ()=> card.style.display = "block");
  link?.addEventListener("blur",  ()=> card.style.display = "none");
  link?.addEventListener("mouseenter", ()=> link.setAttribute("aria-expanded","true"));
  link?.addEventListener("mouseleave", ()=> link.setAttribute("aria-expanded","false"));
}



async function boot(){
  // Load static content
  const [projects, skills, cfg] = await Promise.all([
    loadJSON("./data/projects.json").catch(()=>[]),
    loadJSON("./data/skills.json").catch(()=>[]),
    loadJSON("./data/config.json").catch(()=>({}))
  ]);
  renderProjects(projects);
  renderSkills(skills);

  const gh = cfg.github || "octocat";
  const lcUser = cfg.leetcode || "leetcode";
  // Live GitHub
  const repos = await fetchGitHubRepos(gh, 5);
  renderGitHubRepos(repos, gh);
  // Live LeetCode
  const lc = await fetchLeetCode(lcUser);
  renderLeetCodeLive(lc, lcUser);
  // Hover-card
  setupLeetCodeHover(lcUser);
}
boot();
