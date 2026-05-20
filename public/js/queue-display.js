/**
 * queue-display.js
 * Logic untuk halaman display antrian publik (/antrian)
 * SSE client + animasi flash + beep + jam digital + fallback polling
 */

(function () {
  // ============================================
  // State
  // ============================================
  let currentTicket = null;
  let currentCounterName = null;
  let sseSource = null;
  let fallbackTimer = null;
  let lastSSEAt = 0;
  let sessionActive = false;
  const FALLBACK_THRESHOLD = 12000; // 12 detik tanpa SSE → aktifkan polling

  // ============================================
  // DOM References
  // ============================================
  const mainBody         = document.getElementById('mainBody');
  const offlineState     = document.getElementById('offlineState');
  const activeState      = document.getElementById('activeState');
  const ticketNumber     = document.getElementById('ticketNumber');
  const counterNameEl    = document.getElementById('counterName');
  const counterGrid      = document.getElementById('counterGrid');
  const waitingSection   = document.getElementById('waitingSection');
  const waitingList      = document.getElementById('waitingList');
  const waitingCount     = document.getElementById('waitingCount');
  const studentNameDisp  = document.getElementById('studentNameDisplay');
  const studentNameEl    = document.getElementById('studentName');
  const sseIndicator     = document.getElementById('sseIndicator');
  const sseStatusEl      = document.getElementById('sseStatus');
  const clockTime        = document.getElementById('clockTime');
  const clockDate        = document.getElementById('clockDate');
  const mainDisplay      = document.getElementById('mainDisplay');

  // ============================================
  // JAM DIGITAL
  // ============================================
  function updateClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    if (clockTime) clockTime.textContent = `${hh}:${mm}:${ss}`;

    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    if (clockDate) {
      clockDate.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    }
  }
  setInterval(updateClock, 1000);
  updateClock();

  // ============================================
  // BEEP — Web Audio API (tanpa file MP3)
  // ============================================
  function playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      // Ignore jika AudioContext tidak tersedia
    }
  }

  // ============================================
  // ANIMASI FLASH
  // ============================================
  function flashAnimation() {
    if (!mainDisplay) return;
    mainDisplay.classList.remove('flash-animate');
    // Trigger reflow agar animasi bisa diulang
    void mainDisplay.offsetWidth;
    mainDisplay.classList.add('flash-animate');
    setTimeout(() => mainDisplay.classList.remove('flash-animate'), 1300);
  }

  // ============================================
  // UPDATE DISPLAY UTAMA
  // ============================================
  function updateMainDisplay(ticket, counterName, studentName) {
    currentTicket = ticket;
    currentCounterName = counterName;

    if (ticketNumber) ticketNumber.textContent = ticket || '—';
    if (counterNameEl) counterNameEl.textContent = counterName ? `➡ ${counterName.toUpperCase()}` : '—';

    if (studentNameDisp && studentNameEl) {
      if (studentName) {
        studentNameDisp.classList.remove('hidden');
        studentNameEl.textContent = studentName;
      } else {
        studentNameDisp.classList.add('hidden');
      }
    }

    flashAnimation();
    playBeep();
  }

  // ============================================
  // UPDATE GRID LOKET
  // ============================================
  function renderCounterGrid(counters) {
    if (!counterGrid) return;
    if (!counters || counters.length === 0) {
      counterGrid.innerHTML = '<p class="text-white/20 text-xs text-center py-4">—</p>';
      return;
    }

    counterGrid.innerHTML = counters.map(c => {
      const isServing = !!c.ticketNumber;
      return `
        <div class="counter-row flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${isServing ? 'bg-blue-500/10 border border-blue-500/20' : ''}">
          <span class="text-xs font-bold text-white/40 truncate" style="max-width:120px">${c.counterName || `Loket ${c.counterId}`}</span>
          <span class="font-mono font-black text-sm ${isServing ? 'text-blue-300' : 'text-white/20'}">
            ${c.ticketNumber || 'idle'}
          </span>
        </div>
      `;
    }).join('');
  }

  // ============================================
  // UPDATE DAFTAR TUNGGU
  // ============================================
  function renderWaitingList(waiting, showSection) {
    if (!waitingList) return;

    const count = waiting ? waiting.length : 0;
    if (waitingCount) waitingCount.textContent = count;

    if (waitingSection) {
      if (!showSection) {
        waitingSection.classList.add('hidden');
        return;
      }
      waitingSection.classList.remove('hidden');
    }

    if (count === 0) {
      waitingList.innerHTML = '<span class="text-white/20 text-xs">Tidak ada</span>';
      return;
    }

    waitingList.innerHTML = waiting.map((t, i) => `
      <span class="waiting-item font-mono font-bold text-xs px-2 py-1 rounded-lg ${i === 0 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-white/5 text-white/40'}">
        ${t.ticketNumber}${t.studentName ? ` · ${t.studentName.split(' ')[0]}` : ''}
      </span>
    `).join('');
  }

  // ============================================
  // TAMPILKAN STATE SESI
  // ============================================
  function showActiveSession(data) {
    sessionActive = true;
    if (offlineState) offlineState.classList.add('hidden');
    if (activeState) activeState.classList.remove('hidden');

    renderCounterGrid(data.currentServing || []);
    renderWaitingList(data.waiting || [], data.showWaiting !== false);
  }

  function showOfflineSession() {
    sessionActive = false;
    if (activeState) activeState.classList.add('hidden');
    if (offlineState) offlineState.classList.remove('hidden');
    if (ticketNumber) ticketNumber.textContent = '—';
    if (counterNameEl) counterNameEl.textContent = '—';
  }

  // ============================================
  // SSE STATUS INDICATOR
  // ============================================
  function setSSEStatus(status) {
    if (!sseIndicator || !sseStatusEl) return;
    if (status === 'connected') {
      sseIndicator.style.backgroundColor = '#34d399';
      sseStatusEl.textContent = 'Live';
      sseStatusEl.style.color = '#34d399';
    } else if (status === 'polling') {
      sseIndicator.style.backgroundColor = '#f59e0b';
      sseStatusEl.textContent = 'Polling';
      sseStatusEl.style.color = '#f59e0b';
    } else {
      sseIndicator.style.backgroundColor = '#6b7280';
      sseStatusEl.textContent = 'Memuat...';
      sseStatusEl.style.color = '#6b7280';
    }
  }

  // ============================================
  // EVENT HANDLERS
  // ============================================
  function handleCallEvent(data) {
    // Update display nomor dipanggil
    updateMainDisplay(data.ticketNumber, data.counterName, data.studentName);

    // Update grid loket — tandai loket yang baru memanggil
    const grids = counterGrid?.querySelectorAll('.counter-row');
    // Full refresh akan datang dari status_update berikutnya
  }

  function handleDoneEvent(data) {
    // Tidak perlu animasi khusus, grid update dari polling/SSE berikutnya
  }

  function handleStatusUpdate(data) {
    if (data.active === false) {
      showOfflineSession();
    } else {
      showActiveSession(data);
      // Jika data.currentServing ada yang sedang melayani, tampilkan nomor aktif terbaru
      if (data.currentServing) {
        const serving = data.currentServing.filter(c => c.ticketNumber);
        if (serving.length > 0) {
          const last = serving[serving.length - 1];
          if (ticketNumber && ticketNumber.textContent === '—') {
            ticketNumber.textContent = last.ticketNumber;
            if (counterNameEl) counterNameEl.textContent = `➡ ${(last.counterName || '').toUpperCase()}`;
          }
        }
      }
    }
  }

  function handleSessionStart(data) {
    showActiveSession({ currentServing: data.currentServing || [], waiting: [], showWaiting: true });
    if (ticketNumber) ticketNumber.textContent = '—';
    if (counterNameEl) counterNameEl.textContent = '—';
  }

  function handleSessionEnd(data) {
    showOfflineSession();
  }

  // ============================================
  // FALLBACK POLLING
  // ============================================
  async function pollStatus() {
    try {
      const res = await fetch('/api/queue/status');
      const json = await res.json();
      if (json.success) {
        handleStatusUpdate(json.data);
        setSSEStatus('polling');
      }
    } catch (e) {
      // ignore
    }
  }

  function startFallbackPolling() {
    if (fallbackTimer) return;
    setSSEStatus('polling');
    pollStatus();
    fallbackTimer = setInterval(pollStatus, 5000);
  }

  function stopFallbackPolling() {
    if (fallbackTimer) {
      clearInterval(fallbackTimer);
      fallbackTimer = null;
    }
  }

  // ============================================
  // SSE CONNECTION
  // ============================================
  function connectSSE() {
    if (sseSource) {
      sseSource.close();
    }

    sseSource = new EventSource('/api/queue/stream');

    sseSource.addEventListener('status_update', (e) => {
      lastSSEAt = Date.now();
      stopFallbackPolling();
      setSSEStatus('connected');
      try { handleStatusUpdate(JSON.parse(e.data)); } catch(err) {}
    });

    sseSource.addEventListener('call', (e) => {
      lastSSEAt = Date.now();
      stopFallbackPolling();
      setSSEStatus('connected');
      try { handleCallEvent(JSON.parse(e.data)); } catch(err) {}
    });

    sseSource.addEventListener('done', (e) => {
      lastSSEAt = Date.now();
      try { handleDoneEvent(JSON.parse(e.data)); } catch(err) {}
    });

    sseSource.addEventListener('session_start', (e) => {
      lastSSEAt = Date.now();
      try { handleSessionStart(JSON.parse(e.data)); } catch(err) {}
    });

    sseSource.addEventListener('session_end', (e) => {
      lastSSEAt = Date.now();
      try { handleSessionEnd(JSON.parse(e.data)); } catch(err) {}
    });

    sseSource.addEventListener('ping', () => {
      lastSSEAt = Date.now();
    });

    sseSource.onopen = () => {
      setSSEStatus('connected');
      stopFallbackPolling();
      lastSSEAt = Date.now();
    };

    sseSource.onerror = () => {
      setSSEStatus('polling');
      // Jika SSE error, cek apakah sudah lama tidak ada update
      setTimeout(() => {
        if (Date.now() - lastSSEAt > FALLBACK_THRESHOLD) {
          startFallbackPolling();
        }
      }, FALLBACK_THRESHOLD);
    };
  }

  // ============================================
  // INIT
  // ============================================
  function init() {
    // Muat status awal dulu via polling
    pollStatus().then(() => {
      // Lalu sambungkan SSE
      connectSSE();
    });
  }

  // Jalankan setelah DOM siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
