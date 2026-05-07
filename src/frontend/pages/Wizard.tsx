/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';
import { Layout } from '../layouts/Layout';

export const Wizard = (props: any) => {
  return (
    <Layout title="Registrasi Ulang" {...props}>
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {props.settings?.app_logo ? (
              <img src={props.settings.app_logo} alt="Logo" className="w-8 h-8 object-contain" />
            ) : (
              <span className="material-symbols-outlined text-blue-600" style={{ fontSize: '28px' }}>school</span>
            )}
            <span className="font-bold text-slate-800 hidden sm:inline">{props.schoolName || 'SMAN 1 Gedeg'}</span>
          </div>
          {/* Mobile Progress Bar */}
          <div className="flex-1 mx-4 lg:hidden">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span id="progress-text">Langkah 1 dari 5</span>
              <span id="step-label" class="font-medium text-blue-600">Konfirmasi</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div id="progress-fill" className="bg-blue-600 h-full transition-all duration-500" style={{ width: '0%' }}></div>
            </div>
          </div>
          <button onclick="API.logout()" className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <span className="material-symbols-outlined text-slate-500">logout</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-64px)] bg-slate-50">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-72 bg-white border-r border-slate-200 p-6 overflow-y-auto">
          <nav>
            <ul className="space-y-2">
              {[
                { step: 1, label: 'Konfirmasi Data', icon: 'fact_check' },
                { step: 2, label: 'Isi Biodata', icon: 'edit_note' },
                { step: 3, label: 'Upload Berkas', icon: 'upload_file' },
                { step: 4, label: 'Review & Kirim', icon: 'preview' },
                { step: 5, label: 'Selesai', icon: 'check_circle' },
              ].map((s) => (
                <li key={s.step} className="sidebar-step cursor-pointer group" data-step={s.step}>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all group-hover:bg-slate-50">
                    <span className="material-symbols-outlined text-slate-400 group-[.active]:text-blue-600 group-[.completed]:text-emerald-500 transition-colors">{s.icon}</span>
                    <span className="text-sm font-semibold text-slate-600 group-[.active]:text-blue-700 transition-colors">{s.label}</span>
                  </div>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Content Area */}
        <main id="main-content" className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
          <div className="max-w-7xl mx-auto">

            {/* STEP 1: Confirmation */}
            <section id="step-1" className="wizard-step">
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Konfirmasi Data Diri</h2>
                <p className="text-slate-500 mb-8 text-sm">Pastikan data hasil seleksi berikut sesuai dengan identitas Anda.</p>

                <div className="space-y-4">
                  {[
                    { label: 'Nama Lengkap', id: 'confirm-nama' },
                    { label: 'NISN', id: 'confirm-nisn' },
                    { label: 'Tanggal Lahir', id: 'confirm-tgl' },
                    { label: 'Asal SMP', id: 'confirm-smp' },
                    { label: 'Jalur', id: 'confirm-jalur' },
                  ].map((f) => (
                    <div key={f.id} className="flex flex-col md:flex-row md:items-center gap-2 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-sm font-medium text-slate-500 w-40">{f.label}</span>
                      <span id={f.id} className="font-bold text-slate-800">-</span>
                    </div>
                  ))}
                </div>

                <div className="mt-10 flex justify-end">
                  <button id="btn-confirm" onclick="Wizard.confirmAndNext()" className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-100">
                    <span className="btn-text">Konfirmasi & Lanjutkan</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
            </section>

            {/* === MODAL: Cek Kelengkapan Dokumen === */}
            <div id="modal-doc-checklist" className="fixed inset-0 z-[200] hidden items-center justify-center p-4" style={{ background: 'rgba(2,6,23,0.7)', backdropFilter: 'blur(8px)' }}>
              <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-3xl">checklist_rtl</span>
                    </div>
                    <div>
                      <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Sebelum melanjutkan</p>
                      <h2 className="text-2xl font-extrabold">Siapkan Dokumen Anda</h2>
                    </div>
                  </div>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    Tahap berikutnya adalah pengisian Buku Induk. Pastikan dokumen-dokumen di bawah ini sudah Anda siapkan dalam bentuk file digital (<strong className="text-white">foto/scan</strong>) sebelum melanjutkan.
                  </p>
                </div>

                {/* Document List */}
                <div className="p-6 max-h-72 overflow-y-auto">
                  <ul id="modal-berkas-list" className="space-y-3">
                    {/* Populated by wizard.js */}
                    <li className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl animate-pulse">
                      <div className="w-8 h-8 bg-slate-200 rounded-xl"></div>
                      <div className="h-3 bg-slate-200 rounded flex-1"></div>
                    </li>
                  </ul>
                </div>

                {/* Actions */}
                <div className="p-6 pt-0 space-y-3">
                  <button onclick="Wizard.proceedToStep2()" className="w-full py-4 bg-blue-600 text-white font-extrabold rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-200">
                    <span className="material-symbols-outlined">check_circle</span>
                    Dokumen sudah siap, lanjutkan pengisian
                  </button>
                  <button onclick="Wizard.closeDocChecklist()" className="w-full py-3.5 border-2 border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3">
                    <span className="material-symbols-outlined text-xl">arrow_back</span>
                    Kembali, saya akan menyiapkan dulu
                  </button>
                </div>
              </div>
            </div>

            {/* STEP 2: Biodata Form */}
            <section id="step-2" className="wizard-step hidden">
              <div className="flex flex-col lg:flex-row gap-10">

                {/* Section Navigation Sidebar */}
                <aside className="lg:w-72 shrink-0">
                  <div className="sticky top-24 space-y-6">
                    <div>
                      <h1 className="text-xl font-bold text-slate-800">SPMB {props.settings?.school_year?.split('/')[0] || "2025"}</h1>
                      <p className="text-sm text-slate-500 font-medium">Sistem Pendaftaran Murid Baru</p>
                    </div>

                    <nav className="flex flex-col gap-2 p-2 bg-white rounded-3xl border border-slate-200 shadow-sm">
                      {[
                        { id: 'bio', label: 'Data Diri', icon: 'person' },
                        { id: 'alm', label: 'Alamat & Kontak', icon: 'home' },
                        { id: 'kes', label: 'Kesehatan', icon: 'medical_services' },
                        { id: 'pend', label: 'Pendidikan', icon: 'history_edu' },
                        { id: 'ayah', label: 'Data Ayah', icon: 'male' },
                        { id: 'ibu', label: 'Data Ibu', icon: 'female' },
                        { id: 'wali', label: 'Data Wali', icon: 'supervisor_account' },
                        { id: 'gem', label: 'Kegemaran', icon: 'interests' },
                      ].map((s, idx) => (
                        <button
                          key={s.id}
                          type="button"
                          onclick={`Wizard.switchSection('${s.id}')`}
                          id={`nav-sec-${s.id}`}
                          className="sub-step flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all text-left"
                        >
                          <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-400 sub-step-num transition-all">
                            {idx + 1}
                          </span>
                          <span className="flex-1">{s.label}</span>
                          <span className="material-symbols-outlined text-[18px] opacity-0 sub-step-check text-emerald-500">check_circle</span>
                        </button>
                      ))}
                    </nav>

                    {/* Progress Indicator */}
                    <div className="p-6 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-2">Progres Biodata</p>
                      <div className="flex items-end gap-2 mb-4">
                        <span id="biodata-progress-pct" className="text-3xl font-extrabold">0%</span>
                        <span className="text-[10px] font-bold opacity-60 mb-1">Selesai</span>
                      </div>
                      <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                        <div id="biodata-progress-bar" className="bg-white h-full transition-all duration-700" style={{ width: '0%' }}></div>
                      </div>
                    </div>
                  </div>
                </aside>

                {/* Section Content Area */}
                <div className="flex-1">
                  <form id="biodata-form">

                    {/* Section A: Data Diri */}
                    <div id="sec-bio" className="biodata-section space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="bg-blue-50 border border-blue-100 p-8 rounded-[2rem] flex gap-6">
                        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-600 shrink-0">
                          <span className="material-symbols-outlined text-3xl">info</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-blue-900 mb-1">Tips Pengisian</h4>
                          <p className="text-sm text-blue-700 leading-relaxed font-medium">Gunakan data yang sesuai dengan <strong>Akta Kelahiran</strong> dan <strong>Kartu Keluarga</strong>. Data ini akan menjadi data resmi di Ijazah SMA nanti.</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 grid grid-cols-1 md:grid-cols-2 gap-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 -z-10 opacity-50"></div>

                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Nama Lengkap</label>
                          <input type="text" id="bio-namaLengkap" readonly className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 cursor-not-allowed font-bold" />
                          <p className="text-[10px] text-slate-400 mt-2 ml-1">*Nama lengkap sinkron dari data pendaftaran awal.</p>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Nama Panggilan</label>
                          <input type="text" id="bio-namaPanggilan" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium" placeholder="Contoh: Ryan" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Jenis Kelamin</label>
                          <select id="bio-jenisKelamin" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium appearance-none bg-no-repeat bg-[right_1.5rem_center] bg-[length:1rem_1rem]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")' }}>
                            <option value="">Pilih Jenis Kelamin</option>
                            <option value="Laki-laki">Laki-laki</option>
                            <option value="Perempuan">Perempuan</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Tempat Lahir</label>
                          <input type="text" id="bio-tempatLahir" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium" placeholder="Kota Lahir" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Tanggal Lahir</label>
                          <div className="flex gap-2">
                            <input type="text" id="bio-tanggalLahir-hari" readonly className="w-20 text-center py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 font-bold" />
                            <select id="bio-tanggalLahir-bulan" disabled className="flex-1 py-4 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 font-bold appearance-none">
                              <option value="">Bulan</option>
                              {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
                                <option value={(i + 1).toString().padStart(2, '0')}>{m}</option>
                              ))}
                            </select>
                            <input type="text" id="bio-tanggalLahir-tahun" readonly className="w-24 text-center py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 font-bold" />
                          </div>
                          <input type="hidden" id="bio-tanggalLahir" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">NIK (16 Digit)</label>
                          <input type="text" id="bio-nik" maxLength={16} className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-mono" placeholder="3515..." />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Agama</label>
                          <select id="bio-agama" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium appearance-none bg-no-repeat bg-[right_1.5rem_center] bg-[length:1rem_1rem]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")' }}>
                            <option value="">Pilih Agama</option>
                            <option>Islam</option><option>Kristen</option><option>Katolik</option><option>Hindu</option><option>Buddha</option><option>Konghucu</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Kewarganegaraan</label>
                          <input type="text" id="bio-kewarganegaraan" defaultValue="WNI" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Anak Ke-</label>
                            <input type="number" id="bio-anakKe" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-center" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Sdr. Kandung</label>
                            <input type="number" id="bio-saudaraKandung" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-center" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Sdr. Tiri</label>
                            <input type="number" id="bio-saudaraTiri" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-center" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Sdr. Angkat</label>
                            <input type="number" id="bio-saudaraAngkat" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-center" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Total Saudara</label>
                          <input type="number" id="bio-jumlahSaudara" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-center" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Status Keluarga</label>
                          <select id="bio-statusYatim" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium appearance-none bg-no-repeat bg-[right_1.5rem_center] bg-[length:1rem_1rem]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")' }}>
                            <option value="">Pilih Status</option>
                            <option value="Tidak">Tidak (Lengkap)</option>
                            <option value="Yatim">Yatim</option>
                            <option value="Piatu">Piatu</option>
                            <option value="Yatim-Piatu">Yatim Piatu</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Bahasa Sehari-hari</label>
                          <input type="text" id="bio-bahasaSehari" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" placeholder="Contoh: Indonesia, Jawa" />
                        </div>
                      </div>

                      <div className="flex justify-end gap-4">
                        <button type="button" onclick="Wizard.nextSection('bio')" className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-bold text-sm hover:bg-black transition-all flex items-center gap-3 shadow-xl">
                          Bagian Berikutnya
                          <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                      </div>
                    </div>

                    {/* Section B: Alamat */}
                    <div id="sec-alm" className="biodata-section space-y-8 hidden animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2rem] flex gap-6">
                        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-600 shrink-0">
                          <span className="material-symbols-outlined text-3xl">map</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-emerald-900 mb-1">Informasi Lokasi</h4>
                          <p className="text-sm text-emerald-700 leading-relaxed font-medium">Data ini digunakan untuk menghitung jarak rumah ke sekolah guna keperluan administrasi dan transportasi.</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Alamat Lengkap</label>
                          <textarea id="alm-alamatLengkap" rows={3} className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" placeholder="Nama Jalan, RT/RW, Desa/Kelurahan, Kecamatan..."></textarea>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">No. WhatsApp</label>
                          <input type="tel" id="alm-telepon" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" placeholder="08..." />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Email Aktif</label>
                          <input type="email" id="alm-email" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" placeholder="nama@gmail.com" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Tinggal Dengan</label>
                          <select id="alm-tinggalDengan" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium">
                            <option value="">Pilih Opsi</option>
                            <option>Orang Tua</option><option>Saudara</option><option>Wali</option><option>Kost</option><option>Asrama</option><option>Lainnya</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Jarak ke Sekolah</label>
                          <select id="alm-jarakSekolah" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium">
                            <option value="">Pilih Jarak</option>
                            <option>{"< 1 km"}</option><option>1-3 km</option><option>3-5 km</option><option>5-10 km</option><option>{"> 10 km"}</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Transportasi</label>
                          <select id="alm-transportasi" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium">
                            <option value="">Pilih Kendaraan</option>
                            <option>Jalan Kaki</option><option>Sepeda</option><option>Sepeda Motor</option><option>Mobil Pribadi</option><option>Angkutan Umum</option><option>Ojek</option><option>Lainnya</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-between gap-4">
                        <button type="button" onclick="Wizard.prevSection('alm')" className="px-8 py-5 border-2 border-slate-200 text-slate-600 rounded-[2rem] font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-3">
                          <span className="material-symbols-outlined">arrow_back</span>
                          Kembali
                        </button>
                        <button type="button" onclick="Wizard.nextSection('alm')" className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-bold text-sm hover:bg-black transition-all flex items-center gap-3 shadow-xl">
                          Bagian Berikutnya
                          <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                      </div>
                    </div>

                    {/* Section C: Kesehatan */}
                    <div id="sec-kes" className="biodata-section space-y-8 hidden animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2rem] flex gap-6">
                        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-rose-600 shrink-0">
                          <span className="material-symbols-outlined text-3xl">medical_services</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-rose-900 mb-1">Data Kesehatan</h4>
                          <p className="text-sm text-rose-700 leading-relaxed font-medium">Informasi ini penting bagi Unit Kesehatan Sekolah (UKS) jika sewaktu-waktu Anda membutuhkan bantuan medis darurat.</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Golongan Darah</label>
                          <select id="kes-golonganDarah" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold">
                            <option value="">Pilih Golongan</option>
                            <option>A</option><option>B</option><option>AB</option><option>O</option><option>Tidak Tahu</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Riwayat Penyakit</label>
                          <input type="text" id="kes-penyakit" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" placeholder="Asma, Alergi, dll (Kosongkan jika tidak ada)" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Kelainan Jasmani</label>
                          <input type="text" id="kes-kelainanJasmani" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" placeholder="Kosongkan jika tidak ada" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">TB (cm)</label>
                            <input type="number" id="kes-tinggiBadan" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-center" placeholder="165" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">BB (kg)</label>
                            <input type="number" id="kes-beratBadan" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-center" placeholder="55" />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between gap-4">
                        <button type="button" onclick="Wizard.prevSection('kes')" className="px-8 py-5 border-2 border-slate-200 text-slate-600 rounded-[2rem] font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-3">
                          <span className="material-symbols-outlined">arrow_back</span>
                          Kembali
                        </button>
                        <button type="button" onclick="Wizard.nextSection('kes')" className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-bold text-sm hover:bg-black transition-all flex items-center gap-3 shadow-xl">
                          Bagian Berikutnya
                          <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                      </div>
                    </div>

                    {/* Section D: Pendidikan */}
                    <div id="sec-pend" className="biodata-section space-y-8 hidden animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2rem] flex gap-6">
                        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-amber-600 shrink-0">
                          <span className="material-symbols-outlined text-3xl">school</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-amber-900 mb-1">Riwayat Pendidikan</h4>
                          <p className="text-sm text-amber-700 leading-relaxed font-medium">Asal sekolah dan lama studi Anda di jenjang sebelumnya.</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Asal SMP / Sederajat</label>
                          <input type="text" id="pend-asalSekolah" readonly className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 cursor-not-allowed font-bold" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">No. Ijazah / SKL</label>
                          <input type="text" id="pend-nomorIjazah" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" placeholder="DN-01/..." />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Lama Belajar (Tahun)</label>
                          <input type="number" id="pend-lamaBelajar" defaultValue="3" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-center" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Diterima di Kelas</label>
                          <input type="text" id="pend-kelas" defaultValue="X" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-center" />
                        </div>
                      </div>

                      <div className="flex justify-between gap-4">
                        <button type="button" onclick="Wizard.prevSection('pend')" className="px-8 py-5 border-2 border-slate-200 text-slate-600 rounded-[2rem] font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-3">
                          <span className="material-symbols-outlined">arrow_back</span>
                          Kembali
                        </button>
                        <button type="button" onclick="Wizard.nextSection('pend')" className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-bold text-sm hover:bg-black transition-all flex items-center gap-3 shadow-xl">
                          Bagian Berikutnya
                          <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                      </div>
                    </div>

                    {/* Section E: Ayah */}
                    <div id="sec-ayah" className="biodata-section space-y-8 hidden animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[2rem] flex gap-6">
                        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600 shrink-0">
                          <span className="material-symbols-outlined text-3xl">male</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-indigo-900 mb-1">Data Ayah Kandung</h4>
                          <p className="text-sm text-indigo-700 leading-relaxed font-medium">Informasi orang tua wajib diisi dengan lengkap sesuai Kartu Keluarga.</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Nama Lengkap Ayah</label>
                          <input type="text" id="ayah-nama" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Tempat Lahir Ayah</label>
                          <input type="text" id="ayah-tempatLahir" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Tanggal Lahir Ayah</label>
                          <div className="flex gap-2">
                            <input type="number" id="ayah-tanggalLahir-hari" className="w-20 text-center py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold" placeholder="Tgl" />
                            <select id="ayah-tanggalLahir-bulan" className="flex-1 py-4 px-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold appearance-none">
                              <option value="">Bulan</option>
                              {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
                                <option value={(i + 1).toString().padStart(2, '0')}>{m}</option>
                              ))}
                            </select>
                            <input type="number" id="ayah-tanggalLahir-tahun" className="w-24 text-center py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold" placeholder="Tahun" />
                          </div>
                          <input type="hidden" id="ayah-tanggalLahir" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Agama</label>
                          <select id="ayah-agama" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium appearance-none">
                            <option value="">Pilih Agama</option>
                            <option>Islam</option><option>Kristen</option><option>Katolik</option><option>Hindu</option><option>Buddha</option><option>Konghucu</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Kewarganegaraan</label>
                          <input type="text" id="ayah-kewarganegaraan" defaultValue="WNI" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Pendidikan Terakhir</label>
                          <select id="ayah-pendidikan" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium">
                            <option value="">Pilih Pendidikan</option>
                            <option>SD/Sederajat</option><option>SMP/Sederajat</option><option>SMA/Sederajat</option><option>D3</option><option>D4/S1</option><option>S2</option><option>S3</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Pekerjaan</label>
                          <input type="text" id="ayah-pekerjaan" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Penghasilan Per Bulan</label>
                          <select id="ayah-penghasilan" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium">
                            <option value="">Pilih Range</option>
                            <option>{"< Rp 1.000.000"}</option><option>Rp 1.000.000 - Rp 3.000.000</option><option>Rp 3.000.000 - Rp 5.000.000</option><option>Rp 5.000.000 - Rp 10.000.000</option><option>{"> Rp 10.000.000"}</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">No. WhatsApp</label>
                          <input type="tel" id="ayah-telepon" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" placeholder="08..." />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Email Ayah</label>
                          <input type="email" id="ayah-email" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" placeholder="ayah@mail.com" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Status</label>
                          <select id="ayah-status" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium">
                            <option value="">Pilih Status</option>
                            <option>Masih Hidup</option><option>Meninggal Dunia</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Alamat Ayah</label>
                          <textarea id="ayah-alamat" rows={2} className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" placeholder="Sama dengan alamat siswa..."></textarea>
                        </div>
                      </div>

                      <div className="flex justify-between gap-4">
                        <button type="button" onclick="Wizard.prevSection('ayah')" className="px-8 py-5 border-2 border-slate-200 text-slate-600 rounded-[2rem] font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-3">
                          <span className="material-symbols-outlined">arrow_back</span>
                          Kembali
                        </button>
                        <button type="button" onclick="Wizard.nextSection('ayah')" className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-bold text-sm hover:bg-black transition-all flex items-center gap-3 shadow-xl">
                          Bagian Berikutnya
                          <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                      </div>
                    </div>

                    {/* Section F: Ibu */}
                    <div id="sec-ibu" className="biodata-section space-y-8 hidden animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="bg-purple-50 border border-purple-100 p-8 rounded-[2rem] flex gap-6">
                        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-purple-600 shrink-0">
                          <span className="material-symbols-outlined text-3xl">female</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-purple-900 mb-1">Data Ibu Kandung</h4>
                          <p className="text-sm text-purple-700 leading-relaxed font-medium">Informasi ibu kandung sesuai dengan data kependudukan.</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Nama Lengkap Ibu</label>
                          <input type="text" id="ibu-nama" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Tempat Lahir Ibu</label>
                          <input type="text" id="ibu-tempatLahir" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Tanggal Lahir Ibu</label>
                          <div className="flex gap-2">
                            <input type="number" id="ibu-tanggalLahir-hari" className="w-20 text-center py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold" placeholder="Tgl" />
                            <select id="ibu-tanggalLahir-bulan" className="flex-1 py-4 px-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold appearance-none">
                              <option value="">Bulan</option>
                              {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
                                <option value={(i + 1).toString().padStart(2, '0')}>{m}</option>
                              ))}
                            </select>
                            <input type="number" id="ibu-tanggalLahir-tahun" className="w-24 text-center py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold" placeholder="Tahun" />
                          </div>
                          <input type="hidden" id="ibu-tanggalLahir" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Agama</label>
                          <select id="ibu-agama" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium appearance-none">
                            <option value="">Pilih Agama</option>
                            <option>Islam</option><option>Kristen</option><option>Katolik</option><option>Hindu</option><option>Buddha</option><option>Konghucu</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Kewarganegaraan</label>
                          <input type="text" id="ibu-kewarganegaraan" defaultValue="WNI" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Pendidikan Terakhir</label>
                          <select id="ibu-pendidikan" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium">
                            <option value="">Pilih Pendidikan</option>
                            <option>SD/Sederajat</option><option>SMP/Sederajat</option><option>SMA/Sederajat</option><option>D3</option><option>D4/S1</option><option>S2</option><option>S3</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Pekerjaan</label>
                          <input type="text" id="ibu-pekerjaan" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Penghasilan Per Bulan</label>
                          <select id="ibu-penghasilan" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium">
                            <option value="">Pilih Range</option>
                            <option>{"< Rp 1.000.000"}</option><option>Rp 1.000.000 - Rp 3.000.000</option><option>Rp 3.000.000 - Rp 5.000.000</option><option>Rp 5.000.000 - Rp 10.000.000</option><option>{"> Rp 10.000.000"}</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">No. WhatsApp</label>
                          <input type="tel" id="ibu-telepon" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" placeholder="08..." />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Email Ibu</label>
                          <input type="email" id="ibu-email" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" placeholder="ibu@mail.com" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Status</label>
                          <select id="ibu-status" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium">
                            <option value="">Pilih Status</option>
                            <option>Masih Hidup</option><option>Meninggal Dunia</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Alamat Ibu</label>
                          <textarea id="ibu-alamat" rows={2} className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" placeholder="Sama dengan alamat siswa..."></textarea>
                        </div>
                      </div>

                      <div className="flex justify-between gap-4">
                        <button type="button" onclick="Wizard.prevSection('ibu')" className="px-8 py-5 border-2 border-slate-200 text-slate-600 rounded-[2rem] font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-3">
                          <span className="material-symbols-outlined">arrow_back</span>
                          Kembali
                        </button>
                        <button type="button" onclick="Wizard.nextSection('ibu')" className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-bold text-sm hover:bg-black transition-all flex items-center gap-3 shadow-xl">
                          Bagian Berikutnya
                          <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                      </div>
                    </div>

                    {/* Section G: Wali */}
                    <div id="sec-wali" className="biodata-section space-y-8 hidden animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="bg-slate-100 border border-slate-200 p-8 rounded-[2rem] flex gap-6">
                        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-600 shrink-0">
                          <span className="material-symbols-outlined text-3xl">supervisor_account</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 mb-1">Data Wali (Opsional)</h4>
                          <p className="text-sm text-slate-600 leading-relaxed font-medium">Hanya diisi jika Anda tidak tinggal bersama orang tua kandung atau memiliki wali resmi.</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Nama Lengkap Wali</label>
                          <input type="text" id="wali-nama" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Tempat Lahir Wali</label>
                          <input type="text" id="wali-tempatLahir" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Tanggal Lahir Wali</label>
                          <div className="flex gap-2">
                            <input type="number" id="wali-tanggalLahir-hari" className="w-20 text-center py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold" placeholder="Tgl" />
                            <select id="wali-tanggalLahir-bulan" className="flex-1 py-4 px-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold appearance-none">
                              <option value="">Bulan</option>
                              {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
                                <option value={(i + 1).toString().padStart(2, '0')}>{m}</option>
                              ))}
                            </select>
                            <input type="number" id="wali-tanggalLahir-tahun" className="w-24 text-center py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold" placeholder="Tahun" />
                          </div>
                          <input type="hidden" id="wali-tanggalLahir" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Agama</label>
                          <select id="wali-agama" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium appearance-none">
                            <option value="">Pilih Agama</option>
                            <option>Islam</option><option>Kristen</option><option>Katolik</option><option>Hindu</option><option>Buddha</option><option>Konghucu</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Kewarganegaraan</label>
                          <input type="text" id="wali-kewarganegaraan" defaultValue="WNI" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Pendidikan Terakhir</label>
                          <select id="wali-pendidikan" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium">
                            <option value="">Pilih Pendidikan</option>
                            <option>SD/Sederajat</option><option>SMP/Sederajat</option><option>SMA/Sederajat</option><option>D3</option><option>D4/S1</option><option>S2</option><option>S3</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Pekerjaan Wali</label>
                          <input type="text" id="wali-pekerjaan" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Penghasilan Per Bulan</label>
                          <select id="wali-penghasilan" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium">
                            <option value="">Pilih Range</option>
                            <option>{"< Rp 1.000.000"}</option><option>Rp 1.000.000 - Rp 3.000.000</option><option>Rp 3.000.000 - Rp 5.000.000</option><option>Rp 5.000.000 - Rp 10.000.000</option><option>{"> Rp 10.000.000"}</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">No. HP Wali</label>
                          <input type="tel" id="wali-telepon" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Email Wali</label>
                          <input type="email" id="wali-email" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Status</label>
                          <select id="wali-status" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium">
                            <option value="">Pilih Status</option>
                            <option>Masih Hidup</option><option>Meninggal Dunia</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Alamat Wali</label>
                          <textarea id="wali-alamat" rows={2} className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" placeholder="Alamat lengkap wali..."></textarea>
                        </div>
                      </div>

                      <div className="flex justify-between gap-4">
                        <button type="button" onclick="Wizard.prevSection('wali')" className="px-8 py-5 border-2 border-slate-200 text-slate-600 rounded-[2rem] font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-3">
                          <span className="material-symbols-outlined">arrow_back</span>
                          Kembali
                        </button>
                        <button type="button" onclick="Wizard.nextSection('wali')" className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-bold text-sm hover:bg-black transition-all flex items-center gap-3 shadow-xl">
                          Bagian Berikutnya
                          <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                      </div>
                    </div>

                    {/* Section H: Kegemaran */}
                    <div id="sec-gem" className="biodata-section space-y-8 hidden animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="bg-orange-50 border border-orange-100 p-8 rounded-[2rem] flex gap-6">
                        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-orange-600 shrink-0">
                          <span className="material-symbols-outlined text-3xl">interests</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-orange-900 mb-1">Kegemaran & Bakat</h4>
                          <p className="text-sm text-orange-700 leading-relaxed font-medium">Bantu kami mengenal Anda lebih dekat untuk pengembangan minat dan bakat di sekolah nanti.</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Kesenian</label>
                          <input type="text" id="gem-kesenian" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" placeholder="Seni Musik, Lukis, dll" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Olahraga</label>
                          <input type="text" id="gem-olahraga" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" placeholder="Basket, Futsal, dll" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Organisasi</label>
                          <input type="text" id="gem-organisasi" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" placeholder="Pramuka, OSIS, dll" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Lain-lain</label>
                          <input type="text" id="gem-lainLain" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium" />
                        </div>
                      </div>

                      <div className="flex justify-between gap-4">
                        <button type="button" onclick="Wizard.prevSection('gem')" className="px-8 py-5 border-2 border-slate-200 text-slate-600 rounded-[2rem] font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-3">
                          <span className="material-symbols-outlined">arrow_back</span>
                          Kembali
                        </button>
                        <button type="button" id="btn-biodata-next" onclick="Wizard.completeBiodataAndNext()" className="px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-extrabold text-sm hover:bg-blue-700 transition-all flex items-center gap-3 shadow-2xl shadow-blue-200">
                          <span className="btn-text">Simpan & Lanjutkan ke Berkas</span>
                          <span className="material-symbols-outlined">upload_file</span>
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Floating Draft Saver for Desktop */}
                  <div className="fixed bottom-10 right-10 z-40 hidden xl:block">
                    <button onclick="Wizard.saveBiodata(true)" className="group flex items-center gap-3 bg-white/80 backdrop-blur-xl border border-blue-100 p-2 pr-6 rounded-full shadow-2xl hover:bg-blue-600 transition-all">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-blue-600 transition-all">
                        <span className="material-symbols-outlined">save</span>
                      </div>
                      <span className="text-sm font-bold text-slate-600 group-hover:text-white transition-all">Simpan Draft</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* STEP 3: Upload Documents */}
            <section id="step-3" className="wizard-step hidden">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Unggah Dokumen</h2>
                <p className="text-slate-500 text-sm">Pastikan dokumen terbaca jelas (PDF/JPG/PNG max 5MB).</p>
              </div>

              <div id="upload-zones-container" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Populated dynamically by wizard.js based on settings & student jalur */}
                <div className="md:col-span-2 py-20 flex flex-col items-center justify-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                   <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                   <p className="text-slate-400 font-medium">Memuat daftar dokumen...</p>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-slate-200 flex justify-between gap-4">
                <button onclick="Wizard.goToStep(2)" className="px-6 py-4 border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">arrow_back</span>
                  Kembali
                </button>
                <button id="btn-upload-next" onclick="Wizard.goToStep(4)" disabled className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50">
                  <span>Review & Kirim</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </section>

            {/* STEP 4: Review */}
            <section id="step-4" className="wizard-step hidden">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Review Akhir</h2>
                <p className="text-slate-500 text-sm">Periksa kembali data Anda. Data tidak dapat diubah setelah dikirim.</p>
              </div>

              <div id="review-content" className="space-y-6">
                {/* Populated by wizard.js */}
                <div className="animate-pulse space-y-4">
                  <div className="h-40 bg-slate-200 rounded-3xl"></div>
                  <div className="h-40 bg-slate-200 rounded-3xl"></div>
                </div>
              </div>

              <div className="mt-8 bg-blue-50 p-6 rounded-3xl border border-blue-100">
                <label className="flex items-start gap-4 cursor-pointer">
                  <input type="checkbox" id="pernyataan-check" className="mt-1 w-6 h-6 rounded-lg border-blue-200 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-blue-800 leading-relaxed font-medium">
                    Saya menyatakan bahwa data yang diisikan adalah benar. Saya bersedia menerima sanksi jika terdapat ketidaksesuaian data di kemudian hari.
                  </span>
                </label>
              </div>

              <div className="mt-10 pt-8 border-t border-slate-200 flex justify-between gap-4">
                <button onclick="Wizard.goToStep(3)" className="px-6 py-4 border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">arrow_back</span>
                  Kembali
                </button>
                <button id="btn-submit-final" onclick="Wizard.submitFinal()" className="px-10 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg">
                  <span className="material-symbols-outlined">send</span>
                  <span className="btn-text">Kirim Data Final</span>
                </button>
              </div>
            </section>

            {/* STEP 5: Success */}
            <section id="step-5" className="wizard-step hidden">
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                  <span className="material-symbols-outlined text-emerald-600 text-5xl">check_circle</span>
                </div>
                <h2 className="text-3xl font-extrabold text-slate-800 mb-4">Registrasi Berhasil!</h2>
                <p className="text-slate-500 max-w-md mx-auto mb-10 leading-relaxed">
                  Terima kasih, data pendaftaran ulang Anda telah kami terima dan sedang dalam proses verifikasi.
                </p>

                <div id="verification-status" className="inline-flex items-center gap-2 px-5 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-sm font-bold text-amber-700 mb-10">
                  <span className="material-symbols-outlined text-xl">pending</span>
                  <span>MENUNGGU VERIFIKASI</span>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <button id="btn-download-pdf" onclick="Wizard.downloadPdf()" className="px-10 py-5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all flex items-center gap-3 shadow-xl shadow-blue-200">
                    <span className="material-symbols-outlined">download</span>
                    <span className="btn-text">Download Buku Induk</span>
                  </button>
                  <p className="text-xs text-slate-400">Harap cetak dan bawa berkas ini saat pendaftaran ulang offline.</p>
                </div>
              </div>
            </section>

          </div>
        </main>
      </div>

      {/* Required Scripts */}
      <script dangerouslySetInnerHTML={{ __html: `window.WizardSettings = ${JSON.stringify(props.settings)};` }} />
      <script src="/js/wizard.js"></script>

      <style dangerouslySetInnerHTML={{
        __html: `
        .sidebar-step.active > div {
          background-color: #eff6ff;
          border-left: 4px solid #2563eb;
        }
        .sidebar-step.active .material-symbols-outlined { color: #2563eb; }
        .sidebar-step.active span { color: #1e40af; }
        
        .sidebar-step.completed .material-symbols-outlined { color: #10b981; }
        
        .wizard-step.hidden { display: none; }
        
        .accordion-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease-out, padding 0.3s ease;
        }
        .accordion-content.open {
          max-height: 2000px;
          transition: max-height 0.5s ease-in;
        }
        
        .toast {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          transform: translateY(100%);
          opacity: 0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 9999;
        }
        .toast.show {
          transform: translateY(0);
          opacity: 1;
        }
      ` }} />
    </Layout>
  );
};
