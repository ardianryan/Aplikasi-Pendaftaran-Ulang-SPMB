/**
 * Settings Loader
 * Fetches public settings and applies dynamic branding to the page.
 * Include this script on every page that needs dynamic school/app names.
 *
 * Usage in HTML:
 *   <span data-setting="school_name">SMAN 1 Gedeg</span>
 *   <span data-setting="app_name">SPMB</span>
 *   <title data-setting-title="app_name">Login - SPMB</title>
 *
 * The text content inside the element is the fallback (shown before settings load).
 */

(function () {
  "use strict";

  // Cache settings in sessionStorage to avoid re-fetching on every page
  const CACHE_KEY = "spmb_public_settings";
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async function loadSettings() {
    // Try cache first
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          applySettings(data);
          return;
        }
      } catch (e) {
        // Invalid cache, continue to fetch
      }
    }

    // Fetch from API
    try {
      const res = await fetch("/api/settings/public");
      const json = await res.json();
      if (json.success && json.data) {
        // Cache it
        sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data: json.data, timestamp: Date.now() })
        );
        applySettings(json.data);
      }
    } catch (e) {
      // Silent fail - fallback text remains visible
    }
  }

  function applySettings(settings) {
    if (!settings) return;

    // Replace all elements with data-setting="key"
    document.querySelectorAll("[data-setting]").forEach((el) => {
      const key = el.getAttribute("data-setting");
      if (key && settings[key] !== undefined && settings[key] !== "") {
        el.textContent = settings[key];
      }
    });

    // Replace title parts: data-setting-title="key"
    const titleEl = document.querySelector("title");
    if (titleEl && titleEl.dataset.settingTitle) {
      // Not used directly, but we update document.title
    }

    // Update page title if it contains placeholder patterns
    if (settings.school_name) {
      document.title = document.title
        .replace(/SMAN 1 Gedeg/g, settings.school_name)
        .replace(/SPMB/g, settings.app_name || "SPMB")
        .replace(/PPDB/g, settings.app_name || "SPMB");
    }

    // Update favicon if app_icon is set
    if (settings.app_icon) {
      let link = document.querySelector("link[rel='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = settings.app_icon;
    }

    // Update logo images with data-setting-logo
    if (settings.app_logo) {
      document.querySelectorAll("[data-setting-logo]").forEach((el) => {
        if (el.tagName === "IMG") {
          el.src = settings.app_logo;
          el.classList.remove("hidden");
        }
      });
      // Hide default icon if logo is set
      document.querySelectorAll("[data-setting-logo-fallback]").forEach((el) => {
        el.classList.add("hidden");
      });
    }

    // Store for other scripts to use
    window.__SPMB_SETTINGS = settings;
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadSettings);
  } else {
    loadSettings();
  }
})();
