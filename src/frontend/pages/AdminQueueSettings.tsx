/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';
import { AdminLayout } from '../layouts/AdminLayout';

/**
 * AdminQueueSettings — Pengaturan Antrean (halaman terpisah)
 */
export const AdminQueueSettings = (props: any) => {
  return (
    <AdminLayout title="Pengaturan Antrean" subtitle="Konfigurasi prefix, loket, display, dan mode antrean" {...props} path="/admin/queue/settings">
      
      {/* Quill WYSIWYG Editor Stylesheet */}
      <link href="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        /* Kustomisasi Tampilan Quill Editor agar menyatu dengan Tema */
        .ql-container.ql-snow {
          border-bottom-left-radius: 1rem;
          border-bottom-right-radius: 1rem;
          border-color: #e2e8f0;
          font-family: inherit;
        }
        .ql-toolbar.ql-snow {
          border-top-left-radius: 1rem;
          border-top-right-radius: 1rem;
          border-color: #e2e8f0;
          background: #f8fafc;
        }
      ` }} />

      <div className="flex items-center gap-3 mb-8">
        <div className="bg-violet-500 w-1 h-8 rounded-full"></div>
        <h2 className="text-xl font-bold text-slate-800">Pengaturan Antrean</h2>
      </div>

      {/* Toast notifikasi */}
      <div id="toast" class="hidden fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-bold shadow-xl transition-all">
        Tersimpan!
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* === NOMOR ANTREAN === */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-700 mb-1">Prefix Nomor Antrean</h3>
          <p className="text-xs text-slate-400 mb-6">Format: [PREFIX][nomor]. Contoh: A → A001, PRA → PRA001</p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Prefix Mode Pra-Pendaftaran
              </label>
              <input id="queuePreRegPrefix" type="text" maxLength={5}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-mono font-bold text-lg uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 transition-all"
                placeholder="A" />
              <p className="text-xs text-slate-400 mt-1">Contoh hasil: <span id="previewPreReg" className="font-mono font-bold text-slate-600">A001</span></p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Prefix Mode Daftar Ulang
              </label>
              <input id="queueReRegPrefix" type="text" maxLength={5}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-mono font-bold text-lg uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 transition-all"
                placeholder="B" />
              <p className="text-xs text-slate-400 mt-1">Contoh hasil: <span id="previewReReg" className="font-mono font-bold text-slate-600">B001</span></p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Digit Nomor (Padding)
              </label>
              <select id="queueNumberPadding"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 font-medium text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 transition-all">
                <option value="2">2 digit — A01, A99</option>
                <option value="3">3 digit — A001, A999</option>
                <option value="4">4 digit — A0001, A9999</option>
              </select>
            </div>
          </div>
        </div>

        {/* === LOKET === */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-700 mb-1">Konfigurasi Loket</h3>
          <p className="text-xs text-slate-400 mb-6">Atur jumlah loket dan nama masing-masing loket</p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Jumlah Loket Aktif
              </label>
              <div className="flex items-center gap-4">
                <input id="queueCounterCount" type="range" min="1" max="20"
                  className="flex-1 accent-violet-600"
                  value="5" />
                <span id="counterCountDisplay"
                  className="w-12 h-10 flex items-center justify-center bg-violet-50 border border-violet-200 rounded-xl font-black text-violet-700 text-lg">
                  5
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Nama Loket
              </label>
              <div id="counterNamesList" className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {/* Diisi JS */}
              </div>
            </div>
          </div>
        </div>

        {/* === DISPLAY TV === */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-700 mb-1">Tampilan Display Publik</h3>
          <p className="text-xs text-slate-400 mb-6">Teks yang muncul di TV sekolah dan browser siswa</p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Judul Display</label>
              <input id="queueDisplayTitle" type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 transition-all"
                placeholder="Antrean Verifikasi SPMB" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Sub-Judul (opsional)</label>
              <input id="queueDisplaySubtitle" type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 transition-all"
                placeholder="Kosong = tidak ditampilkan" />
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div>
                <p className="text-sm font-bold text-slate-700">Tampilkan Daftar Tunggu</p>
                <p className="text-xs text-slate-400">Nomor antrean yang sedang menunggu di panel kanan display</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input id="queueDisplayShowWaiting" type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-300 peer-checked:bg-violet-500 rounded-full transition-all peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          </div>
        </div>

        {/* === MODE LANJUTAN === */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-700 mb-1">Mode Lanjutan</h3>
          <p className="text-xs text-slate-400 mb-6">Fitur opsional untuk kebutuhan khusus</p>

          <div className="space-y-4">
            {/* Student Link */}
            <div className="border border-slate-200 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-700 mb-1">🔗 Link ke Data Siswa</p>
                  <p className="text-xs text-slate-400">
                    Saat aktif, tiket antrean terhubung ke database siswa by NISN.
                    Panel loket akan menampilkan nama dan data siswa saat dipanggil.
                    Display TV juga menampilkan nama siswa di bawah nomor antrean.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input id="queueStudentLinkEnabled" type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-300 peer-checked:bg-violet-500 rounded-full transition-all peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
              <div id="studentLinkNote" class="hidden mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs text-amber-700 font-medium">
                  ⚠️ Mode ini berlaku pada sesi antrean berikutnya. Sesi yang sedang berjalan tidak terpengaruh.
                  Pastikan data NISN siswa sudah di-import sebelum menggunakan fitur ini.
                </p>
              </div>
            </div>

            {/* Preview link display publik */}
            <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100">
              <p className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-2">Link Display Publik</p>
              <p className="text-xs text-violet-700 mb-2">Bagikan link ini ke siswa agar bisa pantau antrean dari rumah:</p>
              <div className="flex items-center gap-2">
                <code id="publicDisplayUrl" className="flex-1 text-xs bg-white px-3 py-2 rounded-lg border border-violet-200 font-mono text-violet-800 truncate">
                  {/* Diisi JS */}
                </code>
                <button id="btnCopyUrl"
                  className="px-3 py-2 bg-violet-600 text-white text-xs font-bold rounded-lg hover:bg-violet-700 transition-all flex-shrink-0">
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* === OPERASIONAL & LAYANAN === */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-700 mb-1">Operasional & Estimasi Pelayanan</h3>
          <p className="text-xs text-slate-400 mb-6">Konfigurasi jam kerja antrean dan rata-rata waktu layanan per siswa</p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Rata-Rata Waktu Pelayanan (Menit)
              </label>
              <input id="queueAverageServiceTime" type="number" min="1" max="180"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 transition-all"
                placeholder="15" />
              <p className="text-[10px] text-slate-400 mt-1">Digunakan untuk menghitung estimasi waktu tunggu siswa secara dinamis.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Informasi Jam Operasional Pelayanan
              </label>
              <input id="queueOperationalHours" type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 transition-all"
                placeholder="Senin - Jumat, 08:00 - 14:00 WIB" />
              <p className="text-[10px] text-slate-400 mt-1">Ditampilkan pada dashboard siswa saat sesi antrean belum dibuka.</p>
            </div>
          </div>
        </div>

        {/* === PENGUMUMAN & MEDIA DISPLAY TV === */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:col-span-2">
          <h3 className="font-bold text-slate-700 mb-1">Pengumuman & Media Display TV</h3>
          <p className="text-xs text-slate-400 mb-6">Kelola konten media informasi yang ditayangkan di layar TV display antrean</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Tipe Media Pengumuman</label>
                <select id="queueDisplayAnnouncementType"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 font-medium text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 transition-all">
                  <option value="none">None (Tanpa Pengumuman - Tampilan Nomor Penuh)</option>
                  <option value="html">📝 Kustom Text Editor (Visual WYSIWYG HTML)</option>
                  <option value="youtube">📺 Putar Video YouTube (Autoplay, Loop, Mute)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Tema Display TV</label>
                <select id="queueDisplayTheme"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 font-medium text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 transition-all">
                  <option value="dark">🌙 Dark Mode (Tema Gelap Premium)</option>
                  <option value="light">☀️ Light Mode (Tema Terang Bersih)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Mengatur tema warna awal bawaan ketika TV display di-load.</p>
              </div>

              {/* YouTube Section */}
              <div id="announcementYtSection" class="hidden">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">ID Video YouTube</label>
                <input id="queueDisplayAnnouncementYtId" type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 transition-all"
                  placeholder="dQw4w9WgXcQ" />
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  Masukkan ID video unik saja (11 karakter).<br />
                  Contoh untuk <code>https://www.youtube.com/watch?v=<b>dQw4w9WgXcQ</b></code><br />
                  maka ID-nya adalah: <span className="font-mono font-bold text-slate-600 bg-slate-100 px-1 py-0.5 rounded">dQw4w9WgXcQ</span>
                </p>
              </div>
            </div>

            {/* Quill HTML Editor Section */}
            <div id="announcementHtmlSection" class="hidden flex flex-col">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Konten Teks Pengumuman (Visual WYSIWYG)
              </label>
              <div className="flex-1 flex flex-col min-h-[220px]">
                <div id="editor-container" className="flex-1 bg-white"></div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Gunakan toolbar editor di atas untuk memformat teks, membuat checklist/bullet persyaratan berkas, atau mewarnai teks secara visual.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Tombol Simpan */}
      <div className="mt-8 flex justify-end">
        <button id="btnSaveSettings"
          className="px-8 py-3 bg-violet-600 text-white font-bold rounded-2xl hover:bg-violet-700 active:scale-95 transition-all shadow-lg shadow-violet-500/20">
          💾 Simpan Pengaturan
        </button>
      </div>

      {/* Load Quill.js Core & Snow Theme via CDN */}
      <script src="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.js"></script>
      <script src="/js/admin/queue-settings-logic.js"></script>
    </AdminLayout>
  );
};
