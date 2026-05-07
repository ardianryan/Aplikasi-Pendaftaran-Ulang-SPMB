/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';
import { AdminLayout } from '../layouts/AdminLayout';

export const AdminAdmissionPaths = (props: any) => {
  return (
    <AdminLayout title="Master Jalur" subtitle="Kelola master daftar jalur pendaftaran yang digunakan di seluruh sistem" {...props} path="/admin/admission-paths">
      <div className="max-w-4xl space-y-8">
        
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800">Daftar Jalur Aktif</h3>
              <p className="text-xs text-slate-400 font-medium">Nama jalur ini akan muncul di Landing Page, Pendaftaran, dan Import Data.</p>
            </div>
            <button onclick="addItem()" className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
              <span className="material-symbols-outlined text-lg">add</span>
              Tambah Jalur
            </button>
          </div>

          <div id="paths-list" className="p-8 space-y-4">
             {/* Dynamic items here */}
          </div>

          <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button id="btn-save" onclick="savePaths()" className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all flex items-center gap-3 shadow-xl shadow-slate-200">
              <span className="material-symbols-outlined">save</span>
              Simpan Master Jalur
            </button>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex gap-4">
          <span className="material-symbols-outlined text-amber-600">warning</span>
          <div className="text-sm text-amber-800 leading-relaxed">
            <p className="font-bold mb-1">Penting:</p>
            <p>Mengubah nama jalur yang sudah memiliki data siswa mungkin menyebabkan data siswa tersebut tidak muncul di filter tertentu. Pastikan nama jalur konsisten.</p>
          </div>
        </div>
      </div>

      {/* Item Template */}
      <template id="path-item-template">
        <div className="path-item flex items-center gap-4 group">
          <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-1 flex items-center gap-1 focus-within:bg-white focus-within:border-blue-200 transition-all">
            <input type="text" className="path-name flex-1 px-4 py-3 bg-transparent outline-none font-bold text-slate-700" placeholder="Nama Jalur (misal: Zonasi)" />
            <div className="flex items-center gap-2 px-4 border-l border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aktif</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="path-active sr-only peer" checked />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          <button onclick="removeItem(this)" className="w-12 h-12 flex items-center justify-center rounded-2xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
            <span className="material-symbols-outlined">delete</span>
          </button>
        </div>
      </template>

      <script dangerouslySetInnerHTML={{ __html: `
        let paths = [];

        async function loadPaths() {
          try {
            const res = await API.request('/admin/settings');
            paths = res.data.admission_paths?.value || [];
            renderPaths();
          } catch (e) { console.error(e); }
        }

        function renderPaths() {
          const container = document.getElementById('paths-list');
          container.innerHTML = '';
          
          if (paths.length === 0) {
            container.innerHTML = '<div class="py-10 text-center text-slate-400">Belum ada jalur pendaftaran. Klik "Tambah Jalur" untuk memulai.</div>';
            return;
          }

          paths.forEach(p => {
            const template = document.getElementById('path-item-template');
            const clone = template.content.cloneNode(true);
            const root = clone.querySelector('.path-item');
            root.querySelector('.path-name').value = p.name;
            root.querySelector('.path-active').checked = p.active;
            container.appendChild(clone);
          });
        }

        function addItem() {
          const container = document.getElementById('paths-list');
          if (paths.length === 0 && container.querySelector('.text-center')) {
             container.innerHTML = '';
          }
          const template = document.getElementById('path-item-template');
          const clone = template.content.cloneNode(true);
          container.appendChild(clone);
        }

        function removeItem(btn) {
          btn.closest('.path-item').remove();
          if (document.querySelectorAll('.path-item').length === 0) {
            document.getElementById('paths-list').innerHTML = '<div class="py-10 text-center text-slate-400">Belum ada jalur pendaftaran. Klik "Tambah Jalur" untuk memulai.</div>';
          }
        }

        async function savePaths() {
          const btn = document.getElementById('btn-save');
          const originalText = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<span class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Menyimpan...';

          try {
            const newPaths = [];
            document.querySelectorAll('.path-item').forEach(el => {
              const name = el.querySelector('.path-name').value.trim();
              const active = el.querySelector('.path-active').checked;
              if (name) newPaths.push({ name, active });
            });

            await API.request('/admin/settings', {
              method: 'PUT',
              body: JSON.stringify({ admission_paths: newPaths })
            });

            await UI.success('Berhasil!', 'Master daftar jalur pendaftaran telah diperbarui.');
            window.location.reload();
          } catch (e) {
            UI.error('Gagal Menyimpan', e.message);
          } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
          }
        }

        loadPaths();
      ` }} />
    </AdminLayout>
  );
};
