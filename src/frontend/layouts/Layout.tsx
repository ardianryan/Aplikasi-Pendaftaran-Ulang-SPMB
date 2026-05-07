/** @jsxImportSource hono/jsx */
import { jsx } from 'hono/jsx';
import { html } from 'hono/html';

export const Layout = (props: { 
  title?: string; 
  children: any; 
  scripts?: any;
  appName?: string;
  appDescription?: string;
  schoolName?: string;
  settings?: Record<string, any>;
}) => {
  const appName = props.appName || 'SPMB';
  const appDescription = props.appDescription || 'Sistem Penerimaan Murid Baru';
  const schoolName = props.schoolName || 'SMAN 1 Gedeg';
  const appIcon = props.settings?.app_icon || '';

  return (
    <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{props.title ? `${props.title} - ${appName}` : `${appName} — ${appDescription}`}</title>
        <meta name="description" content={`${appDescription} di ${schoolName}`} />
        {props.settings?.app_icon ? (
          <link rel="icon" href={props.settings.app_icon} />
        ) : (
          <link rel="icon" href="/favicon.ico" />
        )}
        
        {/* Tailwind CSS via CDN */}
        <script src="https://cdn.tailwindcss.com"></script>
        
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700;800&family=Public+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
        
        {/* Tailwind Config */}
        <script dangerouslySetInnerHTML={{ __html: `
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: "#0A2540",
                  "primary-variant": "#1E3A8A",
                  secondary: "#38BDF8",
                  accent: "#F59E0B",
                  background: "#F0F4F8",
                  surface: "rgba(255, 255, 255, 0.8)",
                  "on-surface": "#1E293B",
                  "on-surface-variant": "#475569",
                  "on-primary": "#FFFFFF",
                },
                fontFamily: {
                  sans: ["Public Sans", "sans-serif"],
                  display: ["Lexend", "sans-serif"]
                },
                backgroundImage: {
                  'hero-gradient': 'linear-gradient(to bottom, rgba(10, 37, 64, 0.1), rgba(10, 37, 64, 0.9))',
                }
              }
            }
          }
        ` }} />

        {/* Material Symbols */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
        
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --primary: #0A2540;
            --primary-hover: #1E3A8A;
          }
          body {
            font-family: 'Public Sans', sans-serif;
            background-color: #F0F4F8;
            color: #1E293B;
          }
          .glass {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
          }
        ` }} />
        {/* Global API Client */}
        <script src="/js/api.js"></script>
        <script src="/js/ui.js"></script>
      </head>
      <body>
        <div id="app">
          {props.children}
        </div>
        
        {props.scripts}
      </body>
    </html>
  );
};
