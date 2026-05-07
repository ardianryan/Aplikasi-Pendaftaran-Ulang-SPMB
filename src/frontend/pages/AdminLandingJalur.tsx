/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';
import { AdminLayout } from '../layouts/AdminLayout';

export const AdminLandingJalur = (props: any) => {
  return (
    <AdminLayout title="Daftar Jalur" subtitle="Kelola daftar jalur pendaftaran yang ditampilkan di Landing Page" {...props} path="/admin/landing/jalur">
      <div className="space-y-8">
        
        {/* Dynamic List Container */}
        <div id="jalur-list-container" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Items will be injected here */}
        </div>

        {/* Add Button */}
        <div className="flex justify-center py-6">
          <button onclick="addItem()" className="group flex items-center gap-3 px-8 py-4 bg-white border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-all">
            <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add_circle</span>
            <span className="font-bold">Tambah Jalur Baru</span>
          </button>
        </div>

        {/* Action Bar */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-50">
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-[2.5rem] p-4 flex items-center justify-between shadow-2xl border border-white/10">
            <div className="pl-4">
               <p className="text-white font-bold text-sm" id="item-count">0 Jalur Terdaftar</p>
               <p className="text-slate-400 text-[10px] uppercase tracking-widest font-medium">Draft Perubahan</p>
            </div>
            <button id="btn-save" onclick="saveJalur()" className="px-8 py-3.5 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20">
              <span className="material-symbols-outlined">save</span>
              Simpan Perubahan
            </button>
          </div>
        </div>
      </div>

      {/* Item Template (Hidden) */}
      <template id="jalur-item-template">
        <div className="jalur-item bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 relative group">
          <button onclick="removeItem(this)" className="absolute -top-3 -right-3 w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-red-100 shadow-sm hover:bg-red-500 hover:text-white">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Jalur</label>
                <input type="text" className="item-title w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white outline-none font-bold" placeholder="Contoh: Zonasi" />
              </div>
              <div className="w-24 relative">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Badge</label>
                <input type="text" className="item-badge w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none font-bold text-center text-[10px] uppercase" placeholder="HOT" />
                <div className="suggestions-list absolute left-0 right-0 top-full mt-2 bg-white rounded-xl border border-slate-100 shadow-2xl z-[60] hidden overflow-hidden p-1"></div>
              </div>
            </div>

            <div className="flex gap-4 items-end">
              <div className="flex-1 relative">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Ikon (Material Symbol)</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl item-icon-preview">share_location</span>
                  <input 
                    type="text" 
                    className="item-icon w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none font-mono text-xs" 
                    placeholder="share_location" 
                  />
                  <div className="suggestions-list absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-100 shadow-2xl z-[60] hidden max-h-48 overflow-y-auto p-2">
                    <div className="grid grid-cols-4 gap-1 icons-grid"></div>
                    <div className="mt-2 p-2 border-t border-slate-50 suggestions-footer hidden">
                      <a href="https://fonts.google.com/icons?icon.set=Material+Symbols" target="_blank" className="flex items-center justify-center gap-2 py-2 bg-slate-50 rounded-xl text-[9px] font-bold text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                        LIHAT SEMUA IKON GOOGLE
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Deskripsi Singkat</label>
              <textarea className="item-desc w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white outline-none text-sm font-medium h-24" placeholder="Jelaskan syarat singkat jalur ini..."></textarea>
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
          'sports_soccer', 'palette', 'psychology', 'biotech', 'balance', 'public', 'language'
        ];
        const COMMON_BADGES = ['HOT', 'BARU', 'UNGGULAN', 'FAVORIT', 'KHUSUS', 'LIMIT'];

        async function loadData() {
          try {
            const res = await API.request('/admin/settings');
            const masterPaths = res.data.admission_paths?.value || [];
            let landingJalur = res.data.landing_jalur_json?.value || [];

            // Seed from active master paths if landing list is empty
            if (landingJalur.length === 0) {
              landingJalur = masterPaths
                .filter(p => p.active)
                .map(p => ({ title: p.name, badge: '', icon: 'share_location', desc: '' }));
            }

            landingJalur.forEach(item => addCardToDOM(item));
            updateCount();
          } catch (e) { console.error(e); }
        }

        function addCardToDOM(data) {
          data = data || {};
          const template = document.getElementById('jalur-item-template');
          const clone = template.content.cloneNode(true);
          const root = clone.querySelector('.jalur-item');

          root.querySelector('.item-title').value = data.title || '';
          
          const badgeInput = root.querySelector('.item-badge');
          badgeInput.value = data.badge || '';
          badgeInput.addEventListener('focus', () => showSuggestions(badgeInput, 'badges'));
          badgeInput.addEventListener('blur', () => setTimeout(() => hideSuggestions(badgeInput), 200));

          const iconInput = root.querySelector('.item-icon');
          iconInput.value = data.icon || 'share_location';
          root.querySelector('.item-icon-preview').textContent = data.icon || 'share_location';
          iconInput.addEventListener('input', () => {
            root.querySelector('.item-icon-preview').textContent = iconInput.value || 'help';
            showSuggestions(iconInput, 'icons');
          });
          iconInput.addEventListener('focus', () => showSuggestions(iconInput, 'icons'));
          iconInput.addEventListener('blur', () => setTimeout(() => hideSuggestions(iconInput), 200));

          root.querySelector('.item-desc').value = data.desc || '';

          document.getElementById('jalur-list-container').appendChild(clone);
        }

        function addItem() {
          addCardToDOM({ title: '', badge: '', icon: 'share_location', desc: '' });
          updateCount();
        }

        function removeItem(btn) {
          btn.closest('.jalur-item').remove();
          updateCount();
        }

        function showSuggestions(input, type) {
          const wrapper = input.closest('.relative') || input.parentElement;
          const container = wrapper.querySelector('.suggestions-list');
          if (!container) return;
          
          const grid = container.querySelector('.icons-grid') || container;
          const footer = container.querySelector('.suggestions-footer');
          
          const query = input.value.toLowerCase();
          const list = type === 'icons' ? COMMON_ICONS : COMMON_BADGES;
          const filtered = list.filter(i => i.toLowerCase().includes(query));
          
          if (filtered.length === 0 && type === 'badges') {
            container.classList.add('hidden');
            return;
          }

          grid.innerHTML = '';
          if (filtered.length === 0) {
            grid.innerHTML = '<p class="col-span-4 text-center py-4 text-[10px] text-slate-300">Tidak ada ikon</p>';
          } else {
            filtered.forEach(item => {
              const btn = document.createElement('button');
              btn.type = 'button';
              btn.className = type === 'icons' 
                ? 'flex flex-col items-center p-2 rounded-xl hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-all'
                : 'px-3 py-2 rounded-lg hover:bg-blue-50 text-xs font-bold text-slate-600 hover:text-blue-600 transition-all text-left w-full';
              
              if (type === 'icons') {
                btn.innerHTML = '<span class="material-symbols-outlined text-xl">' + item + '</span><span class="text-[8px] mt-1 font-mono">' + item + '</span>';
              } else {
                btn.textContent = item;
              }
              
              btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                input.value = item;
                if (type === 'icons') {
                  const preview = input.closest('.relative').querySelector('.item-icon-preview');
                  if (preview) preview.textContent = item;
                }
                hideSuggestions(input);
              });
              grid.appendChild(btn);
            });
          }

          container.classList.remove('hidden');
          if (type === 'badges') {
            grid.classList.remove('grid', 'grid-cols-4');
            grid.classList.add('flex', 'flex-col');
            if (footer) footer.classList.add('hidden');
          } else {
            grid.classList.add('grid', 'grid-cols-4');
            grid.classList.remove('flex', 'flex-col');
            if (footer) footer.classList.remove('hidden');
          }
        }

        function hideSuggestions(input) {
          const wrapper = input.closest('.relative') || input.parentElement;
          const container = wrapper.querySelector('.suggestions-list');
          if (container) container.classList.add('hidden');
        }

        function updateCount() {
          const count = document.querySelectorAll('.jalur-item').length;
          document.getElementById('item-count').textContent = count + ' Jalur Ditampilkan';
        }

        async function saveJalur() {
          const btn = document.getElementById('btn-save');
          const originalHTML = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Menyimpan...';
          
          try {
            const newItems = [];
            document.querySelectorAll('.jalur-item').forEach(el => {
              const title = el.querySelector('.item-title').value.trim();
              if (!title) return;
              newItems.push({
                title,
                badge: el.querySelector('.item-badge').value,
                icon: el.querySelector('.item-icon').value || 'share_location',
                desc: el.querySelector('.item-desc').value
              });
            });

            await API.request('/admin/settings', { 
              method: 'PUT', 
              body: JSON.stringify({ landing_jalur_json: newItems }) 
            });
            
            UI.success('Tersimpan!', 'Pengaturan tampilan jalur pendaftaran berhasil diperbarui.');
          } catch (e) {
            UI.error('Terjadi Kesalahan', e.message);
          } finally {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
          }
        }

        loadData();
      ` }} />
    </AdminLayout>
  );
};
