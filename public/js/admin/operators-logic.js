// Manajemen Operator Logic

// Load data
loadOperators();
loadReferrals();

// ============================================
// Create Local Operator
// ============================================

async function createLocalOperator() {
  const nama = document.getElementById('local-nama').value.trim();
  const username = document.getElementById('local-username').value.trim();
  const password = document.getElementById('local-password').value;
  const role = document.getElementById('local-role').value;

  if (!nama) { UI.toast('Nama wajib diisi.', 'error'); return; }
  if (!username || username.length < 3) { UI.toast('Username minimal 3 karakter.', 'error'); return; }
  if (!password || password.length < 6) { UI.toast('Password minimal 6 karakter.', 'error'); return; }

  try {
    await API.request('/admin/operators', {
      method: 'POST',
      body: JSON.stringify({ nama, username, password, role }),
    });
    // Clear form
    document.getElementById('local-nama').value = '';
    document.getElementById('local-username').value = '';
    document.getElementById('local-password').value = '';
    loadOperators();
    UI.toast(`Operator "${nama}" berhasil dibuat.`, 'success');
  } catch (err) {
    UI.toast(err.message || 'Gagal membuat operator.', 'error');
  }
}

// ============================================
// Referral Code Management
// ============================================

async function loadReferrals() {
  try {
    const res = await API.request('/admin/referrals');
    const referrals = res.data || [];
    renderReferrals(referrals);
  } catch (err) {
    document.getElementById('referralList').innerHTML = '<p class="text-sm text-slate-400 text-center py-2">Gagal memuat referral.</p>';
  }
}

function renderReferrals(referrals) {
  const container = document.getElementById('referralList');
  if (referrals.length === 0) {
    container.innerHTML = '<div class="col-span-full py-10 text-center text-slate-400">Belum ada kode referral. Buat kode baru di atas.</div>';
    return;
  }

  container.innerHTML = referrals.map(r => {
    const usedCount = r.usedSlots ? r.usedSlots.length : 0;
    const usedSuffixes = (r.usedSlots || []).map(s => s.suffix).sort((a,b) => a-b);
    const statusClass = r.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100';

    return `
      <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4 relative overflow-hidden group">
        <div class="flex items-center justify-between">
           <code class="font-mono font-extrabold text-lg text-blue-600 tracking-widest">${r.prefix}</code>
           <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${statusClass}">${r.isActive ? 'Aktif' : 'Nonaktif'}</span>
        </div>
        <div class="space-y-1">
           <p class="text-xs font-bold text-slate-800">${r.label || 'Tanpa Label'}</p>
           <p class="text-[10px] font-medium text-slate-400">Terpakai: <span class="text-blue-600">${usedCount}/${r.maxSlots}</span></p>
        </div>
        <div class="flex items-center gap-2 pt-2 border-t border-slate-50">
           <button onclick="toggleRef('${r._id}')" class="flex-1 py-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all text-[10px] font-bold uppercase tracking-widest">
              ${r.isActive ? 'Pause' : 'Aktifkan'}
           </button>
           <button onclick="deleteRef('${r._id}', '${r.prefix}')" class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
              <span class="material-symbols-outlined text-sm">delete</span>
           </button>
        </div>
      </div>
    `;
  }).join('');
}

async function createReferral() {
  const prefix = document.getElementById('new-prefix').value.trim();
  const maxSlots = parseInt(document.getElementById('new-maxslots').value) || 99;
  const label = document.getElementById('new-label').value.trim();

  if (!prefix || prefix.length < 3) {
    UI.toast('Prefix minimal 3 karakter.', 'error');
    return;
  }

  try {
    await API.request('/admin/referrals', {
      method: 'POST',
      body: JSON.stringify({ prefix, maxSlots, label }),
    });
    document.getElementById('new-prefix').value = '';
    document.getElementById('new-label').value = '';
    loadReferrals();
    UI.toast('Kode referral berhasil dibuat.', 'success');
  } catch (err) {
    UI.toast(err.message || 'Gagal membuat referral.', 'error');
  }
}

async function toggleRef(id) {
  try {
    await API.request(`/admin/referrals/${id}/toggle`, { method: 'PUT' });
    loadReferrals();
  } catch (err) {
    UI.toast(err.message || 'Gagal mengubah status.', 'error');
  }
}

