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
      UI.toast("Gagal memuat data. Silakan login ulang.", "error");
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
      UI.toast(err.message || "Gagal mengkonfirmasi data.", "error");
    } finally {
      this.setButtonLoading("btn-confirm", false);
    }
  },

  // ============================================
  // Step 2: Biodata (Section Management)
  // ============================================
  
  currentSection: 'bio',

  async loadBiodata() {
    try {
      const res = await API.getBiodata();
      this.biodataData = res.data;
      this.populateBiodataForm(res.data);
      this.setupAutoSave();
      
      // Initialize Step 2 UI
      this.switchSection('bio');
      this.updateBiodataProgress();
    } catch (err) {
      UI.toast("Gagal memuat biodata.", "error");
    }
  },

  switchSection(sectionId) {
    this.currentSection = sectionId;
    
    // Hide all sections
    document.querySelectorAll('.biodata-section').forEach(el => el.classList.add('hidden'));
    
    // Show target section
    const target = document.getElementById(`sec-${sectionId}`);
    if (target) {
      target.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Update nav sidebar
    document.querySelectorAll('.sub-step').forEach(el => {
      el.classList.remove('bg-blue-50', 'text-blue-600', 'border-blue-200', 'border');
      el.querySelector('.sub-step-num').classList.replace('bg-blue-600', 'bg-slate-100');
      el.querySelector('.sub-step-num').classList.replace('text-white', 'text-slate-400');
    });

    const activeNav = document.getElementById(`nav-sec-${sectionId}`);
    if (activeNav) {
      activeNav.classList.add('bg-blue-50', 'text-blue-600', 'border-blue-100', 'border');
      activeNav.querySelector('.sub-step-num').classList.replace('bg-slate-100', 'bg-blue-600');
      activeNav.querySelector('.sub-step-num').classList.replace('text-slate-400', 'text-white');
    }
  },

  nextSection(currentId) {
    const sections = ['bio', 'alm', 'kes', 'pend', 'ayah', 'ibu', 'wali', 'gem'];
    const idx = sections.indexOf(currentId);
    if (idx < sections.length - 1) {
      this.switchSection(sections[idx + 1]);
    }
  },

  prevSection(currentId) {
    const sections = ['bio', 'alm', 'kes', 'pend', 'ayah', 'ibu', 'wali', 'gem'];
    const idx = sections.indexOf(currentId);
    if (idx > 0) {
      this.switchSection(sections[idx - 1]);
    }
  },

  updateBiodataProgress() {
    const sections = {
      bio: ['bio-namaPanggilan', 'bio-jenisKelamin', 'bio-tempatLahir', 'bio-nik', 'bio-agama', 'bio-anakKe'],
      alm: ['alm-alamatLengkap', 'alm-telepon', 'alm-email', 'alm-tinggalDengan'],
      kes: ['kes-golonganDarah', 'kes-tinggiBadan', 'kes-beratBadan'],
      pend: ['pend-nomorIjazah'],
      ayah: ['ayah-nama', 'ayah-status', 'ayah-pekerjaan'],
      ibu: ['ibu-nama', 'ibu-status', 'ibu-pekerjaan'],
      wali: [], // optional
      gem: ['gem-kesenian', 'gem-olahraga']
    };

    let totalFields = 0;
    let filledFields = 0;

    Object.keys(sections).forEach(secId => {
      const fields = sections[secId];
      let secFilled = true;
      
      fields.forEach(fId => {
        totalFields++;
        const val = this.getVal(fId);
        if (val && val.trim() !== '') {
          filledFields++;
        } else {
          secFilled = false;
        }
      });

      // Update sidebar checkmark
      const navEl = document.getElementById(`nav-sec-${secId}`);
      if (navEl) {
        const check = navEl.querySelector('.sub-step-check');
        if (fields.length > 0 && secFilled) {
          check.classList.replace('opacity-0', 'opacity-100');
        } else if (fields.length > 0) {
          check.classList.replace('opacity-100', 'opacity-0');
        }
      }
    });

    const pct = Math.round((filledFields / totalFields) * 100);
    const progressBar = document.getElementById('biodata-progress-bar');
    const progressPct = document.getElementById('biodata-progress-pct');
    
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (progressPct) progressPct.textContent = `${pct}%`;
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
    this.setVal("pend-kelas", p.kelas);

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

  setDatePicker(id, dateValue) {
    if (!dateValue) return;
    const dateStr = typeof dateValue === "string" ? dateValue : new Date(dateValue).toISOString();
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length !== 3) return;
    const [year, month, day] = parts;
    this.setVal(`${id}-hari`, day);
    this.setVal(`${id}-bulan`, month);
    this.setVal(`${id}-tahun`, year);
    this.setVal(id, `${year}-${month}-${day}`);
  },

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
        kelas: this.getVal("pend-kelas"),
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
    const form = document.getElementById("biodata-form");
    if (form) {
      const handleInput = () => {
        this.isDirty = true;
        this.updateBiodataProgress(); // Live update progress
        this.scheduleAutoSave();
      };
      form.addEventListener("input", handleInput);
      form.addEventListener("change", handleInput);
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
      if (showFeedback) UI.toast("Data berhasil disimpan.", "success");
    } catch (err) {
      if (showFeedback) UI.toast(err.message || "Gagal menyimpan data.", "error");
    }
  },

  async completeBiodataAndNext() {
    this.setButtonLoading("btn-biodata-next", true);
    const data = this.collectBiodataForm();
    try {
      await API.saveBiodata(data);
      this.isDirty = false;
    } catch (saveErr) {
      UI.toast(saveErr.message || "Gagal menyimpan data.", "error");
      this.setButtonLoading("btn-biodata-next", false);
      return;
    }

    try {
      await API.completeBiodata();
      this.goToStep(3);
    } catch (err) {
      if (err.errors && err.errors.length > 0) {
        UI.toast(`Data belum lengkap: ${err.errors[0].message}`, "error");
      } else {
        UI.toast(err.message || "Biodata belum lengkap.", "error");
      }
    } finally {
      this.setButtonLoading("btn-biodata-next", false);
    }
  },

  async loadUploadStatus() {
    try {
      const res = await API.getReview();
      const docs = res.data.dokumen || {};
      const studentJalur = this.studentData?.konfirmasi?.jalur || "all";
      const berkasSettings = window.WizardSettings?.landing_berkas_json || [];

      // Filter berkas based on active status and student's jalur
      this.activeBerkas = berkasSettings.filter(b => {
        if (!b.active) return false;
        if (!b.jalur || b.jalur.includes("all")) return true;
        return b.jalur.includes(studentJalur);
      });

      const container = document.getElementById("upload-zones-container");
      if (container) {
        container.innerHTML = "";
        this.activeBerkas.forEach(doc => {
          const zoneId = `upload-${doc.id}`;
          const col = document.createElement("div");
          col.className = "bg-white p-6 rounded-3xl border border-slate-200 shadow-sm";
          col.innerHTML = `
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-slate-800">${doc.title}</h3>
              ${doc.required ? '<span class="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg uppercase tracking-wider">Wajib</span>' : ""}
            </div>
            <div id="${zoneId}" class="min-h-[160px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 hover:border-blue-400 transition-colors cursor-pointer">
            </div>
          `;
          container.appendChild(col);

          if (docs[doc.id] && docs[doc.id].key) {
            this.setUploadSuccess(doc.id, docs[doc.id].originalName);
          } else {
            this.setUploadEmpty(doc.id, doc.title);
          }
        });
      }
      this.updateUploadNextButton();
    } catch (err) {
      UI.toast("Gagal memuat status dokumen.", "error");
    }
  },

  setUploadSuccess(docId, filename) {
    const zone = document.getElementById(`upload-${docId}`);
    if (!zone) return;
    zone.innerHTML = `
      <div class="flex items-center gap-4 p-4 w-full">
        <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-2xl">check_circle</span>
        </div>
        <div class="flex-1 min-w-0 text-left">
          <p class="text-sm font-bold text-slate-800 truncate">${filename}</p>
          <p class="text-xs text-emerald-600 font-medium">Berhasil diunggah</p>
        </div>
        <button onclick="Wizard.removeFile('${docId}')" class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </div>
    `;
    zone.onclick = null;
    zone.classList.remove("border-dashed", "hover:border-blue-400", "cursor-pointer");
    zone.classList.add("border-emerald-100", "bg-emerald-50/30");
  },

  setUploadEmpty(docId, label) {
    const zone = document.getElementById(`upload-${docId}`);
    if (!zone) return;
    
    // Find doc entry for title and max_size_mb
    const doc = (this.activeBerkas || []).find(b => b.id === docId);
    if(!label) {
       label = doc ? doc.title : docId;
    }
    const maxMB = doc?.max_size_mb || 5;

    zone.innerHTML = `
      <div class="flex flex-col items-center justify-center p-6 text-center w-full" onclick="document.getElementById('file-${docId}').click()">
        <div class="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
          <span class="material-symbols-outlined text-2xl">cloud_upload</span>
        </div>
        <p class="text-sm font-bold text-slate-700">${label}</p>
        <p class="text-xs text-slate-400 mt-1">PDF, JPG, PNG (maks ${maxMB}MB)</p>
      </div>
      <input type="file" id="file-${docId}" class="hidden" accept=".pdf,.jpg,.jpeg,.png" onchange="Wizard.handleFileSelect('${docId}', this)">
    `;
    zone.onclick = () => document.getElementById(`file-${docId}`).click();
    zone.classList.add("border-dashed", "hover:border-blue-400", "cursor-pointer");
    zone.classList.remove("border-emerald-100", "bg-emerald-50/30");
  },

  async handleFileSelect(docId, input) {
    const file = input.files[0];
    if (!file) return;
    const doc = (this.activeBerkas || []).find(b => b.id === docId);
    const maxMB = (doc?.max_size_mb) || 5;
    if (file.size > maxMB * 1024 * 1024) {
      UI.toast(`Ukuran file melebihi ${maxMB}MB untuk dokumen ini.`, 'error');
      input.value = '';
      return;
    }
    const zone = document.getElementById(`upload-${docId}`);
    zone.innerHTML = `
      <div class="flex flex-col items-center justify-center p-6 text-center w-full">
        <div class="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-3"></div>
        <p class="text-xs font-bold text-slate-500">Mengunggah ${file.name}...</p>
      </div>
    `;
    try {
      await API.uploadDocument(docId, file);
      this.setUploadSuccess(docId, file.name);
      UI.toast("Dokumen berhasil diunggah.", "success");
      this.updateUploadNextButton();
    } catch (err) {
      this.setUploadEmpty(docId);
      UI.toast(err.message || "Gagal mengunggah dokumen.", "error");
    }
  },

  async removeFile(docId) {
    if(!await UI.confirm('Hapus Dokumen?', 'Dokumen yang dihapus tidak dapat dikembalikan.')) return;
    try {
      await API.deleteDocument(docId);
      this.setUploadEmpty(docId);
      this.updateUploadNextButton();
      UI.toast("Dokumen berhasil dihapus.", "success");
    } catch (err) {
      UI.toast(err.message || "Gagal menghapus dokumen.", "error");
    }
  },

  updateUploadNextButton() {
    const allRequiredUploaded = (this.activeBerkas || []).every((doc) => {
      if (!doc.required) return true;
      const zone = document.getElementById(`upload-${doc.id}`);
      return zone && zone.classList.contains("bg-emerald-50/30");
    });
    const btn = document.getElementById("btn-upload-next");
    if (btn) btn.disabled = !allRequiredUploaded;
  },

  async loadReview() {
    try {
      const res = await API.getReview();
      const reviewContainer = document.getElementById("review-content");
      if (reviewContainer) reviewContainer.innerHTML = this.buildReviewHTML(res.data);
    } catch (err) {
      UI.toast("Gagal memuat data review.", "error");
    }
  },

  buildReviewHTML(d) {
    const b = d.biodata || {};
    const a = d.alamat || {};
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
          </dl>
        </div>
      </div>
    `;
  },

  async submitFinal() {
    const checkbox = document.getElementById("pernyataan-check");
    if (!checkbox || !checkbox.checked) {
      UI.toast("Anda harus menyetujui pernyataan integritas.", "error");
      return;
    }
    if (!await UI.confirm('Kirim Pendaftaran?', "Setelah dikirim, data tidak dapat diubah lagi. Pastikan semua isian sudah benar.")) return;
    try {
      this.setButtonLoading("btn-submit-final", true);
      await API.submitFinal();
      this.goToStep(5);
    } catch (err) {
      UI.toast(err.message || "Gagal mengirim data.", "error");
    } finally {
      this.setButtonLoading("btn-submit-final", false);
    }
  },

  async renderDone() {
    try {
      const res = await API.getReview();
      const status = res.data?.verifikasi?.status || "pending";
      const statusEl = document.getElementById("verification-status");
      if (statusEl) {
        if (status === "verified") {
          statusEl.className = "inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm";
          statusEl.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px">verified</span><span>Status: Terverifikasi</span>';
        } else if (status === "rejected") {
          statusEl.className = "inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm";
          statusEl.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px">cancel</span><span>Status: Ditolak</span>';
        }
      }
    } catch (e) {}
  },

  async downloadPdf() {
    try {
      this.setButtonLoading("btn-download-pdf", true);
      const blob = await API.downloadPdf();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Buku_Induk.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      UI.toast("Gagal mengunduh PDF.", "error");
    } finally {
      this.setButtonLoading("btn-download-pdf", false);
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
