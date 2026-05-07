/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';
import { Layout } from '../layouts/Layout';

export const AdminLogin = (props: any) => {
  return (
    <Layout title="Admin Login" {...props}>
      <script src="https://accounts.google.com/gsi/client" async defer></script>
      <main className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 md:p-10">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20">
                <span className="material-symbols-outlined text-white text-4xl">admin_panel_settings</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-800">{props.schoolName || 'Admin Portal'}</h1>
              <p className="text-slate-500 mt-2">Masuk ke Panel Kontrol {props.appName || 'SPMB'}</p>
            </div>

            <div id="login-error" className="hidden mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <span className="material-symbols-outlined text-red-500">error</span>
              <p id="login-error-text" className="text-sm text-red-600 font-medium"></p>
            </div>

            {/* Google GSI Button Container */}
            <div id="g_id_signin" className="flex justify-center mb-6">
              <div id="google-btn-wrapper" className="w-full">
                 <button id="google-login-btn" className="w-full py-4 px-6 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 hover:border-blue-100 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95">
                  <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-6 h-6" />
                  Masuk dengan Akun Google
                </button>
              </div>
            </div>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <div className="relative flex justify-center text-[10px]"><span className="px-4 bg-white text-slate-400 font-bold uppercase tracking-widest">Atau via Username</span></div>
            </div>

            <form id="admin-login-form" className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Username</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">person</span>
                  <input 
                    type="text" id="username" name="username" required
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium"
                    placeholder="Masukkan username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                  <input 
                    type="password" id="password" name="password" required
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button type="submit" id="login-btn" className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95">
                <span className="material-symbols-outlined">login</span>
                Masuk ke Dashboard
              </button>
            </form>
          </div>
        </div>
      </main>

      <script dangerouslySetInnerHTML={{ __html: `
        const form = document.getElementById('admin-login-form');
        const loginBtn = document.getElementById('login-btn');
        const googleBtn = document.getElementById('google-login-btn');
        const errDiv = document.getElementById('login-error');
        const errText = document.getElementById('login-error-text');
        
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const username = document.getElementById('username').value;
          const password = document.getElementById('password').value;
          
          loginBtn.disabled = true;
          loginBtn.innerText = 'Memproses...';
          
          try {
            const res = await API.adminLogin(username, password);
            if (res.success) {
              window.location.href = '/admin/dashboard';
            } else {
              throw new Error(res.message);
            }
          } catch (err) {
            errText.innerText = err.message || 'Login gagal!';
            errDiv.classList.remove('hidden');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<span class="material-symbols-outlined">login</span> Masuk ke Dashboard';
          }
        });

        // Initialize Google Sign-In
        window.onload = async function () {
          try {
            const res = await fetch('/api/auth/google/client-id');
            const { data } = await res.json();
            
            if (data.clientId) {
              google.accounts.id.initialize({
                client_id: data.clientId,
                callback: handleGoogleResponse
              });
              
              // Custom click handler for our premium button
              googleBtn.onclick = () => {
                google.accounts.id.prompt();
              };
            } else {
              googleBtn.onclick = () => UI.toast('Google Sign-In belum dikonfigurasi (Client ID kosong).', 'error');
            }
          } catch (e) {
            console.error('Failed to init Google Sign-In:', e);
          }
        };

        async function handleGoogleResponse(response) {
          try {
            googleBtn.disabled = true;
            googleBtn.innerText = 'Memverifikasi Google...';
            
            const res = await API.request('/auth/google', {
              method: 'POST',
              body: JSON.stringify({ credential: response.credential })
            });
            
            if (res.success) {
              if (res.data.status === 'needs_referral') {
                 // Save temp data for activation + original credential
                 const fullData = { ...res.data, credential: response.credential };
                 localStorage.setItem('spmb_temp_google', JSON.stringify(fullData));
                 window.location.href = '/admin/activate';
              } else {
                 API.setToken(res.data.token);
                 localStorage.setItem('spmb_admin', JSON.stringify(res.data.admin));
                 window.location.href = '/admin/dashboard';
              }
            } else {
              throw new Error(res.message);
            }
          } catch (err) {
            errText.innerText = err.message || 'Login Google gagal!';
            errDiv.classList.remove('hidden');
            googleBtn.disabled = false;
            googleBtn.innerHTML = '<img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" class="w-6 h-6" /> Masuk dengan Akun Google';
          }
        }
      ` }} />
    </Layout>
  );
};
