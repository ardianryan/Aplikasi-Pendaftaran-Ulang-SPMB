/**
 * Admin Dashboard Logic
 * Loads stats and renders metric cards, jalur breakdown, verification status
 */

(function () {
  'use strict';

  // Auth check
  if (!API.getToken() || !localStorage.getItem('spmb_admin')) {
    window.location.href = '/admin/login';
    return;
  }

  // Set admin name
  const admin = JSON.parse(localStorage.getItem('spmb_admin') || '{}');
  const adminNameEl = document.getElementById('adminName');
  if (adminNameEl && admin.nama) {
    adminNameEl.textContent = admin.nama;
  }

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    API.clearToken();
    localStorage.removeItem('spmb_admin');
    window.location.href = '/admin/login';
  });

  // Export link
  document.getElementById('exportLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    downloadExport();
  });

  // Load dashboard data
  loadStats();

  async function loadStats() {
    try {
      const res = await API.request('/admin/stats');
      const stats = res.data || {};

      // Ensure defaults for empty state
      const safeStats = {
        total: stats.total || 0,
        submitted: stats.submitted || 0,
        notStarted: stats.notStarted || 0,
        verification: {
          verified: stats.verification?.verified || 0,
          rejected: stats.verification?.rejected || 0,
          pending: stats.verification?.pending || 0,
        },
        byJalur: stats.byJalur || {},
      };

      renderCards(safeStats);
      renderJalurList(safeStats.byJalur);
      renderVerificationStatus(safeStats.verification);
    } catch (err) {
      if (err.status === 401) return;
      console.error('Failed to load stats:', err);
      // Show zero state instead of error
      renderCards({ total: 0, submitted: 0, verification: { verified: 0, pending: 0 } });
      renderJalurList({});
      renderVerificationStatus({ verified: 0, pending: 0, rejected: 0 });
    }
  }

  function renderCards(stats) {
    const cards = [
      {
        label: 'Total Pendaftar',
        value: stats.total || 0,
        icon: 'groups',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-600',
      },
      {
        label: 'Sudah Submit',
        value: stats.submitted || 0,
        icon: 'send',
        bgColor: 'bg-indigo-50',
        textColor: 'text-indigo-600',
      },
      {
        label: 'Terverifikasi',
        value: stats.verification?.verified || 0,
        icon: 'verified',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-600',
      },
      {
        label: 'Menunggu Verifikasi',
        value: stats.verification?.pending || 0,
        icon: 'pending',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-600',
      },
    ];

    const grid = document.getElementById('statsGrid');
    grid.innerHTML = cards
      .map(
        (card) => `
      <div class="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 ${card.bgColor} ${card.textColor} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
            <span class="material-symbols-outlined">${card.icon}</span>
          </div>
        </div>
        <p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">${card.label}</p>
        <p class="text-3xl font-extrabold text-slate-800">${card.value.toLocaleString('id-ID')}</p>
      </div>
    `
      )
      .join('');
  }

  function renderJalurList(byJalur) {
    const container = document.getElementById('jalurList');

    // Convert object { "Tahap 1": 5 } to array [{ name: "Tahap 1", count: 5 }]
    let jalurArray = [];
    if (Array.isArray(byJalur)) {
      jalurArray = byJalur.map(j => ({ name: j._id || j.jalur || 'Lainnya', count: j.count || 0 }));
    } else if (byJalur && typeof byJalur === 'object') {
      jalurArray = Object.entries(byJalur).map(([name, count]) => ({ name, count: count || 0 }));
    }

    if (jalurArray.length === 0) {
      container.innerHTML = `
        <div class="text-center py-6 text-on-surface-variant">
          <p class="text-sm">Belum ada data pendaftar</p>
        </div>
      `;
      return;
    }

    const total = jalurArray.reduce((sum, j) => sum + j.count, 0);

    container.innerHTML = jalurArray
      .map((jalur) => {
        const pct = total > 0 ? Math.round((jalur.count / total) * 100) : 0;
        return `
        <div class="flex items-center gap-4">
          <div class="flex-1">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-on-surface">${jalur.name}</span>
              <span class="text-sm text-on-surface-variant">${jalur.count} siswa</span>
            </div>
            <div class="w-full h-2 bg-surface-low rounded-full overflow-hidden">
              <div class="h-full bg-primary rounded-full transition-all" style="width: ${pct}%"></div>
            </div>
          </div>
          <span class="text-xs text-outline w-10 text-right">${pct}%</span>
        </div>
      `;
      })
      .join('');
  }

  function renderVerificationStatus(verification) {
    const container = document.getElementById('verificationStatus');
    const items = [
      { label: 'Terverifikasi', value: verification.verified || 0, icon: 'check_circle', color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Menunggu', value: verification.pending || 0, icon: 'pending', color: 'text-amber-600', bg: 'bg-amber-50' },
      { label: 'Ditolak', value: verification.rejected || 0, icon: 'cancel', color: 'text-red-600', bg: 'bg-red-50' },
    ];

    container.innerHTML = items
      .map(
        (item) => `
      <div class="flex items-center gap-4 p-4 rounded-3xl ${item.bg} border border-white shadow-sm">
        <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center ${item.color} shadow-sm">
           <span class="material-symbols-outlined text-xl">${item.icon}</span>
        </div>
        <div class="flex-1">
          <p class="text-xs font-bold text-slate-700">${item.label}</p>
        </div>
        <p class="text-xl font-extrabold text-slate-800">${item.value}</p>
      </div>
    `
      )
      .join('');

    // Show notification badge if pending > 0
    if (verification.pending > 0) {
      document.getElementById('notifBadge')?.classList.remove('hidden');
    }
  }

  async function downloadExport() {
    try {
      const token = API.getToken();
      const response = await fetch('/api/admin/export', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Export gagal');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-spmb-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      UI.error('Export Gagal', 'Gagal mengexport data: ' + err.message);
    }
  }
})();
