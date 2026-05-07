/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';
import { Layout } from '../layouts/Layout';

export const AdminActivate = (props: any) => {
  return (
    <Layout title="Aktivasi Akun" {...props}>
      <main className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 md:p-10">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-emerald-600 text-4xl">verified_user</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-800">Aktivasi Operator</h1>
              <p className="text-slate-500 mt-2">Gunakan kode referral dari Admin untuk mengaktifkan akun Google Anda.</p>
            </div>

            <div id="user-info" className="mb-8 p-4 bg-slate-50 rounded-2xl flex items-center gap-4">
               <img id="user-avatar" src="" className="w-12 h-12 rounded-full bg-slate-200" />
               <div>
                  <p id="user-name" className="font-bold text-slate-800"></p>
                  <p id="user-email" className="text-xs text-slate-500"></p>
               </div>
            </div>

            <div id="activate-error" className="hidden mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <span className="material-symbols-outlined text-red-500">error</span>
              <p id="activate-error-text" className="text-sm text-red-600 font-medium"></p>
            </div>

            <form id="activate-form" className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Kode Referral</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">key</span>
                  <input 
                    type="text" id="referralCode" name="referralCode" required
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:bg-white focus:border-emerald-500 outline-none transition-all font-mono text-lg tracking-widest uppercase"
                    placeholder="PREFIX-XXXX"
                  />
                </div>
              </div>

              <button type="submit" id="activate-btn" className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 active:scale-95">
                <span className="material-symbols-outlined">bolt</span>
                Aktifkan Sekarang
              </button>
              
              <button type="button" onclick="window.location.href='/admin/login'" className="w-full py-3 text-slate-400 text-sm font-semibold hover:text-slate-600 transition-all">
                Batal & Keluar
              </button>
            </form>
          </div>
        </div>
      </main>

      <script dangerouslySetInnerHTML={{ __html: `
        const form = document.getElementById('activate-form');
        const activateBtn = document.getElementById('activate-btn');
        const errDiv = document.getElementById('activate-error');
        const errText = document.getElementById('activate-error-text');
        
        // Load temp google data
        const tempData = JSON.parse(localStorage.getItem('spmb_temp_google') || 'null');
        if (!tempData) {
           window.location.href = '/admin/login';
        } else {
           // PRIORITIZE SSO NAME (from ScholarGate) over Google Name
           document.getElementById('user-name').innerText = tempData.ssoName || tempData.googleName || 'User';
           document.getElementById('user-email').innerText = tempData.googleEmail || 'Email tidak tersedia';
           if (tempData.googlePicture) document.getElementById('user-avatar').src = tempData.googlePicture;
        }

        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const referralCode = document.getElementById('referralCode').value;
          
          activateBtn.disabled = true;
          activateBtn.innerText = 'Mengaktifkan...';
          
          try {
            const res = await API.request('/auth/activate-operator', {
              method: 'POST',
              body: JSON.stringify({ 
                referralCode,
                email: tempData.googleEmail,
                name: tempData.googleName,
                picture: tempData.googlePicture,
                ssoId: tempData.ssoId,
                credential: tempData.credential,
                ssoNip: tempData.ssoNip,
                ssoRole: tempData.ssoRole
              })
            });
            
            if (res.success) {
              localStorage.removeItem('spmb_temp_google');
              API.setToken(res.data.token);
              localStorage.setItem('spmb_admin', JSON.stringify(res.data.admin));
              window.location.href = '/admin/dashboard';
            } else {
              throw new Error(res.message);
            }
          } catch (err) {
            errText.innerText = err.message || 'Aktivasi gagal!';
            errDiv.classList.remove('hidden');
            activateBtn.disabled = false;
            activateBtn.innerHTML = '<span class="material-symbols-outlined">bolt</span> Aktifkan Sekarang';
          }
        });
      ` }} />
    </Layout>
  );
};
