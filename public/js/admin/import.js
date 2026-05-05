/**
 * Admin Import Logic
 * Handles template download, file upload with drag & drop, and results display
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

  // Export link
  document.getElementById('exportLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    downloadExport();
  });

  // State
  let selectedFile = null;

  // Elements
  const downloadTemplate = document.getElementById('downloadTemplate');
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const selectedFileEl = document.getElementById('selectedFile');
  const fileNameEl = document.getElementById('fileName');
  const fileSizeEl = document.getElementById('fileSize');
  const removeFile = document.getElementById('removeFile');
  const uploadBtn = document.getElementById('uploadBtn');
  const uploadBtnText = document.getElementById('uploadBtnText');
  const uploadSpinner = document.getElementById('uploadSpinner');
  const resultsSection = document.getElementById('resultsSection');
  const resultBadge = document.getElementById('resultBadge');
  const resultSuccess = document.getElementById('resultSuccess');
  const resultFailed = document.getElementById('resultFailed');
  const resultTotal = document.getElementById('resultTotal');
  const errorDetails = document.getElementById('errorDetails');
  const errorList = document.getElementById('errorList');

  // Download template
  downloadTemplate.addEventListener('click', async () => {
    try {
      const token = API.getToken();
      const response = await fetch('/api/admin/import/template', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Download gagal');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template-import-spmb.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Gagal mendownload template: ' + err.message);
    }
  });

  // Drop zone click
  dropZone.addEventListener('click', () => {
    fileInput.click();
  });

  // File input change
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  // Drag & drop
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-primary', 'bg-primary/5');
    dropZone.classList.remove('border-outline-variant');
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-primary', 'bg-primary/5');
    dropZone.classList.add('border-outline-variant');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-primary', 'bg-primary/5');
    dropZone.classList.add('border-outline-variant');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });

  // Remove file
  removeFile.addEventListener('click', () => {
    clearFile();
  });

  // Upload
  uploadBtn.addEventListener('click', uploadFile);

  function handleFile(file) {
    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    const validExtensions = ['.xlsx', '.xls'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      alert('Format file tidak valid. Gunakan file .xlsx atau .xls');
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 5MB.');
      return;
    }

    selectedFile = file;
    fileNameEl.textContent = file.name;
    fileSizeEl.textContent = formatFileSize(file.size);
    selectedFileEl.classList.remove('hidden');
    dropZone.classList.add('hidden');
    uploadBtn.disabled = false;
  }

  function clearFile() {
    selectedFile = null;
    fileInput.value = '';
    selectedFileEl.classList.add('hidden');
    dropZone.classList.remove('hidden');
    uploadBtn.disabled = true;
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  async function uploadFile() {
    if (!selectedFile) return;

    // First, check for duplicates by doing a dry-run check
    // We'll ask for confirmation if there might be updates
    const proceed = confirm(
      'Apakah Anda yakin ingin mengimport file ini?\n\n' +
      'Catatan: Jika ada NISN yang sudah terdaftar, data akan diperbarui dengan data terbaru dari file ini.'
    );
    if (!proceed) return;

    // Show loading
    uploadBtn.disabled = true;
    uploadBtnText.textContent = 'Mengimport...';
    uploadSpinner.classList.remove('hidden');
    resultsSection.classList.add('hidden');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await API.request('/admin/import', {
        method: 'POST',
        body: formData,
      });

      const result = res.data || res;
      showResults(result);
    } catch (err) {
      if (err.status === 401) return;

      // Show error as result
      showResults({
        success: 0,
        inserted: 0,
        updated: 0,
        failed: 1,
        errors: [{ row: '-', message: err.message || 'Upload gagal' }],
      });
    } finally {
      uploadBtn.disabled = false;
      uploadBtnText.textContent = 'Upload & Import';
      uploadSpinner.classList.add('hidden');
      clearFile();
    }
  }

  function showResults(result) {
    resultsSection.classList.remove('hidden');

    const totalSuccess = result.success || 0;
    const inserted = result.inserted || 0;
    const updated = result.updated || 0;
    const failed = result.failed || 0;
    const total = totalSuccess + failed;

    resultSuccess.textContent = totalSuccess;
    resultFailed.textContent = failed;
    resultTotal.textContent = total;

    // Badge
    if (failed === 0 && totalSuccess > 0) {
      resultBadge.textContent = 'Berhasil';
      resultBadge.className = 'px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700';
    } else if (totalSuccess === 0) {
      resultBadge.textContent = 'Gagal';
      resultBadge.className = 'px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700';
    } else {
      resultBadge.textContent = 'Sebagian Berhasil';
      resultBadge.className = 'px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700';
    }

    // Show inserted/updated breakdown
    const breakdownEl = document.getElementById('resultBreakdown');
    if (breakdownEl) {
      breakdownEl.innerHTML = `
        <div class="flex items-center gap-4 mt-3 text-sm">
          ${inserted > 0 ? `<span class="flex items-center gap-1 text-tertiary"><span class="material-symbols-outlined" style="font-size:16px">add_circle</span> ${inserted} baru</span>` : ''}
          ${updated > 0 ? `<span class="flex items-center gap-1 text-[#115cb9]"><span class="material-symbols-outlined" style="font-size:16px">sync</span> ${updated} diperbarui (NISN duplikat)</span>` : ''}
        </div>
      `;
    }

    // Error details
    const errors = result.errors || [];
    if (errors.length > 0) {
      errorDetails.classList.remove('hidden');
      errorList.innerHTML = errors
        .map(
          (err) => `
        <div class="px-6 py-3 flex items-start gap-3">
          <span class="material-symbols-outlined text-error text-lg mt-0.5">error</span>
          <div>
            <p class="text-sm text-on-surface">
              ${err.row ? `<span class="font-medium">Baris ${err.row}${err.nisn ? ` (NISN: ${err.nisn})` : ''}:</span> ` : ''}${err.message || err.error || 'Error tidak diketahui'}
            </p>
          </div>
        </div>
      `
        )
        .join('');
    } else {
      errorDetails.classList.add('hidden');
    }

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function downloadExport() {
    try {
      const token = API.getToken();
      const response = await fetch('/api/admin/export', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Export gagal');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-spmb-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Gagal mengexport data: ' + err.message);
    }
  }
})();
