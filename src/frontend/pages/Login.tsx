/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';
import { Layout } from '../layouts/Layout';

export const Login = (props: any) => {
  return (
    <Layout title="Login" {...props}>
      <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          {/* Left Panel */}
          <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

            <span className="material-symbols-outlined text-7xl mb-6">school</span>
            <h1 className="text-3xl font-extrabold text-center mb-4">{props.schoolName || 'SMAN 1 Gedeg'}</h1>
            <p className="text-blue-100 text-center leading-relaxed opacity-90">
              {props.appName || 'SPMB'} — Portal Registrasi Ulang <br /> Calon Murid Baru
            </p>
          </div>

          {/* Right Panel */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Masuk</h2>
              <p className="text-slate-500 text-sm">Gunakan NISN dan Tanggal Lahir Anda.</p>
            </div>

            <div id="login-error" className="hidden mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <span className="material-symbols-outlined text-red-500">error</span>
              <p id="login-error-text" className="text-sm text-red-600 font-medium"></p>
            </div>

            {props.settings?.registration_open !== false ? (
              <form id="login-form" className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">NISN</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">badge</span>
                    <input
                      type="text" id="nisn" name="nisn" maxLength={10} required
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="10 digit NISN"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tanggal Lahir</label>
                  <div className="flex gap-2">
                    <input type="text" id="tgl-hari" placeholder="Tgl" maxLength={2} className="w-16 text-center py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    <select id="tgl-bulan" className="flex-1 py-3 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">Bulan</option>
                      {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
                        <option value={(i + 1).toString().padStart(2, '0')}>{m}</option>
                      ))}
                    </select>
                    <input type="text" id="tgl-tahun" placeholder="Tahun" maxLength={4} className="w-24 text-center py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                <button type="submit" id="login-btn" className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">login</span>
                  Masuk
                </button>
              </form>
            ) : (
              <div className="p-8 bg-red-50 border border-red-100 rounded-3xl flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-3xl">lock</span>
                </div>
                <div>
                  <h3 className="font-bold text-red-900 mb-1">Akses Ditutup</h3>
                  <p className="text-sm text-red-700 leading-relaxed font-medium">
                    {props.settings?.registration_closed_message || 'Maaf, akses login portal registrasi ulang sedang ditutup oleh panitia.'}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-8 text-center">
              <a href="/" className="text-sm text-slate-500 hover:text-blue-600 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Kembali ke Beranda
              </a>
            </div>
          </div>
        </div>
      </main>

      <script dangerouslySetInnerHTML={{
        __html: `
        const form = document.getElementById('login-form');
        const loginBtn = document.getElementById('login-btn');
        
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const nisn = document.getElementById('nisn').value;
          const hari = document.getElementById('tgl-hari').value;
          const bulan = document.getElementById('tgl-bulan').value;
          const tahun = document.getElementById('tgl-tahun').value;
          
          if (!nisn || !hari || !bulan || !tahun) {
            UI.toast('Lengkapi semua data!', 'error');
            return;
          }

          const tanggalLahir = \`\${tahun}-\${bulan}-\${hari.padStart(2, '0')}\`;
          
          loginBtn.disabled = true;
          loginBtn.innerText = 'Memproses...';
          
          try {
            await API.login(nisn, tanggalLahir);
            window.location.href = '/wizard';
          } catch (err) {
            const errDiv = document.getElementById('login-error');
            const errText = document.getElementById('login-error-text');
            errText.innerText = err.message || 'Login gagal!';
            errDiv.classList.remove('hidden');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<span class="material-symbols-outlined">login</span> Masuk';
          }
        });
      ` }} />
    </Layout>
  );
};
