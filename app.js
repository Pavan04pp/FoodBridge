// @ts-check
/** FoodBridge — Application Logic (TypeScript-style with JSDoc) */

/** @typedef {'available'|'pending'|'allocated'|'expired'} FoodStatus */
/** @typedef {'pending'|'approved'|'rejected'} RequestStatus */
/** @typedef {'pending'|'in-transit'|'delivered'} DeliveryStep */

// ─── Badge helper ───
/** @param {string} status @returns {string} */
const badge = (status) => {
  const map = {
    available: 'bg-emerald-50 text-emerald-700',
    approved: 'bg-emerald-50 text-emerald-700',
    delivered: 'bg-emerald-50 text-emerald-700',
    pending: 'bg-amber-50 text-amber-700',
    allocated: 'bg-blue-50 text-blue-700',
    'in-transit': 'bg-blue-50 text-blue-700',
    expired: 'bg-red-50 text-red-700',
    rejected: 'bg-red-50 text-red-700',
  };
  return `<span class="inline-flex px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide rounded-full ${map[status] || 'bg-gray-100 text-gray-500'}">${status.replace('-', ' ')}</span>`;
};

// ─── Sample Data ───
const foodItems = [
  { id: 1, name: 'Vegetable Biryani', qty: '10 kg', restaurant: "Raj's Kitchen", location: 'Koramangala, Bangalore', status: 'available', expiresIn: '3h' },
  { id: 2, name: 'Bread Rolls', qty: '50 items', restaurant: "Baker's Delight", location: 'Indiranagar, Bangalore', status: 'available', expiresIn: '8h' },
  { id: 3, name: 'Dal Makhani', qty: '5 kg', restaurant: 'Spice Garden', location: 'HSR Layout, Bangalore', status: 'pending', expiresIn: '2h' },
  { id: 4, name: 'Fresh Fruit Salad', qty: '3 kg', restaurant: 'Green Bowl', location: 'Whitefield, Bangalore', status: 'allocated', expiresIn: '6h' },
  { id: 5, name: 'Paneer Tikka', qty: '20 portions', restaurant: 'Tandoori Nights', location: 'MG Road, Bangalore', status: 'available', expiresIn: '5h' },
  { id: 6, name: 'Caesar Salad', qty: '2 kg', restaurant: 'The Salad Bar', location: 'JP Nagar, Bangalore', status: 'expired', expiresIn: 'Expired' },
];

const requests = [
  { id: '#REQ-1041', ngo: 'Hope Foundation', food: 'Bread Rolls', qty: '30 items', time: '14 Apr, 6:12 PM', status: 'pending' },
  { id: '#REQ-1040', ngo: 'Akshaya Trust', food: 'Paneer Tikka', qty: '15 portions', time: '14 Apr, 5:48 PM', status: 'pending' },
  { id: '#REQ-1039', ngo: 'Feed India', food: 'Dal Makhani', qty: '5 kg', time: '14 Apr, 4:30 PM', status: 'approved' },
  { id: '#REQ-1038', ngo: 'Annapurna NGO', food: 'Veg Pulao', qty: '8 portions', time: '14 Apr, 3:15 PM', status: 'approved' },
  { id: '#REQ-1037', ngo: 'Helping Hands', food: 'Caesar Salad', qty: '2 kg', time: '14 Apr, 2:00 PM', status: 'rejected' },
  { id: '#REQ-1036', ngo: 'Care Foundation', food: 'Fruit Salad', qty: '3 kg', time: '14 Apr, 1:20 PM', status: 'pending' },
  { id: '#REQ-1035', ngo: 'Seva Trust', food: 'Idli & Sambar', qty: '25 portions', time: '14 Apr, 11:45 AM', status: 'approved' },
  { id: '#REQ-1034', ngo: 'New Hope Society', food: 'Expired Pastries', qty: '12 items', time: '14 Apr, 10:30 AM', status: 'rejected' },
];

const deliveries = [
  { food: 'Dal Makhani — 5 kg', ngo: 'Feed India', status: 'in-transit', steps: [{ s: 'completed', t: '4:30 PM' }, { s: 'active', t: '5:15 PM' }, { s: '', t: '—' }] },
  { food: 'Veg Pulao — 8 portions', ngo: 'Annapurna NGO', status: 'delivered', steps: [{ s: 'completed', t: '3:15 PM' }, { s: 'completed', t: '3:50 PM' }, { s: 'completed', t: '4:20 PM' }] },
  { food: 'Idli & Sambar — 25 portions', ngo: 'Seva Trust', status: 'pending', steps: [{ s: 'active', t: '11:45 AM' }, { s: '', t: '—' }, { s: '', t: '—' }] },
  { food: 'Bread Rolls — 40 items', ngo: 'Hope Foundation', status: 'in-transit', steps: [{ s: 'completed', t: '12:00 PM' }, { s: 'active', t: '1:10 PM' }, { s: '', t: '—' }] },
];

