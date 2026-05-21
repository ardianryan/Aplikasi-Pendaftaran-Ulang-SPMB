// Settings Logic

const TEXT_SETTINGS = [
  'school_name', 'school_name_full',
  'app_name', 'app_name_full',
  'registration_closed_message',
  'registration_start_date', 'registration_end_date',
  'school_year', 'announcement_text',
  'kop_line1', 'kop_line2', 'kop_line3', 'kop_line4', 'kop_line5', 'kop_line6',
  'kop_city', 'landing_hero_title', 'landing_hero_subtitle',
  'url_youtube_tutorial', 'url_download_center',
  'r2_endpoint', 'r2_bucket', 'r2_region', 'r2_access_key_id', 'r2_secret_access_key', 'r2_prefix', 'r2_public_url', 'sso_base_url', 'sso_api_key', 'google_client_id',
  'queue_average_service_time', 'queue_operational_hours'
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

    const uploadEnabled = document.getElementById('upload_document_enabled');
    if (uploadEnabled && settings.upload_document_enabled) {
      uploadEnabled.checked = settings.upload_document_enabled.value !== false && settings.upload_document_enabled.value !== 'false';
    }

    const operatorPermissions = [
      'operator_can_verify',
      'operator_can_edit_student',
      'operator_can_delete_student',
      'operator_can_whatsapp',
      'operator_can_manage_queue'
    ];
    for (const key of operatorPermissions) {
      const el = document.getElementById(key);
      if (el && settings[key]) {
        el.checked = settings[key].value === true || settings[key].value === 'true';
      }
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

    const uploadEnabled = document.getElementById('upload_document_enabled');
    data.upload_document_enabled = uploadEnabled ? uploadEnabled.checked : true;

    const operatorPermissions = [
      'operator_can_verify',
      'operator_can_edit_student',
      'operator_can_delete_student',
      'operator_can_whatsapp',
      'operator_can_manage_queue'
    ];
    for (const key of operatorPermissions) {
      const el = document.getElementById(key);
      if (el) {
        data[key] = el.checked;
      }
    }

    await API.request('/admin/settings', { method: 'PUT', body: JSON.stringify(data) });
    sessionStorage.removeItem('spmb_public_settings');
    sessionStorage.removeItem('spmb_admin_settings');
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


async function testR2Connection() {
  const btn = document.getElementById('btn-test-r2');
  const btnText = document.getElementById('btn-test-r2-text');
  const origText = btnText ? btnText.textContent : 'Uji Koneksi R2';

  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = 'Menguji...';

  try {
    const data = {
      r2_endpoint: document.getElementById('r2_endpoint')?.value || '',
      r2_bucket: document.getElementById('r2_bucket')?.value || '',
      r2_region: document.getElementById('r2_region')?.value || 'auto',
      r2_access_key_id: document.getElementById('r2_access_key_id')?.value || '',
      r2_secret_access_key: document.getElementById('r2_secret_access_key')?.value || '',
      r2_prefix: document.getElementById('r2_prefix')?.value ?? 'uploads/'
    };

    const res = await API.request('/admin/settings/test-r2', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    UI.toast(res.message || 'Koneksi R2 Berhasil!', 'success');
  } catch (err) {
    UI.toast(err.message || 'Koneksi R2 Gagal.', 'error');
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = origText;
  }
}

async function testSSOConnection() {
  const btn = document.getElementById('btn-test-sso');
  const btnText = document.getElementById('btn-test-sso-text');
  const origText = btnText ? btnText.textContent : 'Uji Koneksi SSO';

  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = 'Menguji...';

  try {
    const data = {
      sso_base_url: document.getElementById('sso_base_url')?.value || '',
      sso_api_key: document.getElementById('sso_api_key')?.value || ''
    };

    const res = await API.request('/admin/settings/test-sso', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    UI.toast(res.message || 'Koneksi ScholarGate SSO Berhasil!', 'success');
  } catch (err) {
    UI.toast(err.message || 'Koneksi ScholarGate SSO Gagal.', 'error');
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = origText;
  }
}

async function testGoogleConnection() {
  const btn = document.getElementById('btn-test-google');
  const btnText = document.getElementById('btn-test-google-text');
  const origText = btnText ? btnText.textContent : 'Uji Google OAuth';

  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = 'Menguji...';

  try {
    const data = {
      google_client_id: document.getElementById('google_client_id')?.value || ''
    };

    const res = await API.request('/admin/settings/test-google', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    UI.toast(res.message || 'Format Google Client ID valid!', 'success');
  } catch (err) {
    UI.toast(err.message || 'Google OAuth Gagal.', 'error');
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = origText;
  }
}

loadSettings();
