/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';
import { AdminLayout } from '../layouts/AdminLayout';

export const AdminDashboard = (props: any) => {
  return (
    <AdminLayout title="Dashboard" subtitle="Ringkasan data pendaftaran" {...props} path="/admin/dashboard">
      {/* Stats Cards */}
      <div id="statsGrid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Pendaftar', icon: 'groups', color: 'blue' },
          { label: 'Menunggu Verifikasi', icon: 'pending', color: 'amber' },
          { label: 'Terverifikasi', icon: 'verified', color: 'emerald' },
          { label: 'Ditolak', icon: 'cancel', color: 'red' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className={`w-12 h-12 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl flex items-center justify-center mb-4`}>
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
            <h3 className="text-3xl font-extrabold text-slate-800" id={`stat-${stat.label.replace(/\s+/g, '-').toLowerCase()}`}>...</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart/List area */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Pendaftar per Jalur</h3>
            <a href="/admin/students" className="text-blue-600 text-sm font-bold hover:underline">Lihat Semua</a>
          </div>
          <div id="jalurList" className="p-8 space-y-4">
             <div className="animate-pulse space-y-4">
                <div className="h-12 bg-slate-50 rounded-2xl"></div>
                <div className="h-12 bg-slate-50 rounded-2xl"></div>
                <div className="h-12 bg-slate-50 rounded-2xl"></div>
             </div>
          </div>
        </div>

        {/* Sidebar area */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Status Dokumen</h3>
          </div>
          <div id="verificationStatus" className="p-8 space-y-6">
            <div className="animate-pulse space-y-6">
                <div className="h-16 bg-slate-50 rounded-2xl"></div>
                <div className="h-16 bg-slate-50 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>

      <script src="/js/admin/dashboard.js"></script>
    </AdminLayout>
  );
};
