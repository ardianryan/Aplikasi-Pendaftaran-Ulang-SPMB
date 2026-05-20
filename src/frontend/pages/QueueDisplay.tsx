/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';

/**
 * QueueDisplay — Halaman display antrean publik
 * Untuk TV sekolah dan akses siswa dari rumah
 * TIDAK memerlukan login, TIDAK ada sidebar admin
 */
export const QueueDisplay = (props: any) => {
  const settings = props.settings || {};
  const appName = settings.app_name || 'SPMB';
  const schoolName = settings.school_name || 'SMAN 1 Gedeg';
  const displayTitle = settings.queue_display_title || 'Antrean Verifikasi SPMB';
  const displaySubtitle = settings.queue_display_subtitle || '';
  const appLogo = settings.app_logo || '';

  return (
    <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{displayTitle} — {schoolName}</title>
        <link rel="icon" href={settings.app_icon || '/favicon.ico'} />
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          * { box-sizing: border-box; }
          body {
            font-family: 'Lexend', sans-serif;
            background: #0a0f1e;
            color: white;
            min-height: 100vh;
            overflow: hidden;
            transition: background-color 0.3s, color 0.3s;
          }
          .font-mono-display { font-family: 'JetBrains Mono', monospace; }

          /* ============================================
             AESTHETIC & PREMIUM LIGHT MODE DEFINITION
             ============================================ */
          body.light-mode {
            background: #f8fafc; /* Slate-50 */
            color: #1e293b;      /* Slate-800 */
          }

          /* Override Utility Teks Putih Tailwind pada Light Mode agar terbaca sangat tajam */
          body.light-mode .text-white { color: #0f172a !important; }      /* Slate-900 */
          body.light-mode .text-white\\/90 { color: #0f172a !important; }
          body.light-mode .text-white\\/60 { color: #334155 !important; }   /* Slate-700 */
          body.light-mode .text-white\\/50 { color: #475569 !important; }   /* Slate-600 */
          body.light-mode .text-white\\/40 { color: #475569 !important; }   /* Slate-600 */
          body.light-mode .text-white\\/30 { color: #475569 !important; }   /* Slate-600 */
          body.light-mode .text-white\\/20 { color: #64748b !important; }   /* Slate-500 */
          
          /* Override warna teks biru muda di light mode agar kontras tinggi */
          body.light-mode .text-blue-300 { color: #1d4ed8 !important; } /* Blue-700 */
          body.light-mode .bg-blue-500\\/20 { background: rgba(59, 130, 246, 0.15) !important; }
          body.light-mode .border-blue-500\\/30 { border-color: rgba(59, 130, 246, 0.3) !important; }

          body.light-mode header {
            background: rgba(255, 255, 255, 0.9) !important;
            border-bottom: 1px solid rgba(148, 163, 184, 0.2) !important;
          }

          body.light-mode .glass-card {
            background: rgba(255, 255, 255, 0.8) !important;
            backdrop-filter: blur(16px);
            border-color: rgba(148, 163, 184, 0.2) !important;
            color: #1e293b !important;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.03) !important;
          }

          body.light-mode #clockTime { color: #0f172a !important; }
          body.light-mode .counter-row:nth-child(odd) { background: rgba(148, 163, 184, 0.06); }
          body.light-mode .border-white\\/08 { border-color: rgba(148, 163, 184, 0.2) !important; }
          body.light-mode .border-white\\/10 { border-color: rgba(148, 163, 184, 0.2) !important; }
          body.light-mode .border-white\\/5 { border-color: rgba(148, 163, 184, 0.15) !important; }
          body.light-mode .bg-white\\/5 { background: rgba(148, 163, 184, 0.1) !important; }
          body.light-mode .sse-indicator-bg { background: rgba(148, 163, 184, 0.1) !important; }
          
          body.light-mode #announcementContainer { border-right-color: rgba(148, 163, 184, 0.2) !important; }
          body.light-mode #rightSection { border-left-color: rgba(148, 163, 184, 0.2) !important; }
          body.light-mode #offlineState { color: #334155 !important; }
          body.light-mode #waitingSection { border-top-color: rgba(148, 163, 184, 0.2) !important; }

          /* Custom Prose for Quill rendering */
          #announcementHtmlView {
            font-size: 1.1rem;
            line-height: 1.6;
          }
          #announcementHtmlView h1 { font-size: 2rem; font-weight: 800; margin-bottom: 1rem; color: #fff; }
          #announcementHtmlView h2 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.75rem; color: #fff; }
          #announcementHtmlView h3 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; color: #fff; }
          #announcementHtmlView p { margin-bottom: 1rem; }
          #announcementHtmlView ul, #announcementHtmlView ol { margin-left: 1.5rem; margin-bottom: 1rem; list-style-type: unset; }
          #announcementHtmlView li { margin-bottom: 0.25rem; }
          #announcementHtmlView strong { font-weight: 700; color: #fff; }

          body.light-mode #announcementHtmlView { color: #334155 !important; }
          body.light-mode #announcementHtmlView * { color: inherit; }
          body.light-mode #announcementHtmlView h1,
          body.light-mode #announcementHtmlView h2,
          body.light-mode #announcementHtmlView h3,
          body.light-mode #announcementHtmlView strong { color: #0f172a !important; }
          body.light-mode #announcementHtmlView [style*="color"] { color: #334155 !important; }
          body.light-mode .text-slate-300 { color: #475569 !important; }
          body.light-mode .text-slate-400 { color: #334155 !important; }

          /* Animasi flash saat nomor baru dipanggil */
          @keyframes flashPulse {
            0%   { background: inherit; box-shadow: none; }
            20%  { background: #1a3a6b; box-shadow: 0 0 80px 20px rgba(59, 130, 246, 0.6); }
            40%  { background: inherit; box-shadow: none; }
            60%  { background: #1a3a6b; box-shadow: 0 0 80px 20px rgba(59, 130, 246, 0.6); }
            100% { background: inherit; box-shadow: none; }
          }
          body.light-mode @keyframes flashPulse {
            0%   { background: inherit; box-shadow: none; }
            20%  { background: #bfdbfe; box-shadow: 0 0 80px 20px rgba(59, 130, 246, 0.4); }
            40%  { background: inherit; box-shadow: none; }
            60%  { background: #bfdbfe; box-shadow: 0 0 80px 20px rgba(59, 130, 246, 0.4); }
            100% { background: inherit; box-shadow: none; }
          }

          @keyframes slideIn {
            from { transform: translateY(-30px) scale(0.9); opacity: 0; }
            to   { transform: translateY(0) scale(1); opacity: 1; }
          }
          @keyframes tickerPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          @keyframes gradientShift {
            0%   { background-position: 0% 50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          .flash-animate { animation: flashPulse 1.2s ease-in-out; }
          .slide-in { animation: slideIn 0.5s ease-out; }
          .ticker-pulse { animation: tickerPulse 2s infinite; }

          .number-gradient {
            background: linear-gradient(135deg, #60a5fa, #a78bfa, #34d399);
            background-size: 200% 200%;
            animation: gradientShift 4s ease infinite;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .glass-card {
            background: rgba(255,255,255,0.04);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255,255,255,0.08);
          }

          .counter-row:nth-child(odd) { background: rgba(255,255,255,0.02); }
          
          /* Scrollbar hide for waiting list */
          .no-scroll::-webkit-scrollbar { display: none; }
          .no-scroll { -ms-overflow-style: none; scrollbar-width: none; }

          /* Status badge offline */
          .status-offline { color: #ef4444; }
          .status-online { color: #34d399; }

          /* Waiting list animation */
          @keyframes waitingIn {
            from { opacity: 0; transform: translateX(20px); }
            to   { opacity: 1; transform: translateX(0); }
          }
          .waiting-item { animation: waitingIn 0.3s ease-out; }
        ` }} />
      </head>
      <body onclick="if(window.initAudio) window.initAudio()">
        {/* ===== AUDIO ACTIVATE OVERLAY ===== */}
        <div id="audioOverlay"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 transition-all"
          style={{ background: 'rgba(10,15,30,0.92)', backdropFilter: 'blur(16px)' }}>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-sm text-center shadow-2xl space-y-6">
            <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center text-4xl mx-auto animate-bounce">
              🔊
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Aktifkan Suara Antrean</h3>
              <p className="text-xs text-white/40 leading-relaxed">
                Browser membatasi pemutaran suara secara otomatis. Ketuk tombol di bawah untuk mengaktifkan suara bel dan panggilan suara TV sekolah.
              </p>
            </div>
            <button
              onclick="if(window.initAudio) window.initAudio()"
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold rounded-2xl shadow-lg transition-all text-sm">
              🔊 Aktifkan Bel & Panggilan Suara
            </button>
          </div>
        </div>

        {/* ===== FLOATING THEME TOGGLE BUTTON ===== */}
        <button id="themeToggleBtn" className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all transform active:scale-95 text-xl font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-md">
          🌙
        </button>

        {/* ===== HEADER ===== */}
        <div id="mainBody" className="flex flex-col h-screen">
          <header className="flex items-center justify-between px-8 py-4 border-b border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center gap-4">
              {appLogo ? (
                <img src={appLogo} alt="Logo" className="w-10 h-10 object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 text-lg font-bold">
                  {appName.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-xs text-white/40 uppercase tracking-widest font-medium">{schoolName}</p>
                <p className="text-base font-bold text-white leading-none">{displayTitle}</p>
                {displaySubtitle && <p className="text-xs text-blue-300 mt-0.5">{displaySubtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div id="clockTime" className="font-mono-display text-2xl font-bold text-white tabular-nums">00:00:00</div>
                <div id="clockDate" className="text-xs text-white/40 mt-0.5">Senin, 1 Januari 2025</div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold sse-indicator-bg" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <span id="sseIndicator" className="w-2 h-2 rounded-full bg-gray-500"></span>
                <span id="sseStatus" className="text-white/40">Memuat...</span>
              </div>
            </div>
          </header>

          {/* ===== MAIN CONTENT WRAPPER ===== */}
          <div id="contentWrapper" className="flex-1 flex overflow-hidden">
            
            {/* ===== COLUMN 1: CONTAINER PENGUMUMAN & MEDIA (KIRI, DILIPAT/DITAMPILKAN DINAMIS - ONLINE MAUPUN OFFLINE) ===== */}
            <div id="announcementContainer" className="hidden w-96 md:w-[35%] flex flex-col overflow-hidden bg-black/10 relative border-r border-white/08" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              {/* HTML Render */}
              <div id="announcementHtmlView" className="hidden flex-1 overflow-y-auto p-8 max-w-none text-slate-200">
                {/* HTML Quill disuntikkan di sini */}
              </div>
              {/* YouTube Video Embed */}
              <div id="announcementYtView" className="hidden w-full h-full relative">
                <iframe id="announcementYtIframe" className="absolute top-0 left-0 w-full h-full border-0" allow="autoplay; encrypted-media; clipboard-write" allowfullscreen></iframe>
              </div>
            </div>

            {/* ===== COLUMN 2: AREA UTAMA (TENGAH, BISA BERUPA OFFLINE STATE ATAU NOMOR DIPANGGIL) ===== */}
            <div id="leftSection" className="flex-1 flex flex-col overflow-hidden relative">
              
              {/* ===== SESSION OFFLINE STATE ===== */}
              <div id="offlineState" class="hidden flex-1 flex flex-col items-center justify-center gap-6 p-8">
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl bg-white/5 border border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  🏫
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-white/90 mb-2">Belum Ada Sesi Antrean</p>
                  <p className="text-white/30 text-sm max-w-md">Sesi antrean verifikasi atau daftar ulang belum dimulai oleh petugas loket.</p>
                </div>
                <div className="ticker-pulse flex items-center gap-2 text-white/20 text-sm bg-white/5 px-4 py-2 rounded-full border border-white/5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  Menunggu sesi dimulai...
                </div>
              </div>

              {/* ===== NOMOR DIPANGGIL ===== */}
              <div id="mainDisplay" className="hidden flex-1 flex flex-col items-center justify-center px-8 gap-6 transition-all">
                <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/30">Nomor Dipanggil</p>

                <div id="ticketNumberDisplay" className="slide-in text-center">
                  <div id="ticketNumber" className="number-gradient font-mono-display font-black leading-none select-none"
                    style={{ fontSize: 'clamp(5rem, 18vw, 14rem)' }}>
                    —
                  </div>
                </div>

                <div id="counterDisplay" className="text-center">
                  <p className="text-lg font-medium text-white/50 tracking-widest uppercase" id="counterName">—</p>
                </div>

                {/* Nama siswa (jika student link aktif) */}
                <div id="studentNameDisplay" class="hidden text-center mt-2">
                  <p className="text-sm text-white/30 uppercase tracking-widest mb-1">Atas Nama</p>
                  <p id="studentName" className="text-2xl font-bold text-blue-300">—</p>
                </div>
              </div>

            </div>

            {/* ===== COLUMN 3: STATUS LOKET + DAFTAR TUNGGU (KANAN, DILIPAT SAAT OFFLINE) ===== */}
            <div id="rightSection" className="hidden w-80 flex flex-col border-l border-white/08 glass-card" style={{ minWidth: '320px', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>

              {/* Status semua loket */}
              <div className="flex-1 overflow-y-auto no-scroll p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30 mb-4">Status Loket</p>
                <div id="counterGrid" className="space-y-2">
                  {/* Diisi oleh JS */}
                </div>
              </div>

              {/* Daftar menunggu */}
              <div id="waitingSection" className="border-t p-5" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">Menunggu</p>
                  <span id="waitingCount" className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">0</span>
                </div>
                <div id="waitingList" className="flex flex-wrap gap-2 max-h-32 overflow-y-auto no-scroll">
                  <span className="text-white/20 text-xs">Tidak ada</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        <script src="/js/queue-display.js"></script>
      </body>
    </html>
  );
};
