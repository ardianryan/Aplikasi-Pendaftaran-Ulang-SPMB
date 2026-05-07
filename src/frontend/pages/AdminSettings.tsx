/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';
import { AdminLayout } from '../layouts/AdminLayout';

export const AdminSettings = (props: any) => {
  return (
    <AdminLayout title="Pengaturan Portal" subtitle="Kelola identitas, tampilan, dan akses portal registrasi" {...props} path="/admin/settings">
      <div className="space-y-8">
        
        {/* Row 1: Identitas & Akses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          
          {/* Identitas Sekolah */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100">
                <span className="material-symbols-outlined">school</span>
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Identitas Sekolah</h3>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nama Sekolah (Singkat)</label>
                <input type="text" id="school_name" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-medium" />
                <p className="text-[10px] text-slate-400 mt-2 font-medium">Ditampilkan di navigasi & mobile</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nama Sekolah (Lengkap)</label>
                <input type="text" id="school_name_full" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-medium" />
              </div>
            </div>
          </div>

          {/* Identitas Aplikasi */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100">
                <span className="material-symbols-outlined">apps</span>
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Identitas Aplikasi</h3>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Singkatan</label>
                  <input type="text" id="app_name" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nama Panjang</label>
                  <input type="text" id="app_name_full" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-medium" />
                </div>
              </div>
              
              <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                <div id="logo-preview" className="w-14 h-14 bg-white rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                   <span className="material-symbols-outlined text-slate-300">image</span>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Logo Utama</p>
                  <input type="file" id="file-logo" accept="image/*" className="hidden" onchange="uploadFile('app_logo', this)" />
                  <button onclick="document.getElementById('file-logo').click()" className="text-xs font-bold text-blue-600 hover:underline">Upload Baru</button>
                </div>
              </div>

              <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                <div id="favicon-preview" className="w-14 h-14 bg-white rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                   <span className="material-symbols-outlined text-slate-300">image</span>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Favicon (.ico)</p>
                  <input type="file" id="file-favicon" accept=".ico,image/x-icon,image/png" className="hidden" onchange="uploadFile('app_icon', this)" />
                  <button onclick="document.getElementById('file-favicon').click()" className="text-xs font-bold text-blue-600 hover:underline">Upload Baru</button>
                </div>
              </div>
            </div>
          </div>

          {/* Kontrol Akses (Moved to Row 1 for 3-col balance) */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
             <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100">
                <span className="material-symbols-outlined">lock</span>
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Akses Registrasi</h3>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-slate-900 rounded-[2.5rem] text-white overflow-hidden relative shadow-xl shadow-slate-200">
                <div className="relative z-10">
                  <p className="font-bold text-base mb-1">Status Portal</p>
                  <div className="flex items-center gap-2">
                    <div id="status-dot" className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                    <span id="status-text" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Portal Ditutup</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer z-10">
                  <input type="checkbox" id="registration_open" className="sr-only peer" onchange="updateStatusUI(this.checked)" />
                  <div className="w-20 h-10 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-10 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-8 after:w-8 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                </label>
                <div id="status-pulse" className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-red-500/10 rounded-full blur-3xl transition-colors duration-500"></div>
              </div>

              <script dangerouslySetInnerHTML={{ __html: `
                function updateStatusUI(isOpen) {
                  const dot = document.getElementById('status-dot');
                  const text = document.getElementById('status-text');
                  const pulse = document.getElementById('status-pulse');
                  
                  if (isOpen) {
                    dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
                    text.textContent = 'Portal Dibuka';
                    text.className = 'text-[10px] font-bold uppercase tracking-widest text-emerald-400';
                    pulse.className = 'absolute right-[-20px] top-[-20px] w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl transition-colors duration-500';
                  } else {
                    dot.className = 'w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
                    text.textContent = 'Portal Ditutup';
                    text.className = 'text-[10px] font-bold uppercase tracking-widest text-slate-400';
                    pulse.className = 'absolute right-[-20px] top-[-20px] w-32 h-32 bg-red-500/10 rounded-full blur-3xl transition-colors duration-500';
                  }
                }
              ` }} />

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pesan Saat Ditutup</label>
                <textarea id="registration_closed_message" rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-medium text-sm"></textarea>
              </div>
            </div>
          </div>

          {/* Jadwal */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
                <span className="material-symbols-outlined">event</span>
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Jadwal Pelaksanaan</h3>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tahun Pelajaran</label>
                <input type="text" id="school_year" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-center" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tanggal Mulai</label>
                  <input type="date" id="registration_start_date" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tanggal Berakhir</label>
                  <input type="date" id="registration_end_date" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium" />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Kop Surat Section */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
             <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600">
                <span className="material-symbols-outlined">description</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Kop Surat & Dokumen</h3>
                <p className="text-xs text-slate-400 font-medium">Pengaturan header PDF Buku Induk Siswa</p>
              </div>
          </div>
          <div className="p-10 space-y-8">
            {/* Logo Kop Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-slate-100">
              <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                <div id="kop-left-preview" className="w-16 h-16 bg-white rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                   <span className="material-symbols-outlined text-slate-300">image</span>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Logo Kop Kiri</p>
                  <input type="file" id="file-kop-left" accept="image/*" className="hidden" onchange="uploadFile('kop_logo_left', this)" />
                  <button onclick="document.getElementById('file-kop-left').click()" className="text-xs font-bold text-blue-600 hover:underline">Upload Baru</button>
                </div>
              </div>

              <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                <div id="kop-right-preview" className="w-16 h-16 bg-white rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                   <span className="material-symbols-outlined text-slate-300">image</span>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Logo Kop Kanan</p>
                  <input type="file" id="file-kop-right" accept="image/*" className="hidden" onchange="uploadFile('kop_logo_right', this)" />
                  <button onclick="document.getElementById('file-kop-right').click()" className="text-xs font-bold text-blue-600 hover:underline">Upload Baru</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Baris 1 (Instansi)</label>
                <input type="text" id="kop_line1" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Baris 2 (Dinas)</label>
                <input type="text" id="kop_line2" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Kota Tanda Tangan</label>
                <input type="text" id="kop_city" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none font-bold" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Baris 3 (Nama Sekolah - Bold)</label>
                <input type="text" id="kop_line3" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none font-extrabold text-lg" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Baris 4 (Kabupaten/Kota - Bold)</label>
                <input type="text" id="kop_line4" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none font-extrabold" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Baris 5 (Alamat Lengkap)</label>
                <input type="text" id="kop_line5" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none text-sm font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Baris 6 (Kontak/NPSN)</label>
                <input type="text" id="kop_line6" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none text-xs" />
              </div>
            </div>
          </div>
        </div>

        {/* Global Save Floating Bar */}
        <div className="flex justify-end pt-4 pb-12">
           <button id="btn-save" onclick="saveSettings()" className="px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-extrabold text-sm hover:bg-blue-700 transition-all flex items-center gap-3 shadow-2xl shadow-blue-200">
              <span className="material-symbols-outlined">save</span>
              <span id="btn-save-text">Simpan Seluruh Pengaturan</span>
            </button>
        </div>

      </div>

      <script src="/js/admin/settings-logic.js"></script>
    </AdminLayout>
  );
};
