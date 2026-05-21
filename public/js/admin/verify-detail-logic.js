// Verify Detail Logic

let student = null;
let r2PublicUrl = '';
const studentId = new URLSearchParams(window.location.search).get('id');

let DOC_TYPES = []; // Populated dynamically from settings

function getPermission(key, defaultVal = true) {
  const admin = JSON.parse(localStorage.getItem('spmb_admin') || '{}');
  if (admin.role === 'admin') return true;
  const settings = window.__SPMB_ADMIN_SETTINGS || JSON.parse(sessionStorage.getItem('spmb_admin_settings') || '{}');
  return settings[key] !== undefined ? (settings[key] === true || settings[key] === 'true') : defaultVal;
}

async function init() {
  if (!studentId) { window.location.href = '/admin/verify'; return; }
  try {
    const settingsRes = await API.getPublicSettings();
    r2PublicUrl = (settingsRes.r2_public_url || '').replace(/\/$/, '');
    
    const res = await API.request(`/admin/students/${studentId}`);
    student = res.data;

    // Build dynamic DOC_TYPES based on student jalur
    const studentJalur = student.jalur || "all";
    const berkasSettings = settingsRes.landing_berkas_json || [];
    DOC_TYPES = berkasSettings
      .filter(b => b.active && (b.jalur.includes("all") || b.jalur.includes(studentJalur)))
      .map(b => ({
        key: b.id,
        label: b.title,
        desc: b.desc,
        required: b.required
      }));

    render();
  } catch (err) {
    document.getElementById('loading').innerHTML = '<p class="text-red-500">Gagal memuat data.</p>';
  }
}

function getDocUrl(doc) {
  if (!doc || !doc.key) return '';
  if (doc.key.startsWith('http')) return doc.key;
  return r2PublicUrl ? `${r2PublicUrl}/${doc.key}` : doc.key;
}

function render() {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('content').classList.remove('hidden');

  const bio = student.biodata || {};
  const alm = student.alamat || {};
  const nama = bio.namaLengkap || student.namaPreRegister || '-';

  document.getElementById('profile-name').textContent = nama;
  document.getElementById('profile-nisn').textContent = `NISN: ${student.nisn}`;
  document.getElementById('side-name').textContent = nama;
  document.getElementById('side-nisn').textContent = student.nisn;
  document.getElementById('profile-jalur').textContent = student.jalur || '-';
  document.getElementById('profile-smp').textContent = student.pendidikan?.asalSekolah || student.asalSmpPreRegister || '-';
  
  const canWa = getPermission('operator_can_whatsapp', false);
  const waBtn = (alm.telepon && canWa) ? `
    <button onclick="sendWaPrompt()" class="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 active:bg-emerald-200 transition text-xs font-semibold rounded-xl border border-emerald-100">
      <span class="material-symbols-outlined text-[16px]">chat</span>
      Kirim WA
    </button>
  ` : '';

  document.getElementById('profile-kontak').innerHTML = `
    <div class="flex flex-col items-start gap-1">
      <span class="font-mono text-slate-700">${alm.telepon || '-'}</span>
      ${waBtn}
    </div>
    <span class="text-[10px] font-medium opacity-60 mt-1 block">${alm.email || ''}</span>
  `;

  const canVerify = getPermission('operator_can_verify', true);
  const btnVerifyAll = document.getElementById('btn-verify-all');
  if (btnVerifyAll) {
    btnVerifyAll.style.display = canVerify ? '' : 'none';
  }

  renderStatus();
  renderDocuments();
  renderBiodata();

  // Apply biodata edit permissions
  const canEdit = getPermission('operator_can_edit_student', true);
  const saveBtn = document.getElementById('btn-save');
  if (saveBtn) {
    saveBtn.style.display = canEdit ? '' : 'none';
  }

  if (!canEdit) {
    document.querySelectorAll('#biodata-fields input, #biodata-fields select').forEach(el => {
      el.disabled = true;
      el.classList.add('opacity-75', 'cursor-not-allowed');
    });
  }
}

