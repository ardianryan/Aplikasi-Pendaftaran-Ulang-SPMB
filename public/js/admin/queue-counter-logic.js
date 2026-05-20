/**
 * queue-counter-logic.js
 * Logic untuk halaman Panel Loket Operator (/admin/queue/counter)
 */

(function () {
  let selectedCounterId = null;
  let selectedCounterName = null;
  let sseSource = null;
  let sessionActive = false;
  let studentLinkEnabled = false;
  let statDone = 0;
  let statSkipped = 0;
  let currentSessionId = null;

  // DOM refs
  const counterSelectModal = document.getElementById('counterSelectModal');
  const counterSelectList  = document.getElementById('counterSelectList');
  const counterSelectError = document.getElementById('counterSelectError');
  const counterPanel       = document.getElementById('counterPanel');
  const counterTitle       = document.getElementById('counterTitle');
  const counterMode        = document.getElementById('counterMode');
  const servingNumber      = document.getElementById('servingNumber');
  const servingSince       = document.getElementById('servingSince');
  const studentInfoCard    = document.getElementById('studentInfoCard');
  const servingStudentName = document.getElementById('servingStudentName');
  const servingStudentNisn = document.getElementById('servingStudentNisn');
  const waitingList        = document.getElementById('waitingList');
  const waitingBadge       = document.getElementById('waitingBadge');
  const nisnInputWrapper   = document.getElementById('nisnInputWrapper');
  const lastIssuedDisplay  = document.getElementById('lastIssuedDisplay');
  const lastIssuedNumber   = document.getElementById('lastIssuedNumber');
  const specificTicketInput = document.getElementById('specificTicketInput');
  const issueNisnInput     = document.getElementById('issueNisnInput');
  const btnDone            = document.getElementById('btnDone');
  const btnCallNext        = document.getElementById('btnCallNext');
  const btnSkip            = document.getElementById('btnSkip');
  const btnCallSpecific    = document.getElementById('btnCallSpecific');
  const btnIssueTicket     = document.getElementById('btnIssueTicket');
  const btnChangeCounter   = document.getElementById('btnChangeCounter');
  const statDoneEl         = document.getElementById('statDone');
  const statSkippedEl      = document.getElementById('statSkipped');

  // ============================================
  // INISIALISASI — Muat sesi, tampilkan modal pilih loket
  // ============================================
  async function init() {
    try {
      const token = API.getToken();
      if (!token) { window.location.href = '/admin/login'; return; }

      const res = await API.request('/queue/session');
      if (!res.success || !res.data) {
        showError('Tidak ada sesi antrian aktif. Minta admin untuk memulai sesi.');
        return;
      }

      const session = res.data;
      currentSessionId = session.sessionId;
      sessionActive = session.isActive;
      studentLinkEnabled = session.studentLinkEnabled || false;

      // Tampilkan modal pilih loket
      renderCounterSelectList(session.counterNames, session.currentServing);
    } catch (err) {
      showError('Gagal memuat sesi. Periksa koneksi.');
    }
  }

  function showError(msg) {
    if (counterSelectList) counterSelectList.innerHTML = '';
    if (counterSelectError) {
      counterSelectError.classList.remove('hidden');
      counterSelectError.textContent = msg;
    }
  }

  // ============================================
  // MODAL PILIH LOKET
  // ============================================
  function renderCounterSelectList(names, currentServing) {
    if (!counterSelectList) return;
    counterSelectList.innerHTML = names.map((name, i) => {
      const id = i + 1;
      const serving = currentServing?.find(c => c.counterId === id);
      const isServing = serving && serving.ticketNumber;
      return `
        <button onclick="selectCounter(${id}, '${name.replace(/'/g, "\\'")}')"
          class="relative flex flex-col items-center gap-1 p-3 border-2 rounded-2xl transition-all ${isServing ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-violet-400 hover:bg-violet-50'}">
          <span class="text-2xl">🖥️</span>
          <span class="text-xs font-bold text-slate-700">${name}</span>
          ${isServing ? `<span class="text-[10px] text-blue-500 font-bold">${serving.ticketNumber}</span>` : ''}
        </button>
      `;
    }).join('');
  }

  window.selectCounter = function (id, name) {
    selectedCounterId = id;
    selectedCounterName = name;
    if (counterSelectModal) counterSelectModal.classList.add('hidden');
    if (counterPanel) counterPanel.classList.remove('hidden');
    if (counterTitle) counterTitle.textContent = name;
    if (counterMode) counterMode.textContent = currentSessionId ? 'Sesi Aktif' : 'Tidak ada sesi';

    // Tampilkan field NISN jika student link aktif
    if (nisnInputWrapper) {
      if (studentLinkEnabled) nisnInputWrapper.classList.remove('hidden');
      else nisnInputWrapper.classList.add('hidden');
    }

    // Sambungkan SSE untuk update real-time
    connectSSE();
    // Muat waiting list awal
    loadWaitingList();
    // Muat statistik loket ini
    loadCounterStats();
  };

  // ============================================
  // SSE untuk update waiting list
  // ============================================
  function connectSSE() {
    if (sseSource) sseSource.close();
    sseSource = new EventSource('/api/queue/stream');

    sseSource.addEventListener('call', (e) => {
      try {
        const data = JSON.parse(e.data);
        // Jika loket ini yang memanggil, update display
        if (data.counterId === selectedCounterId) {
          updateServingDisplay(data.ticketNumber, data.studentName, data.studentNisn, new Date().toISOString());
        }
        // Refresh waiting list setelah panggilan
        loadWaitingList();
      } catch(err) {}
    });

    sseSource.addEventListener('done', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.counterId === selectedCounterId) {
          clearServingDisplay();
          loadCounterStats();
        }
        loadWaitingList();
      } catch(err) {}
    });

    sseSource.addEventListener('skip', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.counterId === selectedCounterId) {
          clearServingDisplay();
          loadCounterStats();
        }
        loadWaitingList();
      } catch(err) {}
    });

    sseSource.addEventListener('status_update', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.waiting) renderWaitingList(data.waiting);
      } catch(err) {}
    });

    sseSource.onerror = () => {
      // Fallback: poll waiting setiap 5 detik
      setTimeout(loadWaitingList, 5000);
    };
  }

  // ============================================
  // WAITING LIST
  // ============================================
  async function loadWaitingList() {
    try {
      const res = await fetch('/api/queue/status');
      const json = await res.json();
      if (json.success && json.data && json.data.waiting) {
        renderWaitingList(json.data.waiting);
      }
    } catch(err) {}
  }

  function renderWaitingList(waiting) {
    if (!waitingList) return;
    if (waitingBadge) waitingBadge.textContent = waiting.length;

    if (waiting.length === 0) {
      waitingList.innerHTML = '<p class="text-xs text-slate-300 text-center py-4">Tidak ada antrian</p>';
      updateButtonStates(false);
      return;
    }

    waitingList.innerHTML = waiting.map((t, i) => `
      <div class="flex items-center justify-between px-3 py-2 rounded-xl ${i === 0 ? 'bg-violet-50 border border-violet-100' : 'hover:bg-slate-50'} transition-all">
        <div>
          <span class="font-mono font-black text-sm ${i === 0 ? 'text-violet-700' : 'text-slate-600'}">${t.ticketNumber}</span>
          ${t.studentName ? `<span class="text-xs text-slate-400 ml-2">${t.studentName}</span>` : ''}
        </div>
        ${i === 0 ? '<span class="text-[10px] font-bold text-violet-500">BERIKUTNYA</span>' : ''}
      </div>
    `).join('');

    updateButtonStates(true);
  }

  // ============================================
  // DISPLAY NOMOR YANG DILAYANI
  // ============================================
  function updateServingDisplay(number, studentName, studentNisn, calledAt) {
    if (servingNumber) {
      servingNumber.textContent = number || '—';
      servingNumber.style.color = number ? '#1e293b' : '#e2e8f0';
    }
    if (servingSince && calledAt) {
      const t = new Date(calledAt);
      servingSince.textContent = `Dipanggil ${t.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Student link info
    if (studentInfoCard && servingStudentName && servingStudentNisn) {
      if (studentLinkEnabled && studentName) {
        studentInfoCard.classList.remove('hidden');
        servingStudentName.textContent = studentName;
        servingStudentNisn.textContent = `NISN: ${studentNisn || '—'}`;
      } else {
        studentInfoCard.classList.add('hidden');
      }
    }

    if (btnDone) btnDone.disabled = !number;
    if (btnSkip) btnSkip.disabled = !number;
  }

  function clearServingDisplay() {
    updateServingDisplay(null, null, null, null);
    if (servingSince) servingSince.textContent = 'Tidak ada yang dilayani';
  }

  function updateButtonStates(hasWaiting) {
    if (btnCallNext) btnCallNext.disabled = !hasWaiting;
  }

  // ============================================
  // STATISTIK LOKET
  // ============================================
  async function loadCounterStats() {
    // Hitung dari tiket sesi ini yang dilayani oleh loket ini
    try {
      const res = await fetch(`/api/queue/tickets?limit=1000`, {
        headers: { 'Authorization': `Bearer ${API.getToken()}` }
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const myTickets = json.data.filter(t => t.counterId === selectedCounterId);
        statDone = myTickets.filter(t => t.status === 'done').length;
        statSkipped = myTickets.filter(t => t.status === 'skipped').length;
        if (statDoneEl) statDoneEl.textContent = statDone;
        if (statSkippedEl) statSkippedEl.textContent = statSkipped;
      }
    } catch(err) {}
  }

  // ============================================
  // AKSI TOMBOL
  // ============================================

  // Panggil berikutnya
  if (btnCallNext) {
    btnCallNext.addEventListener('click', async () => {
      if (!selectedCounterId) return;
      setLoading(btnCallNext, true, '→');
      try {
        const res = await API.request('/queue/call', {
          method: 'POST',
          body: JSON.stringify({ counterId: selectedCounterId })
        });
        if (res.success) {
          updateServingDisplay(res.data.ticketNumber, res.data.studentName, null, new Date().toISOString());
          loadWaitingList();
        } else {
          alert(res.message || 'Tidak ada antrian menunggu');
        }
      } catch(err) {
        alert('Gagal memanggil antrian');
      } finally {
        setLoading(btnCallNext, false, '→');
      }
    });
  }

  // Selesai
  if (btnDone) {
    btnDone.addEventListener('click', async () => {
      if (!selectedCounterId) return;
      setLoading(btnDone, true, '✅');
      try {
        const res = await API.request('/queue/done', {
          method: 'POST',
          body: JSON.stringify({ counterId: selectedCounterId })
        });
        if (res.success) {
          clearServingDisplay();
          loadCounterStats();
          loadWaitingList();
        } else {
          alert(res.message || 'Gagal menandai selesai');
        }
      } catch(err) {
        alert('Gagal menandai selesai');
      } finally {
        setLoading(btnDone, false, '✅');
      }
    });
  }

  // Lewati
  if (btnSkip) {
    btnSkip.addEventListener('click', async () => {
      if (!selectedCounterId) return;
      if (!confirm('Lewati nomor ini? Nomor akan ditandai tidak hadir.')) return;
      setLoading(btnSkip, true, '⏭');
      try {
        const res = await API.request('/queue/skip', {
          method: 'POST',
          body: JSON.stringify({ counterId: selectedCounterId })
        });
        if (res.success) {
          clearServingDisplay();
          loadCounterStats();
          loadWaitingList();
        } else {
          alert(res.message || 'Gagal melewati nomor');
        }
      } catch(err) {
        alert('Gagal melewati nomor');
      } finally {
        setLoading(btnSkip, false, '⏭');
      }
    });
  }

  // Panggil nomor tertentu
  if (btnCallSpecific) {
    btnCallSpecific.addEventListener('click', async () => {
      const num = (specificTicketInput?.value || '').trim().toUpperCase();
      if (!num) { alert('Masukkan nomor tiket'); return; }
      if (!selectedCounterId) return;
      setLoading(btnCallSpecific, true, 'Panggil');
      try {
        const res = await API.request('/queue/call/specific', {
          method: 'POST',
          body: JSON.stringify({ counterId: selectedCounterId, ticketNumber: num })
        });
        if (res.success) {
          updateServingDisplay(res.data.ticketNumber, null, null, new Date().toISOString());
          if (specificTicketInput) specificTicketInput.value = '';
          loadWaitingList();
        } else {
          alert(res.message || 'Tiket tidak ditemukan');
        }
      } catch(err) {
        alert('Gagal memanggil nomor');
      } finally {
        setLoading(btnCallSpecific, false, 'Panggil');
      }
    });
  }

  // Terbitkan tiket baru
  if (btnIssueTicket) {
    btnIssueTicket.addEventListener('click', async () => {
      const nisn = (issueNisnInput?.value || '').trim();
      setLoading(btnIssueTicket, true, '+ Terbitkan Nomor');
      try {
        const body = studentLinkEnabled && nisn ? { studentNisn: nisn } : {};
        const res = await API.request('/queue/ticket', {
          method: 'POST',
          body: JSON.stringify(body)
        });
        if (res.success) {
          if (lastIssuedDisplay) lastIssuedDisplay.classList.remove('hidden');
          if (lastIssuedNumber) lastIssuedNumber.textContent = res.data.ticketNumber;
          if (issueNisnInput) issueNisnInput.value = '';
          loadWaitingList();
        } else {
          alert(res.message || 'Gagal menerbitkan tiket');
        }
      } catch(err) {
        alert('Gagal menerbitkan tiket');
      } finally {
        setLoading(btnIssueTicket, false, '+ Terbitkan Nomor');
      }
    });
  }

  // Ganti loket
  if (btnChangeCounter) {
    btnChangeCounter.addEventListener('click', () => {
      if (sseSource) sseSource.close();
      if (counterPanel) counterPanel.classList.add('hidden');
      if (counterSelectModal) counterSelectModal.classList.remove('hidden');
      init();
    });
  }

  // ============================================
  // HELPER: Loading state tombol
  // ============================================
  function setLoading(btn, loading, originalText) {
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
      btn.setAttribute('data-original', btn.textContent);
      btn.textContent = '...';
    } else {
      btn.textContent = btn.getAttribute('data-original') || originalText;
    }
  }

  // ============================================
  // START
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
