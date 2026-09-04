/* ─────────────────────────────────────────
   RushiPrompts — app.js
   Loads prompts.json async, renders cards
   with lazy images, copy-to-clipboard,
   and live search.
───────────────────────────────────────── */

let allPrompts = [];

const gallery     = document.getElementById('gallery');
const searchInput = document.getElementById('searchInput');
const toast       = document.getElementById('toast');

/* ── SKELETON LOADER ─────────────────── */

function showSkeletons(count = 8) {
  const grid = document.createElement('div');
  grid.className = 'skeleton-grid';
  grid.id = 'skeletonGrid';

  for (let i = 0; i < count; i++) {
    grid.innerHTML += `
      <div class="skeleton-card">
        <div class="skeleton-header">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-lines">
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </div>
        </div>
        <div class="skeleton-image"></div>
        <div class="skeleton-footer">
          <div class="skeleton-icon"></div>
          <div class="skeleton-btn"></div>
          <div class="skeleton-icon"></div>
        </div>
      </div>`;
  }

  gallery.parentNode.insertBefore(grid, gallery);
}

function removeSkeletons() {
  const grid = document.getElementById('skeletonGrid');
  if (grid) grid.remove();
}

/* ── RENDER CARDS ────────────────────── */

function renderCards(data) {
  if (data.length === 0) {
    gallery.innerHTML = `<div class="no-results">No prompts found. Try a different search.</div>`;
    return;
  }

  gallery.innerHTML = data.map((item, index) => `
    <div class="card">
      <div class="card-header">
        <div class="user-info">
          <img src="images/webp/profile.webp"
               class="profile"
               alt="${item.username}'s profile"
               loading="lazy"
               decoding="async"
               width="48" height="48">
          <div>
            <h4>${item.username}</h4>
            <span>${item.time || ''}</span>
          </div>
        </div>
        <div class="dots">⋮</div>
      </div>

      <img src="${item.image}"
           class="main-image"
           alt="AI prompt result ${index + 1}"
           loading="lazy"
           decoding="async">

      <div class="card-actions">
        <div class="left-actions">♡ ${item.likes || ''}</div>
        <button class="copy-btn" data-index="${index}">Copy Prompt</button>
        <div class="bookmark">⌑</div>
      </div>
    </div>
  `).join('');
}

/* ── COPY TO CLIPBOARD ───────────────── */

function showToast() {
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

gallery.addEventListener('click', async (e) => {
  const btn = e.target.closest('.copy-btn');
  if (!btn) return;

  const index = parseInt(btn.dataset.index, 10);
  const text  = allPrompts[index]?.prompt;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    showToast();
  } catch {
    /* Fallback for browsers that block clipboard API */
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showToast();
  }
});

/* ── LIVE SEARCH ─────────────────────── */

let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) {
      renderCards(allPrompts);
      return;
    }
    const filtered = allPrompts.filter(item =>
      item.username.toLowerCase().includes(q) ||
      item.prompt.toLowerCase().includes(q)
    );
    renderCards(filtered);
  }, 200);   /* 200ms debounce — no lag while typing */
});

/* ── BOOTSTRAP ───────────────────────── */

(async () => {
  showSkeletons(8);

  try {
    const res  = await fetch('data/prompts.json');
    if (!res.ok) throw new Error('Failed to load prompts');
    allPrompts = await res.json();
  } catch (err) {
    console.error(err);
    removeSkeletons();
    gallery.innerHTML = `<div class="no-results">⚠️ Could not load prompts. Please refresh.</div>`;
    return;
  }

  removeSkeletons();
  renderCards(allPrompts);
})();