function renderStatus() {
  const vs = student.verifikasi?.status || 'pending';
  const statusMap = {
    pending: { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Menunggu Review' },
    verified: { color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Terverifikasi' },
    rejected: { color: 'text-red-600', bg: 'bg-red-50', label: 'Ditolak' },
  };
  const st = statusMap[vs] || statusMap.pending;
  document.getElementById('status-info').innerHTML = `
    <div class="p-4 rounded-2xl ${st.bg} ${st.color} font-bold text-sm text-center border border-current/10">
      ${st.label}
    </div>
    ${student.submittedAt ? `<p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-2">Dikirim: ${new Date(student.submittedAt).toLocaleDateString()}</p>` : ''}
    ${student.verifikasi?.catatan ? `<div class="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-medium border border-red-100">Catatan: ${student.verifikasi.catatan}</div>` : ''}
  `;
}

function renderDocuments() {
  const docs = student.dokumen || {};
  const docStatuses = student.verifikasi?.dokumenStatus || {};
  const canVerify = getPermission('operator_can_verify', true);

  document.getElementById('documents-list').innerHTML = DOC_TYPES.map(dt => {
    const doc = docs[dt.key];
    const url = getDocUrl(doc);
    const hasFile = doc && doc.key;
    const docStatus = docStatuses[dt.key]?.status || 'pending';
    const isValid = docStatus === 'valid';
    const isRejected = docStatus === 'rejected';

    return `
      <div class="bg-white rounded-[2rem] border ${isValid ? 'border-emerald-200 bg-emerald-50/10' : isRejected ? 'border-red-200 bg-red-50/10' : 'border-slate-100'} p-8 flex flex-wrap md:flex-nowrap gap-8 items-center">
        <div class="w-full md:w-40 h-40 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center justify-center group overflow-hidden relative shadow-inner">
          ${hasFile ? `
            <span class="material-symbols-outlined text-4xl text-slate-300">${doc.mimeType?.startsWith('image/') ? 'image' : 'description'}</span>
            <button onclick="openDocModal('${dt.label}', '${url}', '${doc.mimeType}')" class="absolute inset-0 bg-blue-600/90 text-white opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2">
              <span class="material-symbols-outlined">visibility</span>
              <span class="text-[10px] font-bold uppercase tracking-widest">Lihat</span>
            </button>
          ` : `
            <span class="material-symbols-outlined text-4xl text-slate-100">no_photography</span>
            <span class="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">Kosong</span>
          `}
        </div>
        <div class="flex-1 space-y-4">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-slate-800">${dt.label}</h4>
            <div class="flex gap-2">
               ${dt.required ? '<span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-lg">Wajib</span>' : ''}
               ${isValid ? '<span class="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-100 px-2 py-1 rounded-lg">Valid</span>' : ''}
               ${isRejected ? '<span class="text-[10px] font-bold text-red-600 uppercase tracking-widest bg-red-100 px-2 py-1 rounded-lg">Ditolak</span>' : ''}
            </div>
          </div>
          <p class="text-xs text-slate-400 font-medium leading-relaxed">${dt.desc}</p>
          
          <div class="flex gap-3">
            ${hasFile && !isValid && canVerify ? `
              <button onclick="verifyDoc('${dt.key}')" class="px-4 py-2 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all">Terima</button>
            ` : ''}
            ${hasFile && !isRejected && canVerify ? `
              <button onclick="rejectDoc('${dt.key}')" class="px-4 py-2 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all">Tolak</button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ... Additional helper functions for renderBiodata, verifyDoc, etc. (Truncated for brevity but including essential logic)

const OPTIONS = {
  jenisKelamin: ['Laki-laki', 'Perempuan'],
  agama: ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'],
  statusYatim: ['Tidak', 'Yatim', 'Piatu', 'Yatim-Piatu'],
  tinggalDengan: ['Orang Tua', 'Saudara', 'Wali', 'Kost', 'Asrama', 'Lainnya'],
  jarakSekolah: ['< 1 km', '1-3 km', '3-5 km', '5-10 km', '> 10 km'],
  transportasi: ['Jalan Kaki', 'Sepeda', 'Sepeda Motor', 'Mobil Pribadi', 'Angkutan Umum', 'Ojek', 'Lainnya'],
  golonganDarah: ['A', 'B', 'AB', 'O', 'Tidak Tahu'],
  pendidikan: ['SD/Sederajat', 'SMP/Sederajat', 'SMA/Sederajat', 'D1', 'D2', 'D3', 'D4/S1', 'S2', 'S3', 'Tidak Sekolah'],
  penghasilan: ['< Rp 1.000.000', 'Rp 1.000.000 - Rp 3.000.000', 'Rp 3.000.000 - Rp 5.000.000', 'Rp 5.000.000 - Rp 10.000.000', '> Rp 10.000.000'],
  statusHidup: ['Masih Hidup', 'Meninggal Dunia'],
};

function selectHtml(id, options, value, label) {
  return `<div class="space-y-2"><label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">${label}</label><select id="${id}" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-medium focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"><option value="">-- Pilih --</option>${options.map(o => `<option value="${o}" ${o === value ? 'selected' : ''}>${o}</option>`).join('')}</select></div>`;
}
function inputHtml(id, value, label, opts = {}) {
  const ro = opts.readonly ? 'readonly' : '';
  const cls = opts.readonly ? 'opacity-50 cursor-not-allowed' : 'focus:bg-white focus:ring-4 focus:ring-blue-500/10';
  const type = opts.type || 'text';
  return `<div class="space-y-2"><label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">${label}</label><input type="${type}" id="${id}" value="${value || ''}" ${ro} class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-medium ${cls} transition-all"></div>`;
}

function renderBiodata() {
  const bio = student.biodata || {};
  const alm = student.alamat || {};
  const kes = student.kesehatan || {};
  const pend = student.pendidikan || {};
  const wali = student.wali || {};
  const gem = student.kegemaran || {};

  document.getElementById('biodata-fields').innerHTML = `
    <div class="space-y-12">
      <!-- Section A: Identitas -->
      <section>
        <h4 class="font-bold text-slate-800 mb-6 flex items-center gap-2"><span class="material-symbols-outlined text-blue-600">person</span> Identitas Peserta Didik</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${inputHtml('bio_namaLengkap', bio.namaLengkap, 'Nama Lengkap', { readonly: true })}
          ${inputHtml('bio_namaPanggilan', bio.namaPanggilan, 'Nama Panggilan')}
          ${selectHtml('bio_jenisKelamin', OPTIONS.jenisKelamin, bio.jenisKelamin, 'Jenis Kelamin')}
          ${inputHtml('bio_nik', bio.nik, 'NIK')}
          ${inputHtml('bio_tempatLahir', bio.tempatLahir, 'Tempat Lahir')}
          ${inputHtml('bio_tanggalLahir', bio.tanggalLahir?.split('T')[0], 'Tgl Lahir', { type: 'date' })}
          ${selectHtml('bio_agama', OPTIONS.agama, bio.agama, 'Agama')}
          ${inputHtml('bio_kewarganegaraan', bio.kewarganegaraan, 'Kewarganegaraan')}
          ${inputHtml('bio_anakKe', bio.anakKe, 'Anak Ke-', { type: 'number' })}
          ${inputHtml('bio_saudaraKandung', bio.saudaraKandung, 'Sdr. Kandung', { type: 'number' })}
          ${inputHtml('bio_saudaraTiri', bio.saudaraTiri, 'Sdr. Tiri', { type: 'number' })}
          ${inputHtml('bio_saudaraAngkat', bio.saudaraAngkat, 'Sdr. Angkat', { type: 'number' })}
          ${inputHtml('bio_jumlahSaudara', bio.jumlahSaudara, 'Total Saudara', { type: 'number' })}
          ${selectHtml('bio_statusYatim', OPTIONS.statusYatim, bio.statusYatim, 'Status Anak')}
          ${inputHtml('bio_bahasaSehari', bio.bahasaSehari, 'Bahasa Sehari-hari')}
        </div>
      </section>

      <!-- Section B: Alamat -->
      <section class="border-t border-slate-50 pt-8">
        <h4 class="font-bold text-slate-800 mb-6 flex items-center gap-2"><span class="material-symbols-outlined text-blue-600">home</span> Tempat Tinggal</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="md:col-span-2">${inputHtml('alm_alamatLengkap', alm.alamatLengkap, 'Alamat Lengkap')}</div>
          ${inputHtml('alm_telepon', alm.telepon, 'Telepon/WA')}
          ${inputHtml('alm_email', alm.email, 'Email', { type: 'email' })}
          ${selectHtml('alm_tinggalDengan', OPTIONS.tinggalDengan, alm.tinggalDengan, 'Tinggal Dengan')}
          ${selectHtml('alm_jarakSekolah', OPTIONS.jarakSekolah, alm.jarakSekolah, 'Jarak ke Sekolah')}
          ${selectHtml('alm_transportasi', OPTIONS.transportasi, alm.transportasi, 'Transportasi')}
        </div>
      </section>

      <!-- Section C: Kesehatan -->
      <section class="border-t border-slate-50 pt-8">
        <h4 class="font-bold text-slate-800 mb-6 flex items-center gap-2"><span class="material-symbols-outlined text-blue-600">medical_services</span> Kesehatan</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${selectHtml('kes_golonganDarah', OPTIONS.golonganDarah, kes.golonganDarah, 'Gol. Darah')}
          ${inputHtml('kes_penyakit', kes.penyakit, 'Riwayat Penyakit')}
          ${inputHtml('kes_kelainanJasmani', kes.kelainanJasmani, 'Kelainan Jasmani')}
          ${inputHtml('kes_tinggiBadan', kes.tinggiBadan, 'Tinggi (cm)', { type: 'number' })}
          ${inputHtml('kes_beratBadan', kes.beratBadan, 'Berat (kg)', { type: 'number' })}
        </div>
      </section>

      <!-- Section D: Pendidikan -->
      <section class="border-t border-slate-50 pt-8">
        <h4 class="font-bold text-slate-800 mb-6 flex items-center gap-2"><span class="material-symbols-outlined text-blue-600">history_edu</span> Pendidikan Sebelumnya</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${inputHtml('pend_asalSekolah', pend.asalSekolah, 'Asal Sekolah', { readonly: true })}
          ${inputHtml('pend_nomorIjazah', pend.nomorIjazah, 'No. Ijazah/SKL')}
          ${inputHtml('pend_lamaBelajar', pend.lamaBelajar, 'Lama Belajar (th)', { type: 'number' })}
          ${inputHtml('pend_kelas', pend.kelas, 'Kelas Saat Ini')}
        </div>
      </section>

      <!-- Section E: Ayah -->
      <section class="border-t border-slate-50 pt-8">
        <h4 class="font-bold text-slate-800 mb-6 flex items-center gap-2"><span class="material-symbols-outlined text-blue-600">male</span> Data Ayah Kandung</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${inputHtml('ayah_nama', student.ayah?.nama, 'Nama Ayah')}
          ${inputHtml('ayah_tempatLahir', student.ayah?.tempatLahir, 'Tempat Lahir')}
          ${inputHtml('ayah_tanggalLahir', student.ayah?.tanggalLahir?.split('T')[0], 'Tgl Lahir', { type: 'date' })}
          ${selectHtml('ayah_agama', OPTIONS.agama, student.ayah?.agama, 'Agama')}
          ${inputHtml('ayah_kewarganegaraan', student.ayah?.kewarganegaraan, 'Kewarganegaraan')}
          ${selectHtml('ayah_pendidikan', OPTIONS.pendidikan, student.ayah?.pendidikan, 'Pendidikan')}
          ${inputHtml('ayah_pekerjaan', student.ayah?.pekerjaan, 'Pekerjaan')}
          ${selectHtml('ayah_penghasilan', OPTIONS.penghasilan, student.ayah?.penghasilan, 'Penghasilan')}
          ${inputHtml('ayah_telepon', student.ayah?.telepon, 'Telepon/WA')}
          ${selectHtml('ayah_status', OPTIONS.statusHidup, student.ayah?.status, 'Status Hidup')}
          <div class="md:col-span-2">${inputHtml('ayah_alamat', student.ayah?.alamat, 'Alamat Ayah')}</div>
        </div>
      </section>

      <!-- Section F: Ibu -->
      <section class="border-t border-slate-50 pt-8">
        <h4 class="font-bold text-slate-800 mb-6 flex items-center gap-2"><span class="material-symbols-outlined text-blue-600">female</span> Data Ibu Kandung</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${inputHtml('ibu_nama', student.ibu?.nama, 'Nama Ibu')}
          ${inputHtml('ibu_tempatLahir', student.ibu?.tempatLahir, 'Tempat Lahir')}
          ${inputHtml('ibu_tanggalLahir', student.ibu?.tanggalLahir?.split('T')[0], 'Tgl Lahir', { type: 'date' })}
          ${selectHtml('ibu_agama', OPTIONS.agama, student.ibu?.agama, 'Agama')}
          ${inputHtml('ibu_kewarganegaraan', student.ibu?.kewarganegaraan, 'Kewarganegaraan')}
          ${selectHtml('ibu_pendidikan', OPTIONS.pendidikan, student.ibu?.pendidikan, 'Pendidikan')}
          ${inputHtml('ibu_pekerjaan', student.ibu?.pekerjaan, 'Pekerjaan')}
          ${selectHtml('ibu_penghasilan', OPTIONS.penghasilan, student.ibu?.penghasilan, 'Penghasilan')}
          ${inputHtml('ibu_telepon', student.ibu?.telepon, 'Telepon/WA')}
          ${selectHtml('ibu_status', OPTIONS.statusHidup, student.ibu?.status, 'Status Hidup')}
          <div class="md:col-span-2">${inputHtml('ibu_alamat', student.ibu?.alamat, 'Alamat Ibu')}</div>
        </div>
      </section>

      <!-- Section G: Wali -->
      <section class="border-t border-slate-50 pt-8">
        <h4 class="font-bold text-slate-800 mb-6 flex items-center gap-2"><span class="material-symbols-outlined text-blue-600">supervisor_account</span> Data Wali</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${inputHtml('wali_nama', wali.nama, 'Nama Wali')}
          ${inputHtml('wali_tempatLahir', wali.tempatLahir, 'Tempat Lahir')}
          ${inputHtml('wali_tanggalLahir', wali.tanggalLahir?.split('T')[0], 'Tgl Lahir', { type: 'date' })}
          ${inputHtml('wali_pekerjaan', wali.pekerjaan, 'Pekerjaan Wali')}
          ${inputHtml('wali_telepon', wali.telepon, 'Telepon Wali')}
          <div class="md:col-span-2">${inputHtml('wali_alamat', wali.alamat, 'Alamat Wali')}</div>
        </div>
      </section>

      <!-- Section H: Kegemaran -->
      <section class="border-t border-slate-50 pt-8">
        <h4 class="font-bold text-slate-800 mb-6 flex items-center gap-2"><span class="material-symbols-outlined text-blue-600">interests</span> Kegemaran & Bakat</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${inputHtml('gem_kesenian', gem.kesenian, 'Kesenian')}
          ${inputHtml('gem_olahraga', gem.olahraga, 'Olahraga')}
          ${inputHtml('gem_organisasi', gem.organisasi, 'Organisasi')}
          ${inputHtml('gem_lainLain', gem.lainLain, 'Lain-lain')}
        </div>
      </section>
    </div>
  `;
}

// Actions logic...
async function verifyDoc(key) {
  try {
    await API.request(`/admin/students/${studentId}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ dokumenStatus: { [key]: { status: 'valid', catatan: '' } } }),
    });
    student.verifikasi.dokumenStatus[key] = { status: 'valid' };
    renderDocuments();
    UI.toast('Berhasil diterima', 'success');
  } catch (err) { UI.toast(err.message, 'error'); }
}

