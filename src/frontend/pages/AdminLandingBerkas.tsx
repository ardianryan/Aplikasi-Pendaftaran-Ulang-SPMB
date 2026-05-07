/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';
import { AdminLayout } from '../layouts/AdminLayout';

export const AdminLandingBerkas = (props: any) => {
  return (
    <AdminLayout title="Berkas Wajib" subtitle="Kelola daftar dokumen yang harus diupload siswa" {...props} path="/admin/landing/berkas">
      <div className="space-y-8">
        
        {/* Berkas List */}
        <div id="berkas-list" className="grid grid-cols-1 gap-4">
          {/* Items injected here */}
        </div>

        {/* Add Button */}
        <div className="flex justify-center py-6">
          <button onclick="addItem()" className="group flex items-center gap-3 px-8 py-4 bg-white border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:border-amber-400 hover:text-amber-600 transition-all">
            <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add_circle</span>
            <span className="font-bold">Tambah Berkas</span>
          </button>
        </div>

        {/* Save Bar */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-50">
          <div className="bg-slate-900 rounded-[2.5rem] p-4 flex items-center justify-between shadow-2xl">
            <div className="pl-4">
               <p className="text-white font-bold text-sm" id="item-count">0 Berkas</p>
               <p className="text-slate-400 text-[10px] uppercase tracking-widest font-medium">Dokumen Persyaratan</p>
            </div>
            <button id="btn-save" onclick="saveBerkas()" className="px-8 py-3.5 bg-amber-500 text-white rounded-full font-bold text-sm hover:bg-amber-600 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20">
              <span className="material-symbols-outlined">save</span>
              <span className="btn-label">Simpan Berkas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Item Template */}
      <template id="berkas-item-template">
        <div className="berkas-item bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 overflow-hidden group">
          <div className="flex flex-col md:flex-row">
            {/* Left Column: Icon & Visual */}
            <div className="w-full md:w-32 bg-slate-50 flex flex-col items-center justify-center p-6 gap-4 border-r border-slate-100">
              <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center text-slate-400 item-icon-preview border border-slate-100 transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-3xl">description</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="item-active sr-only peer" />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Aktif</span>
              </div>
            </div>

            {/* Middle Column: Primary Info */}
            <div className="flex-1 p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <input type="text" className="item-title w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-2xl text-slate-800 placeholder:text-slate-200" placeholder="Nama Dokumen" />
                  <input type="text" className="item-desc w-full bg-transparent border-none p-0 focus:ring-0 text-slate-400 text-sm placeholder:text-slate-200 mt-1" placeholder="Berikan keterangan singkat untuk siswa..." />
                </div>
                <div className="flex items-center gap-4 px-4 py-2 bg-amber-50 rounded-2xl border border-amber-100">
                   <span className="material-symbols-outlined text-amber-500 text-xl">error</span>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest leading-none">Wajib diupload?</span>
                      <label className="flex items-center gap-2 cursor-pointer mt-1">
                        <input type="checkbox" className="item-required sr-only peer" />
                        <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
                        <span className="text-[9px] font-bold text-amber-600 uppercase">Ya, Wajib</span>
                      </label>
                   </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Jalur Pendaftaran Yang Memerlukan</label>
                <div className="path-recommendations flex flex-wrap gap-2"></div>
                <input type="hidden" className="item-jalur" />
                <p className="text-[9px] text-slate-300 italic">* Pilih satu atau lebih jalur di atas</p>
              </div>
            </div>

            {/* Right Column: Technical & Actions */}
            <div className="w-full md:w-56 bg-slate-50/50 p-6 flex flex-col justify-between border-l border-slate-100">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Key Ikon</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className="item-icon w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none font-mono text-[10px] focus:border-sky-500 transition-all" 
                      placeholder="description" 
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
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Internal ID</label>
                  <input type="text" className="item-id w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none font-mono text-[10px] focus:border-slate-400 transition-all" placeholder="doc_unique_id" />
                </div>
              </div>

              <button onclick="removeItem(this)" className="w-full py-3 mt-4 bg-white text-slate-300 rounded-xl flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100 group/del">
                <span className="material-symbols-outlined text-lg">delete</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">Hapus Berkas</span>
              </button>
            </div>
          </div>
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
          'sports_soccer', 'palette', 'psychology', 'biotech', 'balance', 'public', 'language',
          'article', 'attachment', 'badge', 'picture_as_pdf', 'image'
        ];
        let masterPaths = [];

        async function loadBerkas() {
          try {
            const res = await API.request('/admin/settings');
            masterPaths = res.data.admission_paths?.value || [];
            const data = res.data.landing_berkas_json?.value || [];
            const container = document.getElementById('berkas-list');
            container.innerHTML = '';
            data.forEach(item => {
              const clone = createItem(item);
              container.appendChild(clone);
            });
            updateCount();
          } catch (e) { console.error(e); }
        }

        function createItem(data = {}) {
          const template = document.getElementById('berkas-item-template');
          const clone = template.content.cloneNode(true);
          const root = clone.querySelector('.berkas-item');
          
          root.querySelector('.item-id').value = data.id || ('doc_' + Date.now());
          root.querySelector('.item-title').value = data.title || '';
          root.querySelector('.item-desc').value = data.desc || '';
          root.querySelector('.item-icon').value = data.icon || 'description';
          root.querySelector('.item-required').checked = data.required !== false;
          root.querySelector('.item-active').checked = data.active !== false;
          
          const jalurValue = Array.isArray(data.jalur) ? data.jalur.join(', ') : (data.jalur || 'all');
          const jalurInput = root.querySelector('.item-jalur');
          jalurInput.value = jalurValue;
          
          // Populate recommendations with toggle style
          const recContainer = root.querySelector('.path-recommendations');
          const options = ['all', ...masterPaths.filter(p => p.active).map(p => p.name)];
          
          options.forEach(opt => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'px-4 py-2 rounded-xl text-[10px] font-bold transition-all border flex items-center gap-2';
            updateChipStyle(chip, opt, jalurValue);
            
            chip.onclick = () => {
              togglePathSelection(jalurInput, opt);
              // Update all chips in this container
              recContainer.querySelectorAll('button').forEach(c => {
                updateChipStyle(c, c.dataset.path, jalurInput.value);
              });
            };
            chip.dataset.path = opt;
            recContainer.appendChild(chip);
          });

          root.querySelector('.item-icon-preview .material-symbols-outlined').textContent = data.icon || 'description';
          
          return clone;
        }

        function updateChipStyle(chip, path, currentVal) {
          const current = currentVal.split(',').map(s => s.trim()).filter(s => s);
          const isActive = current.includes(path);
          
          if (isActive) {
            chip.className = 'px-4 py-2 rounded-xl text-[10px] font-bold transition-all border border-sky-500 bg-sky-500 text-white shadow-lg shadow-sky-100 flex items-center gap-2';
            chip.innerHTML = \`<span class="material-symbols-outlined text-[14px]">check_circle</span> \${path}\`;
          } else {
            chip.className = 'px-4 py-2 rounded-xl text-[10px] font-bold transition-all border border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-300 flex items-center gap-2';
            chip.innerHTML = \`<span class="material-symbols-outlined text-[14px]">circle</span> \${path}\`;
          }
        }

        function togglePathSelection(input, path) {
          let current = input.value.split(',').map(s => s.trim()).filter(s => s);
          if (path === 'all') {
             current = ['all'];
          } else {
             current = current.filter(s => s !== 'all');
             if (current.includes(path)) {
               current = current.filter(s => s !== path);
             } else {
               current.push(path);
             }
             if (current.length === 0) current = ['all'];
          }
          input.value = current.join(', ');
        }

        function addItem() {
          const container = document.getElementById('berkas-list');
          container.insertBefore(createItem(), container.firstChild);
          updateCount();
        }

        async function removeItem(btn) {
          const ok = await UI.confirm('Hapus Berkas?', 'Data ini tidak dapat dikembalikan setelah dihapus.');
          if (ok) {
            btn.closest('.berkas-item').remove();
            updateCount();
            UI.toast('Berkas berhasil dihapus', 'info');
          }
        }

        function handleIconInput(input) {
          updateIcon(input);
          showSuggestions(input);
        }

        function updateIcon(input) {
          const preview = input.closest('.berkas-item').querySelector('.item-icon-preview .material-symbols-outlined');
          preview.textContent = input.value || 'description';
        }

        function showSuggestions(input) {
          const container = input.parentElement.querySelector('.suggestions-list');
          if (!container) return;
          
          const grid = container.querySelector('.icons-grid');
          if (!grid) return;
          
          const query = input.value.toLowerCase();
          const filtered = COMMON_ICONS.filter(item => item.toLowerCase().includes(query));
          
          if (filtered.length === 0) {
            grid.innerHTML = '<p class="col-span-4 text-center py-4 text-[10px] text-slate-300">Tidak ada ikon</p>';
          } else {
            grid.innerHTML = '';
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
          const count = document.querySelectorAll('.berkas-item').length;
          document.getElementById('item-count').textContent = count + ' Berkas';
        }

        async function saveBerkas() {
          const btn = document.getElementById('btn-save');
          const originalText = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<span class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Menyimpan...';
          
          try {
            const newItems = [];
            document.querySelectorAll('.berkas-item').forEach(el => {
              const jalurs = el.querySelector('.item-jalur').value.split(',').map(s => s.trim()).filter(s => s);
              newItems.push({
                id: el.querySelector('.item-id').value,
                title: el.querySelector('.item-title').value,
                desc: el.querySelector('.item-desc').value,
                icon: el.querySelector('.item-icon').value,
                required: el.querySelector('.item-required').checked,
                active: el.querySelector('.item-active').checked,
                jalur: jalurs.includes('all') ? 'all' : jalurs
              });
            });

            await API.request('/admin/settings', { 
              method: 'PUT', 
              body: JSON.stringify({ landing_berkas_json: newItems }) 
            });
            
            UI.success('Berhasil!', 'Seluruh daftar berkas wajib telah diperbarui.');
          } catch (e) {
            UI.error('Gagal Menyimpan', e.message);
          } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
          }
        }

        loadBerkas();
      ` }} />
    </AdminLayout>
  );
};
