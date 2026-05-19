/**
 * WhatsApp Blast Logic
 * Handles previewing recipients, loading templates, and starting blast jobs.
 */

let settingsMap = {};

// Load settings for templates and populate dropdowns
async function initBlast() {
  try {
    // Load Jalur Options
    const jalurRes = await API.request('/jalur-options');
    if (jalurRes.success && jalurRes.data) {
      const select = document.getElementById('blastJalur');
      jalurRes.data.forEach(j => {
        const opt = document.createElement('option');
        opt.value = j;
        opt.textContent = j;
        select.appendChild(opt);
      });
    }

    // Load Settings
    const settingsRes = await API.request('/admin/settings');
    if (settingsRes.success) {
      const raw = settingsRes.data || {};
      for (const [k, v] of Object.entries(raw)) {
        settingsMap[k] = (v && typeof v === 'object' && 'value' in v) ? v.value : v;
      }
    }
  } catch (err) {
    console.error('Failed to init blast page', err);
  }
}

// Load selected template into textarea
function loadBlastTemplate() {
  const key = document.getElementById('blastTemplate').value;
  const textarea = document.getElementById('blastMessage');
  
  if (!key) {
    textarea.value = '';
    return;
  }
  
  if (settingsMap[key]) {
    textarea.value = settingsMap[key];
  } else {
    UI.toast('Template tidak ditemukan di pengaturan.', 'warning');
  }
}

// Enforce minimum delay and get current delay value in seconds
function getDelaySeconds() {
  const el = document.getElementById('blastDelay');
  const val = parseInt(el?.value) || 5;
  return val < 5 ? 5 : val;
}

// Dynamically update estimated delivery time based on current delay and count
function updateEstimatedTime() {
  const countEl = document.getElementById('previewCount');
  const count = parseInt(countEl?.textContent) || 0;
  const est = document.getElementById('estimatedTime');
  const delaySec = getDelaySeconds();
  
  if (count > 0) {
    const minutes = Math.ceil((count * delaySec) / 60);
    est.textContent = `Estimasi waktu: ~${minutes} menit (dengan jeda ${delaySec}s antar pesan)`;
  } else {
    est.textContent = 'Tidak ada pesan untuk dikirim.';
  }
}

// Preview recipient count and sample
async function previewBlast() {
  const filter = document.getElementById('blastFilter').value;
  const jalur = document.getElementById('blastJalur').value;
  const previewBox = document.getElementById('previewBox');
  const countEl = document.getElementById('previewCount');
  const sampleEl = document.getElementById('previewSample');
  const btn = document.getElementById('btnBlast');

  try {
    const res = await API.request(`/admin/wa/blast/preview?filter=${filter}&jalur=${jalur}`);
    if (res.success) {
      previewBox.style.display = 'block';
      countEl.textContent = res.data.count;
      
      if (res.data.count > 0) {
        btn.disabled = false;
        updateEstimatedTime();
        
        let sampleHtml = 'Sampel penerima:<br>';
        res.data.sample.forEach(s => {
          sampleHtml += `- ${s.nama} (${s.telepon || 'No HP Kosong'})<br>`;
        });
        if (res.data.count > res.data.sample.length) {
          sampleHtml += `...dan ${res.data.count - res.data.sample.length} lainnya.`;
        }
        sampleEl.innerHTML = sampleHtml;
      } else {
        btn.disabled = true;
        updateEstimatedTime();
        sampleEl.innerHTML = 'Tidak ada siswa yang cocok dengan filter ini.';
      }
    }
  } catch (err) {
    UI.toast('Gagal memuat preview.', 'error');
  }
}

// Send the blast request
async function sendBlast() {
  const filter = document.getElementById('blastFilter').value;
  const jalur = document.getElementById('blastJalur').value;
  const templateKey = document.getElementById('blastTemplate').value;
  const customMessage = document.getElementById('blastMessage').value.trim();
  const btn = document.getElementById('btnBlast');

  if (!customMessage && !templateKey) {
    UI.toast('Pesan wajib diisi!', 'error');
    return;
  }

  if (!confirm('Apakah Anda yakin ingin memulai pengiriman blast? Proses ini akan berjalan di latar belakang.')) {
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">sync</span> Memulai...';

  const delaySeconds = getDelaySeconds();
  const delayMs = delaySeconds * 1000;

  try {
    const res = await API.request('/admin/wa/blast', {
      method: 'POST',
      body: JSON.stringify({
        filter,
        jalur,
        templateKey: templateKey || undefined,
        customMessage,
        delayMs: delayMs
      })
    });

    if (res.success) {
      UI.toast(res.message || 'Blast dimulai', 'success');
      
      // Show pseudo progress
      document.getElementById('blastProgress').style.display = 'block';
      document.getElementById('progressStatus').textContent = 'Pesan sedang diproses di background. Anda bisa meninggalkan halaman ini.';
      
      // Simulate progress bar based on total (since it's background task, we just show a fake one or a link to logs)
      let count = 0;
      const total = res.data.total;
      const intv = setInterval(() => {
        count++;
        if (count >= total) {
          clearInterval(intv);
          document.getElementById('progressText').textContent = `${total}/${total}`;
          document.getElementById('progressBar').style.width = '100%';
          btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">check</span> Selesai';
        } else {
          document.getElementById('progressText').textContent = `${count}/${total}`;
          document.getElementById('progressBar').style.width = `${(count/total)*100}%`;
        }
      }, delayMs); // match delayMs

    } else {
      UI.toast(res.message || 'Gagal memulai blast', 'error');
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">campaign</span> Kirim Blast';
    }
  } catch (err) {
    UI.toast('Terjadi kesalahan sistem.', 'error');
    btn.disabled = false;
    btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">campaign</span> Kirim Blast';
  }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  initBlast();
});
