/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';
import { AdminLayout } from '../layouts/AdminLayout';

export const AdminWhatsAppLogs = (props: any) => {
  return (
    <AdminLayout title="Log Pengiriman WhatsApp" subtitle="Riwayat pesan yang dikirim melalui gateway" {...props} path="/admin/whatsapp/logs">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-180px)]">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-3">
            <select id="filterStatus" onchange="loadLogs(1)" className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Semua Status</option>
              <option value="sent">Terkirim (Sent)</option>
              <option value="failed">Gagal (Failed)</option>
              <option value="queued">Antrean (Queued)</option>
            </select>
            <select id="filterType" onchange="loadLogs(1)" className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Semua Jenis</option>
              <option value="reminder">Reminder Pendaftaran</option>
              <option value="biodata">Reminder Biodata</option>
              <option value="verified">Notif Terverifikasi</option>
              <option value="rejected">Notif Ditolak</option>
              <option value="blast">Blast Massal</option>
              <option value="custom">Pesan Custom</option>
            </select>
            <button onclick="loadLogs(1)" className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Refresh">
              <span className="material-symbols-outlined text-[20px]">refresh</span>
            </button>
          </div>
          
          <button onclick="cleanupLogs()" className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
            Bersihkan Log Lama
          </button>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto relative">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="sticky top-0 bg-slate-100 text-slate-500 font-bold text-xs uppercase tracking-wider z-10">
              <tr>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Penerima</th>
                <th className="px-6 py-4">Jenis</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 w-full">Pesan / Error</th>
              </tr>
            </thead>
            <tbody id="logsTableBody" className="divide-y divide-slate-100">
              {/* Rows populated by JS */}
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  <span className="material-symbols-outlined text-[32px] animate-spin mb-2">sync</span>
                  <p>Memuat log...</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <p className="text-sm text-slate-500" id="pageInfo">Menampilkan - dari - log</p>
          <div className="flex items-center gap-2">
            <button id="btnPrev" onclick="changePage(-1)" className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span id="pageIndicator" className="text-sm font-bold text-slate-700 px-2">1 / 1</span>
            <button id="btnNext" onclick="changePage(1)" className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>

      </div>

      <script src="/js/admin/wa-logs-logic.js"></script>
    </AdminLayout>
  );
};
