/**
 * queue-display.js
 * Logic untuk halaman display antrean publik (/antrean)
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
  const rightSection     = document.getElementById('rightSection');
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

  // Announcement DOM References
  const announcementContainer = document.getElementById('announcementContainer');
  const announcementHtmlView  = document.getElementById('announcementHtmlView');
  const announcementYtView    = document.getElementById('announcementYtView');
  const announcementYtIframe  = document.getElementById('announcementYtIframe');
  const themeToggleBtn        = document.getElementById('themeToggleBtn');

  // ============================================
  // THEME CONTROL (Light/Dark Mode)
  // ============================================
  let userInteractedWithTheme = localStorage.getItem('queue_theme_interacted') === 'true';

  function setTheme(theme, isUserAction = false) {
    if (isUserAction) {
      userInteractedWithTheme = true;
      localStorage.setItem('queue_theme_interacted', 'true');
    }

    if (theme === 'light') {
      document.body.classList.add('light-mode');
      if (themeToggleBtn) themeToggleBtn.textContent = '🌙'; // Klik untuk ganti ke gelap
      localStorage.setItem('queue_theme', 'light');
    } else {
      document.body.classList.remove('light-mode');
      if (themeToggleBtn) themeToggleBtn.textContent = '☀️'; // Klik untuk ganti ke terang
      localStorage.setItem('queue_theme', 'dark');
    }
  }

  // Init theme from localStorage
  const localTheme = localStorage.getItem('queue_theme');
  if (localTheme) {
    setTheme(localTheme);
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isLight = document.body.classList.contains('light-mode');
      setTheme(isLight ? 'dark' : 'light', true);
    });
  }

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
  // AUDIO & SUARA ANTREAN (Bel + Text-To-Speech)
  // ============================================
  let audioContext = null;
  let audioUnlocked = false;

  window.initAudio = function () {
    if (audioUnlocked) return;
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioUnlocked = true;
      
      const overlay = document.getElementById('audioOverlay');
      if (overlay) {
        overlay.classList.add('hidden');
      }
      
      playChime();
    } catch (e) {
      console.error("Gagal mengaktifkan AudioContext:", e);
    }
  };

  function playChime() {
    if (!audioContext) return;
    try {
      const now = audioContext.currentTime;
      
      // Nada Pertama (Ting - C#5)
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.connect(gain1);
      gain1.connect(audioContext.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(554.37, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Nada Kedua (Tung - A4)
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440.00, now + 0.35);
      gain2.gain.setValueAtTime(0.25, now + 0.35);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35 + 0.8);
      osc2.start(now + 0.35);
      osc2.stop(now + 0.35 + 0.8);
    } catch (e) {
      console.error(e);
    }
  }

  function speakAnnouncement(ticket, counterName) {
    if (!('speechSynthesis' in window)) return;
    
    // Batalkan panggilan suara sebelumnya agar suara terbaru langsung diputar
    window.speechSynthesis.cancel();

    // Eja nomor tiket (misal A002 -> A kosong kosong dua)
    let spokenTicket = '';
    for (let char of ticket) {
      if (char === '0') {
        spokenTicket += ' kosong ';
      } else if (char === '1') {
        spokenTicket += ' satu ';
      } else if (char === '2') {
        spokenTicket += ' dua ';
      } else if (char === '3') {
        spokenTicket += ' tiga ';
      } else if (char === '4') {
        spokenTicket += ' empat ';
      } else if (char === '5') {
        spokenTicket += ' lima ';
      } else if (char === '6') {
        spokenTicket += ' enam ';
      } else if (char === '7') {
        spokenTicket += ' tujuh ';
      } else if (char === '8') {
        spokenTicket += ' delapan ';
      } else if (char === '9') {
        spokenTicket += ' sembilan ';
      } else {
        spokenTicket += ' ' + char + ' ';
      }
    }

    // Terjemahkan nama loket agar dilafalkan dengan benar dalam Bahasa Indonesia
    let spokenCounter = counterName || '';
    spokenCounter = spokenCounter.replace(/\b1\b/g, 'satu')
                                 .replace(/\b2\b/g, 'dua')
                                 .replace(/\b3\b/g, 'tiga')
                                 .replace(/\b4\b/g, 'empat')
                                 .replace(/\b5\b/g, 'lima')
                                 .replace(/\b6\b/g, 'enam')
                                 .replace(/\b7\b/g, 'tujuh')
                                 .replace(/\b8\b/g, 'delapan')
                                 .replace(/\b9\b/g, 'sembilan');

    const textToSpeak = `Nomor antrean ${spokenTicket.trim()}, silakan menuju ke ${spokenCounter.trim()}.`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'id-ID';
    utterance.rate = 0.85; // Sedikit lebih lambat agar terdengar sangat jelas dan premium
    utterance.pitch = 1.0;

    // Gunakan suara Bahasa Indonesia terbaik jika tersedia
    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find(v => v.lang.startsWith('id') || v.name.toLowerCase().includes('indonesia'));
    if (idVoice) {
      utterance.voice = idVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  function playNotification(ticket, counterName) {
    if (!ticket) return;

    // 1. Bunyikan bel "ting-tung"
    if (audioUnlocked) {
      playChime();
    }

    // 2. Lafalkan suara panggilan setelah bel selesai berbunyi
    setTimeout(() => {
      speakAnnouncement(ticket, counterName);
    }, 1200);
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
    playNotification(ticket, counterName);
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
  // RENDER PENGUMUMAN & MEDIA (Realtime & Dynamic)
  // ============================================
  function renderMediaAnnouncement(type, htmlContent, ytId) {
    if (!announcementContainer) return;

    if (!type || type === 'none') {
      announcementContainer.classList.add('hidden');
      return;
    }

    announcementContainer.classList.remove('hidden');

    if (type === 'html') {
      if (announcementYtView) announcementYtView.classList.add('hidden');
      if (announcementHtmlView) {
        announcementHtmlView.classList.remove('hidden');
        announcementHtmlView.innerHTML = htmlContent || '';
      }
      // Bersihkan Youtube Iframe agar tidak memakan memori di latar belakang
      if (announcementYtIframe) {
        announcementYtIframe.src = '';
        announcementYtIframe.removeAttribute('data-yt-id');
      }
    } else if (type === 'youtube') {
      if (announcementHtmlView) announcementHtmlView.classList.add('hidden');
      if (announcementYtView) announcementYtView.classList.remove('hidden');

      if (announcementYtIframe && ytId) {
        const expectedSrc = `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}`;
        // HANYA update iframe src jika ID video berubah untuk menghindari kedipan/reset dari awal
        if (announcementYtIframe.getAttribute('data-yt-id') !== ytId) {
          announcementYtIframe.src = expectedSrc;
          announcementYtIframe.setAttribute('data-yt-id', ytId);
        }
      }
    }
  }

  // ============================================
  // TAMPILKAN STATE SESI
  // ============================================
  function showActiveSession(data) {
    sessionActive = true;
    if (offlineState) offlineState.classList.add('hidden');
    if (mainDisplay) mainDisplay.classList.remove('hidden');
    if (rightSection) {
      rightSection.classList.remove('hidden');
      rightSection.classList.add('flex');
    }

    renderCounterGrid(data.currentServing || []);
    renderWaitingList(data.waiting || [], data.showWaiting !== false);
  }

  function showOfflineSession() {
    sessionActive = false;
    if (mainDisplay) mainDisplay.classList.add('hidden');
    if (offlineState) offlineState.classList.remove('hidden');
    if (rightSection) {
      rightSection.classList.add('hidden');
      rightSection.classList.remove('flex');
    }
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
  }

  function handleDoneEvent(data) {
    // Tidak perlu animasi khusus, grid update dari polling/SSE berikutnya
  }

  function handleStatusUpdate(data) {
    // Terapkan Tema Default Database jika user belum pernah interaksi manual
    if (data.displayTheme && !userInteractedWithTheme) {
      setTheme(data.displayTheme);
    }

    // Render Pengumuman & Media Realtime
    renderMediaAnnouncement(data.announcementType, data.announcementHtml, data.announcementYtId);

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