async function deleteRef(id, prefix) {
  if (!await UI.confirm('Hapus Kode?', `Hapus kode referral "${prefix}"?`)) return;
  try {
    await API.request(`/admin/referrals/${id}`, { method: 'DELETE' });
    loadReferrals();
    UI.toast('Referral dihapus.', 'success');
  } catch (err) {
    UI.toast(err.message || 'Gagal menghapus.', 'error');
  }
}

// ============================================

async function loadOperators() {
  try {
    const res = await API.request('/admin/operators');
    const operators = res.data || [];
    renderTable(operators);
  } catch (err) {
    if (err.status === 401) return;
    renderTable([]);
  }
}

function renderTable(operators) {
  const tbody = document.getElementById('operatorsTable');

  if (operators.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="5" class="px-8 py-20 text-center text-slate-400">
        <span class="material-symbols-outlined text-4xl text-slate-200 mb-2 block">group_off</span>
        Belum ada operator.
      </td></tr>
    `;
    return;
  }

  tbody.innerHTML = operators.map(op => {
    const lastLogin = op.lastLogin
      ? new Date(op.lastLogin).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Belum pernah';

    const statusBadge = op.isActive
      ? '<span class="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider rounded-lg">Aktif</span>'
      : '<span class="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider rounded-lg">Nonaktif</span>';

    const roleBadge = op.role === 'admin'
      ? '<span class="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-blue-100">Admin</span>'
      : '<span class="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-slate-100">Operator</span>';

    return `
      <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-all">
        <td class="px-8 py-4">
          <div class="flex items-center gap-4">
            ${op.googleAvatar
              ? `<img src="${op.googleAvatar}" class="w-10 h-10 rounded-2xl shadow-sm" alt="">`
              : `<div class="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400"><span class="material-symbols-outlined">person</span></div>`
            }
            <div>
              <p class="font-bold text-slate-800">${op.nama}</p>
              <p class="text-[10px] font-mono text-slate-400">${op.username}</p>
            </div>
          </div>
        </td>
        <td class="px-8 py-4">
           <p class="text-sm font-medium text-slate-600">${op.googleEmail || '-'}</p>
           <p class="text-[10px] font-mono text-slate-400">${op.nip || '-'}</p>
        </td>
        <td class="px-8 py-4">${roleBadge}</td>
        <td class="px-8 py-4">${statusBadge}</td>
        <td class="px-8 py-4">
          <div class="flex items-center gap-1">
            <button onclick="toggleActive('${op._id}', ${!op.isActive})" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-all">
              <span class="material-symbols-outlined text-sm">${op.isActive ? 'block' : 'check_circle'}</span>
            </button>
            <button onclick="deleteOp('${op._id}', this)" data-name="${op.nama.replace(/"/g, '&quot;')}" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
              <span class="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Pull SSO
async function pullSSO() {
  const btn = document.getElementById('btn-pull');
  const btnText = document.getElementById('btn-pull-text');
  btn.disabled = true;
  btnText.textContent = 'Menarik...';

  try {
    const res = await API.request('/admin/sso/pull', { method: 'POST', body: JSON.stringify({}) });
    const result = res.data;
    const pullResult = document.getElementById('pull-result');
    pullResult.classList.remove('hidden');
    pullResult.textContent = `SUKSES: ${result.total} TOTAL | ${result.inserted} BARU | ${result.updated} UPDATED`;
    loadOperators();
    UI.toast('Data SSO berhasil ditarik', 'success');
  } catch (err) {
    UI.toast(err.message || 'Gagal menarik data SSO', 'error');
  } finally {
    btn.disabled = false;
    btnText.textContent = 'Tarik Data SSO';
  }
}

// Actions
async function toggleActive(id, isActive) {
  try {
    await API.request(`/admin/operators/${id}`, { method: 'PUT', body: JSON.stringify({ isActive }) });
    loadOperators();
    UI.toast(isActive ? 'Operator diaktifkan' : 'Operator dinonaktifkan', 'success');
  } catch (err) { UI.toast(err.message, 'error'); }
}

async function deleteOp(id, nameOrElement) {
  const nama = typeof nameOrElement === 'string' ? nameOrElement : nameOrElement.getAttribute('data-name');
  if (!await UI.confirm('Hapus Operator?', `Hapus operator "${nama}"?`)) return;
  try {
    await API.request(`/admin/operators/${id}`, { method: 'DELETE' });
    loadOperators();
    UI.toast('Operator dihapus', 'success');
  } catch (err) { UI.toast(err.message, 'error'); }
}

