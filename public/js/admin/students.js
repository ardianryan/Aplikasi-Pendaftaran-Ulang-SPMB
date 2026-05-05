/**
 * Admin Students Table Logic
 * Handles search, filters, pagination, and detail modal
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
  const detailModal = document.getElementById('detailModal');
  const closeModal = document.getElementById('closeModal');
  const detailContent = document.getElementById('detailContent');
  const exportBtn = document.getElementById('exportBtn');

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

  closeModal.addEventListener('click', () => {
    detailModal.classList.add('hidden');
  });

  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) {
      detailModal.classList.add('hidden');
    }
  });

  exportBtn?.addEventListener('click', downloadExport);

  // Export link in sidebar
  document.getElementById('exportLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    downloadExport();
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
      // API returns { success, data: [...], meta: { page, limit, total, totalPages } }
      const students = Array.isArray(res.data) ? res.data : [];
      totalItems = res.meta?.total || 0;
      totalPages = res.meta?.totalPages || Math.ceil(totalItems / limit) || 1;

      renderTable(students);
      renderPagination();
    } catch (err) {
      if (err.status === 401) return;
      // Show empty state instead of error for non-critical failures
      console.error('Failed to load students:', err);
      renderTable([]);
      renderPagination();
    }
  }

  function renderTable(students) {
    if (students.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="px-4 py-12 text-center text-on-surface-variant">
            <span class="material-symbols-outlined text-4xl text-outline mb-2 block">search_off</span>
            Tidak ada data ditemukan
          </td>
        </tr>
      `;
      return;
    }

    const startNum = (currentPage - 1) * limit;

    tableBody.innerHTML = students
      .map((s, i) => {
        // Derive status from isSubmitted + verifikasi.status
        let status = 'not_started';
        if (s.isSubmitted && s.verifikasi?.status === 'verified') status = 'verified';
        else if (s.isSubmitted && s.verifikasi?.status === 'rejected') status = 'rejected';
        else if (s.isSubmitted) status = 'submitted';
        else if (s.wizardStep > 1) status = 'in_progress';

        const statusBadge = getStatusBadge(status);
        const nama = s.namaPreRegister || s.biodata?.namaLengkap || '-';

        // Format tanggal lahir
        let tglLahir = '-';
        if (s.tanggalLahirPreRegister) {
          try {
            const d = new Date(s.tanggalLahirPreRegister);
            tglLahir = d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
          } catch(e) { tglLahir = '-'; }
        }

        return `
        <tr class="border-b border-outline-variant hover:bg-surface-low/50 transition">
          <td class="px-4 py-3 text-on-surface-variant text-sm">${startNum + i + 1}</td>
          <td class="px-4 py-3 text-on-surface font-mono text-xs">${s.nisn || '-'}</td>
          <td class="px-4 py-3 text-on-surface font-medium text-sm">${nama}</td>
          <td class="px-4 py-3 text-on-surface-variant text-xs">${tglLahir}</td>
          <td class="px-4 py-3">
            <span class="capitalize text-on-surface-variant text-sm">${s.jalur || '-'}</span>
          </td>
          <td class="px-4 py-3">${statusBadge}</td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <button onclick="viewStudent('${s._id}')" class="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1" title="Lihat detail">
                <span class="material-symbols-outlined text-base">visibility</span>
              </button>
              <button onclick="deleteStudent('${s._id}', '${nama.replace(/'/g, "\\'")}')" class="text-error hover:text-error/80 text-sm font-medium flex items-center gap-1" title="Hapus siswa">
                <span class="material-symbols-outlined text-base">delete</span>
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
      not_started: '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Belum Mulai</span>',
      in_progress: '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Mengisi</span>',
      submitted: '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Submitted</span>',
      verified: '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Terverifikasi</span>',
      rejected: '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Ditolak</span>',
    };
    return badges[status] || `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">${status || '-'}</span>`;
  }

  function renderPagination() {
    const start = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, totalItems);
    paginationInfo.textContent = `Menampilkan ${start}-${end} dari ${totalItems} data`;

    prevPage.disabled = currentPage <= 1;
    nextPage.disabled = currentPage >= totalPages;

    // Page numbers
    let pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let p = startPage; p <= endPage; p++) {
      pages.push(p);
    }

    pageNumbers.innerHTML = pages
      .map(
        (p) => `
      <button
        onclick="goToPage(${p})"
        class="px-3 py-1.5 text-sm rounded-lg transition ${
          p === currentPage
            ? 'bg-primary text-on-primary font-medium'
            : 'border border-outline-variant text-on-surface-variant hover:bg-surface-low'
        }"
      >${p}</button>
    `
      )
      .join('');
  }

  // Global functions for onclick handlers
  window.goToPage = function (page) {
    currentPage = page;
    loadStudents();
  };

  window.deleteStudent = async function (id, nama) {
    if (!confirm(`Apakah Anda yakin ingin menghapus data siswa "${nama}"?\n\nData yang sudah dihapus tidak dapat dikembalikan.`)) {
      return;
    }

    try {
      await API.request(`/admin/students/${id}`, { method: 'DELETE' });
      // Reload table
      loadStudents();
      // Show success feedback
      showToast(`Data siswa "${nama}" berhasil dihapus.`, 'success');
    } catch (err) {
      alert('Gagal menghapus: ' + (err.message || 'Terjadi kesalahan'));
    }
  };

  // Toast helper
  function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const colors = {
      success: 'bg-tertiary text-white',
      error: 'bg-error text-white',
      info: 'bg-primary text-white',
    };

    const toast = document.createElement('div');
    toast.className = `toast ${colors[type] || colors.info} px-5 py-3 rounded-lg shadow-lg max-w-sm text-sm font-medium`;
    toast.textContent = message;
    toast.setAttribute('role', 'alert');
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  window.viewStudent = async function (id) {
    detailContent.innerHTML = `
      <div class="flex items-center justify-center py-12">
        <svg class="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
      </div>
    `;
    detailModal.classList.remove('hidden');

    try {
      const res = await API.request(`/admin/students/${id}`);
      const student = res.data || res;
      renderDetail(student);
    } catch (err) {
      if (err.status === 404) {
        detailContent.innerHTML = `
          <div class="text-center py-8 text-on-surface-variant">
            <span class="material-symbols-outlined text-4xl mb-2 block text-outline">person_off</span>
            <p>Data siswa tidak ditemukan.</p>
          </div>
        `;
      } else {
        detailContent.innerHTML = `
          <div class="text-center py-8 text-on-surface-variant">
            <span class="material-symbols-outlined text-4xl mb-2 block text-outline">cloud_off</span>
            <p>Tidak dapat memuat data. Coba lagi nanti.</p>
          </div>
        `;
      }
    }
  };

  function renderDetail(student) {
    // Derive status
    let status = 'not_started';
    if (student.isSubmitted && student.verifikasi?.status === 'verified') status = 'verified';
    else if (student.isSubmitted && student.verifikasi?.status === 'rejected') status = 'rejected';
    else if (student.isSubmitted) status = 'submitted';
    else if (student.wizardStep > 1) status = 'in_progress';

    const nama = student.biodata?.namaLengkap || student.namaPreRegister || '-';
    const bio = student.biodata || {};
    const alm = student.alamat || {};
    const kes = student.kesehatan || {};
    const pend = student.pendidikan || {};

    // Format tanggal lahir
    let tglLahir = '-';
    const rawTgl = bio.tanggalLahir || student.tanggalLahirPreRegister;
    if (rawTgl) {
      try { tglLahir = new Date(rawTgl).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); } catch(e) { tglLahir = '-'; }
    }

    // Build sections
    const sections = [
      {
        title: 'Data Diri',
        icon: 'person',
        fields: [
          { label: 'Nama Lengkap', value: nama },
          { label: 'NISN', value: student.nisn },
          { label: 'Jalur', value: student.jalur },
          { label: 'Asal SMP', value: pend.asalSekolah || student.asalSmpPreRegister },
          { label: 'Jenis Kelamin', value: bio.jenisKelamin },
          { label: 'Tempat, Tgl Lahir', value: bio.tempatLahir ? `${bio.tempatLahir}, ${tglLahir}` : tglLahir },
          { label: 'Agama', value: bio.agama },
          { label: 'NIK', value: bio.nik },
        ]
      },
      {
        title: 'Alamat & Kontak',
        icon: 'home',
        fields: [
          { label: 'Alamat', value: alm.alamatLengkap },
          { label: 'Telepon/HP', value: alm.telepon },
          { label: 'Email', value: alm.email },
          { label: 'Tinggal dengan', value: alm.tinggalDengan },
          { label: 'Transportasi', value: alm.transportasi },
        ]
      },
      {
        title: 'Orang Tua',
        icon: 'family_restroom',
        fields: [
          { label: 'Nama Ayah', value: student.ayah?.nama },
          { label: 'Pekerjaan Ayah', value: student.ayah?.pekerjaan },
          { label: 'Nama Ibu', value: student.ibu?.nama },
          { label: 'Pekerjaan Ibu', value: student.ibu?.pekerjaan },
        ]
      },
    ];

    // Check if student has filled any biodata
    const hasBiodata = student.wizardStep > 1;

    detailContent.innerHTML = `
      <div class="space-y-4">
        <!-- Header -->
        <div class="flex items-center gap-4 pb-4 border-b border-outline-variant">
          <div class="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
            <span class="material-symbols-outlined text-primary text-3xl">person</span>
          </div>
          <div class="flex-1">
            <h4 class="font-display font-semibold text-lg text-on-surface">${nama}</h4>
            <p class="text-sm text-on-surface-variant">NISN: ${student.nisn || '-'}</p>
          </div>
          <div>${getStatusBadge(status)}</div>
        </div>

        <!-- Wizard Progress -->
        <div class="flex items-center gap-2 text-xs text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2">
          <span class="material-symbols-outlined" style="font-size:16px">timeline</span>
          <span>Langkah ${student.wizardStep || 1} dari 5</span>
          ${student.isSubmitted ? '<span class="ml-auto text-tertiary font-medium">Sudah Submit</span>' : ''}
        </div>

        ${!hasBiodata ? `
          <!-- Empty state: belum mengisi -->
          <div class="text-center py-6 bg-surface-container-low rounded-lg">
            <span class="material-symbols-outlined text-4xl text-outline mb-2 block">edit_off</span>
            <p class="text-sm text-on-surface-variant">Siswa belum mengisi biodata</p>
            <p class="text-xs text-outline mt-1">Data akan muncul setelah siswa melengkapi formulir</p>
          </div>
        ` : `
          <!-- Sections -->
          ${sections.map(section => `
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span class="material-symbols-outlined text-primary" style="font-size:18px">${section.icon}</span>
                <h5 class="text-sm font-bold text-on-surface">${section.title}</h5>
              </div>
              <div class="grid grid-cols-2 gap-x-4 gap-y-2 bg-surface-container-low rounded-lg p-3">
                ${section.fields.map(f => `
                  <div>
                    <p class="text-xs text-on-surface-variant">${f.label}</p>
                    <p class="text-sm text-on-surface ${f.value ? 'font-medium' : 'italic text-outline'}">${f.value || 'Belum diisi'}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        `}

        <!-- Dokumen -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="material-symbols-outlined text-primary" style="font-size:18px">folder</span>
            <h5 class="text-sm font-bold text-on-surface">Dokumen</h5>
          </div>
          <div class="space-y-2">
            ${renderDocItem('Kartu Keluarga', student.dokumen?.kartuKeluarga)}
            ${renderDocItem('Ijazah / SKL', student.dokumen?.ijazahSkl)}
            ${renderDocItem('Akta Kelahiran', student.dokumen?.aktaKelahiran)}
            ${renderDocItem('Pas Foto 4x6', student.dokumen?.foto4x6)}
          </div>
        </div>
      </div>
    `;
  }

  function renderDocItem(label, doc) {
    if (doc && doc.key) {
      const publicUrl = doc.key; // Will be full URL if R2_PUBLIC_URL is set
      return `
        <div class="flex items-center justify-between p-2.5 bg-tertiary/5 border border-tertiary/20 rounded-lg">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-tertiary" style="font-size:18px;font-variation-settings:'FILL' 1">check_circle</span>
            <span class="text-sm text-on-surface">${label}</span>
          </div>
          <span class="text-xs text-on-surface-variant">${doc.originalName || 'Uploaded'}</span>
        </div>
      `;
    }
    return `
      <div class="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-outline" style="font-size:18px">radio_button_unchecked</span>
          <span class="text-sm text-on-surface-variant">${label}</span>
        </div>
        <span class="text-xs text-outline italic">Belum diunggah</span>
      </div>
    `;
  }
  async function downloadExport() {
    const jalur = filterJalur.value;
    const status = filterStatus.value;
    const params = new URLSearchParams();
    if (jalur) params.set('jalur', jalur);
    if (status) params.set('status', status);

    try {
      const token = API.getToken();
      const response = await fetch(`/api/admin/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Export gagal');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-siswa-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Gagal mengexport data: ' + err.message);
    }
  }
})();
