/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';
import { AdminLayout } from '../layouts/AdminLayout';

export const AdminStudents = (props: any) => {
  return (
    <AdminLayout title="Data Siswa" subtitle="Kelola data pendaftar" {...props} path="/admin/students">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 w-1 h-8 rounded-full"></div>
          <h2 className="text-xl font-bold text-slate-800">Daftar Siswa</h2>
        </div>
        <div className="flex items-center gap-3">
          <button id="addStudentBtn" className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all text-sm font-bold shadow-lg shadow-blue-100">
            <span className="material-symbols-outlined text-lg">person_add</span>
            Tambah Siswa
          </button>
          <button id="exportModalBtn" className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all text-sm font-bold shadow-lg shadow-emerald-100">
            <span className="material-symbols-outlined text-lg">download</span>
            Export Buku Induk
          </button>
        </div>
      </div>

      {/* Export Modal */}
      <div id="exportModal" className="hidden fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-800">Export Buku Induk</h3>
            <button id="closeExportModal" className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
          </div>
          <div className="p-8 space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Filter Jalur</label>
              <select id="exportFilterJalur" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium">
                <option value="all">Semua Jalur</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Filter Status</label>
              <select id="exportFilterStatus" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium">
                <option value="all">Semua Status (Lengkap & Belum)</option>
                <option value="verified">Hanya Terverifikasi</option>
                <option value="rejected">Hanya Ditolak</option>
                <option value="pending">Hanya Menunggu Verifikasi</option>
              </select>
            </div>
            <button id="doExportBtn" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">description</span>
              Unduh Excel (.xlsx)
            </button>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      <div id="addStudentModal" className="hidden fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-800">Tambah Data Siswa Manual</h3>
            <button id="closeAddModal" className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
          </div>
          <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">NISN</label>
                 <input type="text" id="add_nisn" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none" placeholder="Masukkan 10 digit NISN" />
               </div>
               <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nama Lengkap</label>
                 <input type="text" id="add_name" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none" placeholder="Nama sesuai ijazah" />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Asal Sekolah</label>
                 <input type="text" id="add_school" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none" placeholder="SMP/MTs Asal" />
               </div>
               <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pilih Jalur</label>
                 <select id="add_jalur" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-medium">
                   {/* Options will be injected */}
                 </select>
               </div>
            </div>
            <div>
               <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">No. Telepon / WA</label>
               <input type="text" id="add_phone" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none" placeholder="Contoh: 085155030300" />
            </div>
            <div>
               <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-blue-600">Password Awal (Default: NISN)</label>
               <p className="text-[10px] text-slate-400 mb-2">Siswa dapat mengubah password setelah login pertama kali.</p>
            </div>
            <button id="doAddStudentBtn" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">Simpan Data Siswa</button>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-8">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[300px]">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              type="text"
              id="searchInput"
              placeholder="Cari nama, NISN, atau asal sekolah..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all text-sm"
            />
          </div>

          {/* Jalur Filter */}
          <div className="min-w-[180px]">
            <select id="filterJalur" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-600 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium">
              <option value="">Semua Jalur</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="min-w-[180px]">
            <select id="filterStatus" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-600 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium">
              <option value="">Semua Status</option>
              <option value="not_started">Belum Mulai</option>
              <option value="submitted">Sudah Submit</option>
              <option value="verified">Terverifikasi</option>
              <option value="rejected">Ditolak</option>
              <option value="pending">Menunggu Verifikasi</option>
            </select>
          </div>

          {/* Reset */}
          <button id="resetFilters" className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all" title="Reset Filter">
            <span className="material-symbols-outlined">restart_alt</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500">
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">NISN & Nama</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Asal Sekolah</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Jalur</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Update Terakhir</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody id="studentsTableBody">
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-400 font-medium">Memuat data siswa...</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-8 py-6 border-t border-slate-50 bg-slate-50/30">
          <p id="paginationInfo" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Menampilkan 0 dari 0 data</p>
          <div className="flex items-center gap-2">
            <button id="prevPage" disabled className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-white hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <div id="pageNumbers" className="flex items-center gap-1 text-sm font-bold text-slate-500">
               {/* Injected */}
            </div>
            <button id="nextPage" disabled className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-white hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <div id="detailModal" className="hidden fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col scale-95 transition-transform duration-300">
          <div className="flex items-center justify-between px-10 py-6 border-b border-slate-100 sticky top-0 bg-white z-10">
            <div>
              <h3 className="font-bold text-xl text-slate-800">Detail Pendaftar</h3>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-0.5">Informasi Lengkap Siswa</p>
            </div>
            <button id="closeModal" className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div id="detailContent" className="p-10 overflow-y-auto custom-scrollbar">
            {/* Injected by JS */}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      ` }} />
      <script src="/js/admin/students.js"></script>
    </AdminLayout>
  );
};