const listings = [
  { name: 'Vegetable Biryani', qty: '10 kg', expiry: '14 Apr, 10:00 PM', status: 'available', ngo: null, warn: false },
  { name: 'Dal Makhani', qty: '5 kg', expiry: '14 Apr, 8:30 PM', status: 'allocated', ngo: 'Feed India', warn: true },
  { name: 'Bread Rolls', qty: '50 items', expiry: '15 Apr, 6:00 AM', status: 'pending', ngo: 'Hope Foundation', warn: false },
  { name: 'Paneer Tikka', qty: '20 portions', expiry: '14 Apr, 11:00 PM', status: 'available', ngo: null, warn: false },
  { name: 'Caesar Salad', qty: '2 kg', expiry: '14 Apr, 8:00 PM', status: 'expired', ngo: null, warn: true },
  { name: 'Fresh Fruit Salad', qty: '3 kg', expiry: '15 Apr, 12:00 PM', status: 'allocated', ngo: 'Care Foundation', warn: false },
];

// ─── DOM Ready ───
document.addEventListener('DOMContentLoaded', () => {
  const $ = (/** @type {string} */ s) => document.getElementById(s);
  const sidebar = $('sidebar'), overlay = $('sidebarOverlay');

  // Sidebar toggle
  $('hamburger')?.addEventListener('click', () => { sidebar?.classList.add('max-md:translate-x-0'); sidebar?.classList.remove('max-md:-translate-x-full'); overlay?.classList.remove('hidden'); });
  const closeSB = () => { sidebar?.classList.remove('max-md:translate-x-0'); sidebar?.classList.add('max-md:-translate-x-full'); overlay?.classList.add('hidden'); };
  $('sidebarClose')?.addEventListener('click', closeSB);
  overlay?.addEventListener('click', closeSB);

  // ─── Navigation ───
  const titles = { dashboard: 'Dashboard', 'add-listing': 'Add Food Listing', 'food-listings': 'My Listings', 'browse-food': 'Browse Food', 'request-mgmt': 'Request Management', 'delivery-tracker': 'Delivery Tracker' };
  const subtitles = { dashboard: "Welcome back, Raj's Kitchen", 'add-listing': 'Post surplus food for NGOs', 'food-listings': 'Manage your active listings', 'browse-food': 'Find and request available food', 'request-mgmt': 'Review & approve food requests', 'delivery-tracker': 'Track all active deliveries' };
  const roles = { dashboard: ['Restaurant', 'bg-brand-50 text-brand-700'], 'add-listing': ['Restaurant', 'bg-brand-50 text-brand-700'], 'food-listings': ['Restaurant', 'bg-brand-50 text-brand-700'], 'browse-food': ['NGO', 'bg-blue-50 text-blue-700'], 'request-mgmt': ['Admin', 'bg-amber-50 text-amber-700'], 'delivery-tracker': ['Tracking', 'bg-purple-50 text-purple-700'] };

  /** @param {string} id */
  function navigateTo(id) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`.nav-link[data-page="${id}"]`)?.classList.add('active');
    document.querySelectorAll('.page').forEach(p => { p.classList.remove('active'); p.classList.add('hidden'); });
    const pg = $(`page-${id}`);
    if (pg) { pg.classList.remove('hidden'); pg.classList.add('active'); }
    $('pageTitle').textContent = titles[id] || 'Dashboard';
    $('pageSubtitle').textContent = subtitles[id] || '';
    const [rLabel, rClass] = roles[id] || roles.dashboard;
    const tr = $('topbarRole');
    if (tr) { tr.textContent = rLabel; tr.className = `hidden sm:inline-flex px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full ${rClass}`; }
    closeSB();
    if (id === 'dashboard') animateCounters();
    if (id === 'browse-food') renderFoodCards();
    if (id === 'food-listings') renderListings();
  }

  document.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', e => { e.preventDefault(); navigateTo(l.dataset.page); }));
  document.querySelectorAll('.goto-btn,[data-goto]').forEach(b => b.addEventListener('click', () => navigateTo(b.dataset.goto)));

  // ─── Counter Animation ───
  function animateCounters() {
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = +el.dataset.count; let cur = 0;
      const inc = Math.max(1, Math.ceil(target / 25));
      el.textContent = '0';
      const t = setInterval(() => { cur += inc; if (cur >= target) { el.textContent = target; clearInterval(t); } else el.textContent = cur; }, 35);
    });
  }
  animateCounters();

  // ─── Render Browse Food Cards ───
  async function renderFoodCards() {
    const grid = $('foodGrid'); if (!grid) return;
    const token = localStorage.getItem('foodbridge_token');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:3000/api/food/available', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const { foods } = await res.json();

      if (foods.length === 0) {
        grid.innerHTML = '<div class="col-span-full py-16 text-center text-gray-500 font-medium">No available food right now. Check back later!</div>';
        return;
      }

      grid.innerHTML = foods.map((f, i) => {
        const now = new Date();
        const exp = f.expiry_time ? new Date(f.expiry_time) : null;
        let timeMsg = 'No Expiry';
        let bgClass = 'bg-emerald-50 text-emerald-700';
        if (exp) {
          const diffHrs = Math.floor((exp.getTime() - now.getTime()) / 3600000);
          if (diffHrs < 2) bgClass = 'bg-red-50 text-red-600 font-bold';
          timeMsg = diffHrs > 0 ? `Expires in ${diffHrs}h` : 'Expiring soon';
        }

        return `<div class="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 animate-slide-up" style="animation-delay:${i * 50}ms">
                <div class="flex justify-between items-start mb-4">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-2xl shadow-sm border border-brand-50">🍱</div>
                    ${badge(f.status)}
                </div>
                <h4 class="font-extrabold text-gray-900 text-lg tracking-tight">${f.food_name}</h4>
                <p class="text-sm font-bold text-gray-600 mt-1 mb-5 px-3 py-1 bg-gray-50 rounded-lg inline-block border border-gray-100">${f.quantity}</p>
                <div class="space-y-2 mb-6">
                    <p class="text-xs text-gray-500 flex items-center gap-2 font-medium">🏪 <span class="bg-gray-100 px-2.5 py-1 rounded-md">${f.restaurant_name}</span></p>
                    <p class="text-xs text-gray-400 flex items-center gap-2 font-medium">📍 <span>${f.location}</span></p>
                </div>
                <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span class="text-[11px] font-bold px-3 py-1.5 rounded-full ${bgClass} shadow-sm border border-white">⏰ ${timeMsg}</span>
                    <button class="req-btn px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-xs font-bold shadow-md hover:shadow-brand-500/30 active:scale-95 transition-all" data-id="${f.food_id}">Request</button>
                </div>
            </div>`;
      }).join('');

      grid.querySelectorAll('.req-btn').forEach(b => b.addEventListener('click', async () => {
        // @ts-ignore
        const foodId = b.dataset.id;
        // @ts-ignore
        b.innerHTML = '<span class="animate-pulse">Wait...</span>';
        // @ts-ignore
        b.disabled = true;
        // @ts-ignore
        b.className = 'px-4 py-2.5 rounded-xl bg-gray-200 text-gray-500 text-xs font-bold cursor-not-allowed';

        try {
          const r = await fetch('http://localhost:3000/api/requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ food_id: foodId })
          });
          if (r.ok) { showToast('🎊 Food strictly claimed and requested!'); renderFoodCards(); }
          else showToast('⚠️ Already requested or failed.');
        } catch (e) { showToast('Network Error'); }
      }));
    } catch (e) { console.error(e); }
  }

  // ─── Render Request Table ───
  function renderRequests(filter = 'all') {
    const body = $('requestBody'); if (!body) return;
    body.innerHTML = requests.filter(r => filter === 'all' || r.status === filter).map(r => {
      const isPending = r.status === 'pending';
      return `<tr class="border-b border-gray-50 transition-colors hover:bg-gray-50/50" data-status="${r.status}">
        <td class="px-6 py-4 text-sm font-mono font-semibold text-gray-800">${r.id}</td>
        <td class="px-6 py-4 text-sm font-semibold text-gray-700">${r.ngo}</td>
        <td class="px-6 py-4 text-sm text-gray-600">${r.food}</td>
        <td class="px-6 py-4 text-sm text-gray-500">${r.qty}</td>
        <td class="px-6 py-4 text-sm text-gray-400">${r.time}</td>
        <td class="px-6 py-4">${badge(r.status)}</td>
        <td class="px-6 py-4">${isPending
          ? `<div class="flex gap-2"><button class="approve-btn px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 active:scale-95 transition-all" data-id="${r.id}">Approve</button><button class="reject-btn px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100 text-xs font-bold hover:bg-red-100 active:scale-95 transition-all" data-id="${r.id}">Reject</button></div>`
          : `<span class="text-xs text-gray-400 font-medium">${r.status === 'approved' ? '✓ Done' : '— Closed'}</span>`
        }</td></tr>`;
    }).join('');

    body.querySelectorAll('.approve-btn').forEach(b => b.addEventListener('click', () => {
      const req = requests.find(r => r.id === b.dataset.id); if (req) req.status = 'approved';
      renderRequests(document.querySelector('.tab.active')?.dataset.tab || 'all');
      showToast('Request approved');
    }));
    body.querySelectorAll('.reject-btn').forEach(b => b.addEventListener('click', () => {
      const req = requests.find(r => r.id === b.dataset.id); if (req) req.status = 'rejected';
      renderRequests(document.querySelector('.tab.active')?.dataset.tab || 'all');
      showToast('Request rejected');
    }));
  }
  renderRequests();

  // Tabs
  $('requestTabs')?.addEventListener('click', e => {
    const tab = e.target.closest('.tab'); if (!tab) return;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    renderRequests(tab.dataset.tab);
  });

  // ─── Render Delivery Cards ───
  function renderDeliveries() {
    const grid = $('deliveryGrid'); if (!grid) return;
    const stepLabels = ['Pending', 'In Transit', 'Delivered'];
    grid.innerHTML = deliveries.map((d, i) => {
      return `<div class="bg-white rounded-2xl border border-gray-100 p-6 animate-slide-up" style="animation-delay:${i * 80}ms">
        <div class="flex items-start justify-between mb-8">
          <div>
            <h4 class="font-bold text-gray-900">${d.food}</h4>
            <p class="text-sm text-gray-400 mt-1">🏢 ${d.ngo}</p>
          </div>
          ${badge(d.status)}
        </div>
        <div class="flex items-start">
          ${d.steps.map((st, si) => {
        const isLast = si === 2;
        const dotColor = st.s === 'completed' ? 'bg-brand-500 ring-brand-100' : 'bg-gray-300 ring-gray-100';
        const activeDot = st.s === 'active' ? 'bg-blue-500 ring-blue-100 ring-[6px]' : dotColor + ' ring-4';
        const lineColor = st.s === 'completed' ? 'done' : st.s === 'active' ? 'active-line' : '';
        return `<div class="flex-1 flex flex-col items-center relative">
              <div class="w-4 h-4 rounded-full ${activeDot} z-10"></div>
              ${!isLast ? `<div class="step-connector ${lineColor}"></div>` : ''}
              <p class="text-xs font-semibold mt-3 ${st.s === 'completed' ? 'text-brand-600' : st.s === 'active' ? 'text-blue-600' : 'text-gray-400'}">${stepLabels[si]}</p>
              <p class="text-[10px] text-gray-400 mt-0.5">${st.t}</p>
            </div>`;
      }).join('')}
        </div>
      </div>`;
    }).join('');
  }
  renderDeliveries();

  // ─── Render Listings Table ───
  async function renderListings() {
    const body = $('listingsBody'); if (!body) return;
    const token = localStorage.getItem('foodbridge_token');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:3000/api/food-listings/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const { listings } = await res.json();

      if (listings.length === 0) {
        body.innerHTML = '<tr><td colspan="6" class="px-6 py-10 text-center text-gray-400 font-medium">You have no active or past food listings.</td></tr>';
        return;
      }

      body.innerHTML = listings.map(l => {
        const dt = new Date(l.created_at).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', day: 'numeric', month: 'short' });
        return `<tr class="border-b border-gray-100 hover:bg-gray-50/70 transition-colors">
            <td class="px-6 py-4 text-sm font-extrabold text-gray-900">${l.food_name}</td>
            <td class="px-6 py-4"><span class="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg border border-gray-200">${l.quantity}</span></td>
            <td class="px-6 py-4 text-xs font-bold text-gray-500">${dt}</td>
            <td class="px-6 py-4">${badge(l.status)}</td>
            <td class="px-6 py-4 text-sm text-gray-400 font-medium">—</td>
            <td class="px-6 py-4"><div class="flex gap-2">
              <button class="edit-listing-btn px-3 py-2 rounded-lg border border-gray-200 text-gray-500 text-[10px] uppercase tracking-wider font-extrabold hover:bg-white hover:shadow-sm transition" data-id="${l.food_id}" data-name="${l.food_name}" data-qty="${l.quantity}">Edit</button>
            </div></td></tr>`;
      }).join('');

      body.querySelectorAll('.edit-listing-btn').forEach(b => b.addEventListener('click', async () => {
        const id = b.dataset.id;
        const newName = prompt('Enter new food name (Must be within 5m of creation):', b.dataset.name);
        if (!newName) return;
        const newQty = prompt('Enter new quantity:', b.dataset.qty);
        if (!newQty) return;

        try {
          // @ts-ignore
          b.innerHTML = '...';
          const r = await fetch(`http://localhost:3000/api/food-listings/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ food_name: newName, quantity: newQty })
          });
          const data = await r.json();
          if (r.ok) { showToast('✅ ' + data.message); renderListings(); }
          else showToast('❌ ' + data.error);
        } catch (e) { showToast('Connection Error'); }
      }));

    } catch (e) { console.error(e); }
  }

  // ─── Category Chips ───
  $('categoryChips')?.addEventListener('click', e => {
    const chip = e.target.closest('.chip'); if (!chip) return;
    document.querySelectorAll('#categoryChips .chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
  });

  // ─── Form Submit ───
  $('addFoodForm')?.addEventListener('submit', async e => {
    e.preventDefault();

    // @ts-ignore
    const foodName = $('foodName').value;
    // @ts-ignore
    const foodQty = $('foodQty').value + ' ' + $('foodUnit').value;
    // @ts-ignore
    const foodExpiry = $('foodExpiry').value;

    // @ts-ignore
    const chipNode = document.querySelector('#categoryChips .chip.selected');
    // @ts-ignore
    const category = chipNode ? chipNode.dataset.value : '';

    const payload = {
      food_name: foodName,
      quantity: foodQty,
      expiry_time: foodExpiry ? new Date(foodExpiry).toISOString().slice(0, 19).replace('T', ' ') : null,
      category
    };

    const token = localStorage.getItem('foodbridge_token');
    // @ts-ignore
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Publishing...';
    submitBtn.disabled = true;

    try {
      const res = await fetch('http://localhost:3000/api/food-listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('🎉 Premium Food Listing broadcasted directly to DB!');
        // @ts-ignore
        e.target.reset();
        document.querySelectorAll('#categoryChips .chip').forEach(c => c.classList.remove('selected'));
        document.querySelector('#categoryChips .chip[data-value="cooked"]')?.classList.add('selected');
      } else {
        showToast('⚠️ Failed to post listing. Check backend.');
      }
    } catch (err) {
      showToast('❌ Critical connection error.');
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  // ─── Search/Filter ───
  const searchInput = $('browseSearch');
  const statusSelect = $('statusFilter');
  function filterCards() {
    const q = searchInput?.value.toLowerCase() || '';
    const s = statusSelect?.value || 'all';
    document.querySelectorAll('#foodGrid > div').forEach((card, i) => {
      const name = foodItems[i]?.name.toLowerCase() || '';
      const status = foodItems[i]?.status || '';
      card.style.display = (name.includes(q) && (s === 'all' || status === s)) ? '' : 'none';
    });
  }
  searchInput?.addEventListener('input', filterCards);
  statusSelect?.addEventListener('change', filterCards);

  // ─── Toast ───
  /** @param {string} msg */
  function showToast(msg) {
    const t = $('toast'), m = $('toastMsg');
    if (t && m) { m.textContent = msg; t.classList.add('toast-show'); setTimeout(() => t.classList.remove('toast-show'), 2800); }
  }

  // Set default expiry
  const exp = /** @type {HTMLInputElement} */ ($('foodExpiry'));
  if (exp) { const d = new Date(); d.setHours(d.getHours() + 4); exp.value = d.toISOString().slice(0, 16); }

  // ─── LANDING PAGE LOGIC ───

  // Scroll Reveal Observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');

        // Trigger counters if it's the impact section
        if (entry.target.classList.contains('landing-count') && !entry.target.dataset.counted) {
          entry.target.dataset.counted = 'true';
          const target = +entry.target.dataset.target;
          let cur = 0;
          const inc = Math.max(1, Math.ceil(target / 40));
          const t = setInterval(() => {
            cur += inc;
            if (cur >= target) {
              entry.target.textContent = target.toLocaleString() + '+';
              clearInterval(t);
            } else {
              entry.target.textContent = cur.toLocaleString();
            }
          }, 30);
        }
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

  document.querySelectorAll('.scroll-reveal, .landing-count').forEach(el => observer.observe(el));

  // Parallax Scroll Effect
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;

    // Navbar background
    const nav = $('landingNav');
    if (nav) {
      if (scrolled > 50) {
        nav.classList.add('bg-slate-900/90', 'backdrop-blur-xl', 'border-b', 'border-white/10');
      } else {
        nav.classList.remove('bg-slate-900/90', 'backdrop-blur-xl', 'border-b', 'border-white/10');
      }
    }

    // Hero image subtle parallax
    document.querySelectorAll('.parallax-bg').forEach(bg => {
      // @ts-ignore
      bg.style.transform = `translateY(${scrolled * 0.4}px) scale(1.1)`;
    });
  });

  // ─── AUTHENTICATION LOGIC ───
  let authMode = 'login'; // 'login' or 'register'
  let authRole = 'restaurant'; // 'restaurant' or 'ngo'

  const authModal = $('authModal');
  const authModalInner = $('authModalInner');
  const registerFields = $('registerFields');
  const authSubmitBtn = $('authSubmitBtn');
  const tabLogin = $('tabLogin');
  const tabRegister = $('tabRegister');

  // Open Auth Modal
  const openAuthModal = () => {
    if (authModal && authModalInner) {
      authModal.classList.remove('hidden');
      // small delay for transition
      setTimeout(() => {
        authModal.classList.remove('opacity-0', 'pointer-events-none');
        authModalInner.classList.remove('scale-95');
        authModalInner.classList.add('scale-100');
      }, 10);
    }
  };

  // Close Auth Modal
  const closeAuthModal = () => {
    if (authModal && authModalInner) {
      authModal.classList.add('opacity-0', 'pointer-events-none');
      authModalInner.classList.remove('scale-100');
      authModalInner.classList.add('scale-95');
      setTimeout(() => authModal.classList.add('hidden'), 300);
    }
  };

  $('closeAuthModal')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeAuthModal();
  });

  // Tab Switching
  const switchTab = (mode) => {
    authMode = mode;
    if (mode === 'login') {
      tabLogin.classList.replace('text-gray-500', 'text-brand-600');
      tabLogin.classList.replace('border-transparent', 'border-brand-500');
      tabRegister.classList.replace('text-brand-600', 'text-gray-500');
      tabRegister.classList.replace('border-brand-500', 'border-transparent');
      registerFields.classList.add('hidden');
      authSubmitBtn.textContent = 'Log In';
    } else {
      tabRegister.classList.replace('text-gray-500', 'text-brand-600');
      tabRegister.classList.replace('border-transparent', 'border-brand-500');
      tabLogin.classList.replace('text-brand-600', 'text-gray-500');
      tabLogin.classList.replace('border-brand-500', 'border-transparent');
      registerFields.classList.remove('hidden');
      authSubmitBtn.textContent = 'Register & Continue';
    }
  };

  tabLogin?.addEventListener('click', () => switchTab('login'));
  tabRegister?.addEventListener('click', () => switchTab('register'));

  // Role Switching
  document.querySelectorAll('.auth-role-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.auth-role-btn').forEach(b => {
        b.classList.remove('bg-white', 'shadow', 'text-gray-900');
        b.classList.add('text-gray-500');
      });
      // @ts-ignore
      btn.classList.add('bg-white', 'shadow', 'text-gray-900');
      btn.classList.remove('text-gray-500');
      // @ts-ignore
      authRole = btn.dataset.role;
    });
  });

  // Handle Auth Submit
  $('authForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Grab common fields
    // @ts-ignore
    const email = $('authEmail').value;
    // @ts-ignore
    const password = $('authPassword').value;

    const payload = { role: authRole, email, password };

    if (authMode === 'register') {
      // @ts-ignore
      payload.name = $('authName').value;
      // @ts-ignore
      payload.location = $('authLocation').value;
      // @ts-ignore
      payload.contact = $('authContact').value;
    }

    try {
      authSubmitBtn.textContent = 'Please wait...';
      authSubmitBtn.disabled = true;

      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';

      const res = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(`❌ ${data.error || 'Authentication failed'}`);
        // @ts-ignore
        authSubmitBtn.textContent = authMode === 'login' ? 'Log In' : 'Register & Continue';
        authSubmitBtn.disabled = false;
        return;
      }

      showToast(`🎉 ${data.message || 'Success!'}`);

      if (data.token) {
        localStorage.setItem('foodbridge_token', data.token);
        localStorage.setItem('foodbridge_user', JSON.stringify(data.user));
      }

      closeAuthModal();

      // Enter Dashboard
      const landing = $('landingPage');
      const app = $('dashboardApp');
      if (landing && app) {
        landing.style.opacity = '0';
        landing.style.transform = 'translateY(-20px)';
        landing.style.transition = 'all 0.5s ease-out';

        setTimeout(() => {
          landing.classList.add('hidden');
          app.classList.remove('hidden');
          app.style.opacity = '0';
          app.style.animation = 'fadeIn 0.6s ease-out forwards';

          if (data.user) {
            // @ts-ignore
            $('topbarRole').textContent = data.user.role;
            // @ts-ignore
            $('pageSubtitle').textContent = `Welcome back, ${data.user.name}`;
            // @ts-ignore
            $('sidebarUserName').textContent = data.user.name;

            setupRoleBasedUI(data.user.role);
          }

          animateCounters();
          loadProfile();
        }, 500);
      }

    } catch (err) {
      console.error(err);
      showToast('❌ Backend server error.');
    } finally {
      // @ts-ignore
      authSubmitBtn.innerHTML = authMode === 'login' ? `<span>Log In Securely</span><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>` : 'Register & Continue';
      // @ts-ignore
      authSubmitBtn.disabled = false;
    }
  });

  // Buttons that open the modal instead of instantly entering dashboard
  $('enterDashboardBtn')?.addEventListener('click', openAuthModal);
  $('heroDashboardBtn')?.addEventListener('click', openAuthModal);
  $('ctaDashboardBtn')?.addEventListener('click', openAuthModal);

  // ─── LOGOUT ───
  $('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('foodbridge_token');
    localStorage.removeItem('foodbridge_user');
    location.reload();
  });

  // ─── PROFILE LOAD ───
  async function loadProfile() {
    const token = localStorage.getItem('foodbridge_token');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:3000/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();

      const { profile, history } = data;
      if (profile) {
        // @ts-ignore
        $('profName').textContent = profile.name;
        // @ts-ignore
        $('profRoleBadge').textContent = JSON.parse(localStorage.getItem('foodbridge_user'))?.role || 'User';
        // @ts-ignore
        $('profEmail').textContent = profile.email;
        // @ts-ignore
        $('profLocation').textContent = profile.location;
        // @ts-ignore
        $('profContact').textContent = profile.contact;
        // @ts-ignore
        const sbName = $('sidebarUserName'); if (sbName) sbName.textContent = profile.name;

        const userRole = JSON.parse(localStorage.getItem('foodbridge_user'))?.role || 'User';
        setupRoleBasedUI(userRole);
      }

      const hc = $('profHistoryContainer');
      if (hc) {
        if (!history || history.length === 0) {
          hc.innerHTML = `<p class="text-gray-400 text-center text-sm py-10 w-full">No activity history found yet.</p>`;
        } else {
          hc.innerHTML = history.map((item, i) => {
            const date = new Date(item.time).toLocaleString();
            let icon = '📌', color = 'bg-gray-100/50';
            if (item.action.includes('Listed')) { icon = '🍱'; color = 'bg-brand-50 border-brand-100'; }
            if (item.action.includes('Requested')) { icon = '🤝'; color = 'bg-blue-50 border-blue-100'; }

            return `
              <div class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group animate-slide-up" style="animation-delay:${i * 50}ms">
                  <div class="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-white shadow-md text-sm z-10 shrink-0 md:mx-auto">
                      ${icon}
                  </div>
                  <div class="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border ${color} shadow-sm group-hover:shadow-md transition-shadow">
                      <div class="flex justify-between items-start mb-1">
                          <h4 class="font-bold text-gray-900 text-sm">${item.action}</h4>
                          ${badge(item.status)}
                      </div>
                      <time class="text-[10px] uppercase font-bold tracking-wider text-gray-400">${date}</time>
                  </div>
              </div>`;
          }).join('');
        }
      }

      const df = $('dashboardActivityFeed');
      if (df) {
        if (!history || history.length === 0) {
          df.innerHTML = `<p class="text-gray-400 py-4 text-sm w-full">No recent activity detected.</p>`;
        } else {
          df.innerHTML = history.slice(0, 5).map((item, i) => {
            let icon = '📌', color = 'text-gray-500';
            if (item.action.includes('Listed')) { icon = '🍱'; color = 'text-brand-500'; }
            if (item.action.includes('Requested')) { icon = '🤝'; color = 'text-blue-500'; }
            return `
                 <div class="flex items-start gap-6 animate-slide-right min-h-[60px] group" style="animation-delay:${i * 0.05}s">
                     <div class="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center ${color} text-xl shadow-inner border border-white group-hover:scale-110 transition-transform duration-300">
                         ${icon}</div>
                     <div class="flex-1 min-w-0 pt-1">
                         <p class="text-base text-gray-800 leading-snug"><span class="font-extrabold text-gray-900">${item.action}</span></p>
                         <p class="text-[12px] uppercase font-bold text-gray-400 mt-1">${new Date(item.time).toLocaleTimeString()}</p>
                     </div>
                 </div>`;
          }).join('');
        }
      }

    } catch (err) {
      console.error(err);
    }
  }

  // ─── ROLE BASED UI LOGIC ───
  async function setupRoleBasedUI(role) {
    if (!role) return;
    role = role.toLowerCase();

    // Update Sidebar links
    document.querySelectorAll('[data-role-section]').forEach(el => {
      if (el.dataset.roleSection === role || el.dataset.roleSection === 'all') {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });

    // Update Dashboard Grid and Actions
    const statsGrid = $('dashboardStatsGrid');
    const quickActions = $('dashboardQuickActions');
    const welcomeSub = $('dashWelcomeSub');

    if (statsGrid && quickActions && welcomeSub) {
      const token = localStorage.getItem('foodbridge_token');
      if (role === 'restaurant') {
        welcomeSub.textContent = "Here's the impact of your food donations today.";

        // Fetch Real Stats from Backend
        let stats = { active_listings: 0, deliveries_today: 0, meals_saved: 0, expiring_soon: 0 };
        try {
          const res = await fetch('http://localhost:3000/api/dashboard/stats/restaurant', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) stats = await res.json();
        } catch (e) { console.error('Failed to load stats', e); }

        statsGrid.innerHTML = `
                  <div class="group bg-white/70 backdrop-blur-3xl rounded-3xl border border-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.12)] hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
                      <div class="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                      <div class="relative z-10 flex items-center justify-between mb-6"><div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100/50 flex items-center justify-center text-3xl shadow-inner border border-white">📦</div><span class="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-full shadow-sm">+2 today</span></div>
                      <p class="relative z-10 text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight" data-count="${stats.active_listings}">0</p>
                      <p class="relative z-10 text-sm font-semibold text-gray-500 mt-2 uppercase tracking-wide">Active Listings</p>
                  </div>
                  <div class="group bg-white/70 backdrop-blur-3xl rounded-3xl border border-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.12)] hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
                      <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                      <div class="relative z-10 flex items-center justify-between mb-6"><div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 flex items-center justify-center text-3xl shadow-inner border border-white">🚚</div><span class="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full shadow-sm">On track</span></div>
                      <p class="relative z-10 text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight" data-count="${stats.deliveries_today}">0</p>
                      <p class="relative z-10 text-sm font-semibold text-gray-500 mt-2 uppercase tracking-wide">Deliveries Today</p>
                  </div>
                  <div class="group bg-white/70 backdrop-blur-3xl rounded-3xl border border-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.12)] hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
                      <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                      <div class="relative z-10 flex items-center justify-between mb-6"><div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 flex items-center justify-center text-3xl shadow-inner border border-white">🌍</div></div>
                      <p class="relative z-10 text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight" data-count="${stats.meals_saved}">0</p>
                      <p class="relative z-10 text-sm font-semibold text-gray-500 mt-2 uppercase tracking-wide">Meals Saved</p>
                  </div>
                  <div class="group bg-white/70 backdrop-blur-3xl rounded-3xl border border-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.12)] hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
                      <div class="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                      <div class="relative z-10 flex items-center justify-between mb-6"><div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-50 to-red-100/50 flex items-center justify-center text-3xl shadow-inner border border-white">⚠️</div><span class="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full shadow-sm">Alert</span></div>
                      <p class="relative z-10 text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight" data-count="${stats.expiring_soon}">0</p>
                      <p class="relative z-10 text-sm font-semibold text-gray-500 mt-2 uppercase tracking-wide">Expiring Soon</p>
                  </div>
              `;
        quickActions.innerHTML = `
                  <button data-goto="add-listing" class="goto-btn w-full relative overflow-hidden flex items-center gap-6 p-6 rounded-3xl bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-[0_8px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.5)] active:scale-95 transition-all duration-500 group">
                      <div class="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <span class="relative z-10 w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner">➕</span>
                      <div class="relative z-10 text-left"><p class="font-extrabold text-lg tracking-tight">Add Food Listing</p><p class="text-brand-100 text-sm mt-1 font-medium">Post surplus food instantly</p></div>
                  </button>
                  <button data-goto="food-listings" class="goto-btn w-full relative overflow-hidden flex items-center gap-6 p-6 rounded-3xl border border-white bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)] hover:bg-white active:scale-95 transition-all duration-500 group">
                      <span class="relative z-10 w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 border border-slate-100 shadow-sm">📋</span>
                      <div class="relative z-10 text-left"><p class="font-extrabold text-lg tracking-tight text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">Manage Listings</p><p class="text-gray-500 text-sm mt-1 font-medium">Monitor active donations</p></div>
                  </button>
              `;
      } else if (role === 'ngo') {
        welcomeSub.textContent = "Here are your food requests and deliveries for today.";

        // Fetch Real Stats from Backend
        let stats = { pending_requests: 0, in_transit: 0, meals_received: 0, partner_restaurants: 0 };
        try {
          const res = await fetch('http://localhost:3000/api/dashboard/stats/ngo', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) stats = await res.json();
        } catch (e) { console.error('Failed to load stats', e); }

        statsGrid.innerHTML = `
                  <div class="group bg-white/70 backdrop-blur-3xl rounded-3xl border border-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.12)] hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
                      <div class="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                      <div class="relative z-10 flex items-center justify-between mb-6"><div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 flex items-center justify-center text-3xl shadow-inner border border-white">⏳</div><span class="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full shadow-sm">Pending</span></div>
                      <p class="relative z-10 text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight" data-count="${stats.pending_requests}">0</p>
                      <p class="relative z-10 text-sm font-semibold text-gray-500 mt-2 uppercase tracking-wide">Active Requests</p>
                  </div>
                  <div class="group bg-white/70 backdrop-blur-3xl rounded-3xl border border-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.12)] hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
                      <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                      <div class="relative z-10 flex items-center justify-between mb-6"><div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 flex items-center justify-center text-3xl shadow-inner border border-white">🚚</div><span class="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full shadow-sm">In Transit</span></div>
                      <p class="relative z-10 text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight" data-count="${stats.in_transit}">0</p>
                      <p class="relative z-10 text-sm font-semibold text-gray-500 mt-2 uppercase tracking-wide">Deliveries Today</p>
                  </div>
                  <div class="group bg-white/70 backdrop-blur-3xl rounded-3xl border border-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.12)] hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
                      <div class="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                      <div class="relative z-10 flex items-center justify-between mb-6"><div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100/50 flex items-center justify-center text-3xl shadow-inner border border-white">🥗</div></div>
                      <p class="relative z-10 text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight" data-count="${stats.meals_received}">0</p>
                      <p class="relative z-10 text-sm font-semibold text-gray-500 mt-2 uppercase tracking-wide">Meals Received</p>
                  </div>
                  <div class="group bg-white/70 backdrop-blur-3xl rounded-3xl border border-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.12)] hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
                      <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                      <div class="relative z-10 flex items-center justify-between mb-6"><div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 flex items-center justify-center text-3xl shadow-inner border border-white">🤝</div></div>
                      <p class="relative z-10 text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight" data-count="${stats.partner_restaurants}">0</p>
                      <p class="relative z-10 text-sm font-semibold text-gray-500 mt-2 uppercase tracking-wide">Partners</p>
                  </div>
              `;
        quickActions.innerHTML = `
                  <button data-goto="browse-food" class="goto-btn w-full relative overflow-hidden flex items-center gap-6 p-6 rounded-3xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-[0_8px_30px_rgba(59,130,246,0.3)] hover:shadow-[0_15px_40px_rgba(59,130,246,0.5)] active:scale-95 transition-all duration-500 group">
                      <div class="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <span class="relative z-10 w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 shadow-inner">🔍</span>
                      <div class="relative z-10 text-left"><p class="font-extrabold text-lg tracking-tight">Browse Food</p><p class="text-blue-100 text-sm mt-1 font-medium">Find available surplus immediately</p></div>
                  </button>
              `;
      }

      // Need to re-bind the goto buttons since we just injected HTML
      document.querySelectorAll('.goto-btn,[data-goto]').forEach(b => {
        b.replaceWith(b.cloneNode(true));
      });
      document.querySelectorAll('.goto-btn,[data-goto]').forEach(b => {
        // @ts-ignore
        b.addEventListener('click', () => navigateTo(b.dataset.goto))
      });

      // Re-trigger counter animation for new elements
      animateCounters();
    }
  }

  if (localStorage.getItem('foodbridge_token')) {
    const landing = $('landingPage');
    const app = $('dashboardApp');
    if (landing && app) {
      landing.classList.add('hidden');
      app.classList.remove('hidden');
    }
    loadProfile();
  }

});
