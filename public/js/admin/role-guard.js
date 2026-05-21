/**
 * Role-based Menu Guard + Shared Admin Utilities
 * Hides admin-only menu items for operators.
 * Also provides global logout() function for sidebar.
 * Include this script on all admin pages.
 *
 * Operator can only see: Dashboard, Data Siswa, Verifikasi
 * Admin can see all menus
 */

// Global logout function (used by sidebar onclick)
function logout() {
  localStorage.removeItem("spmb_token");
  localStorage.removeItem("spmb_admin");
  window.location.href = "/admin/login";
}

document.addEventListener("DOMContentLoaded", function () {
  const admin = JSON.parse(localStorage.getItem("spmb_admin") || "{}");
  const role = admin.role || "operator";

  // Global helper to check settings and apply permissions
  async function loadAndApplyPermissions() {
    let settings = null;
    try {
      const cached = sessionStorage.getItem("spmb_admin_settings");
      if (cached) {
        settings = JSON.parse(cached);
      } else {
        const res = await API.request("/admin/settings");
        settings = {};
        for (const [k, v] of Object.entries(res.data || {})) {
          settings[k] = v.value;
        }
        sessionStorage.setItem("spmb_admin_settings", JSON.stringify(settings));
      }
    } catch (err) {
      console.error("Gagal memuat izin operator:", err);
      // Fallback defaults
      settings = {
        operator_can_verify: true,
        operator_can_edit_student: true,
        operator_can_delete_student: false,
        operator_can_whatsapp: false,
        operator_can_manage_queue: true
      };
    }

    window.__SPMB_ADMIN_SETTINGS = settings;

    // Trigger custom event so other page scripts know settings are ready
    document.dispatchEvent(new CustomEvent("spmb_settings_ready", { detail: settings }));

    if (role === "operator") {
      // Pages restricted based on database settings
      const restrictedPaths = [];
      if (settings.operator_can_whatsapp === false) {
        restrictedPaths.push("/admin/whatsapp");
      }
      if (settings.operator_can_manage_queue === false) {
        restrictedPaths.push("/admin/queue");
      }

      // Static admin-only paths that are always restricted for operators
      const adminOnlyPaths = [
        "/admin/import",
        "/admin/operators",
        "/admin/settings",
      ];

      const allRestrictedPaths = [...adminOnlyPaths, ...restrictedPaths];

      // Hide sidebar links
      document.querySelectorAll("nav a, aside a, ul a").forEach((link) => {
        const href = link.getAttribute("href");
        if (href && allRestrictedPaths.some((p) => href.startsWith(p))) {
          link.style.display = "none";
        }
      });

      // Hide entire accordion details element for WhatsApp and Queue if completely disabled
      if (settings.operator_can_whatsapp === false) {
        document.querySelectorAll("details").forEach((details) => {
          const summary = details.querySelector("summary");
          if (summary && summary.textContent.includes("WhatsApp")) {
            details.style.display = "none";
          }
        });
      }

      if (settings.operator_can_manage_queue === false) {
        document.querySelectorAll("details").forEach((details) => {
          const summary = details.querySelector("summary");
          if (summary && summary.textContent.includes("Antrean")) {
            details.style.display = "none";
          }
        });
      }

      // Hide export links
      document.querySelectorAll('[id="exportLink"], [href="#export"]').forEach((el) => {
        el.style.display = "none";
      });

      // If operator is on a restricted page, redirect to dashboard
      const currentPath = window.location.pathname;
      if (allRestrictedPaths.some((p) => currentPath.startsWith(p))) {
        window.location.href = "/admin/dashboard";
      }
    }
  }

  // Only check if logged in
  if (localStorage.getItem("spmb_token")) {
    loadAndApplyPermissions();
  }
});
