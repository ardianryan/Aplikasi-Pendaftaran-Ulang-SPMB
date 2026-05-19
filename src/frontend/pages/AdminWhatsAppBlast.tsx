/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';
import { AdminLayout } from '../layouts/AdminLayout';

export const AdminWhatsAppBlast = (props: any) => {
  return (
    <AdminLayout title="Blast Pesan WhatsApp" subtitle="Kirim pesan massal ke calon murid berdasarkan filter" {...props} path="/admin/whatsapp/blast">
      <div className="space-y-6">
        {/* Filter Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-5">Filter Penerima</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Filter Status */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Status Siswa</label>
              <select id="blastFilter" onchange="previewBlast()"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="not_submitted">Semua yang Belum Submit</option>
                <option value="not_started">Belum Login / Belum Mulai</option>
                <option value="biodata">Belum Isi Biodata Lengkap</option>
                <option value="upload">Belum Upload Berkas</option>
              </select>
            </div>
            {/* Filter Jalur */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Jalur Pendaftaran</label>
              <select id="blastJalur" onchange="previewBlast()"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Semua Jalur</option>
              </select>
            </div>
          </div>

          {/* Preview count */}
          <div className="mt-5 p-4 rounded-xl bg-blue-50 border border-blue-200" id="previewBox" style="display:none">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-blue-600 text-[28px]">groups</span>
              <div>
                <p className="text-sm font-bold text-blue-800"><span id="previewCount">0</span> penerima ditemukan</p>
                <p className="text-xs text-blue-600" id="previewInfo">Klik "Kirim Blast" untuk mulai mengirim</p>
              </div>
            </div>
            {/* Sample list */}
            <div id="previewSample" className="mt-3 text-xs text-blue-700 font-mono"></div>
          </div>
        </div>

        {/* Message Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-5">Pesan</h2>

          {/* Template selector */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-slate-700 mb-2">Gunakan Template</label>
            <select id="blastTemplate" onchange="loadBlastTemplate()"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">— Tulis pesan custom —</option>
              <option value="wa_template_reminder">📋 Reminder Daftar Ulang</option>
              <option value="wa_template_biodata">📝 Reminder Isi Buku Induk</option>
              <option value="wa_template_verified">✅ Notifikasi Terverifikasi</option>
              <option value="wa_template_rejected">❌ Notifikasi Ditolak</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Isi Pesan</label>
            <textarea id="blastMessage" rows={8}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              placeholder="Tulis pesan di sini. Variabel: {{nama}}, {{nisn}}, {{jalur}}, {{sekolah}}, {{tahun}}, {{url}}"></textarea>
            <p className="text-xs text-slate-400 mt-1.5">Variabel akan diganti otomatis untuk setiap penerima</p>
          </div>
        </div>

        {/* Send Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-slate-600">Delay Jeda:</span>
                <input 
                  type="number" 
                  id="blastDelay" 
                  value="5" 
                  min="5" 
                  oninput="updateEstimatedTime()"
                  className="w-16 px-2 py-1 border border-slate-200 rounded-xl text-sm text-center font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
                <span className="text-sm text-slate-500">detik (Minimal: 5 detik)</span>
              </div>
              <p className="text-xs text-slate-400 font-medium" id="estimatedTime"></p>
            </div>
            <button onclick="sendBlast()" id="btnBlast"
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <span className="material-symbols-outlined text-[18px]">campaign</span>
              Kirim Blast
            </button>
          </div>

          {/* Progress */}
          <div id="blastProgress" className="mt-5" style="display:none">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-700">Progress Pengiriman</span>
              <span id="progressText" className="text-sm font-mono text-slate-600">0/0</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div id="progressBar" className="bg-emerald-500 h-3 rounded-full transition-all duration-300" style="width:0%"></div>
            </div>
            <p id="progressStatus" className="text-xs text-slate-400 mt-2"></p>
          </div>
        </div>
      </div>

      <script src="/js/admin/wa-blast-logic.js"></script>
    </AdminLayout>
  );
};
