/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';
import { AdminLayout } from '../layouts/AdminLayout';

export const AdminVerify = (props: any) => {
  return (
    <AdminLayout title="Verifikasi" subtitle="Pilih siswa untuk memverifikasi data dan dokumen" {...props} path="/admin/verify">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 w-1 h-8 rounded-full"></div>
          <h2 className="text-xl font-bold text-slate-800">Antrean Verifikasi</h2>
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
              placeholder="Cari pendaftar..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all text-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="min-w-[200px]">
            <select id="filterStatus" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-600 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium">
              <option value="pending">Menunggu Verifikasi</option>
              <option value="submitted">Semua yang Submit</option>
              <option value="verified">Sudah Diverifikasi</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>

          {/* Jalur Filter */}
          <div className="min-w-[180px]">
            <select id="filterJalur" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-600 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium">
              <option value="">Semua Jalur</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500">
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">No</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">NISN & Nama</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Jalur</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Dokumen</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody id="tableBody">
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-400 font-medium">Memuat antrean verifikasi...</p>
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
            <div id="pageNumbers" className="flex items-center gap-1 text-sm font-bold text-slate-500"></div>
            <button id="nextPage" disabled className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-white hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        let currentPage = 1;
        const limit = 20;
        let totalPages = 1;
        let totalItems = 0;
        let searchTimeout = null;

        const searchInput = document.getElementById('searchInput');
        const filterStatus = document.getElementById('filterStatus');
        const filterJalur = document.getElementById('filterJalur');
        const tableBody = document.getElementById('tableBody');
        const paginationInfo = document.getElementById('paginationInfo');
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');
        const pageNumbers = document.getElementById('pageNumbers');

        searchInput.addEventListener('input', () => {
          clearTimeout(searchTimeout);
          searchTimeout = setTimeout(() => { currentPage = 1; loadData(); }, 400);
        });
        filterStatus.addEventListener('change', () => { currentPage = 1; loadData(); });
        filterJalur.addEventListener('change', () => { currentPage = 1; loadData(); });
        prevPage.addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadData(); } });
        nextPage.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; loadData(); } });

        API.populateJalurOptions('filterJalur');
        loadData();

        async function loadData() {
          const params = new URLSearchParams({
            page: currentPage,
            limit,
            status: filterStatus.value,
            sort: '-submittedAt',
          });
          const search = searchInput.value.trim();
          const jalur = filterJalur.value;
          if (search) params.set('search', search);
          if (jalur) params.set('jalur', jalur);

          try {
            const res = await API.request('/admin/students?' + params.toString());
            const students = Array.isArray(res.data) ? res.data : [];
            totalItems = res.meta?.total || 0;
            totalPages = res.meta?.totalPages || 1;
            renderTable(students);
            renderPagination();
          } catch (err) {
            tableBody.innerHTML = '<tr><td colSpan="6" class="px-6 py-20 text-center text-slate-400">Gagal memuat data</td></tr>';
          }
        }

        function renderTable(students) {
          if (students.length === 0) {
            tableBody.innerHTML = '<tr><td colSpan="6" class="px-6 py-20 text-center text-slate-400">Tidak ada data pendaftar</td></tr>';
            return;
          }

          const startNum = (currentPage - 1) * limit;
          tableBody.innerHTML = students.map((s, i) => {
            const escapedName = UI.escapeHTML(s.namaPreRegister || '-');
            const escapedJalur = UI.escapeHTML(s.jalur || '-');
            
            const statusBadges = {
              pending: '<span class="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-amber-100">Menunggu</span>',
              verified: '<span class="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-emerald-100">Verified</span>',
              rejected: '<span class="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-red-100">Ditolak</span>',
            };
            const docs = ['kartuKeluarga', 'ijazahSkl', 'aktaKelahiran', 'foto4x6'];
            const uploaded = docs.filter(d => s.dokumen?.[d]?.key).length;

            return \`
              <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-all">
                <td class="px-6 py-4 text-xs font-bold text-slate-400">\${startNum + i + 1}</td>
                <td class="px-6 py-4">
                  <p class="font-bold text-slate-800">\${escapedName}</p>
                  <p class="text-[10px] font-mono text-slate-400">\${s.nisn || '-'}</p>
                </td>
                <td class="px-6 py-4 text-sm font-medium text-slate-600">\${escapedJalur}</td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-1">
                    <span class="text-xs font-bold text-slate-700">\${uploaded}/4</span>
                    <div class="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div class="h-full bg-blue-500 rounded-full" style="width: \${(uploaded/4)*100}%"></div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">\${statusBadges[s.verifikasi?.status || 'pending']}</td>
                <td class="px-6 py-4">
                  <a href="/admin/verify/detail?id=\${s._id}" class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-blue-700 transition-all">
                    <span class="material-symbols-outlined" style="font-size:14px">visibility</span>
                    Periksa
                  </a>
                </td>
              </tr>
            \`;
          }).join('');
        }

        function renderPagination() {
          const start = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
          const end = Math.min(currentPage * limit, totalItems);
          paginationInfo.textContent = \`MENAMPILKAN \${start}-\${end} DARI \${totalItems} DATA\`;
          prevPage.disabled = currentPage <= 1;
          nextPage.disabled = currentPage >= totalPages;

          let pages = [];
          for (let p = Math.max(1, currentPage - 2); p <= Math.min(totalPages, currentPage + 2); p++) pages.push(p);
          pageNumbers.innerHTML = pages.map(p => \`
            <button onclick="goToPage(\${p})" class="w-8 h-8 flex items-center justify-center rounded-lg transition-all \${p === currentPage ? 'bg-blue-600 text-white' : 'hover:bg-white hover:text-blue-600 border border-transparent hover:border-slate-200'}">\${p}</button>
          \`).join('');
        }

        function goToPage(p) { currentPage = p; loadData(); }
      ` }} />
    </AdminLayout>
  );
};
