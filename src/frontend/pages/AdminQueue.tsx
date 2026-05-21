/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';
import { AdminLayout } from '../layouts/AdminLayout';

/**
 * AdminQueue — Panel Manajemen Antrean (Admin)
 * Kontrol sesi, monitoring status loket, daftar tiket
 */
export const AdminQueue = (props: any) => {
  return (
    <AdminLayout title="Manajemen Antrean" subtitle="Kontrol sesi antrean, monitoring loket, dan daftar tiket" {...props} path="/admin/queue">

      {/* Header + Tombol Display Publik */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-violet-500 w-1 h-8 rounded-full"></div>
          <h2 className="text-xl font-bold text-slate-800">Manajemen Antrean</h2>
        </div>
        <div className="flex items-center gap-3">
          <a href="/antrean" target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-2xl hover:bg-slate-700 transition-all">
            <span className="text-base">📺</span>
            Buka Display TV
          </a>
          <a href="/admin/queue/counter" target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-2xl hover:bg-violet-700 transition-all">
            <span className="text-base">🖥️</span>
            Panel Loket
          </a>
        </div>
      </div>

      {/* === STATUS SESI === */}
      <div id="sessionCard" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span id="sessionStatusDot" className="w-3 h-3 rounded-full bg-slate-300"></span>
              <span id="sessionStatusText" className="text-sm font-bold text-slate-500 uppercase tracking-wider">Memuat...</span>
            </div>
            <p id="sessionMeta" className="text-xs text-slate-400 mt-1">—</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button id="btnStartPreReg"
              className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-all">
              ▶ Mulai Pra-Pendaftaran
            </button>
            <button id="btnStartReReg"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all">
              ▶ Mulai Daftar Ulang
            </button>
            <button id="btnAddTickets"
              className="hidden px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-all">
              + Tambah Tiket
            </button>
            <button id="btnEndSession" disabled
              className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              ⏹ Akhiri Sesi
            </button>
          </div>
        </div>

        {/* Statistik */}
        <div id="sessionStats" class="hidden mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-2xl p-4 text-center">
            <p id="statTotal" className="text-2xl font-black text-slate-800">0</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Tiket Terbit</p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-4 text-center">
            <p id="statWaiting" className="text-2xl font-black text-amber-600">0</p>
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mt-1">Menunggu</p>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-4 text-center">
            <p id="statDone" className="text-2xl font-black text-emerald-600">0</p>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mt-1">Selesai</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 text-center">
            <p id="statSkipped" className="text-2xl font-black text-slate-500">0</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Dilewati</p>
          </div>
        </div>
      </div>

      {/* === STATUS LOKET === */}
      <div id="counterSection" class="hidden bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <h3 className="font-bold text-slate-700">Status Loket</h3>
        </div>
        <div id="counterGrid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Diisi oleh JS */}
        </div>
      </div>

      {/* === DAFTAR TIKET === */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-700">Daftar Tiket Sesi Ini</h3>
          <div className="flex items-center gap-3">
            <select id="ticketStatusFilter"
              className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-600 font-medium focus:outline-none">
              <option value="">Semua Status</option>
              <option value="waiting">Menunggu</option>
              <option value="serving">Dilayani</option>
              <option value="done">Selesai</option>
              <option value="skipped">Dilewati</option>
            </select>
            <button id="btnRefreshTickets"
              className="px-3 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all">
              ↺ Refresh
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400">
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">No Tiket</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Loket</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Dipanggil</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Selesai</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Siswa</th>
              </tr>
            </thead>
            <tbody id="ticketTableBody">
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-slate-400 text-sm">
                  Belum ada sesi aktif
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Pagination tiket */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50 bg-slate-50/30">
          <p id="ticketPaginationInfo" className="text-xs font-bold text-slate-400 uppercase tracking-wider">—</p>
          <div className="flex items-center gap-2">
            <button id="ticketPrevPage" disabled
              className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-white hover:text-violet-600 disabled:opacity-30 transition-all">
              ‹
            </button>
            <div id="ticketPageNumbers" className="flex items-center gap-1 text-sm font-bold text-slate-500"></div>
            <button id="ticketNextPage" disabled
              className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-white hover:text-violet-600 disabled:opacity-30 transition-all">
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Modal Mulai Sesi */}
      <div id="startSessionModal"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 hidden"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
          <h2 className="text-xl font-black text-slate-800 mb-2" id="startModalTitle">Mulai Sesi Antrean</h2>
          <p className="text-sm text-slate-500 mb-6" id="startModalSubtitle">Masukkan konfigurasi awal sesi antrean</p>
          
          <div className="space-y-4 mb-6">
            <div id="batchSizeContainer">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Jumlah Tiket Awal</label>
              <input
                id="startSessionBatchSize"
                type="number"
                min="1"
                max="500"
                value="50"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                id="startSessionContinue"
                type="checkbox"
                className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500/20 focus:ring-2"
              />
              <label htmlFor="startSessionContinue" className="text-sm font-semibold text-slate-600 select-none cursor-pointer">
                Lanjutkan dari nomor terakhir
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button id="btnStartModalCancel"
              className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-all">
              Batal
            </button>
            <button id="btnStartModalConfirm"
              className="flex-1 px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-all">
              Mulai Sesi
            </button>
          </div>
        </div>
      </div>

      {/* Modal Tambah Tiket */}
      <div id="addTicketsModal"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 hidden"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
          <h2 className="text-xl font-black text-slate-800 mb-2">Tambah Nomor Antrean</h2>
          <p className="text-sm text-slate-500 mb-6">Tambahkan nomor antrean tambahan secara batch ke sesi aktif</p>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Jumlah Tiket Tambahan</label>
              <input
                id="addTicketsCount"
                type="number"
                min="1"
                max="200"
                value="10"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button id="btnAddTicketsCancel"
              className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-all">
              Batal
            </button>
            <button id="btnAddTicketsConfirm"
              className="flex-1 px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-all">
              Tambah
            </button>
          </div>
        </div>
      </div>

      <script src="/js/admin/queue-logic.js"></script>
    </AdminLayout>
  );
};
