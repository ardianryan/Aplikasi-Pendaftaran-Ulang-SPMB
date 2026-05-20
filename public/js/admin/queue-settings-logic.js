/**
 * queue-settings-logic.js
 * Logic untuk halaman Pengaturan Antrian (/admin/queue/settings)
 */

(function () {
  // DOM refs
  const queuePreRegPrefix       = document.getElementById('queuePreRegPrefix');
  const queueReRegPrefix        = document.getElementById('queueReRegPrefix');
  const queueNumberPadding      = document.getElementById('queueNumberPadding');
  const queueCounterCount       = document.getElementById('queueCounterCount');
  const counterCountDisplay     = document.getElementById('counterCountDisplay');
  const counterNamesList        = document.getElementById('counterNamesList');
  const queueDisplayTitle       = document.getElementById('queueDisplayTitle');
  const queueDisplaySubtitle    = document.getElementById('queueDisplaySubtitle');
  const queueDisplayShowWaiting = document.getElementById('queueDisplayShowWaiting');
  const queueStudentLinkEnabled = document.getElementById('queueStudentLinkEnabled');
  const studentLinkNote         = document.getElementById('studentLinkNote');
  const previewPreReg           = document.getElementById('previewPreReg');
  const previewReReg            = document.getElementById('previewReReg');
  const publicDisplayUrl        = document.getElementById('publicDisplayUrl');
  const btnCopyUrl              = document.getElementById('btnCopyUrl');
  const btnSaveSettings         = document.getElementById('btnSaveSettings');
  const toast                   = document.getElementById('toast');

  // ============================================
  // MUAT SETTINGS DARI API
  // ============================================
  async function loadSettings() {
    try {
      const res = await API.request('/admin/settings');
      if (!res.success || !res.data) return;
      const data = res.data;

      // Prefix
      if (queuePreRegPrefix) queuePreRegPrefix.value = data.queue_pre_reg_prefix?.value || 'A';
      if (queueReRegPrefix) queueReRegPrefix.value = data.queue_re_reg_prefix?.value || 'B';
      updatePreviews();

      // Padding
      if (queueNumberPadding) queueNumberPadding.value = String(data.queue_number_padding?.value || 3);

      // Loket
      const count = data.queue_counter_count?.value || 5;
      if (queueCounterCount) {
        queueCounterCount.value = count;
        if (counterCountDisplay) counterCountDisplay.textContent = count;
      }

      const names = Array.isArray(data.queue_counter_names?.value)
        ? data.queue_counter_names.value
        : Array.from({ length: count }, (_, i) => `Loket ${i + 1}`);
      renderCounterNames(count, names);

      // Display
      if (queueDisplayTitle) queueDisplayTitle.value = data.queue_display_title?.value || 'Antrian Verifikasi SPMB';
      if (queueDisplaySubtitle) queueDisplaySubtitle.value = data.queue_display_subtitle?.value || '';
      if (queueDisplayShowWaiting) queueDisplayShowWaiting.checked = data.queue_display_show_waiting?.value !== false;

      // Student link
      if (queueStudentLinkEnabled) {
        queueStudentLinkEnabled.checked = !!data.queue_student_link_enabled?.value;
        toggleStudentLinkNote(!!data.queue_student_link_enabled?.value);
      }

      // URL display publik
      if (publicDisplayUrl) {
        publicDisplayUrl.textContent = `${window.location.origin}/antrian`;
      }
    } catch (err) {
      console.error('Gagal memuat pengaturan antrian', err);
    }
  }

  // ============================================
  // RENDER DAFTAR INPUT NAMA LOKET
  // ============================================
  function renderCounterNames(count, currentNames) {
    if (!counterNamesList) return;
    const n = parseInt(count) || 5;
    const names = Array.isArray(currentNames) ? currentNames : [];

    counterNamesList.innerHTML = Array.from({ length: n }, (_, i) => {
      const val = names[i] || `Loket ${i + 1}`;
      return `
        <div class="flex items-center gap-2">
          <span class="text-xs font-mono text-slate-400 w-6">${i + 1}</span>
          <input
            type="text"
            id="counterName_${i}"
            value="${val.replace(/"/g, '&quot;')}"
            placeholder="Loket ${i + 1}"
            class="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
          />
        </div>
      `;
    }).join('');
  }

  // ============================================
  // PREVIEW NOMOR ANTRIAN
  // ============================================
  function updatePreviews() {
    const padding = parseInt(queueNumberPadding?.value || '3');
    const preReg = (queuePreRegPrefix?.value || 'A').toUpperCase();
    const reReg = (queueReRegPrefix?.value || 'B').toUpperCase();
    const num = String(1).padStart(padding, '0');
    if (previewPreReg) previewPreReg.textContent = `${preReg}${num}`;
    if (previewReReg) previewReReg.textContent = `${reReg}${num}`;
  }

  // ============================================
  // TOGGLE STUDENT LINK NOTE
  // ============================================
  function toggleStudentLinkNote(enabled) {
    if (!studentLinkNote) return;
    if (enabled) studentLinkNote.classList.remove('hidden');
    else studentLinkNote.classList.add('hidden');
  }

  // ============================================
  // SIMPAN SETTINGS
  // ============================================
  async function saveSettings() {
    const count = parseInt(queueCounterCount?.value || '5');
    const names = Array.from({ length: count }, (_, i) => {
      const el = document.getElementById(`counterName_${i}`);
      return el?.value?.trim() || `Loket ${i + 1}`;
    });

    const payload = {
      queue_pre_reg_prefix: (queuePreRegPrefix?.value || 'A').toUpperCase().trim(),
      queue_re_reg_prefix: (queueReRegPrefix?.value || 'B').toUpperCase().trim(),
      queue_number_padding: parseInt(queueNumberPadding?.value || '3'),
      queue_counter_count: count,
      queue_counter_names: names,
      queue_display_title: queueDisplayTitle?.value?.trim() || 'Antrian Verifikasi SPMB',
      queue_display_subtitle: queueDisplaySubtitle?.value?.trim() || '',
      queue_display_show_waiting: queueDisplayShowWaiting?.checked !== false,
      queue_student_link_enabled: queueStudentLinkEnabled?.checked || false,
    };

    // Validasi
    if (!payload.queue_pre_reg_prefix) {
      showToast('Prefix Pra-Pendaftaran tidak boleh kosong', 'error');
      return;
    }
    if (!payload.queue_re_reg_prefix) {
      showToast('Prefix Daftar Ulang tidak boleh kosong', 'error');
      return;
    }
    if (payload.queue_pre_reg_prefix === payload.queue_re_reg_prefix) {
      showToast('Prefix Pra-Pendaftaran dan Daftar Ulang harus berbeda', 'error');
      return;
    }

    setLoading(btnSaveSettings, true);
    try {
      const res = await API.request('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        showToast('Pengaturan antrian berhasil disimpan ✓', 'success');
      } else {
        showToast(res.message || 'Gagal menyimpan', 'error');
      }
    } catch (err) {
      showToast('Gagal menyimpan pengaturan', 'error');
    } finally {
      setLoading(btnSaveSettings, false);
    }
  }

  // ============================================
  // TOAST NOTIFIKASI
  // ============================================
  function showToast(msg, type = 'success') {
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-bold shadow-xl transition-all ${
      type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
    }`;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
  }

  function setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? 'Menyimpan...' : '💾 Simpan Pengaturan';
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================
  if (queuePreRegPrefix) {
    queuePreRegPrefix.addEventListener('input', () => {
      queuePreRegPrefix.value = queuePreRegPrefix.value.toUpperCase().replace(/[^A-Z]/g, '');
      updatePreviews();
    });
  }

  if (queueReRegPrefix) {
    queueReRegPrefix.addEventListener('input', () => {
      queueReRegPrefix.value = queueReRegPrefix.value.toUpperCase().replace(/[^A-Z]/g, '');
      updatePreviews();
    });
  }

  if (queueNumberPadding) {
    queueNumberPadding.addEventListener('change', updatePreviews);
  }

  if (queueCounterCount) {
    queueCounterCount.addEventListener('input', () => {
      const count = parseInt(queueCounterCount.value);
      if (counterCountDisplay) counterCountDisplay.textContent = count;
      // Kumpulkan nama yang sudah diisi
      const existingNames = [];
      const inputs = counterNamesList?.querySelectorAll('input');
      inputs?.forEach(inp => existingNames.push(inp.value));
      renderCounterNames(count, existingNames);
    });
  }

  if (queueStudentLinkEnabled) {
    queueStudentLinkEnabled.addEventListener('change', (e) => toggleStudentLinkNote(e.target.checked));
  }

  if (btnCopyUrl) {
    btnCopyUrl.addEventListener('click', () => {
      const url = `${window.location.origin}/antrian`;
      navigator.clipboard.writeText(url).then(() => {
        btnCopyUrl.textContent = 'Copied!';
        setTimeout(() => { btnCopyUrl.textContent = 'Copy'; }, 2000);
      });
    });
  }

  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', saveSettings);
  }

  // ============================================
  // INIT
  // ============================================
  function init() {
    loadSettings();
    if (publicDisplayUrl) {
      publicDisplayUrl.textContent = `${window.location.origin}/antrian`;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