async function rejectDoc(key) {
  const catatan = await UI.prompt('Tolak Dokumen', 'Berikan alasan penolakan agar siswa dapat memperbaikinya:', 'Contoh: Gambar kurang jelas / blur');
  if (catatan === null) return;
  try {
    await API.request(`/admin/students/${studentId}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ dokumenStatus: { [key]: { status: 'rejected', catatan } } }),
    });
    student.verifikasi.dokumenStatus[key] = { status: 'rejected', catatan };
    renderDocuments();
    UI.toast('Berhasil ditolak', 'info');
  } catch (err) { UI.toast(err.message, 'error'); }
}

async function verifyAll() {
  if (!await UI.confirm('Verifikasi Semua?', 'Tindakan ini akan menyetujui seluruh dokumen dan mengubah status siswa menjadi Terverifikasi.')) return;
  try {
    await API.request(`/admin/students/${studentId}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'verified' }),
    });
    UI.success('Berhasil!', 'Siswa telah diverifikasi dan siap untuk tahap selanjutnya.');
    setTimeout(() => window.location.href = '/admin/verify', 1500);
  } catch (err) { UI.toast(err.message, 'error'); }
}

async function saveChanges() {
  const updateData = { biodata: {}, alamat: {}, kesehatan: {}, pendidikan: {}, ayah: {}, ibu: {}, wali: {}, kegemaran: {} };
  // Simplify collection for now
  document.querySelectorAll('#biodata-fields input:not([readonly]), #biodata-fields select').forEach(el => {
    const parts = el.id.split('_');
    const mapping = { bio: 'biodata', alm: 'alamat', kes: 'kesehatan', pend: 'pendidikan', ayah: 'ayah', ibu: 'ibu', wali: 'wali', gem: 'kegemaran' };
    const section = mapping[parts[0]];
    if (section) updateData[section][parts[1]] = el.value;
  });
  try {
    await API.request(`/admin/students/${studentId}/update`, { method: 'PUT', body: JSON.stringify(updateData) });
    UI.toast('Biodata disimpan', 'success');
  } catch (err) { UI.toast(err.message, 'error'); }
}

