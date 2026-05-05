/**
 * Wizard State Machine
 * Manages the multi-step registration flow (Steps 1-5)
 * Handles navigation, auto-save, validation, and UI updates
 */

const Wizard = {
  currentStep: 1,
  studentData: null,
  biodataData: null,
  autoSaveTimer: null,
  isDirty: false,

  // ============================================
  // Initialization
  // ============================================

  async init() {
    // Check auth
    if (!API.isLoggedIn()) {
      window.location.href = "/login";
      return;
    }

    // Load student profile
    try {
      const res = await API.getProfile();
      this.studentData = res.data;

      // If already submitted, go to DONE
      if (this.studentData.isSubmitted) {
        this.goToStep(5);
        return;
      }

      // Resume from last step
      this.goToStep(this.studentData.wizardStep || 1);
    } catch (err) {
      this.showToast("Gagal memuat data. Silakan login ulang.", "error");
      setTimeout(() => API.logout(), 2000);
    }
  },

  // ============================================
  // Step Navigation
  // ============================================

  goToStep(step) {
    // Save current biodata before leaving step 2
    if (this.currentStep === 2 && this.isDirty) {
      this.saveBiodata(false); // silent save
    }

    this.currentStep = step;
    this.updateUI();
    this.loadStepData(step);

    // Update URL without reload (for back button)
    history.replaceState({ step }, "", `#step-${step}`);

    // Focus management (WCAG)
    setTimeout(() => {
      const stepSection = document.getElementById(`step-${step}`);
      if (stepSection) {
        const heading = stepSection.querySelector("h2, h3");
        if (heading) heading.focus();
      }
    }, 100);
  },

  updateUI() {
    // Hide all steps
    document.querySelectorAll(".wizard-step").forEach((el) => {
      el.classList.add("hidden");
      el.setAttribute("aria-hidden", "true");
    });

    // Show current step
    const current = document.getElementById(`step-${this.currentStep}`);
    if (current) {
      current.classList.remove("hidden");
      current.setAttribute("aria-hidden", "false");
    }

    // Update progress bar
    const progress = ((this.currentStep - 1) / 4) * 100;
    const progressBar = document.getElementById("progress-fill");
    const progressText = document.getElementById("progress-text");
    const stepLabel = document.getElementById("step-label");

    if (progressBar) {
      progressBar.style.width = `${progress}%`;
      progressBar.setAttribute("aria-valuenow", this.currentStep);
    }
    if (progressText) {
      progressText.textContent = `Langkah ${this.currentStep} dari 5`;
    }

    const labels = ["Konfirmasi", "Biodata", "Berkas", "Review", "Selesai"];
    if (stepLabel) {
      stepLabel.textContent = labels[this.currentStep - 1] || "";
    }

    // Update sidebar steps (desktop)
    document.querySelectorAll(".sidebar-step").forEach((el) => {
      const stepNum = parseInt(el.dataset.step);
      el.classList.remove("active", "completed");
      if (stepNum < this.currentStep) el.classList.add("completed");
      if (stepNum === this.currentStep) el.classList.add("active");
      el.setAttribute("aria-current", stepNum === this.currentStep ? "step" : "false");
    });
  },

  // ============================================
  // Step Data Loading
  // ============================================

  async loadStepData(step) {
    switch (step) {
      case 1:
        this.renderConfirmation();
        break;
      case 2:
        await this.loadBiodata();
        break;
      case 3:
        await this.loadUploadStatus();
        break;
      case 4:
        await this.loadReview();
        break;
      case 5:
        this.renderDone();
        break;
    }
  },

  // ============================================
  // Step 1: Confirmation
  // ============================================

  renderConfirmation() {
    const s = this.studentData;
    if (!s) return;

    document.getElementById("confirm-nama").textContent = s.nama || "-";
    document.getElementById("confirm-nisn").textContent = s.nisn || "-";
    document.getElementById("confirm-tgl").textContent = s.tanggalLahir
      ? new Date(s.tanggalLahir).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "-";
    document.getElementById("confirm-smp").textContent = s.asalSmp || "-";
    document.getElementById("confirm-jalur").textContent = s.jalur || "-";
  },

  async confirmAndNext() {
    try {
      this.setButtonLoading("btn-confirm", true);
      await API.confirmData();
      this.goToStep(2);
    } catch (err) {
      this.showToast(err.message || "Gagal mengkonfirmasi data.", "error");
    } finally {
      this.setButtonLoading("btn-confirm", false);
    }
  },

  // ============================================
  // Step 2: Biodata (with Accordion)
  // ============================================

  async loadBiodata() {
    try {
      const res = await API.getBiodata();
      this.biodataData = res.data;
      this.populateBiodataForm(res.data);
      this.setupAutoSave();
    } catch (err) {
      this.showToast("Gagal memuat biodata.", "error");
    }
  },

  populateBiodataForm(data) {
    if (!data) return;

    // Section A: Biodata
    const b = data.biodata || {};
    this.setVal("bio-namaLengkap", b.namaLengkap);
    this.setVal("bio-namaPanggilan", b.namaPanggilan);
    this.setVal("bio-jenisKelamin", b.jenisKelamin);
    this.setVal("bio-tempatLahir", b.tempatLahir);
    this.setDatePicker("bio-tanggalLahir", b.tanggalLahir);
    this.setVal("bio-agama", b.agama);
    this.setVal("bio-kewarganegaraan", b.kewarganegaraan || "WNI");
    this.setVal("bio-nik", b.nik);
    this.setVal("bio-anakKe", b.anakKe);
    this.setVal("bio-jumlahSaudara", b.jumlahSaudara);
    this.setVal("bio-saudaraKandung", b.saudaraKandung);
    this.setVal("bio-saudaraTiri", b.saudaraTiri);
    this.setVal("bio-saudaraAngkat", b.saudaraAngkat);
    this.setVal("bio-statusYatim", b.statusYatim);
    this.setVal("bio-bahasaSehari", b.bahasaSehari);

    // Section B: Alamat
    const a = data.alamat || {};
    this.setVal("alm-alamatLengkap", a.alamatLengkap);
    this.setVal("alm-telepon", a.telepon);
    this.setVal("alm-email", a.email);
    this.setVal("alm-tinggalDengan", a.tinggalDengan);
    this.setVal("alm-jarakSekolah", a.jarakSekolah);
    this.setVal("alm-transportasi", a.transportasi);

    // Section C: Kesehatan
    const k = data.kesehatan || {};
    this.setVal("kes-golonganDarah", k.golonganDarah);
    this.setVal("kes-penyakit", k.penyakit);
    this.setVal("kes-kelainanJasmani", k.kelainanJasmani);
    this.setVal("kes-tinggiBadan", k.tinggiBadan);
    this.setVal("kes-beratBadan", k.beratBadan);

    // Section D: Pendidikan
    const p = data.pendidikan || {};
    this.setVal("pend-asalSekolah", p.asalSekolah);
    this.setVal("pend-nomorIjazah", p.nomorIjazah);
    this.setVal("pend-lamaBelajar", p.lamaBelajar);

    // Section E: Ayah
    this.populateOrangTua("ayah", data.ayah || {});

    // Section F: Ibu
    this.populateOrangTua("ibu", data.ibu || {});

    // Section G: Wali
    this.populateOrangTua("wali", data.wali || {});

    // Section H: Kegemaran
    const kg = data.kegemaran || {};
    this.setVal("gem-kesenian", kg.kesenian);
    this.setVal("gem-olahraga", kg.olahraga);
    this.setVal("gem-organisasi", kg.organisasi);
    this.setVal("gem-lainLain", kg.lainLain);
  },

  populateOrangTua(prefix, data) {
    this.setVal(`${prefix}-nama`, data.nama);
    this.setVal(`${prefix}-tempatLahir`, data.tempatLahir);
    this.setDatePicker(`${prefix}-tanggalLahir`, data.tanggalLahir);
    this.setVal(`${prefix}-agama`, data.agama);
    this.setVal(`${prefix}-kewarganegaraan`, data.kewarganegaraan);
    this.setVal(`${prefix}-pendidikan`, data.pendidikan);
    this.setVal(`${prefix}-pekerjaan`, data.pekerjaan);
    this.setVal(`${prefix}-penghasilan`, data.penghasilan);
    this.setVal(`${prefix}-email`, data.email);
    this.setVal(`${prefix}-alamat`, data.alamat);
    this.setVal(`${prefix}-telepon`, data.telepon);
    this.setVal(`${prefix}-status`, data.status);
  },

  setVal(id, value) {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null) {
      el.value = value;
    }
  },

  /**
   * Set a date picker (DD / Bulan / YYYY) from an ISO date string
   * Elements: {id}-hari, {id}-bulan, {id}-tahun, {id} (hidden)
   */
  setDatePicker(id, dateValue) {
    if (!dateValue) return;
    const dateStr = typeof dateValue === "string" ? dateValue : new Date(dateValue).toISOString();
    const parts = dateStr.split("T")[0].split("-"); // YYYY-MM-DD
    if (parts.length !== 3) return;

    const [year, month, day] = parts;
    this.setVal(`${id}-hari`, day);
    this.setVal(`${id}-bulan`, month);
    this.setVal(`${id}-tahun`, year);
    // Also set hidden field
    this.setVal(id, `${year}-${month}-${day}`);
  },

  /**
   * Get date value from a date picker (DD / Bulan / YYYY) as YYYY-MM-DD or null
   */
  getDatePicker(id) {
    const hari = this.getVal(`${id}-hari`).trim();
    const bulan = this.getVal(`${id}-bulan`);
    const tahun = this.getVal(`${id}-tahun`).trim();

    if (!hari || !bulan || !tahun || tahun.length < 4) return null;
    return `${tahun}-${bulan}-${hari.padStart(2, "0")}`;
  },

  getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : "";
  },

  getNumVal(id) {
    const el = document.getElementById(id);
    if (!el || el.value === "") return null;
    const num = parseInt(el.value);
    return isNaN(num) ? null : num;
  },

  collectBiodataForm() {
    return {
      biodata: {
        namaLengkap: this.getVal("bio-namaLengkap"),
        namaPanggilan: this.getVal("bio-namaPanggilan"),
        jenisKelamin: this.getVal("bio-jenisKelamin"),
        tempatLahir: this.getVal("bio-tempatLahir"),
        tanggalLahir: this.getDatePicker("bio-tanggalLahir") || this.getVal("bio-tanggalLahir"),
        agama: this.getVal("bio-agama"),
        kewarganegaraan: this.getVal("bio-kewarganegaraan"),
        nik: this.getVal("bio-nik"),
        anakKe: this.getNumVal("bio-anakKe"),
        jumlahSaudara: this.getNumVal("bio-jumlahSaudara"),
        saudaraKandung: this.getNumVal("bio-saudaraKandung"),
        saudaraTiri: this.getNumVal("bio-saudaraTiri"),
        saudaraAngkat: this.getNumVal("bio-saudaraAngkat"),
        statusYatim: this.getVal("bio-statusYatim"),
        bahasaSehari: this.getVal("bio-bahasaSehari"),
      },
      alamat: {
        alamatLengkap: this.getVal("alm-alamatLengkap"),
        telepon: this.getVal("alm-telepon"),
        email: this.getVal("alm-email"),
        tinggalDengan: this.getVal("alm-tinggalDengan"),
        jarakSekolah: this.getVal("alm-jarakSekolah"),
        transportasi: this.getVal("alm-transportasi"),
      },
      kesehatan: {
        golonganDarah: this.getVal("kes-golonganDarah"),
        penyakit: this.getVal("kes-penyakit"),
        kelainanJasmani: this.getVal("kes-kelainanJasmani"),
        tinggiBadan: this.getNumVal("kes-tinggiBadan"),
        beratBadan: this.getNumVal("kes-beratBadan"),
      },
      pendidikan: {
        asalSekolah: this.getVal("pend-asalSekolah"),
        nomorIjazah: this.getVal("pend-nomorIjazah"),
        lamaBelajar: this.getVal("pend-lamaBelajar"),
      },
      ayah: this.collectOrangTua("ayah"),
      ibu: this.collectOrangTua("ibu"),
      wali: this.collectOrangTua("wali"),
      kegemaran: {
        kesenian: this.getVal("gem-kesenian"),
        olahraga: this.getVal("gem-olahraga"),
        organisasi: this.getVal("gem-organisasi"),
        lainLain: this.getVal("gem-lainLain"),
      },
    };
  },

  collectOrangTua(prefix) {
    return {
      nama: this.getVal(`${prefix}-nama`),
      tempatLahir: this.getVal(`${prefix}-tempatLahir`),
      tanggalLahir: this.getDatePicker(`${prefix}-tanggalLahir`) || null,
      agama: this.getVal(`${prefix}-agama`),
      kewarganegaraan: this.getVal(`${prefix}-kewarganegaraan`),
      pendidikan: this.getVal(`${prefix}-pendidikan`),
      pekerjaan: this.getVal(`${prefix}-pekerjaan`),
      penghasilan: this.getVal(`${prefix}-penghasilan`),
      email: this.getVal(`${prefix}-email`),
      alamat: this.getVal(`${prefix}-alamat`),
      telepon: this.getVal(`${prefix}-telepon`),
      status: this.getVal(`${prefix}-status`),
    };
  },

  setupAutoSave() {
    // Mark form as dirty on any input change
    const form = document.getElementById("biodata-form");
    if (form) {
      form.addEventListener("input", () => {
        this.isDirty = true;
        this.scheduleAutoSave();
      });
      form.addEventListener("change", () => {
        this.isDirty = true;
        this.scheduleAutoSave();
      });
    }
  },

  scheduleAutoSave() {
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => this.saveBiodata(false), 3000);
  },

  async saveBiodata(showFeedback = true) {
    if (!this.isDirty && !showFeedback) return;

    const data = this.collectBiodataForm();

    try {
      await API.saveBiodata(data);
      this.isDirty = false;
      if (showFeedback) {
        this.showToast("Data berhasil disimpan.", "success");
      }
    } catch (err) {
      if (showFeedback) {
        this.showToast(err.message || "Gagal menyimpan data.", "error");
      }
    }
  },

  async completeBiodataAndNext() {
    this.setButtonLoading("btn-biodata-next", true);

    // ALWAYS save current form data before completing (ignore isDirty flag)
    const data = this.collectBiodataForm();
    try {
      await API.saveBiodata(data);
      this.isDirty = false;
    } catch (saveErr) {
      this.showToast(saveErr.message || "Gagal menyimpan data.", "error");
      this.setButtonLoading("btn-biodata-next", false);
      return;
    }

    // Now validate completeness on backend
    try {
      await API.completeBiodata();
      this.goToStep(3);
    } catch (err) {
      if (err.errors && err.errors.length > 0) {
        this.showToast(`Data belum lengkap: ${err.errors[0].message}`, "error");
      } else {
        this.showToast(err.message || "Biodata belum lengkap.", "error");
      }
    } finally {
      this.setButtonLoading("btn-biodata-next", false);
    }
  },

  // ============================================
  // Step 3: Upload
  // ============================================

  async loadUploadStatus() {
    try {
      const res = await API.getReview();
      const docs = res.data.dokumen || {};

      ["kartuKeluarga", "ijazahSkl", "aktaKelahiran", "foto4x6"].forEach((type) => {
        const zone = document.getElementById(`upload-${type}`);
        if (!zone) return;

        if (docs[type] && docs[type].key) {
          this.setUploadSuccess(type, docs[type].originalName);
        } else {
          this.setUploadEmpty(type);
        }
      });

      this.updateUploadNextButton();
    } catch (err) {
      this.showToast("Gagal memuat status dokumen.", "error");
    }
  },

  setUploadSuccess(type, filename) {
    const zone = document.getElementById(`upload-${type}`);
    if (!zone) return;

    zone.innerHTML = `
      <div class="flex items-center gap-3 p-4">
        <span class="material-symbols-outlined text-tertiary" style="font-variation-settings:'FILL' 1">check_circle</span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-on-surface truncate">${filename}</p>
          <p class="text-xs text-on-surface-variant">Berhasil diunggah</p>
        </div>
        <button onclick="Wizard.removeFile('${type}')" class="text-sm text-error font-medium hover:underline" aria-label="Hapus file ${filename}">Ganti</button>
      </div>
    `;
    zone.classList.remove("border-dashed");
    zone.classList.add("border-solid", "border-tertiary/50", "bg-tertiary-container/10");
  },

  setUploadEmpty(type) {
    const labels = {
      kartuKeluarga: "Kartu Keluarga",
      ijazahSkl: "Ijazah / SKL",
      aktaKelahiran: "Akta Kelahiran",
      foto4x6: "Pas Foto 4x6",
    };

    const zone = document.getElementById(`upload-${type}`);
    if (!zone) return;

    zone.innerHTML = `
      <div class="flex flex-col items-center justify-center p-6 text-center cursor-pointer" onclick="document.getElementById('file-${type}').click()">
        <span class="material-symbols-outlined text-on-surface-variant mb-2" style="font-size:36px">cloud_upload</span>
        <p class="text-sm font-medium text-on-surface">${labels[type]}</p>
        <p class="text-xs text-on-surface-variant mt-1">PDF, JPG, PNG (maks 5MB)</p>
      </div>
      <input type="file" id="file-${type}" class="hidden" accept=".pdf,.jpg,.jpeg,.png" onchange="Wizard.handleFileSelect('${type}', this)">
    `;
    zone.classList.add("border-dashed");
    zone.classList.remove("border-solid", "border-tertiary/50", "bg-tertiary-container/10");
  },

  async handleFileSelect(type, input) {
    const file = input.files[0];
    if (!file) return;

    // Validate size
    if (file.size > 5 * 1024 * 1024) {
      this.showToast("Ukuran file melebihi 5MB.", "error");
      return;
    }

    // Show uploading state
    const zone = document.getElementById(`upload-${type}`);
    zone.innerHTML = `
      <div class="flex items-center gap-3 p-4">
        <div class="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
        <p class="text-sm text-on-surface-variant">Mengunggah ${file.name}...</p>
      </div>
    `;

    try {
      const res = await API.uploadDocument(type, file);
      this.setUploadSuccess(type, file.name);
      this.showToast("Dokumen berhasil diunggah.", "success");
      this.updateUploadNextButton();
    } catch (err) {
      this.setUploadEmpty(type);
      this.showToast(err.message || "Gagal mengunggah dokumen.", "error");
    }
  },

  async removeFile(type) {
    try {
      await API.deleteDocument(type);
      this.setUploadEmpty(type);
      this.updateUploadNextButton();
    } catch (err) {
      this.showToast(err.message || "Gagal menghapus dokumen.", "error");
    }
  },

  updateUploadNextButton() {
    const allUploaded = ["kartuKeluarga", "ijazahSkl", "aktaKelahiran", "foto4x6"].every((type) => {
      const zone = document.getElementById(`upload-${type}`);
      return zone && zone.classList.contains("border-solid");
    });

    const btn = document.getElementById("btn-upload-next");
    if (btn) {
      btn.disabled = !allUploaded;
    }
  },

  // ============================================
  // Step 4: Review & Submit
  // ============================================

  async loadReview() {
    try {
      const res = await API.getReview();
      const d = res.data;

      // Populate review sections
      const reviewContainer = document.getElementById("review-content");
      if (reviewContainer) {
        reviewContainer.innerHTML = this.buildReviewHTML(d);
      }
    } catch (err) {
      this.showToast("Gagal memuat data review.", "error");
    }
  },

  buildReviewHTML(d) {
    const b = d.biodata || {};
    const a = d.alamat || {};
    const k = d.kesehatan || {};
    const p = d.pendidikan || {};

    return `
      <div class="space-y-4">
        <div class="bg-surface-container-low rounded-lg p-4">
          <h4 class="font-bold text-sm text-primary mb-3">Data Diri</h4>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div><dt class="text-on-surface-variant">Nama</dt><dd class="font-medium">${b.namaLengkap || "-"}</dd></div>
            <div><dt class="text-on-surface-variant">Jenis Kelamin</dt><dd class="font-medium">${b.jenisKelamin || "-"}</dd></div>
            <div><dt class="text-on-surface-variant">NIK</dt><dd class="font-medium">${b.nik || "-"}</dd></div>
            <div><dt class="text-on-surface-variant">Agama</dt><dd class="font-medium">${b.agama || "-"}</dd></div>
          </dl>
        </div>
        <div class="bg-surface-container-low rounded-lg p-4">
          <h4 class="font-bold text-sm text-primary mb-3">Alamat & Kontak</h4>
          <dl class="grid grid-cols-1 gap-2 text-sm">
            <div><dt class="text-on-surface-variant">Alamat</dt><dd class="font-medium">${a.alamatLengkap || "-"}</dd></div>
            <div><dt class="text-on-surface-variant">Telepon</dt><dd class="font-medium">${a.telepon || "-"}</dd></div>
            <div><dt class="text-on-surface-variant">Email</dt><dd class="font-medium">${a.email || "-"}</dd></div>
          </dl>
        </div>
        <div class="bg-surface-container-low rounded-lg p-4">
          <h4 class="font-bold text-sm text-primary mb-3">Orang Tua</h4>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div><dt class="text-on-surface-variant">Nama Ayah</dt><dd class="font-medium">${d.ayah?.nama || "-"}</dd></div>
            <div><dt class="text-on-surface-variant">Nama Ibu</dt><dd class="font-medium">${d.ibu?.nama || "-"}</dd></div>
          </dl>
        </div>
        <div class="bg-surface-container-low rounded-lg p-4">
          <h4 class="font-bold text-sm text-primary mb-3">Dokumen</h4>
          <ul class="space-y-1 text-sm">
            <li class="flex items-center gap-2">
              <span class="material-symbols-outlined text-tertiary" style="font-size:16px;font-variation-settings:'FILL' 1">check_circle</span>
              Kartu Keluarga: ${d.dokumen?.kartuKeluarga?.originalName || "Belum"}
            </li>
            <li class="flex items-center gap-2">
              <span class="material-symbols-outlined text-tertiary" style="font-size:16px;font-variation-settings:'FILL' 1">check_circle</span>
              Ijazah/SKL: ${d.dokumen?.ijazahSkl?.originalName || "Belum"}
            </li>
            <li class="flex items-center gap-2">
              <span class="material-symbols-outlined text-tertiary" style="font-size:16px;font-variation-settings:'FILL' 1">check_circle</span>
              Akta Kelahiran: ${d.dokumen?.aktaKelahiran?.originalName || "Belum"}
            </li>
            <li class="flex items-center gap-2">
              <span class="material-symbols-outlined text-tertiary" style="font-size:16px;font-variation-settings:'FILL' 1">check_circle</span>
              Pas Foto: ${d.dokumen?.foto4x6?.originalName || "Belum"}
            </li>
          </ul>
        </div>
      </div>
    `;
  },

  async submitFinal() {
    const checkbox = document.getElementById("pernyataan-check");
    if (!checkbox || !checkbox.checked) {
      this.showToast("Anda harus menyetujui pernyataan integritas.", "error");
      return;
    }

    if (!confirm("Apakah Anda yakin ingin mengirim data? Data tidak dapat diubah setelah dikirim.")) {
      return;
    }

    try {
      this.setButtonLoading("btn-submit-final", true);
      await API.submitFinal();
      this.goToStep(5);
    } catch (err) {
      this.showToast(err.message || "Gagal mengirim data.", "error");
    } finally {
      this.setButtonLoading("btn-submit-final", false);
    }
  },

  // ============================================
  // Step 5: Done
  // ============================================

  async renderDone() {
    // Update verification status badge
    try {
      const res = await API.getReview();
      const status = res.data?.verifikasi?.status || "pending";
      const statusEl = document.getElementById("verification-status");
      if (statusEl) {
        if (status === "verified") {
          statusEl.className = "inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 mb-8";
          statusEl.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px">verified</span><span>Status: Terverifikasi</span>';
        } else if (status === "rejected") {
          statusEl.className = "inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-8";
          statusEl.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px">cancel</span><span>Status: Ditolak — Hubungi panitia</span>';
        }
        // pending stays as default
      }
    } catch (e) {
      // Non-critical
    }
  },

  async downloadPdf() {
    try {
      this.setButtonLoading("btn-download-pdf", true);
      const blob = await API.downloadPdf();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Buku_Induk_${this.studentData?.nisn || "siswa"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      this.showToast("Gagal mengunduh PDF.", "error");
    } finally {
      this.setButtonLoading("btn-download-pdf", false);
    }
  },

  // ============================================
  // Accordion Toggle
  // ============================================

  toggleAccordion(id) {
    const content = document.getElementById(id);
    const icon = document.getElementById(`${id}-icon`);

    if (content.classList.contains("open")) {
      content.classList.remove("open");
      if (icon) icon.textContent = "expand_more";
    } else {
      content.classList.add("open");
      if (icon) icon.textContent = "expand_less";
    }
  },

  // ============================================
  // Utilities
  // ============================================

  setButtonLoading(id, loading) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.disabled = loading;
    const textEl = btn.querySelector(".btn-text");
    if (textEl) {
      textEl.textContent = loading ? "Memproses..." : textEl.dataset.original || textEl.textContent;
      if (!loading && !textEl.dataset.original) textEl.dataset.original = textEl.textContent;
    }
  },

  showToast(message, type = "info") {
    // Remove existing toast
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();

    const colors = {
      success: "bg-tertiary text-white",
      error: "bg-error text-white",
      info: "bg-primary text-white",
    };

    const toast = document.createElement("div");
    toast.className = `toast ${colors[type] || colors.info} px-5 py-3 rounded-lg shadow-lg max-w-sm text-sm font-medium`;
    toast.textContent = message;
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");
    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => toast.classList.add("show"));

    // Auto-remove after 4s
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },
};

// ============================================
// Initialize on page load
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  Wizard.init();
});

// Warn before leaving with unsaved changes
window.addEventListener("beforeunload", (e) => {
  if (Wizard.isDirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});
