/**
 * Admin Students Table Logic
 * Handles search, filters, pagination, detail modal, manual add, and export modal
 */

(function () {
  'use strict';

  // Auth check
  if (!API.getToken() || !localStorage.getItem('spmb_admin')) {
    window.location.href = '/admin/login';
    return;
  }

  // Set admin name
  const admin = JSON.parse(localStorage.getItem('spmb_admin') || '{}');
  const adminNameEl = document.getElementById('adminName');
  if (adminNameEl && admin.nama) {
    adminNameEl.textContent = admin.nama;
  }

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    API.clearToken();
    localStorage.removeItem('spmb_admin');
    window.location.href = '/admin/login';
  });

  // State
  let currentPage = 1;
  const limit = 20;
  let totalPages = 1;
  let totalItems = 0;
  let searchTimeout = null;

  // Elements
  const searchInput = document.getElementById('searchInput');
  const filterJalur = document.getElementById('filterJalur');
  const filterStatus = document.getElementById('filterStatus');
  const resetFilters = document.getElementById('resetFilters');
  const tableBody = document.getElementById('studentsTableBody');
  const paginationInfo = document.getElementById('paginationInfo');
  const prevPage = document.getElementById('prevPage');
  const nextPage = document.getElementById('nextPage');
  const pageNumbers = document.getElementById('pageNumbers');
  
  // Modals
  const detailModal = document.getElementById('detailModal');
  const exportModal = document.getElementById('exportModal');
  const addStudentModal = document.getElementById('addStudentModal');

  // Event listeners
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentPage = 1;
      loadStudents();
    }, 400);
  });

  filterJalur.addEventListener('change', () => {
    currentPage = 1;
    loadStudents();
  });

  filterStatus.addEventListener('change', () => {
    currentPage = 1;
    loadStudents();
  });

  resetFilters.addEventListener('click', () => {
    searchInput.value = '';
    filterJalur.value = '';
    filterStatus.value = '';
    currentPage = 1;
    loadStudents();
  });

  prevPage.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadStudents();
    }
  });

  nextPage.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadStudents();
    }
  });

  // Close modals logic
  document.getElementById('closeModal')?.addEventListener('click', () => detailModal.classList.add('hidden'));
  document.getElementById('closeExportModal')?.addEventListener('click', () => exportModal.classList.add('hidden'));
  document.getElementById('closeAddModal')?.addEventListener('click', () => addStudentModal.classList.add('hidden'));

  // Open modals
  document.getElementById('exportModalBtn')?.addEventListener('click', () => {
    exportModal.classList.remove('hidden');
    API.populateJalurOptions('exportFilterJalur');
  });

  document.getElementById('addStudentBtn')?.addEventListener('click', () => {
    addStudentModal.classList.remove('hidden');
    API.populateJalurOptions('add_jalur');
  });

  // Export action
  document.getElementById('doExportBtn')?.addEventListener('click', async () => {
    const jalur = document.getElementById('exportFilterJalur').value;
    const status = document.getElementById('exportFilterStatus').value;
    const btn = document.getElementById('doExportBtn');
    
    btn.disabled = true;
    btn.innerHTML = '<span class="animate-spin material-symbols-outlined">sync</span> Mengunduh...';

    await downloadExport(jalur, status);
    
    btn.disabled = false;
    btn.innerHTML = '<span class="material-symbols-outlined">description</span> Unduh Excel (.xlsx)';
    exportModal.classList.add('hidden');
  });

  // Add student action
  document.getElementById('doAddStudentBtn')?.addEventListener('click', async () => {
    const nisn = document.getElementById('add_nisn').value.trim();
    const nama = document.getElementById('add_name').value.trim();
    const asalSmp = document.getElementById('add_school').value.trim();
    const jalur = document.getElementById('add_jalur').value;
    const btn = document.getElementById('doAddStudentBtn');

    if (!nisn || nisn.length !== 10) { UI.toast('NISN harus 10 digit', 'error'); return; }
    if (!nama) { UI.toast('Nama wajib diisi', 'error'); return; }

    btn.disabled = true;
    btn.textContent = 'Menyimpan...';

    try {
      await API.request('/admin/students', {
        method: 'POST',
        body: JSON.stringify({ nisn, nama, asalSmp, jalur })
      });
      UI.toast('Siswa berhasil ditambahkan!', 'success');
      addStudentModal.classList.add('hidden');
      loadStudents();
    } catch (err) {
      UI.toast(err.message || 'Gagal menambahkan siswa', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Simpan Data Siswa';
    }
  });

  // Initial load
  API.populateJalurOptions('filterJalur');
  loadStudents();

  async function loadStudents() {
    const search = searchInput.value.trim();
    const jalur = filterJalur.value;
    const status = filterStatus.value;

    const params = new URLSearchParams({
      page: currentPage,
      limit,
      sort: '-updatedAt',
    });
    if (search) params.set('search', search);
    if (jalur) params.set('jalur', jalur);
    if (status) params.set('status', status);

    try {
      const res = await API.request(`/admin/students?${params.toString()}`);
      const students = Array.isArray(res.data) ? res.data : [];
      totalItems = res.meta?.total || 0;
      totalPages = res.meta?.totalPages || Math.ceil(totalItems / limit) || 1;

      renderTable(students);
      renderPagination();
    } catch (err) {
      if (err.status === 401) return;
      console.error('Failed to load students:', err);
      renderTable([]);
      renderPagination();
    }
  }

  function renderTable(students) {
    if (students.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="px-6 py-20 text-center">
            <div class="flex flex-col items-center">
              <span class="material-symbols-outlined text-4xl text-slate-200 mb-2">person_off</span>
              <p class="text-slate-400 font-medium">Tidak ada data siswa ditemukan</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = students
      .map((s) => {
        let status = 'not_started';
        if (s.isSubmitted && s.verifikasi?.status === 'verified') status = 'verified';
        else if (s.isSubmitted && s.verifikasi?.status === 'rejected') status = 'rejected';
        else if (s.isSubmitted) status = 'submitted';
        else if (s.wizardStep > 1) status = 'in_progress';

        const statusBadge = getStatusBadge(status);
        const name = s.namaPreRegister || '-';

        return `
        <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
          <td class="px-6 py-4">
            <div class="flex flex-col">
              <span class="text-sm font-bold text-slate-800">${name}</span>
              <span class="text-[10px] font-mono text-slate-400">${s.nisn || '-'}</span>
            </div>
          </td>
          <td class="px-6 py-4 text-sm text-slate-600">${s.asalSmpPreRegister || '-'}</td>
          <td class="px-6 py-4 text-sm font-medium text-slate-500">${s.jalur || '-'}</td>
          <td class="px-6 py-4">${statusBadge}</td>
          <td class="px-6 py-4 text-xs text-slate-400">${new Date(s.updatedAt).toLocaleDateString('id-ID')}</td>
          <td class="px-6 py-4">
            <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button onclick="viewStudent('${s._id}')" class="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all">
                <span class="material-symbols-outlined text-lg">visibility</span>
              </button>
              <button onclick="deleteStudent('${s._id}', '${name.replace(/'/g, "\\'")}')" class="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all">
                <span class="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          </td>
        </tr>
      `;
      })
      .join('');
  }

  function getStatusBadge(status) {
    const badges = {
      not_started: '<span class="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded-full">Belum Mulai</span>',
      in_progress: '<span class="px-3 py-1 bg-blue-50 text-blue-500 text-[10px] font-bold uppercase rounded-full">Proses</span>',
      submitted: '<span class="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase rounded-full">Submit</span>',
      verified: '<span class="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase rounded-full">Diterima</span>',
      rejected: '<span class="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-bold uppercase rounded-full">Ditolak</span>',
    };
    return badges[status] || badges.not_started;
  }

  function renderPagination() {
    prevPage.disabled = currentPage <= 1;
    nextPage.disabled = currentPage >= totalPages;
    paginationInfo.textContent = `Menampilkan ${Math.min(totalItems, (currentPage-1)*limit + 1)}-${Math.min(totalItems, currentPage*limit)} dari ${totalItems} data`;

    let html = '';
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        html += `<button onclick="goToPage(${i})" class="w-8 h-8 rounded-lg text-xs font-bold transition-all ${i === currentPage ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:bg-slate-100'}">${i}</button>`;
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        html += '<span class="px-1 text-slate-300">...</span>';
      }
    }
    pageNumbers.innerHTML = html;
  }

  window.goToPage = (p) => { currentPage = p; loadStudents(); };

  window.deleteStudent = async (id, name) => {
    if (!await UI.confirm('Hapus Siswa?', `Hapus data ${name}? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await API.request(`/admin/students/${id}`, { method: 'DELETE' });
      loadStudents();
      UI.toast('Data siswa dihapus', 'success');
    } catch (err) { UI.toast(err.message, 'error'); }
  };

  window.viewStudent = async (id) => {
    const detailModal = document.getElementById('detailModal');
    const detailContent = document.getElementById('detailContent');
    detailContent.innerHTML = '<div class="py-20 text-center text-slate-400">Memuat detail...</div>';
    detailModal.classList.remove('hidden');
    
    try {
      const res = await API.request(`/admin/students/${id}`);
      const s = res.data;
      detailContent.innerHTML = `
        <div class="space-y-8">
           <div class="flex items-center gap-6">
              <div class="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400">
                 <span class="material-symbols-outlined text-4xl">person</span>
              </div>
              <div>
                 <h4 class="text-2xl font-extrabold text-slate-800">${s.namaPreRegister}</h4>
                 <p class="text-slate-400 font-mono">${s.nisn}</p>
              </div>
           </div>
           <div class="grid grid-cols-2 gap-8">
              <div class="space-y-4">
                 <h5 class="text-[10px] font-bold text-slate-300 uppercase tracking-widest border-b pb-2">Informasi Pendaftaran</h5>
                 <div class="grid grid-cols-1 gap-2">
                    <p class="text-xs text-slate-400">Jalur: <span class="font-bold text-slate-700">${s.jalur}</span></p>
                    <p class="text-xs text-slate-400">Asal SMP: <span class="font-bold text-slate-700">${s.asalSmpPreRegister}</span></p>
                    <p class="text-xs text-slate-400">Status: ${getStatusBadge(s.verifikasi?.status || 'pending')}</p>
                 </div>
              </div>
              <div class="space-y-4">
                 <h5 class="text-[10px] font-bold text-slate-300 uppercase tracking-widest border-b pb-2">Kelengkapan Form</h5>
                 <div class="grid grid-cols-1 gap-2">
                    <p class="text-xs text-slate-400">Step Wizard: <span class="font-bold text-slate-700">${s.wizardStep}/5</span></p>
                    <p class="text-xs text-slate-400">Sudah Submit: <span class="font-bold ${s.isSubmitted ? 'text-emerald-600' : 'text-red-500'}">${s.isSubmitted ? 'YA' : 'BELUM'}</span></p>
                 </div>
              </div>
           </div>
           <div class="pt-6 border-t flex justify-end">
              <a href="/admin/verify/detail?id=${s._id}" class="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all">Halaman Verifikasi Full</a>
           </div>
        </div>
      `;
    } catch (err) { UI.toast(err.message, 'error'); }
  };

  async function downloadExport(jalur = 'all', status = 'all') {
    try {
      const token = API.getToken();
      const params = new URLSearchParams();
      if (jalur && jalur !== 'all') params.set('jalur', jalur);
      if (status && status !== 'all') params.set('status', status);

      const response = await fetch(`/api/admin/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Export gagal');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Buku_Induk_${jalur}_${status}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      UI.error('Export Gagal', 'Gagal mengexport data: ' + err.message);
    }
  }

  // Initial load
  loadStudents();
  API.populateJalurOptions('filterJalur');

})();
