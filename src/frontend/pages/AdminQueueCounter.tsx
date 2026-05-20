/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';
import { AdminLayout } from '../layouts/AdminLayout';

/**
 * AdminQueueCounter — Panel Loket Operator
 * Digunakan petugas di tiap loket untuk memanggil antrian
 */
export const AdminQueueCounter = (props: any) => {
  return (
    <AdminLayout title="Panel Loket" subtitle="Panel petugas untuk memanggil nomor antrian" {...props} path="/admin/queue/counter">

      {/* Modal Pilih Loket */}
      <div id="counterSelectModal"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
          <h2 className="text-xl font-black text-slate-800 mb-2">Pilih Loket</h2>
          <p className="text-sm text-slate-500 mb-6">Pilih nomor loket yang Anda layani</p>
          <div id="counterSelectList" className="grid grid-cols-3 gap-3 mb-6">
            {/* Diisi JS */}
            <div className="col-span-3 text-center text-slate-400 text-sm py-4">Memuat loket...</div>
          </div>
          <p id="counterSelectError" className="text-xs text-red-500 text-center hidden mb-4">Tidak ada sesi antrian aktif</p>
        </div>
      </div>

      {/* Main Panel (hidden sampai loket dipilih) */}
      <div id="counterPanel" class="hidden">
        {/* Header Loket */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-violet-500 w-1 h-8 rounded-full"></div>
            <div>
              <h2 id="counterTitle" className="text-xl font-bold text-slate-800">Loket —</h2>
              <p id="counterMode" className="text-xs text-slate-400 font-medium">—</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-xs text-slate-400">
              <p>Selesai hari ini: <span id="statDone" className="font-bold text-slate-700">0</span></p>
              <p>Dilewati: <span id="statSkipped" className="font-bold text-slate-500">0</span></p>
            </div>
            <button id="btnChangeCounter"
              className="px-3 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all">
              Ganti Loket
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* === KIRI: NOMOR DILAYANI === */}
          <div className="lg:col-span-2 space-y-4">
            {/* Card Nomor Aktif */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Sedang Dilayani</p>
              <div id="servingDisplay" className="text-center">
                <div id="servingNumber"
                  className="font-black text-slate-200 leading-none select-none mb-2"
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(4rem, 12vw, 8rem)' }}>
                  —
                </div>
                <p id="servingSince" className="text-xs text-slate-400">Tidak ada yang dilayani</p>
              </div>

              {/* Info Siswa (jika student link aktif) */}
              <div id="studentInfoCard" class="hidden mt-6 bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Data Siswa</p>
                <p id="servingStudentName" className="font-bold text-blue-900 text-lg">—</p>
                <p id="servingStudentNisn" className="text-xs font-mono text-blue-600">NISN: —</p>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="grid grid-cols-3 gap-3">
              <button id="btnDone"
                className="flex flex-col items-center gap-2 py-5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                disabled>
                <span className="text-2xl">✅</span>
                <span className="text-sm">Selesai</span>
              </button>
              <button id="btnCallNext"
                className="flex flex-col items-center gap-2 py-5 bg-violet-600 text-white font-bold rounded-2xl hover:bg-violet-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                disabled>
                <span className="text-2xl">→</span>
                <span className="text-sm">Panggil Berikutnya</span>
              </button>
              <button id="btnSkip"
                className="flex flex-col items-center gap-2 py-5 bg-amber-500 text-white font-bold rounded-2xl hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                disabled>
                <span className="text-2xl">⏭</span>
                <span className="text-sm">Lewati</span>
              </button>
            </div>

            {/* Panggil Nomor Tertentu */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Panggil Nomor Tertentu</p>
              <div className="flex gap-2">
                <input
                  id="specificTicketInput"
                  type="text"
                  placeholder="Contoh: A008"
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono font-bold uppercase text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
                />
                <button id="btnCallSpecific"
                  className="px-4 py-3 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-all">
                  Panggil
                </button>
              </div>
            </div>

            {/* Issue Tiket Baru (untuk meja registrasi yang juga bisa dari loket) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Terbitkan Tiket Baru</p>
              <div id="issueTicketSection" className="flex gap-2">
                <div id="nisnInputWrapper" class="hidden flex-1">
                  <input
                    id="issueNisnInput"
                    type="text"
                    placeholder="NISN siswa (opsional)"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  />
                </div>
                <button id="btnIssueTicket"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all">
                  + Terbitkan Nomor
                </button>
              </div>
              <div id="lastIssuedDisplay" class="hidden mt-3 text-center">
                <p className="text-xs text-slate-400">Tiket terakhir:</p>
                <p id="lastIssuedNumber" className="font-mono font-black text-2xl text-slate-800">—</p>
              </div>
            </div>
          </div>

          {/* === KANAN: DAFTAR ANTRIAN MENUNGGU === */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Menunggu</p>
              <span id="waitingBadge" className="text-xs font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">0</span>
            </div>
            <div id="waitingList" className="space-y-2 overflow-y-auto" style={{ maxHeight: '400px' }}>
              <p className="text-xs text-slate-300 text-center py-4">Tidak ada antrian</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">↑ Berikutnya dipanggil</p>
            </div>
          </div>
        </div>
      </div>

      {/* Font mono untuk nomor */}
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@700;800&display=swap" rel="stylesheet" />
      <script src="/js/admin/queue-counter-logic.js"></script>
    </AdminLayout>
  );
};
