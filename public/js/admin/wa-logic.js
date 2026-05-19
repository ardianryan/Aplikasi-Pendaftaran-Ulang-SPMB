/**
 * WhatsApp Admin Logic
 * Handles config save/load, status checks, sending, and tab switching
 */

// ============================================
// Tab Switching
// ============================================
function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('border-blue-600', 'text-blue-700', 'bg-blue-50/50');
    btn.classList.add('border-transparent', 'text-slate-500');
  });
  const target = document.getElementById('tab-' + tab);
  if (target) target.style.display = 'block';
  const activeBtn = document.querySelector(`[data-tab="${tab}"]`);
  if (activeBtn) {
    activeBtn.classList.add('border-blue-600', 'text-blue-700', 'bg-blue-50/50');
    activeBtn.classList.remove('border-transparent', 'text-slate-500');
  }
}

// ============================================
// Provider toggle (show/hide auth fields)
// ============================================
function onProviderChange() {
  const provider = document.getElementById('waProvider').value;
  const gowaFields = document.getElementById('authGowa');
  const honowaFields = document.getElementById('authHonowa');
  const deviceLabel = document.getElementById('deviceLabel');
  const deviceHint = document.getElementById('deviceHint');
  const providerHint = document.getElementById('providerHint');

  if (provider === 'honowa') {
    gowaFields.style.display = 'none';
    honowaFields.style.display = 'block';
    deviceLabel.textContent = 'Session ID';
    deviceHint.textContent = 'Session ID yang digunakan untuk mengirim pesan';
    providerHint.textContent = 'HonoWA: API Key via header X-API-Key';
  } else {
    gowaFields.style.display = 'block';
    honowaFields.style.display = 'none';
    deviceLabel.textContent = 'Device ID';
    deviceHint.textContent = 'GOWA: Device ID dari multi-device v8 (opsional)';
    providerHint.textContent = 'GOWA: Basic Auth (username & password)';
  }
}

// ============================================
// Load config from settings API
// ============================================
async function loadWaConfig() {
  try {
    const res = await API.request('/admin/settings');
    if (!res.success) return;

    // Settings API returns: { key: { value, description } }
    const raw = res.data || {};
    const s = {};
    for (const [k, v] of Object.entries(raw)) {
      s[k] = (v && typeof v === 'object' && 'value' in v) ? v.value : v;
    }

    // Populate fields
    document.getElementById('waEnabled').checked = s.wa_gateway_enabled === true || s.wa_gateway_enabled === 'true';
    document.getElementById('waProvider').value = s.wa_gateway_provider || 'gowa';
    document.getElementById('waUrl').value = s.wa_gateway_url || '';
    document.getElementById('waAuthUser').value = s.wa_gateway_auth_user || '';
    document.getElementById('waAuthPass').value = s.wa_gateway_auth_pass || '';
    document.getElementById('waToken').value = s.wa_gateway_auth_pass || '';
    document.getElementById('waDeviceId').value = s.wa_gateway_device_id || '';

    // Retention radio
    const retention = String(s.wa_log_retention_days || '30');
    const radios = document.querySelectorAll('input[name="waRetention"]');
    radios.forEach(r => { r.checked = r.value === retention; });

    // Templates
    const tplKeys = ['wa_template_reminder', 'wa_template_biodata', 'wa_template_verified', 'wa_template_rejected'];
    tplKeys.forEach(k => {
      const el = document.getElementById('tpl_' + k);
      if (el) el.value = s[k] || '';
    });

    // Toggle auth fields
    onProviderChange();
  } catch (err) {
    console.error('Failed to load WA config:', err);
  }
}

