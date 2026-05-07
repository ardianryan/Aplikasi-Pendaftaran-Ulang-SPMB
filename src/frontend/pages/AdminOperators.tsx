/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';
import { AdminLayout } from '../layouts/AdminLayout';

export const AdminOperators = (props: any) => {
  return (
    <AdminLayout title="Manajemen Operator" subtitle="Kelola akun guru/tendik yang dapat mengakses panel admin" {...props} path="/admin/operators">
      <div className="space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Local Operator Form */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined">person_add</span>
                </div>
                <h3 className="font-bold text-slate-800">Tambah Operator Lokal</h3>
              </div>
              <button onclick="pullSSO()" id="btn-pull" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-blue-700 transition-all">
                <span className="material-symbols-outlined text-sm">sync</span>
                <span id="btn-pull-text">Tarik Data SSO</span>
              </button>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nama Lengkap</label>
                  <input type="text" id="local-nama" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Username</label>
                  <input type="text" id="local-username" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-medium lowercase" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
                  <input type="password" id="local-password" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Role</label>
                  <select id="local-role" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-medium">
                    <option value="operator">Operator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <button onclick="createLocalOperator()" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">add</span>
                Tambahkan Operator
              </button>
            </div>
          </div>

          {/* Referral Code Panel */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">vpn_key</span>
                Kode Referral
              </h3>
            </div>
            <div className="p-8 space-y-6 flex-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Prefix Kode</label>
                <input type="text" id="new-prefix" placeholder="Contoh: OPS" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold uppercase tracking-widest text-center" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Slot</label>
                  <input type="number" id="new-maxslots" value="99" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-center font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Label</label>
                  <input type="text" id="new-label" placeholder="Batch..." className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-medium" />
                </div>
              </div>
              <button onclick="createReferral()" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                Buat Kode
              </button>
            </div>
          </div>
        </div>

        {/* Operators Table */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Daftar Akun Operator</h3>
            <div id="pull-result" className="hidden text-[10px] font-bold text-emerald-600 uppercase tracking-widest"></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500">
                  <th className="px-8 py-4 font-bold text-[10px] uppercase tracking-widest">Operator</th>
                  <th className="px-8 py-4 font-bold text-[10px] uppercase tracking-widest">Kontak / NIP</th>
                  <th className="px-8 py-4 font-bold text-[10px] uppercase tracking-widest">Role</th>
                  <th className="px-8 py-4 font-bold text-[10px] uppercase tracking-widest">Status</th>
                  <th className="px-8 py-4 font-bold text-[10px] uppercase tracking-widest">Aksi</th>
                </tr>
              </thead>
              <tbody id="operatorsTable">
                <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-400">Memuat data operator...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Referral List */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100">
             <h3 className="font-bold text-slate-800">Daftar Kode Referral</h3>
          </div>
          <div id="referralList" className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             <div className="col-span-full py-10 text-center text-slate-400">Memuat data referral...</div>
          </div>
        </div>
      </div>

      <script src="/js/admin/operators-logic.js"></script>
    </AdminLayout>
  );
};
