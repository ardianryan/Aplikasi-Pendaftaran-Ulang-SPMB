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

  if (role === "operator") {
    // Hide admin-only menu items
    const adminOnlyPaths = [
      "/admin/import",
      "/admin/operators",
      "/admin/settings",
    ];

    // Hide sidebar links
    document.querySelectorAll("nav a, aside a, ul a").forEach((link) => {
      const href = link.getAttribute("href");
      if (href && adminOnlyPaths.some((p) => href.startsWith(p))) {
        link.style.display = "none";
      }
    });

    // Hide export links
    document.querySelectorAll('[id="exportLink"], [href="#export"]').forEach((el) => {
      el.style.display = "none";
    });

    // If operator is on a restricted page, redirect to dashboard
    const currentPath = window.location.pathname;
    if (adminOnlyPaths.some((p) => currentPath.startsWith(p))) {
      window.location.href = "/admin/dashboard";
    }
  }
});
