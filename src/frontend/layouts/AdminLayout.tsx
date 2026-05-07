/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';

export const AdminLayout = (props: any) => {
  const currentPath = props.path || '';
  
  const menuItems = [
    { label: 'Dashboard', icon: 'dashboard', href: '/admin/dashboard' },
    { label: 'Data Siswa', icon: 'groups', href: '/admin/students' },
    { label: 'Verifikasi', icon: 'verified', href: '/admin/verify' },
    { label: 'Import Data', icon: 'upload_file', href: '/admin/import' },
    { label: 'Operator', icon: 'manage_accounts', href: '/admin/operators' },
    { label: 'Pengaturan', icon: 'settings', href: '/admin/settings' },
    { label: 'Profil Saya', icon: 'account_circle', href: '/admin/profile' },
  ];

  return (
    <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{props.title ? `${props.title} - Admin ${props.appName}` : `Admin ${props.appName}`}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&family=Public+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet" />
        <script src="/js/api.js"></script>
        <script src="/js/ui.js"></script>
        <script src="/js/admin/role-guard.js"></script>
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --primary: #003f87;
            --on-primary: #ffffff;
            --background: #f9f9fc;
            --surface: #ffffff;
            --outline: #72787f;
          }
          body { font-family: 'Public Sans', sans-serif; }
          h1, h2, h3, h4, .font-display { font-family: 'Lexend', sans-serif; }
        ` }} />
      </head>
      <body className="bg-slate-50 font-body text-slate-900 min-h-screen flex">
        {/* Sidebar */}
        <nav className="hidden md:flex flex-col fixed top-0 left-0 w-64 h-screen bg-white border-r border-slate-200 p-6 z-40">
          <div className="flex items-center gap-3 mb-10">
            <span className="material-symbols-outlined text-blue-600" style={{ fontSize: '32px' }}>admin_panel_settings</span>
            <span className="font-bold text-lg text-blue-900">{props.appName || 'SPMB'} Admin</span>
          </div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar -mx-2 px-2">
            <ul className="space-y-1">
              {/* Standalone: Dashboard */}
              <li>
                <a 
                  href="/admin/dashboard" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    currentPath === '/admin/dashboard' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>dashboard</span>
                  Dashboard
                </a>
              </li>

              {/* Accordion Group: Manajemen Data */}
              <li className="pt-2">
                <details className="group" open={['/admin/students', '/admin/verify', '/admin/import'].some(p => currentPath.startsWith(p))}>
                  <summary className="flex items-center justify-between px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] cursor-pointer hover:text-slate-600 transition-colors list-none">
                    <span>Manajemen Data</span>
                    <span className="material-symbols-outlined text-[16px] transition-transform group-open:rotate-180">expand_more</span>
                  </summary>
                  <ul className="space-y-1 mt-1 pl-2 border-l-2 border-slate-50 ml-4">
                    {[
                      { label: 'Data Siswa', icon: 'groups', href: '/admin/students' },
                      { label: 'Master Jalur', icon: 'alt_route', href: '/admin/admission-paths' },
                      { label: 'Verifikasi', icon: 'verified', href: '/admin/verify' },
                      { label: 'Import Data', icon: 'upload_file', href: '/admin/import' },
                    ].map((item) => (
                      <li key={item.href}>
                        <a 
                          href={item.href} 
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            currentPath.startsWith(item.href) 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{item.icon}</span>
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>

              {/* Accordion Group: Landing Page */}
              <li className="pt-2">
                <details className="group" open={currentPath.startsWith('/admin/landing')}>
                  <summary className="flex items-center justify-between px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] cursor-pointer hover:text-slate-600 transition-colors list-none">
                    <span>Landing Page</span>
                    <span className="material-symbols-outlined text-[16px] transition-transform group-open:rotate-180">expand_more</span>
                  </summary>
                  <ul className="space-y-1 mt-1 pl-2 border-l-2 border-slate-50 ml-4">
                    {[
                      { label: 'Header Hero', href: '/admin/landing/header' },
                      { label: 'Daftar Jalur', href: '/admin/landing/jalur' },
                      { label: 'Linimasa Jadwal', href: '/admin/landing/jadwal' },
                      { label: 'Berkas Wajib', href: '/admin/landing/berkas' },
                    ].map((item) => (
                      <li key={item.href}>
                        <a 
                          href={item.href} 
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            currentPath === item.href 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>

              {/* Accordion Group: Pengaturan */}
              <li className="pt-2">
                <details className="group" open={['/admin/operators', '/admin/settings', '/admin/profile'].some(p => currentPath.startsWith(p))}>
                  <summary className="flex items-center justify-between px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] cursor-pointer hover:text-slate-600 transition-colors list-none">
                    <span>Sistem & Profil</span>
                    <span className="material-symbols-outlined text-[16px] transition-transform group-open:rotate-180">expand_more</span>
                  </summary>
                  <ul className="space-y-1 mt-1 pl-2 border-l-2 border-slate-50 ml-4">
                    {[
                      { label: 'Operator', icon: 'manage_accounts', href: '/admin/operators' },
                      { label: 'Pengaturan', icon: 'settings', href: '/admin/settings' },
                      { label: 'Profil Saya', icon: 'account_circle', href: '/admin/profile' },
                    ].map((item) => (
                      <li key={item.href}>
                        <a 
                          href={item.href} 
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            currentPath.startsWith(item.href) 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{item.icon}</span>
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            </ul>
          </div>

          <button onclick="logout()" className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all text-sm font-semibold mt-auto">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
            Keluar
          </button>
        </nav>

        {/* Main Content */}
        <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-bold text-xl text-slate-800">{props.title || 'Dashboard'}</h1>
                <p className="text-xs text-slate-500 font-medium">{props.subtitle || 'Selamat datang kembali'}</p>
              </div>
              <div className="flex items-center gap-4">
                <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition">
                  <span className="material-symbols-outlined">notifications</span>
                </button>
                <div className="h-8 w-px bg-slate-200 mx-2"></div>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-800" id="adminNameDisplay">Admin</p>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Super Admin</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                    A
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-8 flex-1">
            {props.children}
          </main>
          
          <footer className="p-8 text-center text-slate-400 text-xs font-medium border-t border-slate-100">
            &copy; {new Date().getFullYear()} {props.schoolName || 'SMAN 1 Gedeg'} - {props.appName || 'SPMB'}
          </footer>
        </div>

        <script dangerouslySetInnerHTML={{ __html: `
          function logout() {
            API.logout();
          }
          // Populate admin name from storage
          document.addEventListener('DOMContentLoaded', () => {
            const admin = JSON.parse(localStorage.getItem('spmb_admin') || '{}');
            if (admin.nama) {
              const el = document.getElementById('adminNameDisplay');
              if (el) el.textContent = admin.nama;
            }
          });
        ` }} />
      </body>
    </html>
  );
};
