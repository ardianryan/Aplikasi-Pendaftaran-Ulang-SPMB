/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';
import { AdminLayout } from '../layouts/AdminLayout';

export const AdminProfile = (props: any) => {
  return (
    <AdminLayout title="Profil Saya" subtitle="Kelola informasi akun dan keamanan" {...props} path="/admin/profile">
      <div className="space-y-8">
        
        {/* Profile Info Card */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Informasi Dasar</h3>
          </div>
          <div className="p-8">
            <form id="profileForm" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Username</label>
                  <input type="text" id="username" disabled className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 cursor-not-allowed font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nama Lengkap</label>
                  <input type="text" id="nama" required className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium" />
                </div>
              </div>
              
              <div id="authMethodBadge" className="flex items-center gap-2"></div>
              
              <div className="pt-4">
                <button type="submit" id="saveProfileBtn" className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-100">
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Password Card (Only for local) */}
        <section id="passwordSection" className="hidden bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Keamanan & Password</h3>
          </div>
          <div className="p-8">
            <form id="passwordForm" className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password Saat Ini</label>
                <input type="password" id="oldPassword" required className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password Baru</label>
                  <input type="password" id="newPassword" required minLength={6} className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Konfirmasi Password Baru</label>
                  <input type="password" id="confirmPassword" required minLength={6} className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium" />
                </div>
              </div>
              <p className="text-xs text-slate-400 font-medium">Minimal 6 karakter. Gunakan kombinasi huruf dan angka.</p>
              <div className="pt-4">
                <button type="submit" id="savePasswordBtn" className="px-8 py-4 bg-slate-800 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-slate-200">
                  <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                  Ganti Password
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* SSO Card (Only for Google) */}
        <section id="ssoSection" className="hidden bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Akun Google Terhubung</h3>
          </div>
          <div className="p-8 flex items-center gap-6">
            <img id="googleAvatar" src="/img/default-avatar.png" className="w-20 h-20 rounded-3xl border-2 border-slate-100 shadow-sm" />
            <div className="space-y-1">
              <p id="googleEmail" className="font-bold text-slate-800 text-lg"></p>
              <p className="text-sm text-slate-500 font-medium">Terhubung via Google OAuth</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider rounded-full mt-2 border border-emerald-100">
                <span className="material-symbols-outlined text-[14px]">verified_user</span>
                Verified SSO Account
              </div>
            </div>
          </div>
        </section>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        const profileForm = document.getElementById('profileForm');
        const passwordForm = document.getElementById('passwordForm');
        const passwordSection = document.getElementById('passwordSection');
        const ssoSection = document.getElementById('ssoSection');
        const authMethodBadge = document.getElementById('authMethodBadge');

        async function loadProfile() {
          try {
            const res = await API.request('/admin/profile');
            if (res.success) {
              const user = res.data;
              document.getElementById('username').value = user.username;
              document.getElementById('nama').value = user.nama;

              if (user.authMethod === 'local') {
                passwordSection.classList.remove('hidden');
                authMethodBadge.innerHTML = '<span class="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-lg">Local Account</span>';
              } else {
                ssoSection.classList.remove('hidden');
                document.getElementById('googleEmail').textContent = user.googleEmail;
                if (user.googleAvatar) document.getElementById('googleAvatar').src = user.googleAvatar;
                authMethodBadge.innerHTML = '<span class="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1">Google Auth</span>';
              }
            }
          } catch (err) {
            console.error('Failed to load profile:', err);
          }
        }

        profileForm.onsubmit = async (e) => {
          e.preventDefault();
          const btn = document.getElementById('saveProfileBtn');
          btn.disabled = true;
          const originalText = btn.innerHTML;
          btn.innerHTML = 'Menyimpan...';

          try {
            const res = await API.request('/admin/profile', {
              method: 'PUT',
              body: JSON.stringify({ nama: document.getElementById('nama').value })
            });
            if (res.success) {
              UI.success('Berhasil', 'Profil berhasil diperbarui.');
              // Update local storage if needed
              const admin = JSON.parse(localStorage.getItem('spmb_admin') || '{}');
              admin.nama = document.getElementById('nama').value;
              localStorage.setItem('spmb_admin', JSON.stringify(admin));
              setTimeout(() => location.reload(), 1500);
            } else {
              UI.error('Gagal', res.message || 'Gagal memperbarui profil.');
            }
          } catch (err) {
            UI.error('Error', 'Terjadi kesalahan.');
          } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
          }
        };

        passwordForm.onsubmit = async (e) => {
          e.preventDefault();
          const newPassword = document.getElementById('newPassword').value;
          const confirmPassword = document.getElementById('confirmPassword').value;

          if (newPassword !== confirmPassword) {
            UI.toast('Konfirmasi password tidak cocok.', 'error');
            return;
          }

          const btn = document.getElementById('savePasswordBtn');
          btn.disabled = true;
          const originalText = btn.innerHTML;
          btn.innerHTML = 'Memperbarui...';

          try {
            const res = await API.request('/admin/profile', {
              method: 'PUT',
              body: JSON.stringify({
                oldPassword: document.getElementById('oldPassword').value,
                newPassword: newPassword
              })
            });
            if (res.success) {
              UI.success('Berhasil', 'Password berhasil diubah.');
              passwordForm.reset();
            } else {
              UI.error('Gagal', res.message || 'Gagal mengubah password.');
            }
          } catch (err) {
            UI.error('Error', 'Terjadi kesalahan.');
          } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
          }
        };

        loadProfile();
      ` }} />
    </AdminLayout>
  );
};
