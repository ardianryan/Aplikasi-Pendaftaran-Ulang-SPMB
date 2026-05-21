// Prevent double declaration
if (typeof window.API === 'undefined') {
  window.API = {
  baseUrl: "/api",

  /**
   * Get stored JWT token
   */
  getToken() {
    return localStorage.getItem("spmb_token");
  },

  /**
   * Store JWT token
   */
  setToken(token) {
    localStorage.setItem("spmb_token", token);
  },

  /**
   * Remove JWT token (logout)
   */
  clearToken() {
    localStorage.removeItem("spmb_token");
    localStorage.removeItem("spmb_student");
    localStorage.removeItem("spmb_selected_counter_id");
    localStorage.removeItem("spmb_selected_counter_name");
  },

  /**
   * Get stored student data
   */
  getStudent() {
    const data = localStorage.getItem("spmb_student");
    return data ? JSON.parse(data) : null;
  },

  /**
   * Store student data
   */
  setStudent(student) {
    localStorage.setItem("spmb_student", JSON.stringify(student));
  },

  /**
   * Make an authenticated API request
   * @param {string} endpoint - API path (e.g., "/auth/login")
   * @param {object} options - Fetch options
   * @returns {Promise<object>} Parsed JSON response
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers = {
      ...(options.headers || {}),
    };

    // Add auth header if token exists
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Add content-type for JSON bodies (not for FormData)
    if (options.body && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 - redirect to login
      if (response.status === 401) {
        this.clearToken();
        if (!window.location.pathname.includes("login")) {
          const isAdmin = window.location.pathname.startsWith("/admin");
          window.location.href = isAdmin ? "/admin/login" : "/login";
        }
        const data = await response.json();
        throw new Error(data.message || "Sesi telah berakhir");
      }

      // Parse response
      const data = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          message: data.message || "Terjadi kesalahan",
          errors: data.errors || [],
        };
      }

      return data;
    } catch (err) {
      if (err.status) throw err; // Re-throw API errors
      throw { status: 0, message: err.message || "Koneksi gagal" };
    }
  },

  // ============================================
  // Auth Endpoints
  // ============================================

  async login(nisn, tanggalLahir) {
    const data = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ nisn, tanggalLahir }),
    });
    this.setToken(data.data.token);
    this.setStudent(data.data.student);
    return data;
  },

  async adminLogin(username, password) {
    const data = await this.request("/auth/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.data.token);
    localStorage.setItem("spmb_admin", JSON.stringify(data.data.admin));
    return data;
  },

  // ============================================
  // Student Endpoints
  // ============================================

  async getProfile() {
    return this.request("/student/profile");
  },

  async confirmData() {
    return this.request("/student/confirm", { method: "POST" });
  },

  async getBiodata() {
    return this.request("/student/biodata");
  },

  async saveBiodata(data) {
    return this.request("/student/biodata", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async completeBiodata() {
    return this.request("/student/biodata/complete", { method: "POST" });
  },

  async uploadDocument(docType, file) {
    const formData = new FormData();
    formData.append("file", file);
    return this.request(`/upload/${docType}`, {
      method: "POST",
      body: formData,
    });
  },

  async deleteDocument(docType) {
    return this.request(`/upload/${docType}`, { method: "DELETE" });
  },

  async getReview() {
    return this.request("/student/review");
  },

  async submitFinal() {
    return this.request("/student/submit", { method: "POST" });
  },

  async downloadPdf() {
    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}/student/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Gagal mengunduh PDF");
    return response.blob();
  },

  // ============================================
  // Public Settings (no auth required)
  // ============================================

  async getPublicSettings() {
    const res = await fetch(`${this.baseUrl}/settings/public`);
    const data = await res.json();
    return data.data || {};
  },

  /**
   * Fetch jalur options from actual student data and populate a <select> element
   * @param {string} selectId - ID of the <select> element
   */
  async populateJalurOptions(selectId) {
    try {
      const res = await fetch(`${this.baseUrl}/jalur-options`);
      const json = await res.json();
      const options = json.data || [];
      const select = document.getElementById(selectId);
      if (!select) return;
      
      // Clear existing options (keep the first one like "Semua Jalur")
      while (select.options.length > 1) {
        select.remove(1);
      }

      options.forEach(jalur => {
        const opt = document.createElement('option');
        opt.value = jalur;
        opt.textContent = jalur;
        select.appendChild(opt);
      });
    } catch (e) {
      // Silent fail
    }
  },

  // ============================================
  // Utility
  // ============================================

  logout() {
    this.clearToken();
    localStorage.removeItem("spmb_admin");
    const isAdmin = window.location.pathname.startsWith("/admin");
    window.location.href = isAdmin ? "/admin/login" : "/login";
  },

  isLoggedIn() {
    return !!this.getToken();
  },
};
}
