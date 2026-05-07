/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';
import { AdminLayout } from '../layouts/AdminLayout';

export const AdminLandingHeader = (props: any) => {
  return (
    <AdminLayout title="Header Hero" subtitle="Kelola judul dan sub-judul halaman depan" {...props} path="/admin/landing/header">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm">
            <span className="material-symbols-outlined text-3xl">branding_watermark</span>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-xl">Hero Section</h3>
            <p className="text-sm text-slate-400 font-medium">Teks utama yang muncul pertama kali di website</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Hero Title (Judul Utama)</label>
            <input 
              type="text" id="landing_hero_title" 
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 outline-none transition-all font-extrabold text-lg" 
              placeholder="Contoh: Registrasi Ulang"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Hero Title Accent (Judul Gradasi)</label>
            <input 
              type="text" id="landing_hero_title_accent" 
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 outline-none transition-all font-extrabold text-lg text-blue-600" 
              placeholder="Contoh: SPMB 2025"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Hero Subtitle (Deskripsi)</label>
            <textarea 
              id="landing_hero_subtitle" rows={4} 
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium text-sm leading-relaxed"
              placeholder="Tuliskan deskripsi singkat untuk menyambut calon siswa..."
            ></textarea>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button id="btn-save" onclick="saveLandingHeader()" className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all flex items-center gap-3 shadow-xl shadow-slate-200">
              <span className="material-symbols-outlined">save</span>
              <span id="btn-save-text">Simpan Perubahan</span>
            </button>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        async function loadHeader() {
          try {
            const res = await API.request('/admin/settings');
            const settings = res.data;
            document.getElementById('landing_hero_title').value = settings.landing_hero_title?.value || '';
            document.getElementById('landing_hero_title_accent').value = settings.landing_hero_title_accent?.value || '';
            document.getElementById('landing_hero_subtitle').value = settings.landing_hero_subtitle?.value || '';
          } catch (e) {
            console.error(e);
          }
        }

        async function saveLandingHeader() {
          const btn = document.getElementById('btn-save');
          const btnText = document.getElementById('btn-save-text');
          btn.disabled = true;
          btnText.textContent = 'Menyimpan...';

          try {
            const data = {
              landing_hero_title: document.getElementById('landing_hero_title').value,
              landing_hero_title_accent: document.getElementById('landing_hero_title_accent').value,
              landing_hero_subtitle: document.getElementById('landing_hero_subtitle').value
            };
            await API.request('/admin/settings', { method: 'PUT', body: JSON.stringify(data) });
            UI.toast('Pengaturan header berhasil disimpan!', 'success');
          } catch (e) {
            UI.toast('Gagal menyimpan: ' + e.message, 'error');
          } finally {
            btn.disabled = false;
            btnText.textContent = 'Simpan Perubahan';
          }
        }

        loadHeader();
      ` }} />
    </AdminLayout>
  );
};