// ============================================
// Save config
// ============================================
async function saveWaConfig() {
  try {
    const provider = document.getElementById('waProvider').value;
    const authPass = provider === 'honowa'
      ? document.getElementById('waToken').value
      : document.getElementById('waAuthPass').value;

    const retention = document.querySelector('input[name="waRetention"]:checked')?.value || '30';

    const settings = {
      wa_gateway_enabled: document.getElementById('waEnabled').checked,
      wa_gateway_provider: provider,
      wa_gateway_url: document.getElementById('waUrl').value.trim(),
      wa_gateway_auth_user: provider === 'gowa' ? document.getElementById('waAuthUser').value.trim() : '',
      wa_gateway_auth_pass: authPass.trim(),
      wa_gateway_device_id: document.getElementById('waDeviceId').value.trim(),
      wa_log_retention_days: parseInt(retention),
    };

    const res = await API.request('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });

    if (res.success) {
      UI.toast('Pengaturan WhatsApp berhasil disimpan!', 'success');
    } else {
      UI.toast('Gagal menyimpan: ' + (res.message || ''), 'error');
    }
  } catch (err) {
    UI.toast('Gagal menyimpan pengaturan.', 'error');
  }
}

// ============================================
// Save templates
// ============================================
async function saveTemplates() {
  try {
    const settings = {};
    ['wa_template_reminder', 'wa_template_biodata', 'wa_template_verified', 'wa_template_rejected'].forEach(k => {
      const el = document.getElementById('tpl_' + k);
      if (el) settings[k] = el.value;
    });

    const res = await API.request('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });

    if (res.success) {
      UI.toast('Template pesan berhasil disimpan!', 'success');
    } else {
      UI.toast('Gagal menyimpan template.', 'error');
    }
  } catch (err) {
    UI.toast('Gagal menyimpan template.', 'error');
  }
}

// ============================================
// Check status
// ============================================
async function checkStatus() {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  const detail = document.getElementById('statusDetail');
  const card = document.getElementById('statusCard');

  dot.className = 'w-4 h-4 rounded-full bg-yellow-400 animate-pulse';
  text.textContent = 'Memeriksa koneksi...';
  detail.textContent = '';

  try {
    const res = await API.request('/admin/wa/status');
    if (!res.data?.enabled) {
      dot.className = 'w-4 h-4 rounded-full bg-slate-300';
      text.textContent = 'Gateway belum diaktifkan';
      detail.textContent = 'Aktifkan toggle dan isi URL gateway terlebih dahulu';
      card.className = card.className.replace(/bg-\w+-\d+/, 'bg-slate-50').replace(/border-\w+-\d+/, 'border-slate-200');
      return;
    }
    if (res.data.connected) {
      dot.className = 'w-4 h-4 rounded-full bg-emerald-500';
      text.textContent = '✅ Terhubung ke ' + (res.data.provider || 'gateway');
      detail.textContent = res.data.deviceId ? 'Device: ' + res.data.deviceId : 'Koneksi aktif';
      card.className = 'flex items-center gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200';
    } else {
      dot.className = 'w-4 h-4 rounded-full bg-red-500';
      text.textContent = '❌ Tidak terhubung';
      detail.textContent = 'Pastikan gateway berjalan dan scan QR code';
      card.className = 'flex items-center gap-4 p-4 rounded-xl bg-red-50 border border-red-200';
    }
  } catch (err) {
    dot.className = 'w-4 h-4 rounded-full bg-red-500';
    text.textContent = '❌ Gagal memeriksa status';
    detail.textContent = err.message || 'Server tidak merespons';
    card.className = 'flex items-center gap-4 p-4 rounded-xl bg-red-50 border border-red-200';
  }
}

// ============================================
// Test connection (send test message)
// ============================================
async function testConnection() {
  const phone = prompt('Masukkan nomor WA untuk test (format: 08xx atau 628xx):');
  if (!phone) return;

  try {
    UI.toast('Mengirim pesan test...', 'info');
    const res = await API.request('/admin/wa/test', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });

    if (res.data?.success) {
      UI.toast('✅ Pesan test berhasil terkirim!', 'success');
    } else {
      UI.toast('❌ Gagal: ' + (res.data?.error || res.message || 'Unknown error'), 'error');
    }
  } catch (err) {
    UI.toast('❌ Gagal mengirim pesan test.', 'error');
  }
}

// ============================================
// Send individual message
// ============================================
async function sendIndividual() {
  const phone = document.getElementById('sendPhone').value.trim();
  const message = document.getElementById('sendMessage').value.trim();

  if (!phone || !message) {
    UI.toast('Nomor telepon dan pesan wajib diisi.', 'error');
    return;
  }

  try {
    UI.toast('Mengirim pesan...', 'info');
    const res = await API.request('/admin/wa/send', {
      method: 'POST',
      body: JSON.stringify({ phone, message, messageType: 'custom' }),
    });

    if (res.data?.success) {
      UI.toast('✅ Pesan berhasil terkirim!', 'success');
      document.getElementById('sendMessage').value = '';
    } else {
      UI.toast('❌ Gagal: ' + (res.data?.error || res.message || ''), 'error');
    }
  } catch (err) {
    UI.toast('❌ Gagal mengirim pesan.', 'error');
  }
}

// ============================================
// Init
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  loadWaConfig();
  document.getElementById('waProvider').addEventListener('change', onProviderChange);
});
