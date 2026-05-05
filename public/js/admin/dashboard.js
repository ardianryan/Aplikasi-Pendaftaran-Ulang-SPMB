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
        icon: 'group',
        color: 'primary',
        bgColor: 'bg-primary/10',
        textColor: 'text-primary',
      },
      {
        label: 'Sudah Submit',
        value: stats.submitted || 0,
        icon: 'send',
        color: 'surface-tint',
        bgColor: 'bg-[#115cb9]/10',
        textColor: 'text-[#115cb9]',
      },
      {
        label: 'Terverifikasi',
        value: stats.verification?.verified || 0,
        icon: 'verified',
        color: 'tertiary',
        bgColor: 'bg-tertiary/10',
        textColor: 'text-tertiary',
      },
      {
        label: 'Menunggu Verifikasi',
        value: stats.verification?.pending || 0,
        icon: 'pending',
        color: 'amber',
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-700',
      },
    ];

    const grid = document.getElementById('statsGrid');
    grid.innerHTML = cards
      .map(
        (card) => `
      <div class="bg-surface-lowest rounded-xl border border-outline-variant p-5 hover:shadow-sm transition">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm text-on-surface-variant">${card.label}</span>
          <div class="w-9 h-9 ${card.bgColor} rounded-lg flex items-center justify-center">
            <span class="material-symbols-outlined ${card.textColor} text-xl">${card.icon}</span>
          </div>
        </div>
        <p class="text-3xl font-display font-bold text-on-surface">${card.value.toLocaleString('id-ID')}</p>
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
      { label: 'Terverifikasi', value: verification.verified || 0, icon: 'check_circle', color: 'text-tertiary', bg: 'bg-tertiary/10' },
      { label: 'Menunggu', value: verification.pending || 0, icon: 'pending', color: 'text-amber-600', bg: 'bg-amber-100' },
      { label: 'Ditolak', value: verification.rejected || 0, icon: 'cancel', color: 'text-error', bg: 'bg-error/10' },
    ];

    container.innerHTML = items
      .map(
        (item) => `
      <div class="flex items-center gap-3 p-3 rounded-lg ${item.bg}">
        <span class="material-symbols-outlined ${item.color} text-xl">${item.icon}</span>
        <div class="flex-1">
          <p class="text-sm font-medium text-on-surface">${item.label}</p>
        </div>
        <p class="text-lg font-display font-bold text-on-surface">${item.value}</p>
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
      alert('Gagal mengexport data: ' + err.message);
    }
  }
})();
