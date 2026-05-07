/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';
import { AdminLayout } from '../layouts/AdminLayout';

export const AdminLandingJadwal = (props: any) => {
  return (
    <AdminLayout title="Linimasa Jadwal" subtitle="Kelola jadwal kegiatan yang ditampilkan di Landing Page" {...props} path="/admin/landing/jadwal">
      <div className="space-y-8">
        
        {/* Timeline List */}
        <div id="timeline-list" className="space-y-6">
          {/* Items injected here */}
        </div>

        {/* Add Button */}
        <div className="flex justify-center py-6">
          <button onclick="addItem()" className="group flex items-center gap-3 px-8 py-4 bg-white border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:border-sky-400 hover:text-sky-600 transition-all">
            <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add_circle</span>
            <span className="font-bold">Tambah Jadwal Baru</span>
          </button>
        </div>

        {/* Save Bar */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-50">
          <div className="bg-white rounded-[2.5rem] p-4 flex items-center justify-between shadow-2xl border border-slate-100">
            <div className="pl-4">
               <p className="text-slate-900 font-bold text-sm" id="item-count">0 Tahapan</p>
               <p className="text-slate-400 text-[10px] uppercase tracking-widest font-medium">Jadwal Pelaksanaan</p>
            </div>
            <button id="btn-save" onclick="saveTimeline()" className="px-8 py-3.5 bg-sky-600 text-white rounded-full font-bold text-sm hover:bg-sky-700 transition-all flex items-center gap-2 shadow-lg shadow-sky-200">
              <span className="material-symbols-outlined">save</span>
              Simpan Jadwal
            </button>
          </div>
        </div>
      </div>

      {/* Item Template */}
      <template id="timeline-item-template">
        <div className="timeline-item bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 relative group flex gap-6">
          <div className="flex flex-col items-center gap-2 pt-2">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 item-icon-preview">
              <span className="material-symbols-outlined">event</span>
            </div>
            <div className="w-0.5 h-full bg-slate-100 rounded-full"></div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rentang Tanggal</label>
                <input type="text" className="item-date w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white outline-none font-bold text-sky-600" placeholder="12 - 16 Juni 2024" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ikon & Highlight</label>
                <div className="flex gap-2 relative">
                  <input 
                    type="text" 
                    className="item-icon flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none font-mono text-[10px] focus:border-sky-500" 
                    placeholder="campaign" 
                    oninput="handleIconInput(this)"
                    onfocus="showSuggestions(this)"
                    onblur="setTimeout(() => hideSuggestions(this), 200)"
                  />
                  <div className="suggestions-list absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-100 shadow-2xl z-[60] hidden max-h-48 overflow-y-auto p-2">
                    <div className="grid grid-cols-4 gap-1 icons-grid"></div>
                    <div className="mt-2 p-2 border-t border-slate-50">
                      <a href="https://fonts.google.com/icons?icon.set=Material+Symbols" target="_blank" className="flex items-center justify-center gap-2 py-2 bg-slate-50 rounded-xl text-[9px] font-bold text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                        LIHAT SEMUA IKON GOOGLE
                      </a>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 px-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-amber-50 transition-colors">
                    <input type="checkbox" className="item-highlight sr-only peer" />
                    <span className="material-symbols-outlined text-slate-300 peer-checked:text-amber-500 peer-checked:fill-1">star</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nama Kegiatan</label>
                <input type="text" className="item-title w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white outline-none font-bold text-slate-800" placeholder="Contoh: Verifikasi Berkas" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Keterangan Singkat</label>
                <input type="text" className="item-desc w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white outline-none text-sm text-slate-500" placeholder="Penjelasan singkat kegiatan..." />
              </div>
            </div>
          </div>

          <button onclick="removeItem(this)" className="self-start w-10 h-10 bg-slate-50 text-slate-300 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all">
            <span className="material-symbols-outlined text-xl">delete</span>
          </button>
        </div>
      </template>

      <script dangerouslySetInnerHTML={{ __html: `
        const COMMON_ICONS = [
          'school', 'verified', 'star', 'rocket_launch', 'share_location', 'emoji_events', 'handshake', 
          'group', 'person', 'history_edu', 'military_tech', 'campaign', 'contact_page', 'note_add',
          'description', 'folder_open', 'assignment', 'account_balance', 'diversity_3', 'workspace_premium',
          'calendar_month', 'task_alt', 'how_to_reg', 'menu_book', 'auto_stories', 'edit_note', 'quiz',
          'fact_check', 'rule', 'mail', 'notifications', 'record_voice_over', 'groups_3', 'event',
          'schedule', 'history', 'apartment', 'location_on', 'travel_explore', 'devices', 'computer',
          'settings', 'cloud_upload', 'shield', 'lock', 'home', 'info', 'help', 'add_circle',
          'check_circle', 'cancel', 'warning', 'diamond', 'volunteer_activism', 'medical_services',
          'sports_soccer', 'palette', 'psychology', 'biotech', 'balance', 'public', 'language'
        ];
        let masterPaths = [];

        async function loadTimeline() {
          try {
            const res = await API.request('/admin/settings');
            masterPaths = res.data.admission_paths?.value || [];
            const data = res.data.landing_timeline_json?.value || [];
            const container = document.getElementById('timeline-list');
            container.innerHTML = '';
            
            // If empty, add default active paths as suggestions
            if (data.length === 0) {
              masterPaths.filter(p => p.active).forEach(path => {
                const clone = createItem({ title: path.name, icon: 'calendar_month' });
                container.appendChild(clone);
              });
            } else {
              data.forEach(item => {
                const clone = createItem(item);
                container.appendChild(clone);
              });
            }
            updateCount();
          } catch (e) { console.error(e); }
        }

        function createItem(data = {}) {
          const template = document.getElementById('timeline-item-template');
          const clone = template.content.cloneNode(true);
          const root = clone.querySelector('.timeline-item');
          
          root.querySelector('.item-date').value = data.date || '';
          
          const titleInput = root.querySelector('.item-title');
          titleInput.value = data.title || '';
          titleInput.onfocus = () => showTitleSuggestions(titleInput);
          titleInput.onblur = () => setTimeout(() => hideTitleSuggestions(titleInput), 200);

          root.querySelector('.item-desc').value = data.desc || '';
          root.querySelector('.item-icon').value = data.icon || 'event';
          root.querySelector('.item-icon-preview .material-symbols-outlined').textContent = data.icon || 'event';
          root.querySelector('.item-highlight').checked = data.highlight === true;
          
          // Add suggestions list container for title if not exists
          const titleWrap = titleInput.parentElement;
          const suggList = document.createElement('div');
          suggList.className = 'title-suggestions-list absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-100 shadow-2xl z-[60] hidden p-2 flex flex-col gap-1';
          titleWrap.classList.add('relative');
          titleWrap.appendChild(suggList);

          return clone;
        }

        function showTitleSuggestions(input) {
          const container = input.parentElement.querySelector('.title-suggestions-list');
          if (!container) return;
          
          const activePaths = masterPaths.filter(p => p.active).map(p => p.name);
          const commons = ['Pendaftaran Online', 'Verifikasi Berkas', 'Pengumuman Seleksi', 'Daftar Ulang', 'Masa Sanggah'];
          const combined = [...activePaths, ...commons];
          const query = input.value.toLowerCase();
          const filtered = combined.filter(item => item.toLowerCase().includes(query));

          if (filtered.length === 0) {
            container.classList.add('hidden');
            return;
          }

          container.innerHTML = '<p class="px-3 py-1 text-[8px] font-bold text-slate-300 uppercase tracking-widest">Saran Nama Kegiatan</p>';
          filtered.forEach(item => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'px-4 py-2 text-left text-sm font-bold text-slate-600 hover:bg-sky-50 hover:text-sky-600 rounded-xl transition-all';
            btn.textContent = item;
            btn.onclick = () => {
              input.value = item;
              container.classList.add('hidden');
            };
            container.appendChild(btn);
          });
          container.classList.remove('hidden');
        }

        function hideTitleSuggestions(input) {
          const container = input.parentElement.querySelector('.title-suggestions-list');
          if (container) container.classList.add('hidden');
        }

        function addItem() {
          document.getElementById('timeline-list').appendChild(createItem());
          updateCount();
        }

        async function removeItem(btn) {
          if(await UI.confirm('Hapus Tahapan?', 'Jadwal ini akan dihapus dari linimasa.')) {
            btn.closest('.timeline-item').remove();
            updateCount();
            UI.toast('Jadwal dihapus', 'info');
          }
        }

        function handleIconInput(input) {
          updateIcon(input);
          showSuggestions(input);
        }

        function updateIcon(input) {
          const preview = input.closest('.timeline-item').querySelector('.item-icon-preview .material-symbols-outlined');
          preview.textContent = input.value || 'event';
        }

        function showSuggestions(input) {
          const container = input.parentElement.querySelector('.suggestions-list');
          if (!container) return;
          
          const grid = container.querySelector('.icons-grid');
          if (!grid) return;
          
          const query = input.value.toLowerCase();
          const filtered = COMMON_ICONS.filter(item => item.toLowerCase().includes(query));
          
          grid.innerHTML = '';
          if (filtered.length === 0) {
            grid.innerHTML = '<p class="col-span-4 text-center py-4 text-[10px] text-slate-300">Tidak ada ikon</p>';
          } else {
            filtered.forEach(item => {
              const btn = document.createElement('button');
              btn.type = 'button';
              btn.className = 'flex flex-col items-center p-2 rounded-xl hover:bg-sky-50 text-slate-500 hover:text-sky-600 transition-all';
              btn.innerHTML = \`<span class="material-symbols-outlined text-xl">\${item}</span><span class="text-[8px] mt-1 font-mono">\${item}</span>\`;
              btn.onclick = () => {
                input.value = item;
                updateIcon(input);
                hideSuggestions(input);
              };
              grid.appendChild(btn);
            });
          }

          container.classList.remove('hidden');
        }

        function hideSuggestions(input) {
          const container = input.parentElement.querySelector('.suggestions-list');
          if (container) container.classList.add('hidden');
        }

        function updateCount() {
          const count = document.querySelectorAll('.timeline-item').length;
          document.getElementById('item-count').textContent = count + ' Tahapan';
        }

        async function saveTimeline() {
          const btn = document.getElementById('btn-save');
          const originalText = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<span class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Menyimpan...';
          
          try {
            const newItems = [];
            document.querySelectorAll('.timeline-item').forEach(el => {
              newItems.push({
                date: el.querySelector('.item-date').value,
                title: el.querySelector('.item-title').value,
                desc: el.querySelector('.item-desc').value,
                icon: el.querySelector('.item-icon').value,
                highlight: el.querySelector('.item-highlight').checked
              });
            });

            await API.request('/admin/settings', { 
              method: 'PUT', 
              body: JSON.stringify({ landing_timeline_json: newItems }) 
            });
            
            UI.success('Berhasil!', 'Linimasa jadwal pendaftaran telah diperbarui.');
          } catch (e) {
            UI.error('Gagal Menyimpan', e.message);
          } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
          }
        }

        loadTimeline();
      ` }} />
    </AdminLayout>
  );
};
