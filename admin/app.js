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
  const applyTheme = (theme) => { document.body.dataset.theme = theme; $('theme-toggle').textContent = theme === 'dark' ? '☀' : '☾'; localStorage.setItem('artisto-admin-theme', theme); };
  const load = async (showFeedback = false) => {
    const refreshButton = $('refresh');
    try {
      refreshButton.disabled = true;
      refreshButton.textContent = 'Refreshing…';
      showError('');
      const [stats, users] = await Promise.all([request('/admin/stats'), request('/admin/tables/users')]);
      $('stats').innerHTML = [['Users',stats.totalUsers],['Orders',stats.totalOrders],['Active subscriptions',stats.activeSubscriptions],['Revenue',`₹${Number(stats.revenue).toLocaleString()}`]].map(([label,value]) => `<div class="stat"><span class="muted">${label}</span><b>${value}</b></div>`).join('');
      $('users').replaceChildren(...users.map((user) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${user.username}</td><td>${user.email}</td><td><select data-role="${user.id}"><option ${user.role==='BUYER'?'selected':''}>BUYER</option><option ${user.role==='SELLER'?'selected':''}>SELLER</option><option ${user.role==='ADMIN'?'selected':''}>ADMIN</option></select></td><td>${user.suspended ? 'Suspended' : 'Active'}</td><td class="actions"><button data-suspend="${user.id}" class="${user.suspended ? 'secondary' : 'danger'}">${user.suspended ? 'Restore' : 'Suspend'}</button></td>`;
        return row;
      }));
      if (showFeedback) showError('User list refreshed successfully.');
    } catch (error) { showError(error.message); }
    finally {
      refreshButton.disabled = false;
      refreshButton.textContent = 'Refresh';
    }
  };
  $('login-form').addEventListener('submit', async (event) => {
    event.preventDefault(); $('login-error').textContent = '';
    try {
      const body = await fetch('/api/v1/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'same-origin', body:JSON.stringify({email:$('email').value,password:$('password').value}) }).then(async r => ({ ok:r.ok, body:await r.json() }));
      if (!body.ok || body.body.data?.user?.role !== 'ADMIN') throw new Error('Administrator access is required.');
      token = body.body.data.accessToken; $('admin-name').textContent = `Signed in as ${body.body.data.user.username}`; $('login-view').hidden = true; $('dashboard-view').hidden = false; load();
    } catch (error) { $('login-error').textContent = error.message; }
  });
  $('users').addEventListener('change', async (event) => { const id = event.target.dataset.role; if (!id || !confirm('Change this user role?')) return load(); try { await request(`/admin/users/${id}/role`, {method:'PATCH',body:JSON.stringify({role:event.target.value})}); load(); } catch(error) { showError(error.message); load(); } });
  $('users').addEventListener('click', async (event) => { const id = event.target.dataset.suspend; if (!id || !confirm('Change this user suspension status?')) return; const suspended = event.target.textContent === 'Suspend'; try { await request(`/admin/users/${id}/suspend`, {method:'PATCH',body:JSON.stringify({suspended})}); load(); } catch(error) { showError(error.message); } });
  $('refresh').addEventListener('click', () => load(true));
  $('theme-toggle').addEventListener('click', () => applyTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark'));
  $('logout').addEventListener('click', async () => { await fetch('/api/v1/auth/logout',{method:'POST',credentials:'same-origin'}).catch(()=>{}); token=null; $('dashboard-view').hidden=true; $('login-view').hidden=false; $('password').value=''; });
  applyTheme(localStorage.getItem('artisto-admin-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
})();
