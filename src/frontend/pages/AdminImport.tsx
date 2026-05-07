/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';
import { AdminLayout } from '../layouts/AdminLayout';

export const AdminImport = (props: any) => {
  return (
    <AdminLayout title="Import Data" subtitle="Import data siswa dari file Excel" {...props} path="/admin/import">
      <div className="space-y-8">
        {/* Instructions Card */}
        <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-8 flex gap-6">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <span className="material-symbols-outlined text-3xl">lightbulb</span>
          </div>
          <div>
            <h3 className="font-bold text-blue-900 text-lg mb-2">Petunjuk Import Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
              <div className="flex items-center gap-2 text-sm text-blue-700 font-medium">
                <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-[10px]">1</span>
                Download template Excel
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-700 font-medium">
                <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-[10px]">2</span>
                Isi data pendaftar (NISN, Nama, dll)
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-700 font-medium">
                <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-[10px]">3</span>
                Upload file ke area di bawah
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-700 font-medium">
                <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-[10px]">4</span>
                Sistem akan memvalidasi data otomatis
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Download Section */}
          <div className="md:col-span-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100">
              <span className="material-symbols-outlined text-3xl">table_view</span>
            </div>
            <h3 className="font-bold text-slate-800 mb-2">Template Excel</h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
              Pastikan Anda menggunakan template resmi untuk menghindari error format.
            </p>
            <button id="downloadTemplate" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100">
              <span className="material-symbols-outlined">download</span>
              Download
            </button>
          </div>

          {/* Upload Section */}
          <div className="md:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
             <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">upload_file</span>
              Pilih File Excel
            </h3>
            
            <div
              id="dropZone"
              className="border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all group"
            >
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white group-hover:text-blue-600 transition-all">
                <span className="material-symbols-outlined text-4xl">cloud_upload</span>
              </div>
              <p className="text-slate-600 font-bold mb-1">Drag & drop file di sini</p>
              <p className="text-xs text-slate-400 font-medium mb-4">Atau klik untuk menelusuri file</p>
              <div className="inline-block px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-lg">Format: .xlsx (Maks 5MB)</div>
              <input type="file" id="fileInput" accept=".xlsx,.xls" className="hidden" />
            </div>

            {/* Selected File Area */}
            <div id="selectedFile" className="hidden mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                <span className="material-symbols-outlined">description</span>
              </div>
              <div className="flex-1 min-w-0">
                <p id="fileName" className="text-sm font-bold text-slate-800 truncate"></p>
                <p id="fileSize" className="text-[10px] font-bold text-blue-600/60"></p>
              </div>
              <button id="removeFile" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <button
              id="uploadBtn"
              disabled
              className="mt-8 w-full py-5 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-100"
            >
              <span className="material-symbols-outlined">publish</span>
              <span id="uploadBtnText">Mulai Proses Import</span>
              <div id="uploadSpinner" className="hidden w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            </button>
          </div>
        </div>

        {/* Results Card */}
        <div id="resultsSection" className="hidden bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Hasil Import Terakhir</h3>
            <span id="resultBadge" className="px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border"></span>
          </div>

          <div className="p-10">
            <div className="grid grid-cols-3 gap-8 mb-10">
              <div className="text-center p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                <p className="text-3xl font-extrabold text-emerald-600" id="resultSuccess">0</p>
                <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest mt-2">Berhasil</p>
              </div>
              <div className="text-center p-6 bg-red-50 rounded-3xl border border-red-100">
                <p className="text-3xl font-extrabold text-red-600" id="resultFailed">0</p>
                <p className="text-[10px] font-bold text-red-600/60 uppercase tracking-widest mt-2">Gagal</p>
              </div>
              <div className="text-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-3xl font-extrabold text-slate-800" id="resultTotal">0</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Total Data</p>
              </div>
            </div>

            <div id="errorDetails" className="hidden border border-red-100 rounded-3xl overflow-hidden">
              <div className="px-6 py-4 bg-red-50/50 border-b border-red-100">
                <h4 className="text-xs font-bold text-red-600 uppercase tracking-widest">Detail Kesalahan (Error)</h4>
              </div>
              <div id="errorList" className="max-h-80 overflow-y-auto divide-y divide-red-50"></div>
            </div>
          </div>
        </div>
      </div>

      <script src="/js/admin/import.js"></script>
    </AdminLayout>
  );
};
