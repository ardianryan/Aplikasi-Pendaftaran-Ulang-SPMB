/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';
import { Layout } from '../layouts/Layout';

export const StudentProfile = (props: any) => {
  return (
    <Layout title="Profil Saya" {...props}>
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <a href="/wizard" className="material-symbols-outlined text-slate-500 hover:text-blue-600 transition-colors">arrow_back</a>
            <span className="font-bold text-slate-800">Profil Siswa</span>
          </div>
          <button onclick="API.logout()" className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <span className="material-symbols-outlined text-slate-500">logout</span>
          </button>
        </div>
      </header>

      <main className="p-4 md:p-8 lg:p-12 bg-slate-50 min-h-[calc(100vh-64px)]">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white flex flex-col items-center">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4 border-4 border-white/30">
                <span className="material-symbols-outlined text-5xl">person</span>
              </div>
              <h2 className="text-2xl font-bold text-center" id="display-nama">Memuat...</h2>
              <p className="text-blue-100 text-sm opacity-80" id="display-nisn">NISN: ...</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Informasi Login</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">NISN (Username)</p>
                      <p className="font-bold text-slate-800" id="info-nisn">...</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Tanggal Lahir (Password)</p>
                      <p className="font-bold text-slate-800" id="info-tgl">...</p>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                    <span className="material-symbols-outlined text-blue-600 text-xl">info</span>
                    <p className="text-xs text-blue-800 leading-relaxed font-medium">
                      Data login Anda bersifat tetap sesuai dengan data hasil seleksi. Jika terdapat kesalahan data, harap hubungi panitia pendaftaran.
                    </p>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <a href="/wizard" className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all flex items-center gap-2 shadow-lg">
                    <span className="material-symbols-outlined">edit_note</span>
                    Lanjutkan Pengisian Data
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <script dangerouslySetInnerHTML={{ __html: `
        async function loadStudentProfile() {
          try {
            const res = await API.getProfile();
            if (res.success) {
              const s = res.data;
              document.getElementById('display-nama').textContent = s.nama;
              document.getElementById('display-nisn').textContent = 'NISN: ' + s.nisn;
              document.getElementById('info-nisn').textContent = s.nisn;
              
              const tgl = new Date(s.tanggalLahir);
              document.getElementById('info-tgl').textContent = tgl.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              });
            }
          } catch (err) {
            console.error(err);
          }
        }
        loadStudentProfile();
      ` }} />
    </Layout>
  );
};
