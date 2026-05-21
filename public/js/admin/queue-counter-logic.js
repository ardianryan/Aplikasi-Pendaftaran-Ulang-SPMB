/**
 * queue-counter-logic.js
 * Logic untuk halaman Panel Loket Operator (/admin/queue/counter)
 */

(function () {
  let appTimezone = 'WIB';
  const tzMapping = { 'WIB': 'Asia/Jakarta', 'WITA': 'Asia/Makassar', 'WIT': 'Asia/Jayapura' };
  let selectedCounterId = null;
  let selectedCounterName = null;
  let sseSource = null;
  let sessionActive = false;
  let studentLinkEnabled = false;
  let statDone = 0;
  let statSkipped = 0;
  let currentSessionId = null;
  let sessionData = null;
  let currentCounterStatus = 'tutup';

  let recallCount = 0;

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
  const btnToggleBreak     = document.getElementById('btnToggleBreak');
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
        showError('Tidak ada sesi antrean aktif. Minta admin untuk memulai sesi.');
        return;
      }

      const session = res.data;
      sessionData = session;
      currentSessionId = session.sessionId;
      sessionActive = session.isActive;
      studentLinkEnabled = session.studentLinkEnabled || false;

      // Check if counter is saved in localStorage
      const savedCounterId = localStorage.getItem('spmb_selected_counter_id');
      const savedCounterName = localStorage.getItem('spmb_selected_counter_name');
      if (savedCounterId && savedCounterName) {
        try {
          const joinRes = await API.request('/queue/counter/join', {
            method: 'POST',
            body: JSON.stringify({ counterId: parseInt(savedCounterId) })
          });
          if (joinRes.success) {
            setupActiveCounter(parseInt(savedCounterId), savedCounterName);
            const myCounter = session.currentServing.find(cs => cs.counterId === parseInt(savedCounterId));
            if (myCounter) {
              updateBreakButtonUI(myCounter.status);
            }
            return;
          } else {
            localStorage.removeItem('spmb_selected_counter_id');
            localStorage.removeItem('spmb_selected_counter_name');
          }
        } catch (e) {
          localStorage.removeItem('spmb_selected_counter_id');
          localStorage.removeItem('spmb_selected_counter_name');
        }
      }

      // Tampilkan modal pilih loket
      renderCounterSelectList(session.counterNames, session.currentServing);
    } catch (err) {
      showError('Gagal memuat sesi. Periksa koneksi.');
    }
  }

  function showError(msg, clearList = true) {
    if (clearList && counterSelectList) counterSelectList.innerHTML = '';
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
      const operators = serving?.operators || [];
      const isFull = operators.length >= 2;
      const status = serving?.status || 'tutup';
      
      let statusBadge = '';
      if (status === 'istirahat') {
        statusBadge = '<span class="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-100 text-amber-800">Istirahat</span>';
      } else if (status === 'buka') {
        statusBadge = '<span class="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-100 text-emerald-800">Buka</span>';
      } else {
        statusBadge = '<span class="px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-100 text-slate-500">Tutup</span>';
      }
      
      let opText = '';
      if (operators.length > 0) {
        opText = `<span class="text-[9px] text-slate-500 font-medium">${operators.length}/2 Op: ${operators.map(o => o.name).join(', ')}</span>`;
      } else {
        opText = `<span class="text-[9px] text-slate-400 font-medium">Kosong</span>`;
      }

      const buttonStyle = isFull 
        ? 'border-red-200 bg-red-50/50 cursor-not-allowed opacity-80' 
        : (status === 'buka' ? 'border-emerald-200 bg-emerald-50/30 hover:border-violet-400 hover:bg-violet-50' : 'border-slate-200 hover:border-violet-400 hover:bg-violet-50');

      return `
        <button onclick="if(${isFull}) { alert('Loket penuh! Maksimal 2 operator.'); return; } selectCounter(${id}, this)"
          data-name="${name.replace(/"/g, '&quot;')}"
          class="relative flex flex-col items-center gap-1.5 p-4 border-2 rounded-2xl transition-all col-span-3 sm:col-span-1 ${buttonStyle}">
          <span class="text-2xl">${status === 'istirahat' ? '☕' : '🖥️'}</span>
          <span class="text-xs font-bold text-slate-700">${name}</span>
          <div class="flex items-center gap-1 flex-wrap justify-center">
            ${statusBadge}
            ${serving && serving.ticketNumber ? `<span class="px-1.5 py-0.5 rounded text-[8px] font-black bg-blue-100 text-blue-800">${serving.ticketNumber}</span>` : ''}
          </div>
          ${opText}
        </button>
      `;
    }).join('');
  }

  function setupActiveCounter(id, name) {
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
    // Muat tiket yang sedang dilayani saat ini di loket ini
    syncServingTicket();
  }

  window.selectCounter = async function (id, nameOrElement) {
    const name = typeof nameOrElement === 'string' ? nameOrElement : nameOrElement.getAttribute('data-name');
    if (counterSelectError) {
      counterSelectError.classList.add('hidden');
    }
    
    try {
      const res = await API.request('/queue/counter/join', {
        method: 'POST',
        body: JSON.stringify({ counterId: id })
      });
      
      if (res.success) {
        localStorage.setItem('spmb_selected_counter_id', id);
        localStorage.setItem('spmb_selected_counter_name', name);
        setupActiveCounter(id, name);
        if (res.data) {
          updateBreakButtonUI(res.data.status);
        }
      } else {
        showError(res.message || 'Gagal masuk ke loket ini. Loket mungkin penuh.', false);
      }
    } catch (err) {
      showError(err.message || 'Gagal masuk ke loket ini. Loket mungkin penuh.', false);
    }
  };

  function updateBreakButtonUI(status) {
    currentCounterStatus = status;
    if (!btnToggleBreak) return;
    
    if (status === 'istirahat') {
      btnToggleBreak.className = "px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1";
      btnToggleBreak.innerHTML = `
        <span class="material-symbols-outlined text-sm">play_arrow</span>
        <span id="btnToggleBreakText">Kembali Melayani</span>
      `;
    } else {
      btnToggleBreak.className = "px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1";
      btnToggleBreak.innerHTML = `
        <span class="material-symbols-outlined text-sm">coffee</span>
        <span id="btnToggleBreakText">Istirahat</span>
      `;
    }
  }

  // ============================================
  // Sinkronisasi nomor yang sedang dilayani dari DB
  // ============================================
  async function syncServingTicket() {
    if (!selectedCounterId) return;
    try {
      const res = await API.request('/queue/tickets?status=serving');
      if (res.success && Array.isArray(res.data)) {
        const servingTicket = res.data.find(t => t.counterId === selectedCounterId);
        if (servingTicket) {
          updateServingDisplay(
            servingTicket.ticketNumber,
            servingTicket.studentName,
            servingTicket.studentNisn,
            servingTicket.calledAt
          );
        } else {
          clearServingDisplay();
        }
      } else {
        clearServingDisplay();
      }
    } catch (err) {
      clearServingDisplay();
    }
  }

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
          updateBreakButtonUI('buka');
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
        if (data.appTimezone) appTimezone = data.appTimezone;
        if (data.waiting) renderWaitingList(data.waiting);
        if (selectedCounterId && data.currentServing) {
          const myCounter = data.currentServing.find(cs => cs.counterId === selectedCounterId);
          if (myCounter) {
            updateBreakButtonUI(myCounter.status);
          }
        }
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
      if (json.success && json.data) {
        if (json.data.appTimezone) appTimezone = json.data.appTimezone;
        if (json.data.waiting) {
          renderWaitingList(json.data.waiting);
        }
      }
    } catch(err) {}
  }

  function renderWaitingList(waiting) {
    if (!waitingList) return;
    if (waitingBadge) waitingBadge.textContent = waiting.length;

    if (waiting.length === 0) {
      waitingList.innerHTML = '<p class="text-xs text-slate-300 text-center py-4">Tidak ada antrean</p>';
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
    if (servingNumber && servingNumber.textContent !== number && number) {
      recallCount = 0;
    }
    
    if (servingNumber) {
      servingNumber.textContent = number || '—';
      servingNumber.style.color = number ? '#1e293b' : '#e2e8f0';
    }
    if (servingSince && calledAt) {
      const t = new Date(calledAt);
      const tz = tzMapping[appTimezone] || 'Asia/Jakarta';
      let formattedTime = '';
      try {
        formattedTime = t.toLocaleTimeString('id-ID', {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      } catch (e) {
        formattedTime = t.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      }
      servingSince.textContent = `Dipanggil ${formattedTime}`;
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
    updateActionButtons(number);
  }

  function updateActionButtons(number) {
    const activeText = document.getElementById('btnCallNextText');
    const activeIcon = document.getElementById('btnCallNextIcon');
    if (!number) {
        if (activeText) activeText.textContent = "Panggil Berikutnya";
        if (activeIcon) activeIcon.textContent = "arrow_forward";
        if (btnSkip) btnSkip.classList.add('hidden');
    } else {
        if (activeText) {
            activeText.textContent = recallCount === 0 ? "Panggil Ulang" : `Panggil Ulang (${recallCount}/2)`;
        }
        if (activeIcon) activeIcon.textContent = "campaign";
        if (btnSkip) {
            if (recallCount >= 2) {
                btnSkip.classList.remove('hidden');
                btnSkip.disabled = false;
            } else {
                btnSkip.classList.add('hidden');
            }
        }
    }
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

  // Panggil berikutnya / Panggil ulang
  if (btnCallNext) {
    btnCallNext.addEventListener('click', async () => {
      if (!selectedCounterId) return;
      const isRecall = servingNumber && servingNumber.textContent && servingNumber.textContent !== '—';
      
      setLoading(btnCallNext, true);
      try {
        if (isRecall) {
          const res = await API.request('/queue/call/specific', {
            method: 'POST',
            body: JSON.stringify({ counterId: selectedCounterId, ticketNumber: servingNumber.textContent })
          });
          if (res.success) {
            recallCount++;
            updateActionButtons(servingNumber.textContent);
          } else {
            alert(res.message || 'Gagal memanggil ulang');
          }
        } else {
          const res = await API.request('/queue/call', {
            method: 'POST',
            body: JSON.stringify({ counterId: selectedCounterId })
          });
          if (res.success) {
            recallCount = 0;
            updateServingDisplay(res.data.ticketNumber, res.data.studentName, res.data.studentNisn, new Date().toISOString());
            loadWaitingList();
          } else {
            alert(res.message || 'Tidak ada antrean menunggu');
          }
        }
      } catch(err) {
        alert('Gagal memanggil antrean');
      } finally {
        setLoading(btnCallNext, false);
        const hasServing = servingNumber && servingNumber.textContent && servingNumber.textContent !== '—';
        updateActionButtons(hasServing ? servingNumber.textContent : null);
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
          if (res.message && res.message.includes('Tidak ada tiket aktif')) {
            clearServingDisplay();
            loadCounterStats();
            loadWaitingList();
          } else {
            alert(res.message || 'Gagal menandai selesai');
          }
        }
      } catch(err) {
        if (err.message && err.message.includes('Tidak ada tiket aktif')) {
          clearServingDisplay();
          loadCounterStats();
          loadWaitingList();
        } else {
          alert('Gagal menandai selesai');
        }
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
          if (res.message && res.message.includes('Tidak ada tiket aktif')) {
            clearServingDisplay();
            loadCounterStats();
            loadWaitingList();
          } else {
            alert(res.message || 'Gagal melewati nomor');
          }
        }
      } catch(err) {
        if (err.message && err.message.includes('Tidak ada tiket aktif')) {
          clearServingDisplay();
          loadCounterStats();
          loadWaitingList();
        } else {
          alert('Gagal melewati nomor');
        }
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
          updateServingDisplay(res.data.ticketNumber, res.data.studentName, res.data.studentNisn, new Date().toISOString());
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
    btnChangeCounter.addEventListener('click', async () => {
      try {
        await API.request('/queue/counter/leave', { method: 'POST' });
      } catch (err) {
        // Silently continue
      }
      
      localStorage.removeItem('spmb_selected_counter_id');
      localStorage.removeItem('spmb_selected_counter_name');
      
      selectedCounterId = null;
      selectedCounterName = null;
      
      if (sseSource) sseSource.close();
      if (counterPanel) counterPanel.classList.add('hidden');
      if (counterSelectModal) counterSelectModal.classList.remove('hidden');
      
      init();
    });
  }

  // Istirahat / Kembali Melayani
  if (btnToggleBreak) {
    btnToggleBreak.addEventListener('click', async () => {
      if (!selectedCounterId) return;
      const nextStatus = currentCounterStatus === 'istirahat' ? 'buka' : 'istirahat';
      try {
        const res = await API.request('/queue/counter/status', {
          method: 'POST',
          body: JSON.stringify({ status: nextStatus })
        });
        if (res.success && res.data) {
          updateBreakButtonUI(res.data.status);
        } else {
          alert(res.message || 'Gagal mengubah status loket');
        }
      } catch (err) {
        alert('Gagal mengubah status loket');
      }
    });
  }

  // ============================================
  // HELPER: Loading state tombol
  // ============================================
  function setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
      if (!btn.hasAttribute('data-original-html')) {
        btn.setAttribute('data-original-html', btn.innerHTML);
      }
      btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-2xl mb-1">sync</span><span class="text-sm font-bold tracking-wide">Memuat...</span>';
    } else {
      const orig = btn.getAttribute('data-original-html');
      if (orig) btn.innerHTML = orig;
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
