/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';
import { AdminLayout } from '../layouts/AdminLayout';

export const AdminVerifyDetail = (props: any) => {
  return (
    <AdminLayout title="Verifikasi Dokumen" subtitle="Periksa validitas data dan dokumen pendaftar" {...props} path="/admin/verify">
      <div id="loading" className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium">Memuat data lengkap siswa...</p>
      </div>

      <div id="content" className="hidden space-y-8">
        {/* Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-24 z-40 backdrop-blur-md bg-white/90">
          <div className="flex items-center gap-4">
            <a href="/admin/verify" className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">
              <span className="material-symbols-outlined">arrow_back</span>
            </a>
            <div>
              <h2 id="profile-name" className="text-xl font-bold text-slate-800">...</h2>
              <p id="profile-nisn" className="text-xs font-mono text-slate-400">NISN: ...</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button onclick="downloadPdf()" className="px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition-all text-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">print</span>
              Cetak Buku Induk
            </button>
            <button onclick="verifyAll()" id="btn-verify-all" className="px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-100">
              <span className="material-symbols-outlined text-lg">done_all</span>
              Verifikasi Semua
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel: Summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-8 text-center border-b border-slate-50">
                <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-inner">
                  <span className="material-symbols-outlined text-5xl">person</span>
                </div>
                <h3 id="side-name" className="font-bold text-slate-800 text-lg">...</h3>
                <p id="side-nisn" className="text-sm font-mono text-slate-400">...</p>
              </div>
              <div className="p-8 space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Jalur Pendaftaran</p>
                  <p id="profile-jalur" className="text-sm font-bold text-slate-700">...</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Asal Sekolah</p>
                  <p id="profile-smp" className="text-sm font-bold text-slate-700">...</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kontak Siswa</p>
                  <p id="profile-kontak" className="text-sm font-bold text-slate-700">...</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">info</span>
                Status Verifikasi
              </h4>
              <div id="status-info" className="space-y-4"></div>
            </div>
          </div>

          {/* Right Panel: Documents */}
          <div className="lg:col-span-8 space-y-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 px-2">
              <span className="material-symbols-outlined text-blue-600">file_copy</span>
              Pemeriksaan Dokumen
            </h3>
            <div id="documents-list" className="grid grid-cols-1 gap-6"></div>
          </div>
        </div>

        {/* Biodata Section */}
        <div id="biodata-section" className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600">
                <span className="material-symbols-outlined">edit_note</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Biodata Lengkap</h3>
                <p className="text-xs text-slate-400 font-medium">Ubah informasi pendaftar jika diperlukan</p>
              </div>
            </div>
            <button onclick="saveChanges()" id="btn-save" className="px-8 py-4 bg-slate-800 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-slate-200">
              <span className="material-symbols-outlined">save</span>
              Simpan Biodata
            </button>
          </div>
          <div id="biodata-fields" className="p-10"></div>
        </div>
      </div>

      {/* Doc Preview Modal */}
      <div id="doc-modal" className="hidden fixed inset-0 z-[100] items-center justify-center bg-slate-900/80 backdrop-blur-md p-4" onclick="closeModal(event)">
        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
            <h3 id="modal-title" className="font-bold text-slate-800 text-lg">Preview Dokumen</h3>
            <button onclick="closeModal()" className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div id="modal-content" className="flex-1 overflow-auto p-8 flex items-center justify-center bg-slate-50 min-h-[500px]"></div>
        </div>
      </div>

      <script src="/js/admin/verify-detail-logic.js"></script>
    </AdminLayout>
  );
};
