// Settings Logic

const TEXT_SETTINGS = [
  'school_name', 'school_name_full',
  'app_name', 'app_name_full',
  'registration_closed_message',
  'registration_start_date', 'registration_end_date',
  'school_year', 'announcement_text',
  'kop_line1', 'kop_line2', 'kop_line3', 'kop_line4', 'kop_line5', 'kop_line6',
  'kop_city', 'landing_hero_title', 'landing_hero_subtitle'
];

const JSON_SETTINGS = [
  'landing_jalur_json', 'landing_timeline_json', 'landing_berkas_json'
];

async function loadSettings() {
  try {
    const res = await API.request('/admin/settings');
    const settings = res.data;

    for (const key of TEXT_SETTINGS) {
      const el = document.getElementById(key);
      if (el && settings[key]) {
        el.value = settings[key].value ?? '';
      }
    }

    const regOpen = document.getElementById('registration_open');
    if (regOpen && settings.registration_open) {
      const isOpen = settings.registration_open.value === true;
      regOpen.checked = isOpen;
      if (typeof updateStatusUI === 'function') updateStatusUI(isOpen);
    }

    for (const key of JSON_SETTINGS) {
      const el = document.getElementById(key);
      if (el && settings[key]) {
        el.value = JSON.stringify(settings[key].value || [], null, 2);
      }
    }

    if (settings.app_logo && settings.app_logo.value) {
      setPreview('logo-preview', settings.app_logo.value);
    }
    if (settings.kop_logo_left && settings.kop_logo_left.value) {
      setPreview('kop-left-preview', settings.kop_logo_left.value);
    }
    if (settings.kop_logo_right && settings.kop_logo_right.value) {
      setPreview('kop-right-preview', settings.kop_logo_right.value);
    }
    if (settings.app_icon && settings.app_icon.value) {
      setPreview('favicon-preview', settings.app_icon.value);
    }
  } catch (err) {
    UI.toast('Gagal memuat pengaturan.', 'error');
  }
}

function setPreview(id, url) {
  const el = document.getElementById(id);
  if (el && url) el.innerHTML = `<img src="${url}" class="w-full h-full object-contain">`;
}

async function saveSettings() {
  const btn = document.getElementById('btn-save');
  const btnText = document.getElementById('btn-save-text');
  btn.disabled = true;
  btnText.textContent = 'Menyimpan...';

  try {
    const data = {};
    for (const key of TEXT_SETTINGS) {
      const el = document.getElementById(key);
      if (el) data[key] = el.value;
    }
    for (const key of JSON_SETTINGS) {
      const el = document.getElementById(key);
      if (el) {
        try {
          data[key] = JSON.parse(el.value);
        } catch (e) {
          throw new Error(`Format JSON pada ${key} tidak valid.`);
        }
      }
    }

    const regOpen = document.getElementById('registration_open');
    data.registration_open = regOpen ? regOpen.checked : true;

    await API.request('/admin/settings', { method: 'PUT', body: JSON.stringify(data) });
    sessionStorage.removeItem('spmb_public_settings');
    UI.toast('Pengaturan berhasil disimpan.', 'success');
  } catch (err) {
    UI.toast(err.message || 'Gagal menyimpan.', 'error');
  } finally {
    btn.disabled = false;
    btnText.textContent = 'Simpan Seluruh Pengaturan';
  }
}

async function uploadFile(key, input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { showToast('Maksimal 2MB', 'error'); return; }

  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await API.request(`/admin/settings/upload/${key}`, { method: 'POST', body: formData });
    if (key === 'app_logo') setPreview('logo-preview', res.data.url);
    if (key === 'kop_logo_left') setPreview('kop-left-preview', res.data.url);
    if (key === 'kop_logo_right') setPreview('kop-right-preview', res.data.url);
    if (key === 'app_icon') setPreview('favicon-preview', res.data.url);
    UI.toast('Berhasil diupload', 'success');
  } catch (err) { UI.toast(err.message, 'error'); }
  input.value = '';
}


loadSettings();