async function downloadPdf() {
  try {
    const token = API.getToken();
    const res = await fetch(`/api/admin/students/${studentId}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Buku_Induk_${student.nisn}.pdf`; a.click();
  } catch (err) { UI.toast('Gagal download PDF', 'error'); }
}

function openDocModal(title, url, mime) {
  const modal = document.getElementById('doc-modal');
  document.getElementById('modal-title').textContent = title;
  const isImage = mime?.startsWith('image/') || url.match(/\\.(jpg|jpeg|png)$/i);
  document.getElementById('modal-content').innerHTML = isImage ? `<img src="${url}" class="max-w-full max-h-[70vh] rounded-3xl shadow-2xl">` : `<iframe src="${url}" class="w-full h-[60vh] rounded-3xl"></iframe>`;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}
async function sendWaPrompt() {
  const message = await UI.prompt('Kirim Pesan WhatsApp', `Tulis pesan kustom untuk dikirim via gateway WA ke ${student.biodata?.namaLengkap || student.namaPreRegister}:`, 'Halo, silakan lengkapi berkas pendaftaran Anda...');
  if (!message) return;
  try {
    UI.toast('Mengirim pesan WhatsApp...', 'info');
    const res = await API.request('/admin/wa/send', {
      method: 'POST',
      body: JSON.stringify({
        studentId: studentId,
        message: message,
        messageType: 'custom'
      })
    });
    if (res.success) {
      UI.toast('✅ Pesan berhasil terkirim!', 'success');
    } else {
      UI.toast('❌ Gagal: ' + (res.message || ''), 'error');
    }
  } catch (err) {
    UI.toast('❌ Gagal mengirim pesan.', 'error');
  }
}

init();

document.addEventListener('spmb_settings_ready', () => {
  if (student) {
    render();
  }
});
