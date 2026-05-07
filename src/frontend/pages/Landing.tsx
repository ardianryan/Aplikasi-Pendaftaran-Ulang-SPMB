/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';
import { Layout } from '../layouts/Layout';

export const Landing = (props: any) => {
  const settings = props.settings || {};
  
  // Parse dynamic lists from settings
  const jalurList = settings.landing_jalur_json || [];
  const timelineList = settings.landing_timeline_json || [];
  const berkasList = (settings.landing_berkas_json || []).filter((b: any) => b.active !== false);

  return (
    <Layout {...props}>
      <style dangerouslySetInnerHTML={{ __html: `
        .glass-card {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.4);
            box-shadow: 0 8px 32px 0 rgba(10, 37, 64, 0.1);
        }
        .glass-dark {
            background: rgba(10, 37, 64, 0.6);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
        }
        .parallax-layer {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            will-change: transform;
        }
        .text-gradient {
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-image: linear-gradient(to right, #38BDF8, #F59E0B);
        }
        #main-nav.scrolled {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(0,0,0,0.05);
            padding: 0.75rem 0;
        }
      ` }} />

      {/* Navigation */}
      <nav id="main-nav" className="fixed top-0 z-[100] w-full py-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {settings.app_logo ? (
              <img src={settings.app_logo} alt="Logo" className="w-10 h-10 object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-variant flex items-center justify-center text-white font-display font-bold">
                {settings.app_name?.substring(0, 2) || 'SG'}
              </div>
            )}
            <div className="text-xl font-display font-bold text-primary">
              {settings.school_name || 'SMAN 1 Gedeg'}
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a className="hidden md:block font-bold text-on-surface-variant hover:text-primary transition-colors" href="#jalur">Jalur</a>
            <a className="hidden md:block font-bold text-on-surface-variant hover:text-primary transition-colors" href="#jadwal">Jadwal</a>
            <a className="hidden md:block font-bold text-on-surface-variant hover:text-primary transition-colors" href="#berkas">Berkas</a>
            <a href="/login" className="bg-primary text-white px-6 py-2.5 rounded-full font-bold hover:bg-primary-variant transition-all flex items-center gap-2 shadow-lg shadow-primary/20 scale-100 hover:scale-105 active:scale-95">
              <span className="material-symbols-outlined text-[18px]">login</span>
              Masuk Portal
            </a>
          </div>
        </div>
      </nav>

      <main className="relative w-full">
        {/* Hero Section */}
        <section className="relative h-[100vh] min-h-[800px] flex items-center justify-center overflow-hidden bg-primary">
          {/* Parallax Background Layers */}
          <div className="parallax-layer z-0" id="hero-bg-sky" style={{ transform: 'translateY(0)' }}>
            <img alt="Sky background" class="w-full h-full object-cover opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuACD-OMS6KmnlEV5SrS8pTwFswD-G4sZTy4xeNTWXrpukIsElBVPk0qB53hqySSa4SEQxFaTGffBq0ml6wLTKNPAoVMV83FIm9xFyvbkKGPFM_0GrjDLor1W2_si6B5qA_mc-BkjoxDDkkp-bJOVwhtUMiknIviiQ5CdvO9BeNySJPDaOQSlq_M9QFwEz3Qi4_FeyRjXB5EWg8A0019t9Oc_cdv3aXOWJK8NUcK4oxBjuwCFXxhtSvnkJw-HMbk2vvgTyErmF3MGUU"/>
          </div>
          <div className="parallax-layer z-10" id="hero-bg-building" style={{ transform: 'translateY(0)' }}>
            <img alt="School building abstract" class="w-full h-full object-cover opacity-40 mix-blend-overlay" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpyJmvAd7dcwth9kBdkrMS8Dw8DzVfDLotFqCcZdnFG17O74_AWsmFmU6ci2LDfFqhQgJVQCLfeABktKAv5XeBuiTa-3tks1UnWg_VS2IbY0MtyTd9YWPvxIAt8wh5mGRla2kq4p4kPldqr14bBcVLJES7XhBnd2NDAdcLvQcgMSCIdw3wRmQOKI0FIE4KMtxgcC1MaIC5IEeofoeBr1Ibgh_Mf2uXJ5mnMsbl3l-3QmZg7i4mpXleW-bxloR8SVxfYdc8Bzyt-s4"/>
          </div>
          
          <div className="absolute inset-0 z-20 bg-hero-gradient"></div>

          <div className="relative z-40 max-w-7xl mx-auto px-6 text-center flex flex-col items-center mt-20">
            {props.closedMessage && new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('closed') === '1' && (
              <div className="mb-8 p-4 bg-red-500/20 border border-red-500/50 backdrop-blur-md rounded-2xl text-white text-sm font-medium animate-bounce">
                <div className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-red-400">warning</span>
                  {props.closedMessage}
                </div>
              </div>
            )}

            <div className="glass-dark inline-flex items-center gap-3 px-6 py-2 rounded-full text-secondary font-medium mb-8 border border-secondary/30 animate-fade-in">
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
              <span className="tracking-widest uppercase text-xs font-bold">Portal Resmi {settings.school_year || '2024/2025'}</span>
            </div>
            <h1 className="font-display font-extrabold text-6xl md:text-8xl text-white mb-6 leading-tight drop-shadow-2xl translate-y-0 opacity-100 transition-all duration-1000">
              {settings.landing_hero_title || 'Registrasi Ulang'} <br/>
              <span className="text-gradient">{settings.landing_hero_title_accent || `SPMB ${settings.school_year?.split('/')[0] || '2024'}`}</span>
            </h1>
            <p className="font-sans text-xl text-blue-100 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
              {settings.landing_hero_subtitle || 'Selamat datang calon peserta didik baru. Selesaikan tahapan akhir pendaftaran Anda.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              {(settings.registration_open === true || settings.registration_open === 'true') ? (
                <a href="/login" className="bg-secondary text-primary px-10 py-5 rounded-2xl font-display font-bold text-lg hover:bg-white transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(56,189,248,0.4)] flex items-center justify-center gap-3">
                  Mulai Registrasi
                  <span className="material-symbols-outlined">arrow_forward</span>
                </a>
              ) : (
                <div className="bg-slate-800/80 backdrop-blur-md text-slate-400 px-10 py-5 rounded-2xl font-display font-bold text-lg border border-slate-700 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-500">lock</span>
                    Pendaftaran Ditutup
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-sans">{settings.registration_closed_message || 'Saat ini akses registrasi sedang ditutup'}</p>
                </div>
              )}
              <button className="glass-dark text-white border border-white/20 px-10 py-5 rounded-2xl font-display font-medium text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                <span className="material-symbols-outlined">play_circle</span>
                Tonton Panduan
              </button>
            </div>
          </div>
          
          {/* Scroll Down Hint */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 text-white/50 animate-bounce cursor-pointer" onclick="document.getElementById('jalur').scrollIntoView({behavior:'smooth'})">
            <span className="material-symbols-outlined text-4xl">keyboard_double_arrow_down</span>
          </div>
        </section>

        {/* Jalur Pendaftaran */}
        <section className="relative py-32 px-6" id="jalur">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-variant/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 -left-20 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-16 items-center">
              <div className="w-full md:w-1/3">
                <h2 className="font-display text-4xl md:text-5xl font-bold text-primary mb-6 leading-tight">
                  Jalur <br/><span className="text-secondary">Pendaftaran</span>
                </h2>
                <p className="text-lg text-on-surface-variant mb-8 leading-relaxed">
                  Pilih jalur yang sesuai dengan kualifikasi Anda. Sistem kami akan memandu Anda melalui persyaratan spesifik setiap jalur.
                </p>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full border-2 border-primary/20 flex items-center justify-center text-primary hover:border-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined">arrow_back</span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary-variant transition-colors shadow-lg shadow-primary/20 cursor-pointer">
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-2/3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {jalurList.map((jalur: any, idx: number) => (
                    <div key={idx} className={`p-8 rounded-3xl transition-all duration-500 relative overflow-hidden group ${idx === 1 ? 'bg-gradient-to-br from-primary to-primary-variant text-white shadow-2xl shadow-primary/30' : 'glass-card hover:-translate-y-2'}`}>
                      {jalur.badge && (
                        <div className="absolute top-4 right-4 bg-accent text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                          {jalur.badge}
                        </div>
                      )}
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${idx === 1 ? 'bg-white/20 backdrop-blur-sm border border-white/20' : 'bg-gradient-to-br from-primary to-primary-variant text-white shadow-primary/20'}`}>
                        <span className="material-symbols-outlined text-[28px]">{jalur.icon}</span>
                      </div>
                      <h3 className="font-display text-2xl font-bold mb-4">{jalur.title}</h3>
                      <p className={`mb-6 min-h-[80px] ${idx === 1 ? 'text-blue-100' : 'text-on-surface-variant'}`}>{jalur.desc}</p>
                      <a href="#" className={`inline-flex items-center gap-2 font-bold transition-colors ${idx === 1 ? 'text-secondary hover:text-white' : 'text-primary hover:text-secondary'}`}>
                        Detail Syarat <span className="material-symbols-outlined text-sm">chevron_right</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Jadwal (Timeline) */}
        <section className="py-32 px-6 bg-white relative" id="jadwal">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-primary mb-6">Linimasa <span className="text-secondary">SPMB</span></h2>
              <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">Pastikan Anda tidak tertinggal tahapan penting. Jadwal dapat berubah menyesuaikan kebijakan dinas pendidikan.</p>
            </div>
            <div className="relative max-w-4xl mx-auto">
              <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-secondary to-primary/10 rounded-full transform md:-translate-x-1/2"></div>
              
              {timelineList.map((item: any, idx: number) => (
                <div key={idx} className={`relative flex flex-col md:flex-row justify-between items-center mb-16 md:mb-24 group ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                  <div className={`hidden md:block w-5/12 ${idx % 2 !== 0 ? 'text-left pl-12' : 'text-right pr-12'}`}>
                    <h4 className={`font-display text-2xl font-bold mb-2 ${item.highlight ? 'text-accent' : 'text-primary'}`}>{item.title}</h4>
                    <p className="text-on-surface-variant">{item.desc}</p>
                  </div>
                  
                  <div className={`absolute left-4 md:left-1/2 w-8 h-8 rounded-full border-4 border-white shadow-lg transform -translate-x-1/2 flex items-center justify-center z-10 transition-all duration-500 group-hover:scale-125 ${item.highlight ? 'bg-accent animate-bounce w-10 h-10' : 'bg-primary'}`}>
                    {item.highlight ? (
                      <span className="material-symbols-outlined text-white text-[18px]">star</span>
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-secondary"></div>
                    )}
                  </div>
                  
                  <div className="w-full md:w-5/12 pl-12 md:pl-0 md:group-odd:pl-12 md:group-even:pr-12">
                    <div className={`p-6 rounded-2xl border-l-4 transition-all duration-500 group-hover:shadow-xl ${item.highlight ? 'bg-accent/10 border-accent' : 'glass-card border-primary group-even:border-l-4 md:group-even:border-l-0 md:group-even:border-r-4 group-even:md:text-right'}`}>
                      <div className={`font-extrabold text-xl mb-1 ${item.highlight ? 'text-accent text-2xl' : 'text-secondary'}`}>{item.date}</div>
                      <div className="md:hidden mt-2">
                        <h4 className="font-display text-lg font-bold text-primary">{item.title}</h4>
                        <p className="text-sm text-on-surface-variant">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Persyaratan Berkas */}
        <section className="py-32 px-6 bg-primary text-white relative overflow-hidden" id="berkas">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-primary-variant via-primary to-primary rounded-full blur-3xl opacity-50 transform translate-x-1/3 -translate-y-1/4 pointer-events-none"></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="w-full lg:w-5/12">
                <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-secondary text-sm font-bold tracking-wide mb-6 backdrop-blur-md">
                  <span className="material-symbols-outlined text-[18px]">folder_open</span>
                  DOKUMEN WAJIB
                </div>
                <h2 className="font-display text-4xl md:text-6xl font-bold mb-6 leading-tight">
                  Persiapan <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-blue-200">Berkas</span>
                </h2>
                <p className="text-blue-100/80 text-lg mb-10 leading-relaxed">
                  Siapkan scan dokumen asli berikut dalam format PDF/JPG (maksimal 1MB). Pastikan dokumen terlihat jelas dan tidak terpotong untuk kelancaran proses verifikasi.
                </p>
                <a href="#" className="w-full sm:w-auto glass-dark border border-secondary/50 text-white px-8 py-4 rounded-xl font-display font-bold hover:bg-secondary hover:text-primary transition-all flex items-center justify-center gap-3 group">
                  <span className="material-symbols-outlined group-hover:-translate-y-1 transition-transform">download</span>
                  Unduh Format Surat Pernyataan
                </a>
              </div>
              <div className="w-full lg:w-7/12">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {berkasList.map((berkas: any, idx: number) => (
                    <div key={idx} className="glass-dark p-6 rounded-2xl border border-white/10 hover:border-secondary/50 transition-colors group">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-secondary mb-4 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">{berkas.icon}</span>
                      </div>
                      <h4 className="font-display font-bold text-lg mb-2">{berkas.title}</h4>
                      <p className="text-sm text-blue-100/60">{berkas.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#051120] text-blue-100/60 border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            {settings.app_logo ? (
              <img src={settings.app_logo} alt="Logo" className="w-12 h-12 object-contain" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-display font-bold text-xl">
                {settings.app_name?.substring(0, 2) || 'SG'}
              </div>
            )}
            <div className="font-sans text-sm font-medium">
              © {new Date().getFullYear()} Panitia {settings.app_name || 'SPMB'} {settings.school_name || 'SMAN 1 Gedeg'}.
            </div>
          </div>
          <div className="flex gap-8 text-sm font-bold uppercase tracking-wider">
            <a className="hover:text-white transition-colors" href="#">Bantuan</a>
            <a className="hover:text-white transition-colors" href="#">Panduan</a>
            <a className="hover:text-white transition-colors" href="#">Kontak</a>
          </div>
        </div>
      </footer>

      {/* Parallax & Logic Scripts */}
      <script dangerouslySetInnerHTML={{ __html: `
        window.addEventListener('scroll', () => {
          const nav = document.getElementById('main-nav');
          const scrollY = window.scrollY;
          
          // Navigation sticky effect
          if (scrollY > 50) {
            nav.classList.add('scrolled');
          } else {
            nav.classList.remove('scrolled');
          }

          // Parallax Hero effect
          const sky = document.getElementById('hero-bg-sky');
          const building = document.getElementById('hero-bg-building');
          
          if (scrollY < window.innerHeight) {
            sky.style.transform = \`translateY(\${scrollY * 0.4}px) scale(\${1 + scrollY * 0.0005})\`;
            building.style.transform = \`translateY(\${scrollY * 0.2}px) scale(\${1 + scrollY * 0.0002})\`;
          }
        });

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });
      ` }} />
    </Layout>
  );
};
