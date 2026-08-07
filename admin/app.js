(() => {
  let token = null;
  const $ = (id) => document.getElementById(id);
  const request = async (url, options = {}) => {
    const response = await fetch(`/api/v1${url}`, { ...options, cache: 'no-store', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) }, credentials: 'same-origin' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error?.message || 'Request failed');
    return body.data;
  };
  const showError = (message) => { $('app-error').textContent = message || ''; };
  const showToast = (message, type = 'success') => {
    const toast = $('app-feedback');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    clearTimeout(window.__toastTimer);
    window.__toastTimer = window.setTimeout(() => { toast.style.display = 'none'; }, 7000);
  };
  let activeTab = 'users';
  const tabButtons = Array.from(document.querySelectorAll('.tab-button'));
  const tabPanels = Array.from(document.querySelectorAll('.tab-panel'));
  const setActiveTab = (tabName) => {
    activeTab = tabName;
    tabButtons.forEach((button) => {
      const isActive = button.dataset.tab === tabName;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', String(isActive));
    });
    tabPanels.forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.tab === tabName);
    });
  };
  const applyTheme = (theme) => { document.body.dataset.theme = theme; $('theme-toggle').textContent = theme === 'dark' ? '☀' : '☾'; localStorage.setItem('artisto-admin-theme', theme); };
  const loginButton = $('login-submit');
  const loginForm = $('login-form');
  const loginEmail = $('email');
  const loginPassword = $('password');
  const passwordToggle = $('password-toggle');
  const setPasswordVisibility = (visible) => {
    loginPassword.type = visible ? 'text' : 'password';
    passwordToggle.textContent = visible ? '🙈' : '👁';
    passwordToggle.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
    passwordToggle.setAttribute('aria-pressed', String(visible));
    passwordToggle.setAttribute('title', visible ? 'Hide password' : 'Show password');
  };
  const setLoginLoading = (loading) => {
    loginButton.disabled = loading;
    loginButton.classList.toggle('is-loading', loading);
    loginButton.textContent = loading ? 'Signing in…' : 'Sign in securely';
    loginEmail.disabled = loading;
    loginPassword.disabled = loading;
    passwordToggle.disabled = loading;
    loginForm.setAttribute('aria-busy', String(loading));
  };
  const load = async (showFeedback = false) => {
    const refreshButton = $('refresh');
    try {
      refreshButton.disabled = true;
      refreshButton.textContent = 'Refreshing…';
      showError('');
      const [stats, users, subscriptions, recruitments, payments] = await Promise.all([
        request('/admin/stats').catch(() => ({ totalUsers: 0, totalOrders: 0, activeSubscriptions: 0, revenue: 0 })),
        request('/admin/tables/users').catch(() => []),
        request('/admin/tables/subscriptions').catch(() => []),
        request('/admin/tables/recruitments').catch(() => []),
        request('/admin/tables/payments').catch(() => []),
      ]);

      $('stats').innerHTML = [
        ['Users', stats.totalUsers],
        ['Orders', stats.totalOrders],
        ['Active subscriptions', stats.activeSubscriptions],
        ['Revenue', `₹${Number(stats.revenue || 0).toLocaleString()}`],
      ].map(([label, value]) => `<div class="stat"><span class="muted">${label}</span><b>${value}</b></div>`).join('');

      // Users
      $('users').replaceChildren(...users.map((user) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${user.username}</td><td>${user.email}</td><td><select data-role="${user.id}"><option ${user.role==='BUYER'?'selected':''}>BUYER</option><option ${user.role==='SELLER'?'selected':''}>SELLER</option><option ${user.role==='ADMIN'?'selected':''}>ADMIN</option></select></td><td>${user.suspended ? 'Suspended' : 'Active'}</td><td class="actions"><button data-suspend="${user.id}" class="${user.suspended ? 'secondary' : 'danger'}">${user.suspended ? 'Restore' : 'Suspend'}</button><button data-delete-user="${user.id}" class="btn btn-secondary">Delete</button></td>`;
        return row;
      }));

      // store maps for record lookups
      window.__subsMap = {};
      window.__paysMap = {};
      window.__recMap = {};

      // Subscriptions
      $('subscriptions').replaceChildren(...subscriptions.map((s) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${s.user?.username || s.username || s.userId}</td><td>${s.plan || s.tier || '-'}</td><td>${s.status || '-'}</td><td>${s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '-'}</td><td>${s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString() : '-'}</td><td class="actions"><button data-sub-id="${s.id}" class="btn btn-secondary">Edit</button></td>`;
        window.__subsMap[s.id] = s;
        return row;
      }));

      // Recruitment posts
      $('recruitments').replaceChildren(...recruitments.map((r) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${r.title}</td><td>${r.company?.name || '-'}</td><td>${r.company?.owner?.username || '-'}</td><td>${r._count?.applications || 0}</td><td>${r.isOpen ? 'Open' : 'Closed'}</td><td class="actions"><button data-post-id="${r.id}" class="btn btn-secondary">View</button></td>`;
        window.__recMap[r.id] = r;
        return row;
      }));

      // Payments
      $('payments').replaceChildren(...payments.map((p) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${p.username || p.user?.username || p.userId}</td><td>${p.amount != null ? `₹${Number(p.amount).toLocaleString()}` : '-'}</td><td>${p.utr || p.transactionRef || '-'}</td><td>${p.status || '-'}</td><td>${p.createdAt ? new Date(p.createdAt).toLocaleString() : '-'}</td><td class="actions"><button data-pay-id="${p.id}" class="btn btn-secondary">Reconcile</button></td>`;
        window.__paysMap[p.id] = p;
        return row;
      }));

      if (showFeedback) showToast('Refreshed successfully.');
    } catch (error) { showError(error.message); }
    finally {
      refreshButton.disabled = false;
      refreshButton.textContent = 'Refresh';
    }
  };
  passwordToggle.addEventListener('click', () => {
    setPasswordVisibility(loginPassword.type === 'password');
  });
  setPasswordVisibility(false);
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); $('login-error').textContent = '';
    setLoginLoading(true);
    try {
      const response = await fetch('/api/v1/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'same-origin', body:JSON.stringify({email:loginEmail.value,password:loginPassword.value}) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error?.message || 'Request failed');
      }
      if (body.data?.user?.role !== 'ADMIN') {
        throw new Error('Administrator access is required.');
      }
      token = body.data.accessToken; $('admin-name').textContent = `Signed in as ${body.data.user.username}`; $('login-view').hidden = true; $('dashboard-view').hidden = false; load();
    } catch (error) { $('login-error').textContent = error.message; }
    finally { setLoginLoading(false); }
  });
  $('users').addEventListener('change', async (event) => { const id = event.target.dataset.role; if (!id || !confirm('Change this user role?')) return load(); try { await request(`/admin/users/${id}/role`, {method:'PATCH',body:JSON.stringify({role:event.target.value})}); load(); } catch(error) { showError(error.message); load(); } });
  $('users').addEventListener('click', async (event) => {
    const suspendId = event.target.dataset.suspend;
    const deleteId = event.target.dataset.deleteUser;
    if (suspendId) {
      if (!confirm('Change this user suspension status?')) return;
      const suspended = event.target.textContent === 'Suspend';
      try {
        await request(`/admin/users/${suspendId}/suspend`, { method: 'PATCH', body: JSON.stringify({ suspended }) });
        load();
      } catch (error) {
        showError(error.message);
      }
      return;
    }
    if (deleteId) {
      if (!confirm('Delete this user and all related data? This cannot be undone.')) return;
      try {
        await request(`/admin/tables/users/${deleteId}`, { method: 'DELETE' });
        showToast('User deleted successfully.');
        load();
      } catch (error) {
        showError(error.message);
      }
      return;
    }
  });
  $('refresh').addEventListener('click', () => load(true));
  tabButtons.forEach((button) => {
    button.addEventListener('click', () => setActiveTab(button.dataset.tab));
  });
  setActiveTab(activeTab);
  // Modal helpers
  const modalOverlay = $('modal-overlay');
  const modalTitle = $('modal-title');
  const modalBody = $('modal-body');
  const modalSave = $('modal-save');
  const modalClose = $('modal-close');
  const modalCancel = $('modal-cancel');
  let currentModal = null;
  let currentRecordId = null;

  function closeModal() {
    modalOverlay.style.display = 'none';
    modalBody.innerHTML = '';
    currentModal = null; currentRecordId = null;
  }
  function openModal(title, contentHtml) {
    modalTitle.textContent = title;
    modalBody.innerHTML = contentHtml;
    modalOverlay.style.display = 'flex';
  }

  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);

  // Subscription edit
  const subsEl = $('subscriptions');
  const paysEl = $('payments');
  if (subsEl) {
    subsEl.addEventListener('click', (e) => {
      const id = e.target.dataset.subId;
      if (!id) return;
      const rec = window.__subsMap && window.__subsMap[id];
      currentModal = 'subscription'; currentRecordId = id;
      const html = `
        <div class="modal-field"><label>User</label><div>${rec?.user?.username || rec?.username || rec?.userId || ''}</div></div>
        <div class="modal-field"><label for="sub-plan">Plan</label><input id="sub-plan" value="${rec?.plan || ''}" /></div>
        <div class="modal-field"><label for="sub-status">Status</label><select id="sub-status"><option ${rec?.status==='ACTIVE'?'selected':''}>ACTIVE</option><option ${rec?.status==='CANCELLED'?'selected':''}>CANCELLED</option><option ${rec?.status==='PAST_DUE'?'selected':''}>PAST_DUE</option></select></div>
        <div class="modal-field"><label>Started</label><div>${rec?.createdAt ? new Date(rec.createdAt).toLocaleString() : '-'}</div></div>
        <div class="modal-field"><label for="sub-expires">Expires</label><input id="sub-expires" type="datetime-local" value="${rec?.currentPeriodEnd ? new Date(rec.currentPeriodEnd).toISOString().slice(0,16) : ''}" /></div>
      `;
      openModal('Edit subscription', html);
    });
  }

  if (paysEl) {
    paysEl.addEventListener('click', (e) => {
      const id = e.target.dataset.payId;
      if (!id) return;
      const rec = window.__paysMap && window.__paysMap[id];
      currentModal = 'payment'; currentRecordId = id;
      const html = `
        <div class="modal-field"><label>User</label><div>${rec?.user?.username || rec?.username || rec?.userId || ''}</div></div>
        <div class="modal-field"><label for="pay-amount">Amount</label><input id="pay-amount" value="${rec?.amount || ''}" /></div>
        <div class="modal-field"><label for="pay-utr">UTR / Transaction ref</label><input id="pay-utr" value="${rec?.utr || rec?.transactionRef || ''}" /></div>
        <div class="modal-field"><label for="pay-status">Status</label><select id="pay-status"><option ${rec?.status==='CAPTURED'?'selected':''}>CAPTURED</option><option ${rec?.status==='PENDING'?'selected':''}>PENDING</option><option ${rec?.status==='FAILED'?'selected':''}>FAILED</option></select></div>
      `;
      openModal('Edit payment', html);
    });
  }

  // Recruitment edit
  const recEl = $('recruitments');
  if (recEl) {
    recEl.addEventListener('click', (e) => {
      const id = e.target.dataset.postId;
      if (!id) return;
      const rec = window.__recMap && window.__recMap[id];
      currentModal = 'recruitment'; currentRecordId = id;
      const html = `
        <label>Company</label><div>${rec?.company?.name || rec?.company || ''}</div>
        <label for="rec-title">Title</label><input id="rec-title" value="${(rec?.title||'').replace(/"/g,'&quot;')}" />
        <label for="rec-salary">Salary</label><input id="rec-salary" value="${rec?.salary || ''}" />
        <label for="rec-isopen">Is open</label><select id="rec-isopen"><option ${rec?.isOpen ? 'selected' : ''}>true</option><option ${!rec?.isOpen ? 'selected' : ''}>false</option></select>
        <label for="rec-desc">Description</label><textarea id="rec-desc" rows="6">${rec?.description || ''}</textarea>
      `;
      openModal('Edit recruitment post', html);
    });
  }

  // Save handler for modal
  modalSave.addEventListener('click', async () => {
    if (!currentModal || !currentRecordId) return;
    try {
      if (currentModal === 'subscription') {
        const body = { plan: $('sub-plan').value, status: $('sub-status').value, expiresAt: $('sub-expires').value || null };
        await request(`/admin/subscriptions/${currentRecordId}`, { method: 'PATCH', body: JSON.stringify(body) });
      } else if (currentModal === 'payment') {
        const body = { amount: $('pay-amount').value, utr: $('pay-utr').value, status: $('pay-status').value };
        await request(`/admin/payments/${currentRecordId}`, { method: 'PATCH', body: JSON.stringify(body) });
      } else if (currentModal === 'recruitment') {
        const body = { title: $('rec-title').value, salary: $('rec-salary').value, isOpen: $('rec-isopen').value === 'true', description: $('rec-desc').value };
        await request(`/admin/recruitments/${currentRecordId}`, { method: 'PATCH', body: JSON.stringify(body) });
      }
      closeModal(); load();
    } catch (err) { showError(err.message); }
  });
  $('theme-toggle').addEventListener('click', () => applyTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark'));
  $('logout').addEventListener('click', async () => { await fetch('/api/v1/auth/logout',{method:'POST',credentials:'same-origin'}).catch(()=>{}); token=null; $('dashboard-view').hidden=true; $('login-view').hidden=false; $('password').value=''; });
  applyTheme(localStorage.getItem('artisto-admin-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
})();
