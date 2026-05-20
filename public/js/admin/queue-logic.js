/**
 * queue-logic.js
 * Logic untuk halaman Manajemen Antrian Admin (/admin/queue)
 */

(function () {
  let currentPage = 1;
  const limit = 50;
  let totalPages = 1;
  let totalItems = 0;
  let sseSource = null;
  let refreshTimer = null;

  // DOM refs
  const sessionStatusDot    = document.getElementById('sessionStatusDot');
  const sessionStatusText   = document.getElementById('sessionStatusText');
  const sessionMeta         = document.getElementById('sessionMeta');
  const sessionStats        = document.getElementById('sessionStats');
  const counterSection      = document.getElementById('counterSection');
  const counterGrid         = document.getElementById('counterGrid');
  const statTotal           = document.getElementById('statTotal');
  const statWaiting         = document.getElementById('statWaiting');
  const statDone            = document.getElementById('statDone');
  const statSkipped         = document.getElementById('statSkipped');
  const btnStartPreReg      = document.getElementById('btnStartPreReg');
  const btnStartReReg       = document.getElementById('btnStartReReg');
  const btnEndSession       = document.getElementById('btnEndSession');
  const ticketTableBody     = document.getElementById('ticketTableBody');
  const ticketStatusFilter  = document.getElementById('ticketStatusFilter');
  const btnRefreshTickets   = document.getElementById('btnRefreshTickets');
  const ticketPaginationInfo = document.getElementById('ticketPaginationInfo');
  const ticketPrevPage      = document.getElementById('ticketPrevPage');
  const ticketNextPage      = document.getElementById('ticketNextPage');
  const ticketPageNumbers   = document.getElementById('ticketPageNumbers');

  // ============================================
  // MUAT SESI AKTIF
  // ============================================
  async function loadSession() {
    try {
      const res = await API.request('/admin/queue/session');
      if (res.success && res.data) {
        renderSessionActive(res.data);
      } else {
        renderSessionInactive();
      }
    } catch (err) {
      renderSessionInactive();
    }
  }

  function renderSessionActive(session) {
    if (sessionStatusDot) sessionStatusDot.style.backgroundColor = '#22c55e';
    if (sessionStatusText) {
      sessionStatusText.textContent = 'SESI AKTIF';
      sessionStatusText.style.color = '#16a34a';
    }

    const modeLabel = session.mode === 'pre_registration' ? 'Pra-Pendaftaran' : 'Daftar Ulang';
    const startTime = session.startedAt ? new Date(session.startedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—';
    if (sessionMeta) {
      sessionMeta.textContent = `Mode: ${modeLabel} | Prefix: ${session.prefix} | Loket: ${session.counterCount} | Mulai: ${startTime}`;
    }

    // Statistik
    if (sessionStats) sessionStats.classList.remove('hidden');
    const s = session.stats || {};
    if (statTotal) statTotal.textContent = s.total || 0;
    if (statWaiting) statWaiting.textContent = s.waiting || 0;
    if (statDone) statDone.textContent = s.done || 0;
    if (statSkipped) statSkipped.textContent = s.skipped || 0;

    // Tombol
    if (btnStartPreReg) btnStartPreReg.disabled = true;
    if (btnStartReReg) btnStartReReg.disabled = true;
    if (btnEndSession) btnEndSession.disabled = false;

    // Grid loket
    renderCounterGrid(session.currentServing || [], session.counterNames || []);

    // Muat tiket
    loadTickets();
  }

  function renderSessionInactive() {
    if (sessionStatusDot) sessionStatusDot.style.backgroundColor = '#94a3b8';
    if (sessionStatusText) {
      sessionStatusText.textContent = 'TIDAK ADA SESI AKTIF';
      sessionStatusText.style.color = '#94a3b8';
    }
    if (sessionMeta) sessionMeta.textContent = 'Mulai sesi baru untuk mengaktifkan antrian';
    if (sessionStats) sessionStats.classList.add('hidden');
    if (counterSection) counterSection.classList.add('hidden');
    if (btnStartPreReg) btnStartPreReg.disabled = false;
    if (btnStartReReg) btnStartReReg.disabled = false;
    if (btnEndSession) btnEndSession.disabled = true;
    if (ticketTableBody) {
      ticketTableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-16 text-center text-slate-300 text-sm">Belum ada sesi aktif</td></tr>';
    }
    if (ticketPaginationInfo) ticketPaginationInfo.textContent = '—';
  }

  // ============================================
  // GRID STATUS LOKET
  // ============================================
  function renderCounterGrid(currentServing, counterNames) {
    if (!counterSection || !counterGrid) return;
    counterSection.classList.remove('hidden');

    const allCounters = counterNames.map((name, i) => {
      const serving = currentServing.find(c => c.counterId === (i + 1));
      return { id: i + 1, name, ticketNumber: serving?.ticketNumber || null };
    });

    counterGrid.innerHTML = allCounters.map(c => `
      <div class="flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all ${c.ticketNumber ? 'bg-violet-50 border-violet-200' : 'bg-slate-50 border-slate-100'}">
        <span class="text-lg">🖥️</span>
        <p class="text-xs font-bold text-slate-500">${c.name}</p>
        <p class="font-mono font-black text-lg ${c.ticketNumber ? 'text-violet-700' : 'text-slate-300'}">
          ${c.ticketNumber || 'idle'}
        </p>
        <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${c.ticketNumber ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-400'}">
          ${c.ticketNumber ? 'Melayani' : 'Menunggu'}
        </span>
      </div>
    `).join('');
  }

  // ============================================
  // DAFTAR TIKET (PAGINATED)
  // ============================================
  async function loadTickets() {
    if (!ticketTableBody) return;

    const status = ticketStatusFilter?.value || '';
    const params = new URLSearchParams({ page: currentPage, limit });
    if (status) params.set('status', status);

    try {
      const res = await API.request(`/admin/queue/tickets?${params.toString()}`);
      if (!res.success) {
        ticketTableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-16 text-center text-slate-300 text-sm">Gagal memuat tiket</td></tr>';
        return;
      }

      totalItems = res.meta?.total || 0;
      totalPages = res.meta?.totalPages || 1;

      renderTicketTable(res.data || []);
      renderTicketPagination();
    } catch (err) {
      ticketTableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-16 text-center text-slate-300 text-sm">Gagal memuat tiket</td></tr>';
    }
  }

  function renderTicketTable(tickets) {
    if (!ticketTableBody) return;
    if (tickets.length === 0) {
      ticketTableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-16 text-center text-slate-300 text-sm">Belum ada tiket</td></tr>';
      return;
    }

    const statusBadges = {
      waiting:  '<span class="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-lg border border-amber-100">Menunggu</span>',
      serving:  '<span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg border border-blue-100">Dilayani</span>',
      done:     '<span class="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100">Selesai</span>',
      skipped:  '<span class="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-lg border border-slate-200">Dilewati</span>',
    };

    const fmt = (iso) => iso ? new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

    ticketTableBody.innerHTML = tickets.map(t => `
      <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-all">
        <td class="px-6 py-3 font-mono font-black text-slate-800">${t.ticketNumber}</td>
        <td class="px-6 py-3">${statusBadges[t.status] || t.status}</td>
        <td class="px-6 py-3 text-sm text-slate-500">${t.counterName || '—'}</td>
        <td class="px-6 py-3 text-xs text-slate-500 font-mono">${fmt(t.calledAt)}</td>
        <td class="px-6 py-3 text-xs text-slate-500 font-mono">${fmt(t.doneAt)}</td>
        <td class="px-6 py-3 text-xs text-slate-600">${t.studentName || '—'}</td>
      </tr>
    `).join('');
  }

  function renderTicketPagination() {
    if (ticketPaginationInfo) {
      const start = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
      const end = Math.min(currentPage * limit, totalItems);
      ticketPaginationInfo.textContent = `Menampilkan ${start}–${end} dari ${totalItems} tiket`;
    }
    if (ticketPrevPage) ticketPrevPage.disabled = currentPage <= 1;
    if (ticketNextPage) ticketNextPage.disabled = currentPage >= totalPages;

    if (ticketPageNumbers) {
      const pages = [];
      for (let p = Math.max(1, currentPage - 2); p <= Math.min(totalPages, currentPage + 2); p++) pages.push(p);
      ticketPageNumbers.innerHTML = pages.map(p => `
        <button onclick="goTicketPage(${p})" class="w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-all ${p === currentPage ? 'bg-violet-600 text-white' : 'hover:bg-white border border-transparent hover:border-slate-200 text-slate-500'}">${p}</button>
      `).join('');
    }
  }

  window.goTicketPage = (p) => { currentPage = p; loadTickets(); };

  // ============================================
  // KONTROL SESI
  // ============================================
  async function startSession(mode) {
    if (!confirm(`Mulai sesi antrian mode "${mode === 'pre_registration' ? 'Pra-Pendaftaran' : 'Daftar Ulang'}"?\nSesi aktif sebelumnya (jika ada) akan diakhiri.`)) return;

    try {
      const res = await API.request('/admin/queue/session/start', {
        method: 'POST',
        body: JSON.stringify({ mode })
      });
      if (res.success) {
        UI.toast('Sesi antrian dimulai', 'success');
        loadSession();
      } else {
        UI.toast(res.message || 'Gagal memulai sesi', 'error');
      }
    } catch (err) {
      UI.toast('Gagal memulai sesi', 'error');
    }
  }

  async function endSession() {
    if (!confirm('Akhiri sesi antrian? Semua nomor yang belum terlayani akan tertinggal.')) return;
    try {
      const res = await API.request('/admin/queue/session/end', { method: 'POST' });
      if (res.success) {
        UI.toast('Sesi diakhiri', 'success');
        loadSession();
      } else {
        UI.toast(res.message || 'Gagal mengakhiri sesi', 'error');
      }
    } catch (err) {
      UI.toast('Gagal mengakhiri sesi', 'error');
    }
  }

  // ============================================
  // SSE untuk update real-time stats loket
  // ============================================
  function connectSSE() {
    sseSource = new EventSource('/api/queue/stream');
    sseSource.addEventListener('call', () => loadSession());
    sseSource.addEventListener('done', () => loadSession());
    sseSource.addEventListener('skip', () => loadSession());
    sseSource.addEventListener('session_start', () => loadSession());
    sseSource.addEventListener('session_end', () => renderSessionInactive());
    sseSource.onerror = () => {
      // Polling setiap 15 detik sebagai fallback
      if (!refreshTimer) {
        refreshTimer = setInterval(loadSession, 15000);
      }
    };
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================
  if (btnStartPreReg) btnStartPreReg.addEventListener('click', () => startSession('pre_registration'));
  if (btnStartReReg) btnStartReReg.addEventListener('click', () => startSession('re_registration'));
  if (btnEndSession) btnEndSession.addEventListener('click', endSession);
  if (btnRefreshTickets) btnRefreshTickets.addEventListener('click', () => { currentPage = 1; loadTickets(); });
  if (ticketStatusFilter) ticketStatusFilter.addEventListener('change', () => { currentPage = 1; loadTickets(); });
  if (ticketPrevPage) ticketPrevPage.addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadTickets(); } });
  if (ticketNextPage) ticketNextPage.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; loadTickets(); } });

  // ============================================
  // INIT
  // ============================================
  function init() {
    loadSession();
    connectSSE();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
