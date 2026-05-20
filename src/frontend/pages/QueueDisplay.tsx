/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';

/**
 * QueueDisplay — Halaman display antrian publik
 * Untuk TV sekolah dan akses siswa dari rumah
 * TIDAK memerlukan login, TIDAK ada sidebar admin
 */
export const QueueDisplay = (props: any) => {
  const settings = props.settings || {};
  const appName = settings.app_name || 'SPMB';
  const schoolName = settings.school_name || 'SMAN 1 Gedeg';
  const displayTitle = settings.queue_display_title || 'Antrian Verifikasi SPMB';
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
          }
          .font-mono-display { font-family: 'JetBrains Mono', monospace; }

          /* Animasi flash saat nomor baru dipanggil */
          @keyframes flashPulse {
            0%   { background: #0a0f1e; box-shadow: none; }
            20%  { background: #1a3a6b; box-shadow: 0 0 80px 20px rgba(59, 130, 246, 0.6); }
            40%  { background: #0a0f1e; box-shadow: none; }
            60%  { background: #1a3a6b; box-shadow: 0 0 80px 20px rgba(59, 130, 246, 0.6); }
            100% { background: #0a0f1e; box-shadow: none; }
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
      <body>
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
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <span id="sseIndicator" className="w-2 h-2 rounded-full bg-gray-500"></span>
                <span id="sseStatus" className="text-white/40">Memuat...</span>
              </div>
            </div>
          </header>

          {/* ===== SESSION OFFLINE STATE ===== */}
          <div id="offlineState" class="hidden flex-1 flex flex-col items-center justify-center gap-6">
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              🏫
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white/60 mb-2">Belum Ada Sesi Antrian</p>
              <p className="text-white/30 text-sm">Sesi antrian akan dimulai oleh petugas</p>
            </div>
            <div className="ticker-pulse flex items-center gap-2 text-white/20 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
              Menunggu sesi dimulai...
            </div>
          </div>

          {/* ===== MAIN CONTENT (aktif saat ada sesi) ===== */}
          <div id="activeState" class="hidden flex-1 flex overflow-hidden">

            {/* ===== LEFT: NOMOR DIPANGGIL ===== */}
            <div id="mainDisplay" className="flex-1 flex flex-col items-center justify-center px-8 gap-6 transition-all">
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

            {/* ===== RIGHT: STATUS LOKET + DAFTAR TUNGGU ===== */}
            <div className="w-80 flex flex-col border-l border-white/08 glass-card" style={{ minWidth: '320px', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>

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
