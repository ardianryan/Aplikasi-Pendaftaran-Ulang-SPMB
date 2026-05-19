/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';
import { AdminLayout } from '../layouts/AdminLayout';

export const AdminWhatsApp = (props: any) => {
  return (
    <AdminLayout title="WhatsApp Gateway" subtitle="Kelola koneksi dan kirim pesan WhatsApp" {...props} path="/admin/whatsapp">
      {/* Tabs Navigation */}
      <div className="mb-6 border-b border-slate-200">
        <nav className="flex gap-1 -mb-px" id="waTabs">
          <button onclick="switchTab('config')" data-tab="config"
            className="tab-btn px-5 py-3 text-sm font-semibold rounded-t-xl border-b-2 border-blue-600 text-blue-700 bg-blue-50/50 transition-all">
            <span className="material-symbols-outlined text-[18px] align-middle mr-1.5">settings_phone</span>
            Konfigurasi
          </button>
          <button onclick="switchTab('templates')" data-tab="templates"
            className="tab-btn px-5 py-3 text-sm font-semibold rounded-t-xl border-b-2 border-transparent text-slate-500 hover:text-slate-700 transition-all">
            <span className="material-symbols-outlined text-[18px] align-middle mr-1.5">description</span>
            Template Pesan
          </button>
          <button onclick="switchTab('send')" data-tab="send"
            className="tab-btn px-5 py-3 text-sm font-semibold rounded-t-xl border-b-2 border-transparent text-slate-500 hover:text-slate-700 transition-all">
            <span className="material-symbols-outlined text-[18px] align-middle mr-1.5">send</span>
            Kirim Pesan
          </button>
        </nav>
      </div>

      {/* ========== TAB: Konfigurasi ========== */}
      <div id="tab-config" className="tab-content">
        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Status Koneksi</h2>
            <button onclick="checkStatus()" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Cek Status
            </button>
          </div>
          <div id="statusCard" className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div id="statusDot" className="w-4 h-4 rounded-full bg-slate-300 animate-pulse"></div>
            <div>
              <p id="statusText" className="text-sm font-semibold text-slate-600">Belum diperiksa</p>
              <p id="statusDetail" className="text-xs text-slate-400">Klik "Cek Status" untuk memeriksa koneksi gateway</p>
            </div>
          </div>
        </div>

        {/* Connection Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Pengaturan Koneksi</h2>
          <div className="space-y-5">
            {/* Master Switch */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <label className="text-sm font-bold text-slate-700">Aktifkan WhatsApp Gateway</label>
                <p className="text-xs text-slate-400 mt-0.5">Mengaktifkan fitur pengiriman pesan WhatsApp</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" id="waEnabled" className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Provider */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Provider Gateway</label>
              <select id="waProvider" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
                <option value="gowa">GOWA (Go-WhatsApp) — Rekomendasi</option>
                <option value="honowa">HonoWA</option>
              </select>
              <p className="text-xs text-slate-400 mt-1.5" id="providerHint">GOWA: Basic Auth • HonoWA: API Key</p>
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">URL Endpoint Gateway</label>
              <input type="url" id="waUrl" placeholder="http://localhost:3001 atau http://gowa:3000"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <p className="text-xs text-slate-400 mt-1.5">Alamat server tempat gateway WA berjalan</p>
            </div>

            {/* Auth fields (dynamic) */}
            <div id="authGowa">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Username (Basic Auth)</label>
                  <input type="text" id="waAuthUser" placeholder="admin"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Password (Basic Auth)</label>
                  <input type="password" id="waAuthPass" placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
            </div>
            <div id="authHonowa" style="display:none">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">API Key / Token</label>
                <input type="password" id="waToken" placeholder="your-api-key-here"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>

            {/* Device ID */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2" id="deviceLabel">Device ID</label>
              <input type="text" id="waDeviceId" placeholder="Kosongkan jika hanya 1 device"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <p className="text-xs text-slate-400 mt-1.5" id="deviceHint">GOWA: Device ID dari multi-device v8 • HonoWA: Session ID</p>
            </div>

            {/* Log Retention */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Retensi Log Pengiriman</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300 has-[:checked]:text-blue-700 transition-all">
                  <input type="radio" name="waRetention" value="7" className="accent-blue-600" /> <span className="text-sm font-medium">7 hari</span>
                </label>
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300 has-[:checked]:text-blue-700 transition-all">
                  <input type="radio" name="waRetention" value="14" className="accent-blue-600" /> <span className="text-sm font-medium">14 hari</span>
                </label>
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300 has-[:checked]:text-blue-700 transition-all">
                  <input type="radio" name="waRetention" value="30" className="accent-blue-600" /> <span className="text-sm font-medium">30 hari</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-8 gap-3">
            <button onclick="testConnection()" className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">science</span>
              Test Koneksi
            </button>
            <button onclick="saveWaConfig()" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">save</span>
              Simpan Pengaturan
            </button>
          </div>
        </div>
      </div>

      {/* ========== TAB: Template Pesan ========== */}
      <div id="tab-templates" className="tab-content" style="display:none">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Template Pesan</h2>
              <p className="text-xs text-slate-400 mt-1">Variabel tersedia: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">{'{{nama}} {{nisn}} {{jalur}} {{sekolah}} {{tahun}} {{url}}'}</code></p>
            </div>
          </div>

          <div className="space-y-6">
            {[
              { key: 'wa_template_reminder', label: 'Reminder Daftar Ulang', icon: '📋', desc: 'Dikirim ke siswa yang belum melakukan daftar ulang' },
              { key: 'wa_template_biodata', label: 'Reminder Isi Buku Induk', icon: '📝', desc: 'Dikirim ke siswa yang belum menyelesaikan pengisian biodata' },
              { key: 'wa_template_verified', label: 'Notifikasi Terverifikasi', icon: '✅', desc: 'Dikirim saat data siswa diverifikasi oleh admin' },
              { key: 'wa_template_rejected', label: 'Notifikasi Ditolak', icon: '❌', desc: 'Dikirim saat data siswa ditolak oleh admin' },
            ].map((tpl) => (
              <div key={tpl.key} className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{tpl.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700">{tpl.label}</h3>
                    <p className="text-xs text-slate-400">{tpl.desc}</p>
                  </div>
                </div>
                <textarea id={`tpl_${tpl.key}`} rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                  placeholder="Tulis template pesan di sini..."></textarea>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6">
            <button onclick="saveTemplates()" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">save</span>
              Simpan Semua Template
            </button>
          </div>
        </div>
      </div>

      {/* ========== TAB: Kirim Pesan ========== */}
      <div id="tab-send" className="tab-content" style="display:none">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Kirim Pesan Individual</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nomor Telepon</label>
              <input type="tel" id="sendPhone" placeholder="08xxxx atau 628xxxx"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Pesan</label>
              <textarea id="sendMessage" rows={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                placeholder="Tulis pesan di sini..."></textarea>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button onclick="sendIndividual()" className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">send</span>
              Kirim Pesan
            </button>
          </div>
        </div>
      </div>

      {/* JavaScript Logic */}
      <script src="/js/admin/wa-logic.js"></script>
    </AdminLayout>
  );
};
