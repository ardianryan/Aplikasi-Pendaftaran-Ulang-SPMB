/**
 * WhatsApp Logs Logic
 * Handles fetching, pagination, filtering, and cleanup of WA logs.
 */

let currentPage = 1;
let totalPages = 1;
const limit = 20;

// Format date to local string
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('id-ID', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// Get badge for status
function getStatusBadge(status) {
  switch (status) {
    case 'sent':
      return '<span class="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase tracking-wider">Sent</span>';
    case 'failed':
      return '<span class="px-2 py-1 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase tracking-wider">Failed</span>';
    case 'queued':
      return '<span class="px-2 py-1 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase tracking-wider">Queued</span>';
    default:
      return `<span class="px-2 py-1 bg-slate-100 text-slate-700 rounded text-[10px] font-bold uppercase tracking-wider">${status}</span>`;
  }
}

// Load logs from API
async function loadLogs(page = 1) {
  currentPage = page;
  const status = document.getElementById('filterStatus').value;
  const type = document.getElementById('filterType').value;
  const tbody = document.getElementById('logsTableBody');

  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="px-6 py-12 text-center text-slate-400">
        <span class="material-symbols-outlined text-[32px] animate-spin mb-2">sync</span>
        <p>Memuat log...</p>
      </td>
    </tr>
  `;

  try {
    const res = await API.request(`/admin/wa/logs?page=${page}&limit=${limit}&status=${status}&type=${type}`);
    
    if (res.success) {
      const { data, meta } = res;
      totalPages = meta.totalPages || 1;
      
      if (data.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="px-6 py-12 text-center text-slate-400">
              <span class="material-symbols-outlined text-[32px] mb-2 opacity-50">history_toggle_off</span>
              <p>Tidak ada log yang ditemukan.</p>
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = data.map(log => `
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-6 py-4 text-xs font-mono text-slate-500">${formatDate(log.sentAt)}</td>
            <td class="px-6 py-4">
              <p class="text-sm font-bold text-slate-800">${log.recipientName || '-'}</p>
              <p class="text-xs font-mono text-slate-500">${log.recipientPhone}</p>
            </td>
            <td class="px-6 py-4">
              <span class="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">${log.messageType}</span>
            </td>
            <td class="px-6 py-4">${getStatusBadge(log.status)}</td>
            <td class="px-6 py-4 text-xs">
              <div class="max-w-xs md:max-w-md lg:max-w-lg">
                ${log.status === 'failed' && log.errorMessage 
                  ? `<p class="text-red-600 font-mono mb-1 truncate" title="${log.errorMessage}">Error: ${log.errorMessage}</p>` 
                  : ''}
                <p class="text-slate-600 truncate cursor-pointer hover:text-blue-600 transition" 
                   title="${log.messageContent.replace(/"/g, '&quot;')}"
                   onclick="alert(this.title)">
                  ${log.messageContent}
                </p>
              </div>
            </td>
          </tr>
        `).join('');
      }

      // Update Pagination UI
      const start = (meta.page - 1) * meta.limit + 1;
      const end = Math.min(meta.page * meta.limit, meta.total);
      
      document.getElementById('pageInfo').textContent = 
        meta.total > 0 ? `Menampilkan ${start}-${end} dari ${meta.total} log` : 'Tidak ada data';
      
      document.getElementById('pageIndicator').textContent = `${meta.page} / ${totalPages}`;
      document.getElementById('btnPrev').disabled = meta.page <= 1;
      document.getElementById('btnNext').disabled = meta.page >= totalPages;

    } else {
      tbody.innerHTML = `
        <tr><td colspan="5" class="px-6 py-12 text-center text-red-500">Gagal memuat data</td></tr>
      `;
    }
  } catch (err) {
    tbody.innerHTML = `
      <tr><td colspan="5" class="px-6 py-12 text-center text-red-500">Terjadi kesalahan sistem</td></tr>
    `;
  }
}

// Pagination handler
function changePage(delta) {
  const newPage = currentPage + delta;
  if (newPage >= 1 && newPage <= totalPages) {
    loadLogs(newPage);
  }
}

// Cleanup old logs
async function cleanupLogs() {
  if (!confirm('Apakah Anda yakin ingin menghapus log lama sesuai batas retensi yang diatur? Tindakan ini tidak dapat dibatalkan.')) {
    return;
  }

  try {
    const res = await API.request('/admin/wa/logs/cleanup', { method: 'DELETE' });
    if (res.success) {
      UI.toast(res.message, 'success');
      loadLogs(1);
    } else {
      UI.toast('Gagal membersihkan log: ' + res.message, 'error');
    }
  } catch (err) {
    UI.toast('Terjadi kesalahan saat membersihkan log.', 'error');
  }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  loadLogs(1);
});
